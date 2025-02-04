const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const db = new sqlite3.Database("links.db");

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Create Table
db.run(`CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL
)`);

// Generate Short Code
const generateShortCode = () => {
    return Math.random().toString(36).substring(2, 8);
};

// Serve the Frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle URL Shortening
app.post("/shorten", (req, res) => {
    const { original_url } = req.body;
    db.get("SELECT short_code FROM urls WHERE original_url = ?", [original_url], (err, row) => {
        if (row) {
            res.send({ short_url: `${req.headers.host}/${row.short_code}` });
        } else {
            const shortCode = generateShortCode();
            db.run("INSERT INTO urls (original_url, short_code) VALUES (?, ?)", [original_url, shortCode], () => {
                res.send({ short_url: `${req.headers.host}/${shortCode}` });
            });
        }
    });
});

// Redirect Short URL to Original URL
app.get("/:short_code", (req, res) => {
    const { short_code } = req.params;
    db.get("SELECT original_url FROM urls WHERE short_code = ?", [short_code], (err, row) => {
        if (row) {
            res.redirect(row.original_url);
        } else {
            res.status(404).send("URL not found!");
        }
    });
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

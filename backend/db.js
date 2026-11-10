const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const db = new Database("business.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create the default admin once
if (!db.prepare("SELECT id FROM users WHERE username = ?").get("admin")) {
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(
    "admin",
    bcrypt.hashSync("password123", 10),
  );
}

module.exports = db;

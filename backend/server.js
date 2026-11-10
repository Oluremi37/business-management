require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

// ---------- Login ----------
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ error: "Username and password are required" });

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "4h",
  });
  res.json({ token, message: "Login successful" });
});

// ---------- Auth middleware ----------
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ---------- Validation ----------
const check = (b) => {
  if (!b.name || !b.name.trim()) return "Name is required";
  if (!b.email || !/^\S+@\S+\.\S+$/.test(b.email))
    return "A valid email is required";
  if (b.phone && !/^[0-9+\s-]{7,15}$/.test(b.phone))
    return "Phone number is invalid";
  if (b.status && !["active", "inactive"].includes(b.status))
    return "Status must be active or inactive";
  return null;
};

const getOne = (id) =>
  db.prepare("SELECT * FROM customers WHERE id = ?").get(id);

// ---------- Dashboard stats ----------
app.get("/api/stats", auth, (req, res) => {
  const count = (sql) => db.prepare(sql).get().c;
  res.json({
    total: count("SELECT COUNT(*) AS c FROM customers"),
    active: count(
      "SELECT COUNT(*) AS c FROM customers WHERE status = 'active'",
    ),
    inactive: count(
      "SELECT COUNT(*) AS c FROM customers WHERE status = 'inactive'",
    ),
    newThisMonth: count(
      "SELECT COUNT(*) AS c FROM customers WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')",
    ),
  });
});

// ---------- Customers ----------
app.get("/api/customers", auth, (req, res) => {
  const search = req.query.search || "";
  const rows = db
    .prepare(
      "SELECT * FROM customers WHERE name LIKE ? ORDER BY created_at DESC, id DESC",
    )
    .all(`%${search}%`);
  res.json(rows);
});

app.post("/api/customers", auth, (req, res) => {
  const err = check(req.body);
  if (err) return res.status(400).json({ error: err });

  const { name, email, phone, status = "active" } = req.body;
  try {
    const result = db
      .prepare(
        "INSERT INTO customers (name, email, phone, status) VALUES (?, ?, ?, ?)",
      )
      .run(name.trim(), email.toLowerCase(), phone || null, status);
    res.status(201).json(getOne(result.lastInsertRowid));
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE")
      return res
        .status(409)
        .json({ error: "A customer with this email already exists" });
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/customers/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id))
    return res.status(400).json({ error: "Invalid id" });

  const err = check(req.body);
  if (err) return res.status(400).json({ error: err });

  const { name, email, phone, status = "active" } = req.body;
  try {
    const result = db
      .prepare(
        "UPDATE customers SET name = ?, email = ?, phone = ?, status = ? WHERE id = ?",
      )
      .run(name.trim(), email.toLowerCase(), phone || null, status, id);
    if (result.changes === 0)
      return res.status(404).json({ error: "Customer not found" });
    res.json(getOne(id));
  } catch (e) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE")
      return res
        .status(409)
        .json({ error: "A customer with this email already exists" });
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/customers/:id", auth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id))
    return res.status(400).json({ error: "Invalid id" });

  const result = db.prepare("DELETE FROM customers WHERE id = ?").run(id);
  if (result.changes === 0)
    return res.status(404).json({ error: "Customer not found" });
  res.json({ message: "Customer deleted" });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);

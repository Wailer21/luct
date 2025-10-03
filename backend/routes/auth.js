const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

// Register
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'email, password, role required' });
    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(400).json({ error: 'Email already registered' });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const [r] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
    const role_id = r.length ? r[0].id : 1;
    const [result] = await pool.query('INSERT INTO users (role_id, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [role_id, first_name || '', last_name || '', email, hash]);
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT u.id, u.email, u.password_hash, r.name AS role FROM users u JOIN roles r ON u.role_id = r.id WHERE email = ?', [email]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

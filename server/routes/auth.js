// Jasper Careless - Phase 1: Authentication routes (signup, login, logout)
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).send('All fields are required.');
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.trim().toLowerCase(), username.trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(400).send('Username or email is already taken.');
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username.trim(), email.trim().toLowerCase(), hash]
    );

    req.session.userId = result.rows[0].id;
    res.redirect('/index.html');
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send('Email and password are required.');
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email.trim().toLowerCase(),
    ]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).send('Invalid email or password.');
    }

    req.session.userId = user.id;
    res.redirect('/index.html');
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.json({ user: null });
    }
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [req.session.userId]
    );
    res.json({ user: result.rows[0] || null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
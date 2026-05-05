const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

const router = express.Router()
// JWT_SECRET: the fallback is only reached in development since index.js exits
// in production if the env var is missing. Never deploy without setting JWT_SECRET.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret'
const JWT_EXPIRES_IN = '90d'
const BCRYPT_ROUNDS = 12

function signToken(username) {
  return jwt.sign({ sub: username.toLowerCase() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, highlights, wpm } = req.body ?? {}

  if (!username || typeof username !== 'string' || username.trim().length < 2) {
    return res.status(400).json({ error: 'שם משתמש חייב להכיל לפחות 2 תווים' })
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' })
  }

  const trimmed = username.trim().toLowerCase()
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(trimmed)
  if (existing) {
    return res.status(409).json({ error: 'exists' })
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const highlightsJson = JSON.stringify(Array.isArray(highlights) ? highlights : [])
  const safewpm = Number.isFinite(Number(wpm)) ? Number(wpm) : 75

  db.prepare(
    'INSERT INTO users (username, password_hash, highlights, wpm) VALUES (?, ?, ?, ?)'
  ).run(trimmed, hash, highlightsJson, safewpm)

  const token = signToken(trimmed)
  return res.status(201).json({ token, username: trimmed, highlights: JSON.parse(highlightsJson), wpm: safewpm, position: null })
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {}
  if (!username || !password) {
    return res.status(400).json({ error: 'שם משתמש וסיסמה נדרשים' })
  }

  const trimmed = username.trim().toLowerCase()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(trimmed)
  if (!user) return res.status(401).json({ error: 'wrong_credentials' })

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) return res.status(401).json({ error: 'wrong_credentials' })

  const token = signToken(trimmed)
  const highlights = JSON.parse(user.highlights ?? '[]')
  const position = user.position ? JSON.parse(user.position) : null
  return res.json({ token, username: trimmed, highlights, wpm: user.wpm, position })
})

// GET /api/auth/me  (requires Authorization: Bearer <token>)
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.username)
  if (!user) return res.status(404).json({ error: 'not_found' })
  const highlights = JSON.parse(user.highlights ?? '[]')
  const position = user.position ? JSON.parse(user.position) : null
  return res.json({ username: req.username, highlights, wpm: user.wpm, position })
})

// ── middleware ─────────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const auth = req.headers['authorization']
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.username = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'invalid_token' })
  }
}

module.exports = { router, requireAuth }

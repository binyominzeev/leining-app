const express = require('express')
const db = require('../db')
const { requireAuth } = require('./auth')

const router = express.Router()

// GET /api/user/data
router.get('/data', requireAuth, (req, res) => {
  const user = db.prepare('SELECT highlights, wpm, position FROM users WHERE username = ?').get(req.username)
  if (!user) return res.status(404).json({ error: 'not_found' })
  const highlights = JSON.parse(user.highlights ?? '[]')
  const position = user.position ? JSON.parse(user.position) : null
  return res.json({ highlights, wpm: user.wpm, position })
})

// PUT /api/user/data
router.put('/data', requireAuth, (req, res) => {
  const { highlights, wpm, position } = req.body ?? {}

  /** @type {{ col: 'highlights'|'wpm'|'position', value: unknown }[]} */
  const fields = []

  if (Array.isArray(highlights)) {
    fields.push({ col: 'highlights', value: JSON.stringify(highlights) })
  }
  if (Number.isFinite(Number(wpm))) {
    fields.push({ col: 'wpm', value: Number(wpm) })
  }
  if (position !== undefined) {
    fields.push({ col: 'position', value: position === null ? null : JSON.stringify(position) })
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'no_data' })
  }

  // Build parameterised SET clause using only the validated column names
  const setClauses = fields.map(({ col }) => `${col} = ?`).join(', ')
  const params = [...fields.map(({ value }) => value), req.username]

  db.prepare(`UPDATE users SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE username = ?`).run(...params)
  return res.json({ ok: true })
})

module.exports = router

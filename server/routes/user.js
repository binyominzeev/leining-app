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

  const updates = []
  const params = []

  if (Array.isArray(highlights)) {
    updates.push('highlights = ?')
    params.push(JSON.stringify(highlights))
  }
  if (Number.isFinite(Number(wpm))) {
    updates.push('wpm = ?')
    params.push(Number(wpm))
  }
  if (position !== undefined) {
    updates.push('position = ?')
    params.push(position === null ? null : JSON.stringify(position))
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'no_data' })
  }

  updates.push('updated_at = CURRENT_TIMESTAMP')
  params.push(req.username)

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`).run(...params)
  return res.json({ ok: true })
})

module.exports = router

const express = require('express')
const db = require('../db')
const { requireAuth } = require('./auth')

const router = express.Router()
router.use(requireAuth)

function readData(subject) {
  const row = db.prepare('SELECT highlights, wpm, position FROM oidc_user_data WHERE subject = ?').get(subject)
  return row
    ? { highlights: JSON.parse(row.highlights), wpm: row.wpm, position: row.position ? JSON.parse(row.position) : null }
    : { highlights: [], wpm: 75, position: null }
}

function validPosition(position) {
  return position === null || (position && typeof position === 'object' &&
    typeof position.book === 'string' && position.book.length > 0 &&
    Number.isInteger(position.chapter) && position.chapter > 0 &&
    Number.isInteger(position.verse) && position.verse > 0 &&
    Number.isInteger(position.wordIndex) && position.wordIndex >= 0 &&
    (position.ref === undefined || typeof position.ref === 'string') &&
    (position.parashaName === undefined || typeof position.parashaName === 'string'))
}

function validData(data) {
  return data && typeof data === 'object' &&
    (data.highlights === undefined || (Array.isArray(data.highlights) && data.highlights.every((key) => typeof key === 'string'))) &&
    (data.wpm === undefined || (typeof data.wpm === 'number' && Number.isFinite(data.wpm) && data.wpm > 0)) &&
    (data.position === undefined || validPosition(data.position))
}

function writeData(subject, data) {
  db.prepare(`INSERT INTO oidc_user_data (subject, highlights, wpm, position) VALUES (?, ?, ?, ?)
    ON CONFLICT(subject) DO UPDATE SET highlights = excluded.highlights, wpm = excluded.wpm,
      position = excluded.position, updated_at = CURRENT_TIMESTAMP`)
    .run(subject, JSON.stringify(data.highlights), data.wpm, data.position === null ? null : JSON.stringify(data.position))
}

router.get('/data', (req, res) => res.json(readData(req.userId)))

router.put('/data', (req, res) => {
  if (!validData(req.body) || !['highlights', 'wpm', 'position'].some((key) => key in req.body)) {
    return res.status(400).json({ error: 'Invalid user data' })
  }
  const data = { ...readData(req.userId), ...req.body }
  writeData(req.userId, data)
  return res.json(data)
})

router.post('/import', (req, res) => {
  if (!validData(req.body)) return res.status(400).json({ error: 'Invalid user data' })
  const existing = readData(req.userId)
  const data = {
    highlights: [...new Set([...existing.highlights, ...(req.body.highlights ?? [])])],
    wpm: req.body.wpm ?? existing.wpm,
    position: req.body.position ?? existing.position,
  }
  writeData(req.userId, data)
  return res.json(data)
})

module.exports = router

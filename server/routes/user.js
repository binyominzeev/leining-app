const express = require('express')
const db = require('../db')
const { requireAuth } = require('./auth')

const router = express.Router()
router.use(requireAuth)

function readData(subject) {
  const row = db.prepare('SELECT highlights, wpm, position, scroll_font_scale FROM oidc_user_data WHERE subject = ?').get(subject)
  return row
    ? { highlights: JSON.parse(row.highlights), wpm: row.wpm, position: row.position ? JSON.parse(row.position) : null, scrollFontScale: row.scroll_font_scale }
    : { highlights: [], wpm: 75, position: null, scrollFontScale: 100 }
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
    (data.position === undefined || validPosition(data.position)) &&
    (data.scrollFontScale === undefined || (Number.isInteger(data.scrollFontScale) && data.scrollFontScale >= 50 && data.scrollFontScale <= 200))
}

function writeData(subject, data) {
  db.prepare(`INSERT INTO oidc_user_data (subject, highlights, wpm, position, scroll_font_scale) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(subject) DO UPDATE SET highlights = excluded.highlights, wpm = excluded.wpm,
      position = excluded.position, scroll_font_scale = excluded.scroll_font_scale, updated_at = CURRENT_TIMESTAMP`)
    .run(subject, JSON.stringify(data.highlights), data.wpm, data.position === null ? null : JSON.stringify(data.position), data.scrollFontScale)
}

router.get('/data', (req, res) => res.json(readData(req.userId)))

router.get('/bookmarks', (req, res) => {
  const bookmarks = db.prepare('SELECT book, chapter, verse FROM verse_bookmarks WHERE subject = ? ORDER BY book, chapter, verse').all(req.userId)
  return res.json(bookmarks)
})

router.put('/bookmarks', (req, res) => {
  const { book, chapter, verse, saved } = req.body ?? {}
  if (typeof book !== 'string' || !book.trim() || book.length > 100 ||
      !Number.isSafeInteger(chapter) || chapter < 1 || chapter > 999 ||
      !Number.isSafeInteger(verse) || verse < 1 || verse > 999 ||
      typeof saved !== 'boolean') {
    return res.status(400).json({ error: 'Invalid bookmark' })
  }
  if (saved) {
    db.prepare('INSERT OR IGNORE INTO verse_bookmarks (subject, book, chapter, verse) VALUES (?, ?, ?, ?)')
      .run(req.userId, book, chapter, verse)
  } else {
    db.prepare('DELETE FROM verse_bookmarks WHERE subject = ? AND book = ? AND chapter = ? AND verse = ?')
      .run(req.userId, book, chapter, verse)
  }
  return res.json({ book, chapter, verse, saved })
})

router.put('/data', (req, res) => {
  if (!validData(req.body) || !['highlights', 'wpm', 'position', 'scrollFontScale'].some((key) => key in req.body)) {
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
    scrollFontScale: req.body.scrollFontScale ?? existing.scrollFontScale,
  }
  writeData(req.userId, data)
  return res.json(data)
})

module.exports = router

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const db = new Database(path.join(DATA_DIR, 'leining.db'))

// Enable WAL for better concurrent read performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT  NOT NULL,
    wpm         INTEGER NOT NULL DEFAULT 75,
    highlights  TEXT    NOT NULL DEFAULT '[]',
    position    TEXT    DEFAULT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS oidc_user_data (
    subject TEXT PRIMARY KEY,
    wpm INTEGER NOT NULL DEFAULT 75,
    highlights TEXT NOT NULL DEFAULT '[]',
    position TEXT DEFAULT NULL,
    scroll_font_scale INTEGER NOT NULL DEFAULT 100,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

db.transaction(() => {
  const columns = db.pragma('table_info(oidc_user_data)')
  if (!columns.some((column) => column.name === 'scroll_font_scale')) {
    db.exec('ALTER TABLE oidc_user_data ADD COLUMN scroll_font_scale INTEGER NOT NULL DEFAULT 100')
  }
}).immediate()

module.exports = db

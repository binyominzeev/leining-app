const { test } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

test('Pocket ID tokens isolate profiles and local import merges without losing highlights', async (t) => {
  const { generateKeyPair, exportJWK, SignJWT } = await import('jose')
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'RS256' }
  const exchanges = []
  const issuerServer = http.createServer((req, res) => {
    if (req.url === '/.well-known/jwks.json') {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ keys: [jwk] }))
    } else if (req.url === '/api/oidc/token' && req.method === 'POST') {
      let body = ''
      req.on('data', (chunk) => { body += chunk })
      req.on('end', () => {
        exchanges.push(new URLSearchParams(body))
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ access_token: 'test-token' }))
      })
    } else {
      res.writeHead(404).end()
    }
  })
  await new Promise((resolve) => issuerServer.listen(0, '127.0.0.1', resolve))
  const issuer = `http://127.0.0.1:${issuerServer.address().port}`
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'leining-test-'))
  const Database = require('better-sqlite3')
  const legacyDb = new Database(path.join(directory, 'leining.db'))
  legacyDb.exec(`CREATE TABLE oidc_user_data (
    subject TEXT PRIMARY KEY, wpm INTEGER NOT NULL DEFAULT 75,
    highlights TEXT NOT NULL DEFAULT '[]', position TEXT DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)
  legacyDb.prepare('INSERT INTO oidc_user_data (subject, wpm, highlights) VALUES (?, ?, ?)')
    .run('alice', 90, JSON.stringify(['legacy']))
  legacyDb.close()
  process.env.DATA_DIR = directory
  process.env.OIDC_ISSUER = issuer
  process.env.OIDC_AUDIENCE = 'leining-test'
  process.env.OIDC_CLIENT_ID = 'client'
  process.env.OIDC_CLIENT_SECRET = 'test-secret'
  process.env.OIDC_REDIRECT_URI = 'http://localhost:5173/'
  const express = require('express')
  const db = require('../db')
  const app = express()
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use('/api/auth', require('../routes/auth').router)
  app.use('/api/user', require('../routes/user'))
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
  })
  t.after(() => {
    server.close()
    issuerServer.close()
    db.close()
    fs.rmSync(directory, { recursive: true, force: true })
  })
  const base = `http://127.0.0.1:${server.address().port}/api/user`
  const authBase = `http://127.0.0.1:${server.address().port}/api/auth`
  const token = (sub, audience = 'leining-test') => new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(issuer).setAudience(audience).setSubject(sub).setExpirationTime('5m').sign(privateKey)
  const alice = await token('alice')
  const bob = await token('bob')
  const exchange = (body) => fetch(`${authBase}/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })
  assert.equal((await exchange({ code: 'code', code_verifier: 'verifier', redirect_uri: 'http://wrong/' })).status, 400)
  assert.equal(exchanges.length, 0)
  assert.equal((await exchange({ code: 'code', code_verifier: 'verifier', redirect_uri: 'http://localhost:5173/' })).status, 200)
  assert.equal(exchanges[0].get('client_id'), 'client')
  assert.equal(exchanges[0].get('client_secret'), 'test-secret')
  assert.equal(exchanges[0].get('grant_type'), 'authorization_code')
  const refresh = await fetch(`${authBase}/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ refresh_token: 'refresh' }),
  })
  assert.equal(refresh.status, 200)
  assert.equal(exchanges[1].get('grant_type'), 'refresh_token')
  async function request(userToken, method = 'GET', endpoint = '/data', body) {
    const response = await fetch(base + endpoint, {
      method,
      headers: { authorization: `Bearer ${userToken}`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    return { status: response.status, data: await response.json() }
  }

  assert.equal((await request(await token('alice', 'wrong'))).status, 401)
  assert.equal((await request('invalid')).status, 401)
  assert.deepEqual((await request(alice)).data, { highlights: ['legacy'], wpm: 90, position: null, scrollFontScale: 100 })
  await request(alice, 'PUT', '/data', { highlights: ['old', 'shared'] })
  await request(alice, 'PUT', '/data', { wpm: 120 })
  assert.equal((await request(alice, 'PUT', '/data', { scrollFontScale: 140 })).status, 200)
  const position = { book: 'Genesis', chapter: 1, verse: 1, wordIndex: 2, ref: 'Genesis 1' }
  assert.deepEqual((await request(alice, 'POST', '/import', { highlights: ['shared', 'local'], position })).data,
    { highlights: ['old', 'shared', 'local'], wpm: 120, position, scrollFontScale: 140 })
  assert.deepEqual((await request(bob)).data, { highlights: [], wpm: 75, position: null, scrollFontScale: 100 })
  await request(bob, 'PUT', '/data', { scrollFontScale: 80 })
  assert.equal((await request(bob)).data.scrollFontScale, 80)
  for (const invalid of [49, 201, 100.5, '100', null]) {
    assert.equal((await request(bob, 'PUT', '/data', { scrollFontScale: invalid })).status, 400)
  }
  assert.equal((await request(bob, 'PUT', '/data', { highlights: [42] })).status, 400)
  assert.equal((await request(bob, 'PUT', '/data', { position: { book: 'Genesis' } })).status, 400)
  assert.deepEqual((await request(alice)).data, { highlights: ['old', 'shared', 'local'], wpm: 120, position, scrollFontScale: 140 })
  const first = { book: 'Genesis', chapter: 1, verse: 1 }
  const second = { book: 'Genesis', chapter: 1, verse: 2 }
  assert.deepEqual((await request(alice, 'GET', '/bookmarks')).data, [])
  assert.equal((await request(alice, 'PUT', '/bookmarks', { ...first, saved: true })).status, 200)
  await request(alice, 'PUT', '/bookmarks', { ...first, saved: true })
  await request(alice, 'PUT', '/bookmarks', { ...second, saved: true })
  await request(bob, 'PUT', '/bookmarks', { ...first, saved: true })
  assert.deepEqual((await request(alice, 'GET', '/bookmarks')).data, [first, second])
  await request(alice, 'PUT', '/bookmarks', { ...first, saved: false })
  await request(alice, 'PUT', '/bookmarks', { ...first, saved: false })
  assert.deepEqual((await request(alice, 'GET', '/bookmarks')).data, [second])
  assert.deepEqual((await request(bob, 'GET', '/bookmarks')).data, [first])
  for (const invalid of [
    { ...first, saved: 'true' },
    { ...first, chapter: 0, saved: true },
    { ...first, verse: 1.5, saved: true },
    { ...first, book: '', saved: true },
  ]) {
    assert.equal((await request(alice, 'PUT', '/bookmarks', invalid)).status, 400)
  }
  assert.deepEqual((await request(alice, 'GET', '/bookmarks')).data, [second])
  delete require.cache[require.resolve('../db')]
  const reopened = require('../db')
  assert.equal(reopened.prepare('SELECT scroll_font_scale FROM oidc_user_data WHERE subject = ?').get('alice').scroll_font_scale, 140)
  assert.deepEqual(reopened.prepare('SELECT book, chapter, verse FROM verse_bookmarks WHERE subject = ?').all('alice'), [second])
  reopened.close()
})

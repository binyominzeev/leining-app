import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/practice.ts', import.meta.url), 'utf8')
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText
const { initializePracticeSession, readPracticeSession, writePracticeSession } =
  await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`)

const values = new Map()
globalThis.sessionStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
}
globalThis.window = { location: { search: '' } }

const position = { book: 'Genesis', chapter: 1, verse: 1, wordIndex: 3, ref: 'Genesis 1' }

test('favorite navigation preserves its original position, including an empty origin', () => {
  const draft = { owner: null, phase: 'draft', origin: position, originLabel: 'Genesis 1:2' }
  writePracticeSession(draft)
  globalThis.window.location.search = '?practice=1'
  assert.deepEqual(initializePracticeSession(null, null), { ...draft, phase: 'active' })
  globalThis.window.location.search = ''
  assert.deepEqual(initializePracticeSession(null, null), { ...draft, phase: 'active' })
  writePracticeSession({ ...draft, phase: 'active', origin: null, originLabel: 'No previous reading position' })
  globalThis.window.location.search = '?practice=1'
  assert.equal(initializePracticeSession(null, position).origin, null)
})

test('practice sessions are isolated by user and returning state survives reload', () => {
  writePracticeSession({ owner: 'alice', phase: 'returning', origin: position, originLabel: 'Genesis 1:2' })
  globalThis.window.location.search = ''
  assert.equal(initializePracticeSession('alice', null).phase, 'returning')
  assert.equal(initializePracticeSession('bob', null), null)
  assert.equal(readPracticeSession(), null)
  globalThis.window.location.search = '?practice=1'
  const active = initializePracticeSession('bob', position)
  assert.equal(active.owner, 'bob')
  assert.deepEqual(active.origin, position)
})

test('invalid saved practice sessions are reported', () => {
  globalThis.sessionStorage.setItem('leining_favorites_practice', '{"phase":"active"}')
  assert.throws(() => readPracticeSession(), /Invalid practice session/)
  writePracticeSession(null)
})

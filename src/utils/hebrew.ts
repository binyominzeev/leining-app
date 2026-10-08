import type { ShvaAnnotation, Word } from '../types'
import type { AliyahMarker } from './sefaria'

const SHVA = '\u05B0'
const DAGESH = '\u05BC'

type VowelType = 'none' | 'shva' | 'short' | 'long' | 'hatef'

type LetterCluster = {
  letterIndex: number
  base: string
  marks: string[]
  markIndices: number[]
}

const HATEF_VOWELS = new Set(['\u05B1', '\u05B2', '\u05B3'])
const SHORT_VOWELS = new Set(['\u05B4', '\u05B6', '\u05B7', '\u05BB', '\u05C7'])
const LONG_VOWELS = new Set(['\u05B5', '\u05B8', '\u05B9'])

function isHebrewLetter(char: string): boolean {
  return /^[\u05D0-\u05EA]$/.test(char)
}

function isHebrewMark(char: string): boolean {
  return /^[\u0591-\u05C7]$/.test(char)
}

function toClusters(text: string): LetterCluster[] {
  const chars = Array.from(text)
  const clusters: LetterCluster[] = []

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (isHebrewLetter(ch)) {
      clusters.push({
        letterIndex: clusters.length,
        base: ch,
        marks: [],
        markIndices: [],
      })
      continue
    }
    if (isHebrewMark(ch) && clusters.length > 0) {
      const last = clusters[clusters.length - 1]
      last.marks.push(ch)
      last.markIndices.push(i)
    }
  }

  return clusters
}

function clusterHasMark(cluster: LetterCluster | undefined, mark: string): boolean {
  if (!cluster) return false
  return cluster.marks.includes(mark)
}

function getVowelType(cluster: LetterCluster | undefined): VowelType {
  if (!cluster) return 'none'

  let found: VowelType = 'none'
  for (const mark of cluster.marks) {
    if (mark === SHVA) return 'shva'
    if (HATEF_VOWELS.has(mark)) found = 'hatef'
    else if (SHORT_VOWELS.has(mark)) found = 'short'
    else if (LONG_VOWELS.has(mark)) found = found === 'hatef' ? 'hatef' : 'long'
  }

  // Shuruk is written as vav + dagesh without an additional niqqud mark.
  if (found === 'none' && cluster.base === '\u05D5' && clusterHasMark(cluster, DAGESH)) {
    return 'long'
  }

  return found
}

function classifyShva(cluster: LetterCluster, clusters: LetterCluster[]): Omit<ShvaAnnotation, 'charIndex'> {
  const idx = cluster.letterIndex
  const prev = clusters[idx - 1]
  const next = clusters[idx + 1]
  const prevHasShva = clusterHasMark(prev, SHVA)
  const nextHasShva = clusterHasMark(next, SHVA)

  if (idx === 0) {
    return { letterIndex: idx, type: 'na', confidence: 'high', rule: 'word-initial-shva' }
  }
  if (nextHasShva) {
    return { letterIndex: idx, type: 'nach', confidence: 'high', rule: 'first-of-double-shva' }
  }
  if (prevHasShva) {
    return { letterIndex: idx, type: 'na', confidence: 'high', rule: 'second-of-double-shva' }
  }
  if (idx === clusters.length - 1) {
    return { letterIndex: idx, type: 'nach', confidence: 'high', rule: 'word-final-shva' }
  }
  if (clusterHasMark(cluster, DAGESH)) {
    return { letterIndex: idx, type: 'na', confidence: 'medium', rule: 'dagesh-on-shva-letter' }
  }

  const prevVowel = getVowelType(prev)
  if (prevVowel === 'long' || prevVowel === 'hatef') {
    return { letterIndex: idx, type: 'na', confidence: 'medium', rule: 'after-long-or-hatef-vowel' }
  }
  if (prevVowel === 'short') {
    return { letterIndex: idx, type: 'nach', confidence: 'medium', rule: 'after-short-vowel' }
  }

  return { letterIndex: idx, type: 'uncertain', confidence: 'medium', rule: 'fallback-uncertain' }
}

/**
 * Analyze shva (U+05B0) positions in a word and classify each occurrence.
 * Rules are deterministic and ordered by priority.
 */
export function analyzeShva(text: string): ShvaAnnotation[] {
  const clusters = toClusters(text)
  const annotations: ShvaAnnotation[] = []

  for (const cluster of clusters) {
    for (let mi = 0; mi < cluster.marks.length; mi++) {
      const mark = cluster.marks[mi]
      if (mark !== SHVA) continue
      const base = classifyShva(cluster, clusters)
      annotations.push({
        ...base,
        charIndex: cluster.markIndices[mi],
      })
    }
  }

  return annotations
}

/**
 * Parse a Sefaria API 'he' field (string, string[], or string[][]) into Word
 * objects with per-word chapter/verse metadata preserved.
 *
 * @param he      - The raw Sefaria 'he' value
 * @param startChapter - Chapter number of the first verse in the range
 * @param startVerse   - Verse number of the first verse in the range
 */
export function parseSefariaResponse(
  he: string | string[] | string[][],
  startChapter: number,
  startVerse: number,
): Word[] {
  const words: Word[] = []
  let wordIndex = 0

  function addWords(text: string, chapter: number, verse: number) {
    if (!text || typeof text !== 'string') return
    const raw = stripHtml(text)
    // Ensure {פ} and {ס} paragraph markers are separated from surrounding text
    const processed = raw.replace(/\{[פס]\}/g, ' $& ')
    const tokens = processed.split(/\s+/).filter((t) => t.length > 0)
    for (const full of tokens) {
      // Handle paragraph markers as visual breaks (not words)
      if (full === '{פ}') {
        words.push({ index: wordIndex++, plain: '', full: '{פ}', taam: null, revealed: false, chapter, verse, breakType: 'petuchah' })
        continue
      }
      if (full === '{ס}') {
        words.push({ index: wordIndex++, plain: '', full: '{ס}', taam: null, revealed: false, chapter, verse, breakType: 'setumah' })
        continue
      }
      // Skip standalone paseq (U+05C0) tokens
      if (/^[\u05C0]+$/.test(full)) continue
      // Strip paseq from tokens that mix it with Hebrew text
      const stripped = full.replace(/\u05C0/g, '')
      if (!stripped) continue
      words.push({
        index: wordIndex++,
        plain: stripDiacritics(stripped),
        full: stripped,
        taam: extractTaam(stripped),
        shvaAnnotations: analyzeShva(stripped),
        revealed: false,
        chapter,
        verse,
      })
    }
  }

  if (typeof he === 'string') {
    addWords(he, startChapter, startVerse)
  } else if (Array.isArray(he)) {
    if (he.length === 0) return []
    if (typeof he[0] === 'string') {
      // Array of verse strings within a single chapter
      ;(he as string[]).forEach((verseText, vi) => {
        addWords(verseText, startChapter, startVerse + vi)
      })
    } else {
      // Nested array: outer index = chapter offset, inner index = verse offset
      ;(he as string[][]).forEach((chapterVerses, ci) => {
        // Only the first chapter group starts at startVerse; the rest start at 1
        const verseStart = ci === 0 ? startVerse : 1
        chapterVerses.forEach((verseText, vi) => {
          addWords(verseText, startChapter + ci, verseStart + vi)
        })
      })
    }
  }

  return words
}

/**
 * Strip all niqqud and ta'amim (Unicode range U+0591–U+05C7).
 */
export function stripDiacritics(text: string): string {
  // Remove Hebrew diacritics (niqqud and taamim), but keep maqaf (\u05BE)
  return text.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '')
}

/**
 * Extract ta'am marks (cantillation, Unicode range U+0591–U+05AF) from a word.
 * Returns the first ta'am character found, or null.
 */
export function extractTaam(text: string): string | null {
  const match = text.match(/[\u0591-\u05AF]/)
  return match ? match[0] : null
}

/**
 * Strip HTML tags and HTML entities from a Sefaria text string,
 * converting whitespace entities to spaces.
 */
export function stripHtml(text: string): string {
  return text
    .replace(/&thinsp;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/&#?[a-zA-Z0-9]+;/g, '')
}

/**
 * Parse a Sefaria verse text (string or array of strings) into Word objects.
 * The input should be the fully vocalized Hebrew text.
 */
export function parseVerseText(verseText: string | string[]): Word[] {
  const raw = Array.isArray(verseText)
    ? verseText.map(stripHtml).join(' ')
    : stripHtml(verseText)

  // Split by whitespace – preserving the original tokens (fully vocalized)
  const tokens = raw.split(/\s+/).filter((t) => t.length > 0)

  return tokens.map((full, i) => ({
    index: i,
    plain: stripDiacritics(full),
    full,
    taam: extractTaam(full),
    shvaAnnotations: analyzeShva(full),
    revealed: false,
  }))
}

/**
 * Insert aliyah marker pseudo-words into a parsed word array.
 * For each AliyahMarker (aliyot 2–7+), a virtual word with breakType 'aliyah'
 * is inserted just before the first real word at that chapter:verse.
 * Re-indexes all words after insertion.
 */
export function insertAliyahMarkers(words: Word[], markers: AliyahMarker[]): Word[] {
  if (markers.length === 0) return words

  // Build a set of chapter:verse keys where a marker starts
  const markerMap = new Map<string, AliyahMarker>()
  for (const m of markers) {
    markerMap.set(`${m.chapter}:${m.verse}`, m)
  }

  const result: Word[] = []
  const seen = new Set<string>()

  for (const word of words) {
    if (!word.breakType && word.chapter !== undefined && word.verse !== undefined) {
      const key = `${word.chapter}:${word.verse}`
      const marker = markerMap.get(key)
      if (marker && !seen.has(key)) {
        seen.add(key)
        result.push({
          index: 0, // will be re-indexed below
          plain: '',
          full: marker.heLabel,
          taam: null,
          revealed: true,
          chapter: word.chapter,
          verse: word.verse,
          breakType: 'aliyah',
          aliyahLabel: marker.heLabel,
        })
      }
    }
    result.push(word)
  }

  // Re-index everything
  for (let i = 0; i < result.length; i++) {
    result[i] = { ...result[i], index: i }
  }

  return result
}

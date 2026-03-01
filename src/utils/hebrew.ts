import type { Word } from '../types'

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
    revealed: false,
  }))
}

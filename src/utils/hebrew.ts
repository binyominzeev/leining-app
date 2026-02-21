import type { Word } from '../types'

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
 * Parse a Sefaria verse text (string or array of strings) into Word objects.
 * The input should be the fully vocalized Hebrew text.
 */
export function parseVerseText(verseText: string | string[]): Word[] {
  const raw = Array.isArray(verseText) ? verseText.join(' ') : verseText

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

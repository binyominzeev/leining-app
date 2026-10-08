import type { Word } from '../types'
import { TAAM_SLUGS, SILLUK_SLUG } from './taamim'

export type VideoMatch = {
  key: string
  url: string
  /** Number of trop-bearing words covered by the clip. */
  length: number
  /** Word indices (in `words`) covered by the clip, in order. */
  wordIndices: number[]
}

// Filename (without extension) is the sequence key: signs joined by "_", e.g. "mercha_tipcha_etnachta".
const files = import.meta.glob('../assets/taam-videos/*.{mp4,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** Sequence key ("mercha_tipcha_etnachta") -> video URL. */
export const VIDEO_SEQUENCES: Map<string, string> = new Map()

for (const [path, url] of Object.entries(files)) {
  const name = path.split('/').pop()!.replace(/\.[^.]+$/, '').toLowerCase()
  if (name.startsWith('_')) continue
  if (!VIDEO_SEQUENCES.has(name)) VIDEO_SEQUENCES.set(name, url)
}

const MAX_LEN = Math.max(1, ...[...VIDEO_SEQUENCES.keys()].map((k) => k.split('_').length))

const TAAM_RE = /[\u0591-\u05AF]/

/** Hand-sign slug of a word, or null if it carries no trop. */
function wordSlug(word: Word, isLastOfVerse: boolean): string | null {
  const m = word.full.match(TAAM_RE)
  if (m) return TAAM_SLUGS[m[0]] ?? null
  if (isLastOfVerse && word.full.includes('\u05BD')) return SILLUK_SLUG
  return null
}

/**
 * Greedily matches the longest known sequence at each trop word, per verse.
 * Returns clip matches keyed by every word index the clip covers.
 */
export function buildVideoTimeline(words: Word[]): Map<number, VideoMatch> {
  const timeline = new Map<number, VideoMatch>()
  if (VIDEO_SEQUENCES.size === 0) return timeline

  // Group trop words by verse
  let verseKey = ''
  let verse: { index: number; slug: string }[] = []
  const flush = () => {
    let i = 0
    while (i < verse.length) {
      let matched = false
      for (let len = Math.min(MAX_LEN, verse.length - i); len >= 1; len--) {
        const key = verse.slice(i, i + len).map((v) => v.slug).join('_')
        const url = VIDEO_SEQUENCES.get(key)
        if (url) {
          const wordIndices = verse.slice(i, i + len).map((v) => v.index)
          const match: VideoMatch = { key, url, length: len, wordIndices }
          // Cover the whole span (including trop-less words in between)
          for (let w = wordIndices[0]; w <= wordIndices[len - 1]; w++) timeline.set(w, match)
          i += len
          matched = true
          break
        }
      }
      if (!matched) i++
    }
    verse = []
  }

  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    if (w.breakType) continue
    const k = `${w.chapter}:${w.verse}`
    if (k !== verseKey) {
      flush()
      verseKey = k
    }
    let j = i + 1
    while (j < words.length && words[j].breakType) j++
    const next = words[j]
    const isLast = !next || `${next.chapter}:${next.verse}` !== k
    const slug = wordSlug(w, isLast)
    if (slug) verse.push({ index: i, slug })
  }
  flush()
  return timeline
}

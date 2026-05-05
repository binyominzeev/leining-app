import type { ReadingPosition } from '../types'

const STORAGE_KEY = 'leining_position'
const HIGHLIGHTS_STORAGE_KEY = 'leining_highlights'
const SPEED_STORAGE_KEY = 'leining_wpm'

export function saveHighlights(highlighted: Set<string>): void {
  try {
    localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify([...highlighted]))
  } catch {
    // ignore storage errors
  }
}

export function loadHighlights(): Set<string> {
  try {
    const raw = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

/** Persist the anonymous user's preferred WPM. */
export function saveSpeed(wpm: number): void {
  try {
    localStorage.setItem(SPEED_STORAGE_KEY, String(wpm))
  } catch {
    // ignore storage errors
  }
}

/** Load the anonymous user's preferred WPM (returns null if not set). */
export function loadSpeed(): number | null {
  try {
    const raw = localStorage.getItem(SPEED_STORAGE_KEY)
    if (!raw) return null
    const n = parseInt(raw, 10)
    return isNaN(n) ? null : n
  } catch {
    return null
  }
}

export function savePosition(pos: ReadingPosition): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
  } catch {
    // ignore storage errors
  }
}

export function loadPosition(): ReadingPosition | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ReadingPosition
  } catch {
    return null
  }
}

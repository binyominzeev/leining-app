import type { ReadingPosition } from '../types'

const STORAGE_KEY = 'leining_position'
const HIGHLIGHTS_STORAGE_KEY = 'leining_highlights'

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

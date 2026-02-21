import type { ReadingPosition } from '../types'

const STORAGE_KEY = 'leining_position'

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

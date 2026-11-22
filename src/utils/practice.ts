import type { ReadingPosition } from '../types'

const PRACTICE_KEY = 'leining_favorites_practice'

export type PracticeSession = {
  owner: string | null
  phase: 'draft' | 'active' | 'returning'
  origin: ReadingPosition | null
  originLabel: string
}

export function readPracticeSession(): PracticeSession | null {
  const raw = sessionStorage.getItem(PRACTICE_KEY)
  if (!raw) return null
  const value: unknown = JSON.parse(raw)
  if (!value || typeof value !== 'object') throw new Error('Invalid practice session')
  const session = value as Partial<PracticeSession>
  const position = session.origin
  if ((session.owner !== null && typeof session.owner !== 'string') ||
      !['draft', 'active', 'returning'].includes(session.phase ?? '') ||
      typeof session.originLabel !== 'string' ||
      (position !== null && (!position || typeof position.book !== 'string' || !position.book ||
        !Number.isSafeInteger(position.chapter) || position.chapter < 1 ||
        !Number.isSafeInteger(position.verse) || position.verse < 1 ||
        !Number.isSafeInteger(position.wordIndex) || position.wordIndex < 0 ||
        (position.ref !== undefined && typeof position.ref !== 'string') ||
        (position.parashaName !== undefined && typeof position.parashaName !== 'string')))) {
    throw new Error('Invalid practice session')
  }
  return session as PracticeSession
}

export function writePracticeSession(session: PracticeSession | null): void {
  if (session) sessionStorage.setItem(PRACTICE_KEY, JSON.stringify(session))
  else sessionStorage.removeItem(PRACTICE_KEY)
}

export function initializePracticeSession(user: string | null, position: ReadingPosition | null): PracticeSession | null {
  const stored = readPracticeSession()
  const session = stored?.owner === user ? stored : null
  if (stored && !session) writePracticeSession(null)
  const requested = new URLSearchParams(window.location.search).get('practice') === '1'
  if (!requested) return session
  const active: PracticeSession = {
    owner: user,
    phase: 'active',
    origin: session ? session.origin : position,
    originLabel: session?.originLabel ?? (position
      ? `${position.parashaName ?? position.book} (word ${position.wordIndex + 1})`
      : 'No previous reading position'),
  }
  writePracticeSession(active)
  return active
}

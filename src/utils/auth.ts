import type { ReadingPosition } from '../types'

const SESSION_KEY = 'leining_session'
const TOKEN_KEY = 'leining_token'
const USER_CACHE_KEY = 'leining_user_cache'

// Resolve API base URL: use VITE_API_URL env var, or default to /api (proxied in dev, same-origin in prod)
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'

export type UserData = {
  highlights: string[]
  wpm: number
  position?: ReadingPosition | null
}

// ── Token helpers ──────────────────────────────────────────────────────────

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

function setToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token) } catch { /* ignore */ }
}

function clearToken(): void {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
}

// ── User cache (localStorage) ──────────────────────────────────────────────
// Keeps the last-known user data so the app can restore state synchronously
// on page load (before any async fetch resolves).

function setCachedUserData(username: string, data: UserData): void {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify({ username, ...data }))
  } catch { /* ignore */ }
}

function getCachedUserData(username: string): UserData | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { username: string } & UserData
    if (parsed.username !== username) return null
    return { highlights: parsed.highlights, wpm: parsed.wpm, position: parsed.position ?? null }
  } catch { return null }
}

function clearUserCache(): void {
  try { localStorage.removeItem(USER_CACHE_KEY) } catch { /* ignore */ }
}

// ── Fetch helper ───────────────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Register a new user. Returns 'ok', 'exists', or 'network_error'. */
export async function registerUser(
  username: string,
  password: string,
  currentData: UserData,
): Promise<'ok' | 'exists' | 'network_error'> {
  try {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        highlights: currentData.highlights,
        wpm: currentData.wpm,
      }),
    })
    if (res.status === 409) return 'exists'
    if (!res.ok) return 'network_error'
    const json = await res.json() as { token: string; username: string } & UserData
    setToken(json.token)
    try { localStorage.setItem(SESSION_KEY, json.username) } catch { /* ignore */ }
    const data: UserData = { highlights: json.highlights, wpm: json.wpm, position: json.position ?? null }
    setCachedUserData(json.username, data)
    return 'ok'
  } catch {
    return 'network_error'
  }
}

/** Login an existing user. Returns the user's saved data, or null on failure. */
export async function loginUser(
  username: string,
  password: string,
): Promise<UserData | null> {
  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) return null
    const json = await res.json() as { token: string; username: string } & UserData
    setToken(json.token)
    try { localStorage.setItem(SESSION_KEY, json.username) } catch { /* ignore */ }
    const data: UserData = { highlights: json.highlights, wpm: json.wpm, position: json.position ?? null }
    setCachedUserData(json.username, data)
    return data
  } catch {
    return null
  }
}

/** Clear the current session. */
export function logoutUser(): void {
  clearToken()
  clearUserCache()
  try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
}

/** Return the currently logged-in username (lowercase key), or null. */
export function getCurrentUser(): string | null {
  try { return localStorage.getItem(SESSION_KEY) } catch { return null }
}

/**
 * Persist highlights, WPM, and optionally position for a logged-in user.
 * Fire-and-forget — updates the server and refreshes the local cache.
 */
export function saveUserData(username: string, data: UserData): void {
  setCachedUserData(username, data)
  // Fire-and-forget: update server in the background
  apiFetch('/user/data', {
    method: 'PUT',
    body: JSON.stringify({
      highlights: data.highlights,
      wpm: data.wpm,
      position: data.position ?? null,
    }),
  }).catch(() => { /* ignore network errors */ })
}

/** Load the cached data for a user (synchronous, may be stale). */
export function loadUserData(username: string): UserData | null {
  return getCachedUserData(username)
}

/**
 * Refresh user data from the server (async).
 * Returns the latest data, or null on failure.
 */
export async function refreshUserData(username: string): Promise<UserData | null> {
  try {
    const res = await apiFetch('/user/data')
    if (!res.ok) return null
    const json = await res.json() as UserData
    const data: UserData = { highlights: json.highlights, wpm: json.wpm, position: json.position ?? null }
    setCachedUserData(username, data)
    return data
  } catch {
    return null
  }
}

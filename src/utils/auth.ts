const USERS_KEY = 'leining_users'
const SESSION_KEY = 'leining_session'

export type UserData = {
  highlights: string[]
  wpm: number
}

type UserProfile = UserData & {
  username: string
  passwordHash: string
  salt: string
}

// ── PBKDF2 password hashing ────────────────────────────────────────────────

function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16))
}

function bufToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return bufToHex(new Uint8Array(derivedBits))
}

// ── Storage helpers ────────────────────────────────────────────────────────

function getUsers(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, UserProfile>
  } catch {
    return {}
  }
}

function persistUsers(users: Record<string, UserProfile>): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    // ignore storage errors
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Register a new user. Returns 'ok' or 'exists'. */
export async function registerUser(
  username: string,
  password: string,
  currentData: UserData,
): Promise<'ok' | 'exists'> {
  const users = getUsers()
  if (users[username.toLowerCase()]) return 'exists'
  const salt = generateSalt()
  const passwordHash = await hashPassword(password, salt)
  users[username.toLowerCase()] = {
    username,
    passwordHash,
    salt: bufToHex(salt),
    highlights: currentData.highlights,
    wpm: currentData.wpm,
  }
  persistUsers(users)
  try {
    localStorage.setItem(SESSION_KEY, username.toLowerCase())
  } catch {
    // ignore
  }
  return 'ok'
}

/** Login an existing user. Returns the user's saved data, or null on failure. */
export async function loginUser(
  username: string,
  password: string,
): Promise<UserData | null> {
  const users = getUsers()
  const user = users[username.toLowerCase()]
  if (!user) return null
  const salt = user.salt ? hexToBuf(user.salt) : new Uint8Array(0)
  const passwordHash = await hashPassword(password, salt)
  if (passwordHash !== user.passwordHash) return null
  try {
    localStorage.setItem(SESSION_KEY, username.toLowerCase())
  } catch {
    // ignore
  }
  return { highlights: user.highlights, wpm: user.wpm }
}

/** Clear the current session. */
export function logoutUser(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

/** Return the currently logged-in username (lowercase key), or null. */
export function getCurrentUser(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

/** Persist highlights and WPM for a logged-in user. */
export function saveUserData(username: string, data: UserData): void {
  const users = getUsers()
  const user = users[username.toLowerCase()]
  if (!user) return
  users[username.toLowerCase()] = { ...user, ...data }
  persistUsers(users)
}

/** Load the stored data for a user (without login). */
export function loadUserData(username: string): UserData | null {
  const users = getUsers()
  const user = users[username.toLowerCase()]
  if (!user) return null
  return { highlights: user.highlights, wpm: user.wpm }
}

import type { ReadingPosition } from '../types'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'
const ACCESS_KEY = 'leining_oidc_access'
const REFRESH_KEY = 'leining_oidc_refresh'
const NAME_KEY = 'leining_oidc_name'
const VERIFIER_KEY = 'leining_oidc_verifier'
const STATE_KEY = 'leining_oidc_state'
const RETURN_KEY = 'leining_oidc_return'
const PENDING_PREFIX = 'leining_oidc_pending:'

export type UserData = {
  highlights: string[]
  wpm: number
  position: ReadingPosition | null
}

type Tokens = { access_token: string; refresh_token?: string; id_token?: string }
type Claims = { sub?: string; exp?: number; name?: string; preferred_username?: string; email?: string }
type Pending = Partial<UserData>

class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

let accessToken = localStorage.getItem(ACCESS_KEY)
let refreshToken = localStorage.getItem(REFRESH_KEY)
let userName = localStorage.getItem(NAME_KEY) || ''
let refreshTimer: ReturnType<typeof setTimeout> | undefined
let refreshing: Promise<void> | null = null
let saving: Promise<void> | null = null
let initialization: Promise<string | null> | null = null

function claims(token: string): Claims {
  const payload = token.split('.')[1]
  if (!payload) throw new Error('Invalid token')
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), (c) => c.charCodeAt(0)))) as Claims
}

function randomString(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function redirectUri(): string {
  return `${window.location.origin}/`
}

async function tokenRequest(path: string, params: URLSearchParams): Promise<Tokens> {
  const response = await fetch(`${API_BASE}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })
  if (!response.ok) throw new HttpError(`Authentication failed (${response.status})`, response.status)
  const tokens = await response.json() as Tokens
  if (!tokens.access_token || !claims(tokens.access_token).sub) throw new Error('Invalid access token')
  return tokens
}

function scheduleRefresh(): void {
  clearTimeout(refreshTimer)
  if (!accessToken || !refreshToken) return
  const exp = claims(accessToken).exp
  if (!exp) return
  refreshTimer = setTimeout(() => {
    refreshAccessToken().catch(reportError)
  }, Math.max(exp * 1000 - Date.now() - 60000, 5000))
}

function applyTokens(tokens: Tokens, freshLogin = false): void {
  accessToken = tokens.access_token
  if (freshLogin) refreshToken = null
  if (tokens.refresh_token) refreshToken = tokens.refresh_token
  const identity = claims(tokens.id_token || tokens.access_token)
  userName = identity.name || identity.preferred_username || identity.email ||
    (!freshLogin && userName) || claims(tokens.access_token).sub || ''
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(NAME_KEY, userName)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
  else localStorage.removeItem(REFRESH_KEY)
  scheduleRefresh()
}

function reportError(error: unknown): void {
  console.error('Authentication or synchronization error:', error)
  window.dispatchEvent(new CustomEvent('leining-sync-error', { detail: error instanceof Error ? error.message : String(error) }))
}

export function getCurrentUser(): string | null {
  return accessToken ? claims(accessToken).sub ?? null : null
}

export function getUserName(): string {
  return userName
}

export async function login(): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/config`)
  if (!response.ok) throw new Error(`Authentication configuration failed (${response.status})`)
  const config = await response.json() as { issuer: string; clientId: string }
  const discovery = await fetch(`${config.issuer}/.well-known/openid-configuration`)
  if (!discovery.ok) throw new Error('OIDC discovery failed')
  const metadata = await discovery.json() as { authorization_endpoint: string }
  const verifier = randomString()
  const state = randomString()
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
  const challenge = btoa(String.fromCharCode(...digest)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)
  const currentParams = new URLSearchParams(window.location.search)
  sessionStorage.setItem(RETURN_KEY, currentParams.has('code') || currentParams.has('error')
    ? window.location.pathname
    : `${window.location.pathname}${window.location.search}`)
  const params = new URLSearchParams({
    response_type: 'code', client_id: config.clientId, redirect_uri: redirectUri(),
    scope: 'openid profile email offline_access', state, code_challenge: challenge, code_challenge_method: 'S256',
  })
  window.location.assign(`${metadata.authorization_endpoint}?${params}`)
}

async function refreshAccessToken(): Promise<void> {
  if (refreshing) return refreshing
  if (!refreshToken) throw new Error('No refresh token available')
  const token = refreshToken
  refreshing = tokenRequest('refresh', new URLSearchParams({ refresh_token: token })).then((tokens) => {
    if (refreshToken === token) applyTokens(tokens)
  }).catch((error: unknown) => {
    if (refreshToken === token && error instanceof HttpError && (error.status === 400 || error.status === 401)) {
      expireSession()
    }
    throw error
  }).finally(() => { refreshing = null })
  return refreshing
}

async function api(path: string, options: RequestInit = {}, retried = false): Promise<Response> {
  if (!accessToken) throw new Error('Not authenticated')
  const user = getCurrentUser()
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers, Authorization: `Bearer ${accessToken}` },
  })
  if (response.status === 401 && !retried && refreshToken) {
    await refreshAccessToken()
    if (getCurrentUser() !== user) throw new Error('Account changed during synchronization')
    return api(path, options, true)
  }
  if (response.status === 401 && getCurrentUser() === user) expireSession()
  if (!response.ok) throw new Error(`Synchronization failed (${response.status})`)
  return response
}

async function initialize(): Promise<string | null> {
  const params = new URLSearchParams(window.location.search)
  if (params.has('error')) throw new Error(`OIDC authorization failed: ${params.get('error')}`)
  const code = params.get('code')
  if (code) {
    const verifier = sessionStorage.getItem(VERIFIER_KEY)
    if (!verifier || params.get('state') !== sessionStorage.getItem(STATE_KEY)) throw new Error('Invalid OIDC state')
    const tokens = await tokenRequest('token', new URLSearchParams({ code, code_verifier: verifier, redirect_uri: redirectUri() }))
    applyTokens(tokens, true)
    sessionStorage.removeItem(VERIFIER_KEY)
    sessionStorage.removeItem(STATE_KEY)
    const returnPath = sessionStorage.getItem(RETURN_KEY) || '/'
    sessionStorage.removeItem(RETURN_KEY)
    window.history.replaceState(null, '', returnPath)
  }
  if (accessToken) {
    const exp = claims(accessToken).exp
    if (!exp || exp * 1000 - Date.now() < 60000) {
      if (refreshToken) await refreshAccessToken()
      else if (!exp || exp * 1000 <= Date.now()) {
        logoutUser()
        return null
      }
    } else scheduleRefresh()
  }
  return getCurrentUser()
}

export function initializeAuth(): Promise<string | null> {
  initialization ??= initialize()
  return initialization
}

export function logoutUser(): void {
  accessToken = null
  refreshToken = null
  userName = ''
  clearTimeout(refreshTimer)
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(NAME_KEY)
}

function expireSession(): void {
  logoutUser()
  sessionStorage.setItem('leining_auth_expired', '1')
  window.dispatchEvent(new Event('leining-session-expired'))
}

function readPending(user: string): Pending {
  const raw = localStorage.getItem(PENDING_PREFIX + user)
  return raw ? JSON.parse(raw) as Pending : {}
}

export async function flushUserData(user: string): Promise<void> {
  if (saving) {
    await saving
    if (getCurrentUser() === user && Object.keys(readPending(user)).length) return flushUserData(user)
    return
  }
  saving = (async () => {
    while (getCurrentUser() === user) {
      const pending = readPending(user)
      if (!Object.keys(pending).length) return
      await api('/user/data', { method: 'PUT', body: JSON.stringify(pending) })
      const remaining = readPending(user)
      for (const key of Object.keys(pending) as (keyof Pending)[]) {
        if (JSON.stringify(remaining[key]) === JSON.stringify(pending[key])) delete remaining[key]
      }
      if (Object.keys(remaining).length) localStorage.setItem(PENDING_PREFIX + user, JSON.stringify(remaining))
      else localStorage.removeItem(PENDING_PREFIX + user)
    }
  })().finally(() => { saving = null })
  return saving
}

export function saveUserData(user: string, data: Pending): void {
  localStorage.setItem(PENDING_PREFIX + user, JSON.stringify({ ...readPending(user), ...data }))
  flushUserData(user).catch(reportError)
}

export async function loadUserData(user: string): Promise<UserData> {
  await flushUserData(user)
  const response = await api('/user/data')
  return response.json() as Promise<UserData>
}

export async function importUserData(user: string, data: Pending): Promise<UserData> {
  await flushUserData(user)
  const response = await api('/user/import', { method: 'POST', body: JSON.stringify(data) })
  return response.json() as Promise<UserData>
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !accessToken) return
  const exp = claims(accessToken).exp
  if (refreshToken && (!exp || exp * 1000 - Date.now() < 60000)) refreshAccessToken().catch(reportError)
  const user = getCurrentUser()
  if (user) flushUserData(user).catch(reportError)
})

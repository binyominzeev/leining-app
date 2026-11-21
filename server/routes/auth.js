const express = require('express')

const router = express.Router()
const issuer = process.env.OIDC_ISSUER?.replace(/\/$/, '')
let jwksPromise

async function requireAuth(req, res, next) {
  if (!issuer) return res.status(503).json({ error: 'Authentication is not configured' })
  const match = (req.get('authorization') || '').match(/^Bearer\s+(.+)$/i)
  if (!match) return res.status(401).json({ error: 'Bearer token required' })

  try {
    const { createRemoteJWKSet, jwtVerify } = await import('jose')
    jwksPromise ??= createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))
    const { payload } = await jwtVerify(match[1], jwksPromise, {
      issuer,
      ...(process.env.OIDC_AUDIENCE ? { audience: process.env.OIDC_AUDIENCE } : {}),
    })
    if (typeof payload.sub !== 'string' || !payload.sub) {
      return res.status(401).json({ error: 'Token has no subject' })
    }
    req.userId = payload.sub
    return next()
  } catch (error) {
    console.error('Access token verification failed:', error.message)
    return res.status(401).json({ error: 'Invalid access token' })
  }
}

router.get('/config', (_req, res) => {
  const clientId = process.env.OIDC_CLIENT_ID
  if (!issuer || !clientId) return res.status(503).json({ error: 'Authentication is not configured' })
  res.json({ issuer, clientId })
})

async function exchange(params) {
  const clientId = process.env.OIDC_CLIENT_ID
  const clientSecret = process.env.OIDC_CLIENT_SECRET
  if (!issuer || !clientId || !clientSecret) {
    return { status: 503, body: JSON.stringify({ error: 'OIDC server configuration is incomplete' }) }
  }
  const response = await fetch(`${issuer}/api/oidc/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }),
  })
  return { status: response.status, body: await response.text() }
}

router.post('/token', async (req, res, next) => {
  const { code, code_verifier: verifier, redirect_uri: redirectUri } = req.body ?? {}
  const configuredUri = process.env.OIDC_REDIRECT_URI
  if (!configuredUri) return res.status(503).json({ error: 'OIDC server configuration is incomplete' })
  if (typeof code !== 'string' || !code || typeof verifier !== 'string' || !verifier || redirectUri !== configuredUri) {
    return res.status(400).json({ error: 'Invalid OIDC token request' })
  }
  try {
    const result = await exchange({ grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: configuredUri })
    res.status(result.status).type('application/json').send(result.body)
  } catch (error) { next(error) }
})

router.post('/refresh', async (req, res, next) => {
  const token = req.body?.refresh_token
  if (typeof token !== 'string' || !token) return res.status(400).json({ error: 'Invalid refresh request' })
  try {
    const result = await exchange({ grant_type: 'refresh_token', refresh_token: token })
    res.status(result.status).type('application/json').send(result.body)
  } catch (error) { next(error) }
})

module.exports = { router, requireAuth }

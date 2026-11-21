require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const { router: authRouter } = require('./routes/auth')
const userRouter = require('./routes/user')

const app = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)

app.disable('x-powered-by')
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : false, methods: ['GET', 'POST', 'PUT'], allowedHeaders: ['Authorization', 'Content-Type'] }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '10kb' }))

// ── Rate limiting ─────────────────────────────────────────────────────────
// Strict limit for auth endpoints (register/login) to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Relaxed limit for user-data endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter)
app.use('/api/user', apiLimiter, userRouter)

// Health check (not rate limited)
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Leining App API server running on port ${PORT}`)
})

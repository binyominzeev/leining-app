require('dotenv').config()
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const { router: authRouter } = require('./routes/auth')
const userRouter = require('./routes/user')

// Require a real JWT_SECRET in production
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.')
    process.exit(1)
  } else {
    console.warn('WARNING: JWT_SECRET is not set. Using an insecure default — set it before deploying!')
  }
}

const app = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:4173']

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

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
app.listen(PORT, () => {
  console.log(`Leining App API server running on port ${PORT}`)
})

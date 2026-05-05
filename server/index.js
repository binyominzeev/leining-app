require('dotenv').config()
const express = require('express')
const cors = require('cors')

const { router: authRouter } = require('./routes/auth')
const userRouter = require('./routes/user')

const app = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:4173']

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/user', userRouter)

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Leining App API server running on port ${PORT}`)
})

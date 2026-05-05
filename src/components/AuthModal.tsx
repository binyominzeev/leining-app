import { useState } from 'react'
import { loginUser, registerUser } from '../utils/auth'
import type { UserData } from '../utils/auth'
import styles from './AuthModal.module.css'

type Tab = 'login' | 'register'

type Props = {
  /** Current anonymous user data so it can be migrated on register. */
  currentData: UserData
  onLogin: (username: string, data: UserData) => void
  onClose: () => void
}

export default function AuthModal({ currentData, onLogin, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = username.trim()
    if (!trimmed) { setError('נא להזין שם משתמש'); return }
    if (!password) { setError('נא להזין סיסמה'); return }
    setLoading(true)
    try {
      if (tab === 'login') {
        const data = await loginUser(trimmed, password)
        if (!data) { setError('שם משתמש או סיסמה שגויים'); return }
        onLogin(trimmed.toLowerCase(), data)
      } else {
        const result = await registerUser(trimmed, password, currentData)
        if (result === 'exists') { setError('שם משתמש תפוס, בחר אחר'); return }
        if (result === 'network_error') { setError('שגיאת חיבור לשרת. אנא נסה שוב.'); return }
        onLogin(trimmed.toLowerCase(), currentData)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={tab === 'login' ? 'התחברות' : 'הרשמה'}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="סגור">✕</button>

        <div className={styles.tabs}>
          <button
            className={tab === 'login' ? `${styles.tabBtn} ${styles.tabBtnActive}` : styles.tabBtn}
            onClick={() => { setTab('login'); setError(null) }}
          >
            התחברות
          </button>
          <button
            className={tab === 'register' ? `${styles.tabBtn} ${styles.tabBtnActive}` : styles.tabBtn}
            onClick={() => { setTab('register'); setError(null) }}
          >
            הרשמה
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.fieldLabel}>
            שם משתמש
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={loading}
              dir="ltr"
            />
          </label>

          <label className={styles.fieldLabel}>
            סיסמה
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
              dir="ltr"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? '...' : tab === 'login' ? 'כניסה' : 'הרשמה'}
          </button>
        </form>

        {tab === 'register' && (
          <p className={styles.note}>
            הנתונים נשמרים בשרת ומסונכרנים בין המכשירים שלך.
          </p>
        )}
      </div>
    </div>
  )
}

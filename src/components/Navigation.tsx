import { useState, useEffect } from 'react'
import { TANACH_BOOKS, STATIC_PARASHOT, fetchParashot, type Parasha } from '../utils/sefaria'
import styles from './Navigation.module.css'

type Props = {
  onLoad: (ref: string, book: string, chapter: number, startVerse: number) => void
  useRashiFont: boolean
  onRashiFontChange: (value: boolean) => void
  rashiFontSize: number
  onRashiFontSizeChange: (size: number) => void
}

type Mode = 'manual' | 'parasha'

export default function Navigation({ onLoad, useRashiFont, onRashiFontChange, rashiFontSize, onRashiFontSizeChange }: Props) {
  const [mode, setMode] = useState<Mode>('manual')
  const [book, setBook] = useState('Genesis')
  const [chapter, setChapter] = useState(1)
  const [startVerse, setStartVerse] = useState(1)
  const [endVerse, setEndVerse] = useState(10)
  const [parashot, setParashot] = useState<Parasha[]>(STATIC_PARASHOT)
  const [selectedParasha, setSelectedParasha] = useState(STATIC_PARASHOT[0].ref)

  useEffect(() => {
    fetchParashot()
      .then(setParashot)
      .catch(() => setParashot(STATIC_PARASHOT))
  }, [])

  const selectedBook = TANACH_BOOKS.find((b) => b.name === book)
  const maxChapters = selectedBook?.chapters ?? 1

  const handleManualLoad = () => {
    const ref = `${book} ${chapter}:${startVerse}-${endVerse}`
    onLoad(ref, book, chapter, startVerse)
  }

  const handleParashaLoad = () => {
    const p = parashot.find((p) => p.ref === selectedParasha)
    if (!p) return
    // Parse the first chapter/verse from the parasha ref
    // e.g. "Genesis 1:1-6:8" -> book=Genesis, chapter=1, verse=1
    const match = p.ref.match(/^(.+?)\s+(\d+):(\d+)/)
    const pBook = match ? match[1] : p.book
    const pChapter = match ? parseInt(match[2]) : 1
    const pVerse = match ? parseInt(match[3]) : 1
    onLoad(p.ref, pBook, pChapter, pVerse)
  }

  return (
    <div className={styles.nav}>
      <div className={styles.modeToggle}>
        <button
          className={mode === 'manual' ? styles.active : ''}
          onClick={() => setMode('manual')}
        >
          בחר קטע
        </button>
        <button
          className={mode === 'parasha' ? styles.active : ''}
          onClick={() => setMode('parasha')}
        >
          פרשת השבוע
        </button>
      </div>

      {mode === 'manual' ? (
        <div className={styles.manualForm}>
          <select
            value={book}
            onChange={(e) => { setBook(e.target.value); setChapter(1); setStartVerse(1); setEndVerse(10) }}
            className={styles.select}
          >
            {TANACH_BOOKS.map((b) => (
              <option key={b.name} value={b.name}>
                {b.hebrewName} ({b.name})
              </option>
            ))}
          </select>
          <select
            value={chapter}
            onChange={(e) => { setChapter(Number(e.target.value)); setStartVerse(1); setEndVerse(10) }}
            className={styles.select}
          >
            {Array.from({ length: maxChapters }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={999}
            value={startVerse}
            onChange={(e) => setStartVerse(Number(e.target.value))}
            className={styles.verseInput}
            placeholder="מ"
          />
          <span className={styles.sep}>—</span>
          <input
            type="number"
            min={1}
            max={999}
            value={endVerse}
            onChange={(e) => setEndVerse(Number(e.target.value))}
            className={styles.verseInput}
            placeholder="עד"
          />
          <button className={styles.loadBtn} onClick={handleManualLoad}>
            טען
          </button>
        </div>
      ) : (
        <div className={styles.parashaForm}>
          <select
            value={selectedParasha}
            onChange={(e) => setSelectedParasha(e.target.value)}
            className={styles.select}
          >
            {parashot.map((p) => (
              <option key={p.ref} value={p.ref}>
                {p.he} ({p.en})
              </option>
            ))}
          </select>
          <button className={styles.loadBtn} onClick={handleParashaLoad}>
            טען
          </button>
        </div>
      )}

      <label className={styles.rashiCheckbox}>
        <input
          type="checkbox"
          checked={useRashiFont}
          onChange={(e) => onRashiFontChange(e.target.checked)}
        />
        פונט רש״י
      </label>
      {useRashiFont && (
        <label className={styles.rashiSizeLabel}>
          גודל:
          <input
            type="number"
            min={1.5}
            max={6}
            step={0.1}
            value={rashiFontSize}
            onChange={(e) => onRashiFontSizeChange(Number(e.target.value))}
            className={styles.rashiSizeInput}
          />
          rem
        </label>
      )}
    </div>
  )
}

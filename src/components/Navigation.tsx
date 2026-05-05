import { useState, useEffect, useRef } from 'react'
import { TANACH_BOOKS, STATIC_PARASHOT, fetchParashot, type Parasha } from '../utils/sefaria'
import styles from './Navigation.module.css'

const TORAH_BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'] as const

const BOOK_HEBREW: Record<string, string> = {
  Genesis: 'בְּרֵאשִׁית',
  Exodus: 'שְׁמוֹת',
  Leviticus: 'וַיִּקְרָא',
  Numbers: 'בְּמִדְבַּר',
  Deuteronomy: 'דְּבָרִים',
}

type Props = {
  onLoad: (ref: string, book: string, chapter: number, startVerse: number, parashaName?: string, aliyotRefs?: string[]) => void
  useRashiFont: boolean
  onRashiFontChange: (value: boolean) => void
  rashiFontSize: number
  onRashiFontSizeChange: (size: number) => void
  currentBook?: string
  currentChapter?: number
  currentVerse?: number
  parashaLoaded?: boolean
  seferTorahMode?: boolean
  onSeferTorahModeToggle?: () => void
  revealAllTaamim?: boolean
  onRevealAllTaamimToggle?: () => void
}

type Mode = 'manual' | 'parasha'

/** Build a Sefaria URL for a given book, chapter and verse.
 *  Sefaria URLs use underscores for spaces in book names, e.g.
 *  https://www.sefaria.org/I_Samuel.1.1
 */
function sefariaUrl(book: string, chapter: number, verse: number): string {
  // Sefaria uses underscores in book-name slugs (not %20 or +)
  const bookSlug = book.replace(/ /g, '_')
  return `https://www.sefaria.org/${bookSlug}.${chapter}.${verse}`
}

export default function Navigation({ onLoad, useRashiFont, onRashiFontChange, rashiFontSize, onRashiFontSizeChange, currentBook, currentChapter, currentVerse, parashaLoaded, seferTorahMode, onSeferTorahModeToggle, revealAllTaamim, onRevealAllTaamimToggle }: Props) {
  const [mode, setMode] = useState<Mode>('manual')
  const [book, setBook] = useState('Genesis')
  const [chapter, setChapter] = useState(1)
  const [startVerse, setStartVerse] = useState(1)
  const [parashot, setParashot] = useState<Parasha[]>(STATIC_PARASHOT)
  const [selectedParasha, setSelectedParasha] = useState(STATIC_PARASHOT[0].ref)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const megaMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchParashot()
      .then(setParashot)
      .catch(() => setParashot(STATIC_PARASHOT))
  }, [])

  // Sync dropdowns when the loaded book/chapter changes (e.g. from URL)
  useEffect(() => {
    if (currentBook && TANACH_BOOKS.some((b) => b.name === currentBook)) {
      setBook(currentBook)
    }
  }, [currentBook])

  useEffect(() => {
    if (currentChapter && currentChapter >= 1) {
      setChapter(currentChapter)
    }
  }, [currentChapter])

  // Close mega menu when clicking outside (only while open)
  useEffect(() => {
    if (!megaMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setMegaMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [megaMenuOpen])

  // Group parashot by Torah book in canonical order
  const parashotByBook = TORAH_BOOKS.map((bookName) => ({
    book: bookName,
    parashot: parashot.filter((p) => p.book === bookName),
  }))

  const selectedParashaObj = parashot.find((p) => p.ref === selectedParasha)

  const selectedBook = TANACH_BOOKS.find((b) => b.name === book)
  const maxChapters = selectedBook?.chapters ?? 1

  const handleManualLoad = () => {
    const ref = `${book} ${chapter}`
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
    onLoad(p.ref, pBook, pChapter, pVerse, p.en, p.aliyotRefs)
  }

  return (
    <div className={styles.nav}>
      <div className={styles.modeToggle}>
        <button
          className={mode === 'manual' ? styles.active : ''}
          onClick={() => setMode('manual')}
        >
          Book / Chapter
        </button>
        <button
          className={mode === 'parasha' ? styles.active : ''}
          onClick={() => setMode('parasha')}
        >
          Weekly Parasha
        </button>
      </div>

      {mode === 'manual' ? (
        <div className={styles.manualForm}>
          <select
            value={book}
            onChange={(e) => { setBook(e.target.value); setChapter(1); setStartVerse(1) }}
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
            onChange={(e) => { setChapter(Number(e.target.value)); setStartVerse(1) }}
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
          <button className={styles.loadBtn} onClick={handleManualLoad}>
            Load
          </button>
        </div>
      ) : (
        <div className={styles.parashaForm}>
          <div className={styles.megaMenuWrapper} ref={megaMenuRef}>
            <button
              className={styles.megaMenuBtn}
              onClick={() => setMegaMenuOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={megaMenuOpen}
            >
              {selectedParashaObj
                ? `${selectedParashaObj.he} (${selectedParashaObj.en})`
                : 'בחר פרשה' /* Select a parasha */}
              <span className={styles.megaMenuArrow}>{megaMenuOpen ? '▲' : '▼'}</span>
            </button>

            {megaMenuOpen && (
              <div className={styles.megaMenu} role="listbox">
                <div className={styles.megaMenuGrid}>
                  {parashotByBook.map(({ book: bookName, parashot: bookParashot }) => (
                    <div key={bookName} className={styles.megaMenuColumn}>
                      <div className={styles.megaMenuBookHeader}>
                        <span className={styles.megaMenuBookHe}>{BOOK_HEBREW[bookName]}</span>
                        <span className={styles.megaMenuBookEn}>{bookName}</span>
                      </div>
                      {bookParashot.map((p) => (
                        <button
                          key={p.ref}
                          role="option"
                          aria-selected={p.ref === selectedParasha}
                          className={
                            p.ref === selectedParasha
                              ? `${styles.megaMenuParasha} ${styles.megaMenuParashaSelected}`
                              : styles.megaMenuParasha
                          }
                          onClick={() => {
                            setSelectedParasha(p.ref)
                            setMegaMenuOpen(false)
                          }}
                        >
                          <span className={styles.megaMenuParashaHe}>{p.he}</span>
                          <span className={styles.megaMenuParashaEn}>{p.en}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className={styles.loadBtn} onClick={handleParashaLoad}>
            Load
          </button>
        </div>
      )}

      <label className={styles.rashiCheckbox}>
        <input
          type="checkbox"
          checked={useRashiFont}
          onChange={(e) => onRashiFontChange(e.target.checked)}
        />
        Rashi script
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

      {parashaLoaded && onSeferTorahModeToggle && (
        <button
          className={[styles.seferTorahBtn, seferTorahMode ? styles.seferTorahBtnActive : ''].filter(Boolean).join(' ')}
          onClick={onSeferTorahModeToggle}
          title={seferTorahMode ? 'חזרה למצב רגיל' : 'מצב ספר תורה'}
          aria-pressed={seferTorahMode}
        >
          📜
        </button>
      )}

      {onRevealAllTaamimToggle && (
        <button
          className={[styles.seferTorahBtn, revealAllTaamim ? styles.seferTorahBtnActive : ''].filter(Boolean).join(' ')}
          onClick={onRevealAllTaamimToggle}
          title={revealAllTaamim ? 'חזרה למצב רגיל' : 'הצג כל המילים עם טעמים'}
          aria-pressed={revealAllTaamim}
        >
          {revealAllTaamim ? 'הסתר' : 'הצג הכל'}
        </button>
      )}

      {currentBook && currentChapter != null && currentVerse != null && (
        <a
          className={styles.sefariaLinkBtn}
          href={sefariaUrl(currentBook, currentChapter, currentVerse)}
          target="_blank"
          rel="noopener noreferrer"
          title={`פתח ב-Sefaria: ${currentBook} ${currentChapter}:${currentVerse}`}
        >
          🔗 Sefaria
        </a>
      )}
    </div>
  )
}

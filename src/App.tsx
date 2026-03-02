import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { Word } from './types'
import { parseVerseText, parseSefariaResponse } from './utils/hebrew'
import { fetchSefariaText, STATIC_PARASHOT, TANACH_BOOKS } from './utils/sefaria'
import { savePosition, loadPosition, saveHighlights, loadHighlights } from './utils/storage'
import { updateUrl, parseCurrentUrl } from './utils/url'
import { usePlayback } from './hooks/usePlayback'
import Navigation from './components/Navigation'
import TextDisplay from './components/TextDisplay'
import Controls from './components/Controls'
import TaamPanel from './components/TaamPanel'
import RashiTextPanel from './components/RashiTextPanel'
import styles from './App.module.css'
import { KEYBOARD_SEEK_WORDS } from './config/playbackConfig'

const THEME_STORAGE_KEY = 'leining-theme'

export default function App() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookInfo, setBookInfo] = useState({ book: '', chapter: 1, startVerse: 1 })
  const [currentParashaName, setCurrentParashaName] = useState<string | null>(null)
  const [useRashiFont, setUseRashiFont] = useState(false)
  const [rashiPracticeText, setRashiPracticeText] = useState('')
  const [rashiFontSize, setRashiFontSize] = useState(2.6)
  const [isLightTheme, setIsLightTheme] = useState(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light'
  })
  const [highlightedWords, setHighlightedWords] = useState<Set<string>>(() => loadHighlights())

  useEffect(() => {
    if (isLightTheme) {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem(THEME_STORAGE_KEY, isLightTheme ? 'light' : 'dark')
  }, [isLightTheme])

  const rashiWords = useMemo(() => {
    if (!rashiPracticeText.trim()) return []
    return parseVerseText(rashiPracticeText)
  }, [rashiPracticeText])

  const handleRashiWordChange = useCallback((_index: number) => {
    // no-op: Rashi practice doesn't need to persist or reveal words
  }, [])

  const {
    currentWordIndex: rashiCurrentWordIndex,
    isPlaying: rashiIsPlaying,
    speed: rashiSpeed,
    setCurrentWordIndex: setRashiCurrentWordIndex,
    setSpeed: setRashiSpeed,
    play: rashiPlay,
    pause: rashiPause,
    toggle: rashiToggle,
  } = usePlayback({ words: rashiWords, speed: 800, onWordChange: handleRashiWordChange })

  // Reset Rashi word index when practice text changes
  useEffect(() => {
    setRashiCurrentWordIndex(0)
  }, [rashiPracticeText, setRashiCurrentWordIndex])

  // Refs used inside callbacks to avoid stale closure issues
  const wordsRef = useRef<Word[]>([])
  const currentParashaNameRef = useRef<string | null>(null)
  const bookInfoRef = useRef({ book: '', chapter: 1, startVerse: 1 })
  const lastUrlVerseRef = useRef<{ chapter: number; verse: number } | null>(null)

  useEffect(() => { wordsRef.current = words }, [words])
  useEffect(() => { currentParashaNameRef.current = currentParashaName }, [currentParashaName])
  useEffect(() => { bookInfoRef.current = bookInfo }, [bookInfo])

  const handleWordChange = useCallback((index: number) => {
    setWords((prev) =>
      prev.map((w) =>
        w.index === index ? { ...w, revealed: true } : w
      )
    )
    const word = wordsRef.current[index]
    // Update browser URL when the verse changes
    if (word?.chapter !== undefined && word?.verse !== undefined) {
      const { chapter, verse } = word
      if (
        !lastUrlVerseRef.current ||
        lastUrlVerseRef.current.chapter !== chapter ||
        lastUrlVerseRef.current.verse !== verse
      ) {
        lastUrlVerseRef.current = { chapter, verse }
        const urlName = currentParashaNameRef.current ?? bookInfoRef.current.book
        if (urlName) updateUrl(urlName, chapter, verse)
      }
    }
    // Persist position
    savePosition({
      book: bookInfoRef.current.book,
      chapter: bookInfoRef.current.chapter,
      verse: bookInfoRef.current.startVerse,
      wordIndex: index,
    })
  }, [])

  const { currentWordIndex, isPlaying, speed, setCurrentWordIndex, setSpeed, play, pause, toggle } =
    usePlayback({ words, speed: 800, onWordChange: handleWordChange })

  const currentWord = words[currentWordIndex] ?? null
  const isRashiMode = useRashiFont && rashiWords.length > 0

  // Update browser tab title to reflect current position
  useEffect(() => {
    if (currentWord?.chapter && currentWord?.verse && bookInfo.book) {
      document.title = `Leining App – ${bookInfo.book} ${currentWord.chapter}:${currentWord.verse}`
    } else {
      document.title = 'Leining App'
    }
  }, [currentWord, bookInfo.book])

  // Space bar shortcut: toggle play/pause
  const toggleRef = useRef(toggle)
  const rashiToggleRef = useRef(rashiToggle)
  const isRashiModeRef = useRef(isRashiMode)
  const setCurrentWordIndexRef = useRef(setCurrentWordIndex)
  const setRashiCurrentWordIndexRef = useRef(setRashiCurrentWordIndex)
  const currentWordIndexRef = useRef(currentWordIndex)
  const rashiCurrentWordIndexRef = useRef(rashiCurrentWordIndex)
  const rashiWordsLengthRef = useRef(rashiWords.length)
  useEffect(() => { toggleRef.current = toggle }, [toggle])
  useEffect(() => { rashiToggleRef.current = rashiToggle }, [rashiToggle])
  useEffect(() => { isRashiModeRef.current = isRashiMode }, [isRashiMode])
  useEffect(() => { setCurrentWordIndexRef.current = setCurrentWordIndex }, [setCurrentWordIndex])
  useEffect(() => { setRashiCurrentWordIndexRef.current = setRashiCurrentWordIndex }, [setRashiCurrentWordIndex])
  useEffect(() => { currentWordIndexRef.current = currentWordIndex }, [currentWordIndex])
  useEffect(() => { rashiCurrentWordIndexRef.current = rashiCurrentWordIndex }, [rashiCurrentWordIndex])
  useEffect(() => { rashiWordsLengthRef.current = rashiWords.length }, [rashiWords.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (isRashiModeRef.current) {
          rashiToggleRef.current()
        } else {
          toggleRef.current()
        }
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault()
        // ArrowLeft = forward (+words) — Hebrew text flows right-to-left
        // ArrowRight = backward (−words)
        const delta = e.code === 'ArrowLeft' ? KEYBOARD_SEEK_WORDS : -KEYBOARD_SEEK_WORDS
        if (isRashiModeRef.current) {
          const newIdx = Math.max(0, Math.min(rashiWordsLengthRef.current - 1, rashiCurrentWordIndexRef.current + delta))
          setRashiCurrentWordIndexRef.current(newIdx)
        } else {
          const newIdx = Math.max(0, Math.min(wordsRef.current.length - 1, currentWordIndexRef.current + delta))
          setCurrentWordIndexRef.current(newIdx)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const loadText = useCallback(async (ref: string, book: string, chapter: number, startVerse: number, parashaName?: string): Promise<Word[] | null> => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSefariaText(ref)
      const parsed = parseSefariaResponse(data.he, chapter, startVerse)
      if (parsed.length === 0) {
        setError('לא נמצא טקסט. נסה קטע אחר.')
        setLoading(false)
        return null
      }
      setWords(parsed)
      setBookInfo({ book, chapter, startVerse })
      setCurrentParashaName(parashaName ?? null)
      lastUrlVerseRef.current = null
      setCurrentWordIndex(0)
      return parsed
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינה')
      return null
    } finally {
      setLoading(false)
    }
  }, [setCurrentWordIndex])

  // On mount: load from URL first, then fall back to saved localStorage position
  useEffect(() => {
    const urlRoute = parseCurrentUrl()
    if (urlRoute) {
      if (urlRoute.parashaEn) {
        // Find the parasha and load its full range
        const parasha = STATIC_PARASHOT.find((p) => p.en === urlRoute.parashaEn)
        if (parasha) {
          const match = parasha.ref.match(/^(.+?)\s+(\d+):(\d+)/)
          const pBook = match ? match[1] : parasha.book
          const pChapter = match ? parseInt(match[2], 10) : 1
          const pVerse = match ? parseInt(match[3], 10) : 1
          loadText(parasha.ref, pBook, pChapter, pVerse, parasha.en).then((parsed) => {
            if (!parsed) return
            // Jump to the verse specified in the URL
            const targetIdx = parsed.findIndex(
              (w) => w.chapter === urlRoute.chapter && w.verse === urlRoute.verse,
            )
            if (targetIdx >= 0) setCurrentWordIndex(targetIdx)
          })
          return
        }
      } else if (urlRoute.book) {
        // Manual-mode URL: load the chapter containing the target verse
        const ref = `${urlRoute.book} ${urlRoute.chapter}`
        loadText(ref, urlRoute.book, urlRoute.chapter, 1).then((parsed) => {
          if (!parsed) return
          const targetIdx = parsed.findIndex(
            (w) => w.chapter === urlRoute.chapter && w.verse === urlRoute.verse,
          )
          if (targetIdx >= 0) setCurrentWordIndex(targetIdx)
        })
        return
      }
    }
    // Fallback: restore last position from localStorage
    const pos = loadPosition()
    if (pos) {
      const ref = `${pos.book} ${pos.chapter}:${pos.verse}`
      loadText(ref, pos.book, pos.chapter, pos.verse).then((parsed) => {
        if (parsed) setCurrentWordIndex(pos.wordIndex)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleWordClick = useCallback((index: number) => {
    setCurrentWordIndex(index)
  }, [setCurrentWordIndex])

  const handleToggleHighlight = useCallback((wordKey: string) => {
    setHighlightedWords((prev) => {
      const next = new Set(prev)
      if (next.has(wordKey)) {
        next.delete(wordKey)
      } else {
        next.add(wordKey)
      }
      saveHighlights(next)
      return next
    })
  }, [])

  const handleRashiWordClick = useCallback((index: number) => {
    setRashiCurrentWordIndex(index)
  }, [setRashiCurrentWordIndex])

  const handlePrevChapter = useCallback(() => {
    if (!bookInfoRef.current.book || bookInfoRef.current.chapter <= 1) return
    const prevChapter = bookInfoRef.current.chapter - 1
    loadText(`${bookInfoRef.current.book} ${prevChapter}`, bookInfoRef.current.book, prevChapter, 1)
  }, [loadText])

  const handleNextChapter = useCallback(() => {
    if (!bookInfoRef.current.book) return
    const bookMeta = TANACH_BOOKS.find((b) => b.name === bookInfoRef.current.book)
    if (bookMeta && bookInfoRef.current.chapter >= bookMeta.chapters) return
    const nextChapter = bookInfoRef.current.chapter + 1
    loadText(`${bookInfoRef.current.book} ${nextChapter}`, bookInfoRef.current.book, nextChapter, 1)
  }, [loadText])

  const currentBookMeta = TANACH_BOOKS.find((b) => b.name === bookInfo.book)
  const hasPrevChapter = !!bookInfo.book && bookInfo.chapter > 1
  const hasNextChapter = !!currentBookMeta && bookInfo.chapter < currentBookMeta.chapters

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>מאמן קריאת תורה</h1>
        <label className={styles.themeToggle}>
          <span>☀️</span>
          <input
            type="checkbox"
            checked={isLightTheme}
            onChange={(e) => setIsLightTheme(e.target.checked)}
            aria-label="Toggle light theme"
          />
        </label>
      </header>

      <Navigation
        onLoad={loadText}
        useRashiFont={useRashiFont}
        onRashiFontChange={setUseRashiFont}
        rashiFontSize={rashiFontSize}
        onRashiFontSizeChange={setRashiFontSize}
        currentBook={bookInfo.book || undefined}
        currentChapter={bookInfo.chapter}
      />

      <div className={styles.main}>
        <div className={styles.textArea}>
          {loading && <div className={styles.loading}>טוען...</div>}
          {error && <div className={styles.error}>{error}</div>}
          {!loading && !error && (
            isRashiMode ? (
              <TextDisplay
                words={rashiWords}
                currentWordIndex={rashiCurrentWordIndex}
                onWordClick={handleRashiWordClick}
                useRashiFont={true}
                fontSize={`${rashiFontSize}rem`}
                rashiPractice={true}
              />
            ) : (
              <>
                <TextDisplay
                  words={words}
                  currentWordIndex={currentWordIndex}
                  onWordClick={handleWordClick}
                  useRashiFont={useRashiFont}
                  bookName={bookInfo.book}
                  highlightedWords={highlightedWords}
                  onToggleHighlight={handleToggleHighlight}
                  prevNav={hasPrevChapter ? (
                    <button className={styles.chapterNavBtn} onClick={handlePrevChapter}>
                      ◀ פרק קודם
                    </button>
                  ) : undefined}
                  nextNav={hasNextChapter ? (
                    <button className={styles.chapterNavBtn} onClick={handleNextChapter}>
                      פרק הבא ▶
                    </button>
                  ) : undefined}
                />
              </>
            )
          )}
        </div>

        <aside className={styles.sidebar}>
          <TaamPanel word={currentWord} />
          {useRashiFont && (
            <RashiTextPanel
              text={rashiPracticeText}
              onTextChange={setRashiPracticeText}
            />
          )}
        </aside>
      </div>

      <Controls
        isPlaying={isRashiMode ? rashiIsPlaying : isPlaying}
        speed={isRashiMode ? rashiSpeed : speed}
        wordCount={isRashiMode ? rashiWords.length : words.length}
        currentWordIndex={isRashiMode ? rashiCurrentWordIndex : currentWordIndex}
        onPlay={isRashiMode ? rashiPlay : play}
        onPause={isRashiMode ? rashiPause : pause}
        onSpeedChange={isRashiMode ? setRashiSpeed : setSpeed}
      />
    </div>
  )
}

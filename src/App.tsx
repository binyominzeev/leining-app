import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { Word } from './types'
import { parseVerseText, parseSefariaResponse } from './utils/hebrew'
import { fetchSefariaText, STATIC_PARASHOT } from './utils/sefaria'
import { savePosition, loadPosition } from './utils/storage'
import { updateUrl, parseCurrentUrl } from './utils/url'
import { usePlayback } from './hooks/usePlayback'
import Navigation from './components/Navigation'
import TextDisplay from './components/TextDisplay'
import Controls from './components/Controls'
import TaamPanel from './components/TaamPanel'
import RashiTextPanel from './components/RashiTextPanel'
import styles from './App.module.css'

export default function App() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookInfo, setBookInfo] = useState({ book: '', chapter: 1, startVerse: 1 })
  const [currentParashaName, setCurrentParashaName] = useState<string | null>(null)
  const [useRashiFont, setUseRashiFont] = useState(false)
  const [rashiPracticeText, setRashiPracticeText] = useState('')
  const [rashiFontSize, setRashiFontSize] = useState(2.6)

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

  const { currentWordIndex, isPlaying, speed, setCurrentWordIndex, setSpeed, play, pause } =
    usePlayback({ words, speed: 800, onWordChange: handleWordChange })

  const currentWord = words[currentWordIndex] ?? null
  const isRashiMode = useRashiFont && rashiWords.length > 0

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

  const handleRashiWordClick = useCallback((index: number) => {
    setRashiCurrentWordIndex(index)
  }, [setRashiCurrentWordIndex])

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>מאמן קריאת תורה</h1>
      </header>

      <Navigation
        onLoad={loadText}
        useRashiFont={useRashiFont}
        onRashiFontChange={setUseRashiFont}
        rashiFontSize={rashiFontSize}
        onRashiFontSizeChange={setRashiFontSize}
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
              <TextDisplay
                words={words}
                currentWordIndex={currentWordIndex}
                onWordClick={handleWordClick}
                useRashiFont={useRashiFont}
              />
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
        onPlay={isRashiMode ? rashiPlay : play}
        onPause={isRashiMode ? rashiPause : pause}
        onSpeedChange={isRashiMode ? setRashiSpeed : setSpeed}
      />
    </div>
  )
}

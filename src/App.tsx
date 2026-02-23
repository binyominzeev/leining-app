import { useState, useCallback, useEffect, useMemo } from 'react'
import type { Word } from './types'
import { parseVerseText } from './utils/hebrew'
import { fetchSefariaText } from './utils/sefaria'
import { savePosition, loadPosition } from './utils/storage'
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
  const [useRashiFont, setUseRashiFont] = useState(false)
  const [rashiPracticeText, setRashiPracticeText] = useState('')
  const [rashiFontSize, setRashiFontSize] = useState(2.6)
  const [rashiCurrentWordIndex, setRashiCurrentWordIndex] = useState(0)

  const rashiWords = useMemo(() => {
    if (!rashiPracticeText.trim()) return []
    return parseVerseText(rashiPracticeText)
  }, [rashiPracticeText])

  // Reset Rashi word index when practice text changes
  useEffect(() => {
    setRashiCurrentWordIndex(0)
  }, [rashiPracticeText])

  const handleWordChange = useCallback((index: number) => {
    setWords((prev) =>
      prev.map((w) =>
        w.index === index ? { ...w, revealed: true } : w
      )
    )
    // Persist position
    savePosition({
      book: bookInfo.book,
      chapter: bookInfo.chapter,
      verse: bookInfo.startVerse,
      wordIndex: index,
    })
  }, [bookInfo])

  const { currentWordIndex, isPlaying, speed, setCurrentWordIndex, setSpeed, play, pause } =
    usePlayback({ words, speed: 800, onWordChange: handleWordChange })

  const currentWord = words[currentWordIndex] ?? null

  const loadText = useCallback(async (ref: string, book: string, chapter: number, startVerse: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSefariaText(ref)
      // data.he may be a string, string[], or nested string[][]
      let heText: string | string[]
      if (Array.isArray(data.he)) {
        // Flatten nested arrays (multi-chapter ranges)
        heText = (data.he as unknown[]).flat(Infinity).filter((s): s is string => typeof s === 'string')
      } else {
        heText = data.he
      }
      const parsed = parseVerseText(heText)
      if (parsed.length === 0) {
        setError('לא נמצא טקסט. נסה קטע אחר.')
        setLoading(false)
        return
      }
      setWords(parsed)
      setBookInfo({ book, chapter, startVerse })
      setCurrentWordIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינה')
    } finally {
      setLoading(false)
    }
  }, [setCurrentWordIndex])

  // Restore last position on mount
  useEffect(() => {
    const pos = loadPosition()
    if (pos) {
      const ref = `${pos.book} ${pos.chapter}:${pos.verse}`
      loadText(ref, pos.book, pos.chapter, pos.verse).then(() => {
        setCurrentWordIndex(pos.wordIndex)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleWordClick = useCallback((index: number) => {
    setCurrentWordIndex(index)
  }, [setCurrentWordIndex])

  const handleRashiWordClick = useCallback((index: number) => {
    setRashiCurrentWordIndex(index)
  }, [])

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
            useRashiFont && rashiWords.length > 0 ? (
              <TextDisplay
                words={rashiWords}
                currentWordIndex={rashiCurrentWordIndex}
                onWordClick={handleRashiWordClick}
                useRashiFont={true}
                fontSize={`${rashiFontSize}rem`}
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
        isPlaying={isPlaying}
        speed={speed}
        onPlay={play}
        onPause={pause}
        onSpeedChange={setSpeed}
      />
    </div>
  )
}

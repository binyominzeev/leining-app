import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { ReadingPosition, Word } from './types'
import { parseVerseText, parseSefariaResponse, insertAliyahMarkers } from './utils/hebrew'
import { fetchSefariaText, fetchAliyot, parseAliyotRefs, fetchParashot, STATIC_PARASHOT, TANACH_BOOKS } from './utils/sefaria'
import { savePosition, loadPosition, saveHighlights, loadHighlights, saveSpeed, loadSpeed } from './utils/storage'
import { getCurrentUser, getUserName, initializeAuth, login, loadUserData, saveUserData, logoutUser } from './utils/auth'
import { updateUrl, parseCurrentUrl } from './utils/url'
import { usePlayback } from './hooks/usePlayback'
import Navigation from './components/Navigation'
import TextDisplay from './components/TextDisplay'
import SeferTorahDisplay from './components/SeferTorahDisplay'
import Controls from './components/Controls'
import RashiTextPanel from './components/RashiTextPanel'
import TaamVideoPanel from './components/TaamVideoPanel'
import { buildVideoTimeline } from './utils/taamSequences'
import styles from './App.module.css'
import sefariaLogo from './assets/powered-by-sefaria.svg'
import { KEYBOARD_SEEK_WORDS, wpmToMs, msToWpm } from './config/playbackConfig'

const THEME_STORAGE_KEY = 'leining-theme'
const TAAM_VIDEO_STORAGE_KEY = 'leining-taam-video'

function getVerseKeyAtIndex(words: Word[], index: number): string | null {
  const target =
    words.find((word) => word.index === index && !word.breakType) ??
    words.find((word) => word.index >= index && !word.breakType) ??
    [...words].reverse().find((word) => !word.breakType)

  if (!target || target.verse === undefined) return null
  return `${target.chapter ?? 0}:${target.verse}`
}

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
    return localStorage.getItem(THEME_STORAGE_KEY) !== 'dark'
  })
  const [highlightedWords, setHighlightedWords] = useState<Set<string>>(() => loadHighlights())
  const [practiceVerseRange, setPracticeVerseRange] = useState<{ start: string; end: string } | null>(null)
  const [isSeferTorahMode, setIsSeferTorahMode] = useState(false)
  const [revealAllTaamim, setRevealAllTaamim] = useState(false)
  const [hideScrollMarks, setHideScrollMarks] = useState(false)
  const [delayedScrollMarks, setDelayedScrollMarks] = useState(false)
  const [scrollMarkDelay, setScrollMarkDelay] = useState('10')
  const parsedScrollMarkDelay = Number(scrollMarkDelay)
  const validScrollMarkDelay = scrollMarkDelay.trim() !== '' && Number.isSafeInteger(parsedScrollMarkDelay) && parsedScrollMarkDelay >= 1
  const [showShvaNa, setShowShvaNa] = useState(false)
  const [showTaamVideo, setShowTaamVideo] = useState(() => localStorage.getItem(TAAM_VIDEO_STORAGE_KEY) === '1')
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [profileReady, setProfileReady] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(() => {
    if (!sessionStorage.getItem('leining_auth_expired')) return null
    return 'ההתחברות פגה. יש להתחבר מחדש.'
  })
  const [initialPosition, setInitialPosition] = useState<ReadingPosition | null>(null)

  // Initial playback speed: load from user profile or anonymous localStorage
  const [initialSpeed] = useState<number>(() => {
    const savedWpm = loadSpeed()
    return savedWpm ? wpmToMs(savedWpm) : 800
  })

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
  const readingRef = useRef<{ ref: string; parashaName?: string }>({ ref: '' })
  const lastUrlVerseRef = useRef<{ chapter: number; verse: number } | null>(null)
  const highlightedWordsRef = useRef(highlightedWords)

  useEffect(() => { wordsRef.current = words }, [words])
  useEffect(() => { currentParashaNameRef.current = currentParashaName }, [currentParashaName])
  useEffect(() => { bookInfoRef.current = bookInfo }, [bookInfo])
  useEffect(() => { highlightedWordsRef.current = highlightedWords }, [highlightedWords])

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
  }, [])

  const { currentWordIndex, isPlaying, speed, setCurrentWordIndex, setSpeed, play, pause, toggle } =
    usePlayback({ words, speed: initialSpeed, onWordChange: handleWordChange })

  const currentWord = words[currentWordIndex] ?? null

  const videoTimeline = useMemo(() => buildVideoTimeline(words), [words])
  const videoMatch = videoTimeline.get(currentWordIndex) ?? null
  const nextVideoUrl = useMemo(() => {
    const end = videoMatch ? videoMatch.wordIndices[videoMatch.length - 1] : currentWordIndex
    for (let i = end + 1; i < Math.min(words.length, end + 40); i++) {
      const m = videoTimeline.get(i)
      if (m) return m.url
    }
    return null
  }, [videoTimeline, videoMatch, currentWordIndex, words.length])

  const handleTaamVideoChange = useCallback((value: boolean) => {
    setShowTaamVideo(value)
    localStorage.setItem(TAAM_VIDEO_STORAGE_KEY, value ? '1' : '0')
  }, [])
  const isRashiMode = !isSeferTorahMode && useRashiFont && rashiWords.length > 0

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

  const loadText = useCallback(async (ref: string, book: string, chapter: number, startVerse: number, parashaName?: string, aliyotRefs?: string[]): Promise<Word[] | null> => {
    setLoading(true)
    setError(null)
    try {
      const [data, aliyot] = await Promise.all([
        fetchSefariaText(ref),
        (() => {
          // Prefer year-independent aliyah refs from the Sefaria index API
          if (aliyotRefs && aliyotRefs.length > 0) {
            return Promise.resolve(parseAliyotRefs(aliyotRefs))
          }
          // Fall back to the calendar-based next-read API (used for combined readings)
          if (parashaName) {
            return fetchAliyot(parashaName).catch((err) => {
              console.warn('Failed to fetch aliyot:', err)
              return []
            })
          }
          return Promise.resolve([])
        })(),
      ])
      let parsed = parseSefariaResponse(data.he, chapter, startVerse)
      if (parsed.length === 0) {
        setError('לא נמצא טקסט. נסה קטע אחר.')
        setLoading(false)
        return null
      }
      if (aliyot.length > 0) {
        parsed = insertAliyahMarkers(parsed, aliyot)
      }
      const initialVerseKey = getVerseKeyAtIndex(parsed, 0)
      setPracticeVerseRange(initialVerseKey
        ? { start: initialVerseKey, end: initialVerseKey }
        : null)
      setWords(parsed)
      setBookInfo({ book, chapter, startVerse })
      bookInfoRef.current = { book, chapter, startVerse }
      wordsRef.current = parsed
      readingRef.current = { ref, ...(parashaName ? { parashaName } : {}) }
      setCurrentParashaName(parashaName ?? null)
      currentParashaNameRef.current = parashaName ?? null
      setIsSeferTorahMode(false)
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

  useEffect(() => {
    let active = true
    sessionStorage.removeItem('leining_auth_expired')
    const onSyncError = (event: Event) => {
      setSyncError((event as CustomEvent<string>).detail)
    }
    window.addEventListener('leining-sync-error', onSyncError)
    const onSessionExpired = () => window.location.reload()
    window.addEventListener('leining-session-expired', onSessionExpired)
    initializeAuth().then(async (user) => {
      if (!user) {
        if (active) {
          setInitialPosition(loadPosition())
          setAuthReady(true)
        }
        return
      }
      if (active) setCurrentUser(user)
      const data = await loadUserData(user)
      if (!active) return
      setHighlightedWords(new Set(data.highlights))
      setSpeed(wpmToMs(data.wpm))
      setInitialPosition(data.position)
      setProfileReady(true)
      setAuthReady(true)
    }).catch((err: unknown) => {
      console.error('Authentication initialization failed:', err)
      if (active) {
        setCurrentUser(getCurrentUser())
        setSyncError(err instanceof Error ? err.message : String(err))
        setAuthReady(true)
      }
    })
    return () => {
      active = false
      window.removeEventListener('leining-sync-error', onSyncError)
      window.removeEventListener('leining-session-expired', onSessionExpired)
    }
  }, [setSpeed])

  // Restore an explicit URL first, then the authenticated or anonymous position.
  const restoreStarted = useRef(false)
  useEffect(() => {
    if (!authReady || (currentUser && !profileReady) || restoreStarted.current) return
    restoreStarted.current = true
    const urlRoute = parseCurrentUrl()
    if (urlRoute) {
      if (urlRoute.parashaEn) {
        // Fetch the parasha list (cached after Navigation's call) to get aliyotRefs
        fetchParashot().catch(() => STATIC_PARASHOT).then((parashots) => {
          const parasha = parashots.find((p) => p.en === urlRoute.parashaEn)
          if (!parasha) return
          const match = parasha.ref.match(/^(.+?)\s+(\d+):(\d+)/)
          const pBook = match ? match[1] : parasha.book
          const pChapter = match ? parseInt(match[2], 10) : 1
          const pVerse = match ? parseInt(match[3], 10) : 1
          loadText(parasha.ref, pBook, pChapter, pVerse, parasha.en, parasha.aliyotRefs).then((parsed) => {
            if (!parsed) return
            // Jump to the verse specified in the URL, skipping any break/marker words
            const targetIdx = parsed.findIndex(
              (w) => !w.breakType && w.chapter === urlRoute.chapter && w.verse === urlRoute.verse,
            )
            if (targetIdx >= 0) {
              const verseKey = getVerseKeyAtIndex(parsed, targetIdx)
              if (verseKey) setPracticeVerseRange({ start: verseKey, end: verseKey })
              setCurrentWordIndex(targetIdx)
            }
          })
        })
        return
      } else if (urlRoute.book) {
        // Manual-mode URL: load the chapter containing the target verse
        const ref = `${urlRoute.book} ${urlRoute.chapter}`
        loadText(ref, urlRoute.book, urlRoute.chapter, 1).then((parsed) => {
          if (!parsed) return
          const targetIdx = parsed.findIndex(
            (w) => !w.breakType && w.chapter === urlRoute.chapter && w.verse === urlRoute.verse,
          )
          if (targetIdx >= 0) {
            const verseKey = getVerseKeyAtIndex(parsed, targetIdx)
            if (verseKey) setPracticeVerseRange({ start: verseKey, end: verseKey })
            setCurrentWordIndex(targetIdx)
          }
        })
        return
      }
    }
    const pos = initialPosition
    if (pos) {
      const ref = pos.ref ?? `${pos.book} ${pos.chapter}:${pos.verse}`
      const aliyot = pos.parashaName
        ? fetchParashot().then((items) => items.find((item) => item.en === pos.parashaName)?.aliyotRefs).catch((err) => {
          console.warn('Failed to restore aliyot:', err)
          return undefined
        })
        : Promise.resolve(undefined)
      aliyot.then((refs) => loadText(ref, pos.book, pos.chapter, pos.verse, pos.parashaName, refs)).then((parsed) => {
        if (parsed) {
          const index = Math.min(pos.wordIndex, parsed.length - 1)
          const verseKey = getVerseKeyAtIndex(parsed, index)
          if (verseKey) setPracticeVerseRange({ start: verseKey, end: verseKey })
          setCurrentWordIndex(index)
        }
      })
    }
  }, [authReady, currentUser, profileReady, initialPosition, loadText, setCurrentWordIndex])

  const handleWordClick = useCallback((index: number) => {
    setCurrentWordIndex(index)
  }, [setCurrentWordIndex])

  const handleVerseClick = useCallback((verseKey: string) => {
    setPracticeVerseRange((current) => current
      ? { ...current, end: verseKey }
      : { start: verseKey, end: verseKey })
  }, [])

  const handleToggleHighlight = useCallback((wordKey: string) => {
    const next = new Set(highlightedWordsRef.current)
    if (next.has(wordKey)) next.delete(wordKey)
    else next.add(wordKey)
    highlightedWordsRef.current = next
    setHighlightedWords(next)
    if (currentUser && profileReady) saveUserData(currentUser, { highlights: [...next] })
    else if (!currentUser) saveHighlights(next)
  }, [currentUser, profileReady])

  // Persist speed changes for the current user (or anonymously)
  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed)
    const wpm = msToWpm(newSpeed)
    if (currentUser && profileReady) saveUserData(currentUser, { wpm })
    else if (!currentUser) saveSpeed(wpm)
  }, [setSpeed, currentUser, profileReady])

  const handleLogout = useCallback(() => {
    logoutUser()
    window.location.reload()
  }, [])

  const latestPositionRef = useRef<ReadingPosition | null>(null)
  const positionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!authReady || !bookInfo.book || !words.length || (currentUser && !profileReady)) return
    const position: ReadingPosition = {
      book: bookInfo.book, chapter: bookInfo.chapter, verse: bookInfo.startVerse,
      wordIndex: currentWordIndex, ...readingRef.current,
    }
    latestPositionRef.current = position
    if (!currentUser) {
      savePosition(position)
    } else if (!positionTimerRef.current) {
      positionTimerRef.current = setTimeout(() => {
        positionTimerRef.current = null
        if (latestPositionRef.current) saveUserData(currentUser, { position: latestPositionRef.current })
      }, 2000)
    }
  }, [authReady, bookInfo, currentWordIndex, currentUser, profileReady, words.length])

  useEffect(() => {
    const saveLatestPosition = () => {
      if (currentUser && profileReady && latestPositionRef.current) {
        saveUserData(currentUser, { position: latestPositionRef.current })
      }
    }
    window.addEventListener('pagehide', saveLatestPosition)
    return () => {
      window.removeEventListener('pagehide', saveLatestPosition)
      if (positionTimerRef.current) clearTimeout(positionTimerRef.current)
      positionTimerRef.current = null
    }
  }, [currentUser, profileReady])

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
        <div className={styles.headerStart}>
          <h1 className={styles.title}>Leining App</h1>
          <a
            href="https://myshiurim.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.siteLink}
          >
            myshiurim.com
          </a>
        </div>
        <div className={styles.headerEnd}>
          {currentUser ? (
            <div className={styles.userInfo}>
              <span className={styles.userName}>👤 {getUserName()}</span>
              <button className={styles.authBtn} onClick={handleLogout}>יציאה</button>
            </div>
          ) : (
            <button className={styles.authBtn} disabled={!authReady} onClick={() => {
              login().catch((err: unknown) => {
                console.error('Login failed:', err)
                setSyncError(err instanceof Error ? err.message : String(err))
              })
            }}>
              👤 כניסה עם Pocket ID
            </button>
          )}
          <label className={styles.themeToggle}>
            <span>☀️</span>
            <input
              type="checkbox"
              checked={isLightTheme}
              onChange={(e) => setIsLightTheme(e.target.checked)}
              aria-label="Toggle light theme"
            />
          </label>
        </div>
      </header>

      {syncError && <div className={styles.syncError} role="alert">שגיאת התחברות או סנכרון: {syncError} <button onClick={() => window.location.reload()}>נסה שוב</button></div>}
      {authReady && (!currentUser || profileReady) && <div className={styles.workspace}>
      <Navigation
        onLoad={loadText}
        useRashiFont={useRashiFont}
        onRashiFontChange={setUseRashiFont}
        rashiFontSize={rashiFontSize}
        onRashiFontSizeChange={setRashiFontSize}
        currentBook={bookInfo.book || undefined}
        currentChapter={currentWord?.chapter ?? bookInfo.chapter}
        currentVerse={currentWord?.verse}
        parashaLoaded={!!currentParashaName && words.length > 0}
        seferTorahMode={isSeferTorahMode}
        onSeferTorahModeToggle={() => setIsSeferTorahMode((prev) => !prev)}
        hideScrollMarks={hideScrollMarks}
        onHideScrollMarksChange={setHideScrollMarks}
        delayedScrollMarks={delayedScrollMarks}
        onDelayedScrollMarksChange={setDelayedScrollMarks}
        scrollMarkDelay={scrollMarkDelay}
        onScrollMarkDelayChange={setScrollMarkDelay}
        revealAllTaamim={revealAllTaamim}
        onRevealAllTaamimToggle={() => setRevealAllTaamim((prev) => !prev)}
        showShvaNa={showShvaNa}
        onShowShvaNaChange={setShowShvaNa}
        showTaamVideo={showTaamVideo}
        onShowTaamVideoChange={handleTaamVideoChange}
      />

      <div className={`${styles.main} ${!useRashiFont ? styles.noSidebar : ''}`}>
        <div className={styles.textArea}>
          {loading && <div className={styles.loading}>טוען...</div>}
          {error && <div className={styles.error}>{error}</div>}
          {!loading && !error && (
            isSeferTorahMode ? (
              <SeferTorahDisplay
                words={words}
                currentWordIndex={currentWordIndex}
                onWordClick={handleWordClick}
                bookName={bookInfo.book}
                highlightedWords={highlightedWords}
                onToggleHighlight={handleToggleHighlight}
                revealAllTaamim={revealAllTaamim}
                hideMarks={hideScrollMarks}
                markDelay={delayedScrollMarks && validScrollMarkDelay ? parsedScrollMarkDelay : null}
              />
            ) : isRashiMode ? (
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
                  showShvaNa={showShvaNa}
                  bookName={bookInfo.book}
                  highlightedWords={highlightedWords}
                  onToggleHighlight={handleToggleHighlight}
                  rangeStartVerseKey={practiceVerseRange?.start}
                  rangeEndVerseKey={practiceVerseRange?.end}
                  onVerseClick={handleVerseClick}
                  revealAllTaamim={revealAllTaamim}
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

        {useRashiFont && (
          <aside className={styles.sidebar}>
            <RashiTextPanel
              text={rashiPracticeText}
              onTextChange={setRashiPracticeText}
            />
          </aside>
        )}
      </div>

      {showTaamVideo && !isRashiMode && (
        <TaamVideoPanel
          match={videoMatch}
          nextUrl={nextVideoUrl}
          msPerWord={speed}
          isPlaying={isPlaying}
        />
      )}

      <Controls
        isPlaying={isRashiMode ? rashiIsPlaying : isPlaying}
        speed={isRashiMode ? rashiSpeed : speed}
        wordCount={isRashiMode ? rashiWords.length : words.length}
        currentWordIndex={isRashiMode ? rashiCurrentWordIndex : currentWordIndex}
        onPlay={isRashiMode ? rashiPlay : play}
        onPause={isRashiMode ? rashiPause : pause}
        onSpeedChange={isRashiMode ? setRashiSpeed : handleSpeedChange}
      />
      </div>}

      <footer className={styles.footer}>
        <a
          href="https://www.sefaria.org"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sefariaLink}
        >
          <img src={sefariaLogo} alt="Powered by Sefaria" className={styles.sefariaLogo} />
        </a>
        {' | '}Visit on <a href="https://github.com/binyominzeev/leining-app" target="_blank" rel="noopener noreferrer" className={styles.sefariaLink}>
          GitHub
        </a>
      </footer>
    </div>
  )
}

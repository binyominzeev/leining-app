import { useEffect, useMemo, useRef, useState } from 'react'
import type { VerseBookmark, Word } from '../types'
import { parseSefariaResponse, stripDiacritics } from '../utils/hebrew'
import { fetchSefariaText, TANACH_BOOKS } from '../utils/sefaria'
import { bookmarkKey } from '../utils/bookmarks'
import { buildUrl } from '../utils/url'
import styles from './BookmarksPage.module.css'

type Props = {
  bookmarks: VerseBookmark[]
  ready: boolean
  loadFailed: boolean
  onRemove: (bookmark: VerseBookmark) => void
}

const chapterCache = new Map<string, Promise<Word[]>>()

function loadChapter(book: string, chapter: number): Promise<Word[]> {
  const key = JSON.stringify([book, chapter])
  const cached = chapterCache.get(key)
  if (cached) return cached
  const request = fetchSefariaText(`${book} ${chapter}`).then((data) => {
    const words = parseSefariaResponse(data.he, chapter, 1)
    if (!words.length) throw new Error('Empty chapter')
    return words
  }).catch((error: unknown) => {
    chapterCache.delete(key)
    throw error
  })
  chapterCache.set(key, request)
  return request
}

function BookmarkChapter({ book, chapter, bookmarks, onRemove }: {
  book: string
  chapter: number
  bookmarks: VerseBookmark[]
  onRemove: (bookmark: VerseBookmark) => void
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [words, setWords] = useState<Word[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section || visible) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setVisible(true)
    }, { rootMargin: '200px' })
    observer.observe(section)
    return () => observer.disconnect()
  }, [visible])

  useEffect(() => {
    if (!visible) return
    let active = true
    loadChapter(book, chapter).then((result) => {
      if (active) setWords(result)
    }).catch((error: unknown) => {
      console.error('Failed to load bookmarked verses:', error)
      if (active) setFailed(true)
    })
    return () => { active = false }
  }, [book, chapter, visible, attempt])

  return (
    <section ref={sectionRef} className={styles.chapter}>
      <h3>פרק {chapter}</h3>
      {failed && <div role="alert">לא ניתן לטעון את טקסט הפרק. <button type="button" onClick={() => { setFailed(false); setAttempt((n) => n + 1) }}>נסה שוב</button></div>}
      <ul className={styles.verses}>
        {bookmarks.map((bookmark) => {
          const text = words?.filter((word) => !word.breakType && word.verse === bookmark.verse).map((word) => word.full).join(' ')
          return (
            <li key={bookmarkKey(bookmark)} className={styles.verse}>
              <a href={buildUrl(book, chapter, bookmark.verse)} className={styles.verseLink}>
                <span className={styles.reference}>{chapter}:{bookmark.verse}</span>
                <span>{text || (words ? 'הפסוק אינו זמין' : failed ? 'הטקסט אינו זמין' : 'טוען טקסט...')}</span>
              </a>
              <button type="button" className={styles.remove} onClick={() => onRemove(bookmark)} aria-label={`הסר סימניה ${book} ${chapter}:${bookmark.verse}`} title="הסר סימניה">★</button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default function BookmarksPage({ bookmarks, ready, loadFailed, onRemove }: Props) {
  const [query, setQuery] = useState('')
  const groups = useMemo(() => {
    const search = stripDiacritics(query.toLowerCase()).trim()
    return TANACH_BOOKS.map((book) => ({
      ...book,
      bookmarks: bookmarks.filter((bookmark) => {
        const reference = `${bookmark.chapter}:${bookmark.verse}`
        return bookmark.book === book.name &&
          [book.name, book.hebrewName, reference, `${book.name} ${reference}`, `${book.hebrewName} ${reference}`]
            .some((value) => stripDiacritics(value.toLowerCase()).includes(search))
      })
        .sort((a, b) => a.chapter - b.chapter || a.verse - b.verse),
    })).filter((book) => book.bookmarks.length > 0)
  }, [bookmarks, query])

  return (
    <main className={styles.page} dir="rtl">
      <div className={styles.content}>
        <h2>פסוקים לתרגול</h2>
        <label className={styles.search}>
          חיפוש לפי ספר או מראה מקום
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {loadFailed ? <p>לא ניתן לטעון סימניות. נסו שוב.</p> : !ready ? <p>טוען סימניות...</p> : bookmarks.length === 0 ? (
          <p>עדיין אין פסוקים מסומנים. בחרו פסוק וסמנו אותו בכוכב.</p>
        ) : groups.length === 0 ? (
          <p>לא נמצאו פסוקים מתאימים.</p>
        ) : groups.map((group, index) => {
          const chapters = [...new Set(group.bookmarks.map((bookmark) => bookmark.chapter))]
          return (
            <details key={group.name} className={styles.book} open={index === 0 ? true : undefined}>
              <summary>{group.hebrewName} ({group.name}) — {group.bookmarks.length}</summary>
              {chapters.map((chapter) => (
                <BookmarkChapter key={chapter} book={group.name} chapter={chapter}
                  bookmarks={group.bookmarks.filter((bookmark) => bookmark.chapter === chapter)} onRemove={onRemove} />
              ))}
            </details>
          )
        })}
      </div>
    </main>
  )
}

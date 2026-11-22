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
      <h3>Chapter {chapter}</h3>
      {failed && <div role="alert">Could not load chapter text. <button type="button" onClick={() => { setFailed(false); setAttempt((n) => n + 1) }}>Retry</button></div>}
      <ul className={styles.verses}>
        {bookmarks.map((bookmark) => {
          const text = words?.filter((word) => !word.breakType && word.verse === bookmark.verse).map((word) => word.full).join(' ')
          return (
            <li key={bookmarkKey(bookmark)} className={styles.verse}>
              <a href={`${buildUrl(book, chapter, bookmark.verse)}?practice=1`} className={styles.verseLink}>
                <span className={styles.reference}>{chapter}:{bookmark.verse}</span>
                <span dir={text ? 'rtl' : 'ltr'} lang={text ? 'he' : 'en'}>{text || (words ? 'Verse unavailable' : failed ? 'Text unavailable' : 'Loading text...')}</span>
              </a>
              <button type="button" className={styles.remove} onClick={() => onRemove(bookmark)} aria-label={`Remove ${book} ${chapter}:${bookmark.verse} from favorites`} title="Remove from favorites">★</button>
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
    <main className={styles.page} dir="ltr">
      <div className={styles.content}>
        <h2>Favorite verses</h2>
        <label className={styles.search}>
          Search by book or reference
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        {loadFailed ? <p>Could not load favorites. Please retry.</p> : !ready ? <p>Loading favorites...</p> : bookmarks.length === 0 ? (
          <p>No favorite verses yet. Select a verse and add it with the star.</p>
        ) : groups.length === 0 ? (
          <p>No matching verses found.</p>
        ) : groups.map((group, index) => {
          const chapters = [...new Set(group.bookmarks.map((bookmark) => bookmark.chapter))]
          return (
            <details key={group.name} className={styles.book} open={index === 0 ? true : undefined}>
              <summary>{group.name} — {group.bookmarks.length}</summary>
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

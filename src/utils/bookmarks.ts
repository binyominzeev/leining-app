import type { VerseBookmark } from '../types'
import { TANACH_BOOKS } from './sefaria'

const STORAGE_KEY = 'leining_verse_bookmarks'

export function bookmarkKey(bookmark: VerseBookmark): string {
  return JSON.stringify([bookmark.book, bookmark.chapter, bookmark.verse])
}

export function isVerseBookmark(value: unknown): value is VerseBookmark {
  if (!value || typeof value !== 'object') return false
  const bookmark = value as Partial<VerseBookmark>
  const book = TANACH_BOOKS.find((item) => item.name === bookmark.book)
  return !!book && typeof bookmark.chapter === 'number' && Number.isSafeInteger(bookmark.chapter) &&
    bookmark.chapter >= 1 && bookmark.chapter <= book.chapters &&
    typeof bookmark.verse === 'number' && Number.isSafeInteger(bookmark.verse) &&
    bookmark.verse >= 1 && bookmark.verse <= 999
}

export function parseBookmarks(value: unknown): VerseBookmark[] {
  if (!Array.isArray(value) || !value.every(isVerseBookmark)) {
    throw new Error('Invalid saved verse bookmarks')
  }
  return [...new Map(value.map((bookmark) => [bookmarkKey(bookmark), bookmark])).values()]
}

export function loadLocalBookmarks(): VerseBookmark[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? parseBookmarks(JSON.parse(raw)) : []
}

export function saveLocalBookmarks(bookmarks: VerseBookmark[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
}

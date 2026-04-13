import { STATIC_PARASHOT } from './sefaria'

export type ParsedRoute = {
  parashaEn: string | null
  book: string | null
  chapter: number
  verse: number
}

/** Convert a parasha/book name to a URL segment (spaces → hyphens). */
export function nameToSlug(name: string): string {
  return name.replace(/ /g, '-')
}

/** Convert a URL slug back to a name (hyphens → spaces). */
export function slugToName(slug: string): string {
  return slug.replace(/-/g, ' ')
}

/** Build a URL path for the given name, chapter, and verse. */
export function buildUrl(name: string, chapter: number, verse: number): string {
  return `/${nameToSlug(name)}/${chapter}/${verse}`
}

/** Update the browser URL bar without adding a history entry. */
export function updateUrl(name: string, chapter: number, verse: number): void {
  const path = buildUrl(name, chapter, verse)
  window.history.replaceState(null, '', path)
}

/**
 * Parse the current URL pathname into route information.
 * Returns null if the pathname doesn't match the expected pattern.
 */
export function parseCurrentUrl(): ParsedRoute | null {
  const parts = window.location.pathname.split('/').filter(Boolean)
  if (parts.length < 3) return null

  const slug = parts[0]
  const chapter = parseInt(parts[1], 10)
  const verse = parseInt(parts[2], 10)

  if (isNaN(chapter) || isNaN(verse)) return null

  // Try to match a parasha name by comparing the slug against nameToSlug(p.en).
  // This correctly handles combined parashiyot like "Tazria-Metzora" whose
  // names already contain hyphens (slugToName would wrongly convert them to spaces).
  const parasha = STATIC_PARASHOT.find(
    (p) => nameToSlug(p.en).toLowerCase() === slug.toLowerCase(),
  )
  if (parasha) {
    return { parashaEn: parasha.en, book: null, chapter, verse }
  }

  // Otherwise treat the first segment as a book name for manual mode
  const name = slugToName(slug)
  return { parashaEn: null, book: name, chapter, verse }
}

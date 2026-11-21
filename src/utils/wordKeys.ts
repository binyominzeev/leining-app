import type { Word } from '../types'

export function getWordKeys(words: Word[], bookName: string): Map<number, string> {
  const keys = new Map<number, string>()
  const counts = new Map<string, number>()
  for (const word of words) {
    if (word.breakType) continue
    const verse = `${word.chapter ?? 0}:${word.verse ?? 0}`
    const position = counts.get(verse) ?? 0
    keys.set(word.index, `${bookName}|${word.chapter ?? 0}|${word.verse ?? 0}|${position}`)
    counts.set(verse, position + 1)
  }
  return keys
}

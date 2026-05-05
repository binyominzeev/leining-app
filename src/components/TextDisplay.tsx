import { Fragment, useLayoutEffect, useMemo, useRef } from 'react'
import type React from 'react'
import type { Word } from '../types'
import styles from './TextDisplay.module.css'

type Props = {
  words: Word[]
  currentWordIndex: number
  onWordClick: (index: number) => void
  useRashiFont?: boolean
  fontSize?: string
  rashiPractice?: boolean
  bookName?: string
  highlightedWords?: Set<string>
  onToggleHighlight?: (wordKey: string) => void
  revealAllTaamim?: boolean
  prevNav?: React.ReactNode
  nextNav?: React.ReactNode
}

export default function TextDisplay({ words, currentWordIndex, onWordClick, useRashiFont, fontSize, rashiPractice, bookName, highlightedWords, onToggleHighlight, revealAllTaamim, prevNav, nextNav }: Props) {
  const activeRef = useRef<HTMLSpanElement | null>(null)

  // Autoscroll: keep active word visible
  useLayoutEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentWordIndex])

  // Precompute each word's position within its verse for stable highlight keys
  const posInVerseMap = useMemo(() => {
    const map = new Map<number, number>()
    const counts = new Map<string, number>()
    for (const word of words) {
      if (word.breakType) continue
      const key = `${word.chapter ?? 0}:${word.verse ?? 0}`
      const pos = counts.get(key) ?? 0
      map.set(word.index, pos)
      counts.set(key, pos + 1)
    }
    return map
  }, [words])

  if (words.length === 0) {
    return <div className={styles.empty}>בחר קטע לקריאה</div>
  }

  return (
    <div className={[styles.container, useRashiFont ? styles.rashiFont : ''].filter(Boolean).join(' ')} style={fontSize ? { fontSize } : undefined} dir="rtl">
      {prevNav}
      {words.map((word) => {
        // Render paragraph markers as visual breaks
        if (word.breakType === 'petuchah') {
          return <span key={word.index} className={styles.petuchahBreak} />
        }
        if (word.breakType === 'setumah') {
          return <span key={word.index} className={styles.setumahBreak} />
        }
        // Render aliyah section markers (שני, שלישי, etc.)
        if (word.breakType === 'aliyah') {
          return <span key={word.index} className={styles.aliyahMarker}>{word.aliyahLabel}</span>
        }

        const isActive = word.index === currentWordIndex
        const isPast = word.index < currentWordIndex

        const displayText = rashiPractice
          ? (isActive ? word.full : word.plain)
          : (revealAllTaamim || isPast || isActive ? word.full : word.plain)

        const posInVerse = posInVerseMap.get(word.index) ?? 0
        const wordKey = `${bookName ?? ''}|${word.chapter ?? 0}|${word.verse ?? 0}|${posInVerse}`
        const isHighlighted = highlightedWords?.has(wordKey) ?? false

        return (
          <Fragment key={word.index}>
            <span
              ref={isActive ? activeRef : null}
              className={[
                styles.word,
                isActive ? styles.active : '',
                isPast ? styles.past : '',
                isActive && useRashiFont ? styles.normalFont : '',
                isHighlighted ? styles.highlighted : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onWordClick(word.index)}
              onContextMenu={(e) => {
                if (onToggleHighlight) {
                  e.preventDefault()
                  onToggleHighlight(wordKey)
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onWordClick(word.index)
                if (e.key === ' ') e.preventDefault()
              }}
            >
              {displayText}
            </span>
            {' '}
          </Fragment>
        )
      })}
      {nextNav}
    </div>
  )
}

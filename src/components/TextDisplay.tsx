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
  showShvaNa?: boolean
  bookName?: string
  highlightedWords?: Set<string>
  onToggleHighlight?: (wordKey: string) => void
  revealAllTaamim?: boolean
  prevNav?: React.ReactNode
  nextNav?: React.ReactNode
}

type TextCluster = {
  text: string
  letterIndex: number | null
}

function renderWithShvaNaHighlight(word: Word, displayText: string) {
  if (displayText !== word.full || !word.shvaAnnotations || word.shvaAnnotations.length === 0) {
    return displayText
  }

  const shvaNaLetterIndexes = new Set(
    word.shvaAnnotations
      .filter((item) => item.type === 'na' && item.letterIndex > 0)
      .map((item) => item.letterIndex),
  )

  if (shvaNaLetterIndexes.size === 0) return displayText

  const chars = Array.from(displayText)
  const clusters: TextCluster[] = []
  let letterCounter = -1

  for (const ch of chars) {
    const isLetter = /[\u05D0-\u05EA]/.test(ch)
    const isMark = /[\u0591-\u05C7]/.test(ch)

    if (isLetter) {
      letterCounter += 1
      clusters.push({ text: ch, letterIndex: letterCounter })
      continue
    }

    if (isMark && clusters.length > 0 && clusters[clusters.length - 1].letterIndex !== null) {
      clusters[clusters.length - 1].text += ch
      continue
    }

    clusters.push({ text: ch, letterIndex: null })
  }

  return clusters.map((cluster, idx) => {
    if (cluster.letterIndex !== null && shvaNaLetterIndexes.has(cluster.letterIndex)) {
      return (
        <span key={`cluster-${word.index}-${idx}`} className={styles.shvaNaOverline}>
          {cluster.text}
        </span>
      )
    }

    return <Fragment key={`cluster-${word.index}-${idx}`}>{cluster.text}</Fragment>
  })
}

export default function TextDisplay({ words, currentWordIndex, onWordClick, useRashiFont, fontSize, rashiPractice, showShvaNa, bookName, highlightedWords, onToggleHighlight, revealAllTaamim, prevNav, nextNav }: Props) {
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
        const content = showShvaNa && !rashiPractice
          ? renderWithShvaNaHighlight(word, displayText)
          : displayText

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
              {content}
            </span>
            {' '}
          </Fragment>
        )
      })}
      {nextNav}
    </div>
  )
}

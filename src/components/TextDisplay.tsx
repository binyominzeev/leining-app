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
  rangeStartVerseKey?: string | null
  rangeEndVerseKey?: string | null
  onVerseClick?: (verseKey: string) => void
  revealAllTaamim?: boolean
  prevNav?: React.ReactNode
  nextNav?: React.ReactNode
}

type TextCluster = {
  text: string
  letterIndex: number | null
}

type VerseMetadata = {
  key: string
  number: number
  order: number
  isStart: boolean
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

export default function TextDisplay({ words, currentWordIndex, onWordClick, useRashiFont, fontSize, rashiPractice, showShvaNa, bookName, highlightedWords, onToggleHighlight, rangeStartVerseKey, rangeEndVerseKey, onVerseClick, revealAllTaamim, prevNav, nextNav }: Props) {
  const activeRef = useRef<HTMLSpanElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const verseWordRefs = useRef(new Map<string, HTMLSpanElement>())
  const verseNumberRefs = useRef(new Map<string, HTMLButtonElement>())

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

  const verseMetadataMap = useMemo(() => {
    const map = new Map<number, VerseMetadata>()
    const orderByKey = new Map<string, number>()
    const seenKeys = new Set<string>()
    let nextOrder = 0

    for (const word of words) {
      if (word.breakType || word.verse === undefined) continue
      const key = `${word.chapter ?? 0}:${word.verse}`
      let order = orderByKey.get(key)
      if (order === undefined) {
        order = nextOrder++
        orderByKey.set(key, order)
      }
      map.set(word.index, {
        key,
        number: word.verse,
        order,
        isStart: !seenKeys.has(key),
      })
      seenKeys.add(key)
    }

    return { map, orderByKey }
  }, [words])

  const rangeStartOrder = rangeStartVerseKey
    ? verseMetadataMap.orderByKey.get(rangeStartVerseKey)
    : undefined
  const rangeEndOrder = rangeEndVerseKey
    ? verseMetadataMap.orderByKey.get(rangeEndVerseKey)
    : undefined

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateVerseNumberPositions = () => {
      const containerRect = container.getBoundingClientRect()
      for (const [key, numberElement] of verseNumberRefs.current) {
        const wordElement = verseWordRefs.current.get(key)
        if (!wordElement) continue
        const wordRect = wordElement.getBoundingClientRect()
        const top = wordRect.top - containerRect.top + container.scrollTop + wordRect.height * 0.18
        numberElement.style.top = `${top}px`
      }
    }

    updateVerseNumberPositions()
    const observer = new ResizeObserver(updateVerseNumberPositions)
    observer.observe(container)
    for (const wordElement of verseWordRefs.current.values()) {
      observer.observe(wordElement)
    }
    window.addEventListener('resize', updateVerseNumberPositions)
    document.fonts?.ready.then(updateVerseNumberPositions)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateVerseNumberPositions)
    }
  }, [words, currentWordIndex, fontSize, useRashiFont, rashiPractice, revealAllTaamim, showShvaNa])

  if (words.length === 0) {
    return <div className={styles.empty}>בחר קטע לקריאה</div>
  }

  return (
    <div
      ref={containerRef}
      className={[
        styles.container,
        useRashiFont ? styles.rashiFont : '',
        onVerseClick ? styles.withVerseGutter : '',
      ].filter(Boolean).join(' ')}
      style={fontSize ? { fontSize } : undefined}
      dir="rtl"
    >
      {prevNav}
      {words.map((word) => {
        if (word.breakType === 'petuchah') {
          return <span key={word.index} className={styles.petuchahBreak} />
        }
        if (word.breakType === 'setumah') {
          return <span key={word.index} className={styles.setumahBreak} />
        }
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
        const verseMetadata = verseMetadataMap.map.get(word.index)
        const isVerseInRange =
          verseMetadata !== undefined &&
          rangeStartOrder !== undefined &&
          rangeEndOrder !== undefined &&
          verseMetadata.order >= rangeStartOrder &&
          verseMetadata.order <= rangeEndOrder

        return (
          <Fragment key={word.index}>
            {verseMetadata?.isStart && (
              <button
                ref={(element) => {
                  if (element) verseNumberRefs.current.set(verseMetadata.key, element)
                  else verseNumberRefs.current.delete(verseMetadata.key)
                }}
                type="button"
                className={[
                  styles.verseNumber,
                  isVerseInRange ? styles.verseNumberSelected : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  if (rangeStartOrder !== undefined && verseMetadata.order >= rangeStartOrder) {
                    onVerseClick?.(verseMetadata.key)
                  }
                }}
                aria-label={`פסוק ${verseMetadata.number}`}
                aria-pressed={isVerseInRange}
              >
                <span className={styles.verseNumberLabel}>{verseMetadata.number}</span>
              </button>
            )}
            <span
              ref={(element) => {
                if (isActive) activeRef.current = element
                if (verseMetadata?.isStart) {
                  if (element) verseWordRefs.current.set(verseMetadata.key, element)
                  else verseWordRefs.current.delete(verseMetadata.key)
                }
              }}
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

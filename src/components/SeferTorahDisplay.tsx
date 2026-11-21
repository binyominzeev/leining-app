import { Fragment, useLayoutEffect, useMemo, useRef } from 'react'
import type { Word } from '../types'
import { getWordKeys } from '../utils/wordKeys'
import styles from './SeferTorahDisplay.module.css'

type Props = {
  words: Word[]
  currentWordIndex: number
  onWordClick: (index: number) => void
  bookName: string
  highlightedWords: Set<string>
  onToggleHighlight: (key: string) => void
  revealAllTaamim: boolean
  hideMarks: boolean
  markDelay: number | null
}

const COLUMN_WIDTH_PX = 280
const COLUMN_GAP_PX = 32
const APPROX_WORDS_PER_COLUMN = 65

export default function SeferTorahDisplay({ words, currentWordIndex, onWordClick, bookName, highlightedWords, onToggleHighlight, revealAllTaamim, hideMarks, markDelay }: Props) {
  const activeRef = useRef<HTMLSpanElement | null>(null)
  const wordKeys = useMemo(() => getWordKeys(words, bookName), [words, bookName])
  const wordOrder = useMemo(() => {
    const order = new Map<number, number>()
    for (const word of words) {
      if (!word.breakType) order.set(word.index, order.size)
    }
    return order
  }, [words])
  const currentOrder = wordOrder.get(currentWordIndex) ??
    words.filter((word) => !word.breakType && word.index < currentWordIndex).length - 1
  useLayoutEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [currentWordIndex])
  // Estimate container width based on word/break count so CSS columns have room to expand
  const containerWidth = useMemo(() => {
    let realWordCount = 0
    let petuchahCount = 0
    for (const w of words) {
      if (!w.breakType) realWordCount++
      else if (w.breakType === 'petuchah') petuchahCount++
    }
    // Each petuchah break consumes roughly a full line of space
    const estimated = realWordCount + petuchahCount * 8
    const numColumns = Math.max(3, Math.ceil(estimated / APPROX_WORDS_PER_COLUMN))
    return numColumns * (COLUMN_WIDTH_PX + COLUMN_GAP_PX)
  }, [words])

  if (words.length === 0) {
    return <div className={styles.empty}>בחר קטע לקריאה</div>
  }

  return (
    <div className={styles.scrollWrapper}>
      <div
        className={styles.columnsContent}
        style={{ width: `${containerWidth}px` }}
      >
        {words.map((word) => {
          if (word.breakType === 'petuchah') {
            return <span key={word.index} className={styles.petuchahBreak} />
          }
          if (word.breakType === 'setumah') {
            return <span key={word.index} className={styles.setumahBreak} />
          }
          if (word.breakType === 'aliyah') {
            return (
              <span key={word.index} className={styles.aliyahMarker}>
                {word.aliyahLabel}
              </span>
            )
          }
          const isActive = word.index === currentWordIndex
          const isPast = word.index < currentWordIndex
          const wordKey = wordKeys.get(word.index) ?? ''
          const order = wordOrder.get(word.index) ?? 0
          const showMarks = hideMarks
            ? markDelay !== null && isPast && order <= currentOrder - markDelay
            : revealAllTaamim || isPast || isActive
          return (
            <Fragment key={word.index}>
              <span
                ref={isActive ? activeRef : undefined}
                className={[styles.word, isActive ? styles.active : '', isPast ? styles.past : '', highlightedWords.has(wordKey) ? styles.highlighted : ''].filter(Boolean).join(' ')}
                onClick={() => onWordClick(word.index)}
                onContextMenu={(event) => { event.preventDefault(); onToggleHighlight(wordKey) }}
                role="button"
                aria-label={showMarks ? word.full : word.plain}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onWordClick(word.index)
                  if (event.key === ' ') event.preventDefault()
                }}
              >
                {showMarks ? word.full : (
                  <span className={styles.preview}>
                    <span className={styles.plain}>{word.plain}</span>
                    <span className={styles.full} aria-hidden="true">{word.full}</span>
                  </span>
                )}
              </span>
              {' '}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

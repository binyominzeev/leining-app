import { Fragment, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
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
  fontScale: number
}

export default function SeferTorahDisplay({ words, currentWordIndex, onWordClick, bookName, highlightedWords, onToggleHighlight, revealAllTaamim, hideMarks, markDelay, fontScale }: Props) {
  const activeRef = useRef<HTMLSpanElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const [hoveredWord, setHoveredWord] = useState<{ element: HTMLSpanElement; text: string } | null>(null)
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
  useLayoutEffect(() => {
    if (!hoveredWord || !tooltipRef.current) return
    const tooltip = tooltipRef.current
    const updatePosition = () => {
      const { element } = hoveredWord
      if (!element.isConnected || !element.matches(':hover')) {
        setHoveredWord(null)
        return
      }
      tooltip.style.fontSize = `${parseFloat(getComputedStyle(element).fontSize) * 1.5}px`
      const wordRect = element.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      const margin = 8
      const left = Math.max(margin, Math.min(
        wordRect.left + wordRect.width / 2 - tooltipRect.width / 2,
        document.documentElement.clientWidth - tooltipRect.width - margin,
      ))
      const above = wordRect.top - tooltipRect.height - margin
      const top = above >= margin ? above : wordRect.bottom + margin
      tooltip.style.left = `${left}px`
      tooltip.style.top = `${Math.max(margin, Math.min(top, document.documentElement.clientHeight - tooltipRect.height - margin))}px`
      tooltip.style.visibility = 'visible'
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [hoveredWord, fontScale, words, currentWordIndex, hideMarks, markDelay, revealAllTaamim])
  const fontStyle: CSSProperties & { '--sefer-font-scale': number } = { '--sefer-font-scale': fontScale / 100 }

  if (words.length === 0) {
    return <div className={styles.empty}>בחר קטע לקריאה</div>
  }

  return (
    <div className={styles.scrollWrapper}>
      <div
        className={styles.columnsContent}
        style={fontStyle}
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
                onMouseEnter={(event) => {
                  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                    setHoveredWord({ element: event.currentTarget, text: word.full })
                  }
                }}
                onMouseLeave={() => setHoveredWord(null)}
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
      {hoveredWord && createPortal(
        <div ref={tooltipRef} className={styles.wordTooltip} dir="rtl" aria-hidden="true">
          {hoveredWord.text}
        </div>,
        document.body,
      )}
    </div>
  )
}

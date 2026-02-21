import { useEffect, useRef } from 'react'
import type { Word } from '../types'
import styles from './TextDisplay.module.css'

type Props = {
  words: Word[]
  currentWordIndex: number
  onWordClick: (index: number) => void
}

export default function TextDisplay({ words, currentWordIndex, onWordClick }: Props) {
  const activeRef = useRef<HTMLSpanElement | null>(null)

  // Autoscroll: keep active word visible
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentWordIndex])

  if (words.length === 0) {
    return <div className={styles.empty}>בחר קטע לקריאה</div>
  }

  return (
    <div className={styles.container} dir="rtl">
      {words.map((word) => {
        const isActive = word.index === currentWordIndex
        const isPast = word.index < currentWordIndex

        const displayText = isPast || isActive ? word.full : word.plain

        return (
          <span
            key={word.index}
            ref={isActive ? activeRef : null}
            className={[
              styles.word,
              isActive ? styles.active : '',
              isPast ? styles.past : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onWordClick(word.index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onWordClick(word.index)
            }}
          >
            {displayText}
          </span>
        )
      })}
    </div>
  )
}

import { Fragment, useEffect, useRef } from 'react'
import type { Word } from '../types'
import styles from './TextDisplay.module.css'

type Props = {
  words: Word[]
  currentWordIndex: number
  onWordClick: (index: number) => void
  useRashiFont?: boolean
  fontSize?: string
  rashiPractice?: boolean
}

export default function TextDisplay({ words, currentWordIndex, onWordClick, useRashiFont, fontSize, rashiPractice }: Props) {
  const activeRef = useRef<HTMLSpanElement | null>(null)

  // Autoscroll: keep active word visible
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentWordIndex])

  if (words.length === 0) {
    return <div className={styles.empty}>בחר קטע לקריאה</div>
  }

  return (
    <div className={[styles.container, useRashiFont ? styles.rashiFont : ''].filter(Boolean).join(' ')} style={fontSize ? { fontSize } : undefined} dir="rtl">
      {words.map((word) => {
        const isActive = word.index === currentWordIndex
        const isPast = word.index < currentWordIndex

        const displayText = rashiPractice
          ? (isActive ? word.full : word.plain)
          : (isPast || isActive ? word.full : word.plain)

        return (
          <Fragment key={word.index}>
            <span
              ref={isActive ? activeRef : null}
              className={[
                styles.word,
                isActive ? styles.active : '',
                isPast ? styles.past : '',
                isActive && useRashiFont ? styles.normalFont : '',
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
            {' '}
          </Fragment>
        )
      })}
    </div>
  )
}

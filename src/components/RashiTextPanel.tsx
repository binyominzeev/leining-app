import { useState, useMemo, useEffect } from 'react'
import { parseVerseText } from '../utils/hebrew'
import styles from './RashiTextPanel.module.css'

type Props = {
  text: string
  onTextChange: (text: string) => void
}

export default function RashiTextPanel({ text, onTextChange }: Props) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)

  const words = useMemo(() => {
    if (!text.trim()) return []
    return parseVerseText(text)
  }, [text])

  // Reset word index when text changes
  useEffect(() => {
    setCurrentWordIndex(0)
  }, [text])

  return (
    <div className={styles.panel}>
      <div className={styles.label}>תרגול רש״י</div>
      <textarea
        className={styles.textarea}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="הדבק כאן טקסט רש״י עם ניקוד..."
        dir="rtl"
        rows={4}
      />
      {words.length > 0 && (
        <div className={styles.wordDisplay} dir="rtl">
          {words.map((word) => {
            const isActive = word.index === currentWordIndex
            const isPast = word.index < currentWordIndex
            const displayText = isPast || isActive ? word.full : word.plain
            return (
              <span
                key={word.index}
                className={[
                  styles.word,
                  isActive ? styles.active : '',
                  isPast ? styles.past : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setCurrentWordIndex(word.index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setCurrentWordIndex(word.index)
                }}
              >
                {displayText}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

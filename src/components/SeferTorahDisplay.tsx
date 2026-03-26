import { useMemo } from 'react'
import type { Word } from '../types'
import styles from './SeferTorahDisplay.module.css'

type Props = {
  words: Word[]
}

const COLUMN_WIDTH_PX = 280
const COLUMN_GAP_PX = 32
const APPROX_WORDS_PER_COLUMN = 65

export default function SeferTorahDisplay({ words }: Props) {
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
          return (
            <span key={word.index} className={styles.word}>
              {word.plain}{' '}
            </span>
          )
        })}
      </div>
    </div>
  )
}

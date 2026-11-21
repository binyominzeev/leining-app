import { useMemo, useRef } from 'react'
import type { Word } from '../types'
import { getWordKeys } from '../utils/wordKeys'
import styles from './AliyahStatsDialog.module.css'

type Props = {
  parashaName: string
  words: Word[]
  bookName: string
  highlightedWords: Set<string>
}

type AliyahStats = {
  label: string
  highlightedCount: number
  totalCount: number
}

export default function AliyahStatsDialog({ parashaName, words, bookName, highlightedWords }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const stats = useMemo(() => {
    const wordKeys = getWordKeys(words, bookName)
    const sections: AliyahStats[] = [{ label: 'ראשון', highlightedCount: 0, totalCount: 0 }]

    for (const word of words) {
      if (word.breakType === 'aliyah') {
        sections.push({
          label: word.aliyahLabel ?? `עלייה ${sections.length + 1}`,
          highlightedCount: 0,
          totalCount: 0,
        })
        continue
      }
      if (word.breakType) continue

      const section = sections[sections.length - 1]
      section.totalCount += 1
      const wordKey = wordKeys.get(word.index)
      if (wordKey && highlightedWords.has(wordKey)) section.highlightedCount += 1
    }

    return sections
  }, [words, bookName, highlightedWords])
  const hasAliyahBoundaries = stats.length > 1

  return (
    <>
      <button
        type="button"
        className={styles.statsButton}
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
      >
        📊 סטטיסטיקת הדגשות
      </button>
      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="aliyah-stats-title" dir="rtl">
        <div className={styles.dialogHeader}>
          <h2 id="aliyah-stats-title">סטטיסטיקת הדגשות — {parashaName}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => dialogRef.current?.close()}
            aria-label="סגור"
          >
            ×
          </button>
        </div>
        {hasAliyahBoundaries ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">עלייה</th>
                  <th scope="col">מסומנות</th>
                  <th scope="col">סה״כ מילים</th>
                  <th scope="col">אחוז</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((aliyah) => {
                  const percentage = aliyah.totalCount
                    ? (aliyah.highlightedCount / aliyah.totalCount) * 100
                    : 0
                  return (
                    <tr key={aliyah.label}>
                      <th scope="row">{aliyah.label}</th>
                      <td>{aliyah.highlightedCount}</td>
                      <td>{aliyah.totalCount}</td>
                      <td>{percentage.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.unavailable}>
            חלוקת העליות אינה זמינה לקריאה זו, ולכן לא ניתן להציג סטטיסטיקה לפי עלייה.
          </p>
        )}
      </dialog>
    </>
  )
}

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
    const sections: AliyahStats[] = [{ label: 'First', highlightedCount: 0, totalCount: 0 }]

    for (const word of words) {
      if (word.breakType === 'aliyah') {
        sections.push({
          label: word.aliyahLabel ?? `Aliyah ${sections.length + 1}`,
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
        aria-label="Highlight statistics"
      >
        📊 <span className={styles.fullLabel}>Highlight statistics</span><span className={styles.shortLabel}>Stats</span>
      </button>
      <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="aliyah-stats-title" dir="ltr">
        <div className={styles.dialogHeader}>
          <h2 id="aliyah-stats-title">Highlight statistics — {parashaName}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {hasAliyahBoundaries ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Aliyah</th>
                  <th scope="col">Highlighted</th>
                  <th scope="col">Total words</th>
                  <th scope="col">Percent</th>
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
            Aliyah divisions are unavailable for this reading, so statistics by aliyah cannot be displayed.
          </p>
        )}
      </dialog>
    </>
  )
}

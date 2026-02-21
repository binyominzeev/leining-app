import type { Word } from '../types'
import { getTaamImage, TAAM_NAMES } from '../utils/taamim'
import styles from './TaamPanel.module.css'

type Props = {
  word: Word | null
}

export default function TaamPanel({ word }: Props) {
  const taam = word?.taam ?? null
  const imageName = getTaamImage(taam)
  const imageUrl = `/taamim/${imageName}`
  const name = taam ? (TAAM_NAMES[taam] ?? taam) : '—'
  const fullWord = word?.full ?? ''

  return (
    <div className={styles.panel}>
      <div className={styles.wordDisplay}>{fullWord || '\u00A0'}</div>
      <div className={styles.taamImage}>
        <img
          src={imageUrl}
          alt={name}
          onError={(e) => {
            const img = e.currentTarget
            img.style.display = 'none'
            img.nextElementSibling?.classList.remove(styles.hidden)
          }}
        />
        <span className={styles.hidden + ' ' + styles.taamChar}>{taam ?? '◌'}</span>
      </div>
      <div className={styles.taamName}>{name}</div>
    </div>
  )
}

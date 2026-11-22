import styles from './RashiTextPanel.module.css'

type Props = {
  text: string
  onTextChange: (text: string) => void
}

export default function RashiTextPanel({ text, onTextChange }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.label}>Rashi practice</div>
      <textarea
        className={styles.textarea}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Paste vocalized Rashi text here..."
        dir="rtl"
        lang="he"
        rows={4}
      />
    </div>
  )
}

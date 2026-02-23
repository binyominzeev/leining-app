import styles from './RashiTextPanel.module.css'

type Props = {
  text: string
  onTextChange: (text: string) => void
}

export default function RashiTextPanel({ text, onTextChange }: Props) {
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
    </div>
  )
}

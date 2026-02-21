import styles from './Controls.module.css'

type Props = {
  isPlaying: boolean
  speed: number
  onPlay: () => void
  onPause: () => void
  onSpeedChange: (speed: number) => void
}

const MIN_SPEED = 300
const MAX_SPEED = 2000

export default function Controls({ isPlaying, speed, onPlay, onPause, onSpeedChange }: Props) {
  return (
    <div className={styles.controls}>
      <button
        className={styles.playBtn}
        onClick={isPlaying ? onPause : onPlay}
        aria-label={isPlaying ? 'עצור' : 'נגן'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div className={styles.speedControl}>
        <label className={styles.speedLabel} htmlFor="speed-slider">
          מהירות
        </label>
        <input
          id="speed-slider"
          type="range"
          min={MIN_SPEED}
          max={MAX_SPEED}
          step={50}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className={styles.slider}
        />
        <span className={styles.speedValue}>{speed} ms</span>
      </div>
    </div>
  )
}

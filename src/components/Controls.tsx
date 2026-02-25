import { useState } from 'react'
import { MIN_WPM, MAX_WPM, wpmToMs, msToWpm } from '../config/playbackConfig'
import styles from './Controls.module.css'

type Props = {
  isPlaying: boolean
  speed: number
  wordCount: number
  currentWordIndex: number
  onPlay: () => void
  onPause: () => void
  onSpeedChange: (speed: number) => void
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function Controls({ isPlaying, speed, wordCount, currentWordIndex, onPlay, onPause, onSpeedChange }: Props) {
  const [showRemaining, setShowRemaining] = useState(false)

  const wpm = msToWpm(speed)
  const totalMs = wordCount * speed
  const elapsedMs = currentWordIndex * speed
  const remainingMs = totalMs - elapsedMs

  const timeLabel = showRemaining
    ? `${formatTime(remainingMs)} / ${formatTime(totalMs)}`
    : `${formatTime(elapsedMs)} / ${formatTime(totalMs)}`

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
        <div className={styles.speedInfo}>
          <span
            className={styles.timeDisplay}
            onClick={() => setShowRemaining((prev) => !prev)}
            title={showRemaining ? 'הצג זמן שעבר' : 'הצג זמן נותר'}
          >
            {timeLabel}
          </span>
          <span className={styles.wpmDisplay}>{wpm} WPM</span>
        </div>
        <input
          id="speed-slider"
          type="range"
          min={MIN_WPM}
          max={MAX_WPM}
          step={1}
          value={wpm}
          onChange={(e) => onSpeedChange(wpmToMs(Number(e.target.value)))}
          className={styles.slider}
        />
      </div>
    </div>
  )
}

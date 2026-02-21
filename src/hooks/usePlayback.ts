import { useCallback, useEffect, useRef, useState } from 'react'
import type { Word } from '../types'

type UsePlaybackOptions = {
  words: Word[]
  speed: number
  onWordChange: (index: number) => void
}

type UsePlaybackReturn = {
  currentWordIndex: number
  isPlaying: boolean
  speed: number
  setCurrentWordIndex: (index: number) => void
  setSpeed: (speed: number) => void
  play: () => void
  pause: () => void
  toggle: () => void
}

export function usePlayback({ words, speed: initialSpeed, onWordChange }: UsePlaybackOptions): UsePlaybackReturn {
  const [currentWordIndex, setCurrentWordIndexState] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(initialSpeed)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentIndexRef = useRef(currentWordIndex)
  const isPlayingRef = useRef(isPlaying)
  const speedRef = useRef(speed)

  useEffect(() => { currentIndexRef.current = currentWordIndex }, [currentWordIndex])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { speedRef.current = speed }, [speed])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const advance = useCallback(() => {
    if (!isPlayingRef.current) return
    const next = currentIndexRef.current + 1
    if (next >= words.length) {
      setIsPlaying(false)
      return
    }
    setCurrentWordIndexState(next)
    onWordChange(next)
    timerRef.current = setTimeout(advance, speedRef.current)
  }, [words.length, onWordChange])

  const play = useCallback(() => {
    if (currentIndexRef.current >= words.length - 1) return
    setIsPlaying(true)
    isPlayingRef.current = true
    timerRef.current = setTimeout(advance, speedRef.current)
  }, [words.length, advance])

  const pause = useCallback(() => {
    clearTimer()
    setIsPlaying(false)
    isPlayingRef.current = false
  }, [clearTimer])

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause()
    } else {
      play()
    }
  }, [play, pause])

  // Restart timer when speed changes while playing
  useEffect(() => {
    if (isPlaying) {
      clearTimer()
      timerRef.current = setTimeout(advance, speed)
    }
    return () => { clearTimer() }
  }, [speed, isPlaying, advance, clearTimer])

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), [clearTimer])

  const setCurrentWordIndex = useCallback((index: number) => {
    clearTimer()
    setCurrentWordIndexState(index)
    onWordChange(index)
    if (isPlayingRef.current) {
      timerRef.current = setTimeout(advance, speedRef.current)
    }
  }, [clearTimer, onWordChange, advance])

  return {
    currentWordIndex,
    isPlaying,
    speed,
    setCurrentWordIndex,
    setSpeed,
    play,
    pause,
    toggle,
  }
}

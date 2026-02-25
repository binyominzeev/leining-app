// Configurable speed limits for the playback slider (in words per minute)
export const MIN_WPM = 10
export const MAX_WPM = 180

/** Convert words-per-minute to milliseconds-per-word */
export function wpmToMs(wpm: number): number {
  return Math.round(60000 / wpm)
}

/** Convert milliseconds-per-word to words-per-minute */
export function msToWpm(ms: number): number {
  return Math.round(60000 / ms)
}

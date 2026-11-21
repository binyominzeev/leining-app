export const DEFAULT_SCROLL_FONT_SCALE = 100
export const MIN_SCROLL_FONT_SCALE = 50
export const MAX_SCROLL_FONT_SCALE = 200
export const SCROLL_FONT_SCALE_STEP = 10

export function validScrollFontScale(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_SCROLL_FONT_SCALE && value <= MAX_SCROLL_FONT_SCALE
}

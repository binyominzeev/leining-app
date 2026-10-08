export type Word = {
  index: number
  plain: string
  full: string
  taam: string | null
  shvaAnnotations?: ShvaAnnotation[]
  revealed: boolean
  chapter?: number
  verse?: number
  breakType?: 'petuchah' | 'setumah' | 'aliyah'
  aliyahLabel?: string
}

export type ShvaType = 'na' | 'nach' | 'uncertain'

export type ShvaConfidence = 'high' | 'medium'

export type ShvaAnnotation = {
  charIndex: number
  letterIndex: number
  type: ShvaType
  confidence: ShvaConfidence
  rule: string
}

export type PlaybackState = {
  currentWordIndex: number
  isPlaying: boolean
  speed: number
}

export type ReadingPosition = {
  book: string
  chapter: number
  verse: number
  wordIndex: number
}

export type VerseRange = {
  startVerse: number
  endVerse: number
}

export type NavigationSelection = {
  book: string
  chapter: number
  verseRange: VerseRange
}

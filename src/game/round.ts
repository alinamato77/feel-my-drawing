export interface GuessRecord {
  /** Attempt number (1, or 2 after the bonus round). */
  snapshot: number
  text: string
  correct: boolean
}

export type Screen =
  | 'home'
  | 'howto'
  | 'roles'
  | 'feel-draw'
  | 'sending'
  | 'feel-handoff'
  | 'feel-guess'
  | 'feel-back'
  | 'feel-bonus'
  | 'guess-play'
  | 'validate'
  | 'reward'
  | 'out'

export const IDLE_SLEEP_MS = 60 * 60 * 1000

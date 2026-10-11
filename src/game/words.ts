export const WORDS = [
  'CAT', 'HOUSE', 'SUN', 'HEART', 'STAR',
  'FISH', 'TREE', 'FLOWER', 'APPLE', 'CAR',
  'CUP', 'MOON', 'CLOUD', 'UMBRELLA', 'KEY',
  'BOAT', 'BIRD', 'SNAKE', 'CLOCK', 'MOUNTAIN',
] as const

export type Word = (typeof WORDS)[number]

/** Pick a random word, avoiding an immediate repeat of the previous one. */
export function randomWord(previous?: string): Word {
  let word: Word
  do {
    word = WORDS[Math.floor(Math.random() * WORDS.length)]
  } while (word === previous && WORDS.length > 1)
  return word
}

/** Case-insensitive match that also ignores surrounding spaces and punctuation. */
export function isCorrectGuess(guess: string, word: string) {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z]/g, '')
  const g = norm(guess)
  const w = norm(word)
  // Accept simple plurals: "cats", "boxes".
  return g !== '' && (g === w || g === `${w}s` || g === `${w}es`)
}

/** Words speech recognisers often return instead of a bank word. */
const SOUNDS_LIKE: Record<string, string> = {
  son: 'SUN', sunday: 'SUN', flour: 'FLOWER', kee: 'KEY', ki: 'KEY', quay: 'KEY', hart: 'HEART',
  heard: 'BIRD', bert: 'BIRD', clog: 'CLOCK', cap: 'CUP', bolt: 'BOAT', snack: 'SNAKE', trea: 'TREE',
}

/**
 * Turn recogniser alternatives into one guess. Prefers any alternative that is
 * a word from the bank (it never favours the answer over other bank words),
 * then the recogniser's best guess. Returns '' when nothing was heard.
 */
export function pickSpokenGuess(alternatives: string[]): string {
  const words = alternatives.map((a) => a.toLowerCase().replace(/[^a-z ]/g, '').trim().split(/\s+/).pop() ?? '').filter(Boolean)
  for (const w of words) {
    if ((WORDS as readonly string[]).includes(w.toUpperCase())) return w.toUpperCase()
    if (SOUNDS_LIKE[w]) return SOUNDS_LIKE[w]
    // Simple plurals: "cats" → CAT.
    if (w.endsWith('s') && (WORDS as readonly string[]).includes(w.slice(0, -1).toUpperCase())) return w.slice(0, -1).toUpperCase()
  }
  return words[0]?.toUpperCase() ?? ''
}

/** Yes / no from a spoken answer, or null if unclear. */
export function spokenYesNo(alternatives: string[]): boolean | null {
  const text = alternatives.join(' ').toLowerCase()
  if (/\b(yes|yeah|yep|correct|confirm|right|sure|ok|okay)\b/.test(text)) return true
  if (/\b(no|nope|nah|wrong|again|retry)\b/.test(text)) return false
  return null
}

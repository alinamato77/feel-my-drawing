/**
 * The one prompt used by both modes, the design principle, the research
 * credit, and answer checking.
 */

export const SCENE = 'A man is playing the guitar.'

export const MODE1_ARTIST_INSTRUCTION = 'Draw the man and his guitar. Keep the outlines clear.'
export const BONUS_INSTRUCTION = 'You have 10 more seconds on a blank board. Draw the beats of the guitar as a clue.'
export const MODE2_ARTIST_INSTRUCTION = 'Draw a man playing the guitar.'

/** The key design principle for tactile drawing. */
export const PRINCIPLE = 'Preserve meaningful outlines, not every visual detail.'

export const CREDIT =
  'Inspired by tactile drawing research, including John M. Kennedy (2014), “Tactile Drawing Aesthetics and a Blind Woman’s Drawings of Sounds.”'

// ── Answer checking ────────────────────────────────────────────────────────

/** Explicit accepted answers (normalised: lower case, letters and spaces only). */
export const ACCEPTED_ANSWERS = [
  'a man is playing the guitar',
  'a man is humming while playing the guitar',
  'a man humming while playing guitar',
  'a man playing guitar',
  'a man playing the guitar',
  'someone playing the guitar',
  'someone playing guitar',
  'a man singing and playing guitar',
  'a guitarist humming',
  'someone making music with a guitar',
  'man playing guitar',
  'playing guitar',
  'guitar player',
  'a guitarist',
]

export const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const GUITAR = new Set(['guitar', 'guitars', 'guitarist', 'guitarists'])
const MUSIC_ACTION = new Set([
  'play', 'plays', 'playing', 'played', 'player', 'strum', 'strums', 'strumming', 'pluck', 'plucking',
  'hum', 'hums', 'humming', 'sing', 'sings', 'singing', 'music', 'musical', 'perform', 'performing', 'serenade', 'serenading',
])

/**
 * A guess is correct if it is on the accepted list, or if it names the guitar
 * and a musical action (or “guitarist”, which implies both). No external AI.
 */
export function checkSceneGuess(guess: string): boolean {
  const g = normalise(guess)
  if (!g) return false
  if (ACCEPTED_ANSWERS.includes(g)) return true
  const words = g.split(' ')
  const hasGuitar = words.some((w) => GUITAR.has(w))
  const hasAction = words.some((w) => MUSIC_ACTION.has(w))
  const guitarist = words.some((w) => w.startsWith('guitarist'))
  return guitarist || (hasGuitar && hasAction)
}

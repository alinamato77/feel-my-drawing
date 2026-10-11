export type ModeId = 'draw-feel' | 'draw-guess'

export interface Mode {
  id: ModeId
  number: string
  title: string
  description: string
  direction: string
  roles: { a: string; b: string }
}

/** Two role-based modes, one scene. */
export const MODES: Record<ModeId, Mode> = {
  'draw-feel': {
    id: 'draw-feel',
    number: '01',
    title: 'You draw, I feel',
    description: 'A sighted player draws. A blind player feels and guesses.',
    direction: 'Sight → drawing → touch',
    roles: { a: 'Sighted Artist', b: 'Blind Guesser' },
  },
  'draw-guess': {
    id: 'draw-guess',
    number: '02',
    title: 'I draw, you guess',
    description: 'A blind player draws. A sighted player sees and guesses.',
    direction: 'Drawing → sight',
    roles: { a: 'Blind Artist', b: 'Sighted Guesser' },
  },
}

export const otherMode = (m: ModeId): ModeId => (m === 'draw-feel' ? 'draw-guess' : 'draw-feel')

/** Timings in seconds. */
export const TIMING = { feelDraw: 30, feelBonus: 10, guessDraw: 90 }

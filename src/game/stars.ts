/**
 * Three-star validation: stars depend on which snapshot Player B guessed on.
 *   Snapshot 1 → ★★★   Snapshot 2 → ★★   Snapshot 3 → ★   never → 0
 */
export type Stars = 0 | 1 | 2 | 3

export const starsForSnapshot = (snapshot: number | null): Stars => (snapshot === null ? 0 : (Math.max(0, 4 - snapshot) as Stars))

export const STAR_COPY: Record<Stars, { title: string; line: string }> = {
  3: { title: 'PERFECT TOUCH!', line: 'You guessed it from the first sketch!' },
  2: { title: 'GREAT JOB!', line: 'You recognised the drawing with a little help!' },
  1: { title: 'NICE SAVE!', line: 'You got it just in time!' },
  0: { title: 'NOT THIS TIME!', line: 'Every drawing tells a story. Try again!' },
}

/** Puzzle pieces earned: one for any correct round, plus one for a perfect touch, plus the mode bonus. */
export const piecesFor = (stars: Stars, modeBonus: number) => (stars === 0 ? 0 : 1 + (stars === 3 ? 1 : 0) + modeBonus)

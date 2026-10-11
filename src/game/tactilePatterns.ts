import type { Frame } from '../dotpad/tactileQueue'
import type { Bitmap } from '../shapes/types'
import { MAX_HEARTS } from './hearts'
import type { Stars } from './stars'
import { COLS, ROWS } from './strokes'

/**
 * Raised-pin feedback patterns. The Dot Pad has no vibration motor we rely on,
 * so every reaction is a short sequence of pin pictures (few frames, because
 * the display needs about a second per refresh).
 */

const blank = (): Bitmap => Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0))
const set = (b: Bitmap, x: number, y: number) => {
  if (x >= 0 && x < COLS && y >= 0 && y < ROWS) b[Math.round(y)][Math.round(x)] = 1
}
function rect(b: Bitmap, x0: number, y0: number, x1: number, y1: number) {
  for (let x = x0; x <= x1; x++) {
    set(b, x, y0)
    set(b, x, y1)
  }
  for (let y = y0; y <= y1; y++) {
    set(b, x0, y)
    set(b, x1, y)
  }
}
function line(b: Bitmap, x0: number, y0: number, x1: number, y1: number, w = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    const y = y0 + ((y1 - y0) * i) / n
    for (let d = 0; d < w; d++) set(b, x + d, y)
  }
}
/** Stamp a text bitmap ('#' = raised) with its top-left at (x, y). */
function stamp(b: Bitmap, art: readonly string[], x: number, y: number) {
  art.forEach((row, dy) => [...row].forEach((c, dx) => c === '#' && set(b, x + dx, y + dy)))
}

const STAR = [
  '.....#.....',
  '.....#.....',
  '....###....',
  '#####.#####',
  '.##.....##.',
  '..##...##..',
  '..#.....#..',
  '.#...#...#.',
  '.#.##.##.#.',
  '##.......##',
]
const STAR_FILLED = [
  '.....#.....',
  '....###....',
  '....###....',
  '###########',
  '.#########.',
  '..#######..',
  '..#######..',
  '.#########.',
  '.####.####.',
  '###.....###',
]
const HEART_SMALL = ['.#.#.', '#####', '#####', '.###.', '..#..']
const HEART_EMPTY = ['.#.#.', '#.#.#', '#...#', '.#.#.', '..#..']
const HEART_BIG = [
  '...####.....####...',
  '..######...######..',
  '.########.########.',
  '###################',
  '###################',
  '###################',
  '.#################.',
  '..###############..',
  '...#############...',
  '....###########....',
  '.....#########.....',
  '......#######......',
  '.......#####.......',
  '........###........',
  '.........#.........',
]
const SKULL = [
  '....#########....',
  '..#############..',
  '.###############.',
  '#################',
  '###...#####...###',
  '###...#####...###',
  '###...#####...###',
  '#################',
  '#######...#######',
  '.######...######.',
  '..#############..',
  '...#.#.#.#.#.#...',
  '...#.#.#.#.#.#...',
  '...###########...',
]

/** Stars earned (filled) out of three, plus the heart pool along the bottom. */
export function summaryBitmap(stars: Stars, hearts: number): Bitmap {
  const b = blank()
  for (let i = 0; i < 3; i++) stamp(b, i < stars ? STAR_FILLED : STAR, 9 + i * 15, 6)
  for (let i = 0; i < MAX_HEARTS; i++) stamp(b, i < hearts ? HEART_SMALL : HEART_EMPTY, 1 + i * 6, 31)
  return b
}

export function heartBitmap(): Bitmap {
  const b = blank()
  stamp(b, HEART_BIG, 20, 12)
  return b
}

export function brokenHeartBitmap(): Bitmap {
  const b = heartBitmap()
  // A zig-zag crack splits the heart in two.
  const crack: [number, number][] = [[29, 12], [27, 16], [31, 19], [27, 22], [30, 25], [29, 27]]
  for (let i = 0; i < crack.length - 1; i++)
    for (let w = -1; w <= 1; w++) {
      const [x0, y0] = crack[i]
      const [x1, y1] = crack[i + 1]
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2
      for (let k = 0; k <= n; k++) b[Math.round(y0 + ((y1 - y0) * k) / n)][Math.round(x0 + ((x1 - x0) * k) / n) + w] = 0
    }
  return b
}

function checkBitmap(): Bitmap {
  const b = blank()
  line(b, 18, 21, 26, 29, 3)
  line(b, 26, 29, 42, 9, 3)
  return b
}

function crossBitmap(): Bitmap {
  const b = blank()
  line(b, 19, 8, 39, 32, 3)
  line(b, 39, 8, 19, 32, 3)
  return b
}

/** Concentric frames growing from the centre, for the 3-star celebration. */
function burst(step: number): Bitmap {
  const b = blank()
  for (let k = 0; k <= step; k++) {
    const w = 4 + k * 7
    const h = 2 + k * 5
    rect(b, 30 - w, 20 - h, 29 + w, 19 + h)
  }
  return b
}

function diamonds(): Bitmap {
  const b = blank()
  for (const cx of [17, 42]) for (let r = 0; r < 9; r++) {
    set(b, cx - r, 20 - (8 - r)); set(b, cx + r, 20 - (8 - r)); set(b, cx - r, 20 + (8 - r)); set(b, cx + r, 20 + (8 - r))
  }
  return b
}

export function gameOverBitmap(): Bitmap {
  const b = blank()
  stamp(b, SKULL, 21, 4)
  rect(b, 0, 0, COLS - 1, ROWS - 1)
  rect(b, 2, 2, COLS - 3, ROWS - 3)
  return b
}

// ── Sequences ────────────────────────────────────────────────────────────

/** Reward for the stars earned, ending on the stars + hearts summary. */
export function starsSequence(stars: Stars, hearts: number): Frame[] {
  const summary = { bitmap: summaryBitmap(stars, hearts), hold: 1500 }
  if (stars === 3) return [0, 1, 2, 3].map((s) => ({ bitmap: burst(s), hold: 0 })).concat([{ bitmap: checkBitmap(), hold: 600 }, summary])
  if (stars === 2) return [{ bitmap: checkBitmap(), hold: 700 }, { bitmap: diamonds(), hold: 700 }, summary]
  if (stars === 1) return [{ bitmap: checkBitmap(), hold: 900 }, summary]
  // Wrong: a short, recognisable warning — the cross shown twice.
  return [{ bitmap: crossBitmap(), hold: 400 }, { bitmap: blank(), hold: 0 }, { bitmap: crossBitmap(), hold: 600 }, summary]
}

export const heartLostSequence = (hearts: number): Frame[] => [
  { bitmap: heartBitmap(), hold: 500 },
  { bitmap: brokenHeartBitmap(), hold: 1200 },
  { bitmap: summaryBitmap(0, hearts), hold: 0 },
]
export const heartRestoredSequence = (): Frame[] => [{ bitmap: heartBitmap(), hold: 1500 }]
export const gameOverSequence = (): Frame[] => [{ bitmap: gameOverBitmap(), hold: 0 }]

/** Labels for the on-screen mirror of each reaction. */
export const PATTERN_NAMES = {
  stars: ['Warning cross', 'Confirmation tick', 'Tick + diamonds', 'Expanding frames'],
  heartLost: 'Broken heart',
  heartRestored: 'Heart',
  gameOver: 'Skull frame',
} as const

/** A simplified guitar silhouette for the Tactile Introduction (original drawing). */
export function guitarBitmap(): Bitmap {
  const b = blank()
  // Body: the union of a large and a small bout, lying on its side; only its outer edge is raised.
  const inBody = (x: number, y: number) =>
    ((x - 14) / 11) ** 2 + ((y - 20) / 14) ** 2 <= 1 || ((x - 30) / 8.5) ** 2 + ((y - 20) / 10.5) ** 2 <= 1
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      if (!inBody(x, y)) continue
      const edge = !inBody(x - 1, y) || !inBody(x + 1, y) || !inBody(x, y - 1) || !inBody(x, y + 1)
      if (edge) set(b, x, y)
    }
  // Sound hole in the large bout.
  for (let a = 0; a < 360; a += 4) {
    const t = (a * Math.PI) / 180
    set(b, 17 + Math.cos(t) * 3.5, 20 + Math.sin(t) * 3.5)
  }
  // Bridge.
  line(b, 8, 17, 8, 23)
  // Neck: two rails from the body to the headstock.
  line(b, 39, 18, 50, 18)
  line(b, 39, 22, 50, 22)
  // Headstock with tuning pegs.
  rect(b, 50, 15, 57, 25)
  for (const y of [17, 20, 23]) {
    set(b, 49, y)
    set(b, 58, y)
  }
  return b
}

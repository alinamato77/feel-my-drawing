import type { Bitmap } from '../shapes/types'
import { COLS, ROWS } from './strokes'
import { MONSTER_ROWS } from './monsterData'

/** The prize monsters, in the order they are won. */
export const MONSTERS = [
  { id: 'cyclops', name: 'the Cyclops', description: 'a round monster with one huge eye, two horns, arms waving up, a mouth of zigzag teeth, and flat feet' },
  { id: 'ghost', name: 'the Ghost', description: 'a floating ghost with a wavy hem, two oval eyes, a round "ooo" mouth, and floaty arms' },
  { id: 'box monster', name: 'the Box Monster', description: 'a square monster with three eyes in a row, two antennae, a zigzag mouth, and two block legs' },
  { id: 'octopus', name: 'the Octopus', description: 'a round head with two eyes and a little smile, and five wavy tentacles spreading out below' },
  { id: 'bat', name: 'the Bat', description: 'a small round body with big pointed wings, pointy ears, a grin with two fangs, and little legs' },
] as const

export const PIECES = 9
const COL_EDGES = [0, 20, 40, 60]
const ROW_EDGES = [0, 13, 27, 40]

export function monsterBitmap(index: number): Bitmap {
  const rows = MONSTER_ROWS[MONSTERS[index % MONSTERS.length].id]
  return rows.map((hex) => {
    const bits = BigInt('0x' + hex).toString(2).padStart(COLS, '0')
    return Array.from(bits, (b) => (b === '1' ? 1 : 0))
  })
}

/** Pin rectangle of a piece (0–8, row by row). */
export function pieceBounds(piece: number) {
  const r = Math.floor(piece / 3)
  const c = piece % 3
  return { x0: COL_EDGES[c], x1: COL_EDGES[c + 1], y0: ROW_EDGES[r], y1: ROW_EDGES[r + 1] }
}

export function pieceName(piece: number) {
  const row = ['top', 'middle', 'bottom'][Math.floor(piece / 3)]
  const col = ['on the left', 'in the centre', 'on the right'][piece % 3]
  return piece === 4 ? 'very middle' : `${row} row, ${col}`
}

/**
 * The puzzle as felt on the Dot Pad: won pieces show the monster; each missing
 * piece shows a small hollow square at its centre, so the gaps can be counted.
 */
export function puzzleBitmap(monster: number, won: readonly number[]): Bitmap {
  const full = monsterBitmap(monster)
  const out: Bitmap = Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0))
  for (let p = 0; p < PIECES; p++) {
    const b = pieceBounds(p)
    if (won.includes(p)) {
      for (let y = b.y0; y < b.y1; y++) for (let x = b.x0; x < b.x1; x++) out[y][x] = full[y][x]
    } else {
      const cx = Math.floor((b.x0 + b.x1) / 2) - 1
      const cy = Math.floor((b.y0 + b.y1) / 2) - 1
      for (let y = cy; y < cy + 3; y++) for (let x = cx; x < cx + 3; x++) if (y !== cy + 1 || x !== cx + 1) out[y][x] = 1
    }
  }
  return out
}

// ── Progress (saved in this browser so the collection survives a reload) ──

export interface Progress {
  /** Index into MONSTERS of the puzzle being collected. */
  monster: number
  /** Pieces won so far, in the order they were won. */
  won: number[]
  /** Monsters completed. */
  completed: number[]
}

const KEY = 'feel-my-drawing:prize'
export const FRESH: Progress = { monster: 0, won: [], completed: [] }

export function loadProgress(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Progress | null
    return p && Array.isArray(p.won) ? p : FRESH
  } catch {
    return FRESH
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // Storage unavailable (private window): progress lasts for this visit only.
  }
}

export interface Award {
  monster: number
  piece: number
  won: number[]
  complete: boolean
  next: Progress
}

/** Award one random missing piece. Completing the puzzle moves on to the next monster. */
export function awardPiece(p: Progress): Award {
  const missing = Array.from({ length: PIECES }, (_, i) => i).filter((i) => !p.won.includes(i))
  const piece = missing[Math.floor(Math.random() * missing.length)]
  const won = [...p.won, piece]
  const complete = won.length === PIECES
  const next: Progress = complete
    ? { monster: (p.monster + 1) % MONSTERS.length, won: [], completed: [...p.completed, p.monster] }
    : { ...p, won }
  return { monster: p.monster, piece, won, complete, next }
}

/** Award several pieces in a row; a completed puzzle rolls over into the next monster. */
export function awardPieces(p: Progress, count: number): { awards: Award[]; next: Progress } {
  const awards: Award[] = []
  let next = p
  for (let i = 0; i < count; i++) {
    const a = awardPiece(next)
    awards.push(a)
    next = a.next
  }
  return { awards, next }
}

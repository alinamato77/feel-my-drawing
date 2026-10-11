import { DOT_PAD } from '../dotpad/config'
import type { Bitmap } from '../shapes/types'

/** A pin on the Dot Pad grid: column 0–59, row 0–39. */
export type Pin = readonly [x: number, y: number]
/** One continuous stroke = the pins it raised, in order (kept for Undo). */
export type Stroke = Pin[]

export const COLS = DOT_PAD.pinsWide
export const ROWS = DOT_PAD.pinsTall

/** Every pin on the straight line between two pins (Bresenham), so fast strokes have no gaps. */
export function pinsBetween([x0, y0]: Pin, [x1, y1]: Pin): Pin[] {
  const out: Pin[] = []
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  let x = x0
  let y = y0
  for (;;) {
    out.push([x, y])
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
  }
  return out
}

/** The drawing exactly as raised on the Dot Pad: what Player A sees is what Player B feels. */
export function strokesToBitmap(strokes: Stroke[]): Bitmap {
  const bitmap: Bitmap = Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0))
  for (const s of strokes) for (const [x, y] of s) if (x >= 0 && x < COLS && y >= 0 && y < ROWS) bitmap[y][x] = 1
  return bitmap
}

export const raisedCount = (b: Bitmap) => b.reduce((n, row) => n + row.reduce((a, v) => a + v, 0), 0)

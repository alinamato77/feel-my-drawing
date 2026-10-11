import { useEffect, useRef, useState } from 'react'
import { PIECES, monsterBitmap, pieceBounds } from '../game/prize'
import { COLS, ROWS } from '../game/strokes'

const TINTS = ['#d7261e', '#f1c40f', '#1f4fa3', '#f7f5ef', '#f1c40f', '#d7261e', '#1f4fa3', '#f7f5ef', '#d7261e']

interface PuzzleViewProps {
  monster: number
  won: readonly number[]
  /** The piece just won, outlined. */
  fresh?: number | null
  label: string
}

/**
 * The prize puzzle for people watching: won pieces show the monster's pins on a
 * Mondrian colour block; missing pieces are grey with a question mark. When all
 * nine are won it reads as a finished painting.
 */
export function PuzzleView({ monster, won, fresh = null, label }: PuzzleViewProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !width) return
    const cell = width / COLS
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(cell * ROWS * dpr)
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const full = monsterBitmap(monster)
    for (let p = 0; p < PIECES; p++) {
      const b = pieceBounds(p)
      const x = b.x0 * cell
      const y = b.y0 * cell
      const w = (b.x1 - b.x0) * cell
      const h = (b.y1 - b.y0) * cell
      if (won.includes(p)) {
        ctx.fillStyle = TINTS[p]
        ctx.fillRect(x, y, w, h)
        const ink = TINTS[p] === '#1f4fa3' || TINTS[p] === '#d7261e' ? '#ffffff' : '#111111'
        ctx.fillStyle = ink
        for (let yy = b.y0; yy < b.y1; yy++)
          for (let xx = b.x0; xx < b.x1; xx++) if (full[yy][xx]) ctx.fillRect(xx * cell + cell * 0.08, yy * cell + cell * 0.08, cell * 0.84, cell * 0.84)
      } else {
        ctx.fillStyle = '#cfcabe'
        ctx.fillRect(x, y, w, h)
        ctx.fillStyle = '#8d887c'
        ctx.font = `700 ${h * 0.55}px "Silkscreen", monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('?', x + w / 2, y + h / 2 + h * 0.04)
      }
      // Black Mondrian lines between pieces.
      ctx.strokeStyle = '#111111'
      ctx.lineWidth = Math.max(3, cell * 0.5)
      ctx.strokeRect(x, y, w, h)
    }
    if (fresh !== null) {
      const b = pieceBounds(fresh)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = Math.max(3, cell * 0.4)
      ctx.setLineDash([cell, cell * 0.6])
      ctx.strokeRect(b.x0 * cell + cell * 0.6, b.y0 * cell + cell * 0.6, (b.x1 - b.x0 - 1.2) * cell, (b.y1 - b.y0 - 1.2) * cell)
    }
  }, [monster, won, fresh, width])

  return (
    <div ref={wrap} className="px-box-lg bg-ink">
      <canvas ref={ref} role="img" aria-label={label} className="block w-full" style={{ aspectRatio: `${COLS} / ${ROWS}` }} />
    </div>
  )
}

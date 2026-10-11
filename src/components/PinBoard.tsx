import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { COLS, ROWS, pinsBetween, raisedCount, strokesToBitmap } from '../game/strokes'
import type { Pin, Stroke } from '../game/strokes'
import type { Bitmap } from '../shapes/types'

interface PinBoardProps {
  strokes: Stroke[]
  onChange?: (strokes: Stroke[]) => void
  /** Show a finished bitmap instead of editable strokes. */
  bitmap?: Bitmap
  label?: string
}

const GAP = 0.16 // fraction of a cell left between pins

/**
 * A simulated Dot Pad: 60 × 40 small square pins. Drawing raises pins directly,
 * so the board shows exactly what will be felt. Mouse, trackpad, pen and touch
 * all work; with the keyboard, arrows move one pin and Space lifts/lowers the pen.
 */
export function PinBoard({ strokes, onChange, bitmap, label }: PinBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [current, setCurrent] = useState<Stroke | null>(null)
  const [hover, setHover] = useState<Pin | null>(null)
  const [cursor, setCursor] = useState<Pin>([30, 20])
  const [keyboard, setKeyboard] = useState(false)
  const [penDown, setPenDown] = useState(false)
  const editable = !!onChange
  const shown = bitmap ?? strokesToBitmap(current ? [...strokes, current] : strokes)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Paint the pins: lowered = flat light squares, raised = dark cubes with a highlight.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width === 0) return
    const cell = width / COLS
    const height = cell * ROWS
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#e4e0d6'
    ctx.fillRect(0, 0, width, height)
    const g = cell * GAP
    const size = cell - g
    const marker = keyboard && editable ? cursor : hover
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const px = x * cell + g / 2
        const py = y * cell + g / 2
        if (shown[y][x]) {
          ctx.fillStyle = '#111111'
          ctx.fillRect(px, py, size, size)
          ctx.fillStyle = 'rgb(255 255 255 / 0.28)' // top-left highlight: reads as a raised cube
          ctx.fillRect(px, py, size, size * 0.28)
          ctx.fillRect(px, py, size * 0.28, size)
        } else {
          ctx.fillStyle = '#f7f5ef'
          ctx.fillRect(px, py, size, size)
        }
      }
    }
    if (marker && editable) {
      ctx.strokeStyle = penDown ? '#d7261e' : '#1f4fa3'
      ctx.lineWidth = Math.max(2, cell * 0.18)
      ctx.strokeRect(marker[0] * cell + 1, marker[1] * cell + 1, cell - 2, cell - 2)
    }
  }, [shown, width, hover, cursor, keyboard, penDown, editable])

  const toPin = (e: PointerEvent<HTMLCanvasElement>): Pin => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = Math.floor(((e.clientX - r.left) / r.width) * COLS)
    const y = Math.floor(((e.clientY - r.top) / r.height) * ROWS)
    return [Math.min(COLS - 1, Math.max(0, x)), Math.min(ROWS - 1, Math.max(0, y))]
  }

  const extend = (stroke: Stroke, p: Pin): Stroke => {
    const last = stroke[stroke.length - 1]
    if (last && last[0] === p[0] && last[1] === p[1]) return stroke
    return last ? [...stroke, ...pinsBetween(last, p).slice(1)] : [p]
  }

  const finish = () => {
    if (current?.length) onChange?.([...strokes, current])
    setCurrent(null)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLCanvasElement>) => {
    if (!editable) return
    const steps: Record<string, Pin> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    if (e.key in steps) {
      e.preventDefault()
      setKeyboard(true)
      const n = e.shiftKey ? 4 : 1
      const next: Pin = [Math.min(COLS - 1, Math.max(0, cursor[0] + steps[e.key][0] * n)), Math.min(ROWS - 1, Math.max(0, cursor[1] + steps[e.key][1] * n))]
      setCursor(next)
      if (penDown) setCurrent((c) => extend(c ?? [cursor], next))
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      setKeyboard(true)
      if (penDown) finish()
      else setCurrent([cursor])
      setPenDown(!penDown)
    }
  }

  const count = raisedCount(shown)

  return (
    <div ref={wrapRef} className="w-full px-box bg-[#e4e0d6] p-1">
      <canvas
        ref={canvasRef}
        tabIndex={editable ? 0 : -1}
        role="img"
        aria-label={label ?? `Simulated Dot Pad, ${COLS} by ${ROWS} pins, ${count} raised. Draw with a mouse or trackpad; keyboard: arrows move one pin, Space puts the pen down or lifts it.`}
        className={`block w-full touch-none ${editable ? 'cursor-crosshair' : ''}`}
        style={{ aspectRatio: `${COLS} / ${ROWS}` }}
        onPointerDown={(e) => {
          if (!editable || (e.pointerType === 'mouse' && e.button !== 0)) return
          e.currentTarget.setPointerCapture(e.pointerId)
          setKeyboard(false)
          setCurrent([toPin(e)])
        }}
        onPointerMove={(e) => {
          if (!editable) return
          const p = toPin(e)
          setHover(p)
          if (current) setCurrent(extend(current, p))
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (penDown) {
            finish()
            setPenDown(false)
          }
        }}
      />
    </div>
  )
}

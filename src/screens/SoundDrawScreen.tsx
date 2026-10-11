import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../components/Button'
import { Principles } from '../components/Credit'
import { PinBoard } from '../components/PinBoard'
import { PixelIcon } from '../components/PixelIcon'
import { ScreenHeading } from '../components/ScreenHeading'
import type { DotPadAdapter } from '../dotpad/DotPadAdapter'
import type { TactileQueue } from '../dotpad/tactileQueue'
import { TIMING } from '../game/modes'
import { MODE2_ARTIST_INSTRUCTION } from '../game/scene'
import { playSound, speak, stopSpeaking } from '../game/speech'
import { strokesToBitmap } from '../game/strokes'
import type { Stroke } from '../game/strokes'
import type { Bitmap } from '../shapes/types'

type Phase = 'intro' | 'drawing' | 'locked'

interface SoundDrawScreenProps {
  adapter: DotPadAdapter
  queue: TactileQueue
  onGuess: (guess: string, drawing: Bitmap) => void
}

/**
 * Mode 2 — I DRAW, YOU GUESS, on one shared screen. The prompt is only spoken
 * (never shown) so the sighted Guesser can't read it. 90 s of drawing with the
 * existing input, then the finished drawing and one final guess.
 */
export function SoundDrawScreen({ adapter, queue, onGuess }: SoundDrawScreenProps) {
  const total = TIMING.guessDraw
  const [phase, setPhase] = useState<Phase>('intro')
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [typed, setTyped] = useState('')
  const [final, setFinal] = useState<Bitmap | null>(null)
  const strokesRef = useRef(strokes)
  useEffect(() => {
    strokesRef.current = strokes
  }, [strokes])

  const readPrompt = useCallback(() => {
    void speak(`Player A, your prompt: ${MODE2_ARTIST_INSTRUCTION} You have 90 seconds. Press F1 on the Dot Pad, or Start, to begin.`)
  }, [])

  const start = useCallback(() => {
    if (phase !== 'intro') return
    stopSpeaking()
    playSound('stage')
    void speak('Start drawing. You have 90 seconds.')
    setPhase('drawing')
  }, [phase])

  useEffect(() => () => stopSpeaking(), [])
  useEffect(() => adapter.onKey?.((k) => (k === 'KeyFunction1' ? start() : undefined)), [adapter, start])

  // One 90 s clock; lock at the end.
  useEffect(() => {
    if (phase !== 'drawing') return
    const t0 = performance.now()
    let last = -1
    const id = window.setInterval(() => {
      const t = Math.min(total, (performance.now() - t0) / 1000)
      setElapsed(t)
      const left = Math.ceil(total - t)
      if (left !== last) {
        last = left
        if (left === 60 || left === 30 || left === 10) void speak(`${left} seconds left.`)
        if (left <= 3 && left > 0) playSound('tick')
      }
      if (t >= total) {
        window.clearInterval(id)
        const bitmap = strokesToBitmap(strokesRef.current)
        setFinal(bitmap)
        setPhase('locked')
        playSound('send')
        // The Artist can feel the finished drawing on the Dot Pad.
        void queue.show(bitmap)
        void speak('Time’s up. Your drawing is on the Dot Pad. Player B, what does it show?')
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [phase, total, queue])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (typed.trim() && final) onGuess(typed.trim(), final)
  }

  const left = Math.max(0, Math.ceil(total - elapsed))

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-6 md:grid-cols-12 md:px-10">
      <section className="flex flex-col gap-4 md:col-span-8" aria-label="Drawing">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label">Player A · Blind Artist</p>
            <ScreenHeading className="mt-2 text-xl uppercase md:text-3xl">{phase === 'locked' ? 'The finished drawing' : 'Draw the prompt'}</ScreenHeading>
          </div>
          <div className={`px-box flex items-center gap-4 p-3 ${phase === 'drawing' && left <= 3 ? 'bg-red text-white' : 'bg-card'}`}>
            <p className="label">{phase === 'intro' ? '90 seconds' : 'Time left'}</p>
            <motion.span key={left} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="font-pixel text-4xl tabular-nums" aria-label={`${left} seconds left`}>
              {left}
            </motion.span>
          </div>
        </div>
        <div className="relative">
          <PinBoard strokes={strokes} onChange={phase === 'drawing' ? setStrokes : undefined} bitmap={phase === 'locked' && final ? final : undefined} />
          {phase === 'intro' && (
            <div aria-hidden="true" className="absolute inset-0 grid place-items-center bg-ink/30">
              <PixelIcon name="play" size={56} className="text-white" />
            </div>
          )}
        </div>
        <p className="px-box-sm bg-bad-soft p-3 text-sm text-bad">
          <strong className="font-pixel text-[10px] uppercase">Prototype limitation</strong> — this demo does not yet offer drawing input a blind person can use independently. The keyboard pen (Tab to the board, arrows move one pin, Space puts the pen down or lifts it) works without a mouse but gives no audio or tactile position feedback, so the artist may need support.
        </p>
      </section>

      <aside className="flex flex-col gap-4 md:col-span-4">
        {phase === 'intro' && (
          <>
            <p className="px-box bg-yellow p-4 text-lg leading-snug">
              <strong className="font-pixel text-[10px] uppercase">Player B</strong>
              <br />
              Please look away and cover your ears while the prompt is read to Player A.
            </p>
            <Button variant="secondary" size="lg" onClick={readPrompt}>
              <PixelIcon name="speaker" size={18} /> Read the prompt to Player A
            </Button>
            <Button variant="red" size="lg" onClick={start}>
              Start (F1) <PixelIcon name="play" size={16} />
            </Button>
            <Principles compact />
          </>
        )}

        {phase === 'drawing' && (
          <p className="px-box bg-card p-5 text-lg leading-snug">
            <strong className="font-pixel text-[10px] uppercase">Player B · Sighted Guesser</strong>
            <br />
            Watch the drawing. You answer when the time is up.
          </p>
        )}

        {phase === 'locked' && (
          <form onSubmit={submit} className="px-box flex flex-col gap-3 bg-card p-5">
            <label htmlFor="sight-guess" className="label">
              Player B — your final answer
            </label>
            <input id="sight-guess" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoFocus className="font-minion px-box-sm min-h-14 bg-white px-4 text-xl" />
            <Button type="submit" variant="blue" size="md" disabled={!typed.trim()}>
              Submit answer <PixelIcon name="send" size={16} />
            </Button>
          </form>
        )}
      </aside>
    </main>
  )
}

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { PinBoard } from '../components/PinBoard'
import { PixelIcon } from '../components/PixelIcon'
import { ScreenHeading } from '../components/ScreenHeading'
import { BONUS_INSTRUCTION, MODE1_ARTIST_INSTRUCTION, SCENE } from '../game/scene'
import { playSound } from '../game/speech'
import type { Stroke } from '../game/strokes'

interface ArtistFeelScreenProps {
  /** Beat-clue round: 10 s on a blank board (baseStrokes = []). */
  bonus: boolean
  seconds: number
  baseStrokes: Stroke[]
  onDone: (strokes: Stroke[]) => void
}

/**
 * Mode 1, the sighted Artist. Shows the scene only to the Artist; the timer
 * starts when they press Ready. The beat-clue round uses a blank board: the clue
 * is a separate picture for the guesser, not an edit of the first drawing.
 */
export function ArtistFeelScreen({ bonus, seconds, baseStrokes, onDone }: ArtistFeelScreenProps) {
  const [ready, setReady] = useState(false)
  const [strokes, setStrokes] = useState<Stroke[]>(baseStrokes)
  const [left, setLeft] = useState(seconds)
  const [locked, setLocked] = useState(false)
  const strokesRef = useRef(strokes)
  const done = useRef(false)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    strokesRef.current = strokes
  }, [strokes])
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    setLocked(true)
    playSound('send')
    window.setTimeout(() => onDoneRef.current(strokesRef.current), 600)
  }, [])

  // Single countdown from the moment the Artist is ready.
  useEffect(() => {
    if (!ready) return
    const start = performance.now()
    let last = -1
    const id = window.setInterval(() => {
      const t = Math.min(seconds, (performance.now() - start) / 1000)
      const remaining = seconds - t
      setLeft(remaining)
      const s = Math.ceil(remaining)
      if (s !== last) {
        last = s
        if (s <= 3 && s > 0) playSound('tick')
      }
      if (remaining <= 0) {
        window.clearInterval(id)
        finish()
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [ready, seconds, finish])

  const secs = Math.max(0, Math.ceil(left))
  const urgent = ready && !locked && secs <= 3

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 md:px-10">
      <div className="grid gap-6 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <p className="label">Player A · Sighted Artist{bonus ? ' · Beat clue' : ''}</p>
          <ScreenHeading className="mt-2 text-xl uppercase md:text-3xl">{bonus ? 'Draw the beats' : 'Your prompt'}</ScreenHeading>
          <p className="font-minion px-box mt-3 inline-block bg-card px-5 py-3 text-2xl leading-snug text-red md:text-3xl">{SCENE}</p>
          <p className="font-minion mt-3 max-w-2xl text-xl">{bonus ? BONUS_INSTRUCTION : MODE1_ARTIST_INSTRUCTION}</p>
        </div>
        <div className={`px-box flex items-center justify-between gap-4 p-4 md:col-span-4 ${urgent ? 'bg-red text-white' : 'bg-card'}`}>
          <p className="label">{ready ? 'Time left' : `${seconds} seconds`}</p>
          <motion.span key={secs} initial={{ scale: urgent ? 1.8 : 1.2 }} animate={{ scale: 1 }} className="font-pixel text-5xl tabular-nums" aria-label={`${secs} seconds left`}>
            {secs}
          </motion.span>
        </div>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-12">
        <div className="relative md:col-span-9">
          <PinBoard strokes={strokes} onChange={ready && !locked ? setStrokes : undefined} />
          <AnimatePresence>
            {!ready && (
              <motion.div aria-hidden="true" className="absolute inset-0 grid place-items-center bg-ink/30" exit={{ opacity: 0 }}>
                <PixelIcon name="play" size={56} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>
          {locked && (
            <div aria-hidden="true" className="absolute inset-0 grid place-items-center bg-ink/40">
              <span className="px-box bg-green p-4 text-white">
                <PixelIcon name="check" size={48} />
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 md:col-span-3">
          {!ready ? (
            <Button variant="red" size="lg" onClick={() => setReady(true)} autoFocus>
              Ready to draw <PixelIcon name="play" size={16} />
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setStrokes((s) => (s.length > baseStrokes.length ? s.slice(0, -1) : s))} disabled={locked || strokes.length <= baseStrokes.length}>
                <PixelIcon name="undo" size={18} /> Undo
              </Button>
              {baseStrokes.length === 0 && (
                <Button variant="secondary" onClick={() => setStrokes([])} disabled={locked || strokes.length === 0}>
                  <PixelIcon name="cross" size={16} /> Clear
                </Button>
              )}
            </>
          )}
          <p className="text-sm text-muted">
            {bonus ? 'Blank board. Your first drawing is kept separately — the guesser can feel both.' : 'At zero the drawing is sent to the Dot Pad.'} No letters, numbers or words.
          </p>
        </div>
      </div>
    </main>
  )
}

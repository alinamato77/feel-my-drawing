import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../components/Button'
import { Confetti, HeartsBar, StarRow, TactileMirror } from '../components/GameBits'
import { PinBoard } from '../components/PinBoard'
import { PixelIcon } from '../components/PixelIcon'
import { ScreenHeading } from '../components/ScreenHeading'
import type { DotPadAdapter } from '../dotpad/DotPadAdapter'
import type { TactileQueue } from '../dotpad/tactileQueue'
import { MAX_HEARTS } from '../game/hearts'
import { playSound, speak, stopSpeaking } from '../game/speech'
import { STAR_COPY } from '../game/stars'
import type { Stars } from '../game/stars'
import { PATTERN_NAMES, heartLostSequence, starsSequence, summaryBitmap } from '../game/tactilePatterns'
import type { Bitmap } from '../shapes/types'
import type { GuessRecord } from '../game/round'

interface ValidationScreenProps {
  adapter: DotPadAdapter
  queue: TactileQueue
  prompt: string
  guesses: GuessRecord[]
  stars: Stars
  drawing: Bitmap
  /** Optional beat clue (Mode 1 final guess). */
  clue?: Bitmap | null
  heartsBefore: number
  heartsAfter: number
  pieces: number
  /** e.g. "Round 2 of 3 · Private Concert". */
  roundLabel: string
  /** Short educational message for this round. */
  takeaway: string
  /** Label for the continue button when there is no reward. */
  nextLabel: string
  onNext: () => void
  onHome?: () => void
}

export function ValidationScreen({ adapter, queue, prompt, guesses, stars, drawing, clue, heartsBefore, heartsAfter, pieces, roundLabel, takeaway, nextLabel: plainNext, onNext, onHome }: ValidationScreenProps) {
  const copy = STAR_COPY[stars]
  const [hearts, setHearts] = useState(heartsBefore)
  const [mirror, setMirror] = useState<string>(PATTERN_NAMES.stars[stars])
  const alive = useRef(true)
  const lastGuess = [...guesses].reverse().find((g) => g.text)?.text ?? '—'
  const summary = `${copy.title} ${copy.line} The answer was ${prompt}. ${takeaway} ${guesses.length ? `You said ${lastGuess}.` : 'No guess was made.'} ${stars} star${stars === 1 ? '' : 's'}. ${heartsAfter < heartsBefore ? `You lost a heart. ` : ''}${heartsAfter} of ${MAX_HEARTS} hearts left.`
  const nextLabel = pieces > 0 ? 'See your reward' : heartsAfter === 0 ? 'Continue' : plainNext
  const HELP = ` Press F1 to feel the drawing, F2 to feel your stars and hearts, or F4 for ${pieces > 0 ? 'your reward' : 'the next round'}.`

  useEffect(() => {
    alive.current = true
    playSound(stars > 0 ? 'correct' : 'incorrect')
    const frames = starsSequence(stars, heartsBefore)
    const run = async () => {
      await queue.play(frames)
      if (!alive.current) return
      if (heartsAfter < heartsBefore) {
        setMirror(PATTERN_NAMES.heartLost)
        setHearts(heartsAfter)
        playSound('heart-lost')
        await queue.play(heartLostSequence(heartsAfter))
      }
    }
    void run()
    void speak(summary + HELP)
    return () => {
      alive.current = false
      stopSpeaking()
    }
    // Runs once per validation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(
    () =>
      adapter.onKey?.((k) => {
        playSound('press')
        if (k === 'KeyFunction1') {
          setMirror('Player A’s drawing')
          void queue.show(drawing)
          void speak(`This is the drawing of ${prompt}.`)
        } else if (k === 'KeyFunction2') {
          setMirror('Stars and hearts')
          void queue.show(summaryBitmap(stars, heartsAfter))
          void speak(`${stars} of 3 stars. ${heartsAfter} of ${MAX_HEARTS} hearts.`)
        } else if (k === 'KeyFunction4') onNext()
        else void speak(summary + HELP)
      }),
    [adapter, drawing, heartsAfter, onNext, prompt, queue, stars, summary, HELP],
  )

  return (
    <motion.main
      className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-12 md:px-10"
      animate={stars === 0 ? { x: [0, -12, 12, -8, 8, -4, 0] } : {}}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {stars > 0 && <Confetti count={stars * 30} />}
      <section className="flex flex-col gap-6 md:col-span-7" aria-labelledby="val-title">
        <div className={`px-box-lg flex flex-col items-center gap-5 p-8 text-center ${stars === 3 ? 'bg-yellow' : stars > 0 ? 'bg-green' : 'bg-red text-white'}`}>
          <StarRow stars={stars} size={56} />
          <ScreenHeading className="text-2xl uppercase md:text-4xl">
            <span id="val-title">{copy.title}</span>
          </ScreenHeading>
          <p className="text-2xl italic">“{copy.line}”</p>
        </div>

        <dl className="px-box grid grid-cols-2 bg-card">
          <div className="border-r-4 border-ink p-5">
            <dt className="label">The scene</dt>
            <dd className="font-minion mt-2 text-2xl leading-tight md:text-3xl">{prompt}</dd>
          </div>
          <div className="p-5">
            <dt className="label">The guess</dt>
            <dd className="font-minion mt-2 text-2xl leading-tight md:text-3xl">{lastGuess}</dd>
          </div>
        </dl>

        <ol className="grid grid-cols-2 gap-3" aria-label="Guesses">
          {guesses.map((g, i) => (
            <li key={i} className={`px-box-sm flex flex-col gap-1 p-3 ${g.correct ? 'bg-ok-soft' : 'bg-bad-soft'}`}>
              <span className="label flex items-center gap-2">
                {guesses.length > 1 && i === guesses.length - 1 ? 'Final guess' : `Guess ${i + 1}`}
                <PixelIcon name={g.correct ? 'check' : 'cross'} size={12} className={g.correct ? 'text-ok' : 'text-bad'} />
              </span>
              <span className="font-minion break-words text-lg leading-snug">{g.text || 'no guess'}</span>
            </li>
          ))}
        </ol>

        <div className="px-box flex flex-wrap items-center justify-between gap-4 bg-card p-5">
          <div>
            <p className="label">Hearts</p>
            <HeartsBar count={hearts} size={24} className="mt-2" />
          </div>
          <p className="font-pixel text-[10px] uppercase leading-relaxed">{roundLabel}</p>
        </div>

        <p className="px-box bg-card p-5 text-lg leading-relaxed">{takeaway}</p>

        <div className="flex flex-wrap gap-4">
          <Button variant={pieces > 0 ? 'yellow' : 'red'} size="xl" onClick={onNext} autoFocus>
            {nextLabel} <PixelIcon name="play" size={18} />
          </Button>
          {onHome && (
            <Button variant="secondary" onClick={onHome}>
              Home
            </Button>
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-6 md:col-span-5">
        <figure className="flex flex-col gap-2">
          <PinBoard strokes={[]} bitmap={drawing} label={`Player A’s drawing of ${prompt.toLowerCase()}.`} />
          <figcaption className="label text-muted">The drawing</figcaption>
        </figure>
        {clue && (
          <figure className="flex flex-col gap-2">
            <PinBoard strokes={[]} bitmap={clue} label="The beat clue, drawn on a blank board." />
            <figcaption className="label text-muted">The beat clue</figcaption>
          </figure>
        )}
        <TactileMirror adapter={adapter} caption={mirror} />
      </aside>
    </motion.main>
  )
}

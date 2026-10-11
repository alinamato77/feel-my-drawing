import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Button } from '../components/Button'
import { Confetti, TactileMirror } from '../components/GameBits'
import { PixelIcon } from '../components/PixelIcon'
import { PuzzleView } from '../components/PuzzleView'
import { ScreenHeading } from '../components/ScreenHeading'
import type { DotPadAdapter } from '../dotpad/DotPadAdapter'
import type { TactileQueue } from '../dotpad/tactileQueue'
import { MONSTERS, PIECES, monsterBitmap, pieceName, puzzleBitmap } from '../game/prize'
import type { Award } from '../game/prize'
import { playSound, speak, stopSpeaking } from '../game/speech'

interface RewardScreenProps {
  adapter: DotPadAdapter
  queue: TactileQueue
  awards: Award[]
  nextLabel?: string
  onNext: () => void
  onChangeMode: () => void
}

/** Puzzle pieces won this round; a completed puzzle reveals the full monster painting. */
export function RewardScreen({ adapter, queue, awards, nextLabel = 'Next round', onNext, onChangeMode }: RewardScreenProps) {
  const last = awards[awards.length - 1]
  const completed = awards.find((a) => a.complete)
  // Show the puzzle that was just completed, otherwise the one being collected.
  const shown = completed ?? last
  const won = completed ? Array.from({ length: PIECES }, (_, i) => i) : last.won
  const bitmap = completed ? monsterBitmap(completed.monster) : puzzleBitmap(last.monster, last.won)
  const alive = useRef(true)

  const message = completed
    ? `You won ${awards.length} piece${awards.length > 1 ? 's' : ''} and completed the puzzle! You found ${MONSTERS[completed.monster].name}: ${MONSTERS[completed.monster].description}. Feel the whole painting on the Dot Pad.`
    : `You won ${awards.length} puzzle piece${awards.length > 1 ? 's' : ''}! ${awards.map((a) => `One goes in the ${pieceName(a.piece)}.`).join(' ')} You now have ${last.won.length} of ${PIECES} pieces of a mystery monster. Each little hollow square is a piece still missing.`

  useEffect(() => {
    alive.current = true
    const run = async () => {
      for (let i = 0; i < awards.length; i++) {
        playSound('prize')
        await new Promise((r) => setTimeout(r, 450))
      }
      if (!alive.current) return
      if (completed) playSound('complete')
      void queue.show(bitmap)
      await speak(`${message} Press F4 to continue.`)
    }
    void run()
    return () => {
      alive.current = false
      stopSpeaking()
    }
    // Runs once per reward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(
    () =>
      adapter.onKey?.((k) => {
        playSound('press')
        if (k === 'KeyFunction4') onNext()
        else void speak(message)
      }),
    [adapter, message, onNext],
  )

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-5 py-8 md:grid-cols-12 md:px-10">
      {completed && <Confetti count={120} />}
      <section className="flex flex-col gap-5 md:col-span-7" aria-labelledby="reward-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <ScreenHeading className="text-2xl uppercase md:text-4xl">
            <span id="reward-title">{completed ? 'Full painting!' : `+${awards.length} piece${awards.length > 1 ? 's' : ''}!`}</span>
          </ScreenHeading>
          <p className="flex items-center gap-1" aria-label={`${completed ? PIECES : last.won.length} of ${PIECES} pieces`}>
            {Array.from({ length: PIECES }, (_, i) => (
              <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.05 * i, type: 'spring', stiffness: 500 }}>
                <PixelIcon name={i < (completed ? PIECES : last.won.length) ? 'coin' : 'coinEmpty'} size={22} />
              </motion.span>
            ))}
          </p>
        </div>
        <motion.div initial={{ scale: 0.85, rotate: -2 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}>
          <PuzzleView
            monster={shown.monster}
            won={won}
            fresh={completed ? null : last.piece}
            label={completed ? `Completed puzzle: ${MONSTERS[shown.monster].name}.` : `Prize puzzle: ${last.won.length} of ${PIECES} pieces.`}
          />
        </motion.div>
        <p className="text-xl leading-relaxed">
          {completed
            ? `${MONSTERS[completed.monster].name.replace(/^the /, 'The ')} — ${MONSTERS[completed.monster].description}.`
            : `New: ${awards.map((a) => pieceName(a.piece)).join(', ')}. Keep guessing to reveal the mystery monster.`}
        </p>
        <div className="flex flex-wrap gap-4">
          <Button variant="blue" size="xl" onClick={onNext} autoFocus>
            {nextLabel} <PixelIcon name="play" size={18} />
          </Button>
          <Button variant="secondary" onClick={onChangeMode}>
            Home
          </Button>
        </div>
      </section>
      <aside className="md:col-span-5">
        <TactileMirror adapter={adapter} caption={completed ? 'The full monster' : 'Your puzzle so far'} />
      </aside>
    </main>
  )
}

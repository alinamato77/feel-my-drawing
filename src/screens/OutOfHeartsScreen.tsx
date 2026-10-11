import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Button } from '../components/Button'
import { HeartsBar } from '../components/GameBits'
import { PixelIcon } from '../components/PixelIcon'
import { ScreenHeading } from '../components/ScreenHeading'
import type { TactileQueue } from '../dotpad/tactileQueue'
import { regenStatus } from '../game/hearts'
import type { Hearts } from '../game/hearts'
import { playSound, speak, stopSpeaking } from '../game/speech'
import { gameOverSequence } from '../game/tactilePatterns'

const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface OutOfHeartsProps {
  queue: TactileQueue
  hearts: Hearts
  now: number
  onHome: () => void
  onPlay: () => void
}

export function OutOfHeartsScreen({ queue, hearts, now, onHome, onPlay }: OutOfHeartsProps) {
  const { msLeft, progress } = regenStatus(hearts, now)
  const ready = hearts.count > 0

  useEffect(() => {
    playSound('game-over')
    void queue.play(gameOverSequence())
    void speak(`Out of hearts! Your creativity needs a little recharge. The next heart comes back in about ${Math.ceil(regenStatus(hearts).msLeft / 60000)} minutes.`)
    return () => stopSpeaking()
    // Runs once on entering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const segments = 20
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-3xl flex-col items-center justify-center gap-8 px-5 py-10 text-center">
      <motion.div initial={{ scale: 0.5, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 10 }}>
        <PixelIcon name={ready ? 'heart' : 'skull'} size={110} className={ready ? '' : 'text-ink'} />
      </motion.div>
      <ScreenHeading className="text-3xl uppercase md:text-5xl">{ready ? 'A heart is back!' : 'Out of hearts!'}</ScreenHeading>
      <p className="text-2xl italic">“Your creativity needs a little recharge.”</p>
      <HeartsBar count={hearts.count} size={28} />

      {!ready || hearts.count < 10 ? (
        <section aria-labelledby="regen" className="px-box flex w-full flex-col gap-3 bg-card p-6">
          <h2 id="regen" className="label">
            Next heart in
          </h2>
          <p className="font-pixel text-4xl tabular-nums" aria-live="off">
            {mmss(msLeft)}
          </p>
          <div className="flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Heart regeneration">
            {Array.from({ length: segments }, (_, i) => (
              <span key={i} className={`h-5 flex-1 ${i < Math.floor(progress * segments) ? 'bg-red' : 'bg-ink/15'}`} />
            ))}
          </div>
          <p className="text-muted">One heart returns every 5 minutes, even if you close the page.</p>
        </section>
      ) : null}

      <div className="flex flex-wrap justify-center gap-4">
        {ready && (
          <Button variant="red" size="xl" onClick={onPlay}>
            Play <PixelIcon name="play" size={18} />
          </Button>
        )}
        <Button variant="secondary" onClick={onHome}>
          Return to home
        </Button>
      </div>
    </main>
  )
}

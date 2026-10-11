import { motion } from 'framer-motion'
import { useState } from 'react'
import { Button } from '../components/Button'
import { Credit } from '../components/Credit'
import { HeartsBar } from '../components/GameBits'
import { PixelIcon } from '../components/PixelIcon'
import { ScreenHeading } from '../components/ScreenHeading'
import { MODES } from '../game/modes'
import type { ModeId } from '../game/modes'
import { canListen, canSpeak, requestMicrophone, speak } from '../game/speech'

type Check = 'idle' | 'checking' | 'ok' | 'no-mic' | 'unsupported'

interface HomeScreenProps {
  hearts: number
  onPick: (mode: ModeId) => void
  onHowTo: () => void
}

export function HomeScreen({ hearts, onPick, onHowTo }: HomeScreenProps) {
  const [check, setCheck] = useState<Check>(canListen && canSpeak ? 'idle' : 'unsupported')
  const runCheck = async () => {
    setCheck('checking')
    void speak('Sound check. If you can hear this, the sound is working.')
    setCheck((await requestMicrophone()) ? 'ok' : 'no-mic')
  }

  return (
    <main className="relative mx-auto flex max-w-6xl flex-col gap-10 overflow-hidden px-5 py-10 md:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <PixelIcon name="cloud" size={34} className="absolute right-[36%] top-[11.5rem] animate-[drift_9s_steps(12)_infinite]" />
        <PixelIcon name="cloud" size={40} className="absolute right-[14%] top-[10.5rem] animate-[drift_12s_steps(12)_infinite]" />
      </div>

      <div className="flex flex-col gap-5">
        <ScreenHeading className="text-[clamp(2rem,6vw,4.5rem)] uppercase leading-[1.15]">
          {['Feel', 'my', 'drawing'].map((w, i) => (
            <motion.span
              key={w}
              className={`mr-[0.4em] inline-block ${i === 1 ? 'text-red' : ''}`}
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.15, ease: (t: number) => Math.floor(t * 6) / 6 }}
            >
              {w}
            </motion.span>
          ))}
        </ScreenHeading>
        <p className="font-minion text-2xl md:text-3xl">One experience. Two ways to draw.</p>
      </div>

      <ul className="grid gap-8 md:grid-cols-2" aria-label="Modes">
        {(Object.keys(MODES) as ModeId[]).map((id, i) => {
          const m = MODES[id]
          return (
            <li key={id} className="flex">
              <motion.button
                type="button"
                onClick={() => onPick(id)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, rotate: i === 0 ? -1.5 : 1.5 }}
                whileTap={{ y: 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.2 + i * 0.1 }}
                className={`px-box flex w-full cursor-pointer flex-col gap-4 p-7 text-left ${i === 0 ? 'bg-green' : 'bg-blue text-white'}`}
                aria-label={`Mode ${m.number}: ${m.title}. ${m.description}`}
              >
                <span className="flex items-center justify-between">
                  <span className="font-pixel text-xs opacity-80">MODE {m.number}</span>
                  <PixelIcon name={i === 0 ? 'hand' : 'speaker'} size={28} />
                </span>
                <span className="font-pixel text-2xl uppercase leading-snug md:text-3xl">{m.title}</span>
                <span className="font-minion text-xl leading-snug">{m.description}</span>
                <span className="mt-auto font-pixel text-[10px] uppercase">{m.direction}</span>
              </motion.button>
            </li>
          )
        })}
      </ul>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="setup-title" className="px-box bg-card p-5">
          <h2 id="setup-title" className="text-sm uppercase">Sound &amp; microphone</h2>
          <p className="mt-2 text-muted">Turn the volume up and allow the microphone before you start, so the blind player never meets a permission pop-up.</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button size="md" variant="yellow" onClick={runCheck} disabled={check === 'checking' || check === 'unsupported'}>
              Test sound &amp; microphone
            </Button>
            <p role="status" className="font-semibold">
              {check === 'ok' && (<><PixelIcon name="check" size={16} className="mr-2 text-ok" />Ready.</>)}
              {check === 'no-mic' && (<><PixelIcon name="cross" size={16} className="mr-2 text-bad" />Microphone blocked.</>)}
              {check === 'checking' && 'Checking…'}
              {check === 'unsupported' && 'Voice needs Chrome or Edge.'}
            </p>
          </div>
        </section>
        <section aria-labelledby="hearts-title" className="px-box flex flex-col gap-3 bg-card p-5">
          <h2 id="hearts-title" className="text-sm uppercase">Shared hearts</h2>
          <HeartsBar count={hearts} size={24} />
          <Button variant="secondary" size="md" onClick={onHowTo} className="self-start">
            How to play &amp; about
          </Button>
        </section>
      </div>

      <Credit />
    </main>
  )
}

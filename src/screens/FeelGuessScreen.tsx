import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Button } from '../components/Button'
import { DotPadButtons } from '../components/DotPadButtons'
import { HeartsBar, StarRow } from '../components/GameBits'
import { PixelIcon } from '../components/PixelIcon'
import { MicWave, SpeakerWaves } from '../components/Waves'
import type { DotPadAdapter } from '../dotpad/DotPadAdapter'
import type { DotPadKeyName } from '../dotpad/MockDotPadAdapter'
import type { TactileQueue } from '../dotpad/tactileQueue'
import type { Bitmap } from '../shapes/types'
import { canListen, canSpeak, listen, playSound, speak, startLevelMeter, stopListening, stopSpeaking } from '../game/speech'
import { spokenYesNo } from '../game/words'

type Phase = 'hint' | 'ready' | 'listening' | 'confirm' | 'confirm-listening' | 'sent'

interface FeelGuessScreenProps {
  adapter: DotPadAdapter
  queue: TactileQueue
  /** 1 = first guess; 2 = final guess, with the beat clue. */
  attempt: 1 | 2
  drawing: Bitmap
  /** The beat clue drawn on a blank board (attempt 2). */
  clue: Bitmap | null
  hearts: number
  status: ReactNode
  onGuess: (guess: string) => void
}

const KEYBOARD: Record<string, DotPadKeyName> = { '1': 'KeyFunction1', ' ': 'KeyFunction1', '2': 'KeyFunction2', '3': 'KeyFunction3', '4': 'KeyFunction4', Enter: 'KeyFunction4', ArrowLeft: 'PanningLeft', ArrowRight: 'PanningRight' }

/**
 * Mode 1, the blind Guesser. The complete drawing is already on the Dot Pad.
 * One spoken hint (the same hint can be replayed; no new hints after the bonus),
 * one guess — by voice with the Dot Pad buttons, or typed.
 */
export function FeelGuessScreen({ adapter, queue, attempt, drawing, clue, hearts, status, onGuess }: FeelGuessScreenProps) {
  const [phase, setPhase] = useState<Phase>('hint')
  const [heard, setHeard] = useState('')
  const [level, setLevel] = useState(0)
  const [typed, setTyped] = useState('')
  const [pressed, setPressed] = useState<DotPadKeyName | null>(null)
  const [showing, setShowing] = useState<'drawing' | 'clue'>(attempt === 2 && clue ? 'clue' : 'drawing')
  const phaseRef = useRef<Phase>('hint')
  const heardRef = useRef('')
  const alive = useRef(true)
  const started = useRef(false)
  const now = (): Phase => phaseRef.current
  const go = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }, [])

  const intro =
    attempt === 1
      ? 'The drawing is on the Dot Pad. Explore the whole picture. Press F1 and say what you think it shows.'
      : 'Player A drew the beats of the music on a blank board as a clue. The beat clue is on the Dot Pad now. Press F3 for the beat clue, F2 for the first drawing. This is your final guess. Press F1 and say what you think it shows.'

  const sayThen = useCallback(
    async (text: string, after: Phase) => {
      go('hint')
      await speak(text)
      if (alive.current && now() === 'hint') go(after)
    },
    [go],
  )

  const send = useCallback(
    (guess: string) => {
      if (now() === 'sent') return
      stopListening()
      go('sent')
      playSound('submit')
      void speak(`Sent: ${guess}.`).then(() => alive.current && onGuess(guess))
    },
    [go, onGuess],
  )

  const hear = useCallback(
    async (p: 'listening' | 'confirm-listening', ms: number) => {
      go(p)
      playSound('record-start')
      const stop = await startLevelMeter(setLevel)
      try {
        return await listen(ms)
      } finally {
        stop()
        setLevel(0)
        playSound('record-stop')
      }
    },
    [go],
  )

  const voiceGuess = useCallback(async () => {
    stopSpeaking()
    let alts: string[] = []
    try {
      alts = await hear('listening', 9000)
    } catch {
      void sayThen('The microphone isn’t working. Your partner can type the guess.', 'ready')
      return
    }
    if (!alive.current || now() !== 'listening') return
    const guess = (alts[0] ?? '').trim()
    if (!guess) return void sayThen('I didn’t catch that. Press F1 and try again.', 'ready')
    heardRef.current = guess
    setHeard(guess)
    await sayThen(`I heard: ${guess}. To send it, press F4 or say yes. To try again, press F1.`, 'confirm')
    if (!alive.current || now() !== 'confirm') return
    let yes: boolean | null = null
    try {
      yes = spokenYesNo(await hear('confirm-listening', 5000))
    } catch {
      yes = null
    }
    if (!alive.current || now() !== 'confirm-listening') return
    if (yes === true) send(guess)
    else if (yes === false) void sayThen('Okay. Press F1 and say it again.', 'ready')
    else go('confirm')
  }, [go, hear, sayThen, send])

  const press = useCallback(
    (key: DotPadKeyName) => {
      setPressed(key)
      window.setTimeout(() => setPressed(null), 180)
      const p = now()
      if (p === 'sent') return
      playSound('press')
      if (key === 'KeyFunction1' && canListen && p !== 'listening') void voiceGuess()
      else if (key === 'KeyFunction4' && (p === 'confirm' || p === 'confirm-listening') && heardRef.current) send(heardRef.current)
      else if ((key === 'PanningLeft' || key === 'PanningRight') && p !== 'listening' && p !== 'confirm-listening') void sayThen(intro, 'ready')
      else if (attempt === 2 && clue && (key === 'KeyFunction2' || key === 'KeyFunction3') && p !== 'listening' && p !== 'confirm-listening') {
        const which = key === 'KeyFunction3' ? 'clue' : 'drawing'
        setShowing(which)
        playSound('whoosh')
        void queue.show(which === 'clue' ? clue : drawing)
        void sayThen(which === 'clue' ? 'Beat clue.' : 'First drawing.', 'ready')
      }
    },
    [attempt, clue, drawing, intro, queue, sayThen, send, voiceGuess],
  )

  useEffect(() => {
    alive.current = true
    if (!started.current) {
      started.current = true
      void sayThen(intro, 'ready')
    }
    return () => {
      alive.current = false
      stopSpeaking()
      stopListening()
    }
    // Runs once per attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => adapter.onKey?.((k) => press(k as DotPadKeyName)), [adapter, press])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, #dotpad-popover') || e.metaKey || e.ctrlKey || e.altKey) return
      const k = KEYBOARD[e.key]
      if (k) {
        e.preventDefault()
        press(k)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  const submitTyped = (e: FormEvent) => {
    e.preventDefault()
    if (typed.trim()) send(typed.trim())
  }

  const listening = phase === 'listening' || phase === 'confirm-listening'
  const color = listening ? 'bg-red text-white' : phase === 'sent' ? 'bg-green text-white' : phase === 'confirm' ? 'bg-yellow text-ink' : 'bg-blue text-white'
  const highlight: DotPadKeyName | null = phase === 'ready' ? 'KeyFunction1' : phase === 'confirm' || phase === 'confirm-listening' ? 'KeyFunction4' : null

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-6 md:grid-cols-12 md:px-10">
      <div className="flex flex-col gap-5 md:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl uppercase md:text-3xl">What do you feel?</h1>
          <span className="label">Player B · Blind Guesser · {attempt === 1 ? 'Guess 1' : 'Final guess'}</span>
        </div>
        <div aria-hidden="true" className={`px-box-lg relative flex min-h-[18rem] flex-col items-center justify-center gap-5 p-8 ${color}`}>
          <AnimatePresence mode="wait">
            <motion.div key={phase} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
              {phase === 'hint' && <SpeakerWaves />}
              {phase === 'ready' && <PixelIcon name="hand" size={120} className="animate-[bob_1s_steps(2)_infinite]" />}
              {listening && <MicWave level={level} />}
              {phase === 'confirm' && <span className="font-minion max-w-full break-words text-center text-4xl">{heard}</span>}
              {phase === 'sent' && <PixelIcon name="check" size={120} className="animate-[pop_0.5s_steps(4)]" />}
            </motion.div>
          </AnimatePresence>
        </div>
        <DotPadButtons
          highlight={highlight}
          pressed={pressed}
          onPress={adapter.kind === 'mock' ? press : undefined}
          extra={attempt === 2 && clue ? { KeyFunction2: 'F2: feel the first drawing', KeyFunction3: 'F3: feel the beat clue' } : undefined}
        />
      </div>

      <aside className="flex flex-col gap-5 md:col-span-4" aria-label="Guess">
        <div className="px-box flex flex-col gap-3 bg-card p-5">
          <p className="label">Stars available</p>
          <div className="mt-3">
            <StarRow stars={attempt === 1 ? 3 : 2} size={26} delay={0} />
          </div>
          <p className="label mt-1">Hearts</p>
          <HeartsBar count={hearts} size={18} />
          <div className="mt-1">{status}</div>
        </div>
        <Button variant="yellow" size="md" onClick={() => press('PanningLeft')} disabled={!canSpeak || listening || phase === 'sent'}>
          <PixelIcon name="speaker" size={16} /> Repeat instructions
        </Button>
        {attempt === 2 && clue && (
          <div className="px-box flex flex-col gap-3 bg-card p-5" role="group" aria-label="What is on the Dot Pad">
            <p className="label">On the Dot Pad</p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="md" variant={showing === 'drawing' ? 'primary' : 'secondary'} aria-pressed={showing === 'drawing'} onClick={() => press('KeyFunction2')} disabled={listening || phase === 'sent'}>
                Drawing (F2)
              </Button>
              <Button size="md" variant={showing === 'clue' ? 'primary' : 'secondary'} aria-pressed={showing === 'clue'} onClick={() => press('KeyFunction3')} disabled={listening || phase === 'sent'}>
                Beat clue (F3)
              </Button>
            </div>
          </div>
        )}
        <form onSubmit={submitTyped} className="px-box flex flex-col gap-3 bg-card p-5">
          <label htmlFor="scene-guess" className="label">
            Your guess
          </label>
          <input id="scene-guess" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="font-minion px-box-sm min-h-14 bg-white px-4 text-xl" />
          <Button type="submit" variant="blue" size="md" disabled={!typed.trim() || phase === 'sent'}>
            Submit guess <PixelIcon name="send" size={16} />
          </Button>
        </form>
      </aside>
    </main>
  )
}

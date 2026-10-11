import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DevPanel } from './components/DevPanel'
import { DotPadStatus } from './components/DotPadStatus'
import { HeartsBar } from './components/GameBits'
import { PixelIcon } from './components/PixelIcon'
import { SleepOverlay } from './components/SleepOverlay'
import type { DotPadAdapter } from './dotpad/DotPadAdapter'
import { MockDotPadAdapter } from './dotpad/MockDotPadAdapter'
import { RealDotPadAdapter } from './dotpad/RealDotPadAdapter'
import { TactileQueue } from './dotpad/tactileQueue'
import { useAdapterState } from './dotpad/useAdapterState'
import { loadHearts, loseHeart, saveHearts, settle, MAX_HEARTS } from './game/hearts'
import type { Hearts } from './game/hearts'
import { MODES, TIMING, otherMode } from './game/modes'
import type { ModeId } from './game/modes'
import { PIECES, awardPieces, loadProgress, saveProgress } from './game/prize'
import type { Award, Progress } from './game/prize'
import { IDLE_SLEEP_MS } from './game/round'
import type { GuessRecord, Screen } from './game/round'
import { SCENE, checkSceneGuess } from './game/scene'
import { playSound, speak, stopListening, stopSpeaking } from './game/speech'
import { piecesFor } from './game/stars'
import type { Stars } from './game/stars'
import { strokesToBitmap } from './game/strokes'
import type { Stroke } from './game/strokes'
import { heartRestoredSequence } from './game/tactilePatterns'
import { ArtistFeelScreen } from './screens/ArtistFeelScreen'
import { FeelGuessScreen } from './screens/FeelGuessScreen'
import { HandoffScreen } from './screens/HandoffScreen'
import { HomeScreen } from './screens/HomeScreen'
import { HowToScreen } from './screens/HowToScreen'
import { OutOfHeartsScreen } from './screens/OutOfHeartsScreen'
import { RewardScreen } from './screens/RewardScreen'
import { RolesScreen } from './screens/RolesScreen'
import { SoundDrawScreen } from './screens/SoundDrawScreen'
import { ValidationScreen } from './screens/ValidationScreen'
import type { Bitmap } from './shapes/types'

interface Result {
  stars: Stars
  guesses: GuessRecord[]
  drawing: Bitmap
  clue: Bitmap | null
  heartsBefore: number
  heartsAfter: number
  awards: Award[]
}

/** Demo Mode is the default, so the game works without hardware. */
const demo = new MockDotPadAdapter()
void demo.connect()

const DEV = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev')
const pixelEase = (t: number) => Math.floor(t * 8) / 8

// Dev-only hook for automated tests: read what the simulated Dot Pad is showing.
if (DEV) (window as unknown as { __dotpad: () => unknown }).__dotpad = () => demo.getState()

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [adapter, setAdapter] = useState<DotPadAdapter>(demo)
  const queue = useMemo(() => new TactileQueue(adapter), [adapter])
  const state = useAdapterState(adapter)
  const [mode, setMode] = useState<ModeId>('draw-feel')
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [clueStrokes, setClueStrokes] = useState<Stroke[] | null>(null)
  const [attempt, setAttempt] = useState<1 | 2>(1)
  const [guesses, setGuesses] = useState<GuessRecord[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [roundId, setRoundId] = useState(0)
  const [hearts, setHearts] = useState<Hearts>(() => loadHearts())
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [now, setNow] = useState(() => Date.now())
  const [sleeping, setSleeping] = useState(false)
  const lastActivity = useRef(0)

  // ── Hearts: timestamps are the truth; re-settle every second for countdowns and regeneration. ──
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  // Derived every render from the stored timestamp; persisted when it changes.
  const settled = settle(hearts, now)
  const restoredRef = useRef(hearts.count)
  useEffect(() => {
    saveHearts(settled)
  }, [settled.count, settled.since]) // eslint-disable-line react-hooks/exhaustive-deps
  // A heart came back: show it on the Dot Pad (only between rounds, never mid-round).
  useEffect(() => {
    if (settled.count > restoredRef.current && (screen === 'home' || screen === 'out' || screen === 'roles')) {
      playSound('heart-restored')
      void queue.play(heartRestoredSequence())
      if (screen === 'out') void speak('A heart is back! You can play again.')
    }
    restoredRef.current = settled.count
  }, [settled.count, screen, queue])

  // ── Sleep after an hour without activity. ──
  useEffect(() => {
    lastActivity.current = Date.now()
  }, [])
  const wake = useCallback(() => {
    lastActivity.current = Date.now()
    setSleeping(false)
  }, [])
  useEffect(() => {
    const bump = () => {
      lastActivity.current = Date.now()
      if (sleeping) setSleeping(false)
    }
    window.addEventListener('pointerdown', bump)
    window.addEventListener('keydown', bump)
    const off = adapter.onKey?.(bump)
    return () => {
      window.removeEventListener('pointerdown', bump)
      window.removeEventListener('keydown', bump)
      off?.()
    }
  }, [adapter, sleeping])
  useEffect(() => {
    if (!sleeping && now - lastActivity.current >= IDLE_SLEEP_MS) {
      setSleeping(true)
      stopSpeaking()
      stopListening()
      void queue.clear()
    }
  }, [now, sleeping, queue])

  useEffect(() => {
    const release = () => void adapter.disconnect()
    window.addEventListener('pagehide', release)
    return () => window.removeEventListener('pagehide', release)
  }, [adapter])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [screen])

  // ── Flow ──
  const goHome = () => {
    void queue.clear()
    setScreen('home')
  }

  /** Choose a mode → role assignment. */
  const pickMode = (m: ModeId) => {
    setMode(m)
    setScreen(settle(hearts).count > 0 ? 'roles' : 'out')
  }

  /** START: reset the drawing and timers for a fresh round in the current mode. */
  const startRound = () => {
    if (settle(hearts).count <= 0) return setScreen('out')
    setStrokes([])
    setClueStrokes(null)
    setAttempt(1)
    setGuesses([])
    setResult(null)
    setRoundId((n) => n + 1)
    void queue.clear()
    setScreen(mode === 'draw-feel' ? 'feel-draw' : 'guess-play')
  }

  /** Mode 1: the Artist finished — send the drawing and wait for the Dot Pad before handing over. */
  const artistDone = async (s: Stroke[]) => {
    setStrokes(s)
    setScreen('sending')
    await queue.show(strokesToBitmap(s))
    setScreen('feel-handoff')
  }

  /** Mode 1: the beat clue (blank board) is a separate picture; it goes to the Dot Pad first. */
  const clueDone = async (s: Stroke[]) => {
    setClueStrokes(s)
    setScreen('sending')
    await queue.show(strokesToBitmap(s))
    setScreen('feel-handoff')
  }

  const finish = (stars: Stars, allGuesses: GuessRecord[], drawing: Bitmap, clue: Bitmap | null = null) => {
    const before = settle(hearts).count
    const nextHearts = stars === 0 ? loseHeart(hearts) : settle(hearts)
    if (stars === 0) {
      setHearts(nextHearts)
      saveHearts(nextHearts)
      restoredRef.current = nextHearts.count
    }
    const { awards, next } = awardPieces(progress, piecesFor(stars, 0))
    if (awards.length) {
      setProgress(next)
      saveProgress(next)
    }
    setResult({ stars, guesses: allGuesses, drawing, clue, heartsBefore: before, heartsAfter: nextHearts.count, awards })
    setScreen('validate')
  }

  /** Mode 1 guess: right → result; first miss → bonus round; final miss → result (0 stars). */
  const feelGuess = (text: string) => {
    const correct = checkSceneGuess(text)
    const all = [...guesses, { snapshot: attempt, text, correct }]
    setGuesses(all)
    const clue = clueStrokes ? strokesToBitmap(clueStrokes) : null
    if (correct) finish(attempt === 1 ? 3 : 2, all, strokesToBitmap(strokes), clue)
    else if (attempt === 1) {
      setAttempt(2)
      setScreen('feel-back')
    } else finish(0, all, strokesToBitmap(strokes), clue)
  }

  /** Mode 2 answer. */
  const soundGuess = (text: string, drawing: Bitmap) => {
    const correct = checkSceneGuess(text)
    finish(correct ? 3 : 0, [{ snapshot: 1, text, correct }], drawing)
  }

  /** SWITCH ROLES: the other mode, same scene, fresh drawing and timers. */
  const switchRoles = () => {
    void queue.clear()
    setMode((m) => otherMode(m))
    setScreen(settle(hearts).count > 0 ? 'roles' : 'out')
  }

  const afterResult = () => (result?.awards.length ? setScreen('reward') : switchRoles())

  // ── Dot Pad connection ──
  const connectUsb = async () => {
    const real = new RealDotPadAdapter('usb')
    setAdapter(real)
    await real.connect()
  }
  const useDemo = async () => {
    if (adapter.kind === 'real') await adapter.disconnect()
    setAdapter(demo)
  }
  const status = <DotPadStatus state={state} demo={adapter.kind === 'mock'} onConnectUsb={connectUsb} onDemo={useDemo} />

  const resetHearts = () => {
    const full = { count: MAX_HEARTS, since: Date.now() }
    setHearts(full)
    saveHearts(full)
    restoredRef.current = MAX_HEARTS
  }
  const resetPrize = () => {
    const fresh = { monster: 0, won: [], completed: [] }
    setProgress(fresh)
    saveProgress(fresh)
  }

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:text-white">
        Skip to content
      </a>
      <header className="border-b-8 border-ink bg-card">
        <div className="mx-auto flex min-h-20 max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-2 md:px-10">
          <button type="button" onClick={goHome} className="flex cursor-pointer items-center gap-3 font-pixel text-xs uppercase md:text-sm">
            <PixelIcon name="heart" size={20} />
            Feel my drawing
          </button>
          <div className="flex flex-wrap items-center gap-4">
            <HeartsBar count={settled.count} size={18} />
            <p className="hidden items-center gap-1 lg:flex" aria-label={`Prize: ${progress.won.length} of ${PIECES} pieces`}>
              {Array.from({ length: PIECES }, (_, i) => (
                <PixelIcon key={i} name={i < progress.won.length ? 'coin' : 'coinEmpty'} size={16} />
              ))}
            </p>
            {screen !== 'feel-guess' && status}
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          id="main"
          key={`${screen}-${roundId}`}
          // Pixel wipe between screens.
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(100% 0 0 0)' }}
          transition={{ duration: 0.35, ease: pixelEase }}
        >
          {screen === 'home' && <HomeScreen hearts={settled.count} onPick={pickMode} onHowTo={() => setScreen('howto')} />}
          {screen === 'howto' && <HowToScreen onBack={goHome} />}
          {screen === 'roles' && <RolesScreen mode={mode} onStart={startRound} onBack={goHome} />}
          {screen === 'feel-draw' && <ArtistFeelScreen key={`draw-${roundId}`} bonus={false} seconds={TIMING.feelDraw} baseStrokes={[]} onDone={(s) => void artistDone(s)} />}
          {screen === 'feel-bonus' && <ArtistFeelScreen key={`bonus-${roundId}`} bonus seconds={TIMING.feelBonus} baseStrokes={[]} onDone={(s) => void clueDone(s)} />}
          {screen === 'sending' && (
            <main className="mx-auto flex min-h-[calc(100dvh-6rem)] flex-col items-center justify-center gap-6 px-5 text-center" aria-live="polite">
              <div className="flex gap-2" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i} className="size-5 animate-[ripple_0.8s_steps(2)_infinite] bg-ink" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <p className="font-pixel text-lg uppercase">Sending to the Dot Pad…</p>
            </main>
          )}
          {screen === 'feel-handoff' && (
            <HandoffScreen
              adapter={adapter}
              title={attempt === 1 ? 'Drawing complete!' : 'Beat clue ready!'}
              message={attempt === 1 ? 'Pass the screen to Player B, the Blind Guesser. The drawing is on the Dot Pad.' : 'Pass the screen back to Player B for the final guess. The beat clue is on the Dot Pad; the first drawing is one button away.'}
              from="A"
              to="B"
              button="I’m ready"
              onStart={() => setScreen('feel-guess')}
            />
          )}
          {screen === 'feel-guess' && (
            <FeelGuessScreen
              key={`guess-${roundId}-${attempt}`}
              adapter={adapter}
              queue={queue}
              attempt={attempt}
              drawing={strokesToBitmap(strokes)}
              clue={clueStrokes ? strokesToBitmap(clueStrokes) : null}
              hearts={settled.count}
              status={status}
              onGuess={feelGuess}
            />
          )}
          {screen === 'feel-back' && (
            <HandoffScreen
              adapter={adapter}
              title="Not quite!"
              message="Pass the screen back to Player A: 10 more seconds on a blank board to draw the beats as a clue."
              from="B"
              to="A"
              button="I’m the artist — ready"
              onStart={() => setScreen('feel-bonus')}
            />
          )}
          {screen === 'guess-play' && <SoundDrawScreen key={`sound-${roundId}`} adapter={adapter} queue={queue} onGuess={soundGuess} />}
          {screen === 'validate' && result && (
            <ValidationScreen
              adapter={adapter}
              queue={queue}
              prompt={SCENE}
              guesses={result.guesses}
              stars={result.stars}
              drawing={result.drawing}
              clue={result.clue}
              heartsBefore={result.heartsBefore}
              heartsAfter={result.heartsAfter}
              pieces={result.awards.length}
              roundLabel={`${MODES[mode].title} · ${MODES[mode].direction}`}
              takeaway="Preserve meaningful outlines, not every visual detail."
              nextLabel="Switch roles"
              onNext={afterResult}
              onHome={goHome}
            />
          )}
          {screen === 'reward' && result && <RewardScreen adapter={adapter} queue={queue} awards={result.awards} nextLabel="Switch roles" onNext={switchRoles} onChangeMode={goHome} />}
          {screen === 'out' && <OutOfHeartsScreen queue={queue} hearts={settled} now={now} onHome={goHome} onPlay={() => setScreen('roles')} />}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>{sleeping && <SleepOverlay onWake={wake} />}</AnimatePresence>

      {/* Developer tools: only with ?dev in the URL, never on Player B's screen. */}
      {DEV && screen !== 'feel-guess' && screen !== 'guess-play' && (
        <DevPanel
          pattern={state.pattern}
          onResetHearts={resetHearts}
          onResetPrize={resetPrize}
          onSleep={() => {
            lastActivity.current = 0
            setNow(Date.now())
          }}
        />
      )}
    </>
  )
}

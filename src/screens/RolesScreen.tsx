import { motion } from 'framer-motion'
import { Button } from '../components/Button'
import { Principles } from '../components/Credit'
import { PixelIcon } from '../components/PixelIcon'
import { ScreenHeading } from '../components/ScreenHeading'
import { MODES } from '../game/modes'
import type { ModeId } from '../game/modes'

/** Who does what in this mode, then START. */
export function RolesScreen({ mode, onStart, onBack }: { mode: ModeId; onStart: () => void; onBack: () => void }) {
  const m = MODES[mode]
  const cards = [
    { player: 'Player A', role: m.roles.a, icon: mode === 'draw-feel' ? ('undo' as const) : ('speaker' as const), color: 'bg-yellow' },
    { player: 'Player B', role: m.roles.b, icon: mode === 'draw-feel' ? ('hand' as const) : ('check' as const), color: mode === 'draw-feel' ? 'bg-sky' : 'bg-green' },
  ]
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-10 md:px-10">
      <p className="label">
        Mode {m.number} · {m.direction}
      </p>
      <ScreenHeading className="text-3xl uppercase md:text-5xl">{m.title}</ScreenHeading>
      <ul className="grid gap-6 md:grid-cols-2" aria-label="Roles">
        {cards.map((c, i) => (
          <motion.li key={c.player} initial={{ opacity: 0, x: i === 0 ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className={`px-box flex items-center gap-5 p-6 ${c.color}`}>
            <PixelIcon name={c.icon} size={48} />
            <span>
              <span className="block font-pixel text-sm uppercase">{c.player}</span>
              <span className="font-minion text-3xl">{c.role}</span>
            </span>
          </motion.li>
        ))}
      </ul>
      {mode === 'draw-guess' && (
        <p className="px-box-sm bg-bad-soft p-3 text-bad">
          Prototype limitation: drawing input a blind person can use independently isn’t implemented yet — the artist may need support.
        </p>
      )}
      <Principles />
      <div className="flex flex-wrap gap-4">
        <Button variant="red" size="xl" onClick={onStart} autoFocus>
          Start <PixelIcon name="play" size={20} />
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </main>
  )
}

import { motion } from 'framer-motion'
import { PixelIcon } from './PixelIcon'

/** Shown after an hour without activity. Any key, click or Dot Pad button wakes the game. */
export function SleepOverlay({ onWake }: { onWake: () => void }) {
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Game is sleeping. Press any key to wake."
      className="fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center gap-6 bg-ink text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onWake}
    >
      <PixelIcon name="zzz" size={90} className="animate-[bob_2s_steps(2)_infinite]" />
      <p className="font-pixel text-2xl uppercase md:text-4xl">Sleeping…</p>
      <p className="text-xl text-white/80">The Dot Pad’s pins are lowered. Press any key or tap to wake.</p>
    </motion.div>
  )
}

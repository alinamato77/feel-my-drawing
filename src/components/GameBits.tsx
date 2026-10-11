import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import type { DotPadAdapter } from '../dotpad/DotPadAdapter'
import { useAdapterState } from '../dotpad/useAdapterState'
import { MAX_HEARTS } from '../game/hearts'
import type { Stars } from '../game/stars'
import { DotMatrix } from './DotMatrix'
import { PixelIcon } from './PixelIcon'

/** Ten pixel hearts. Lost hearts pop out and leave an outline. */
export function HeartsBar({ count, size = 20, className = '' }: { count: number; size?: number; className?: string }) {
  return (
    <p className={`flex items-center gap-1 ${className}`} aria-label={`${count} of ${MAX_HEARTS} hearts`}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <span key={i} className="relative grid place-items-center" style={{ width: size, height: size }}>
          <PixelIcon name="heartEmpty" size={size * 0.85} className="text-ink/35" />
          <AnimatePresence>
            {i < count && (
              <motion.span
                key="full"
                className="absolute inset-0 grid place-items-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: [1, 1.6, 0], rotate: [0, -20, 20], opacity: [1, 1, 0] }}
                transition={{ duration: 0.5 }}
              >
                <PixelIcon name="heart" size={size * 0.85} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      ))}
    </p>
  )
}

/** Three stars; earned ones bounce in one after another. */
export function StarRow({ stars, size = 64, delay = 0.3 }: { stars: Stars | number; size?: number; delay?: number }) {
  return (
    <p className="flex items-end gap-4" aria-label={`${stars} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={i < stars ? { y: -60, scale: 0, rotate: -30 } : { opacity: 0 }}
          animate={i < stars ? { y: 0, scale: 1, rotate: 0 } : { opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 12, delay: delay + i * 0.35 }}
          className={i === 1 ? '-translate-y-3' : ''}
        >
          <PixelIcon name={i < stars ? 'star' : 'starEmpty'} size={i === 1 ? size * 1.2 : size} className={i < stars ? '' : 'text-ink/40'} />
        </motion.span>
      ))}
    </p>
  )
}

/** Deterministic pseudo-random 0–1 (keeps rendering pure). */
const hash = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** Pixel confetti that rains down once; purely decorative. */
export function Confetti({ count = 60 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: hash(i, 1) * 100,
        size: 6 + Math.round(hash(i, 2) * 3) * 3,
        color: ['#2454ff', '#ff5148', '#ffd84d', '#61c98b', '#171717'][i % 5],
        delay: hash(i, 3) * 0.6,
        drift: (hash(i, 4) - 0.5) * 160,
        spin: hash(i, 5) > 0.5 ? 180 : -180,
      })),
    [count],
  )
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute top-0"
          style={{ left: `${b.x}%`, width: b.size, height: b.size, background: b.color }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', x: b.drift, rotate: b.spin, opacity: [1, 1, 0] }}
          transition={{ duration: 2.2, delay: b.delay, ease: (t: number) => Math.floor(t * 18) / 18 }}
        />
      ))}
    </div>
  )
}

/** On-screen mirror of the Dot Pad’s current raised pins — the visual twin of every tactile reaction. */
export function TactileMirror({ adapter, caption }: { adapter: DotPadAdapter; caption: string }) {
  const state = useAdapterState(adapter)
  return (
    <figure className="flex flex-col gap-2">
      <DotMatrix bitmap={state.pattern} size="sm" label={`Dot Pad now showing: ${caption}`} />
      <figcaption className="label text-muted">Dot Pad · {caption}</figcaption>
    </figure>
  )
}

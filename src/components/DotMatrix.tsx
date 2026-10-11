import { memo } from 'react'
import { GRID_HEIGHT, GRID_WIDTH } from '../shapes/types'
import type { Bitmap } from '../shapes/types'

interface DotMatrixProps {
  bitmap: Bitmap | null
  /** Accessible description of what is shown; omit to hide from screen readers. */
  label?: string
  size?: 'sm' | 'lg'
  className?: string
}

/**
 * A simulated Dot Pad graphic area: 60 × 40 pins. Raised pins pop up with a
 * ripple that spreads from the centre (disabled under reduced motion).
 */
export const DotMatrix = memo(function DotMatrix({ bitmap, label, size = 'lg', className = '' }: DotMatrixProps) {
  const pins = []
  const cx = GRID_WIDTH / 2
  const cy = GRID_HEIGHT / 2
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const up = !!bitmap?.[y]?.[x]
      const delay = up ? Math.round(Math.hypot(x - cx, (y - cy) * 1.4) * 9) : 0
      pins.push(
        <circle
          key={`${x}-${y}`}
          className="pin"
          cx={x * 2 + 1}
          cy={y * 2 + 1}
          r={0.62}
          style={{
            fill: up ? 'var(--color-ink)' : 'rgb(17 17 17 / 0.13)',
            transform: up ? 'scale(1.25)' : 'scale(0.8)',
            transitionDelay: `${delay}ms`,
          }}
        />,
      )
    }
  }
  return (
    <div
      className={`px-box bg-[#e9e6de] ${size === 'lg' ? 'p-3' : 'p-2'} ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox={`0 0 ${GRID_WIDTH * 2} ${GRID_HEIGHT * 2}`} className="block h-auto w-full">
        {pins}
      </svg>
    </div>
  )
})

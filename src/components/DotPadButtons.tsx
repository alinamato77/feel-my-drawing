import type { DotPadKeyName } from '../dotpad/MockDotPadAdapter'
import { PixelIcon } from './PixelIcon'

export type ButtonRole = 'speak' | 'send' | 'repeat' | 'none'

interface DotPadButtonsProps {
  /** Which button the player should press next (it glows). */
  highlight: DotPadKeyName | null
  /** Last key pressed, briefly shown as pushed in. */
  pressed: DotPadKeyName | null
  /** In Demo Mode the picture doubles as clickable buttons. */
  onPress?: (key: DotPadKeyName) => void
  /** Give F2 / F3 a purpose (they are unused by default). */
  extra?: Partial<Record<'KeyFunction2' | 'KeyFunction3', string>>
}

const KEYS: { key: DotPadKeyName; shape: 'tri-left' | 'oval' | 'tri-right'; bump?: boolean; icon?: 'mic' | 'send' | 'repeat' | 'hand'; name: string }[] = [
  { key: 'PanningLeft', shape: 'tri-left', icon: 'repeat', name: 'Previous panning key: repeat' },
  { key: 'KeyFunction1', shape: 'oval', bump: true, icon: 'mic', name: 'F1: speak your guess' },
  { key: 'KeyFunction2', shape: 'oval', name: 'F2: not used' },
  { key: 'KeyFunction3', shape: 'oval', name: 'F3: not used' },
  { key: 'KeyFunction4', shape: 'oval', bump: true, icon: 'send', name: 'F4: send your guess' },
  { key: 'PanningRight', shape: 'tri-right', icon: 'repeat', name: 'Next panning key: repeat' },
]

/** Picture of the Dot Pad X button row (left to right: previous triangle, F1–F4, next triangle), as described in the user manual. */
export function DotPadButtons({ highlight, pressed, onPress, extra }: DotPadButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-box bg-[#2b2a27] px-5 py-6 md:gap-5" role={onPress ? 'group' : undefined} aria-label={onPress ? 'Simulated Dot Pad buttons' : undefined} aria-hidden={onPress ? undefined : true}>
      {KEYS.map((key) => {
        const named = extra?.[key.key as 'KeyFunction2' | 'KeyFunction3']
        const k = named ? { ...key, name: named, icon: 'hand' as const } : key
        const glow = highlight === k.key
        const down = pressed === k.key
        const base = `relative grid place-items-center transition-transform ${down ? 'scale-90' : ''} ${glow ? 'animate-[glow_0.8s_steps(2)_infinite]' : ''}`
        const color = glow ? 'bg-gold text-ink' : k.icon ? 'bg-[#d9d5cb] text-ink' : 'bg-[#8d887c] text-transparent'
        // Stepped (pixel) outlines: an octagon-ish oval and staircase triangles.
        const shapeClass =
          k.shape === 'oval'
            ? 'h-14 w-20 md:h-16 md:w-24 [clip-path:polygon(16%_0,84%_0,84%_12%,94%_12%,94%_28%,100%_28%,100%_72%,94%_72%,94%_88%,84%_88%,84%_100%,16%_100%,16%_88%,6%_88%,6%_72%,0_72%,0_28%,6%_28%,6%_12%,16%_12%)]'
            : `h-14 w-12 md:h-16 md:w-14 ${k.shape === 'tri-left' ? '[clip-path:polygon(100%_0,100%_100%,75%_100%,75%_83%,50%_83%,50%_66%,25%_66%,25%_58%,0_58%,0_42%,25%_42%,25%_34%,50%_34%,50%_17%,75%_17%,75%_0)]' : '[clip-path:polygon(0_0,25%_0,25%_17%,50%_17%,50%_34%,75%_34%,75%_42%,100%_42%,100%_58%,75%_58%,75%_66%,50%_66%,50%_83%,25%_83%,25%_100%,0_100%)]'}`
        const content = (
          <>
            {k.icon && <PixelIcon name={k.icon} size={k.icon === 'repeat' ? 18 : k.icon === 'hand' ? 20 : 24} />}
            {k.bump && <span aria-hidden="true" className="absolute top-1.5 size-2 bg-ink/60" />}
          </>
        )
        return onPress ? (
          <button key={k.key} type="button" aria-label={k.name} onClick={() => onPress(k.key)} className={`${base} ${color} ${shapeClass} cursor-pointer`}>
            {content}
          </button>
        ) : (
          <span key={k.key} className={`${base} ${color} ${shapeClass}`}>
            {content}
          </span>
        )
      })}
    </div>
  )
}

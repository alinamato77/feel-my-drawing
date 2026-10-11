import { PixelIcon } from './PixelIcon'

/** Pixel sound-wave bars driven by the live microphone level, stepping in 8px blocks. */
export function MicWave({ level }: { level: number }) {
  const bars = 13
  return (
    <div className="flex h-40 items-center justify-center gap-2" aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => {
        const centre = 1 - Math.abs(i - (bars - 1) / 2) / ((bars - 1) / 2)
        const raw = 16 + (level * 0.85 + 0.15) * 140 * (0.35 + 0.65 * centre) * (0.75 + 0.25 * Math.sin(i * 1.7 + level * 9))
        const h = Math.min(152, Math.max(16 + 48 * centre, Math.round(raw / 8) * 8))
        return (
          <span
            key={i}
            className="w-4 origin-center animate-[wavebar_0.8s_steps(3)_infinite] bg-white"
            style={{ height: `${h}px`, animationDelay: `${i * 70}ms` }}
          />
        )
      })}
    </div>
  )
}

/** A pixel speaker with arcs pulsing outward: the app is talking. */
export function SpeakerWaves() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <PixelIcon name="speakerBody" size={110} />
      {[60, 90, 120].map((size, i) => (
        <span key={size} className="animate-[ripple_1.2s_steps(3)_infinite]" style={{ animationDelay: `${i * 0.25}s` }}>
          <PixelIcon name="arc" size={size} />
        </span>
      ))}
    </div>
  )
}

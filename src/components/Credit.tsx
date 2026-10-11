import { CREDIT, PRINCIPLE } from '../game/scene'

/** Research credit. */
export function Credit({ className = '' }: { className?: string }) {
  return <p className={`text-sm leading-relaxed text-muted ${className}`}>{CREDIT}</p>
}

/** The key design principle. */
export function Principles({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`px-box-sm bg-card p-4 ${compact ? 'text-base' : 'text-xl'}`}>
      <span className="font-pixel text-[10px] uppercase">Design principle</span>
      <br />
      <span className="font-minion">{PRINCIPLE}</span>
    </p>
  )
}

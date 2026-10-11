import { useState } from 'react'
import type { Bitmap } from '../shapes/types'
import { DOT_PAD } from '../dotpad/config'
import { DotMatrix } from './DotMatrix'

/**
 * Developer panel: shows what the (mock) Dot Pad is displaying. Never rendered
 * on Player B's guessing screen, so it can't give the drawing away.
 */
interface DevPanelProps {
  pattern: Bitmap | null
  onResetHearts: () => void
  onResetPrize: () => void
  onSleep: () => void
}

export function DevPanel({ pattern, onResetHearts, onResetPrize, onSleep }: DevPanelProps) {
  const [open, setOpen] = useState(false)
  const raised = pattern ? pattern.flat().filter(Boolean).length : 0
  return (
    <aside className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2">
      {open && (
        <div id="dev-panel" className="w-[min(92vw,26rem)] px-box bg-canvas p-4">
          <p className="label">Developer panel (dev only) · Dot Pad preview</p>
          <div className="mt-3">
            <DotMatrix bitmap={pattern} size="sm" label={pattern ? `Dot Pad preview, ${raised} pins raised` : 'Dot Pad preview, empty'} />
          </div>
          <p className="mt-2 font-mono text-xs text-muted">
            {DOT_PAD.pinsWide} × {DOT_PAD.pinsTall} pins · {raised} raised
          </p>
          <p className="label mt-4">Hackathon demo tools</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={onResetHearts} className="px-btn min-h-10 cursor-pointer bg-red px-3 text-[10px] text-white">Reset hearts</button>
            <button type="button" onClick={onResetPrize} className="px-btn min-h-10 cursor-pointer bg-card px-3 text-[10px]">Reset prize</button>
            <button type="button" onClick={onSleep} className="px-btn min-h-10 cursor-pointer bg-card px-3 text-[10px]">Sleep now</button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="dev-panel"
        className="min-h-11 cursor-pointer px-box-sm bg-card px-3 font-mono text-xs font-medium hover:bg-yellow"
      >
        {open ? 'Hide' : 'Show'} developer panel
      </button>
    </aside>
  )
}

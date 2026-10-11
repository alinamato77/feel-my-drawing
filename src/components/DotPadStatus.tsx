import { useEffect, useRef, useState } from 'react'
import type { AdapterState } from '../dotpad/DotPadAdapter'
import { DOT_PAD } from '../dotpad/config'
import { supportsTransport } from '../dotpad/RealDotPadAdapter'
import { Button } from './Button'

interface DotPadStatusProps {
  state: AdapterState
  demo: boolean
  onConnectUsb: () => void
  onDemo: () => void
}

/** Connection status chip with a small popover to connect real hardware or stay in Demo Mode. */
export function DotPadStatus({ state, demo, onConnectUsb, onDemo }: DotPadStatusProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const connected = state.status === 'connected'
  const label = state.status === 'connecting' ? 'Connecting…' : connected ? (demo ? 'Demo Mode' : (state.deviceName ?? 'Dot Pad')) : 'Not connected'

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="dotpad-popover"
        className="inline-flex min-h-12 cursor-pointer items-center gap-2 px-box bg-card px-4 font-bold hover:bg-yellow"
      >
        <span aria-hidden="true" className={`size-3 ${connected ? (demo ? 'bg-blue' : 'bg-ok') : 'px-box-sm'}`} />
        <span className="sr-only">Dot Pad status: </span>
        {label}
      </button>
      {open && (
        <div id="dotpad-popover" className="absolute right-0 top-full z-40 mt-2 w-80 px-box bg-canvas p-5">
          <p className="font-bold" role="status">
            {connected ? (demo ? 'Demo Mode: the Dot Pad is simulated.' : `Connected to ${state.deviceName ?? 'Dot Pad'}.`) : 'No Dot Pad connected.'}
          </p>
          {state.error && <p className="mt-2 font-semibold text-bad">{state.error}</p>}
          <p className="mt-3 text-sm text-muted">Plug the Dot Pad into its data port (left side, “d”), switch it on, and use Chrome or Edge.</p>
          <div className="mt-4 flex flex-col gap-3">
            <Button size="md" variant="blue" onClick={onConnectUsb} disabled={!supportsTransport('usb') || state.status === 'connecting'}>
              Connect Dot Pad
            </Button>
            <Button size="md" variant="secondary" onClick={onDemo}>
              Use Demo Mode
            </Button>
          </div>
          <p className="mt-4 font-mono text-[11px] text-muted">
            {DOT_PAD.model}: {DOT_PAD.pinsWide} × {DOT_PAD.pinsTall} pins
          </p>
        </div>
      )}
    </div>
  )
}

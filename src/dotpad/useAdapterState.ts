import { useSyncExternalStore } from 'react'
import type { AdapterState, DotPadAdapter } from './DotPadAdapter'

const IDLE: AdapterState = { status: 'disconnected', pattern: null, deviceName: null, error: null }

export function useAdapterState(adapter: DotPadAdapter | null): AdapterState {
  return useSyncExternalStore(
    (onChange) => adapter?.subscribe(onChange) ?? (() => {}),
    () => adapter?.getState() ?? IDLE,
  )
}

import type { Bitmap } from '../shapes/types'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface AdapterState {
  status: ConnectionStatus
  /** Pattern currently raised on the (real or simulated) display, if any. */
  pattern: Bitmap | null
  deviceName: string | null
  error: string | null
}

/**
 * Everything the game needs from a tactile display. The game only talks to
 * this interface, so the browser simulation and real hardware are interchangeable.
 */
export interface DotPadAdapter {
  readonly kind: 'mock' | 'real'
  connect(): Promise<void>
  disconnect(): Promise<void>
  displayPattern(bitmap: Bitmap): Promise<void>
  clearPattern(): Promise<void>
  getConnectionStatus(): ConnectionStatus
  getState(): AdapterState
  /** Notified on every state change; returns an unsubscribe function. */
  subscribe(listener: (state: AdapterState) => void): () => void
  /**
   * Hardware key presses (e.g. "KeyFunction1", "PanningLeft"), if the device
   * reports them. Returns an unsubscribe function.
   */
  onKey?(listener: (key: string) => void): () => void
}

/** Small shared helper for adapters to manage and broadcast their state. */
export class AdapterStore {
  private state: AdapterState = { status: 'disconnected', pattern: null, deviceName: null, error: null }
  private listeners = new Set<(state: AdapterState) => void>()

  get = () => this.state

  set(patch: Partial<AdapterState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((l) => l(this.state))
  }

  subscribe(listener: (state: AdapterState) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}

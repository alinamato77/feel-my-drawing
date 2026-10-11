import type { Bitmap } from '../shapes/types'
import { AdapterStore } from './DotPadAdapter'
import type { DotPadAdapter } from './DotPadAdapter'

/** Key names as reported by the official SDK's onKeyDown callback. */
export type DotPadKeyName = 'KeyFunction1' | 'KeyFunction2' | 'KeyFunction3' | 'KeyFunction4' | 'PanningLeft' | 'PanningRight'

/**
 * Demo Mode: a Dot Pad simulated in the browser. Patterns are kept in memory
 * and drawn on screen by the <DotMatrix> component. It never claims to be a
 * physical device.
 */
export class MockDotPadAdapter implements DotPadAdapter {
  readonly kind = 'mock' as const
  private store = new AdapterStore()
  private keyListeners = new Set<(key: string) => void>()

  /** Simulate a press of a Dot Pad hardware key (same names the SDK reports). */
  pressKey(key: DotPadKeyName) {
    this.keyListeners.forEach((l) => l(key))
  }

  onKey(listener: (key: string) => void) {
    this.keyListeners.add(listener)
    return () => {
      this.keyListeners.delete(listener)
    }
  }

  async connect() {
    this.store.set({ status: 'connected', deviceName: 'Simulated Dot Pad (Demo Mode)', error: null })
  }

  async disconnect() {
    this.store.set({ status: 'disconnected', pattern: null, deviceName: null })
  }

  async displayPattern(bitmap: Bitmap) {
    this.store.set({ pattern: bitmap })
  }

  async clearPattern() {
    this.store.set({ pattern: null })
  }

  getConnectionStatus = () => this.store.get().status
  getState = () => this.store.get()
  subscribe = (listener: Parameters<DotPadAdapter['subscribe']>[0]) => this.store.subscribe(listener)
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  REAL HARDWARE — official Dot Pad Web SDK integration
 * ─────────────────────────────────────────────────────────────────────────
 *  SDK:   DotPadSDK-3.0.3.js (vendored in ./sdk), from Dot Inc.'s official
 *         repository: https://github.com/dotincorp/dotpad-sdk-guide/tree/main/Web/3.0.3
 *  Calls used (all documented in that repository's README):
 *    new DotPadScanner().startUsbScan() / .startBleScan()
 *    new DotPadSDK().setCallBack(...)          (incl. the onKeyDown callback → onKey)
 *    sdk.connectUsbDevice(port) / sdk.connectBleDevice(device)  → DotDevice | null
 *    sdk.displayGraphicData(hex, device)   sdk.displayAllDown(device)
 *    DataCodes.ResponseDisplayLineComplete   (display finished → displayPattern resolves)
 *    sdk.disconnect(device)
 *  Requirements: Chrome/Edge (Web Serial + Web Bluetooth), served from
 *  https or localhost.
 *
 *  To upgrade the SDK, drop the new .js/.d.ts into ./sdk and update the
 *  import path below. Nothing else in the game talks to the SDK directly.
 * ─────────────────────────────────────────────────────────────────────────
 */
import type { Bitmap } from '../shapes/types'
import { AdapterStore } from './DotPadAdapter'
import type { DotPadAdapter } from './DotPadAdapter'
import { bitmapToGraphicHex } from './encode'
import { DataCodes, DotPadScanner, DotPadSDK } from './sdk/DotPadSDK-3.0.3.js'
import type { DotDevice } from './sdk/DotPadSDK-3.0.3.js'

export type Transport = 'usb' | 'bluetooth'

export function supportsTransport(transport: Transport) {
  if (typeof navigator === 'undefined') return false
  return transport === 'usb' ? 'serial' in navigator : 'bluetooth' in navigator
}

export class RealDotPadAdapter implements DotPadAdapter {
  readonly kind = 'real' as const
  private store = new AdapterStore()
  private sdk: DotPadSDK | null = null
  private device: DotDevice | null = null
  private transport: Transport
  private keyListeners = new Set<(key: string) => void>()
  private lineComplete: (() => void) | null = null

  constructor(transport: Transport = 'usb') {
    this.transport = transport
  }

  async connect() {
    if (!supportsTransport(this.transport)) {
      this.fail(
        this.transport === 'usb'
          ? 'This browser can’t talk to USB devices. Please use Chrome or Edge on a computer.'
          : 'This browser doesn’t support Bluetooth devices. Please use Chrome or Edge.',
      )
      return
    }
    this.store.set({ status: 'connecting', error: null })
    try {
      this.sdk ??= this.createSdk()
      const scanner = new DotPadScanner()
      // Opens the browser's own device picker; resolves undefined if the user cancels.
      const target = this.transport === 'usb' ? await scanner.startUsbScan() : await scanner.startBleScan()
      if (!target) {
        this.store.set({ status: 'disconnected' })
        return
      }
      const device =
        this.transport === 'usb'
          ? await this.sdk.connectUsbDevice(target as SerialPort)
          : await this.sdk.connectBleDevice(target as BluetoothDevice)
      if (!device) {
        this.fail('The Dot Pad didn’t respond. Check it’s switched on and plugged into its data port, then try again.')
        return
      }
      this.device = device
      this.store.set({ status: 'connected', deviceName: device.cellType || 'Dot Pad', error: null })
    } catch (err) {
      this.fail(err instanceof Error ? err.message : 'Connection failed.')
    }
  }

  async disconnect() {
    if (this.sdk && this.device) {
      try {
        this.sdk.displayAllDown(this.device)
        this.sdk.disconnect(this.device)
      } catch {
        // Device may already be gone (unplugged); state is reset below either way.
      }
    }
    this.device = null
    this.store.set({ status: 'disconnected', pattern: null, deviceName: null })
  }

  async displayPattern(bitmap: Bitmap) {
    if (!this.sdk || !this.device) throw new Error('Dot Pad is not connected.')
    const hex = bitmapToGraphicHex(bitmap, this.device.numberCellColumns || 30, this.device.numberCellRows || 10)
    // Resolve when the SDK reports DataCodes.ResponseDisplayLineComplete (documented
    // in the Web SDK README), so callers can wait for the pins to finish moving.
    // A timeout keeps the game going if the confirmation never arrives.
    const done = new Promise<void>((resolve) => {
      const timer = window.setTimeout(() => {
        this.lineComplete = null
        resolve()
      }, 3000)
      this.lineComplete = () => {
        window.clearTimeout(timer)
        this.lineComplete = null
        resolve()
      }
    })
    this.sdk.displayGraphicData(hex, this.device)
    this.store.set({ pattern: bitmap })
    await done
  }

  async clearPattern() {
    if (this.sdk && this.device) this.sdk.displayAllDown(this.device)
    this.store.set({ pattern: null })
  }

  onKey(listener: (key: string) => void) {
    this.keyListeners.add(listener)
    return () => {
      this.keyListeners.delete(listener)
    }
  }

  getConnectionStatus = () => this.store.get().status
  getState = () => this.store.get()
  subscribe = (listener: Parameters<DotPadAdapter['subscribe']>[0]) => this.store.subscribe(listener)

  private createSdk() {
    const sdk = new DotPadSDK()
    sdk.setCallBack((device, code) => {
      if (device === this.device && code === DataCodes.ResponseDisplayLineComplete) this.lineComplete?.()
      if (device === this.device && code === DataCodes.Disconnected) {
        this.device = null
        this.store.set({ status: 'disconnected', pattern: null, deviceName: null, error: 'The Dot Pad was disconnected.' })
      }
    }, null, (device, key) => {
      // Documented SDK v3.0.1+ onKeyDown callback: one DotPadKey per press —
      // KeyFunction1–4, PanningLeft, PanningRight.
      if (device === this.device) this.keyListeners.forEach((l) => l(String(key)))
    })
    return sdk
  }

  private fail(message: string) {
    this.store.set({ status: 'error', error: message })
  }
}

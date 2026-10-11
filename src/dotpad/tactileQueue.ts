import type { Bitmap } from '../shapes/types'
import type { DotPadAdapter } from './DotPadAdapter'

export interface Frame {
  bitmap: Bitmap
  /** How long to hold this frame before the next (ms). */
  hold?: number
}

/**
 * Serialises every update to the Dot Pad. The hardware needs time to refresh,
 * so frames are sent one at a time with a minimum gap, and starting a new
 * sequence cancels the rest of the previous one (no overlapping commands).
 */
export class TactileQueue {
  private run = 0
  private chain: Promise<void> = Promise.resolve()
  private adapter: DotPadAdapter

  constructor(adapter: DotPadAdapter) {
    this.adapter = adapter
  }

  /** Minimum time between hardware updates. */
  get minGap() {
    return this.adapter.kind === 'real' ? 1000 : 350
  }

  /** Replace whatever is playing with this sequence. Resolves when it finishes or is superseded. */
  play(frames: Frame[]): Promise<void> {
    const id = ++this.run
    this.chain = this.chain
      .catch(() => {})
      .then(async () => {
        for (const f of frames) {
          if (id !== this.run) return
          await this.adapter.displayPattern(f.bitmap).catch(() => {})
          await new Promise((r) => setTimeout(r, Math.max(this.minGap, f.hold ?? 0)))
        }
      })
    return this.chain
  }

  /**
   * Show one bitmap (cancels any running sequence). Resolves once the display has
   * been updated (on hardware: after the SDK confirms) plus the minimum gap.
   */
  show(bitmap: Bitmap) {
    return this.play([{ bitmap, hold: 0 }])
  }

  clear() {
    this.run++
    this.chain = this.chain.catch(() => {}).then(() => this.adapter.clearPattern().catch(() => {}))
    return this.chain
  }
}

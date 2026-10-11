import type { Bitmap } from '../shapes/types'

/**
 * Pin layout inside one graphic cell (2 pins wide × 4 tall), as documented by
 * the official Dot Pad Web SDK 3.0.3 (`PIN_BIT_TABLE`, column-major):
 * left column = 0x01, 0x02, 0x04, 0x08 (top → bottom); right column = 0x10 … 0x80.
 */
export function pinBit(dx: number, dy: number) {
  return (dx === 0 ? 0x01 : 0x10) << dy
}

/**
 * Convert a binary bitmap to the SDK's graphic hex string: two hex characters
 * per cell, cells ordered row by row from the top-left. The bitmap is centred
 * on the device's pin grid, so displays of other sizes still work.
 */
export function bitmapToGraphicHex(bitmap: Bitmap, cellColumns: number, cellRows: number): string {
  const pinW = cellColumns * 2
  const pinH = cellRows * 4
  const offsetX = Math.floor((pinW - (bitmap[0]?.length ?? 0)) / 2)
  const offsetY = Math.floor((pinH - bitmap.length) / 2)
  let hex = ''
  for (let row = 0; row < cellRows; row++) {
    for (let col = 0; col < cellColumns; col++) {
      let byte = 0
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const x = col * 2 + dx - offsetX
          const y = row * 4 + dy - offsetY
          if (bitmap[y]?.[x]) byte |= pinBit(dx, dy)
        }
      }
      hex += byte.toString(16).padStart(2, '0').toUpperCase()
    }
  }
  return hex
}

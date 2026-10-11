/**
 * The Dot Pad model this experience was built and tested against.
 * DotPad320X (Dot Inc.): 300-cell graphic area of 30 × 10 cells, each cell
 * 2 × 4 pins → 60 × 40 pins, plus a 20-cell braille text line. Graphic data
 * is sent to the official Web SDK as hex, 2 characters per cell, row by row
 * (see encode.ts). These values match what the device reported over USB.
 */
export const DOT_PAD = {
  model: 'DotPad320X',
  cellColumns: 30,
  cellRows: 10,
  pinsWide: 60,
  pinsTall: 40,
  textCells: 20,
} as const

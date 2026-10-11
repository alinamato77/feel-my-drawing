/**
 * Shape data shared by the on-screen illustrations and the tactile bitmaps.
 *
 * Coordinates live on the Dot Pad's pin grid: x = 0..59, y = 0..39, with a pin
 * centred on every integer coordinate. The same primitives are rendered to SVG
 * (for the screen) and rasterised to a binary matrix (for the Dot Pad), so the
 * two can never drift apart.
 */

export type Point = readonly [number, number]

/** Visual colour role; tactile output ignores colour. */
export type Tone = 'primary' | 'secondary' | 'accent' | 'ink'

interface PrimitiveBase {
  /** Filled area (raised pins inside) vs. outline only. */
  fill?: boolean
  /** Outline width in pins. Ignored when `fill` is set and `stroke` is 0. */
  stroke?: number
  /** Erase instead of draw: lowers pins (e.g. eyes cut out of a head). */
  erase?: boolean
  tone?: Tone
}

export interface EllipsePrimitive extends PrimitiveBase {
  kind: 'ellipse'
  cx: number
  cy: number
  rx: number
  ry: number
}

export interface PolygonPrimitive extends PrimitiveBase {
  kind: 'polygon'
  points: readonly Point[]
}

export interface PolylinePrimitive extends PrimitiveBase {
  kind: 'polyline'
  points: readonly Point[]
}

export type Primitive = EllipsePrimitive | PolygonPrimitive | PolylinePrimitive

export interface Shape {
  id: string
  /** Spoken description, used for screen readers and the results summary. */
  label: string
  primitives: readonly Primitive[]
}

/** Tactile pattern: rows of 0/1, `bitmap[y][x]`. */
export type Bitmap = number[][]

export const GRID_WIDTH = 60
export const GRID_HEIGHT = 40

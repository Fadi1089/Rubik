export type Axis = 'x' | 'y' | 'z'

/** Integer grid vector. Cubie coordinates are always -1, 0 or 1 on each axis. */
export type Vec3 = readonly [number, number, number]

/** Row-major 3x3 integer rotation matrix. */
export type Mat3 = readonly [number, number, number, number, number, number, number, number, number]

/** The six outer faces, also used as sticker colour identities (a sticker is "the U colour"). */
export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B'

/** Whole-cube rotations: x follows R, y follows U, z follows F. */
export type Rotation = 'x' | 'y' | 'z'

/** Wide (two-layer) turns: an outer face plus the middle layer next to it. `r` is R and M'. */
export type WideFace = 'u' | 'd' | 'l' | 'r' | 'f' | 'b'

/** Faces, wide turns, the three slice layers (M follows L, E follows D, S follows F) and the
 * rotations. */
export type MoveFace = Face | WideFace | 'M' | 'E' | 'S' | Rotation

/** Which layer an axis turn moves: a coordinate on the axis, or `null` for the whole cube. */
export type Layer = -1 | 0 | 1 | null

/** 1 = clockwise quarter turn, -1 = prime (anticlockwise), 2 = half turn. */
export type MoveAmount = 1 | -1 | 2

export interface Move {
  readonly face: MoveFace
  readonly amount: MoveAmount
}

/** A move expressed geometrically: rotate the layer at `layer` on `axis` by `quarters` * 90°,
 * counter-clockwise when looking from the positive end of the axis (right-hand rule). */
export interface AxisTurn {
  readonly axis: Axis
  readonly layer: Layer
  readonly quarters: number
  /** Also turn the middle layer (layer 0) along with `layer`. */
  readonly wide?: boolean
}

export interface Cubie {
  /** Stable identity, 0..26. */
  readonly id: number
  /** Where the cubie lives on a solved cube; its stickers point along the non-zero components. */
  readonly home: Vec3
  readonly position: Vec3
  /** Rotation from the home orientation to the current one. */
  readonly orientation: Mat3
}

/** All 27 cubies, indexed by id. */
export type CubeState = readonly Cubie[]

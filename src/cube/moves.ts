import type { Axis, AxisTurn, Layer, Move, MoveAmount, MoveFace } from './types'

/** Geometry of each move's clockwise quarter turn. Coordinates follow Three.js:
 * +x is R, +y is U, +z is F. "Clockwise" is as seen looking at that face, which is
 * a negative right-hand rotation for R/U/F and a positive one for L/D/B. */
const MOVE_TURNS: Record<MoveFace, AxisTurn> = {
  R: { axis: 'x', layer: 1, quarters: -1 },
  M: { axis: 'x', layer: 0, quarters: 1 },
  L: { axis: 'x', layer: -1, quarters: 1 },
  U: { axis: 'y', layer: 1, quarters: -1 },
  E: { axis: 'y', layer: 0, quarters: 1 },
  D: { axis: 'y', layer: -1, quarters: 1 },
  F: { axis: 'z', layer: 1, quarters: -1 },
  S: { axis: 'z', layer: 0, quarters: -1 },
  B: { axis: 'z', layer: -1, quarters: 1 },
  r: { axis: 'x', layer: 1, quarters: -1, wide: true },
  l: { axis: 'x', layer: -1, quarters: 1, wide: true },
  u: { axis: 'y', layer: 1, quarters: -1, wide: true },
  d: { axis: 'y', layer: -1, quarters: 1, wide: true },
  f: { axis: 'z', layer: 1, quarters: -1, wide: true },
  b: { axis: 'z', layer: -1, quarters: 1, wide: true },
  x: { axis: 'x', layer: null, quarters: -1 },
  y: { axis: 'y', layer: null, quarters: -1 },
  z: { axis: 'z', layer: null, quarters: -1 },
}

export const OUTER_FACES = ['U', 'D', 'L', 'R', 'F', 'B'] as const

/** Face, optional "w" for wide (Rw is the same as r), then amount. */
const MOVE_PATTERN = /^([UDLRFBMESxyzudlrfb])(w?)(2'?|['’])?$/

/** Whole-cube rotations change the view of the cube, not the puzzle, so they don't count as moves. */
export function isRotation(move: Move): boolean {
  return move.face === 'x' || move.face === 'y' || move.face === 'z'
}

export function getAxisTurn(move: Move): AxisTurn {
  const base = MOVE_TURNS[move.face]
  return { ...base, quarters: base.quarters * move.amount }
}

/** Find the notation move for a single quarter turn of a layer (or of the whole cube). */
export function moveFromAxisTurn(axis: Axis, layer: Layer, quarters: 1 | -1): Move {
  const entry = (Object.entries(MOVE_TURNS) as [MoveFace, AxisTurn][]).find(
    ([, turn]) => turn.axis === axis && turn.layer === layer && !turn.wide,
  )
  if (!entry) throw new Error(`No move for axis ${axis} layer ${layer}`)
  const [face, turn] = entry
  return { face, amount: turn.quarters === quarters ? 1 : -1 }
}

export function invertMove(move: Move): Move {
  return { face: move.face, amount: move.amount === 2 ? 2 : (-move.amount as MoveAmount) }
}

export function invertSequence(moves: readonly Move[]): Move[] {
  return moves.toReversed().map(invertMove)
}

export function parseMove(token: string): Move {
  const match = token.trim().match(MOVE_PATTERN)
  if (!match || (match[2] === 'w' && !/[UDLRFB]/.test(match[1]))) {
    throw new Error(`Invalid move: "${token}"`)
  }
  const face = (match[2] === 'w' ? match[1].toLowerCase() : match[1]) as MoveFace
  const suffix = match[3] ?? ''
  const amount: MoveAmount = suffix.startsWith('2') ? 2 : suffix === '' ? 1 : -1
  return { face, amount }
}

/** Parses space-separated moves. Brackets used for grouping, like "(R U R' U')", are ignored. */
export function parseAlgorithm(text: string): Move[] {
  return text
    .replace(/[()[\]]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(parseMove)
}

export function formatMove(move: Move): string {
  return move.face + (move.amount === 2 ? '2' : move.amount === -1 ? "'" : '')
}

export function formatAlgorithm(moves: readonly Move[]): string {
  return moves.map(formatMove).join(' ')
}

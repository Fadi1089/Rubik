import type { Axis, AxisTurn, Move, MoveAmount, MoveFace } from './types'

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
}

export const OUTER_FACES = ['U', 'D', 'L', 'R', 'F', 'B'] as const

const MOVE_PATTERN = /^([UDLRFBMES])(2'?|['’])?$/

export function getAxisTurn(move: Move): AxisTurn {
  const base = MOVE_TURNS[move.face]
  return { ...base, quarters: base.quarters * move.amount }
}

/** Find the notation move for a single quarter turn of a layer. */
export function moveFromAxisTurn(axis: Axis, layer: -1 | 0 | 1, quarters: 1 | -1): Move {
  const entry = (Object.entries(MOVE_TURNS) as [MoveFace, AxisTurn][]).find(
    ([, turn]) => turn.axis === axis && turn.layer === layer,
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
  if (!match) throw new Error(`Invalid move: "${token}"`)
  const face = match[1] as MoveFace
  const suffix = match[2] ?? ''
  const amount: MoveAmount = suffix.startsWith('2') ? 2 : suffix === '' ? 1 : -1
  return { face, amount }
}

export function parseAlgorithm(text: string): Move[] {
  return text.split(/\s+/).filter(Boolean).map(parseMove)
}

export function formatMove(move: Move): string {
  return move.face + (move.amount === 2 ? '2' : move.amount === -1 ? "'" : '')
}

export function formatAlgorithm(moves: readonly Move[]): string {
  return moves.map(formatMove).join(' ')
}

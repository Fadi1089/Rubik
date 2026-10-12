import {
  IDENTITY,
  axisIndex,
  axisRotation,
  matEquals,
  multiply,
  transform,
  vecEquals,
} from './math'
import { getAxisTurn } from './moves'
import type { AxisTurn, CubeState, Cubie, Move } from './types'

export function createSolvedCube(): CubeState {
  const cubies: Cubie[] = []
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        cubies.push({
          id: cubies.length,
          home: [x, y, z],
          position: [x, y, z],
          orientation: IDENTITY,
        })
      }
    }
  }
  return cubies
}

export function isInLayer(cubie: Cubie, turn: Pick<AxisTurn, 'axis' | 'layer' | 'wide'>): boolean {
  if (turn.layer === null) return true
  const coord = cubie.position[axisIndex(turn.axis)]
  return coord === turn.layer || (turn.wide === true && coord === 0)
}

export function applyAxisTurn(state: CubeState, turn: AxisTurn): CubeState {
  const rotation = axisRotation(turn.axis, turn.quarters)
  return state.map((cubie) =>
    isInLayer(cubie, turn)
      ? {
          ...cubie,
          position: transform(rotation, cubie.position),
          orientation: multiply(rotation, cubie.orientation),
        }
      : cubie,
  )
}

export function applyMove(state: CubeState, move: Move): CubeState {
  return applyAxisTurn(state, getAxisTurn(move))
}

export function applyMoves(state: CubeState, moves: readonly Move[]): CubeState {
  return moves.reduce(applyMove, state)
}

/** Exact equality, including the orientation of centres and the core. */
export function cubesEqual(a: CubeState, b: CubeState): boolean {
  return (
    a.length === b.length &&
    a.every(
      (cubie, i) =>
        vecEquals(cubie.position, b[i].position) && matEquals(cubie.orientation, b[i].orientation),
    )
  )
}

import { getAxisTurn, OUTER_FACES } from './moves'
import type { Move, MoveAmount } from './types'

export const DEFAULT_SCRAMBLE_LENGTH = 25

/** mulberry32: tiny, fast, and good enough for shuffling a puzzle. Returns floats in [0, 1). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0x1_0000_0000)
}

const AMOUNTS: readonly MoveAmount[] = [1, -1, 2]

/**
 * Random-move scramble over the outer faces. Never turns the same face twice in a row and
 * never does three turns on one axis in a row (e.g. R L R), both of which would waste moves.
 */
export function generateScramble(seed: number, length = DEFAULT_SCRAMBLE_LENGTH): Move[] {
  const rng = createRng(seed)
  const moves: Move[] = []
  while (moves.length < length) {
    const face = OUTER_FACES[Math.floor(rng() * OUTER_FACES.length)]
    const prev = moves.at(-1)
    const prev2 = moves.at(-2)
    if (prev?.face === face) continue
    const axis = getAxisTurn({ face, amount: 1 }).axis
    if (prev && prev2 && getAxisTurn(prev).axis === axis && getAxisTurn(prev2).axis === axis) {
      continue
    }
    moves.push({ face, amount: AMOUNTS[Math.floor(rng() * AMOUNTS.length)] })
  }
  return moves
}

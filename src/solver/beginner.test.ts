import { describe, expect, it } from 'vitest'
import {
  applyMoves,
  createSolvedCube,
  generateScramble,
  isSolved,
  parseAlgorithm,
  type CubeState,
} from '../cube'
import { planHint, STAGES, type Hint } from './beginner'

/** Follow the tutor's hints from `start` until solved, like an obedient player would. */
function followHints(start: CubeState) {
  let state = start
  let previous: Hint | undefined
  const hints: Hint[] = []
  for (let i = 0; i < 200; i++) {
    const hint = planHint(state, previous)
    if (!hint) break
    hints.push(hint)
    state = applyMoves(state, hint.moves)
    previous = hint
  }
  return { state, hints, moves: hints.reduce((n, h) => n + h.moves.length, 0) }
}

describe('beginner tutor', () => {
  it('has nothing to say about a solved cube', () => {
    expect(planHint(createSolvedCube())).toBeNull()
  })

  it.each(Array.from({ length: 30 }, (_, i) => i + 1))('solves scramble #%i', (seed) => {
    const { state, hints, moves } = followHints(
      applyMoves(createSolvedCube(), generateScramble(seed)),
    )
    expect(isSolved(state)).toBe(true)
    expect(moves).toBeLessThan(400)
    for (const hint of hints) {
      expect(hint.moves.length).toBeGreaterThan(0)
      expect(hint.text.length).toBeGreaterThan(20)
    }
    // Stages only move forward, apart from the deliberate mess while twisting corners.
    const order = hints.map((h) => STAGES.findIndex((s) => s.id === h.stage))
    for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThanOrEqual(order[i - 1])
  })

  it('starts by turning white to the bottom when it is elsewhere', () => {
    const hint = planHint(applyMoves(createSolvedCube(), parseAlgorithm('R U F')))
    expect(hint?.stage).toBe('orient')
  })

  it('copes with a cube that was rolled and sliced mid-solve', () => {
    const start = applyMoves(createSolvedCube(), parseAlgorithm("x' M2 R U' y E F2 L"))
    expect(isSolved(followHints(start).state)).toBe(true)
  })

  it('works from the twisting stage after a fresh replan', () => {
    // Two corners twisted in place: the last step of the method.
    const twisted = applyMoves(
      applyMoves(createSolvedCube(), parseAlgorithm('z2')),
      parseAlgorithm("R' D' R D R' D' R D U R' D' R D R' D' R D R' D' R D R' D' R D U'"),
    )
    const first = planHint(twisted)
    expect(first?.stage).toBe('corner-twists')
    expect(isSolved(followHints(twisted).state)).toBe(true)
  })
})

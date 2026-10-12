import { describe, expect, it } from 'vitest'
import {
  applyMove,
  applyMoves,
  createSolvedCube,
  cubesEqual,
  faceletString,
  formatAlgorithm,
  generateScramble,
  getAxisTurn,
  invertSequence,
  isSolved,
  moveFromAxisTurn,
  parseAlgorithm,
  parseMove,
  type Move,
  type MoveAmount,
  type MoveFace,
} from './index'

const FACES: MoveFace[] = ['U', 'D', 'L', 'R', 'F', 'B', 'M', 'E', 'S']
const AMOUNTS: MoveAmount[] = [1, -1, 2]
const ALL_MOVES: Move[] = FACES.flatMap((face) => AMOUNTS.map((amount) => ({ face, amount })))

const SOLVED_FACELETS = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB'

describe('moves', () => {
  it.each(ALL_MOVES)('applying $face ($amount) four times returns the original state', (move) => {
    const scrambled = applyMoves(createSolvedCube(), generateScramble(42))
    for (const start of [createSolvedCube(), scrambled]) {
      let state = start
      for (let i = 0; i < 4; i++) state = applyMove(state, move)
      expect(cubesEqual(state, start)).toBe(true)
    }
  })

  it('changes the state for every single move', () => {
    const solved = createSolvedCube()
    for (const move of ALL_MOVES) {
      expect(cubesEqual(applyMove(solved, move), solved)).toBe(false)
    }
  })

  it('a sequence followed by its inverse returns to solved', () => {
    const sequences = [
      parseAlgorithm("R U R' U'"),
      parseAlgorithm("F R U' R' U' R U R' F' R U R' U' R' F R F'"),
      parseAlgorithm('M2 E S2 M E2 S'),
      generateScramble(1),
      generateScramble(2024, 100),
    ]
    for (const sequence of sequences) {
      const state = applyMoves(createSolvedCube(), [...sequence, ...invertSequence(sequence)])
      expect(cubesEqual(state, createSolvedCube())).toBe(true)
      expect(isSolved(state)).toBe(true)
    }
  })

  it('moves the expected stickers for U (front top row receives the right face)', () => {
    const facelets = faceletString(applyMove(createSolvedCube(), parseMove('U')))
    expect(facelets.slice(18, 21)).toBe('RRR') // F top row
    expect(facelets.slice(9, 12)).toBe('BBB') // R top row
    expect(facelets.slice(0, 9)).toBe('UUUUUUUUU')
  })

  it('maps a layer quarter turn back to notation', () => {
    for (const face of FACES) {
      for (const amount of [1, -1] as const) {
        const turn = getAxisTurn({ face, amount })
        expect(moveFromAxisTurn(turn.axis, turn.layer, turn.quarters as 1 | -1)).toEqual({
          face,
          amount,
        })
      }
    }
  })
})

describe('isSolved', () => {
  it('is true for a fresh cube', () => {
    expect(faceletString(createSolvedCube())).toBe(SOLVED_FACELETS)
    expect(isSolved(createSolvedCube())).toBe(true)
  })

  it('is false after any single outer or slice move', () => {
    for (const move of ALL_MOVES) {
      expect(isSolved(applyMove(createSolvedCube(), move))).toBe(false)
    }
  })

  it('is false for a scramble', () => {
    expect(isSolved(applyMoves(createSolvedCube(), generateScramble(7)))).toBe(false)
  })

  it('is true after a whole-cube rotation, since every face is still one colour', () => {
    const rotated = applyMoves(createSolvedCube(), parseAlgorithm("R M' L'")) // x rotation
    expect(cubesEqual(rotated, createSolvedCube())).toBe(false)
    expect(isSolved(rotated)).toBe(true)
  })
})

describe('notation', () => {
  it('parses and formats round-trip', () => {
    const text = "U D' L2 R F' B2 M E' S2"
    expect(formatAlgorithm(parseAlgorithm(text))).toBe(text)
  })

  it('rejects invalid tokens', () => {
    expect(() => parseMove('X')).toThrow()
    expect(() => parseMove('R3')).toThrow()
  })
})

describe('scramble', () => {
  it('is deterministic for a seed and has the requested length', () => {
    expect(generateScramble(123)).toEqual(generateScramble(123))
    expect(generateScramble(123)).not.toEqual(generateScramble(124))
    expect(generateScramble(123)).toHaveLength(25)
  })

  it('never repeats a face or turns one axis three times in a row', () => {
    const moves = generateScramble(99, 500)
    for (let i = 1; i < moves.length; i++) {
      expect(moves[i].face).not.toBe(moves[i - 1].face)
      if (i >= 2) {
        const axes = [moves[i - 2], moves[i - 1], moves[i]].map((m) => getAxisTurn(m).axis)
        expect(new Set(axes).size).toBeGreaterThan(1)
      }
    }
  })
})

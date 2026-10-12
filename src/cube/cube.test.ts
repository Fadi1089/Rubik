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
  DEFAULT_VIEW,
  invertSequence,
  isRotation,
  isSolved,
  moveInView,
  moveFromAxisTurn,
  parseAlgorithm,
  parseMove,
  snapViewFrame,
  viewRoll,
  viewSlice,
  viewTurn,
  type Move,
  type MoveAmount,
  type MoveFace,
} from './index'

const LAYER_FACES: MoveFace[] = [
  ...['U', 'D', 'L', 'R', 'F', 'B', 'M', 'E', 'S'],
  ...['u', 'd', 'l', 'r', 'f', 'b'],
] as MoveFace[]
const FACES: MoveFace[] = [...LAYER_FACES, 'x', 'y', 'z']
const AMOUNTS: MoveAmount[] = [1, -1, 2]
const withAmounts = (faces: MoveFace[]): Move[] =>
  faces.flatMap((face) => AMOUNTS.map((amount) => ({ face, amount })))
/** Every move, including whole-cube rotations. */
const ALL_MOVES = withAmounts(FACES)
/** Moves that turn part of the cube, so they always unsolve a solved cube. */
const LAYER_MOVES = withAmounts(LAYER_FACES)

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

  it('maps a single-layer or whole-cube quarter turn back to notation', () => {
    for (const face of FACES.filter((f) => !/^[udlrfb]$/.test(f))) {
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
    for (const move of LAYER_MOVES) {
      expect(isSolved(applyMove(createSolvedCube(), move))).toBe(false)
    }
  })

  it('is false for a scramble', () => {
    expect(isSolved(applyMoves(createSolvedCube(), generateScramble(7)))).toBe(false)
  })

  it('is true after a whole-cube rotation, since every face is still one colour', () => {
    for (const move of withAmounts(['x', 'y', 'z'])) {
      const rotated = applyMove(createSolvedCube(), move)
      expect(cubesEqual(rotated, createSolvedCube())).toBe(false)
      expect(isSolved(rotated)).toBe(true)
    }
  })
})

describe('rotations', () => {
  it('and wide turns match their layer-by-layer equivalents exactly', () => {
    const scrambled = applyMoves(createSolvedCube(), generateScramble(3))
    const pairs: [string, string][] = [
      ['r', "R M'"],
      ['l', 'L M'],
      ['u', "U E'"],
      ['d', 'D E'],
      ['f', 'F S'],
      ['b', "B S'"],
      ["Rw2'", 'r2'],
      ['x', "R M' L'"],
      ['y', "U E' D'"],
      ['z', "F S B'"],
    ]
    for (const [rotation, layers] of pairs) {
      expect(
        cubesEqual(
          applyMoves(scrambled, parseAlgorithm(rotation)),
          applyMoves(scrambled, parseAlgorithm(layers)),
        ),
      ).toBe(true)
    }
  })

  it('are recognised as rotations', () => {
    expect(isRotation(parseMove("y'"))).toBe(true)
    expect(isRotation(parseMove('R'))).toBe(false)
  })
})

describe('view-relative controls', () => {
  it('map to standard notation when looking at the front face', () => {
    const sides = ['front', 'back', 'up', 'down', 'left', 'right'] as const
    expect(sides.map((side) => formatAlgorithm([viewTurn(DEFAULT_VIEW, side)]))).toEqual([
      'F',
      'B',
      'U',
      'D',
      'L',
      'R',
    ])
    expect(formatAlgorithm([viewTurn(DEFAULT_VIEW, 'front', -1)])).toBe("F'")
  })

  it('follow the view when looking at another face', () => {
    // Looking at the right face, upright: the back face is on the viewer's right.
    const frame = { front: [1, 0, 0], up: [0, 1, 0] } as const
    expect(formatAlgorithm([viewTurn(frame, 'front')])).toBe('R')
    expect(formatAlgorithm([viewTurn(frame, 'right')])).toBe('B')
    expect(formatAlgorithm([viewTurn(frame, 'left')])).toBe('F')
  })

  it('turns the middle row and column like their neighbours', () => {
    expect(formatAlgorithm([viewSlice(DEFAULT_VIEW, 'up')])).toBe("E'") // middle row ←, like U
    expect(formatAlgorithm([viewSlice(DEFAULT_VIEW, 'right')])).toBe("M'") // middle column ↑, like R
    const sideways = { front: [1, 0, 0], up: [0, 1, 0] } as const
    // Looking at R, the middle column is the S layer; S follows F, which pushes it down here.
    expect(formatAlgorithm([viewSlice(sideways, 'right')])).toBe("S'")
  })

  it('re-express algorithms for another viewpoint', () => {
    const fromLeft = { front: [-1, 0, 0], up: [0, 1, 0] } as const
    const moves = parseAlgorithm("R U R' F2").map((m) => moveInView(fromLeft, m))
    expect(formatAlgorithm(moves)).toBe("F U F' L2")
  })

  it('rolls the cube the way the arrow points', () => {
    expect(formatAlgorithm([viewRoll(DEFAULT_VIEW, 'up')])).toBe('x')
    expect(formatAlgorithm([viewRoll(DEFAULT_VIEW, 'down')])).toBe("x'")
    expect(formatAlgorithm([viewRoll(DEFAULT_VIEW, 'left')])).toBe('y')
    expect(formatAlgorithm([viewRoll(DEFAULT_VIEW, 'right')])).toBe("y'")
  })

  it('rolling up brings the bottom face to the front', () => {
    const rolled = applyMove(createSolvedCube(), viewRoll(DEFAULT_VIEW, 'up'))
    expect(faceletString(rolled).slice(18, 27)).toBe('DDDDDDDDD')
  })

  it('snaps a camera orientation to the nearest axes', () => {
    expect(snapViewFrame([5, 4.2, 6.2], [-0.3, 0.9, -0.3])).toEqual(DEFAULT_VIEW)
    expect(snapViewFrame([-0.2, 0.1, -0.9], [0.1, 0.2, 0.95])).toEqual({
      front: [0, 0, -1],
      up: [0, 1, 0],
    })
  })
})

describe('notation', () => {
  it('parses and formats round-trip', () => {
    const text = "U D' L2 R F' B2 M E' S2 x y' z2"
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

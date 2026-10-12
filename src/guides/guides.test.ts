import { describe, expect, it } from 'vitest'
import {
  applyMoves,
  createSolvedCube,
  cubesEqual,
  faceletIndex,
  parseAlgorithm,
  stickerNormals,
  toFacelets,
  type Vec3,
} from '../cube'
import { GUIDES, type Algorithm, type Keeps } from './guides'

const SOLVED = createSolvedCube()
const SOLVED_FACELETS = toFacelets(SOLVED)

/** Sticker indices belonging to the solved-cube pieces whose home matches `include`. */
function stickersOf(include: (home: Vec3) => boolean): number[] {
  return SOLVED.filter((c) => include(c.home)).flatMap((c) =>
    stickerNormals(c.home).map((n) => faceletIndex(c.home, n)),
  )
}

const same = (a: Vec3, x: number, y: number, z: number) => a[0] === x && a[1] === y && a[2] === z

const FIRST_LAYER = stickersOf((h) => h[1] === -1)
const F2L = stickersOf((h) => h[1] <= 0)
const F2L_BUT_FR = stickersOf((h) => h[1] <= 0 && !same(h, 1, -1, 1) && !same(h, 1, 0, 1))
const F2L_BUT_FL = stickersOf((h) => h[1] <= 0 && !same(h, -1, -1, 1) && !same(h, -1, 0, 1))
const TOP_FACE = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const TOP_EDGES = [1, 3, 5, 7]

const REGIONS: Record<Exclude<Keeps, 'repeats'>, number[]> = {
  'first-layer': FIRST_LAYER,
  f2l: F2L,
  'f2l-and-top-edges': [...F2L, ...TOP_EDGES],
  'f2l-and-top-colour': [...F2L, ...TOP_FACE],
  'all-but-front-right-slot': F2L_BUT_FR,
  'all-but-front-left-slot': F2L_BUT_FL,
}

const cases: [string, Algorithm][] = GUIDES.flatMap((guide) =>
  guide.steps.flatMap((step) =>
    (step.algorithms ?? []).map(
      (alg) => [`${guide.name} › ${alg.name}`, alg] as [string, Algorithm],
    ),
  ),
)

describe('guide algorithms', () => {
  it('include at least one per method', () => {
    for (const guide of GUIDES) {
      expect(guide.steps.some((s) => s.algorithms?.length)).toBe(true)
    }
  })

  it.each(cases)('%s does what it says', (_, alg) => {
    const moves = parseAlgorithm(alg.moves)
    const after = applyMoves(SOLVED, moves)
    expect(cubesEqual(after, SOLVED)).toBe(false)

    if (alg.keeps === 'repeats') {
      expect(alg.period).toBeGreaterThan(1)
      let state = SOLVED
      for (let i = 0; i < alg.period!; i++) state = applyMoves(state, moves)
      expect(cubesEqual(state, SOLVED)).toBe(true)
      return
    }

    const facelets = toFacelets(after)
    const changed = REGIONS[alg.keeps].filter((i) => facelets[i] !== SOLVED_FACELETS[i])
    expect(changed).toEqual([])
  })
})

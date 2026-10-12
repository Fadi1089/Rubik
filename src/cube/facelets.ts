import { dot, transform } from './math'
import type { CubeState, Face, Vec3 } from './types'

/** Facelet order follows the common URFDLB convention. */
export const FACE_ORDER: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B']

interface FaceFrame {
  normal: Vec3
  /** Screen-right and screen-down directions when looking straight at the face. */
  right: Vec3
  down: Vec3
}

const FACE_FRAMES: Record<Face, FaceFrame> = {
  U: { normal: [0, 1, 0], right: [1, 0, 0], down: [0, 0, 1] },
  R: { normal: [1, 0, 0], right: [0, 0, -1], down: [0, -1, 0] },
  F: { normal: [0, 0, 1], right: [1, 0, 0], down: [0, -1, 0] },
  D: { normal: [0, -1, 0], right: [1, 0, 0], down: [0, 0, -1] },
  L: { normal: [-1, 0, 0], right: [0, 0, 1], down: [0, -1, 0] },
  B: { normal: [0, 0, -1], right: [-1, 0, 0], down: [0, -1, 0] },
}

export function faceForNormal(normal: Vec3): Face {
  const face = FACE_ORDER.find((f) => dot(FACE_FRAMES[f].normal, normal) === 1)
  if (!face) throw new Error(`Not a unit axis normal: ${normal.join(',')}`)
  return face
}

/** Unit normals of the stickers a cubie carries, in its home (solved) frame. */
export function stickerNormals(home: Vec3): Vec3[] {
  const normals: Vec3[] = []
  if (home[0] !== 0) normals.push([home[0], 0, 0])
  if (home[1] !== 0) normals.push([0, home[1], 0])
  if (home[2] !== 0) normals.push([0, 0, home[2]])
  return normals
}

/** Index (0..53, URFDLB order) of the sticker at `position` facing along `normal`. */
export function faceletIndex(position: Vec3, normal: Vec3): number {
  const face = faceForNormal(normal)
  const frame = FACE_FRAMES[face]
  const row = dot(position, frame.down) + 1
  const col = dot(position, frame.right) + 1
  return FACE_ORDER.indexOf(face) * 9 + row * 3 + col
}

/**
 * Project the cubie model onto the 54 visible stickers. Each entry is the face colour of the
 * sticker at that slot, so a solved cube reads "UUUUUUUUURRRRRRRRRFFF...".
 */
export function toFacelets(state: CubeState): Face[] {
  const facelets = new Array<Face>(54)
  for (const cubie of state) {
    for (const homeNormal of stickerNormals(cubie.home)) {
      const normal = transform(cubie.orientation, homeNormal)
      facelets[faceletIndex(cubie.position, normal)] = faceForNormal(homeNormal)
    }
  }
  return facelets
}

export function faceletString(state: CubeState): string {
  return toFacelets(state).join('')
}

/** Solved when every face shows a single colour. Centre and core twists don't count. */
export function isSolved(state: CubeState): boolean {
  const facelets = toFacelets(state)
  for (let f = 0; f < 6; f++) {
    const first = facelets[f * 9]
    for (let i = 1; i < 9; i++) {
      if (facelets[f * 9 + i] !== first) return false
    }
  }
  return true
}

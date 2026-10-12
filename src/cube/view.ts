import { faceForNormal } from './facelets'
import { AXES } from './math'
import { moveFromAxisTurn } from './moves'
import type { Axis, Face, Move, Vec3 } from './types'

/**
 * How the cube sits relative to the viewer: the cube axis pointing at the viewer and the one
 * pointing up the screen, each as a signed unit vector such as [0, 0, 1].
 */
export interface ViewFrame {
  readonly front: Vec3
  readonly up: Vec3
}

export type ViewSide = 'front' | 'back' | 'up' | 'down' | 'left' | 'right'
export type RollDirection = 'up' | 'down' | 'left' | 'right'

export const DEFAULT_VIEW: ViewFrame = { front: [0, 0, 1], up: [0, 1, 0] }

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
const negate = (v: Vec3): Vec3 => [-v[0], -v[1], -v[2]]

function unitAxis(v: Vec3): { axis: Axis; sign: 1 | -1 } {
  const i = v.findIndex((c) => c !== 0)
  return { axis: AXES[i], sign: v[i] > 0 ? 1 : -1 }
}

function snapAxis(v: readonly number[], exclude: number): Vec3 {
  let best = -1
  for (let i = 0; i < 3; i++) {
    if (i !== exclude && (best === -1 || Math.abs(v[i]) > Math.abs(v[best]))) best = i
  }
  const out: [number, number, number] = [0, 0, 0]
  out[best] = v[best] >= 0 ? 1 : -1
  return out
}

/**
 * Snap a continuous camera orientation to the nearest view frame.
 * `toViewer` points from the cube to the camera and `screenUp` is the camera's up vector.
 */
export function snapViewFrame(toViewer: readonly number[], screenUp: readonly number[]): ViewFrame {
  const front = snapAxis(toViewer, -1)
  return {
    front,
    up: snapAxis(
      screenUp,
      front.findIndex((c) => c !== 0),
    ),
  }
}

export function viewSideNormal(frame: ViewFrame, side: ViewSide): Vec3 {
  const right = cross(frame.up, frame.front)
  switch (side) {
    case 'front':
      return frame.front
    case 'back':
      return negate(frame.front)
    case 'up':
      return frame.up
    case 'down':
      return negate(frame.up)
    case 'right':
      return right
    case 'left':
      return negate(right)
  }
}

/** Quarter turn of the outer layer on one side of the view; clockwise as seen from that side. */
export function viewTurn(frame: ViewFrame, side: ViewSide, direction: 1 | -1 = 1): Move {
  const { axis, sign } = unitAxis(viewSideNormal(frame, side))
  return moveFromAxisTurn(axis, sign, (-sign * direction) as 1 | -1)
}

/** Quarter turn of the middle layer parallel to one side of the view, turning the same way as
 * `viewTurn` on that side. The 'up' side gives the middle row, 'right' the middle column. */
export function viewSlice(frame: ViewFrame, side: ViewSide, direction: 1 | -1 = 1): Move {
  const { axis, sign } = unitAxis(viewSideNormal(frame, side))
  return moveFromAxisTurn(axis, 0, (-sign * direction) as 1 | -1)
}

/** Whole-cube rotation that rolls the front face towards `direction` on screen. */
export function viewRoll(frame: ViewFrame, direction: RollDirection): Move {
  const pivot = viewSideNormal(
    frame,
    direction === 'left' || direction === 'right' ? 'up' : 'right',
  )
  const { axis, sign } = unitAxis(pivot)
  const spin = direction === 'right' || direction === 'down' ? 1 : -1
  return moveFromAxisTurn(axis, null, (sign * spin) as 1 | -1)
}

const FACE_SIDES: Record<Face, ViewSide> = {
  U: 'up',
  D: 'down',
  L: 'left',
  R: 'right',
  F: 'front',
  B: 'back',
}

/**
 * Re-express an outer-face move as seen from another viewpoint. `R` in a frame looking at the
 * left face is the move that turns whatever face is on that viewer's right, i.e. `F`.
 */
export function moveInView(frame: ViewFrame, move: Move): Move {
  const side = FACE_SIDES[move.face as Face]
  if (!side) throw new Error(`Only outer-face moves can be re-expressed: ${move.face}`)
  return { face: faceForNormal(viewSideNormal(frame, side)), amount: move.amount }
}

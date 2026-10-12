import type { MoveSource } from '../store/useGameStore'

/** Distance between neighbouring cubie centres, in world units. */
export const SPACING = 1
export const CUBIE_SIZE = 0.95
export const CUBIE_RADIUS = 0.1

/** Seconds per quarter/half turn. */
export const TURN_DURATION: Record<MoveSource, number> = {
  user: 0.2,
  undo: 0.2,
  scramble: 0.07,
  guide: 0.32,
}

/** Whole-cube rotations move more mass on screen, so they get a little more time. */
export const ROTATION_DURATION = 0.3

/** Pixels the pointer must travel before a face drag commits to a direction. */
export const DRAG_THRESHOLD_PX = 10

import type { Face } from '../cube'
import type { MoveSource } from '../store/useGameStore'

/** Distance between neighbouring cubie centres, in world units. */
export const SPACING = 1
export const CUBIE_SIZE = 0.95
export const CUBIE_RADIUS = 0.1
export const STICKER_SIZE = 0.8

export const BODY_COLOR = '#121318'

export const STICKER_COLORS: Record<Face, string> = {
  U: '#f4f4f5', // white
  D: '#ffd60a', // yellow
  F: '#00a35c', // green
  B: '#0051c7', // blue
  R: '#d1203d', // red
  L: '#ff6b1a', // orange
}

/** Seconds per quarter/half turn. */
export const TURN_DURATION: Record<MoveSource, number> = {
  user: 0.2,
  undo: 0.2,
  scramble: 0.07,
}

/** Pixels the pointer must travel before a face drag commits to a direction. */
export const DRAG_THRESHOLD_PX = 10

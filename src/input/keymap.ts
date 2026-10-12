import type { RollDirection, ViewSide } from '../cube'

/**
 * The keypad, by physical position. KeyboardEvent.code names keys after their QWERTY letter, so
 * this grid is A Z E / Q S D / W X C on AZERTY and Q W E / A S D / Z X C on QWERTY.
 * Rows of keys are rows of the face you're looking at, and columns are columns.
 */
export const KEYPAD_GRID = [
  ['KeyQ', 'KeyW', 'KeyE'],
  ['KeyA', 'KeyS', 'KeyD'],
  ['KeyZ', 'KeyX', 'KeyC'],
] as const

export const KEYPAD_CODES: readonly string[] = KEYPAD_GRID.flat()

export type KeypadAction =
  | { kind: 'turn'; side: ViewSide; direction: 1 | -1 }
  | { kind: 'slice'; side: ViewSide; direction: 1 | -1 }
  | { kind: 'roll'; direction: RollDirection }

export interface KeypadChord {
  /** The middle key of a row or column. */
  middle: string
  /** The end key the row or column is pushed towards. */
  end: string
  action: KeypadAction
}

const turn = (side: ViewSide, direction: 1 | -1): KeypadAction => ({
  kind: 'turn',
  side,
  direction,
})
const slice = (side: ViewSide, direction: 1 | -1): KeypadAction => ({
  kind: 'slice',
  side,
  direction,
})
const roll = (direction: RollDirection): KeypadAction => ({ kind: 'roll', direction })

/**
 * Hold a row or column's middle key and press one of its end keys to push that line towards the
 * end key. The pair can be pressed in either order, as long as the first key is still held. The centre key's lines are the middle row and
 * column, and pushing those rolls the whole cube.
 */
export const KEYPAD_CHORDS: readonly KeypadChord[] = [
  // Top row: U moves the front's top row to the left.
  { middle: 'KeyW', end: 'KeyQ', action: turn('up', 1) },
  { middle: 'KeyW', end: 'KeyE', action: turn('up', -1) },
  // Bottom row: D moves the front's bottom row to the right.
  { middle: 'KeyX', end: 'KeyC', action: turn('down', 1) },
  { middle: 'KeyX', end: 'KeyZ', action: turn('down', -1) },
  // Left column: L moves the front's left column down.
  { middle: 'KeyA', end: 'KeyZ', action: turn('left', 1) },
  { middle: 'KeyA', end: 'KeyQ', action: turn('left', -1) },
  // Right column: R moves the front's right column up.
  { middle: 'KeyD', end: 'KeyE', action: turn('right', 1) },
  { middle: 'KeyD', end: 'KeyC', action: turn('right', -1) },
  // Middle row and column: the whole cube.
  { middle: 'KeyS', end: 'KeyW', action: roll('up') },
  { middle: 'KeyS', end: 'KeyX', action: roll('down') },
  { middle: 'KeyS', end: 'KeyA', action: roll('left') },
  { middle: 'KeyS', end: 'KeyD', action: roll('right') },
]

export function findChord(a: string, b: string): KeypadChord | undefined {
  return KEYPAD_CHORDS.find(
    (c) => (c.middle === a && c.end === b) || (c.middle === b && c.end === a),
  )
}

/**
 * Keys tapped on their own (released without forming a chord):
 * - The edge keys push the middle row or column towards themselves.
 * - The corners spin a whole face: top corners the front face, bottom corners the back face,
 *   left anticlockwise and right clockwise as you see them from the front.
 */
export const KEYPAD_TAPS: Record<string, KeypadAction> = {
  // Middle row moves like the top row (U moves it left); middle column like the right (R: up).
  KeyA: slice('up', 1),
  KeyD: slice('up', -1),
  KeyW: slice('right', 1),
  KeyX: slice('right', -1),
  KeyQ: turn('front', -1),
  KeyE: turn('front', 1),
  // B clockwise, seen from the back, looks anticlockwise from the front.
  KeyZ: turn('back', 1),
  KeyC: turn('back', -1),
}

export const ARROW_ROLLS: Record<string, RollDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

export const NOTATION_KEYS = ['U', 'D', 'L', 'R', 'F', 'B'] as const

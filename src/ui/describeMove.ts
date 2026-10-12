import type { Move } from '../cube'

const FACE_NAMES: Record<string, string> = {
  U: 'top',
  D: 'bottom',
  L: 'left',
  R: 'right',
  F: 'front',
  B: 'back',
}

const VIEWPOINTS: Record<string, string> = {
  U: 'seen from above',
  D: 'seen from below',
  L: 'seen from the left',
  R: 'seen from the right',
  F: 'seen from the front',
  B: 'seen from behind',
}

const ROLLS: Record<string, [string, string]> = {
  x: ['Roll the whole cube upwards', 'Roll the whole cube downwards'],
  y: ['Turn the whole cube to the left', 'Turn the whole cube to the right'],
  z: ['Tilt the whole cube to the right', 'Tilt the whole cube to the left'],
}

/** Plain-language version of a move, e.g. "Right face, anticlockwise seen from the right". */
export function describeMove(move: Move): string {
  const roll = ROLLS[move.face]
  if (roll) {
    if (move.amount === 2)
      return move.face === 'y' ? 'Turn the whole cube around' : 'Flip the whole cube over'
    return roll[move.amount === 1 ? 0 : 1]
  }
  const name = FACE_NAMES[move.face.toUpperCase()] ?? move.face
  const what = move.face === move.face.toLowerCase() ? `${name} two layers` : `${name} face`
  const how =
    move.amount === 2
      ? 'half turn'
      : `${move.amount === 1 ? 'clockwise' : 'anticlockwise'} ${VIEWPOINTS[move.face.toUpperCase()]}`
  return `${what[0].toUpperCase()}${what.slice(1)}, ${how}`
}

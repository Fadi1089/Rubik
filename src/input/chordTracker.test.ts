import { describe, expect, it } from 'vitest'
import { DEFAULT_VIEW, formatMove, viewRoll, viewSlice, viewTurn } from '../cube'
import { createChordTracker, reverseAction } from './chordTracker'
import type { KeypadAction } from './keymap'

// Physical codes, named here by their AZERTY letters.
const A = 'KeyQ'
const Z = 'KeyW'
const E = 'KeyE'
const Q = 'KeyA'
const S = 'KeyS'
const D = 'KeyD'
const W = 'KeyZ'
const X = 'KeyX'
const C = 'KeyC'

/** Notation for an action, seen from the default front view. */
function notation(action: KeypadAction | null): string | null {
  if (!action) return null
  switch (action.kind) {
    case 'turn':
      return formatMove(viewTurn(DEFAULT_VIEW, action.side, action.direction))
    case 'slice':
      return formatMove(viewSlice(DEFAULT_VIEW, action.side, action.direction))
    case 'roll':
      return formatMove(viewRoll(DEFAULT_VIEW, action.direction))
  }
}

function chord(first: string, second: string): string | null {
  const t = createChordTracker()
  t.press(first)
  return notation(t.press(second))
}

describe('keypad chords', () => {
  it('push rows and columns towards the end key', () => {
    expect(chord(Z, E)).toBe("U'") // top row → right
    expect(chord(Z, A)).toBe('U') // top row → left
    expect(chord(D, E)).toBe('R') // right column → up
    expect(chord(D, C)).toBe("R'")
    expect(chord(Q, A)).toBe("L'") // left column → up
    expect(chord(Q, W)).toBe('L')
    expect(chord(X, C)).toBe('D') // bottom row → right
    expect(chord(X, W)).toBe("D'")
  })

  it('roll the whole cube through the centre key', () => {
    expect(chord(S, Z)).toBe('x')
    expect(chord(S, X)).toBe("x'")
    expect(chord(S, Q)).toBe('y')
    expect(chord(S, D)).toBe("y'")
  })

  it('work in either order', () => {
    expect(chord(E, Z)).toBe("U'")
    expect(chord(E, D)).toBe('R')
  })

  it('ignore pairs that are not on one line', () => {
    expect(chord(A, E)).toBeNull()
    expect(chord(Z, X)).toBeNull()
  })

  it('repeat while the middle key stays held', () => {
    const t = createChordTracker()
    t.press(D)
    expect(notation(t.press(E))).toBe('R')
    expect(t.release(E)).toBeNull() // used in a chord, so no tap
    expect(notation(t.press(E))).toBe('R')
    expect(notation(t.press(C))).toBe("R'")
    expect(t.release(D)).toBeNull() // the middle key was used too
  })

  it('need the first key to still be held', () => {
    const t = createChordTracker()
    t.press(Z)
    expect(notation(t.release(Z))).toBe("M'")
    t.press(E)
    expect(notation(t.release(E))).toBe('F')
  })

  const tap = (code: string) => {
    const t = createChordTracker()
    t.press(code)
    return notation(t.release(code))
  }

  it('push the middle row or column when an edge key is tapped alone', () => {
    expect([tap(Q), tap(D), tap(Z), tap(X)]).toEqual(["E'", 'E', "M'", 'M'])
  })

  it('spin the front and back faces when a corner is tapped alone', () => {
    expect([tap(A), tap(E), tap(W), tap(C)]).toEqual(["F'", 'F', 'B', "B'"])
    expect(tap(S)).toBeNull()
  })

  it('reverses actions for Shift', () => {
    const t = createChordTracker()
    t.press(Z)
    expect(notation(reverseAction(t.press(E)!))).toBe('U')
    expect(notation(reverseAction({ kind: 'slice', side: 'up', direction: 1 }))).toBe('E')
    expect(notation(reverseAction({ kind: 'roll', direction: 'up' }))).toBe("x'")
  })
})

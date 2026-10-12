import { findChord, KEYPAD_CODES, KEYPAD_TAPS, type KeypadAction } from './keymap'

/**
 * Turns keypad key presses and releases into actions.
 *
 * - Pressing a key while its chord partner is held fires that chord. Holding a middle key and
 *   tapping an end key repeatedly fires the chord each time.
 * - A key released without having been part of a chord fires its tap action, if it has one.
 *   Taps fire on release because until then the key might still become half of a chord.
 */
export function createChordTracker() {
  const held: string[] = []
  const used = new Set<string>()

  return {
    press(code: string): KeypadAction | null {
      if (!KEYPAD_CODES.includes(code) || held.includes(code)) return null
      held.push(code)
      for (let i = held.length - 2; i >= 0; i--) {
        const chord = findChord(held[i], code)
        if (chord) {
          used.add(held[i])
          used.add(code)
          return chord.action
        }
      }
      return null
    },

    release(code: string): KeypadAction | null {
      const index = held.indexOf(code)
      if (index === -1) return null
      held.splice(index, 1)
      if (used.delete(code)) return null
      return KEYPAD_TAPS[code] ?? null
    },

    reset() {
      held.length = 0
      used.clear()
    },
  }
}

export type ChordTracker = ReturnType<typeof createChordTracker>

export function reverseAction(action: KeypadAction): KeypadAction {
  if (action.kind !== 'roll') return { ...action, direction: action.direction === 1 ? -1 : 1 }
  const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' } as const
  return { kind: 'roll', direction: opposite[action.direction] }
}

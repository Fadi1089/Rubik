import { useEffect } from 'react'
import { viewRoll, viewSlice, viewTurn, type Face, type Move } from '../cube'
import { getViewFrame } from '../scene/viewFrame'
import { useGameStore } from '../store/useGameStore'
import { useUiStore } from '../store/useUiStore'
import { createChordTracker, reverseAction } from './chordTracker'
import { ARROW_ROLLS, KEYPAD_CODES, NOTATION_KEYS, type KeypadAction } from './keymap'

const isNotationFace = (key: string): key is Face =>
  (NOTATION_KEYS as readonly string[]).includes(key)

function toMove(action: KeypadAction, shift: boolean): Move {
  const a = shift ? reverseAction(action) : action
  const frame = getViewFrame()
  switch (a.kind) {
    case 'turn':
      return viewTurn(frame, a.side, a.direction)
    case 'slice':
      return viewSlice(frame, a.side, a.direction)
    case 'roll':
      return viewRoll(frame, a.direction)
  }
}

/**
 * Keypad scheme: the 3x3 block under the left hand is the face you're looking at. Hold a row or
 * column's middle key and press an end key to push that line towards it; through the centre key
 * that rolls the whole cube. Tapping an edge key on its own pushes the middle row or column
 * towards it, and tapping a corner spins the front or back face.
 * Notation scheme: U D L R F B. In both, Shift reverses, arrows roll and Ctrl/Cmd+Z undoes.
 */
export function useKeyboardControls() {
  useEffect(() => {
    const chords = createChordTracker()

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof Element &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      )
        return

      const { turn, undo } = useGameStore.getState()
      const ui = useUiStore.getState()
      ui.setKeyHeld(event.code, true)

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (!event.repeat) undo()
        return
      }
      if (event.ctrlKey || event.metaKey || event.altKey) return

      const arrow = ARROW_ROLLS[event.code]
      if (arrow) {
        event.preventDefault()
        if (!event.repeat) turn(toMove({ kind: 'roll', direction: arrow }, event.shiftKey))
        return
      }

      if (ui.keyScheme === 'keypad') {
        if (!KEYPAD_CODES.includes(event.code)) return
        event.preventDefault()
        // Auto-repeat would otherwise re-fire chords while a key is held.
        if (event.repeat) return
        const action = chords.press(event.code)
        if (action) turn(toMove(action, event.shiftKey))
        return
      }

      const key = event.key.toUpperCase()
      if (!isNotationFace(key)) return
      event.preventDefault()
      if (!event.repeat) turn({ face: key, amount: event.shiftKey ? -1 : 1 })
    }

    const onKeyUp = (event: KeyboardEvent) => {
      const ui = useUiStore.getState()
      // macOS swallows keyup for other keys while Cmd is down, so reset everything on Cmd.
      if (event.key === 'Meta') {
        ui.releaseAllKeys()
        chords.reset()
        return
      }
      ui.setKeyHeld(event.code, false)
      const tap = chords.release(event.code)
      if (tap && ui.keyScheme === 'keypad') {
        useGameStore.getState().turn(toMove(tap, event.shiftKey))
      }
    }

    const onBlur = () => {
      useUiStore.getState().releaseAllKeys()
      chords.reset()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
}

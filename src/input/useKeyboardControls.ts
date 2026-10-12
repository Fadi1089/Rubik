import { useEffect } from 'react'
import { OUTER_FACES, type Face } from '../cube'
import { useGameStore } from '../store/useGameStore'

const isFace = (key: string): key is Face => (OUTER_FACES as readonly string[]).includes(key)

/** U D L R F B turn a face clockwise, Shift makes it prime. Ctrl/Cmd+Z undoes. */
export function useKeyboardControls() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable="true"]')) return

      const { turn, undo } = useGameStore.getState()
      const key = event.key.toUpperCase()

      if ((event.ctrlKey || event.metaKey) && key === 'Z') {
        event.preventDefault()
        if (!event.repeat) undo()
        return
      }
      if (event.ctrlKey || event.metaKey || event.altKey || !isFace(key)) return

      event.preventDefault()
      // Holding a key would otherwise auto-repeat into a stream of turns.
      if (event.repeat) return
      turn({ face: key, amount: event.shiftKey ? -1 : 1 })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

import { useEffect, useState } from 'react'

const AZERTY: Record<string, string> = { KeyQ: 'A', KeyW: 'Z', KeyA: 'Q', KeyZ: 'W' }

interface LayoutMap {
  get(code: string): string | undefined
}
interface KeyboardApi {
  getLayoutMap?: () => Promise<LayoutMap>
}

function guessIsAzerty(): boolean {
  return typeof navigator !== 'undefined' && /^fr\b|^fr-/i.test(navigator.language)
}

/**
 * Turns a KeyboardEvent.code into the letter printed on the user's key. Uses the Keyboard API
 * where available (Chromium) and otherwise guesses AZERTY from a French browser language.
 */
export function useKeyLabels(): (code: string) => string {
  const [layout, setLayout] = useState<LayoutMap | null>(null)

  useEffect(() => {
    const keyboard = (navigator as Navigator & { keyboard?: KeyboardApi }).keyboard
    let cancelled = false
    keyboard
      ?.getLayoutMap?.()
      .then((map) => {
        if (!cancelled) setLayout(map)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (code) => {
    const fromLayout = layout?.get(code)
    if (fromLayout) return fromLayout.toUpperCase()
    if (guessIsAzerty() && AZERTY[code]) return AZERTY[code]
    return code.replace(/^Key/, '')
  }
}

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CUBE_STYLE_IDS, type CubeStyleId } from '../scene/cubeStyles'

export type Theme = 'creme' | 'dark'
/** keypad: AZE/QSD/WXC (QWE/ASD/ZXC on QWERTY) relative to the view. notation: U D L R F B. */
export type KeyScheme = 'keypad' | 'notation'

export const UI_STORAGE_KEY = 'rubik:ui'

interface UiState {
  theme: Theme
  cubeStyle: CubeStyleId
  keyScheme: KeyScheme
  /** KeyboardEvent.code values currently held down, for the on-screen key legend. */
  heldKeys: string[]
  guidesOpen: boolean
  /** Which method is expanded in the guides panel. */
  openGuideId: string | null

  toggleTheme: () => void
  setCubeStyle: (style: CubeStyleId) => void
  setKeyScheme: (scheme: KeyScheme) => void
  setKeyHeld: (code: string, held: boolean) => void
  releaseAllKeys: () => void
  setGuidesOpen: (open: boolean) => void
  setOpenGuideId: (id: string | null) => void
}

function systemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'creme'
  } catch {
    return 'creme'
  }
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: typeof window === 'undefined' ? 'creme' : systemTheme(),
      cubeStyle: 'classic',
      keyScheme: 'keypad',
      heldKeys: [],
      guidesOpen: false,
      openGuideId: 'beginner',

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'creme' : 'dark' })),
      setCubeStyle: (cubeStyle) => set({ cubeStyle }),
      setKeyScheme: (keyScheme) => set({ keyScheme }),
      setKeyHeld: (code, held) =>
        set((s) => {
          const has = s.heldKeys.includes(code)
          if (held === has) return s
          return { heldKeys: held ? [...s.heldKeys, code] : s.heldKeys.filter((k) => k !== code) }
        }),
      releaseAllKeys: () => set({ heldKeys: [] }),
      setGuidesOpen: (guidesOpen) => set({ guidesOpen }),
      setOpenGuideId: (openGuideId) => set({ openGuideId }),
    }),
    {
      name: UI_STORAGE_KEY,
      // Storage can be missing or blocked; persist then just keeps settings in memory.
      storage: createJSONStorage(() => window.localStorage),
      partialize: ({ theme, cubeStyle, keyScheme, guidesOpen, openGuideId }) => ({
        theme,
        cubeStyle,
        keyScheme,
        guidesOpen,
        openGuideId,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<UiState>
        return {
          ...current,
          ...(saved.theme === 'dark' || saved.theme === 'creme' ? { theme: saved.theme } : {}),
          ...(saved.cubeStyle && CUBE_STYLE_IDS.includes(saved.cubeStyle)
            ? { cubeStyle: saved.cubeStyle }
            : {}),
          ...(saved.keyScheme === 'keypad' || saved.keyScheme === 'notation'
            ? { keyScheme: saved.keyScheme }
            : {}),
          ...(typeof saved.guidesOpen === 'boolean' ? { guidesOpen: saved.guidesOpen } : {}),
          ...(typeof saved.openGuideId === 'string' || saved.openGuideId === null
            ? { openGuideId: saved.openGuideId }
            : {}),
        }
      },
    },
  ),
)

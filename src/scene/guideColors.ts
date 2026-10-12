import type { Theme } from '../store/useUiStore'

/** Highlight colours for the tutor, matched to each theme's accent and "good" colours. */
export const GUIDE_COLORS: Record<Theme, { focus: string; context: string }> = {
  creme: { focus: '#d9622f', context: '#5f9b5a' },
  dark: { focus: '#f2a65e', context: '#9fd69a' },
}

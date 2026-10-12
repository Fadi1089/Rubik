import type { Face } from '../cube'

export const CUBE_STYLE_IDS = ['classic', 'stickerless', 'sorbet', 'clay', 'neon'] as const
export type CubeStyleId = (typeof CUBE_STYLE_IDS)[number]

export interface CubeStyle {
  id: CubeStyleId
  name: string
  body: {
    color: string
    roughness: number
    metalness: number
  }
  sticker: {
    /** Edge length of a sticker, where a cubie is 0.95 wide. */
    size: number
    /** Corner radius of a sticker. */
    radius: number
    roughness: number
    /** How strongly stickers glow in their own colour. */
    glow: number
  }
  colors: Record<Face, string>
}

export const CUBE_STYLES: Record<CubeStyleId, CubeStyle> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    body: { color: '#141418', roughness: 0.55, metalness: 0.1 },
    sticker: { size: 0.8, radius: 0.12, roughness: 0.32, glow: 0 },
    colors: {
      U: '#f4f4f2',
      D: '#ffd60a',
      F: '#00a35c',
      B: '#0051c7',
      R: '#d1203d',
      L: '#ff6b1a',
    },
  },
  stickerless: {
    id: 'stickerless',
    name: 'Stickerless',
    body: { color: '#2a2a30', roughness: 0.4, metalness: 0.05 },
    sticker: { size: 0.9, radius: 0.16, roughness: 0.22, glow: 0 },
    colors: {
      U: '#fafaf7',
      D: '#ffe23d',
      F: '#22c46e',
      B: '#2f7bff',
      R: '#ff3b4e',
      L: '#ff8a1f',
    },
  },
  sorbet: {
    id: 'sorbet',
    name: 'Sorbet',
    body: { color: '#3b3740', roughness: 0.7, metalness: 0 },
    sticker: { size: 0.82, radius: 0.2, roughness: 0.6, glow: 0 },
    colors: {
      U: '#fbf7ef',
      D: '#f7dc8c',
      F: '#a8dcbc',
      B: '#a9c3ef',
      R: '#f4a3a8',
      L: '#f8c49c',
    },
  },
  clay: {
    id: 'clay',
    name: 'Clay',
    body: { color: '#5e4330', roughness: 0.85, metalness: 0 },
    sticker: { size: 0.84, radius: 0.1, roughness: 0.85, glow: 0 },
    colors: {
      U: '#efe5d0',
      D: '#d9a441',
      F: '#7d9a68',
      B: '#4e6c8b',
      R: '#b4503a',
      L: '#dc8649',
    },
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    body: { color: '#0b0b10', roughness: 0.25, metalness: 0.4 },
    sticker: { size: 0.72, radius: 0.22, roughness: 0.4, glow: 1 },
    colors: {
      U: '#e6eeff',
      D: '#ffd60a',
      F: '#00f08a',
      B: '#2f6bff',
      R: '#ff1f66',
      L: '#ff7a1a',
    },
  },
}

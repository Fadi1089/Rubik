/**
 * Pictures for the guides, rendered from the app's own Classic cube by the dev-only capture page
 * (open the dev server with `?capture-guide-images`). Pure data and cube maths; no React or Three.
 */
import {
  applyMoves,
  createSolvedCube,
  faceForNormal,
  formatAlgorithm,
  invertSequence,
  parseAlgorithm,
  stickerNormals,
  type CubeState,
  type Cubie,
  type Face,
} from '../cube'
import { GUIDES, type Algorithm, type Guide, type GuideStep, type Keeps } from './guides'

/**
 * Which stickers keep their colour; the rest are drawn grey. Pieces are picked by their home in
 * the solved model, where white is the top layer (y = 1) and yellow the bottom (y = -1). The
 * pictures hold the cube white-side down, so "first layer" pieces end up at the bottom.
 * Centres always keep their colour, except in 'yellow', which shows yellow stickers only.
 */
export type ImageMask =
  | 'all'
  | 'white-cross'
  | 'first-layer'
  | 'f2l'
  | 'top-layer'
  | 'yellow'
  | 'first-block'
  | 'both-blocks'
  | 'line'

/** Camera positions for the pictures. */
export type ImageView = 'top' | 'iso' | 'low' | 'left'

export interface ImageSpec {
  id: string
  /** Moves applied to a solved cube to get the pictured state. */
  moves: string
  /** Turn the cube white-side down first, as the guides hold it. */
  hold: boolean
  mask: ImageMask
  view: ImageView
  alt: string
}

export interface ImageOptions {
  mask: ImageMask
  view: ImageView
  /** Moves after the hold, for step pictures. Algorithm pictures use the algorithm's inverse. */
  moves?: string
  /** Defaults to true. */
  hold?: boolean
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const stepImageId = (guide: Guide, step: GuideStep) => `${guide.id}-${slug(step.title)}`
export const algorithmImageId = (guide: Guide, step: GuideStep, alg: Algorithm) =>
  `${stepImageId(guide, step)}-${slug(alg.name)}`

/** How an algorithm's case is pictured, unless the algorithm says otherwise. */
const DEFAULT_ALGORITHM_IMAGE: Record<Keeps, Pick<ImageOptions, 'mask' | 'view'>> = {
  'first-layer': { mask: 'f2l', view: 'iso' },
  f2l: { mask: 'yellow', view: 'top' },
  'f2l-and-top-edges': { mask: 'yellow', view: 'top' },
  'f2l-and-top-colour': { mask: 'top-layer', view: 'top' },
  'all-but-front-right-slot': { mask: 'f2l', view: 'iso' },
  'all-but-front-left-slot': { mask: 'f2l', view: 'left' },
  repeats: { mask: 'first-layer', view: 'iso' },
}

export function algorithmImage(guide: Guide, step: GuideStep, alg: Algorithm): ImageSpec {
  const options = { ...DEFAULT_ALGORITHM_IMAGE[alg.keeps], ...alg.image }
  return {
    id: algorithmImageId(guide, step, alg),
    moves: formatAlgorithm(invertSequence(parseAlgorithm(alg.moves))),
    hold: true,
    mask: options.mask,
    view: options.view,
    alt: `${alg.name}: the case this algorithm solves`,
  }
}

export function stepImage(guide: Guide, step: GuideStep): ImageSpec | null {
  if (!step.image) return null
  return {
    id: stepImageId(guide, step),
    moves: step.image.moves ?? '',
    hold: step.image.hold ?? true,
    mask: step.image.mask,
    view: step.image.view,
    alt: `${step.title}: what the cube looks like when this step is done`,
  }
}

export function allGuideImages(): ImageSpec[] {
  return GUIDES.flatMap((guide) =>
    guide.steps.flatMap((step) => [
      ...(stepImage(guide, step) ? [stepImage(guide, step)!] : []),
      ...(step.algorithms ?? []).map((alg) => algorithmImage(guide, step, alg)),
    ]),
  )
}

export function imageState(spec: ImageSpec): CubeState {
  return applyMoves(createSolvedCube(), [
    ...(spec.hold ? parseAlgorithm('z2') : []),
    ...parseAlgorithm(spec.moves),
  ])
}

const nonZero = (cubie: Cubie) => cubie.home.filter((c) => c !== 0).length

/** Sticker colours (by home face) to draw grey on this cubie. */
export function greyStickers(mask: ImageMask, cubie: Cubie): Face[] {
  const colours = stickerNormals(cubie.home).map(faceForNormal)
  if (mask === 'yellow') return colours.filter((c) => c !== 'D')
  if (nonZero(cubie) === 1) return []
  const [x, y, z] = cubie.home
  const keep = (() => {
    switch (mask) {
      case 'all':
        return true
      case 'white-cross':
        return y === 1 && nonZero(cubie) === 2
      case 'first-layer':
        return y === 1
      case 'f2l':
        return y >= 0
      case 'top-layer':
        return y === -1
      // Roux blocks sit on the white (bottom) side. Held white-side down, the solver's left is
      // the model's +x, because z2 swaps left and right.
      case 'first-block':
        return x === 1 && y >= 0
      case 'both-blocks':
        return x !== 0 && y >= 0
      case 'line':
        return x === 0 && y === 1 && z !== 0
    }
  })()
  return keep ? [] : colours
}

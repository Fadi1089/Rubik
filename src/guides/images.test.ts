import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createSolvedCube } from '../cube'
import { allGuideImages, greyStickers, imageState } from './images'

const IMAGE_DIR = join(import.meta.dirname, '../../public/guide-images')

describe('guide images', () => {
  const specs = allGuideImages()

  it('have unique ids', () => {
    expect(new Set(specs.map((s) => s.id)).size).toBe(specs.length)
  })

  it.each(specs.map((s) => [s.id]))('%s has a rendered picture', (id) => {
    // Missing? Run the dev server and open /Rubik/?capture-guide-images to render them.
    expect(existsSync(join(IMAGE_DIR, `${id}.webp`))).toBe(true)
  })

  it('show cases with yellow on top', () => {
    const tPerm = specs.find((s) => s.id === 'cfop-pll-look-1-corners-t-perm')!
    const yellowCentre = imageState(tPerm).find(
      (c) => c.home[1] === -1 && c.home[0] === 0 && c.home[2] === 0,
    )!
    expect(yellowCentre.position).toEqual([0, 1, 0])
  })

  it('grey out what a step does not care about', () => {
    const solved = createSolvedCube()
    const whiteEdge = solved.find((c) => c.home.join() === '0,1,1')!
    const yellowCorner = solved.find((c) => c.home.join() === '1,-1,1')!
    expect(greyStickers('white-cross', whiteEdge)).toEqual([])
    expect(greyStickers('white-cross', yellowCorner)).toHaveLength(3)
    expect(greyStickers('yellow', yellowCorner)).toEqual(['R', 'F'])
  })
})

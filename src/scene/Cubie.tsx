import type { Ref } from 'react'
import { Euler, MeshStandardMaterial, Shape, ShapeGeometry, type Group } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { faceForNormal, stickerNormals, type Face, type Vec3 } from '../cube'
import { CUBIE_RADIUS, CUBIE_SIZE } from './constants'
import { CUBE_STYLES, type CubeStyleId } from './cubeStyles'

function roundedSquare(size: number, radius: number): ShapeGeometry {
  const h = size / 2
  const shape = new Shape()
  shape.moveTo(-h + radius, -h)
  shape.lineTo(h - radius, -h)
  shape.quadraticCurveTo(h, -h, h, -h + radius)
  shape.lineTo(h, h - radius)
  shape.quadraticCurveTo(h, h, h - radius, h)
  shape.lineTo(-h + radius, h)
  shape.quadraticCurveTo(-h, h, -h, h - radius)
  shape.lineTo(-h, -h + radius)
  shape.quadraticCurveTo(-h, -h, -h + radius, -h)
  return new ShapeGeometry(shape, 6)
}

interface StyleAssets {
  bodyMaterial: MeshStandardMaterial
  stickerGeometry: ShapeGeometry
  stickerMaterials: Record<Face, MeshStandardMaterial>
}

/** For guide pictures: stickers that don't matter for a case are drawn in this neutral grey. */
const greyMaterial = new MeshStandardMaterial({ color: '#55514d', roughness: 0.7 })

// Geometry and materials are shared by all 27 cubies and built once per style.
const bodyGeometry = new RoundedBoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE, 4, CUBIE_RADIUS)
const assetCache = new Map<CubeStyleId, StyleAssets>()

function styleAssets(id: CubeStyleId): StyleAssets {
  const cached = assetCache.get(id)
  if (cached) return cached
  const { body, sticker, colors } = CUBE_STYLES[id]
  const assets: StyleAssets = {
    bodyMaterial: new MeshStandardMaterial({
      color: body.color,
      roughness: body.roughness,
      metalness: body.metalness,
    }),
    stickerGeometry: roundedSquare(sticker.size, sticker.radius),
    stickerMaterials: Object.fromEntries(
      (Object.entries(colors) as [Face, string][]).map(([face, color]) => [
        face,
        // Glowing stickers light themselves and skip tone mapping, so they stay saturated
        // instead of washing out towards white.
        new MeshStandardMaterial({
          color: sticker.glow > 0 ? '#000000' : color,
          roughness: sticker.roughness,
          emissive: color,
          emissiveIntensity: sticker.glow,
          toneMapped: sticker.glow === 0,
        }),
      ]),
    ) as Record<Face, MeshStandardMaterial>,
  }
  assetCache.set(id, assets)
  return assets
}

/** Rotations that turn the +z-facing sticker plane to face along each axis. */
const STICKER_ROTATIONS: Record<Face, Euler> = {
  U: new Euler(-Math.PI / 2, 0, 0),
  D: new Euler(Math.PI / 2, 0, 0),
  R: new Euler(0, Math.PI / 2, 0),
  L: new Euler(0, -Math.PI / 2, 0),
  F: new Euler(0, 0, 0),
  B: new Euler(0, Math.PI, 0),
}

const STICKER_OFFSET = CUBIE_SIZE / 2 + 0.002

interface CubieProps {
  home: Vec3
  styleId: CubeStyleId
  ref?: Ref<Group>
  /** Sticker colours (by home face) to draw grey instead. */
  grey?: readonly Face[]
}

/** One cubie in its home frame. The parent Cube sets the group's transform every frame. */
export function Cubie({ home, styleId, ref, grey }: CubieProps) {
  const { bodyMaterial, stickerGeometry, stickerMaterials } = styleAssets(styleId)
  return (
    <group ref={ref}>
      <mesh geometry={bodyGeometry} material={bodyMaterial} />
      {stickerNormals(home).map((normal) => {
        const face = faceForNormal(normal)
        return (
          <mesh
            key={face}
            geometry={stickerGeometry}
            material={grey?.includes(face) ? greyMaterial : stickerMaterials[face]}
            position={[
              normal[0] * STICKER_OFFSET,
              normal[1] * STICKER_OFFSET,
              normal[2] * STICKER_OFFSET,
            ]}
            rotation={STICKER_ROTATIONS[face]}
          />
        )
      })}
    </group>
  )
}

import type { Ref } from 'react'
import { Euler, MeshStandardMaterial, Shape, ShapeGeometry, type Group } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { faceForNormal, stickerNormals, type Face, type Vec3 } from '../cube'
import { BODY_COLOR, CUBIE_RADIUS, CUBIE_SIZE, STICKER_COLORS, STICKER_SIZE } from './constants'

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

// Shared by all 27 cubies.
const bodyGeometry = new RoundedBoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE, 4, CUBIE_RADIUS)
const bodyMaterial = new MeshStandardMaterial({ color: BODY_COLOR, roughness: 0.6, metalness: 0.1 })
const stickerGeometry = roundedSquare(STICKER_SIZE, 0.12)
const stickerMaterials = Object.fromEntries(
  Object.entries(STICKER_COLORS).map(([face, color]) => [
    face,
    new MeshStandardMaterial({ color, roughness: 0.32, metalness: 0 }),
  ]),
) as Record<Face, MeshStandardMaterial>

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
  ref: Ref<Group>
}

/** One cubie in its home frame. The parent Cube sets the group's transform every frame. */
export function Cubie({ home, ref }: CubieProps) {
  return (
    <group ref={ref}>
      <mesh geometry={bodyGeometry} material={bodyMaterial} />
      {stickerNormals(home).map((normal) => {
        const face = faceForNormal(normal)
        return (
          <mesh
            key={face}
            geometry={stickerGeometry}
            material={stickerMaterials[face]}
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

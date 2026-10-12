import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { DoubleSide, MeshBasicMaterial, Vector3, type Group } from 'three'
import { getAxisTurn } from '../cube'
import { useGameStore } from '../store/useGameStore'
import { useUiStore } from '../store/useUiStore'
import { SPACING } from './constants'
import { GUIDE_COLORS } from './guideColors'

const ARC = Math.PI * 1.2
const AXIS_ROTATION = {
  x: [0, Math.PI / 2, 0],
  y: [-Math.PI / 2, 0, 0],
  z: [0, 0, 0],
} as const
const scratch = new Vector3()
const material = new MeshBasicMaterial({
  transparent: true,
  side: DoubleSide,
  depthTest: false,
  toneMapped: false,
})

/**
 * A curved arrow around the layer the guide wants turned next, pointing the way it turns.
 * The arc swings round to face the camera so it stays readable from any angle.
 */
export function MoveArrow() {
  const move = useGameStore((s) =>
    s.guide && s.status !== 'scrambling' ? (s.guide.hint?.moves[s.guide.index] ?? null) : null,
  )
  const theme = useUiStore((s) => s.theme)
  const outer = useRef<Group>(null)
  const inner = useRef<Group>(null)
  material.color.set(GUIDE_COLORS[theme].focus)

  const turn = move ? getAxisTurn(move) : null
  const sign = turn && turn.quarters < 0 ? -1 : 1

  useFrame(({ camera, clock }) => {
    material.opacity = 0.7 + 0.25 * Math.sin(clock.elapsedTime * 4)
    if (!outer.current || !inner.current) return
    const local = outer.current.worldToLocal(scratch.copy(camera.position))
    const facing = Math.atan2(local.y, local.x)
    inner.current.rotation.z = facing - (sign * ARC) / 2
  })

  if (!turn) return null
  const whole = turn.layer === null
  const radius = whole ? 2.75 : 2.3
  const offset = whole ? 0 : turn.wide ? (turn.layer as number) * 0.5 : (turn.layer as number)
  const position = [0, 0, 0] as [number, number, number]
  position['xyz'.indexOf(turn.axis)] = offset * SPACING
  const half = Math.abs(turn.quarters) === 2

  return (
    <group ref={outer} position={position} rotation={[...AXIS_ROTATION[turn.axis]]}>
      <group ref={inner} scale={[1, sign, 1]}>
        <mesh material={material} renderOrder={10} raycast={() => null}>
          <torusGeometry args={[radius, 0.055, 10, 72, ARC]} />
        </mesh>
        {(half ? [ARC / 2, ARC] : [ARC]).map((angle) => (
          <mesh
            key={angle}
            material={material}
            renderOrder={10}
            raycast={() => null}
            position={[radius * Math.cos(angle), radius * Math.sin(angle), 0]}
            rotation={[0, 0, angle]}
          >
            <coneGeometry args={[0.17, 0.42, 18]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

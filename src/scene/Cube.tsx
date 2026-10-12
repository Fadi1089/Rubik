import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Matrix4, Quaternion, Vector3, type Group } from 'three'
import { createSolvedCube, getAxisTurn, isInLayer } from '../cube'
import { useGameStore } from '../store/useGameStore'
import { SPACING, TURN_DURATION } from './constants'
import { Cubie } from './Cubie'
import { useFaceDrag } from './useFaceDrag'

const HOMES = createSolvedCube().map((cubie) => cubie.home)

const AXIS_VECTORS = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

// Scratch objects reused every frame.
const tmpMatrix = new Matrix4()
const tmpTurn = new Quaternion()

/**
 * Renders the 27 cubies and plays the move queue.
 *
 * Every frame the cubie transforms are rebuilt from the committed store state, with the head of
 * the queue applied as a partial rotation. When that rotation completes the move is committed
 * to the logic model in the same frame, so the visual and logical states never disagree.
 */
export function Cube() {
  const cubies = useRef<(Group | null)[]>([])
  const anim = useRef({ id: -1, progress: 0 })
  const turn = useGameStore((s) => s.turn)
  const onPointerDown = useFaceDrag(turn)

  useFrame((_, delta) => {
    let { queue } = useGameStore.getState()
    const head = queue[0]

    if (head) {
      if (anim.current.id !== head.id) anim.current = { id: head.id, progress: 0 }
      // Catch up when moves pile up so fast input never lags far behind.
      const backlog = head.source === 'scramble' ? 1 : Math.min(queue.length, 3)
      anim.current.progress += (delta * backlog) / TURN_DURATION[head.source]
      if (anim.current.progress >= 1) {
        useGameStore.getState().commitMove(head.id)
        anim.current = { id: -1, progress: 0 }
        queue = useGameStore.getState().queue
      }
    }

    const { cube } = useGameStore.getState()
    const active = queue[0]
    const activeTurn = active && active.id === anim.current.id ? getAxisTurn(active.move) : null
    if (activeTurn) {
      const t = anim.current.progress
      const eased = active.source === 'scramble' ? t : easeInOutCubic(t)
      tmpTurn.setFromAxisAngle(
        AXIS_VECTORS[activeTurn.axis],
        (eased * activeTurn.quarters * Math.PI) / 2,
      )
    }

    for (const cubie of cube) {
      const group = cubies.current[cubie.id]
      if (!group) continue
      const [x, y, z] = cubie.position
      const m = cubie.orientation
      group.position.set(x * SPACING, y * SPACING, z * SPACING)
      tmpMatrix.set(m[0], m[1], m[2], 0, m[3], m[4], m[5], 0, m[6], m[7], m[8], 0, 0, 0, 0, 1)
      group.quaternion.setFromRotationMatrix(tmpMatrix)
      if (activeTurn && isInLayer(cubie, activeTurn)) {
        group.position.applyQuaternion(tmpTurn)
        group.quaternion.premultiply(tmpTurn)
      }
    }
  })

  return (
    <group onPointerDown={onPointerDown}>
      {HOMES.map((home, id) => (
        <Cubie
          key={id}
          home={home}
          ref={(group) => {
            cubies.current[id] = group
          }}
        />
      ))}
    </group>
  )
}

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import {
  BackSide,
  Matrix4,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { createSolvedCube, getAxisTurn, isInLayer, isRotation } from '../cube'
import { useGameStore } from '../store/useGameStore'
import { useUiStore } from '../store/useUiStore'
import { ROTATION_DURATION, SPACING, TURN_DURATION } from './constants'
import { Cubie } from './Cubie'
import { GUIDE_COLORS } from './guideColors'
import { MoveArrow } from './MoveArrow'
import { useFaceDrag } from './useFaceDrag'

const HOMES = createSolvedCube().map((cubie) => cubie.home)

const AXIS_VECTORS = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The tutor's highlight: a slightly larger box drawn inside-out, so only a glowing rim shows
// around the cubie.
const outlineGeometry = new RoundedBoxGeometry(1.22, 1.22, 1.22, 3, 0.2)
const outlineMaterials = {
  focus: new MeshBasicMaterial({ side: BackSide, transparent: true, toneMapped: false }),
  context: new MeshBasicMaterial({ side: BackSide, transparent: true, toneMapped: false }),
  // A piece being worked on that's round the back shows through the cube as a faint ghost.
  hidden: new MeshBasicMaterial({
    transparent: true,
    toneMapped: false,
    depthTest: false,
    depthWrite: false,
  }),
}

/** Whether any outer face of the cubie at `position` faces the camera. */
function facesCamera(position: Vector3, camera: Vector3): boolean {
  for (const axis of ['x', 'y', 'z'] as const) {
    const c = Math.round(position[axis])
    if (c !== 0 && Math.sign(camera[axis] - position[axis]) === c) return true
  }
  return false
}

// Scratch objects reused every frame.
const tmpMatrix = new Matrix4()
const tmpTurn = new Quaternion()
const tmpCamera = new Vector3()

/**
 * Renders the 27 cubies and plays the move queue.
 *
 * Every frame the cubie transforms are rebuilt from the committed store state, with the head of
 * the queue applied as a partial rotation. When that rotation completes the move is committed
 * to the logic model in the same frame, so the visual and logical states never disagree.
 */
export function Cube() {
  const root = useRef<Group>(null)
  const cubies = useRef<(Group | null)[]>([])
  const outlines = useRef<(Mesh | null)[]>([])
  const theme = useUiStore((s) => s.theme)
  outlineMaterials.focus.color.set(GUIDE_COLORS[theme].focus)
  outlineMaterials.context.color.set(GUIDE_COLORS[theme].context)
  outlineMaterials.hidden.color.set(GUIDE_COLORS[theme].focus)
  const anim = useRef({ id: -1, progress: 0 })
  const styleId = useUiStore((s) => s.cubeStyle)
  const pop = useRef({ styleId, t: 1 })
  const turn = useGameStore((s) => s.turn)
  const onPointerDown = useFaceDrag(turn, root)

  useFrame(({ clock, camera }, delta) => {
    let { queue } = useGameStore.getState()
    const head = queue[0]

    if (head) {
      if (anim.current.id !== head.id) anim.current = { id: head.id, progress: 0 }
      // Catch up when moves pile up so fast input never lags far behind.
      // Scrambles and guide playback keep their own pace.
      const backlog =
        head.source === 'user' || head.source === 'undo' ? Math.min(queue.length, 3) : 1
      const duration = isRotation(head.move) ? ROTATION_DURATION : TURN_DURATION[head.source]
      anim.current.progress += (delta * backlog) / duration
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

    const { guide, status } = useGameStore.getState()
    const hint = status === 'scrambling' ? null : guide?.hint
    const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3.2)
    outlineMaterials.focus.opacity = 0.7 + 0.3 * pulse
    outlineMaterials.context.opacity = 0.35 + 0.2 * pulse
    outlineMaterials.hidden.opacity = 0.18 + 0.14 * pulse
    if (root.current) root.current.worldToLocal(tmpCamera.copy(camera.position))

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

      const outline = outlines.current[cubie.id]
      if (outline) {
        const role = hint?.focus.includes(cubie.id)
          ? 'focus'
          : hint?.context.includes(cubie.id)
            ? 'context'
            : null
        outline.visible = role !== null
        if (role) {
          const hidden = role === 'focus' && !facesCamera(group.position, tmpCamera)
          outline.material = outlineMaterials[hidden ? 'hidden' : role]
          outline.renderOrder = hidden ? 5 : 0
          outline.position.copy(group.position)
          outline.quaternion.copy(group.quaternion)
        }
      }
    }

    // A slow float, plus a small squash-and-settle whenever the cube style changes.
    if (root.current && !reducedMotion) {
      if (pop.current.styleId !== styleId) pop.current = { styleId, t: 0 }
      pop.current.t = Math.min(1, pop.current.t + delta * 2.2)
      const p = pop.current.t
      const scale = 1 - 0.07 * Math.sin(p * Math.PI) * (1 - p)
      root.current.scale.setScalar(scale)
      root.current.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.06
    }
  })

  return (
    <group ref={root} onPointerDown={onPointerDown}>
      {HOMES.map((home, id) => (
        <Cubie
          key={id}
          home={home}
          styleId={styleId}
          ref={(group) => {
            cubies.current[id] = group
          }}
        />
      ))}
      {HOMES.map((_, id) => (
        <mesh
          key={`outline-${id}`}
          geometry={outlineGeometry}
          material={outlineMaterials.focus}
          visible={false}
          raycast={() => null}
          ref={(mesh) => {
            outlines.current[id] = mesh
          }}
        />
      ))}
      <MoveArrow />
    </group>
  )
}

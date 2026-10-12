import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { Vector3, type Camera, type Group } from 'three'
import { AXES, axisIndex, moveFromAxisTurn, type Axis, type Move } from '../cube'
import { DRAG_THRESHOLD_PX, SPACING } from './constants'

interface DragState {
  pointerId: number
  startX: number
  startY: number
  /** World-space point where the drag started, on the cube's surface. */
  point: Vector3
  /** The same point in the cube's own frame, where cubie centres sit on whole numbers. */
  local: Vector3
  normalAxis: Axis
  normalSign: 1 | -1
  resolved: boolean
}

const UNIT: Record<Axis, Vector3> = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
}

function screenDirection(camera: Camera, point: Vector3, dir: Vector3): [number, number] {
  const a = point.clone().project(camera)
  const b = point.clone().addScaledVector(dir, 0.5).project(camera)
  // NDC y points up; screen y points down.
  const dx = b.x - a.x
  const dy = a.y - b.y
  const len = Math.hypot(dx, dy) || 1
  return [dx / len, dy / len]
}

/**
 * Work out which layer turn a drag across a face means.
 *
 * The drag is matched to whichever in-plane axis of the touched face it runs along on screen.
 * Dragging along direction t on a face with outward normal n turns the layer about n × t,
 * by a positive (right-hand) quarter turn. The layer is the touched point's coordinate on
 * that rotation axis.
 */
export function resolveDrag(camera: Camera, drag: DragState, dx: number, dy: number): Move {
  const len = Math.hypot(dx, dy)
  const [ux, uy] = [dx / len, dy / len]

  let best: { axis: Axis; score: number } | null = null
  for (const axis of AXES) {
    if (axis === drag.normalAxis) continue
    const [sx, sy] = screenDirection(camera, drag.point, UNIT[axis])
    const score = sx * ux + sy * uy
    if (!best || Math.abs(score) > Math.abs(best.score)) best = { axis, score }
  }
  if (!best) throw new Error('unreachable')

  const normal = UNIT[drag.normalAxis].clone().multiplyScalar(drag.normalSign)
  const along = UNIT[best.axis].clone().multiplyScalar(Math.sign(best.score) || 1)
  const rotation = new Vector3().crossVectors(normal, along)

  const rotationAxis = AXES.find((a) => Math.abs(rotation.getComponent(axisIndex(a))) > 0.5)!
  const quarters = Math.sign(rotation.getComponent(axisIndex(rotationAxis))) as 1 | -1
  const coord = Math.round(drag.local.getComponent(axisIndex(rotationAxis)) / SPACING)
  const layer = Math.max(-1, Math.min(1, coord)) as -1 | 0 | 1

  return moveFromAxisTurn(rotationAxis, layer, quarters)
}

/**
 * Returns a pointer-down handler for the cube. While a face drag is in progress the orbit
 * controls are disabled, and each drag produces at most one move.
 */
export function useFaceDrag(onMove: (move: Move) => void, cube: RefObject<Group | null>) {
  const get = useThree((state) => state.get)
  const drag = useRef<DragState | null>(null)
  const cleanup = useRef<(() => void) | null>(null)

  useEffect(() => () => cleanup.current?.(), [])

  return useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (event.button !== 0 || drag.current) return
      event.stopPropagation()

      // The cube group only floats and scales; it never rotates (the camera orbits, and whole-cube
      // rotations live in the model). So the face that was hit is the axis along which the
      // local hit point sticks out furthest.
      const point = event.point.clone()
      const local = cube.current ? cube.current.worldToLocal(point.clone()) : point.clone()
      const normalAxis = AXES.reduce((a, b) =>
        Math.abs(local.getComponent(axisIndex(b))) > Math.abs(local.getComponent(axisIndex(a)))
          ? b
          : a,
      )
      drag.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        point,
        local,
        normalAxis,
        normalSign: local.getComponent(axisIndex(normalAxis)) >= 0 ? 1 : -1,
        resolved: false,
      }

      const controls = get().controls as { enabled: boolean } | null
      if (controls) controls.enabled = false

      const handleMove = (e: PointerEvent) => {
        const d = drag.current
        if (!d || d.resolved || e.pointerId !== d.pointerId) return
        const dx = e.clientX - d.startX
        const dy = e.clientY - d.startY
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        d.resolved = true
        onMove(resolveDrag(get().camera, d, dx, dy))
      }

      const handleUp = (e: PointerEvent) => {
        if (e.pointerId === drag.current?.pointerId) cleanup.current?.()
      }

      cleanup.current = () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
        window.removeEventListener('pointercancel', handleUp)
        const c = get().controls as { enabled: boolean } | null
        if (c) c.enabled = true
        drag.current = null
        cleanup.current = null
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
      window.addEventListener('pointercancel', handleUp)
    },
    [get, onMove, cube],
  )
}

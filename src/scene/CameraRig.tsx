import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

/** Distance at which the whole cube fits comfortably in a landscape viewport. */
const BASE_DISTANCE = 14

/**
 * @param orbitTarget Element that listens for orbit drags. The whole stage, so dragging anywhere
 *   but the cube (or a control) turns the view.
 */
export function CameraRig({ orbitTarget }: { orbitTarget: HTMLElement | null }) {
  const get = useThree((state) => state.get)
  const aspect = useThree((state) => state.size.width / state.size.height)

  // Pull back on narrow (portrait) screens so the cube still fits horizontally.
  useEffect(() => {
    const distance = aspect < 1 ? BASE_DISTANCE / Math.max(aspect, 0.45) ** 0.85 : BASE_DISTANCE
    get().camera.position.setLength(distance)
  }, [aspect, get])

  return (
    <OrbitControls
      key={orbitTarget ? 'stage' : 'canvas'}
      domElement={orbitTarget ?? undefined}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.12}
      rotateSpeed={0.8}
      minDistance={5}
      maxDistance={20}
    />
  )
}

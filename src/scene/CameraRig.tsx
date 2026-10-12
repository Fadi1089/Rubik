import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

/** Distance at which the whole cube fits comfortably in a landscape viewport. */
const BASE_DISTANCE = 11.5

export function CameraRig() {
  const camera = useThree((state) => state.camera)
  const aspect = useThree((state) => state.size.width / state.size.height)

  // Pull back on narrow (portrait) screens so the cube still fits horizontally.
  useEffect(() => {
    const distance = aspect < 1 ? BASE_DISTANCE / Math.max(aspect, 0.45) ** 0.85 : BASE_DISTANCE
    camera.position.setLength(distance)
  }, [aspect, camera])

  return (
    <OrbitControls
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

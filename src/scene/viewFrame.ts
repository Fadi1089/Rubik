import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Vector3, type Camera } from 'three'
import { DEFAULT_VIEW, snapViewFrame, type ViewFrame } from '../cube'

let activeCamera: Camera | null = null
const up = new Vector3()

/** Which cube faces currently point at the viewer and up the screen. */
export function getViewFrame(): ViewFrame {
  if (!activeCamera) return DEFAULT_VIEW
  // The cube sits at the origin, so the camera position is the direction to the viewer.
  up.set(0, 1, 0).applyQuaternion(activeCamera.quaternion)
  return snapViewFrame(activeCamera.position.toArray(), up.toArray())
}

/** Exposes the scene camera to input code outside the canvas. Render once inside <Canvas>. */
export function ViewFrameSource() {
  const camera = useThree((state) => state.camera)
  useEffect(() => {
    activeCamera = camera
    return () => {
      if (activeCamera === camera) activeCamera = null
    }
  }, [camera])
  return null
}

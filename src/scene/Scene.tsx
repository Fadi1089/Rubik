import { ContactShadows } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { Cube } from './Cube'
import { Lights } from './Lights'

export function Scene() {
  return (
    <Canvas
      camera={{ position: [5, 4.2, 6.2], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      className="touch-none"
    >
      <Lights />
      <Cube />
      <ContactShadows position={[0, -2.6, 0]} opacity={0.45} scale={10} blur={2.6} far={4} />
      <CameraRig />
    </Canvas>
  )
}

import { ContactShadows } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useUiStore } from '../store/useUiStore'
import { CameraRig } from './CameraRig'
import { Cube } from './Cube'
import { Lights } from './Lights'
import { ViewFrameSource } from './viewFrame'

const SHADOW = {
  creme: { color: '#5a4430', opacity: 0.32 },
  dark: { color: '#000000', opacity: 0.55 },
} as const

export function Scene({ orbitTarget }: { orbitTarget: HTMLElement | null }) {
  const theme = useUiStore((s) => s.theme)
  return (
    <Canvas
      camera={{ position: [5, 4.2, 6.2], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      className="touch-none"
    >
      <Lights />
      <Cube />
      <ContactShadows
        position={[0, -2.7, 0]}
        scale={10}
        blur={2.8}
        far={4}
        color={SHADOW[theme].color}
        opacity={SHADOW[theme].opacity}
      />
      <CameraRig orbitTarget={orbitTarget} />
      <ViewFrameSource />
    </Canvas>
  )
}

import { useUiStore } from '../store/useUiStore'

const LIGHTING = {
  creme: {
    sky: '#fff4e2',
    ground: '#b9a68c',
    hemisphere: 1.25,
    key: { color: '#fff1dc', intensity: 1.7 },
    rim: { color: '#ffd9b0', intensity: 0.45 },
  },
  dark: {
    sky: '#d8dcff',
    ground: '#1d1a22',
    hemisphere: 0.95,
    key: { color: '#fff3e6', intensity: 1.5 },
    rim: { color: '#9fb2ff', intensity: 0.7 },
  },
} as const

export function Lights() {
  const theme = useUiStore((s) => s.theme)
  const light = LIGHTING[theme]
  return (
    <>
      <hemisphereLight args={[light.sky, light.ground, light.hemisphere]} />
      <directionalLight
        position={[5, 8, 6]}
        color={light.key.color}
        intensity={light.key.intensity}
      />
      <directionalLight
        position={[-6, 2, -4]}
        color={light.rim.color}
        intensity={light.rim.intensity}
      />
      <directionalLight position={[0, -6, 3]} intensity={0.25} />
    </>
  )
}

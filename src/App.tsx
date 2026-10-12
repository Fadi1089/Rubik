import { useKeyboardControls } from './input/useKeyboardControls'
import { Scene } from './scene/Scene'
import { HUD } from './ui/HUD'

export function App() {
  useKeyboardControls()

  return (
    <main className="relative h-full w-full bg-[radial-gradient(ellipse_at_50%_40%,#1c2130_0%,#0b0d12_65%)]">
      <Scene />
      <HUD />
    </main>
  )
}

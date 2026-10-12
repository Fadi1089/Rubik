import { useEffect, useState } from 'react'
import { useKeyboardControls } from './input/useKeyboardControls'
import { Scene } from './scene/Scene'
import { useUiStore } from './store/useUiStore'
import { Backdrop } from './ui/Backdrop'
import { GuidePanel } from './ui/GuidePanel'
import { HUD } from './ui/HUD'

/**
 * The camera orbits from drags anywhere on the stage, overlays included. Controls marked with
 * data-ui keep their pointer and wheel events to themselves, so pressing a button never turns
 * the view and scrolling a panel never zooms.
 */
function useStageInput(stage: HTMLElement | null) {
  useEffect(() => {
    if (!stage) return
    const keepInUi = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('[data-ui]')) {
        event.stopPropagation()
      }
    }
    // Capture on the HUD layer, below the stage, so the stage's orbit listener never sees them.
    const hud = stage.querySelector('[data-hud]')
    hud?.addEventListener('pointerdown', keepInUi)
    hud?.addEventListener('wheel', keepInUi)
    return () => {
      hud?.removeEventListener('pointerdown', keepInUi)
      hud?.removeEventListener('wheel', keepInUi)
    }
  }, [stage])
}

const THEME_COLOR = { creme: '#f2eadc', dark: '#16141b' } as const

function useThemeSync() {
  const theme = useUiStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])
}

export function App() {
  useKeyboardControls()
  useThemeSync()
  const guidesOpen = useUiStore((s) => s.guidesOpen)
  const [stage, setStage] = useState<HTMLDivElement | null>(null)
  useStageInput(stage)

  return (
    <main className="relative h-full w-full overflow-hidden">
      <Backdrop />
      {/* On wide screens the stage makes room for the guides panel instead of hiding under it. */}
      <div
        ref={setStage}
        className={`absolute inset-y-0 left-0 cursor-grab touch-none transition-[right] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:cursor-grabbing ${
          guidesOpen ? 'right-0 lg:right-[404px]' : 'right-0'
        }`}
      >
        <div className="absolute inset-0">
          <Scene orbitTarget={stage} />
        </div>
        <HUD />
      </div>
      <GuidePanel />
    </main>
  )
}

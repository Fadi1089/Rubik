import { useGameStore } from '../store/useGameStore'
import { ControlBar } from './ControlBar'
import { GuideBubble } from './GuideBubble'
import { GuidesToggle } from './GuidesToggle'
import { KeyLegend } from './KeyLegend'
import { SolvedBanner } from './SolvedBanner'
import { ThemeToggle } from './ThemeToggle'
import { Timer } from './Timer'

export function HUD() {
  const guiding = useGameStore((s) => s.guide !== null)

  return (
    <div
      data-hud
      className="@container pointer-events-none absolute inset-0 flex flex-col justify-between p-4 @lg:p-7"
    >
      <div className="flex flex-col items-center gap-5">
        <header className="grid w-full grid-cols-[1fr_auto_1fr] items-start gap-3">
          <div className="min-w-0 animate-rise">
            <h1 className="display-soft sr-only text-xl leading-tight whitespace-nowrap text-ink italic @2xl:not-sr-only @4xl:text-2xl">
              Rubik’s Cube
            </h1>
          </div>
          <div className="animate-rise [animation-delay:80ms]">
            <Timer />
          </div>
          <div
            data-ui
            className="pointer-events-auto flex animate-rise justify-end gap-2 [animation-delay:160ms]"
          >
            <GuidesToggle />
            <ThemeToggle />
          </div>
        </header>
        <SolvedBanner />
      </div>

      {/* The tutor's bubble stays out of the cube's way: beside it on wide stages, as a compact
          card above the bottom bar on narrow ones. */}
      <div className="absolute inset-x-4 bottom-28 flex justify-center @lg:bottom-32 @4xl:inset-x-auto @4xl:top-1/2 @4xl:bottom-auto @4xl:left-7 @4xl:-translate-y-1/2">
        <GuideBubble />
      </div>

      <footer className="relative flex items-end justify-center">
        <div
          className={`absolute bottom-0 left-0 hidden animate-rise [animation-delay:320ms] ${guiding ? '' : '@4xl:block'}`}
        >
          <KeyLegend />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div data-ui className="pointer-events-auto animate-rise [animation-delay:240ms]">
            <ControlBar />
          </div>
          <p className="text-center text-xs text-ink/45">
            drag a face to turn it
            <span className="hidden @lg:inline"> · drag anywhere else to look around</span>
          </p>
        </div>
      </footer>
    </div>
  )
}

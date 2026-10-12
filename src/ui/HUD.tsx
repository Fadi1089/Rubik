import { formatAlgorithm } from '../cube'
import { useGameStore } from '../store/useGameStore'
import { ControlBar } from './ControlBar'
import { formatTime } from './formatTime'
import { SolvedBanner } from './SolvedBanner'
import { Timer } from './Timer'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[11px] font-medium tracking-wider text-white/40 uppercase">
        {label}
      </span>
      <span className="font-mono text-lg font-semibold text-white tabular-nums">{value}</span>
    </div>
  )
}

export function HUD() {
  const moves = useGameStore((s) => s.history.length)
  const bestTimeMs = useGameStore((s) => s.bestTimeMs)
  const scramble = useGameStore((s) => s.scramble)

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
      <div className="flex flex-col items-center gap-4">
        <header className="grid w-full grid-cols-[1fr_auto_1fr] items-start gap-4">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-white">Rubik’s Cube</h1>
            {scramble.length > 0 && (
              <p
                className="mt-1 hidden max-w-xs font-mono text-[11px] leading-relaxed break-words text-white/40 md:block"
                title="Scramble"
              >
                {formatAlgorithm(scramble)}
              </p>
            )}
          </div>
          <Timer />
          <div className="flex justify-end gap-5">
            <Stat label="Moves" value={String(moves)} />
            <Stat label="Best" value={bestTimeMs === null ? '–' : formatTime(bestTimeMs)} />
          </div>
        </header>
        <SolvedBanner />
      </div>

      <footer className="flex flex-col items-center gap-3">
        <div className="pointer-events-auto">
          <ControlBar />
        </div>
        <p className="hidden text-center text-xs text-white/40 sm:block">
          Drag a face to turn it · <Keys keys="U D L R F B" /> turn clockwise, hold{' '}
          <Keys keys="Shift" /> for prime · drag the background to look around
        </p>
        <p className="text-center text-xs text-white/40 sm:hidden">
          Drag a face to turn it · drag the background to look around
        </p>
      </footer>
    </div>
  )
}

function Keys({ keys }: { keys: string }) {
  return (
    <span className="inline-flex gap-0.5">
      {keys.split(' ').map((key) => (
        <kbd
          key={key}
          className="rounded bg-white/10 px-1 py-px font-mono text-[11px] text-white/70"
        >
          {key}
        </kbd>
      ))}
    </span>
  )
}

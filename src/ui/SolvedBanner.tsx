import { isSolved } from '../cube'
import { useGameStore } from '../store/useGameStore'
import { formatTime } from './formatTime'

export function SolvedBanner() {
  const visible = useGameStore(
    (s) => s.status === 'solved' && s.queue.length === 0 && isSolved(s.cube),
  )
  const finalTimeMs = useGameStore((s) => s.finalTimeMs)
  const moves = useGameStore((s) => s.history.length)
  const isNewBest = useGameStore((s) => s.isNewBest)
  const startScramble = useGameStore((s) => s.startScramble)

  if (!visible || finalTimeMs === null) return null

  return (
    <div
      role="status"
      className="animate-banner-in pointer-events-auto flex items-center gap-4 rounded-2xl bg-emerald-400/12 py-3 pr-3 pl-5 ring-1 ring-emerald-300/30 backdrop-blur-md"
    >
      <div>
        <p className="text-sm font-semibold text-emerald-200">
          Solved in {formatTime(finalTimeMs)}
          {isNewBest && (
            <span className="ml-2 rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-bold tracking-wide text-amber-950 uppercase">
              New best
            </span>
          )}
        </p>
        <p className="text-xs text-emerald-100/60">
          {moves} {moves === 1 ? 'move' : 'moves'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => startScramble()}
        className="rounded-xl bg-emerald-300 px-3.5 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-100 focus-visible:outline-none"
      >
        Again
      </button>
    </div>
  )
}

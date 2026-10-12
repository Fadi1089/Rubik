import { isSolved } from '../cube'
import { countMoves, useGameStore } from '../store/useGameStore'
import { formatTime } from './formatTime'

export function SolvedBanner() {
  const visible = useGameStore(
    (s) => s.status === 'solved' && s.queue.length === 0 && isSolved(s.cube),
  )
  const finalTimeMs = useGameStore((s) => s.finalTimeMs)
  const moves = useGameStore((s) => countMoves(s.history))
  const isNewBest = useGameStore((s) => s.isNewBest)
  const assisted = useGameStore((s) => s.assisted)
  const startScramble = useGameStore((s) => s.startScramble)

  if (!visible || finalTimeMs === null) return null

  return (
    <div
      role="status"
      data-ui
      className="animate-rise pointer-events-auto flex items-center gap-5 rounded-full border border-line bg-surface/75 py-2 pr-2 pl-6 shadow-[0_18px_50px_-24px_rgb(0_0_0/0.45)] backdrop-blur-xl"
    >
      <p className="text-sm text-ink/70">
        <span className="display-soft mr-2 text-lg text-ink italic">nicely done.</span>
        {formatTime(finalTimeMs)} in {moves} {moves === 1 ? 'move' : 'moves'}
        {assisted && <span className="ml-2 text-ink/50">with a hint</span>}
        {isNewBest && (
          <span className="ml-2.5 rounded-full bg-good/15 px-2 py-0.5 text-[11px] font-semibold text-good">
            new best
          </span>
        )}
      </p>
      <button
        type="button"
        onClick={() => startScramble()}
        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none active:scale-[0.96]"
      >
        another
      </button>
    </div>
  )
}

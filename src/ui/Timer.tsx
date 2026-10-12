import { useEffect, useState } from 'react'
import { countMoves, useGameStore } from '../store/useGameStore'
import { formatTime } from './formatTime'

function useElapsed(): number {
  const status = useGameStore((s) => s.status)
  const startedAt = useGameStore((s) => s.startedAt)
  const finalTimeMs = useGameStore((s) => s.finalTimeMs)
  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    if (status !== 'running') return
    let frame = requestAnimationFrame(function tick(t) {
      setNow(t)
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [status])

  if (finalTimeMs !== null) return finalTimeMs
  if (status === 'running' && startedAt !== null) return Math.max(0, now - startedAt)
  return 0
}

const STATUS_TEXT = {
  idle: 'free play. scramble when you’re ready',
  scrambling: 'shuffling…',
  ready: 'the clock starts on your first turn',
  running: 'solving',
  solved: 'solved',
} as const

const TIMER_TONE = {
  idle: 'text-ink/25',
  scrambling: 'text-ink/25',
  ready: 'text-ink',
  running: 'text-ink',
  solved: 'text-good',
} as const

export function Timer() {
  const status = useGameStore((s) => s.status)
  const guided = useGameStore((s) => s.guide?.mode === 'guided')
  const moves = useGameStore((s) => countMoves(s.history))
  const bestTimeMs = useGameStore((s) => s.bestTimeMs)
  const elapsed = useElapsed()

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`mono text-[56px] leading-none font-light tracking-tight tabular-nums transition-colors duration-500 @lg:text-[76px] ${TIMER_TONE[status]}`}
      >
        {formatTime(elapsed)}
      </div>
      <p className="display-soft mt-2 text-sm text-ink/60 italic @lg:text-base">
        {guided && status !== 'scrambling' ? 'guided solve, no clock' : STATUS_TEXT[status]}
      </p>
      <p className="mt-1.5 text-xs text-ink/45 tabular-nums">
        {moves} {moves === 1 ? 'move' : 'moves'}
        <span className="mx-2" aria-hidden>
          ·
        </span>
        best {bestTimeMs === null ? '–' : formatTime(bestTimeMs)}
      </p>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore'
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
  idle: 'Free play. Scramble to start a timed solve',
  scrambling: 'Scrambling…',
  ready: 'Timer starts on your first turn',
  running: 'Solving',
  solved: 'Solved',
} as const

const TIMER_COLOR = {
  idle: 'text-white/30',
  scrambling: 'text-white/30',
  ready: 'text-white',
  running: 'text-white',
  solved: 'text-emerald-300',
} as const

export function Timer() {
  const status = useGameStore((s) => s.status)
  const elapsed = useElapsed()

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div
        className={`font-mono text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl ${TIMER_COLOR[status]}`}
        aria-live="off"
      >
        {formatTime(elapsed)}
      </div>
      <p className="text-xs font-medium text-white/50 sm:text-sm">{STATUS_TEXT[status]}</p>
    </div>
  )
}

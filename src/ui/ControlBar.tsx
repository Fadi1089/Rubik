import type { ReactNode } from 'react'
import { useGameStore } from '../store/useGameStore'

interface ButtonProps {
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  hint?: string
  children: ReactNode
}

function Button({ onClick, disabled, primary, hint, children }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:outline-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 ${
        primary
          ? 'bg-white text-zinc-950 hover:bg-zinc-200'
          : 'bg-white/8 text-white ring-1 ring-white/12 ring-inset hover:bg-white/14'
      }`}
    >
      {children}
      {hint && (
        <kbd
          className={`hidden rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium sm:inline ${
            primary ? 'bg-zinc-950/10 text-zinc-600' : 'bg-white/10 text-white/55'
          }`}
        >
          {hint}
        </kbd>
      )}
    </button>
  )
}

const UNDO_HINT = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘Z' : 'Ctrl Z'

export function ControlBar() {
  const status = useGameStore((s) => s.status)
  const canUndo = useGameStore((s) => s.history.length > 0)
  const startScramble = useGameStore((s) => s.startScramble)
  const undo = useGameStore((s) => s.undo)
  const reset = useGameStore((s) => s.reset)
  const scrambling = status === 'scrambling'

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-zinc-900/70 p-2 shadow-2xl ring-1 shadow-black/40 ring-white/10 backdrop-blur-md">
      <Button primary onClick={() => startScramble()} disabled={scrambling}>
        Scramble
      </Button>
      <Button onClick={undo} disabled={scrambling || !canUndo} hint={UNDO_HINT}>
        Undo
      </Button>
      <Button onClick={reset}>Reset</Button>
    </div>
  )
}

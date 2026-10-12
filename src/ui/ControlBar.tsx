import type { ReactNode } from 'react'
import { useGameStore } from '../store/useGameStore'
import { BulbIcon, ResetIcon, ShuffleIcon, UndoIcon } from './icons'
import { StylePicker } from './StylePicker'

interface ButtonProps {
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  label: string
  icon: ReactNode
}

function DockButton({ onClick, disabled, primary, label, icon }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none active:scale-[0.96] disabled:pointer-events-none disabled:opacity-35 @lg:px-4 ${
        primary
          ? 'bg-accent font-semibold text-accent-ink shadow-[0_6px_20px_-8px_var(--accent)] hover:brightness-105'
          : 'text-ink/80 hover:bg-ink/6 hover:text-ink'
      }`}
    >
      {icon}
      <span className={primary ? '' : 'hidden @lg:inline'}>{label}</span>
    </button>
  )
}

export function ControlBar() {
  const status = useGameStore((s) => s.status)
  const canUndo = useGameStore((s) => s.history.length > 0)
  const startScramble = useGameStore((s) => s.startScramble)
  const undo = useGameStore((s) => s.undo)
  const reset = useGameStore((s) => s.reset)
  const startGuide = useGameStore((s) => s.startGuide)
  const guided = useGameStore((s) => s.guide?.mode === 'guided')
  const scrambling = status === 'scrambling'

  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-surface/70 p-1.5 shadow-[0_18px_50px_-24px_rgb(0_0_0/0.45)] backdrop-blur-xl">
      <DockButton
        primary
        label="Scramble"
        icon={<ShuffleIcon />}
        onClick={() => startScramble()}
        disabled={scrambling}
      />
      <DockButton
        label="Undo"
        icon={<UndoIcon />}
        onClick={undo}
        disabled={scrambling || !canUndo}
      />
      <DockButton
        label="Hint"
        icon={<BulbIcon />}
        onClick={() => startGuide('hint')}
        disabled={scrambling || guided}
      />
      <DockButton label="Reset" icon={<ResetIcon />} onClick={reset} />
      <span className="mx-1 h-6 w-px bg-line" aria-hidden />
      <StylePicker />
    </div>
  )
}

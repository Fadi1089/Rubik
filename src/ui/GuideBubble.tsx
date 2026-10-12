import { useState } from 'react'
import { formatMove } from '../cube'
import { STAGES, stageNumber } from '../solver/beginner'
import { useGameStore } from '../store/useGameStore'
import { describeMove } from './describeMove'
import { CloseIcon, PlayIcon } from './icons'

/**
 * The tutor's speech bubble: the next move first, then why. Beside the cube on wide stages
 * (tail pointing right), above the bottom bar on narrow ones (tail pointing up), where the
 * explanation folds to two lines until tapped.
 */
export function GuideBubble() {
  const guide = useGameStore((s) => s.guide)
  const scrambling = useGameStore((s) => s.status === 'scrambling')
  const guideStep = useGameStore((s) => s.guideStep)
  const stopGuide = useGameStore((s) => s.stopGuide)
  const [expanded, setExpanded] = useState(false)

  if (!guide) return null
  const { hint, index, mode } = guide
  const next = hint?.moves[index]
  const remaining = hint ? hint.moves.length - index - 1 : 0
  const stage = hint ? STAGES[stageNumber(hint.stage) - 1] : null

  return (
    <div
      role="status"
      aria-live="polite"
      data-ui
      className="animate-rise pointer-events-auto relative w-full max-w-[24rem] rounded-3xl border border-line bg-surface/85 px-4 pt-3 pb-3.5 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.5)] backdrop-blur-xl @4xl:w-[19rem]"
    >
      <span
        aria-hidden
        className="absolute -top-[7px] left-1/2 size-3.5 -translate-x-1/2 rotate-45 border-t border-l border-line bg-surface/85 @4xl:top-1/2 @4xl:-right-[7px] @4xl:left-auto @4xl:-translate-x-0 @4xl:-translate-y-1/2 @4xl:border-l-0 @4xl:border-r"
      />

      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10.5px] font-medium tracking-wide text-ink/50 uppercase">
          {mode === 'guided' ? 'Guided solve' : 'Hint'}
          {stage && (
            <span className="text-accent normal-case">
              {' · '}
              {mode === 'guided' && `${stageNumber(stage.id)}/${STAGES.length} `}
              {stage.title}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={stopGuide}
          aria-label={mode === 'guided' ? 'Stop guided solve' : 'Close hint'}
          className="-mr-1.5 grid size-7 shrink-0 place-items-center rounded-full text-ink/45 transition hover:bg-ink/6 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <CloseIcon />
        </button>
      </div>

      {scrambling ? (
        <p className="display-soft mt-1 text-base text-ink italic">Shuffling first…</p>
      ) : !hint ? (
        <p className="display-soft mt-1 text-base text-ink italic">
          Solved. That’s the whole method, start to finish.
        </p>
      ) : (
        <>
          {next && (
            <div className="mt-2 flex items-center gap-2.5">
              <span className="mono grid h-10 min-w-10 shrink-0 place-items-center rounded-xl bg-accent px-2 text-base font-semibold text-accent-ink">
                {formatMove(next)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug font-medium text-ink">
                  {describeMove(next)}
                </p>
                <p className="text-[10.5px] text-ink/50">
                  {remaining > 0
                    ? `then ${remaining} more ${remaining === 1 ? 'move' : 'moves'}`
                    : 'last move of this step'}
                </p>
              </div>
              <button
                type="button"
                onClick={guideStep}
                aria-label="Show me: make this move"
                className="flex shrink-0 items-center gap-1 rounded-full bg-ink/8 px-2.5 py-1.5 text-[11px] font-semibold text-ink transition hover:bg-ink/14 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none active:scale-95"
              >
                <PlayIcon />
                show me
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="mt-2 block w-full cursor-pointer text-left focus-visible:outline-none @4xl:pointer-events-none @4xl:cursor-default"
          >
            <span
              className={`text-[12.5px] leading-relaxed text-ink/70 @4xl:line-clamp-none ${
                expanded ? '' : 'line-clamp-2'
              }`}
            >
              {hint.text}
            </span>
          </button>
        </>
      )}
    </div>
  )
}

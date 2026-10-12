import { useEffect, useId, useMemo, useState } from 'react'
import { parseAlgorithm } from '../cube'
import { GUIDES, NOTATION, type Algorithm, type Guide } from '../guides/guides'
import { algorithmImage, stepImage, type ImageSpec } from '../guides/images'
import { useGameStore } from '../store/useGameStore'
import { useUiStore } from '../store/useUiStore'
import { ChevronIcon, CloseIcon, CompassIcon, PlayIcon, SetupIcon } from './icons'

/** Below this width the panel covers the cube, so it gets out of the way to show a move. */
const PANEL_OVERLAYS = '(max-width: 63.99rem)'

const imageUrl = (spec: ImageSpec) => `${import.meta.env.BASE_URL}guide-images/${spec.id}.webp`

function CaseImage({ spec, size }: { spec: ImageSpec; size: number }) {
  return (
    <img
      src={imageUrl(spec)}
      alt={spec.alt}
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      className="shrink-0 rounded-xl bg-bg/50"
      style={{ width: size, height: size }}
    />
  )
}

function AlgorithmCard({
  algKey,
  alg,
  image,
}: {
  algKey: string
  alg: Algorithm
  image: ImageSpec
}) {
  const moves = useMemo(() => parseAlgorithm(alg.moves), [alg.moves])
  const [showMoves, setShowMoves] = useState(false)
  const setGuidesOpen = useUiStore((s) => s.setGuidesOpen)
  const revealCube = () => {
    if (window.matchMedia(PANEL_OVERLAYS).matches) setGuidesOpen(false)
  }
  const tokens = alg.moves.split(/\s+/)
  const playAlgorithm = useGameStore((s) => s.playAlgorithm)
  const setupCase = useGameStore((s) => s.setupCase)
  const busy = useGameStore((s) => s.status === 'scrambling')
  const isCase = useGameStore((s) => s.caseKey === algKey)
  // Index of the move animating right now, if this algorithm is the one playing.
  const activeIndex = useGameStore((s) =>
    s.guidePlayback?.key === algKey ? s.guidePlayback.ids.indexOf(s.queue[0]?.id ?? -1) : -1,
  )
  const playing = activeIndex !== -1
  const movesId = useId()

  return (
    <div
      className={`rounded-2xl border p-2.5 transition-colors ${
        isCase || playing ? 'border-accent/50 bg-accent/6' : 'border-line bg-bg/35'
      }`}
    >
      <div className="flex gap-3">
        <CaseImage spec={image} size={92} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h4 className="text-[13px] font-semibold text-ink">{alg.name}</h4>
          {alg.hint && <p className="mt-0.5 text-[11px] leading-relaxed text-ink/60">{alg.hint}</p>}
          {isCase && !playing && (
            <p className="mt-0.5 text-[11px] text-accent">Set up on the cube. Press play.</p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-1 pt-2">
            <button
              type="button"
              onClick={() => {
                setupCase(algKey, moves)
                revealCube()
              }}
              disabled={busy}
              title="Reset the cube and set up the case this algorithm solves"
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-ink/65 transition hover:bg-ink/6 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-35"
            >
              <SetupIcon />
              set up
            </button>
            <button
              type="button"
              onClick={() => {
                playAlgorithm(algKey, moves)
                revealCube()
              }}
              disabled={busy}
              title="Play this algorithm on the cube"
              className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent transition hover:bg-accent hover:text-accent-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-35"
            >
              <PlayIcon />
              play
            </button>
            <button
              type="button"
              onClick={() => setShowMoves((v) => !v)}
              aria-expanded={showMoves || playing}
              aria-controls={movesId}
              className="ml-auto rounded-full px-2 py-1 text-[11px] text-ink/50 transition hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              moves
            </button>
          </div>
        </div>
      </div>
      {(showMoves || playing) && (
        <p
          id={movesId}
          className="mono mt-2 flex flex-wrap gap-x-1.5 gap-y-0.5 border-t border-line pt-2 text-[12.5px] leading-snug text-ink/85"
        >
          {tokens.map((token, i) => (
            <span
              key={i}
              className={`rounded px-0.5 transition-colors duration-150 ${
                i === activeIndex
                  ? 'bg-accent text-accent-ink'
                  : playing && i < activeIndex
                    ? 'text-ink/35'
                    : ''
              }`}
            >
              {token}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

function GuideSection({ guide }: { guide: Guide }) {
  const open = useUiStore((s) => s.openGuideId === guide.id)
  const setOpenGuideId = useUiStore((s) => s.setOpenGuideId)
  const bodyId = useId()

  return (
    <section className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={() => setOpenGuideId(open ? null : guide.id)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="group flex w-full items-start gap-3 py-4 text-left focus-visible:outline-none"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="display-soft text-lg leading-tight text-ink group-focus-visible:underline">
              {guide.name}
            </h3>
            <span className="rounded-full bg-ink/6 px-2 py-0.5 text-[10px] font-medium tracking-wide text-ink/60">
              {guide.level}
            </span>
          </div>
          <p className={`mt-1 text-xs leading-relaxed text-ink/60 ${open ? '' : 'line-clamp-2'}`}>
            {guide.summary}
          </p>
        </div>
        <span className="mt-1 text-ink/50 group-hover:text-ink">
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <div id={bodyId} className="animate-rise pb-5">
          <div className="mb-4 flex flex-wrap gap-1.5">
            {guide.facts.map((fact) => (
              <span
                key={fact}
                className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink/65"
              >
                {fact}
              </span>
            ))}
          </div>

          <ol className="space-y-5">
            {guide.steps.map((step, stepIndex) => (
              <li key={step.title} className="relative pl-8">
                <span
                  aria-hidden
                  className="mono absolute top-0 left-0 grid size-5.5 place-items-center rounded-full bg-ink text-[11px] font-semibold text-bg"
                >
                  {stepIndex + 1}
                </span>
                <h4 className="text-sm font-semibold text-ink">{step.title}</h4>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink/70">{step.body}</p>
                {stepImage(guide, step) && (
                  <figure className="mt-2.5 flex items-center gap-3 rounded-2xl border border-line bg-bg/35 p-2.5">
                    <CaseImage spec={stepImage(guide, step)!} size={108} />
                    <figcaption className="text-[11px] leading-relaxed text-ink/55">
                      When this step is done. Grey stickers don’t matter yet.
                    </figcaption>
                  </figure>
                )}
                {step.algorithms && (
                  <div className="mt-2.5 space-y-2">
                    {step.algorithms.map((alg) => (
                      <AlgorithmCard
                        key={alg.name}
                        algKey={`${guide.id}/${stepIndex}/${alg.name}`}
                        alg={alg}
                        image={algorithmImage(guide, step, alg)}
                      />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-5">
            <p className="text-[11px] font-medium tracking-wide text-ink/45 uppercase">Sources</p>
            <ul className="mt-1.5 space-y-1">
              {guide.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs text-ink/65 underline decoration-line underline-offset-2 transition hover:text-accent hover:decoration-accent"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

function NotationPrimer() {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  return (
    <div className="rounded-2xl border border-line bg-bg/35">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[13px] font-medium text-ink/80 transition hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-2xl"
      >
        Reading the moves
        <ChevronIcon open={open} />
      </button>
      {open && (
        <dl id={bodyId} className="animate-rise space-y-1.5 px-3.5 pb-3">
          {NOTATION.map((entry) => (
            <div key={entry.symbol} className="grid grid-cols-[4.5rem_1fr] gap-2 text-xs">
              <dt className="mono font-semibold text-ink">{entry.symbol}</dt>
              <dd className="leading-relaxed text-ink/65">{entry.meaning}</dd>
            </div>
          ))}
          <p className="pt-1 text-[11px] leading-relaxed text-ink/50">
            Algorithms assume white is on the bottom and you’re looking at the front face, as in the
            pictures. “Set up” turns the cube that way for you.
          </p>
        </dl>
      )}
    </div>
  )
}

// Keep in sync with the stage offset in App.tsx (width + 12px gap).
const GUIDE_PANEL_WIDTH = 392

/** Collapsible side panel with solving methods and playable algorithms. */
function StartGuidedSolve() {
  const startGuide = useGameStore((s) => s.startGuide)
  const guided = useGameStore((s) => s.guide?.mode === 'guided')
  const busy = useGameStore((s) => s.status === 'scrambling')
  const setGuidesOpen = useUiStore((s) => s.setGuidesOpen)
  return (
    <div className="rounded-2xl bg-accent/10 p-3.5">
      <button
        type="button"
        disabled={guided || busy}
        onClick={() => {
          startGuide('guided')
          if (window.matchMedia(PANEL_OVERLAYS).matches) setGuidesOpen(false)
        }}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink shadow-[0_6px_20px_-8px_var(--accent)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none active:scale-[0.98] disabled:opacity-50"
      >
        <CompassIcon />
        {guided ? 'Guided solve in progress' : 'Start guided solve'}
      </button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-ink/60">
        Walks you through layer by layer from wherever your cube is. Pieces to watch glow, an arrow
        shows each turn, and you can go your own way at any point.
      </p>
    </div>
  )
}

export function GuidePanel() {
  const open = useUiStore((s) => s.guidesOpen)
  const setGuidesOpen = useUiStore((s) => s.setGuidesOpen)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGuidesOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setGuidesOpen])

  return (
    <>
      {/* On narrow screens the panel covers the cube, so tapping outside closes it. */}
      <div
        aria-hidden
        onClick={() => setGuidesOpen(false)}
        className={`absolute inset-0 z-30 bg-bg-deep/40 backdrop-blur-[2px] transition-opacity duration-500 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        aria-label="Solving guides"
        inert={!open}
        style={{ width: `min(${GUIDE_PANEL_WIDTH}px, calc(100vw - 24px))` }}
        className={`absolute top-3 right-3 bottom-3 z-40 flex flex-col overflow-hidden rounded-3xl border border-line bg-surface/80 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.5)] backdrop-blur-xl transition duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          open
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-[calc(100%+24px)] opacity-0'
        }`}
      >
        <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <h2 className="display-soft text-2xl leading-none text-ink italic">guides</h2>
            <p className="mt-1.5 text-xs text-ink/55">
              Four ways to solve it, from first solve to speed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGuidesOpen(false)}
            aria-label="Close guides"
            className="grid size-9 place-items-center rounded-full text-ink/60 transition hover:bg-ink/6 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 [mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-20px),transparent)]">
          <div className="space-y-3 pt-2 pb-1">
            <StartGuidedSolve />
            <NotationPrimer />
          </div>
          {GUIDES.map((guide) => (
            <GuideSection key={guide.id} guide={guide} />
          ))}
        </div>
      </aside>
    </>
  )
}

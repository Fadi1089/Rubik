import type { ViewSide } from '../cube'
import { reverseAction } from '../input/chordTracker'
import {
  findChord,
  KEYPAD_CODES,
  KEYPAD_GRID,
  KEYPAD_TAPS,
  NOTATION_KEYS,
  type KeypadAction,
} from '../input/keymap'
import { useKeyLabels } from '../input/useKeyLabels'
import { useUiStore, type KeyScheme } from '../store/useUiStore'

const SIDE_NAMES: Record<ViewSide, string> = {
  front: 'front',
  back: 'back',
  up: 'top',
  down: 'bottom',
  left: 'left',
  right: 'right',
}

/** How a clockwise (+1) turn of each side moves, as seen from the front. */
const CLOCKWISE_ARROWS: Record<ViewSide, [string, string]> = {
  front: ['↻', '↺'],
  back: ['↺', '↻'],
  up: ['←', '→'],
  down: ['→', '←'],
  left: ['↓', '↑'],
  right: ['↑', '↓'],
}

const ROLL_ARROWS = { up: '↑', down: '↓', left: '←', right: '→' } as const

/** Keys with no tap action, labelled with what they're for. */
const IDLE_CAPTIONS: Record<string, string> = {
  KeyS: 'cube',
}

function actionCaption(action: KeypadAction, reversed: boolean): string {
  const a = reversed ? reverseAction(action) : action
  if (a.kind === 'roll') return `cube ${ROLL_ARROWS[a.direction]}`
  const name = a.kind === 'slice' ? 'mid' : SIDE_NAMES[a.side]
  return `${name} ${CLOCKWISE_ARROWS[a.side][a.direction === 1 ? 0 : 1]}`
}

function KeyCap({
  label,
  caption,
  held,
  dim,
}: {
  label: string
  caption?: string
  held: boolean
  dim?: boolean
}) {
  return (
    <div
      className={`flex size-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl border transition duration-150 ${
        held
          ? 'translate-y-px border-accent bg-accent text-accent-ink shadow-none'
          : 'border-line bg-surface/70 text-ink shadow-[0_2px_0_var(--line)]'
      } ${dim ? 'opacity-35' : ''}`}
    >
      <span className="mono text-base leading-none font-semibold">{label}</span>
      {caption && (
        <span className={`text-[10px] leading-none ${held ? 'opacity-90' : 'text-ink/55'}`}>
          {caption}
        </span>
      )}
    </div>
  )
}

function SchemeToggle({ scheme }: { scheme: KeyScheme }) {
  const setKeyScheme = useUiStore((s) => s.setKeyScheme)
  return (
    <div role="radiogroup" aria-label="Key scheme" className="flex rounded-full bg-ink/6 p-0.5">
      {(['keypad', 'notation'] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={scheme === option}
          onClick={() => setKeyScheme(option)}
          className={`rounded-full px-2.5 py-1 text-[11px] transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            scheme === option ? 'bg-surface text-ink shadow-sm' : 'text-ink/55 hover:text-ink'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export function KeyLegend() {
  const scheme = useUiStore((s) => s.keyScheme)
  const heldKeys = useUiStore((s) => s.heldKeys)
  const labelFor = useKeyLabels()
  const shift = heldKeys.includes('ShiftLeft') || heldKeys.includes('ShiftRight')
  // The most recently pressed keypad key that is still down.
  const anchor =
    scheme === 'keypad' ? heldKeys.findLast((code) => KEYPAD_CODES.includes(code)) : undefined

  return (
    <section
      aria-label="Keyboard controls"
      data-ui
      className="pointer-events-auto w-[196px] rounded-3xl border border-line bg-surface/55 p-3.5 backdrop-blur-xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="display-soft text-sm text-ink/70 italic">keys</h2>
        <SchemeToggle scheme={scheme} />
      </div>

      {scheme === 'keypad' ? (
        <div className="grid grid-cols-3 gap-1.5">
          {KEYPAD_GRID.flat().map((code) => {
            const isHeld = heldKeys.includes(code)
            let caption: string
            let dim = false
            if (anchor && code !== anchor) {
              // While a key is held, show what each partner key would do with it.
              const chord = findChord(anchor, code)
              caption = chord ? actionCaption(chord.action, shift) : ''
              dim = !chord
            } else {
              const tap = KEYPAD_TAPS[code]
              caption = tap ? actionCaption(tap, shift) : IDLE_CAPTIONS[code]
            }
            return (
              <KeyCap key={code} label={labelFor(code)} caption={caption} held={isHeld} dim={dim} />
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {NOTATION_KEYS.map((face) => (
            <KeyCap
              key={face}
              label={face}
              caption={shift ? `${face}'` : face}
              held={heldKeys.includes(`Key${face}`)}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-ink/55">
        {scheme === 'keypad' ? (
          <>
            Tap a key to push the middle row or column, or spin the front or back from a corner.
            Hold a middle key and press an end key to push that row or column, e.g.{' '}
            <b className="font-medium text-ink/75">
              {labelFor('KeyW')}+{labelFor('KeyE')}
            </b>
            . Through <b className="font-medium text-ink/75">{labelFor('KeyS')}</b> the whole cube
            rolls. <b className="font-medium text-ink/75">Shift</b> reverses.
          </>
        ) : (
          <>
            <b className="font-medium text-ink/75">shift</b> for prime turns. Arrows roll the cube.
          </>
        )}
      </p>
    </section>
  )
}

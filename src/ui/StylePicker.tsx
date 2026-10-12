import { useEffect, useId, useRef, useState } from 'react'
import { CUBE_STYLE_IDS, CUBE_STYLES } from '../scene/cubeStyles'
import { useUiStore } from '../store/useUiStore'
import { StyleSwatch } from './StyleSwatch'

export function StylePicker() {
  const [open, setOpen] = useState(false)
  const current = useUiStore((s) => s.cubeStyle)
  const setCubeStyle = useUiStore((s) => s.setCubeStyle)
  const root = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Cube style: ${CUBE_STYLES[current].name}`}
        className="flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-sm text-ink/80 transition hover:bg-ink/6 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <StyleSwatch style={CUBE_STYLES[current]} size={26} />
        <span className="hidden @lg:inline">{CUBE_STYLES[current].name}</span>
      </button>

      {open && (
        <div
          id={panelId}
          role="listbox"
          aria-label="Cube style"
          className="animate-rise absolute right-0 bottom-full mb-3 w-56 rounded-3xl border border-line bg-surface/90 p-2 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.35)] backdrop-blur-xl"
        >
          <p className="display-soft px-3 pt-2 pb-1.5 text-sm text-ink/60 italic">cube style</p>
          {CUBE_STYLE_IDS.map((id) => {
            const style = CUBE_STYLES[id]
            const selected = id === current
            return (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setCubeStyle(id)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-2 py-1.5 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  selected ? 'bg-ink/8 text-ink' : 'text-ink/75 hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <StyleSwatch style={style} size={32} />
                <span className="flex-1">{style.name}</span>
                {selected && <span className="size-1.5 rounded-full bg-accent" aria-hidden />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useUiStore } from '../store/useUiStore'
import { BookIcon } from './icons'

export function GuidesToggle() {
  const open = useUiStore((s) => s.guidesOpen)
  const setGuidesOpen = useUiStore((s) => s.setGuidesOpen)

  return (
    <button
      type="button"
      onClick={() => setGuidesOpen(!open)}
      aria-expanded={open}
      aria-label={open ? 'Close solving guides' : 'Open solving guides'}
      className={`flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm backdrop-blur-md transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none active:scale-95 ${
        open
          ? 'border-accent/40 bg-accent/12 text-ink'
          : 'border-line bg-surface/60 text-ink/80 hover:text-ink'
      }`}
    >
      <BookIcon />
      <span className="hidden @lg:inline">guides</span>
    </button>
  )
}

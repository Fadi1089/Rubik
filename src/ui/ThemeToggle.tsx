import { useUiStore } from '../store/useUiStore'
import { MoonIcon, SunIcon } from './icons'

export function ThemeToggle() {
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const next = theme === 'dark' ? 'creme' : 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="group relative grid size-10 place-items-center rounded-full border border-line bg-surface/60 text-ink/80 backdrop-blur-md transition hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none active:scale-95"
    >
      <span
        className={`absolute transition duration-500 ${theme === 'dark' ? 'scale-50 -rotate-90 opacity-0' : 'opacity-100'}`}
      >
        <SunIcon />
      </span>
      <span
        className={`absolute transition duration-500 ${theme === 'dark' ? 'opacity-100' : 'scale-50 rotate-90 opacity-0'}`}
      >
        <MoonIcon />
      </span>
    </button>
  )
}

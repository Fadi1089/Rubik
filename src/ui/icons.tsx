import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  )
}

export const ShuffleIcon = () => (
  <Icon>
    <path d="M3 7h3.5c2.5 0 3.8 1.2 5.5 5s3 5 5.5 5H21" />
    <path d="M3 17h3.5c1.4 0 2.4-.4 3.3-1.3M14.2 8.3C15.1 7.4 16.1 7 17.5 7H21" />
    <path d="m18 4 3 3-3 3M18 14l3 3-3 3" />
  </Icon>
)

export const UndoIcon = () => (
  <Icon>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Icon>
)

export const ResetIcon = () => (
  <Icon>
    <path d="M3 12a9 9 0 1 0 2.7-6.4L3 8" />
    <path d="M3 3v5h5" />
  </Icon>
)

export const SunIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
)

export const MoonIcon = () => (
  <Icon>
    <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
  </Icon>
)

export const BookIcon = () => (
  <Icon>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
    <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
    <path d="M8 7.5h8M8 11h5" />
  </Icon>
)

export const PlayIcon = () => (
  <Icon width={14} height={14}>
    <path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" />
  </Icon>
)

export const SetupIcon = () => (
  <Icon width={14} height={14}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M4 10h16M4 14h16M10 4v16M14 4v16" />
  </Icon>
)

export const ChevronIcon = ({ open }: { open: boolean }) => (
  <Icon
    width={16}
    height={16}
    className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
  >
    <path d="m6 9 6 6 6-6" />
  </Icon>
)

export const CloseIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)

export const BulbIcon = () => (
  <Icon>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z" />
  </Icon>
)

export const CompassIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
  </Icon>
)

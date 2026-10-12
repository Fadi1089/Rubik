// Fractal noise, rendered once as a data URI, laid over everything as paper grain.
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.45 0 0 0 0 0.4 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

/** Slow colour fields drifting behind the cube, plus grain. Purely decorative. */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_0%,var(--bg-deep)_95%)] transition-colors duration-500" />
      <div className="animate-drift-a absolute -top-[20vh] -left-[15vw] h-[70vh] w-[60vw] rounded-full bg-[var(--blob-a)] opacity-60 blur-[90px] transition-colors duration-700" />
      <div className="animate-drift-b absolute -right-[10vw] -bottom-[25vh] h-[75vh] w-[55vw] rounded-full bg-[var(--blob-b)] opacity-60 blur-[90px] transition-colors duration-700" />
      <div className="animate-drift-c absolute top-[30vh] left-[40vw] h-[45vh] w-[35vw] rounded-full bg-[var(--blob-c)] opacity-40 blur-[100px] transition-colors duration-700" />
      <div
        className="absolute inset-0 mix-blend-multiply dark:mix-blend-screen"
        style={{ backgroundImage: GRAIN, opacity: 'var(--grain-opacity)' }}
      />
    </div>
  )
}

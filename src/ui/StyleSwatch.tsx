import type { Face } from '../cube'
import type { CubeStyle } from '../scene/cubeStyles'

/** A mixed-up face, so every swatch shows off most of its colours. */
const PATTERN: Face[] = ['F', 'R', 'U', 'U', 'F', 'L', 'D', 'B', 'F']

/** A tiny flat drawing of one face of the cube in the given style. */
export function StyleSwatch({ style, size = 36 }: { style: CubeStyle; size?: number }) {
  const cell = 10
  const sticker = cell * (style.sticker.size / 0.95)
  const inset = (cell - sticker) / 2
  const radius = sticker * (style.sticker.radius / style.sticker.size)
  return (
    <svg width={size} height={size} viewBox="-1 -1 32 32" aria-hidden className="shrink-0">
      <rect x={-1} y={-1} width={32} height={32} rx={6} fill={style.body.color} />
      {PATTERN.map((face, i) => (
        <rect
          key={i}
          x={(i % 3) * cell + inset}
          y={Math.floor(i / 3) * cell + inset}
          width={sticker}
          height={sticker}
          rx={radius}
          fill={style.colors[face]}
        />
      ))}
    </svg>
  )
}

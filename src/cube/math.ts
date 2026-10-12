import type { Axis, Mat3, Vec3 } from './types'

export const AXES: readonly Axis[] = ['x', 'y', 'z']

export const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1]

export function axisIndex(axis: Axis): 0 | 1 | 2 {
  return axis === 'x' ? 0 : axis === 'y' ? 1 : 2
}

/** Rotation of `quarters` * 90° about `axis`, using the right-hand rule. */
export function axisRotation(axis: Axis, quarters: number): Mat3 {
  const q = ((quarters % 4) + 4) % 4
  const c = [1, 0, -1, 0][q]
  const s = [0, 1, 0, -1][q]
  switch (axis) {
    case 'x':
      return [1, 0, 0, 0, c, -s, 0, s, c]
    case 'y':
      return [c, 0, s, 0, 1, 0, -s, 0, c]
    case 'z':
      return [c, -s, 0, s, c, 0, 0, 0, 1]
  }
}

export function multiply(a: Mat3, b: Mat3): Mat3 {
  const out: number[] = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      out.push(a[row * 3] * b[col] + a[row * 3 + 1] * b[3 + col] + a[row * 3 + 2] * b[6 + col])
    }
  }
  return out as unknown as Mat3
}

export function transform(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ]
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function vecEquals(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}

export function matEquals(a: Mat3, b: Mat3): boolean {
  return a.every((value, i) => value === b[i])
}

import { describe, expect, it } from 'vitest'
import { formatTime } from './formatTime'

describe('formatTime', () => {
  it('formats seconds and minutes', () => {
    expect(formatTime(0)).toBe('0.00')
    expect(formatTime(12_345)).toBe('12.34')
    expect(formatTime(83_456)).toBe('1:23.45')
    expect(formatTime(600_000)).toBe('10:00.00')
  })
})

/** 12345 → "12.34", 83456 → "1:23.45". Truncates rather than rounds, like a stopwatch. */
export function formatTime(ms: number): string {
  const centis = Math.floor(Math.max(0, ms) / 10)
  const minutes = Math.floor(centis / 6000)
  const seconds = Math.floor((centis % 6000) / 100)
  const cs = String(centis % 100).padStart(2, '0')
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}.${cs}` : `${seconds}.${cs}`
}

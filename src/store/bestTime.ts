const STORAGE_KEY = 'rubik:best-time-ms'

// localStorage can be missing (tests, SSR) or throw (private mode, blocked storage), so the
// game simply forgets best times rather than breaking.
const storage = (): Storage | null => (typeof window === 'undefined' ? null : window.localStorage)

export function loadBestTime(): number | null {
  try {
    const raw = storage()?.getItem(STORAGE_KEY) ?? null
    const value = raw === null ? NaN : Number(raw)
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

export function saveBestTime(ms: number): void {
  try {
    storage()?.setItem(STORAGE_KEY, String(Math.round(ms)))
  } catch {
    // Ignore: best time just won't persist.
  }
}

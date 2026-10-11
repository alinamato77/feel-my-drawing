/**
 * Shared pool of 10 hearts. A wrong round costs one. One heart regenerates
 * every 5 minutes up to 10. Timestamps are the source of truth (not timers),
 * so refreshing or closing the page never resets or pauses regeneration.
 */
export const MAX_HEARTS = 10
export const REGEN_MS = 5 * 60 * 1000

export interface Hearts {
  count: number
  /** Start of the current regeneration interval (ms since epoch). */
  since: number
}

const KEY = 'feel-my-drawing:hearts-v2'

/** Apply any regeneration earned since `h.since`. */
export function settle(h: Hearts, now = Date.now()): Hearts {
  if (h.count >= MAX_HEARTS) return { count: MAX_HEARTS, since: now }
  const gained = Math.floor((now - h.since) / REGEN_MS)
  if (gained <= 0) return h
  const count = Math.min(MAX_HEARTS, h.count + gained)
  return { count, since: count >= MAX_HEARTS ? now : h.since + gained * REGEN_MS }
}

export function loadHearts(now = Date.now()): Hearts {
  try {
    const h = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Hearts | null
    if (h && typeof h.count === 'number' && typeof h.since === 'number') return settle(h, now)
  } catch {
    // fall through
  }
  return { count: MAX_HEARTS, since: now }
}

export function saveHearts(h: Hearts) {
  try {
    localStorage.setItem(KEY, JSON.stringify(h))
  } catch {
    // Storage unavailable: hearts last for this visit only.
  }
}

export function loseHeart(h: Hearts, now = Date.now()): Hearts {
  const s = settle(h, now)
  if (s.count <= 0) return s
  // A full pool starts its regeneration clock now.
  return { count: s.count - 1, since: s.count >= MAX_HEARTS ? now : s.since }
}

/** Milliseconds until the next heart (0 when full) and progress 0–1 through the interval. */
export function regenStatus(h: Hearts, now = Date.now()) {
  if (h.count >= MAX_HEARTS) return { msLeft: 0, progress: 1 }
  const into = Math.max(0, now - h.since) % REGEN_MS
  return { msLeft: REGEN_MS - into, progress: into / REGEN_MS }
}

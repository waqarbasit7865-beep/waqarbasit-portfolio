/**
 * Remembers where the visitor was in Selected Work when they opened a case study,
 * so "Back to selected work" (and browser Back) can return to the same place and focus.
 * Also carries the clicked cover's on-screen rect for the no-View-Transitions fallback.
 */
export interface WorkReturn {
  slug: string
  y: number
}
const KEY = 'work:return'
let memo: WorkReturn | null = null
let coverRect: { slug: string; rect: DOMRect } | null = null

export function saveWorkReturn(slug: string, coverEl?: Element | null) {
  memo = { slug, y: Math.round(window.scrollY) }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(memo))
  } catch {
    /* storage unavailable — memory copy still works */
  }
  coverRect = coverEl ? { slug, rect: coverEl.getBoundingClientRect() } : null
}

export function readWorkReturn(): WorkReturn | null {
  if (memo) return memo
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as WorkReturn) : null
  } catch {
    return null
  }
}

export function clearWorkReturn() {
  memo = null
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/** One-shot: the rect of the cover the visitor clicked, for the fallback expand animation */
export function takeCoverRect(slug: string) {
  const r = coverRect && coverRect.slug === slug ? coverRect.rect : null
  coverRect = null
  return r
}

export const supportsViewTransitions = () => typeof document !== 'undefined' && 'startViewTransition' in document

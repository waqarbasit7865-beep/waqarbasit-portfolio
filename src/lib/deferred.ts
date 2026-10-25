/** Start expensive presentation work near its viewport, outside the current input/paint task. */
export function whenNearViewport(el: Element, work: () => void, margin = '350px') {
  let cancelled = false
  let idle = 0
  let timer = 0
  const start = () => {
    observer?.disconnect()
    if (typeof window.requestIdleCallback === 'function') {
      idle = window.requestIdleCallback(() => { if (!cancelled) work() }, { timeout: 700 })
    } else timer = window.setTimeout(() => { if (!cancelled) work() }, 60)
  }
  const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) start()
  }, { rootMargin: margin })
  if (observer) observer.observe(el)
  else start()
  return () => {
    cancelled = true
    observer?.disconnect()
    if (idle) window.cancelIdleCallback(idle)
    window.clearTimeout(timer)
  }
}

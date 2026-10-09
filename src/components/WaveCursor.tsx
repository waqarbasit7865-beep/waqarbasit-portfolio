/**
 * Blue technology-wave cursor (fine pointer + hover devices only).
 *  • A small centre dot and a thin orbital ring, both drawn exactly at the pointer (never lagging).
 *  • 2–3 fine curved trails, echoing the hero's flowing waves, follow a little behind while the pointer moves and
 *    fade out when it stops. Removed entirely for reduced motion.
 *  • Links / buttons: the ring expands a little. Project thumbnails: a small "View" label.
 *  • Never intercepts input: the layer is pointer-events: none. Text fields, selects, editable text and resizable
 *    elements keep the native cursor; so do open dialogs (they sit in the browser's top layer).
 *  • The native cursor stays until the custom one has its first position. The animation loop runs only while trails
 *    are visible and stops while the tab is hidden.
 */
import { useEffect, useRef } from 'react'

const FINE = '(hover: hover) and (pointer: fine)'
const NATIVE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], iframe, [data-native-cursor]'
const INTERACTIVE = 'a[href], button:not(:disabled), [role="button"], [role="tab"], label[for], summary, [tabindex]:not([tabindex="-1"]):not(.mw-track)'
const VIEW = '[data-cursor="view"], .wg-cover'
const LIFE = 500 // ms a trail point lives

export function WaveCursor() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const mq = window.matchMedia(FINE)
    if (!mq.matches) return
    const el = root.current
    const cv = canvas.current
    if (!el || !cv) return
    const html = document.documentElement
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const ctx = cv.getContext('2d')!
    const pts: { x: number; y: number; t: number }[] = []
    let raf = 0
    let running = false
    let ready = false
    let dpr = 1

    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      cv.width = Math.round(window.innerWidth * dpr)
      cv.height = Math.round(window.innerHeight * dpr)
    }
    size()

    const draw = () => {
      raf = 0
      const now = performance.now()
      while (pts.length && now - pts[0].t > LIFE) pts.shift()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, cv.width, cv.height)
      if (pts.length > 2 && !document.hidden) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.shadowColor = 'rgba(80, 120, 255, 0.55)'
        ctx.shadowBlur = 5
        // three fine strands: offset either side of the path and gently undulating, like the hero waves
        const strands = [
          { off: 0, amp: 1.2, w: 1.3, a: 0.75 },
          { off: 4.2, amp: 2.2, w: 0.9, a: 0.45 },
          { off: -4.2, amp: 2.2, w: 0.9, a: 0.4 },
        ]
        for (const s of strands) {
          const path: [number, number, number][] = []
          for (let i = 0; i < pts.length; i++) {
            const p = pts[i]
            const q = pts[Math.min(pts.length - 1, i + 1)]
            const r = pts[Math.max(0, i - 1)]
            let nx = -(q.y - r.y)
            let ny = q.x - r.x
            const l = Math.hypot(nx, ny) || 1
            nx /= l
            ny /= l
            const age = (now - p.t) / LIFE // 0 new → 1 old
            const wave = Math.sin(i * 0.55 + now * 0.006) * s.amp
            const spread = (s.off + wave) * (0.35 + age * 0.9) // strands open up behind the pointer
            path.push([p.x + nx * spread, p.y + ny * spread, age])
          }
          for (let i = 1; i < path.length - 1; i++) {
            const [x0, y0] = path[i - 1]
            const [x1, y1, age] = path[i]
            const [x2, y2] = path[i + 1]
            ctx.beginPath()
            ctx.moveTo((x0 + x1) / 2, (y0 + y1) / 2)
            ctx.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2)
            const fade = (1 - age) * (1 - age)
            ctx.strokeStyle = `rgba(125, 155, 255, ${(s.a * fade).toFixed(3)})`
            ctx.lineWidth = s.w * (0.5 + (1 - age) * 0.7)
            ctx.stroke()
          }
        }
      }
      if (pts.length > 1 && !document.hidden) raf = requestAnimationFrame(draw)
      else {
        running = false
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, cv.width, cv.height)
      }
    }
    const kick = () => {
      if (running || reduce.matches || document.hidden) return
      running = true
      raf = requestAnimationFrame(draw)
    }

    let lastTarget: Element | null = null
    const classify = (target: Element | null, x: number, y: number) => {
      const card = target?.closest('.mw-card')
      if (target === lastTarget && !card) return
      if (target !== lastTarget) {
        const native = !!target?.closest(NATIVE) || (target instanceof HTMLElement && getComputedStyle(target).resize !== 'none')
        el.classList.toggle('is-native', native)
        html.classList.toggle('wc-native', native)
      }
      lastTarget = target
      let view = !!target?.closest(VIEW)
      // gallery cards: the whole card is one link; show "View" while over its thumbnail
      if (!view && card) {
        const r = card.querySelector('.mw-thumb')?.getBoundingClientRect()
        view = !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
      }
      el.classList.toggle('is-view', view)
      el.classList.toggle('is-link', !view && !!target?.closest(INTERACTIVE))
    }

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      const x = e.clientX
      const y = e.clientY
      el.style.setProperty('--x', `${x}px`)
      el.style.setProperty('--y', `${y}px`)
      classify(e.target as Element, x, y)
      if (!ready) {
        ready = true
        el.classList.add('is-ready')
        html.classList.add('wc-on')
      }
      el.classList.remove('is-out')
      if (!reduce.matches) {
        const t = performance.now()
        const last = pts[pts.length - 1]
        if (!last || Math.hypot(last.x - x, last.y - y) > 1.5) pts.push({ x, y, t })
        if (pts.length > 40) pts.shift()
        kick()
      }
    }
    const down = () => el.classList.add('is-down')
    const up = () => el.classList.remove('is-down')
    const leave = (e: MouseEvent) => {
      if (!e.relatedTarget) el.classList.add('is-out')
    }
    const vis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
        running = false
        pts.length = 0
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, cv.width, cv.height)
      }
    }
    const resize = () => size()

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    document.addEventListener('mouseout', leave)
    document.addEventListener('visibilitychange', vis)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.removeEventListener('mouseout', leave)
      document.removeEventListener('visibilitychange', vis)
      window.removeEventListener('resize', resize)
      html.classList.remove('wc-on', 'wc-native')
    }
  }, [])

  return (
    <div ref={root} className="wc" aria-hidden="true">
      <canvas ref={canvas} className="wc__trails" />
      <span className="wc__ring" />
      <span className="wc__dot" />
      <span className="wc__label">View</span>
    </div>
  )
}

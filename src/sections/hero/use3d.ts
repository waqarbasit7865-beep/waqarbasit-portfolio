/**
 * Hero ↔ 3D bridge (no three.js import here: the 3D module is loaded on demand).
 *  • pinned desktop: one stage host behind the copy; the world follows the scroll timeline time.
 *  • stacked layout (mobile, short screens, reduced motion): every scene has a slot. Each slot first gets a
 *    still render of its composition; with motion allowed, the single live canvas moves into the slot that
 *    is most in view and plays that composition's entry.
 */
import { useEffect, type RefObject } from 'react'
import { disable3D, isLowPower, load3D, mode3D } from '../../three/support'

type Region = { x: number; y: number; w: number; h: number }

/** layout position (ignores transforms) of el inside root */
function layoutRect(el: HTMLElement, root: HTMLElement) {
  let x = 0
  let y = 0
  let n: HTMLElement | null = el
  while (n && n !== root) {
    x += n.offsetLeft
    y += n.offsetTop
    n = n.offsetParent as HTMLElement | null
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}
/** width of the text inside a block element (blocks are often wider than their text) */
function textWidth(el: HTMLElement) {
  const r = document.createRange()
  r.selectNodeContents(el)
  const b = r.getBoundingClientRect()
  const scale = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1
  return Math.min(el.offsetWidth, b.width / scale)
}

/** Free space beside each scene's copy, in stage pixels. */
export function measureFree(stage: HTMLElement) {
  const ul = stage.querySelector<SVGElement>('.scene--intro .hx-underline')
  let underline: { x: number; y: number } | null = null
  if (ul) {
    const r = ul.getBoundingClientRect()
    const s = stage.getBoundingClientRect()
    if (r.width) underline = { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 }
  }
  return { regions: measureRegions(stage), underline }
}

function measureRegions(stage: HTMLElement): (Region | null)[] {
  const W = stage.clientWidth
  const H = stage.clientHeight
  const header = 84
  const bottom = 92
  const hud = 132 // right-hand scene navigation
  return Array.from(stage.querySelectorAll<HTMLElement>('.scene')).map((scene) => {
    const parts = scene.querySelectorAll<HTMLElement>('.hx-line, .hx-label, .hx-eyebrow, .hx-sub, .hx-actions .btn, .hx-profiles li, .hx-tags li, .hx-cta, .hx-cue')
    let l = Infinity
    let r = -Infinity
    parts.forEach((p) => {
      if (!p.offsetParent) return
      const rect = layoutRect(p, stage)
      const w = p.matches('.hx-label, .hx-eyebrow, .hx-sub, .hx-cue') ? textWidth(p) : rect.w
      l = Math.min(l, rect.x)
      r = Math.max(r, rect.x + w)
    })
    if (!isFinite(l)) return null
    const gap = Math.max(32, W * 0.03)
    const top = header
    const h = H - header - bottom
    const onLeft = (l + r) / 2 < W / 2
    const region = onLeft ? { x: r + gap, y: top, w: W - hud - (r + gap), h } : { x: 28, y: top, w: l - gap - 28, h }
    if (region.w < 280) return { x: W * 0.5, y: top, w: W * 0.5 - hud, h }
    return region
  })
}

export function useHero3D(root: RefObject<HTMLElement | null>, pinned: boolean, time: { T: number }) {
  useEffect(() => {
    const el = root.current
    const mode = mode3D()
    if (!el || mode === 'off') return
    let cancelled = false
    const cleanups: (() => void)[] = []

    load3D()
      .then((m) => {
        if (cancelled) return
        const stage = m.stage()
        stage.onLost = () => disable3D()

        if (pinned && mode === 'live') {
          const host = el.querySelector<HTMLElement>('.hx3d')
          const stageEl = el.querySelector<HTMLElement>('.hero__stage')
          if (!host || !stageEl) return
          const world = m.createHero({ measure: () => measureFree(stageEl), time: () => time.T })
          const off = stage.register({ el: host, view: world, priority: 2 })
          const relayout = () => world.layout()
          document.fonts?.ready.then(() => !cancelled && relayout())
          // the headline settles after its load animation; re-measure once it has
          const late = window.setTimeout(relayout, 2600)
          cleanups.push(() => window.clearTimeout(late))
          window.addEventListener('resize', relayout)
          requestAnimationFrame(() => host.classList.add('is-ready'))
          cleanups.push(() => {
            off()
            window.removeEventListener('resize', relayout)
            host.classList.remove('is-ready')
            world.dispose()
          })
          return
        }

        /* stacked layout: one slot per scene */
        const slots = Array.from(el.querySelectorAll<HTMLElement>('.hx3d-slot'))
        const snap = () =>
          slots.forEach((slot) => {
            const i = Number(slot.dataset.slot)
            const img = slot.querySelector<HTMLImageElement>('.hx3d-still')
            const w = slot.clientWidth
            const h = slot.clientHeight
            if (!img || !w || !h) return
            const still = m.createHero({ solo: i, still: true })
            img.src = stage.snapshot(still, w, h)
            img.alt = ''
            slot.classList.add('is-ready')
            still.dispose()
          })
        // logos and fonts must be ready before a still image is taken
        Promise.all([m.preloadLogos(), document.fonts?.ready]).then(() => !cancelled && snap())

        if (mode === 'live') {
          slots.forEach((slot) => {
            const i = Number(slot.dataset.slot)
            const world = m.createHero({ solo: i })
            if (isLowPower()) world.setQuality('low')
            const off = stage.register({ el: slot, view: world, onActive: (on) => slot.classList.toggle('is-live', on) })
            cleanups.push(() => {
              off()
              world.dispose()
            })
          })
        }
      })
      .catch(() => disable3D())

    return () => {
      cancelled = true
      cleanups.forEach((f) => f())
    }
  }, [root, pinned, time])
}

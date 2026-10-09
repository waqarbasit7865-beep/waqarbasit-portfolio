/**
 * Design Approach ↔ process sculpture (three.js is loaded on demand).
 *  • desktop with motion: one live view in the sticky panel; its state follows the active step (reversible).
 *  • stacked steps (mobile / reduced motion): each step shows a still render of its state; with motion
 *    allowed, the single live canvas joins the step most in view and plays that step's focal moment.
 */
import { useEffect, type RefObject } from 'react'
import { gsap } from '../../lib/gsap'
import { disable3D, load3D, mode3D } from '../../three/support'

export interface SculptHandle {
  s: number
  setTarget(t: number): void
}

/** animate the sculpture to a step; long jumps take a little longer but stay brisk */
export function goSculpt(sc: SculptHandle | null, t: number, instant = false) {
  if (!sc) return
  sc.setTarget(t)
  if (instant) {
    gsap.killTweensOf(sc)
    sc.s = t
    return
  }
  gsap.to(sc, { s: t, duration: 0.95 + 0.22 * Math.min(3, Math.abs(t - sc.s)), ease: 'power2.inOut', overwrite: true })
}

export function useApproach3D(root: RefObject<HTMLElement | null>, live: boolean, handle: { current: SculptHandle | null }, active: { current: number }) {
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
        if (live && mode === 'live') {
          const host = el.querySelector<HTMLElement>('.ap3d')
          if (!host) return
          const sc = m.createSculpture()
          handle.current = sc
          goSculpt(sc, active.current, true)
          const off = stage.register({ el: host, view: sc, priority: 1 })
          requestAnimationFrame(() => host.classList.add('is-ready'))
          cleanups.push(() => {
            off()
            handle.current = null
            gsap.killTweensOf(sc)
            host.classList.remove('is-ready')
            sc.dispose()
          })
          return
        }
        /* stacked steps: still renders, plus the live canvas on the step in view */
        const hosts = Array.from(el.querySelectorAll<HTMLElement>('.ap3d-step'))
        const snap = () => {
          const still = m.createSculpture(true)
          hosts.forEach((h) => {
            const i = Number(h.dataset.step)
            const img = h.querySelector('img')
            if (!img || !h.clientWidth) return
            still.s = i
            still.setTarget(i)
            img.src = stage.snapshot(still, h.clientWidth, h.clientHeight)
            h.classList.add('is-ready')
          })
          still.dispose()
        }
        if (document.fonts) document.fonts.ready.then(() => !cancelled && snap())
        else snap()
        if (mode === 'live') {
          const sc = m.createSculpture()
          hosts.forEach((h) => {
            const i = Number(h.dataset.step)
            const off = stage.register({
              el: h,
              view: sc,
              onActive: (on) => {
                h.classList.toggle('is-live', on)
                if (on) {
                  // arrive from the previous step so the transformation and focal moment play here too
                  gsap.killTweensOf(sc)
                  sc.s = Math.max(-1, i - 1)
                  goSculpt(sc, i)
                }
              },
            })
            cleanups.push(off)
          })
          cleanups.push(() => {
            gsap.killTweensOf(sc)
            sc.dispose()
          })
        }
      })
      .catch(() => disable3D())
    return () => {
      cancelled = true
      cleanups.forEach((f) => f())
    }
  }, [root, live, handle, active])
}

/**
 * Design Approach ↔ 3D process stage (three.js is loaded on demand).
 *  • motion allowed: one live view in the stage; the page calls setStep() when the active step changes;
 *  • reduced motion: each step's model is rendered once as a still image and swapped with the step;
 *  • no WebGL: the illustrated 2D canvas stays (CSS shows it under html.no-3d).
 */
import { useEffect, useState, type RefObject } from 'react'
import { disable3D, load3D, mode3D, type Mode3D } from '../../three/support'

export interface ProcessHandle {
  setStep(i: number): void
}

export function useProcess3D(root: RefObject<HTMLElement | null>, handle: { current: ProcessHandle | null }, active: { current: number }): Mode3D {
  const [mode] = useState<Mode3D>(() => (typeof window === 'undefined' ? 'off' : mode3D()))
  useEffect(() => {
    const el = root.current
    if (!el || mode === 'off') return
    const host = el.querySelector<HTMLElement>('.ap3d')
    const img = el.querySelector<HTMLImageElement>('.ap3d__still')
    if (!host) return
    let cancelled = false
    const cleanups: (() => void)[] = []
    load3D()
      .then(async (m) => {
        if (cancelled) return
        const stage = m.stage()
        if (mode === 'live') {
          const v = m.createProcess(false, active.current)
          handle.current = v
          const off = stage.register({ el: host, view: v, priority: 1, onActive: (on) => on && v.replay() })
          requestAnimationFrame(() => host.classList.add('is-ready'))
          cleanups.push(() => {
            off()
            handle.current = null
            v.dispose()
          })
          return
        }
        // still images for reduced motion
        await m.logosReady()
        await document.fonts?.ready
        if (cancelled || !img) return
        const shots: string[] = []
        const w = host.clientWidth || 800
        const h = host.clientHeight || 560
        for (let i = 0; i < 5; i++) {
          const v = m.createProcess(true, i)
          shots.push(stage.snapshot(v, w, h))
          v.dispose()
        }
        const show = (i: number) => {
          img.src = shots[i]
        }
        show(active.current)
        handle.current = { setStep: show }
        host.classList.add('is-ready', 'is-still')
        cleanups.push(() => (handle.current = null))
      })
      .catch(() => disable3D())
    return () => {
      cancelled = true
      cleanups.forEach((f) => f())
    }
  }, [root, handle, active, mode])
  return mode
}

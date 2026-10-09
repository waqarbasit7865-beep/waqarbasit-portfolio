/**
 * One WebGL renderer for the whole site.
 *
 * Sections register "hosts" (DOM elements that want a 3D view). The single <canvas> is moved into
 * whichever registered host is most visible, so there is never more than one live WebGL canvas.
 * Rendering runs only while an active host is on screen and the tab is visible, and it stops
 * entirely in 'still' mode, where scenes are rendered once into images instead.
 */
import * as THREE from 'three'
import { environment, type Quality } from './kit'

export interface View3D {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  /** host size in CSS px */
  resize(w: number, h: number): void
  /** dt and elapsed in seconds */
  update(dt: number, elapsed: number): void
  setQuality?(q: Quality): void
  /** called when this view becomes / stops being the rendered one */
  activate?(on: boolean): void
}

export interface Host {
  el: HTMLElement
  view: View3D
  /** larger wins when two hosts are equally visible */
  priority?: number
  /** called when the canvas is placed into / removed from this host */
  onActive?(on: boolean): void
  /** internal */
  ratio?: number
}

class Stage {
  renderer: THREE.WebGLRenderer
  canvas: HTMLCanvasElement
  quality: Quality
  private hosts = new Set<Host>()
  private active: Host | null = null
  private io: IntersectionObserver
  private raf = 0
  private last = 0
  private elapsed = 0
  private size = { w: 0, h: 0, dpr: 0 }
  private slow = 0
  private maxDpr: number
  lost = false
  onLost: (() => void) | null = null

  constructor(lowPower: boolean) {
    this.quality = lowPower ? 'low' : 'high'
    this.maxDpr = lowPower ? 1.5 : 2
    this.renderer = new THREE.WebGLRenderer({ antialias: !lowPower || window.devicePixelRatio < 2, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.canvas = this.renderer.domElement
    this.canvas.className = 'stage3d'
    this.canvas.setAttribute('aria-hidden', 'true')
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.lost = true
      this.stop()
      this.onLost?.()
    })
    environment(this.renderer)
    this.io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const h = [...this.hosts].find((x) => x.el === e.target)
        if (h) h.ratio = e.isIntersecting ? Math.max(e.intersectionRatio, 0.0001) : 0
      }
      this.pick()
    }, { threshold: [0, 0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 1] })
    document.addEventListener('visibilitychange', () => (document.hidden ? this.stop() : this.start()))
    // Pinned / sticky hosts can move without IntersectionObserver noticing (scroll jumps past a pin),
    // so visibility is also re-measured on scroll, at most once per frame.
    let pending = 0
    const remeasure = () => {
      if (pending) return
      pending = requestAnimationFrame(() => {
        pending = 0
        this.measure()
      })
    }
    window.addEventListener('scroll', remeasure, { passive: true })
    window.addEventListener('resize', remeasure)
  }

  private measure() {
    const vh = window.innerHeight
    const vw = window.innerWidth
    for (const h of this.hosts) {
      const r = h.el.getBoundingClientRect()
      if (!r.width || !r.height) {
        h.ratio = 0
        continue
      }
      const visH = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0))
      const visW = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0))
      h.ratio = visH > 0 && visW > 0 ? Math.max((visH * visW) / (r.width * r.height), 0.0001) : 0
    }
    this.pick()
  }

  get envMap() {
    return environment(this.renderer)
  }

  register(host: Host) {
    host.ratio = 0
    this.hosts.add(host)
    host.view.setQuality?.(this.quality)
    this.io.observe(host.el)
    return () => {
      this.io.unobserve(host.el)
      this.hosts.delete(host)
      if (this.active === host) {
        this.setActive(null)
        this.pick()
      }
    }
  }

  private pick() {
    let best: Host | null = null
    let score = 0
    for (const h of this.hosts) {
      const s = (h.ratio ?? 0) * (h.priority ?? 1)
      if (s > score) {
        score = s
        best = h
      }
    }
    if (best !== this.active) this.setActive(best)
  }

  private setActive(h: Host | null) {
    const prev = this.active
    if (prev) {
      prev.view.activate?.(false)
      prev.onActive?.(false)
    }
    this.active = h
    if (h) {
      h.el.appendChild(this.canvas)
      this.size.w = 0 // force resize
      h.view.activate?.(true)
      h.onActive?.(true)
      this.start()
    } else {
      this.canvas.remove()
      this.stop()
    }
  }

  private start() {
    if (this.raf || !this.active || document.hidden || this.lost) return
    this.last = performance.now()
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      this.elapsed += dt
      this.frame(dt)
      this.watch(dt)
    }
    this.raf = requestAnimationFrame(loop)
  }
  private stop() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private frame(dt: number) {
    const h = this.active
    if (!h) return
    const w = h.el.clientWidth
    const ht = h.el.clientHeight
    if (!w || !ht) return
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr)
    if (w !== this.size.w || ht !== this.size.h || dpr !== this.size.dpr) {
      this.size = { w, h: ht, dpr }
      this.renderer.setPixelRatio(dpr)
      this.renderer.setSize(w, ht, false)
      h.view.resize(w, ht)
    }
    h.view.update(dt, this.elapsed)
    this.renderer.render(h.view.scene, h.view.camera)
  }

  /** Adaptive quality: sustained slow frames lower the pixel ratio, then switch to simplified materials. */
  private watch(dt: number) {
    if (dt > 0.034) this.slow++
    else this.slow = Math.max(0, this.slow - 0.5)
    if (this.slow < 90) return
    this.slow = 0
    if (this.maxDpr > 1) {
      this.maxDpr = Math.max(1, this.maxDpr - 0.5)
    } else if (this.quality === 'high') {
      this.quality = 'low'
      this.hosts.forEach((h) => h.view.setQuality?.('low'))
    }
  }

  /** Render a view once into an image (used for still mode and the inactive mobile slots). */
  snapshot(view: View3D, w: number, h: number, type = 'image/webp'): string {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    view.resize(w, h)
    view.update(0, this.elapsed)
    this.renderer.render(view.scene, view.camera)
    const url = this.canvas.toDataURL(type, 0.9)
    this.size.w = 0 // the active host re-applies its own size on the next frame
    if (this.active) this.frame(0)
    return url
  }
}

let stage: Stage | null = null
export function getStage(lowPower: boolean) {
  if (!stage) stage = new Stage(lowPower)
  return stage
}
export type { Stage }

/**
 * The hero's 3D world: five art-directed compositions sharing one scene, one camera and one renderer.
 *  • 'stage' mode (pinned desktop): the global timeline time T (from the GSAP scroll timeline) drives every
 *    composition, so the choreography scrubs forward and backward with the page. Each composition is
 *    placed in the free space beside its headline, measured from the DOM.
 *  • 'solo' mode (mobile, reduced motion snapshots): one composition, centred in its own slot, plays its
 *    entry once and settles.
 */
import * as THREE from 'three'
import type { View3D } from '../engine'
import { damp, disposeTree, type Quality } from '../kit'
import { WIN, type Comp, type Ctx } from './common'
import { IntroComp, Waves } from './intro'
import { FlowComp } from './flow'
import { CraftComp } from './craft'
import { AiComp } from './ai'
import { DeliveryComp } from './delivery'

export interface Region {
  x: number
  y: number
  w: number
  h: number
}

export interface HeroOptions {
  quality: Quality
  env: THREE.Texture
  solo?: number | null
  still?: boolean
  /** free space (host px) for each scene; stage mode only */
  measure?: () => (Region | null)[]
  /** current scroll-timeline time; stage mode only */
  time?: () => number
}

export class HeroWorld implements View3D {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80)
  comps: (Comp | null)[]
  waves: Waves
  /** written by the scroll timeline */
  T = 0
  private introT: number = WIN[0].in[0]
  private soloT = 0
  private solo: number | null
  private still: boolean
  private size = { w: 1, h: 1 }
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  private measure?: () => (Region | null)[]
  private handoff: Record<string, THREE.Vector3> = {}
  private active = false
  private quality: Quality
  private time?: () => number

  constructor(o: HeroOptions) {
    this.solo = o.solo ?? null
    this.still = !!o.still
    this.measure = o.measure
    this.time = o.time
    this.quality = o.quality
    this.scene.environment = o.env
    this.camera.position.set(0, 0, 11)

    const hemi = new THREE.HemisphereLight('#c7d2ff', '#0b0c10', 0.75)
    const key = new THREE.DirectionalLight('#ffffff', 2.1)
    key.position.set(3, 5, 6)
    const rim = new THREE.DirectionalLight('#5b7cff', 1.6)
    rim.position.set(-5, 1.5, -4)
    const fill = new THREE.PointLight('#8e7cff', 6, 14, 2)
    fill.position.set(2, -2, 3)
    this.scene.add(hemi, key, rim, fill)

    const all = [IntroComp, FlowComp, CraftComp, AiComp, DeliveryComp]
    this.comps = all.map((C, i) => {
      if (this.solo !== null && this.solo !== i) return null
      const c = new C(o.quality)
      this.scene.add(c.group)
      return c
    })
    this.waves = new Waves(o.quality)
    if (this.solo === null || this.solo === 0) this.scene.add(this.waves.group)
    if (this.solo !== null) this.soloT = this.still ? WIN[this.solo].settle : WIN[this.solo].in[0]
    if (this.still) this.introT = 0
  }

  setQuality(q: Quality) {
    if (q === this.quality) return
    this.quality = q
    this.comps.forEach((c) => c?.setQuality(q))
  }

  /** replay the entry of a solo composition (mobile: when its slot becomes the active one) */
  replay() {
    if (this.solo !== null && !this.still) this.soloT = WIN[this.solo].in[0]
    if (this.solo === 0 || this.solo === null) this.introT = this.still ? 0 : this.introT
  }

  private onPointer = (e: PointerEvent) => {
    this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
    this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1
  }
  activate(on: boolean) {
    this.active = on
    const fine = window.matchMedia('(pointer: fine)').matches
    if (on && fine && this.solo === null) window.addEventListener('pointermove', this.onPointer, { passive: true })
    else window.removeEventListener('pointermove', this.onPointer)
    if (on && this.solo !== null) this.replay()
  }
  private lastWall = 0

  resize(w: number, h: number) {
    this.size = { w, h }
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.layout()
  }

  /** place each composition in the free space measured from the page */
  layout() {
    const { w, h } = this.size
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z
    const wpp = visH / h
    const regions = this.solo !== null || !this.measure ? null : this.measure()
    this.comps.forEach((c, i) => {
      if (!c) return
      const r: Region = regions?.[i] ?? { x: w * 0.06, y: h * 0.06, w: w * 0.88, h: h * 0.88 }
      const cx = (r.x + r.w / 2 - w / 2) * wpp
      const cy = -(r.y + r.h / 2 - h / 2) * wpp
      const s = Math.min((r.w * wpp) / c.box.w, (r.h * wpp) / c.box.h)
      c.group.position.set(cx, cy, 0)
      c.group.scale.setScalar(Math.max(0.28, Math.min(s, 1.3)))
    })
    this.waves.fit(visH * (w / h) * 1.35, -visH * 0.12)
  }

  update(dt: number, elapsed: number) {
    let T: number
    // advance entry animations on wall-clock time so slow devices don't play them in slow motion
    const now = performance.now()
    const wall = this.lastWall ? Math.min(0.25, (now - this.lastWall) / 1000) : dt
    this.lastWall = now
    if (this.solo !== null) {
      if (!this.still && this.active) this.soloT = Math.min(WIN[this.solo].settle, this.soloT + wall * 0.9)
      T = this.soloT
    } else {
      if (!this.still && this.active) this.introT = Math.min(0, this.introT + wall)
      if (this.time) this.T = this.time()
      T = this.T > 0.0005 ? this.T : this.introT
    }
    const p = this.pointer
    p.x = damp(p.x, p.tx, 3, dt)
    p.y = damp(p.y, p.ty, 3, dt)
    const ctx: Ctx = {
      T,
      clock: elapsed,
      dt,
      camera: this.camera,
      pointer: this.still ? { x: 0, y: 0 } : { x: p.x, y: p.y },
      quality: this.quality,
      still: this.still,
      handoff: this.handoff,
    }
    // later scenes first, so earlier ones can hand objects to them
    for (let i = this.comps.length - 1; i >= 0; i--) {
      const c = this.comps[i]
      if (!c) continue
      c.update(ctx)
      if (c.exports) Object.assign(this.handoff, c.exports())
    }
    this.waves.update(T, elapsed, this.still)
  }

  dispose() {
    window.removeEventListener('pointermove', this.onPointer)
    this.comps.forEach((c) => c?.dispose())
    this.waves.dispose()
    disposeTree(this.scene)
  }
}

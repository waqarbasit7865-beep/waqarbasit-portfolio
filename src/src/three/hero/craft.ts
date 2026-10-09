/**
 * 03 · Visual craft — "Precision in every screen. Character in every detail."
 * A component workbench. Choreography: ASSEMBLY, then DETAIL.
 *  • guides draw on a 12-column board, then the components arrive from an exploded state and lock onto it:
 *    type specimen, colour tokens, a button, a toggle, an input, a card and a chart (scroll-driven);
 *  • once settled: a spacing redline reads 18 px, the chart snaps to 24 px; the button goes default → hover →
 *    pressed → default and the toggle switches on (plays on arrival, then holds).
 * Crisp painted faces on modelled bodies; colours are exact (unlit). Illustrative elements — not client work.
 */
import * as THREE from 'three'
import { COL, SERIF, MONO, lerp, outBack, outCubic, inCubic, inOutCubic, plane, roundedBox, satin, seg, setOpacity, sphere, type Quality } from '../kit'
import { Surface, UI, rrect, text, type Ctx2D } from '../ui'
import { crispLabel } from './tools'
import { WIN, type Comp, type Ctx } from './common'

interface Part {
  obj: THREE.Object3D
  home: THREE.Vector3
  from: THREE.Vector3
  rot: THREE.Euler
  delay: number
}

const body = (c = '#151b2c') => satin(c, { metalness: 0.4, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.9 })

/** modelled body + crisp unlit face */
function piece(w: number, h: number, d: number, r: number, painter: (x: Ctx2D, w: number, h: number) => void, bodyCol?: string, density = 520) {
  const g = new THREE.Group()
  const b = new THREE.Mesh(roundedBox(w, h, d, r, 4), body(bodyCol))
  const surf = new Surface(Math.round(w * density), Math.round(h * density), painter)
  const face = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: surf.tex, transparent: true, toneMapped: false, depthWrite: false }))
  face.scale.set(w * 0.985, h * 0.985, 1)
  face.position.z = d / 2 + 0.002
  g.add(b, face)
  return { g, surf, face }
}

const SWATCHES = [
  { c: '#0D0E10', n: 'Ink' },
  { c: '#F4F4F1', n: 'Paper' },
  { c: '#2F5BFF', n: 'Electric' },
  { c: '#A7BEFF', n: 'Tint' },
]
type BtnState = 'Default' | 'Hover' | 'Pressed'

export class CraftComp implements Comp {
  group = new THREE.Group()
  box = { w: 5.0, h: 4.0 }
  private rig = new THREE.Group()
  private plate: THREE.Group
  private guides: THREE.Mesh[] = []
  private parts: Part[] = []
  private knob: THREE.Mesh
  private track: Surface
  private button: { g: THREE.Group; surf: Surface }
  private btnCaption: Surface
  private btnState: BtnState | '' = ''
  private toggleOn = -1
  private chart: THREE.Group
  private redline: THREE.Group
  private red18: THREE.Mesh
  private red24: THREE.Mesh
  private redBar: THREE.Mesh[] = []
  private snapGuides: THREE.Mesh[] = []
  private arrivedAt = -1

  constructor(_q: Quality) {
    this.group.add(this.rig)

    /* board: dark navy glass with a painted 12-column grid */
    const pl = piece(4.1, 3.0, 0.08, 0.1, (x, w, h) => {
      const H = (h / w) * 1000
      rrect(x, 0, 0, 1000, H, 24, '#0c1120')
      x.strokeStyle = '#1d284a'
      x.lineWidth = 1.5 * x.u
      for (let i = 0; i <= 12; i++) {
        const X = 37 + (i * 926) / 12
        x.beginPath()
        x.moveTo(X * x.u, 30 * x.u)
        x.lineTo(X * x.u, (H - 30) * x.u)
        x.stroke()
      }
      x.fillStyle = '#26315a'
      for (let yy = 40; yy < H - 30; yy += 39) for (let xx = 37; xx < 965; xx += 77.2) x.fillRect(xx * x.u - 1, yy * x.u - 1, 2.5 * x.u, 2.5 * x.u)
      text(x, '12 COLUMNS · 8 PT GRID', 963, H - 22, 15, '#4d5b8c', 600, 'right', MONO)
    }, '#0b0f1b', 300)
    this.plate = pl.g
    this.rig.add(this.plate)
    for (const xx of [-1.9, 0.0, 1.9]) {
      const g = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ color: COL.blueSoft, transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false }))
      g.scale.set(0.01, 3.2, 1)
      g.position.set(xx, 0, 0.06)
      this.guides.push(g)
      this.rig.add(g)
    }

    const add = (obj: THREE.Object3D, x: number, y: number, z: number, delay: number, seed: number) => {
      const r = (k: number) => Math.sin(seed * 12.9898 + k * 78.233) * 0.5 + 0.5
      const home = new THREE.Vector3(x, y, z)
      const from = new THREE.Vector3(x + (r(1) - 0.5) * 4.2, y + (r(2) - 0.3) * 3.2, z + 1.6 + r(3) * 2.4)
      const rot = new THREE.Euler((r(4) - 0.5) * 1.4, (r(5) - 0.5) * 1.6, (r(6) - 0.5) * 1.0)
      obj.position.copy(home)
      this.rig.add(obj)
      this.parts.push({ obj, home, from, rot, delay })
    }

    /* type specimen */
    const type = piece(1.15, 1.15, 0.1, 0.07, (x, w, h) => {
      const H = (h / w) * 1000
      rrect(x, 0, 0, 1000, H, 40, '#161c30')
      x.font = `italic 400 ${520 * x.u}px ${SERIF}`
      x.fillStyle = '#F4F4F1'
      x.textAlign = 'left'
      x.textBaseline = 'alphabetic'
      x.fillText('Aa', 50 * x.u, 600 * x.u)
      text(x, 'Display · Instrument Serif', 64, 760, 52, UI.muted, 500)
      text(x, 'Text · Geist 400–600', 64, 840, 52, UI.muted, 500)
      text(x, '64 / 40 / 24 / 16', 64, 920, 46, '#5d6a99', 600, 'left', MONO)
    })
    add(type.g, -1.28, 0.62, 0.1, 0, 1)

    /* colour tokens: exact colours on unlit faces, names below */
    SWATCHES.forEach((s, i) => {
      const g = new THREE.Group()
      const b = new THREE.Mesh(roundedBox(0.36, 0.36, 0.14, 0.07, 4), body('#1a2034'))
      const f = new THREE.Mesh(roundedBox(0.3, 0.3, 0.01, 0.05, 3), new THREE.MeshBasicMaterial({ color: s.c, toneMapped: false }))
      f.position.z = 0.072
      const l = crispLabel(s.n, 0.075, '#AEB8D6', 560, false)
      l.position.set(0, -0.25, 0.04)
      g.add(b, f, l)
      add(g, -0.28 + i * 0.47, 0.98, 0.12, 0.06 + i * 0.03, 2 + i)
    })

    /* the button that demonstrates its states */
    const btn = piece(1.12, 0.32, 0.14, 0.15, () => undefined, '#1a2a6e', 600)
    this.button = { g: btn.g, surf: btn.surf }
    add(btn.g, -0.1, 0.36, 0.12, 0.16, 7)
    const cap = new THREE.Group()
    this.btnCaption = new Surface(512, 96, () => undefined)
    const capM = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: this.btnCaption.tex, transparent: true, toneMapped: false, depthWrite: false }))
    capM.scale.set(0.62, 0.116, 1)
    cap.add(capM)
    add(cap, -0.1, 0.12, 0.08, 0.2, 13)
    this.paintButton('Default')

    /* toggle */
    const toggle = new THREE.Group()
    this.track = new Surface(512, 256, () => undefined)
    const trackBody = new THREE.Mesh(roundedBox(0.62, 0.3, 0.1, 0.15, 5), body('#1a2034'))
    const trackFace = new THREE.Mesh(roundedBox(0.58, 0.26, 0.01, 0.13, 5), new THREE.MeshBasicMaterial({ map: this.track.tex, toneMapped: false }))
    trackFace.position.z = 0.052
    this.knob = new THREE.Mesh(sphere(0.105, 32), satin('#F4F4F1', { clearcoat: 1, roughness: 0.25 }))
    this.knob.position.z = 0.1
    toggle.add(trackBody, trackFace, this.knob)
    add(toggle, 1.1, 0.36, 0.12, 0.22, 8)
    this.setToggle(0)

    /* input */
    const input = piece(1.9, 0.3, 0.08, 0.08, (x, w, h) => {
      const H = (h / w) * 1000
      rrect(x, 0, 0, 1000, H, H / 2, '#141a2b', '#2f3a62', 3)
      x.beginPath()
      x.arc(50 * x.u, (H / 2) * x.u, 16 * x.u, 0, Math.PI * 2)
      x.strokeStyle = UI.muted
      x.lineWidth = 4 * x.u
      x.stroke()
      text(x, 'Search components…', 90, H / 2 + 2, 52, UI.muted, 500)
      text(x, '⌘K', 960, H / 2 + 2, 40, '#5d6a99', 600, 'right', MONO)
    })
    add(input.g, 0.48, -0.1, 0.1, 0.28, 9)

    /* card */
    const card = piece(1.8, 1.0, 0.12, 0.08, (x, w, h) => {
      const H = (h / w) * 1000
      rrect(x, 0, 0, 1000, H, 30, '#171d31')
      text(x, 'Project overview', 50, 90, 64, UI.text, 650)
      text(x, 'A consistent system.', 50, 185, 46, '#b9c2dc', 500)
      text(x, 'A clearer experience.', 50, 250, 46, '#b9c2dc', 500)
      rrect(x, 50, 330, 900, 14, 7, '#232b45')
      rrect(x, 50, 330, 640, 14, 7, UI.accent)
      x.beginPath()
      x.arc(66 * x.u, 440 * x.u, 12 * x.u, 0, Math.PI * 2)
      x.fillStyle = UI.green
      x.fill()
      text(x, 'Ready for review', 92, 442, 42, '#9fe8c7', 600)
      text(x, '72%', 950, 442, 42, UI.muted, 600, 'right')
    })
    add(card.g, -1.0, -0.8, 0.1, 0.34, 10)

    /* chart: painted axis and labels, modelled bars */
    this.chart = new THREE.Group()
    const ch = piece(1.25, 1.0, 0.08, 0.07, (x, w, h) => {
      const H = (h / w) * 1000
      rrect(x, 0, 0, 1000, H, 32, '#141a2b')
      text(x, 'Weekly activity', 50, 80, 56, UI.text, 650)
      x.strokeStyle = '#273154'
      x.lineWidth = 2 * x.u
      for (let i = 0; i < 4; i++) {
        const y = 230 + i * 150
        x.beginPath()
        x.moveTo(60 * x.u, y * x.u)
        x.lineTo(950 * x.u, y * x.u)
        x.stroke()
      }
      ;['M', 'T', 'W', 'T', 'F', 'S'].forEach((d, i) => text(x, d, 120 + i * 145, H - 50, 40, UI.muted, 500, 'center'))
    })
    this.chart.add(ch.g)
    const hs = [0.3, 0.46, 0.36, 0.6, 0.5, 0.68]
    const barMat = satin('#5b7cff', { emissive: new THREE.Color(COL.blue), emissiveIntensity: 0.35, clearcoat: 1, roughness: 0.25 })
    hs.forEach((h, i) => {
      const b = new THREE.Mesh(roundedBox(0.1, h, 0.1, 0.025, 3), i === 5 ? satin('#8ea6ff', { emissive: new THREE.Color('#3d63ff'), emissiveIntensity: 0.6, clearcoat: 1 }) : barMat)
      b.position.set(-0.475 + i * 0.181, -0.36 + h / 2, 0.07)
      this.chart.add(b)
    })
    add(this.chart, 0.825, -0.8, 0.1, 0.4, 11)

    /* spacing redline between the card and the chart (18 → 24) */
    this.redline = new THREE.Group()
    const redMat = new THREE.MeshBasicMaterial({ color: COL.red, toneMapped: false, transparent: true, depthWrite: false })
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(plane(), redMat)
      this.redBar.push(m)
      this.redline.add(m)
    }
    this.red18 = crispLabel('18', 0.11, '#ff8a8a', 650, true)
    this.red24 = crispLabel('24', 0.11, '#9fb3ff', 650, true)
    this.redline.add(this.red18, this.red24)
    this.redline.position.set(0, -0.62, 0.24)
    this.rig.add(this.redline)
    for (let i = 0; i < 2; i++) {
      const g = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ color: '#9fb3ff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }))
      g.scale.set(0.008, 1.3, 1)
      this.snapGuides.push(g)
      this.rig.add(g)
    }
  }

  private paintButton(s: BtnState) {
    if (s === this.btnState) return
    this.btnState = s
    const fill = s === 'Hover' ? '#4a70ff' : s === 'Pressed' ? '#2246d0' : '#2F5BFF'
    this.button.surf.paint((x, w, h) => {
      const H = (h / w) * 1000
      rrect(x, 0, 0, 1000, H, H / 2, fill, s === 'Hover' ? '#b7c6ff' : undefined, 6)
      text(x, 'Publish design  ↗', 500, H / 2 + 4, 104, '#ffffff', 650, 'center')
    })
    this.btnCaption.paint((x) => {
      rrect(x, 250, 8, 500, 172, 86, '#10152499', '#2f3a62', 3)
      text(x, s, 500, 96, 92, s === 'Default' ? UI.muted : '#cfd9ff', 600, 'center')
    })
  }
  private setToggle(on: number) {
    const v = Math.round(on * 10) / 10
    if (v === this.toggleOn) return
    this.toggleOn = v
    this.track.paint((x) => {
      const c = new THREE.Color('#2a3352').lerp(new THREE.Color('#2F5BFF'), v)
      rrect(x, 0, 0, 1000, 500, 250, '#' + c.getHexString())
    })
  }

  setQuality() {}

  update(c: Ctx) {
    const { T, clock } = c
    const a = seg(T, WIN[2].in[0], WIN[2].in[1])
    const o = seg(T, WIN[2].out[0], WIN[2].out[1])
    this.group.visible = T >= WIN[2].in[0] - 0.001 && T <= WIN[2].out[1] + 0.001
    if (!this.group.visible) return
    const idle = c.still ? 0 : clock

    this.rig.rotation.set(-0.2 - c.pointer.y * 0.05 + 0.14 * (1 - outCubic(a)), 0.34 + c.pointer.x * 0.08 + Math.sin(idle * 0.3) * 0.015, 0)
    this.rig.position.set(0, -0.4 * (1 - outCubic(seg(a, 0, 0.35))), -2.2 * inCubic(o))
    setOpacity(this.plate, outCubic(seg(a, 0, 0.3)) * (1 - o))
    this.guides.forEach((g, i) => {
      const k = outCubic(seg(a, 0.04 + i * 0.05, 0.3 + i * 0.05))
      g.scale.y = 3.2 * Math.max(k, 0.0001)
      ;(g.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - seg(a, 0.75, 1) * 0.75) * (1 - o)
      g.visible = k > 0.001 && o < 1
    })

    this.parts.forEach((p, i) => {
      const k = seg(a, 0.12 + p.delay, 0.5 + p.delay)
      const e = outBack(k, 1.25)
      const out = inCubic(seg(o, i * 0.03, 0.6 + i * 0.03))
      p.obj.position.lerpVectors(p.from, p.home, e)
      p.obj.position.y += out * 2.4
      p.obj.position.z += out * 1.6
      const r = 1 - outCubic(k) + out * 0.6
      p.obj.rotation.set(p.rot.x * r, p.rot.y * r, p.rot.z * r)
      p.obj.scale.setScalar(Math.max(lerp(0.6, 1, Math.min(1, k * 1.5)), 0.0001))
      p.obj.visible = Math.min(1, k * 3) * (1 - out) > 0.01
    })

    /* details: play once the workbench has settled */
    const settled = a >= 1 && o === 0
    const wall = performance.now() / 1000
    if (!settled) this.arrivedAt = -1
    else if (this.arrivedAt < 0) this.arrivedAt = wall
    const tau = c.still ? 99 : settled ? wall - this.arrivedAt : -1

    // spacing: the chart starts 18 px from the card, then snaps to 24 px
    const snap = tau < 0 ? 0 : outBack(seg(tau, 0.7, 1.1), 2.2)
    const chartX = lerp(0.745, 0.825, snap)
    if (a >= 0.9) this.chart.position.x = chartX
    const cardRight = -1.0 + 0.9
    const gapL = cardRight
    const gapR = chartX - 0.625
    const gap = gapR - gapL
    const show = tau >= 0 ? outCubic(seg(tau, 0, 0.4)) * (1 - o) : 0
    this.redline.visible = show > 0.01
    const [bar, c1, c2] = this.redBar
    bar.scale.set(Math.max(gap, 0.001), 0.012, 1)
    bar.position.set((gapL + gapR) / 2, 0, 0)
    c1.scale.set(0.012, 0.12, 1)
    c1.position.set(gapL, 0, 0)
    c2.scale.set(0.012, 0.12, 1)
    c2.position.set(gapR, 0, 0)
    ;(bar.material as THREE.MeshBasicMaterial).color.set(snap > 0.6 ? '#7D9BFF' : '#FF5A5A')
    ;(bar.material as THREE.MeshBasicMaterial).opacity = show
    this.red18.position.set((gapL + gapR) / 2, 0.13, 0)
    this.red24.position.copy(this.red18.position)
    ;(this.red18.material as THREE.MeshBasicMaterial).opacity = show * (1 - seg(snap, 0.3, 0.7))
    ;(this.red24.material as THREE.MeshBasicMaterial).opacity = show * seg(snap, 0.3, 0.7)
    this.snapGuides.forEach((g, i) => {
      g.position.set(i === 0 ? gapL : gapR, -0.8, 0.22)
      ;(g.material as THREE.MeshBasicMaterial).opacity = tau < 0 ? 0 : Math.sin(seg(tau, 0.6, 1.5) * Math.PI) * 0.9 * (1 - o)
    })

    // button: default → hover → pressed → default; toggle switches on
    let st: BtnState = 'Default'
    if (!c.still && tau >= 1.5 && tau < 2.4) st = 'Hover'
    if (!c.still && tau >= 2.4 && tau < 2.8) st = 'Pressed'
    this.paintButton(st)
    const press = st === 'Pressed' ? 1 : 0
    const lift = st === 'Hover' ? 1 : 0
    if (press) this.button.g.scale.z *= 0.55
    if (lift) this.button.g.position.z += 0.05
    const on = c.still ? 1 : tau < 0 ? 0 : inOutCubic(seg(tau, 3.0, 3.35))
    this.setToggle(on)
    this.knob.position.x = lerp(-0.155, 0.155, on)
  }

  dispose() {}
}

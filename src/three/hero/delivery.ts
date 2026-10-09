/**
 * 05 · Ready to build — "One system. Every screen."
 * Choreography: SYNCHRONISATION. A laptop assembles and opens, a tablet and a phone swing in on orbits,
 * and a design-system core connects to all three. Pulses leave the core together and every screen updates
 * in the same instant — one system, adapted to each breakpoint. Interface concept with sample content.
 */
import * as THREE from 'three'
import { COL, FONT, MONO, GlowPath, canvasTexture, label, lerp, outBack, outCubic, inOutCubic, plane, rr, roundedBox, satin, seg, haloSprite, type Quality } from '../kit'
import { WIN, type Comp, type Ctx } from './common'

type Layout = 'desktop' | 'tablet' | 'phone'
const ACC = ['#2F5BFF', '#8E7CFF']

function paintUI(x: CanvasRenderingContext2D, w: number, h: number, layout: Layout, v: number) {
  const acc = ACC[v]
  const u = w / (layout === 'desktop' ? 1024 : layout === 'tablet' ? 600 : 400)
  x.fillStyle = '#0f1320'
  x.fillRect(0, 0, w, h)
  const pad = 26 * u
  // top bar
  x.fillStyle = '#161b2b'
  x.fillRect(0, 0, w, 56 * u)
  x.fillStyle = acc
  rr(x, pad, 18 * u, 20 * u, 20 * u, 6 * u)
  x.fill()
  x.fillStyle = '#e9edf8'
  x.font = `600 ${17 * u}px ${FONT}`
  x.textBaseline = 'middle'
  x.fillText('Workspace', pad + 30 * u, 28 * u)
  let left = pad
  let top = 80 * u
  if (layout === 'desktop') {
    // sidebar
    x.fillStyle = '#131828'
    x.fillRect(0, 56 * u, 190 * u, h)
    ;['Overview', 'Projects', 'Team', 'Reports', 'Settings'].forEach((t, i) => {
      if (i === 0) {
        x.fillStyle = acc + '33'
        rr(x, 14 * u, 76 * u, 162 * u, 34 * u, 8 * u)
        x.fill()
      }
      x.fillStyle = i === 0 ? '#ffffff' : '#8c95ad'
      x.font = `500 ${14 * u}px ${FONT}`
      x.fillText(t, 30 * u, 93 * u + i * 42 * u)
    })
    left = 214 * u
  }
  const cw = w - left - pad
  x.fillStyle = '#ffffff'
  x.font = `600 ${(layout === 'phone' ? 26 : 24) * u}px ${FONT}`
  x.fillText(layout === 'phone' ? 'Your day,' : 'Make room for clarity.', left, top + 6 * u)
  if (layout === 'phone') x.fillText('in focus.', left, top + 38 * u)
  top += layout === 'phone' ? 70 * u : 44 * u
  // stat cards
  const cols = layout === 'desktop' ? 3 : layout === 'tablet' ? 2 : 1
  const gap = 14 * u
  const cardW = (cw - gap * (cols - 1)) / cols
  const cardH = 84 * u
  const stats = [
    ['Active projects', '12'],
    ['In review', '4'],
    ['Ready to build', '7'],
  ]
  for (let i = 0; i < (layout === 'phone' ? 2 : cols); i++) {
    const cx = left + (layout === 'phone' ? 0 : i * (cardW + gap))
    const cy = top + (layout === 'phone' ? i * (cardH + gap) : 0)
    const hi = v === 1 && i === 1
    x.fillStyle = hi ? acc : '#182036'
    rr(x, cx, cy, cardW, cardH, 12 * u)
    x.fill()
    x.fillStyle = hi ? '#ffffff' : '#8f9ab6'
    x.font = `500 ${12.5 * u}px ${FONT}`
    x.fillText(stats[i][0], cx + 16 * u, cy + 24 * u)
    x.fillStyle = '#ffffff'
    x.font = `600 ${28 * u}px ${FONT}`
    x.fillText(stats[i][1], cx + 16 * u, cy + 58 * u)
  }
  top += (layout === 'phone' ? 2 : 1) * (cardH + gap) + 6 * u
  // chart
  const chH = Math.min(h - top - pad - (layout === 'phone' ? 90 * u : 0), layout === 'desktop' ? 230 * u : 200 * u)
  x.fillStyle = '#141a2c'
  rr(x, left, top, cw, chH, 12 * u)
  x.fill()
  x.fillStyle = '#8f9ab6'
  x.font = `500 ${12.5 * u}px ${MONO}`
  x.fillText('WEEKLY ACTIVITY', left + 16 * u, top + 22 * u)
  const hs = [0.35, 0.58, 0.43, 0.76, 0.62, 0.92, 0.8]
  const n = layout === 'phone' ? 5 : 7
  const bw = (cw - 32 * u) / n
  for (let i = 0; i < n; i++) {
    const bh = (chH - 56 * u) * hs[(i + v * 2) % hs.length]
    x.fillStyle = i === n - 2 ? acc : '#3a4a86'
    rr(x, left + 16 * u + i * bw + bw * 0.2, top + chH - 16 * u - bh, bw * 0.6, bh, 5 * u)
    x.fill()
  }
  if (layout === 'phone') {
    x.fillStyle = acc
    rr(x, left, h - 76 * u, cw, 48 * u, 24 * u)
    x.fill()
    x.fillStyle = '#ffffff'
    x.font = `600 ${16 * u}px ${FONT}`
    x.fillText('View projects ↗', left + cw / 2 - 58 * u, h - 52 * u)
  }
}

interface Device {
  root: THREE.Group
  screens: [THREE.Mesh, THREE.Mesh]
  from: THREE.Vector3
  to: THREE.Vector3
  rotFrom: THREE.Euler
  rotTo: THREE.Euler
  enter: [number, number]
  anchor: THREE.Vector3 // where the system path lands (local to rig)
}

export class DeliveryComp implements Comp {
  group = new THREE.Group()
  box = { w: 6.0, h: 4.4 }
  private rig = new THREE.Group()
  private devices: Device[] = []
  private lid: THREE.Group
  private core: THREE.Group
  private paths: GlowPath[] = []
  private coreLabel: THREE.Mesh
  private sync = { v: 0, mix: 0 }

  constructor(_q: Quality) {
    this.group.add(this.rig)
    const body = satin('#262b37', { metalness: 0.65, roughness: 0.32, clearcoat: 0.4 })
    const bezel = satin('#0b0d13', { roughness: 0.25, clearcoat: 1 })
    const screenPair = (layout: Layout, w: number, h: number, pw: number, ph: number) => {
      const make = (v: number) => {
        const tex = canvasTexture(pw, ph, (x, W, H) => paintUI(x, W, H, layout, v))
        const m = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: v === 1, opacity: v === 1 ? 0 : 1 }))
        m.scale.set(w, h, 1)
        return m
      }
      const a = make(0)
      const b = make(1)
      b.position.z = 0.002
      return [a, b] as [THREE.Mesh, THREE.Mesh]
    }

    /* laptop: base + hinged lid */
    const laptop = new THREE.Group()
    const base = new THREE.Mesh(roundedBox(2.9, 0.09, 1.95, 0.04), body)
    base.position.y = 0.045
    const deck = new THREE.Mesh(plane(), new THREE.MeshStandardMaterial({ color: '#191d27', roughness: 0.6 }))
    deck.rotation.x = -Math.PI / 2
    deck.scale.set(2.5, 0.9, 1)
    deck.position.set(0, 0.092, -0.28)
    const pad = new THREE.Mesh(roundedBox(0.95, 0.01, 0.55, 0.03), satin('#2d3240', { roughness: 0.3 }))
    pad.position.set(0, 0.093, 0.55)
    this.lid = new THREE.Group()
    this.lid.position.set(0, 0.09, -0.97)
    const lidBody = new THREE.Mesh(roundedBox(2.9, 1.86, 0.05, 0.04), body)
    lidBody.position.set(0, 0.93, -0.025)
    const lidFace = new THREE.Mesh(roundedBox(2.82, 1.78, 0.012, 0.03), bezel)
    lidFace.position.set(0, 0.93, 0.004)
    const ls = screenPair('desktop', 2.66, 1.64, 1024, 632)
    ls.forEach((s) => s.position.set(0, 0.93, 0.012 + (s === ls[1] ? 0.002 : 0)))
    this.lid.add(lidBody, lidFace, ...ls)
    laptop.add(base, deck, pad, this.lid)
    this.devices.push({ root: laptop, screens: ls, from: new THREE.Vector3(-0.6, -1.9, 0.4), to: new THREE.Vector3(-0.75, -1.05, -0.2), rotFrom: new THREE.Euler(0.3, 0.1, 0), rotTo: new THREE.Euler(0.12, 0.38, 0), enter: [0.0, 0.55], anchor: new THREE.Vector3(-0.75, 0.75, -0.4) })

    /* tablet */
    const tablet = new THREE.Group()
    tablet.add(new THREE.Mesh(roundedBox(1.22, 1.62, 0.06, 0.08), body))
    const tf = new THREE.Mesh(roundedBox(1.16, 1.56, 0.01, 0.06), bezel)
    tf.position.z = 0.031
    const ts = screenPair('tablet', 1.06, 1.44, 600, 816)
    ts.forEach((s) => (s.position.z = 0.037 + (s === ts[1] ? 0.002 : 0)))
    tablet.add(tf, ...ts)
    this.devices.push({ root: tablet, screens: ts, from: new THREE.Vector3(3.6, 0.9, -1.2), to: new THREE.Vector3(1.32, 0.12, -0.6), rotFrom: new THREE.Euler(0, -1.4, 0.2), rotTo: new THREE.Euler(-0.04, -0.42, 0.02), enter: [0.18, 0.62], anchor: new THREE.Vector3(1.32, 0.95, -0.6) })

    /* phone */
    const phone = new THREE.Group()
    phone.add(new THREE.Mesh(roundedBox(0.66, 1.34, 0.07, 0.11), body))
    const pf = new THREE.Mesh(roundedBox(0.62, 1.3, 0.01, 0.09), bezel)
    pf.position.z = 0.036
    const ps = screenPair('phone', 0.56, 1.2, 400, 860)
    ps.forEach((s) => (s.position.z = 0.042 + (s === ps[1] ? 0.002 : 0)))
    const notch = new THREE.Mesh(roundedBox(0.16, 0.035, 0.01, 0.017), new THREE.MeshBasicMaterial({ color: '#000' }))
    notch.position.set(0, 0.56, 0.046)
    phone.add(pf, ...ps, notch)
    this.devices.push({ root: phone, screens: ps, from: new THREE.Vector3(2.6, -2.4, 1.8), to: new THREE.Vector3(1.78, -0.78, 0.55), rotFrom: new THREE.Euler(0.6, 1.2, -0.4), rotTo: new THREE.Euler(-0.05, -0.32, -0.06), enter: [0.32, 0.78], anchor: new THREE.Vector3(1.78, -0.1, 0.55) })

    this.devices.forEach((d) => this.rig.add(d.root))

    /* the design-system core all screens are built from */
    this.core = new THREE.Group()
    const cube = new THREE.Mesh(roundedBox(0.34, 0.34, 0.34, 0.07), satin(COL.blue, { emissive: new THREE.Color('#2443ff'), emissiveIntensity: 0.8, clearcoat: 1, clearcoatRoughness: 0.05 }))
    cube.rotation.set(0.6, 0.7, 0)
    this.core.add(haloSprite('#4d6fff', 1.4, 0.45), cube)
    this.coreLabel = label('Design system', 0.1, { size: 42, weight: 500, color: '#c9d3ee', font: '"Geist Mono Variable", ui-monospace, monospace' })
    this.coreLabel.position.set(0, 0.36, 0)
    this.core.add(this.coreLabel)
    this.core.position.set(0.25, 1.55, 0.2)
    this.rig.add(this.core)
    this.devices.forEach((d) => {
      const A = this.core.position.clone()
      const B = d.anchor.clone()
      const mid = A.clone().lerp(B, 0.5).add(new THREE.Vector3(0, 0.45, 0.25))
      const p = new GlowPath([A, mid, B], 0.009, COL.blueSoft, '#ffffff', 64)
      p.mat.uniforms.uSpeed.value = 0
      this.paths.push(p)
      this.rig.add(p.mesh)
    })
  }

  setQuality() {}

  update(c: Ctx) {
    const { T, clock } = c
    const a = seg(T, WIN[4].in[0], WIN[4].in[1])
    this.group.visible = T >= WIN[4].in[0] - 0.001
    if (!this.group.visible) return
    this.rig.rotation.set(-c.pointer.y * 0.05, -0.12 + c.pointer.x * 0.1, 0)

    this.devices.forEach((d, i) => {
      const k = seg(a, d.enter[0], d.enter[1])
      const e = i === 0 ? outCubic(k) : inOutCubic(k)
      // orbit in: travel along an arc rather than a straight line
      d.root.position.lerpVectors(d.from, d.to, e)
      if (i > 0) d.root.position.z += Math.sin(e * Math.PI) * 0.9
      d.root.rotation.set(lerp(d.rotFrom.x, d.rotTo.x, e), lerp(d.rotFrom.y, d.rotTo.y, e), lerp(d.rotFrom.z, d.rotTo.z, e))
      d.root.scale.setScalar(Math.max(i === 0 ? 1 : outBack(Math.min(1, k * 1.4), 1.2), 0.0001))
      d.root.visible = k > 0.001
    })
    // the lid opens once the laptop has landed
    const open = outBack(seg(a, 0.3, 0.75), 1.1)
    this.lid.rotation.x = lerp(Math.PI / 2 - 0.02, -0.18, open)

    const ce = outBack(seg(a, 0.5, 0.8), 1.8)
    this.core.scale.setScalar(Math.max(ce, 0.0001))
    this.core.visible = ce > 0.001
    this.core.children[1].rotation.y = c.still ? 0.7 : 0.7 + clock * 0.4

    /* synchronisation: pulses leave together, every screen switches state together */
    const draw = outCubic(seg(a, 0.62, 0.95))
    const period = 3.6
    const ph = c.still ? 0 : ((clock % period) + period) % period / period
    const cycle = c.still ? 0 : Math.floor(clock / period)
    const arriving = seg(ph, 0.05, 0.42)
    this.paths.forEach((p) => {
      p.set(draw, 0.85, 0, a >= 1 && !c.still && arriving > 0 && arriving < 1 ? 1 : 0)
      // drive the highlight head directly so all three arrive at the same moment
      p.mat.uniforms.uPhase.value = Math.min(arriving, 0.999)
    })
    const target = a >= 1 && !c.still ? cycle % 2 : 0
    const sw = a >= 1 && !c.still ? seg(ph, 0.42, 0.6) : 1
    const mix = target === 1 ? sw : 1 - sw
    this.devices.forEach((d) => {
      const m = d.screens[1].material as THREE.MeshBasicMaterial
      m.opacity = mix
      d.screens[1].visible = mix > 0.001
    })
    this.sync.mix = mix
  }

  dispose() {
    this.paths.forEach((p) => p.dispose())
  }
}

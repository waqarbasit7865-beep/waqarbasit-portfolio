/**
 * 02 · Product thinking — "From user flow to intuitive interface."
 * Choreography: BRANCHING, then TRANSFORMATION. The engine core arrives as the first node; paths grow and
 * branch in depth to the next steps while signals travel the main route. Then the same nodes reshape into
 * the regions of an interface (header, navigation, search, content, primary action) on a screen surface.
 * Sample flow labels — a process illustration, not client work.
 */
import * as THREE from 'three'
import { COL, GlowPath, clamp01, haloSprite, label, lerp, outBack, outCubic, inOutCubic, roundedBox, satin, seg, setOpacity, sphere, unitSlab, type Quality } from '../kit'
import { WIN, type Comp, type Ctx } from './common'

interface Node {
  g: THREE.Group
  body: THREE.Mesh
  text: THREE.Mesh
  flow: THREE.Vector3
  size: THREE.Vector3
  ui: THREE.Vector3
  uiSize: THREE.Vector3
  pop: number
  keepLabel?: boolean
  muted?: boolean
}

const NODES = [
  { t: 'Sign in', p: [-2.15, 0, 0], ui: [0.05, 0.93, 0.06], us: [3.3, 0.24, 0.07], pop: 0 },
  { t: 'Dashboard', p: [-0.65, 0.98, -0.45], ui: [-1.33, -0.16, 0.06], us: [0.6, 1.66, 0.07], pop: 0.36 },
  { t: 'Search', p: [-0.65, -0.98, 0.45], ui: [0.38, 0.5, 0.06], us: [1.95, 0.24, 0.07], pop: 0.36 },
  { t: 'Review task', p: [0.88, 0, 0], ui: [0.38, -0.24, 0.06], us: [1.95, 0.9, 0.07], pop: 0.62 },
  { t: 'Approve', p: [2.25, 0.05, 0.3], ui: [1.0, -0.88, 0.12], us: [0.7, 0.22, 0.1], pop: 0.84, keep: true },
  { t: 'No results', p: [0.7, -1.8, 1.0], ui: [0.7, -1.8, 0.4], us: [0.6, 0.2, 0.05], pop: 0.78, muted: true },
] as const
const EDGES: [number, number, number, number][] = [
  // from, to, draw start, draw end (entry progress)
  [0, 1, 0.08, 0.38],
  [0, 2, 0.1, 0.4],
  [1, 3, 0.4, 0.64],
  [2, 3, 0.42, 0.66],
  [3, 4, 0.64, 0.86],
  [2, 5, 0.52, 0.8],
]
const ROUTES = [
  [0, 2, 4],
  [1, 3, 4],
] // edge indices

export class FlowComp implements Comp {
  group = new THREE.Group()
  box = { w: 5.4, h: 4.2 }
  private rig = new THREE.Group()
  private nodes: Node[] = []
  private paths: GlowPath[] = []
  private signals: { m: THREE.Group; route: number; off: number }[] = []
  private screen: THREE.Mesh
  private screenEdge: THREE.Mesh
  private bars: THREE.Mesh[] = []
  private navItems: THREE.Mesh[] = []
  private root = new THREE.Vector3()

  constructor(_q: Quality) {
    this.group.add(this.rig)
    const nodeMat = () => satin('#1c2233', { emissive: new THREE.Color('#0b1430'), emissiveIntensity: 0.6, clearcoat: 1, clearcoatRoughness: 0.15 })
    NODES.forEach((n, i) => {
      const g = new THREE.Group()
      const body = new THREE.Mesh(unitSlab(), i === 4 ? satin(COL.blue, { emissive: new THREE.Color('#1a3bff'), emissiveIntensity: 0.55, clearcoat: 1 }) : nodeMat())
      const size = new THREE.Vector3(i === 0 ? 0.95 : 1.12, 0.36, 0.2)
      body.scale.copy(size)
      const text = label(n.t, 0.13, { size: 52, weight: 550, color: 'muted' in n ? '#8a93ab' : '#eef2ff' })
      text.position.z = 0.111
      text.userData.base = text.scale.clone()
      g.add(body, text)
      this.rig.add(g)
      this.nodes.push({ g, body, text, flow: new THREE.Vector3(...n.p), size, ui: new THREE.Vector3(...n.ui), uiSize: new THREE.Vector3(...n.us), pop: n.pop, keepLabel: 'keep' in n, muted: 'muted' in n })
    })
    this.root.copy(this.nodes[0].flow)

    EDGES.forEach(([a, b], k) => {
      const A = this.nodes[a].flow
      const B = this.nodes[b].flow
      const ax = A.x + 0.5
      const bx = B.x - 0.5
      const pts = [new THREE.Vector3(ax, A.y, A.z), new THREE.Vector3(lerp(ax, bx, 0.45), lerp(A.y, B.y, 0.15), lerp(A.z, B.z, 0.3)), new THREE.Vector3(lerp(ax, bx, 0.62), lerp(A.y, B.y, 0.85), lerp(A.z, B.z, 0.75)), new THREE.Vector3(bx, B.y, B.z)]
      const p = new GlowPath(pts, k === 5 ? 0.006 : 0.011, k === 5 ? '#59617a' : COL.blueSoft, '#ffffff', 72)
      p.mat.uniforms.uSpeed.value = 0.5
      p.mat.uniforms.uPulse.value = k === 5 ? 0 : 1
      this.paths.push(p)
      this.rig.add(p.mesh)
    })

    /* moving signals: bright beads travelling the main routes */
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Group()
      m.add(new THREE.Mesh(sphere(0.045, 16), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, transparent: true })))
      m.add(haloSprite('#6f8dff', 0.55, 0.9))
      this.rig.add(m)
      this.signals.push({ m, route: i % 2, off: i * 0.5 })
    }

    /* interface surface the flow becomes */
    this.screen = new THREE.Mesh(roundedBox(3.55, 2.35, 0.06, 0.06), satin('#121725', { clearcoat: 1, clearcoatRoughness: 0.2, transparent: true, opacity: 0.94 }))
    this.screen.position.set(0.05, 0.02, -0.05)
    this.screenEdge = new THREE.Mesh(roundedBox(3.62, 2.42, 0.03, 0.08), new THREE.MeshBasicMaterial({ color: COL.blueSoft, transparent: true, opacity: 0.35, depthWrite: false }))
    this.screenEdge.position.set(0.05, 0.02, -0.08)
    this.rig.add(this.screenEdge, this.screen)
    const barMat = new THREE.MeshStandardMaterial({ color: COL.lilac, emissive: COL.blue, emissiveIntensity: 0.35, roughness: 0.4 })
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Mesh(roundedBox(0.16, 1, 0.06, 0.02), barMat)
      this.bars.push(b)
      this.rig.add(b)
    }
    const navMat = new THREE.MeshStandardMaterial({ color: '#3a4462', roughness: 0.5 })
    for (let i = 0; i < 4; i++) {
      const n = new THREE.Mesh(roundedBox(0.4, 0.09, 0.03, 0.02), navMat)
      this.navItems.push(n)
      this.rig.add(n)
    }
  }

  setQuality() {}

  exports() {
    this.group.updateMatrixWorld()
    return { flowRoot: this.rig.localToWorld(this.root.clone()) }
  }

  update(c: Ctx) {
    const { T, clock } = c
    const a = seg(T, WIN[1].in[0], WIN[1].in[1])
    const m = inOutCubic(seg(T, 2.35, 3.0)) // flow → interface
    const o = seg(T, WIN[1].out[0], WIN[1].out[1])
    // pre-position so the intro core can travel to the root node before this scene shows
    this.group.visible = T >= WIN[0].out[0] && T <= WIN[1].out[1] + 0.001
    const shown = T >= WIN[1].in[0] - 0.02
    this.rig.visible = shown
    // composition turns as it reveals depth, then turns again to present the interface
    this.rig.rotation.set(lerp(-0.2, -0.08, m) - c.pointer.y * 0.05 + o * 0.5, lerp(lerp(0.95, 0.42, outCubic(a)), -0.3, m) + c.pointer.x * 0.1, 0)
    this.rig.position.z = -2.6 * outCubic(o)
    this.rig.position.y = 0.6 * outCubic(o)
    setOpacity(this.rig, 1 - outCubic(o))
    if (!shown) return
    const idle = c.still ? 0 : clock

    this.nodes.forEach((n, i) => {
      const p = i === 0 ? 1 : outBack(seg(a, n.pop - 0.04, n.pop + 0.14), 1.7)
      const mm = n.muted ? 0 : m
      n.g.position.lerpVectors(n.flow, n.ui, mm)
      n.body.scale.set(lerp(n.size.x, n.uiSize.x, mm), lerp(n.size.y, n.uiSize.y, mm), lerp(n.size.z, n.uiSize.z, mm))
      const vis = n.muted ? p * (1 - m) : p
      n.g.scale.setScalar(Math.max(vis, 0.0001))
      n.g.visible = vis > 0.002
      const tm = n.text.material as THREE.MeshBasicMaterial
      tm.opacity = (n.keepLabel ? 1 : clamp01(1 - m * 2.2)) * (1 - o)
      n.text.position.z = n.body.scale.z / 2 + 0.006
      n.text.scale.copy(n.text.userData.base as THREE.Vector3).multiplyScalar(n.keepLabel ? lerp(1, 0.78, m) : 1)
    })
    // the root node uses the arriving core for its first half of entry
    this.nodes[0].g.scale.setScalar(outCubic(seg(a, 0, 0.25)) * 0.999 + 0.001)

    EDGES.forEach(([, , d0, d1], k) => {
      const draw = outCubic(seg(a, d0, d1))
      this.paths[k].set(draw, (k === 5 ? 0.55 : 0.95) * (1 - m) * (1 - o), idle, c.still ? 0 : 1)
    })

    // signals travel the routes during the flow dwell; converge into the primary action during the morph
    const routeT = (idle * 0.42) % 1
    this.signals.forEach((s, i) => {
      const route = ROUTES[s.route]
      const u = (routeT + s.off) % 1
      const k = Math.min(route.length - 1, Math.floor(u * route.length))
      const local = u * route.length - k
      this.paths[route[k]].curve.getPoint(local, s.m.position)
      const target = this.nodes[4].g.position
      if (m > 0) s.m.position.lerp(target, m)
      const vis = seg(a, 0.86, 1) * (1 - m) * (c.still ? (i === 0 ? 1 : 0) : 1)
      s.m.scale.setScalar(Math.max(vis, 0.0001))
      s.m.visible = vis > 0.01
    })

    /* the interface surface rises behind the regions */
    const sv = outCubic(seg(m, 0, 0.7))
    this.screen.scale.set(lerp(0.6, 1, sv), lerp(0.6, 1, sv), 1)
    ;(this.screen.material as THREE.MeshPhysicalMaterial).opacity = 0.94 * sv * (1 - o)
    this.screen.visible = sv > 0.002
    ;(this.screenEdge.material as THREE.MeshBasicMaterial).opacity = 0.35 * sv * (1 - o)
    this.screenEdge.scale.copy(this.screen.scale)
    this.screenEdge.visible = this.screen.visible
    // chart bars grow inside the content region; nav items fill the navigation
    const bars = [0.35, 0.55, 0.42, 0.72, 0.6, 0.86]
    this.bars.forEach((b, i) => {
      const g = outBack(seg(m, 0.55 + i * 0.05, 0.85 + i * 0.05), 1.4)
      const h = bars[i] * 0.62 * Math.max(g, 0.001)
      b.scale.set(1, h, 1)
      b.position.set(-0.3 + i * 0.26, -0.62 + h / 2, 0.11)
      b.visible = g > 0.01
    })
    this.navItems.forEach((n, i) => {
      const g = outCubic(seg(m, 0.5 + i * 0.06, 0.8 + i * 0.06))
      n.position.set(-1.33, 0.48 - i * 0.24, 0.11)
      n.scale.setScalar(Math.max(g, 0.0001))
      n.visible = g > 0.01
    })
  }

  dispose() {
    this.paths.forEach((p) => p.dispose())
  }
}

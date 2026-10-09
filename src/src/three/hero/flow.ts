/**
 * 02 · Product thinking — "From user flow to intuitive interface."
 * User goal → connected flow → wireframe → finished interface → successful interaction.
 *  1. A small readable flow (Start → Review request → Decision → Approve → Complete) builds in depth and a
 *     light pulse travels through it.                                             (scroll-driven)
 *  2. The same nodes move and resize into the structure of an interface and show as wireframe.
 *  3. Each region resolves into a finished dashboard: navigation, header with a primary action, a chart,
 *     task rows with status chips, a summary card.
 *  4. Once settled, an illustrative pointer selects a request, opens its details and approves it — the row
 *     status and the chart update and a confirmation appears. Then a calm hold.  (plays on arrival)
 * Interface concept with neutral sample content — not a client project.
 */
import * as THREE from 'three'
import { COL, GlowPath, clamp01, haloSprite, inOutCubic, lerp, outBack, outCubic, plane, roundedBox, satin, seg, setOpacity, sphere, type Quality } from '../kit'
import { Surface, UI, chip, pointerMesh, rrect, skeleton, text, wireImage, type Ctx2D } from '../ui'
import { WIN, type Comp, type Ctx } from './common'

type V3 = [number, number, number]
interface El {
  key: string
  g: THREE.Group
  body: THREE.Mesh
  faces: THREE.Mesh[] // node, wire, ui
  surf: Surface // ui surface (repaintable)
  node: { p: V3; s: [number, number] }
  ui: { p: V3; s: [number, number] }
  delay: number
}

const NODES: { key: string; label: string; icon: 'start' | 'doc' | 'diamond' | 'check' | 'flag'; p: V3 }[] = [
  { key: 'side', label: 'Start', icon: 'start', p: [-2.2, 0.62, 0.3] },
  { key: 'rows', label: 'Review request', icon: 'doc', p: [-0.98, 0.18, 0.05] },
  { key: 'chart', label: 'Decision', icon: 'diamond', p: [0.2, -0.24, -0.25] },
  { key: 'btn', label: 'Approve', icon: 'check', p: [1.35, 0.22, 0.0] },
  { key: 'head', label: 'Complete', icon: 'flag', p: [2.3, 0.7, 0.3] },
]
/** finished layout, board-local (board 3.8 × 2.45) */
const LAYOUT: Record<string, { p: V3; s: [number, number] }> = {
  side: { p: [-1.5, -0.02, 0.07], s: [0.66, 2.24] },
  head: { p: [0.36, 0.98, 0.07], s: [2.92, 0.34] },
  btn: { p: [1.42, 0.98, 0.15], s: [0.66, 0.2] },
  chart: { p: [-0.4, 0.27, 0.07], s: [1.32, 0.98] },
  rows: { p: [0.98, -0.16, 0.07], s: [1.5, 1.98] },
  stats: { p: [-0.4, -0.68, 0.07], s: [1.32, 0.8] },
}
const ROWS = [
  { t: 'Brand refresh', s: 'Design review', st: 'In review' },
  { t: 'Q3 budget', s: 'Finance · approval', st: 'Pending' },
  { t: 'Vendor onboarding', s: 'Operations', st: 'Approved' },
  { t: 'Help centre update', s: 'Content', st: 'In review' },
  { t: 'Access request', s: 'IT · security', st: 'Approved' },
]
const BARS = [6, 9, 7, 11, 8]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

/* ───────── painters ───────── */
const ICON_COL = { start: UI.green, doc: UI.accentSoft, diamond: UI.amber, check: UI.accent, flag: UI.violet }
function paintNode(label: string, icon: keyof typeof ICON_COL) {
  return (x: Ctx2D, w: number, h: number) => {
    const H = (h / w) * 1000
    rrect(x, 4, 4, 992, H - 8, 70, '#1a2033', '#3a4a86', 3)
    const cy = H / 2
    x.beginPath()
    if (icon === 'diamond') {
      x.moveTo(110 * x.u, (cy - 42) * x.u)
      x.lineTo(152 * x.u, cy * x.u)
      x.lineTo(110 * x.u, (cy + 42) * x.u)
      x.lineTo(68 * x.u, cy * x.u)
      x.closePath()
    } else x.arc(110 * x.u, cy * x.u, 36 * x.u, 0, Math.PI * 2)
    x.fillStyle = ICON_COL[icon]
    x.fill()
    text(x, label, 190, cy + 2, 92, UI.text, 600)
  }
}
function wireFor(key: string) {
  return (x: Ctx2D, w: number, h: number) => {
    const H = (h / w) * 1000
    rrect(x, 3, 3, 994, H - 6, 18, UI.wireFill, UI.wire, 3)
    if (key === 'side') {
      skeleton(x, 90, 90, 600, 40)
      for (let i = 0; i < 5; i++) skeleton(x, 90, 260 + i * 170, i === 1 ? 760 : 560, 36)
    } else if (key === 'head') {
      skeleton(x, 40, H / 2, 200, 70)
      rrect(x, 330, H / 2 - 50, 260, 100, 50, undefined, UI.wire, 3)
      x.beginPath()
      x.arc(950 * x.u, (H / 2) * x.u, 40 * x.u, 0, Math.PI * 2)
      x.strokeStyle = UI.wire
      x.lineWidth = 3 * x.u
      x.stroke()
    } else if (key === 'btn') {
      rrect(x, 30, H / 2 - 120, 940, 240, 120, undefined, UI.wire, 6)
      skeleton(x, 250, H / 2, 500, 70)
    } else if (key === 'chart') {
      skeleton(x, 50, 80, 420, 34)
      for (let i = 0; i < 5; i++) rrect(x, 90 + i * 175, 650 - BARS[i] * 40, 90, BARS[i] * 40, 10, undefined, UI.wire, 3)
    } else if (key === 'rows') {
      skeleton(x, 50, 80, 380, 34)
      for (let i = 0; i < 5; i++) {
        const y = 200 + i * 240
        wireImage(x, 50, y - 50, 100, 100)
        skeleton(x, 190, y - 22, 360, 28)
        skeleton(x, 190, y + 26, 240, 22)
        rrect(x, 720, y - 28, 220, 56, 28, undefined, UI.wire, 3)
      }
    } else {
      skeleton(x, 50, 90, 360, 34)
      skeleton(x, 50, 230, 520, 60)
      skeleton(x, 50, 380, 420, 30)
    }
  }
}
interface DashState {
  sel: number
  status: string
  bar: number // extra value on today's bar (0 → 1 animates)
  approved: boolean
  pressed: boolean
}
function uiFor(key: string, st: DashState) {
  return (x: Ctx2D, w: number, h: number) => {
    const H = (h / w) * 1000
    rrect(x, 0, 0, 1000, H, 18, UI.surface)
    if (key === 'side') {
      x.beginPath()
      x.arc(110 * x.u, 100 * x.u, 34 * x.u, 0, Math.PI * 2)
      x.fillStyle = UI.accent
      x.fill()
      text(x, 'Workspace', 170, 102, 70, UI.text, 650)
      ;['Overview', 'Requests', 'Reports', 'Team', 'Settings'].forEach((t, i) => {
        const y = 300 + i * 170
        if (i === 1) rrect(x, 40, y - 62, 920, 124, 30, UI.accent + '33')
        text(x, t, 90, y, 66, i === 1 ? '#ffffff' : UI.muted, i === 1 ? 650 : 500)
      })
      text(x, 'Interface concept', 90, H - 90, 46, UI.faint, 500)
    } else if (key === 'head') {
      text(x, 'Requests', 36, H / 2 + 2, 52, UI.text, 650)
      rrect(x, 250, H / 2 - 36, 300, 72, 36, UI.surface2, UI.line, 2)
      text(x, 'Search requests', 290, H / 2 + 2, 30, UI.muted, 500)
      x.beginPath()
      x.arc(960 * x.u, (H / 2) * x.u, 30 * x.u, 0, Math.PI * 2)
      x.fillStyle = UI.violet
      x.fill()
    } else if (key === 'btn') {
      rrect(x, 0, 0, 1000, H, H / 2, UI.accent)
      text(x, '+  New request', 500, H / 2 + 4, 120, '#ffffff', 650, 'center')
    } else if (key === 'chart') {
      text(x, 'Approvals this week', 50, 80, 50, UI.text, 600)
      text(x, `${BARS.reduce((a, b) => a + b, 0) + Math.round(st.bar)} approved`, 50, 140, 38, UI.muted, 500)
      const base = 640
      BARS.forEach((v, i) => {
        const val = v + (i === 4 ? st.bar : 0)
        const bh = val * 38
        const hi = i === 4
        rrect(x, 90 + i * 175, base - bh, 90, bh, 12, hi ? UI.accent : '#3a4a86')
        text(x, String(Math.round(val)), 135 + i * 175, base - bh - 34, 34, hi ? '#ffffff' : UI.muted, 600, 'center')
        text(x, DAYS[i], 135 + i * 175, base + 50, 34, UI.muted, 500, 'center')
      })
    } else if (key === 'rows') {
      text(x, 'Open requests', 50, 80, 50, UI.text, 600)
      text(x, '5', 950, 80, 40, UI.muted, 600, 'right')
      ROWS.forEach((r, i) => {
        const y = 200 + i * 240
        if (i === st.sel) rrect(x, 20, y - 104, 960, 208, 22, UI.accent + '26', UI.accent + 'aa', 3)
        rrect(x, 50, y - 48, 96, 96, 22, ['#2b3a78', '#3a2f6b', '#24454a', '#3d3326', '#2f3550'][i])
        text(x, r.t, 190, y - 22, 48, UI.text, 600)
        text(x, r.s, 190, y + 30, 36, UI.muted, 500)
        const s = i === 1 ? st.status : r.st
        chip(x, s, 950, y, s === 'Approved' ? 'green' : s === 'Pending' ? 'amber' : 'blue', 30, 'right')
      })
    } else {
      text(x, 'This week', 50, 80, 46, UI.muted, 500)
      text(x, `${18 + (st.approved ? 1 : 0)}`, 50, 220, 150, UI.text, 650)
      text(x, 'requests approved', 300, 240, 44, UI.muted, 500)
      rrect(x, 50, 360, 900, 18, 9, UI.surface2)
      rrect(x, 50, 360, st.approved ? 700 : 660, 18, 9, UI.green)
      text(x, 'Avg. response 1.4 days', 50, 450, 40, UI.muted, 500)
    }
  }
}
function paintDrawer(st: DashState) {
  return (x: Ctx2D, _w: number, h: number) => {
    const H = (h / _w) * 1000
    rrect(x, 0, 0, 1000, H, 26, '#1a2034', '#34407a', 3)
    text(x, 'Request details', 60, 90, 44, UI.muted, 500)
    text(x, 'Q3 budget', 60, 190, 84, UI.text, 650)
    chip(x, st.approved ? 'Approved' : 'Pending', 60, 300, st.approved ? 'green' : 'amber', 36)
    const rows: [string, string][] = [
      ['Requested by', 'Finance team'],
      ['Amount', '12,400'],
      ['Due', 'Friday'],
    ]
    rows.forEach(([k, v], i) => {
      const y = 430 + i * 110
      text(x, k, 60, y, 42, UI.muted, 500)
      text(x, v, 940, y, 42, UI.text, 600, 'right')
      rrect(x, 60, y + 50, 880, 2, 1, UI.line)
    })
    text(x, 'Notes', 60, 800, 42, UI.muted, 500)
    rrect(x, 60, 840, 880, 170, 18, UI.surface2)
    text(x, 'Matches the planned allocation.', 90, 925, 38, UI.text, 500)
    // actions
    if (st.approved) {
      rrect(x, 60, 1120, 880, 130, 65, UI.green + '33', UI.green, 3)
      text(x, '✓  Approved', 500, 1188, 56, UI.green, 650, 'center')
    } else {
      rrect(x, 60, 1120, 520, 130, 65, st.pressed ? '#2448d6' : UI.accent)
      text(x, 'Approve', 320, 1188, 56, '#ffffff', 650, 'center')
      rrect(x, 610, 1120, 330, 130, 65, undefined, UI.line, 3)
      text(x, 'Decline', 775, 1188, 50, UI.muted, 600, 'center')
    }
  }
}

export class FlowComp implements Comp {
  group = new THREE.Group()
  box = { w: 4.7, h: 3.4 }
  private rig = new THREE.Group()
  private board = new THREE.Group()
  private frame: THREE.Mesh
  private frameEdge: THREE.Mesh
  private els: El[] = []
  private paths: GlowPath[] = []
  private pulse: THREE.Group
  private drawer: ReturnType<typeof makeSlab>
  private toast: ReturnType<typeof makeSlab>
  private pointer = pointerMesh(0.2)
  private st: DashState = { sel: -1, status: 'Pending', bar: 0, approved: false, pressed: false }
  private stKey = ''
  private arrivedAt = -1
  private changes: THREE.Group
  private root = new THREE.Vector3()

  constructor(_q: Quality) {
    this.group.add(this.rig)
    this.rig.add(this.board)
    this.frame = new THREE.Mesh(roundedBox(3.86, 2.5, 0.06, 0.08), satin('#0b0e17', { metalness: 0.4, roughness: 0.28, clearcoat: 1 }))
    this.frameEdge = new THREE.Mesh(roundedBox(3.92, 2.56, 0.03, 0.1), new THREE.MeshBasicMaterial({ color: COL.blueSoft, transparent: true, opacity: 0.28, depthWrite: false }))
    this.frameEdge.position.z = -0.03
    this.board.add(this.frameEdge, this.frame)

    /* the five flow nodes that become interface regions, plus the summary card */
    const all = [...NODES.map((n) => n.key), 'stats']
    all.forEach((key, i) => {
      const n = NODES.find((m) => m.key === key)
      const ui = LAYOUT[key]
      const g = new THREE.Group()
      const body = new THREE.Mesh(roundedBox(1, 1, 1, 0.06, 3), satin('#141a2a', { metalness: 0.35, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 }))
      g.add(body)
      const density = 520
      const nodeSurf = new Surface(1024, 320, paintNode(n?.label ?? '', n?.icon ?? 'doc'))
      const wireSurf = new Surface(Math.round(ui.s[0] * density), Math.round(ui.s[1] * density), wireFor(key))
      const uiSurf = new Surface(Math.round(ui.s[0] * density), Math.round(ui.s[1] * density), uiFor(key, this.st))
      const faces = [nodeSurf, wireSurf, uiSurf].map((s) => {
        const m = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: s.tex, transparent: true, toneMapped: false, depthWrite: false }))
        g.add(m)
        return m
      })
      this.board.add(g)
      this.els.push({
        key,
        g,
        body,
        faces,
        surf: uiSurf,
        node: n ? { p: n.p, s: [key === 'rows' ? 1.25 : 0.98, 0.32] } : { p: [ui.p[0], ui.p[1], ui.p[2] - 0.6], s: [0.3, 0.3] },
        ui,
        delay: i * 0.07,
      })
    })
    this.root.set(...NODES[0].p)

    /* connections + the branch nobody takes */
    const P = (k: string) => new THREE.Vector3(...NODES.find((n) => n.key === k)!.p)
    const link = (A: THREE.Vector3, B: THREE.Vector3, muted = false) => {
      const a = A.clone().add(new THREE.Vector3(0.5, 0, 0))
      const b = B.clone().add(new THREE.Vector3(-0.5, 0, 0))
      const m1 = new THREE.Vector3(lerp(a.x, b.x, 0.45), lerp(a.y, b.y, 0.1), lerp(a.z, b.z, 0.3))
      const m2 = new THREE.Vector3(lerp(a.x, b.x, 0.6), lerp(a.y, b.y, 0.9), lerp(a.z, b.z, 0.7))
      const p = new GlowPath([a, m1, m2, b], muted ? 0.006 : 0.012, muted ? '#56607e' : COL.blueSoft, '#ffffff', 64)
      p.mat.uniforms.uSpeed.value = 0
      this.board.add(p.mesh)
      return p
    }
    const order = ['side', 'rows', 'chart', 'btn', 'head']
    for (let i = 0; i < 4; i++) this.paths.push(link(P(order[i]), P(order[i + 1])))
    // "Request changes" branch from Decision (stays muted)
    this.changes = new THREE.Group()
    const cs = new Surface(1024, 320, paintNode('Request changes', 'doc'))
    const cm = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: cs.tex, transparent: true, opacity: 0.6, toneMapped: false, depthWrite: false }))
    cm.scale.set(1.1, 0.34, 1)
    this.changes.add(cm)
    this.changes.position.set(1.15, -0.78, -0.3)
    this.board.add(this.changes)
    this.paths.push(link(P('chart'), new THREE.Vector3(1.15, -0.78, -0.3), true))

    this.pulse = new THREE.Group()
    this.pulse.add(new THREE.Mesh(sphere(0.05, 16), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, transparent: true })))
    this.pulse.add(haloSprite('#6f8dff', 0.6, 0.95))
    this.board.add(this.pulse)

    this.drawer = makeSlab(1.3, 1.82, 0.08, paintDrawer(this.st))
    this.board.add(this.drawer.group)
    this.toast = makeSlab(1.15, 0.24, 0.06, (x, w, h) => {
      const H = (h / w) * 1000
      rrect(x, 0, 0, 1000, H, H / 2, '#123826', UI.green, 4)
      text(x, '✓  Request approved', 500, H / 2 + 3, 92, '#c9f5df', 650, 'center')
    })
    this.board.add(this.toast.group)
    this.board.add(this.pointer.group)
  }

  setQuality() {}

  exports() {
    this.group.updateMatrixWorld()
    return { flowRoot: this.board.localToWorld(this.root.clone()) }
  }

  private setState(next: Partial<DashState>) {
    Object.assign(this.st, next)
    const key = JSON.stringify(this.st)
    if (key === this.stKey) return
    this.stKey = key
    this.els.forEach((e) => e.surf.paint(uiFor(e.key, this.st)))
    this.drawer.surf.paint(paintDrawer(this.st))
  }

  /** board-local position of a point given in an element's design space (0..1000 wide) */
  private at(key: string, dx: number, dy: number, z = 0.3): THREE.Vector3 {
    const L = key === 'drawer' ? { p: [1.02, -0.1, 0.42] as V3, s: [1.3, 1.82] as [number, number] } : LAYOUT[key]
    const Hd = (L.s[1] / L.s[0]) * 1000
    return new THREE.Vector3(L.p[0] - L.s[0] / 2 + (dx / 1000) * L.s[0], L.p[1] + L.s[1] / 2 - (dy / Hd) * L.s[1], z)
  }

  update(c: Ctx) {
    const { T } = c
    const a = seg(T, WIN[1].in[0], 2.05) // flow builds + pulse
    const m1 = inOutCubic(seg(T, 2.05, 2.5)) // reorganise into structure (wireframe)
    const m2 = seg(T, 2.5, 2.95) // resolve to finished interface
    const o = seg(T, WIN[1].out[0], WIN[1].out[1])
    this.group.visible = T >= WIN[0].out[0] && T <= WIN[1].out[1] + 0.001
    const shown = T >= WIN[1].in[0] - 0.02
    this.rig.visible = shown
    // a calm three-quarter view that flattens as the interface resolves
    this.rig.rotation.set(lerp(-0.16, -0.08, m1) - c.pointer.y * 0.04 + o * 0.4, lerp(lerp(0.55, 0.28, outCubic(a)), -0.26, m1) + c.pointer.x * 0.08, 0)
    this.rig.position.z = -2.4 * outCubic(o)
    setOpacity(this.rig, 1 - outCubic(o))
    if (!shown) return

    /* elements: node → wire → interface */
    this.els.forEach((e, i) => {
      const isStats = e.key === 'stats'
      const pop = i === 0 ? 1 : isStats ? outBack(seg(m1, 0.4, 1), 1.4) : outBack(seg(a, i * 0.14, i * 0.14 + 0.2), 1.7)
      const k = isStats ? 1 : inOutCubic(seg(m1, e.delay, Math.min(1, e.delay + 0.75)))
      const np = new THREE.Vector3(...e.node.p)
      const up = new THREE.Vector3(...e.ui.p)
      e.g.position.lerpVectors(np, up, k)
      const sw = lerp(e.node.s[0], e.ui.s[0], k)
      const sh = lerp(e.node.s[1], e.ui.s[1], k)
      const d = lerp(0.16, 0.05, k)
      e.body.scale.set(sw, sh, d)
      e.faces.forEach((f) => {
        f.scale.set(sw * 0.985, sh * 0.985, 1)
        f.position.z = d / 2 + 0.003
      })
      const res = clamp01((m2 - e.delay * 0.6) / 0.55)
      const fo = (n: number) => ((e.faces[n].material as THREE.MeshBasicMaterial).opacity = [1 - seg(k, 0, 0.45), seg(k, 0.55, 1) * (1 - res), res][n] * (1 - o))
      fo(0)
      fo(1)
      fo(2)
      e.g.scale.setScalar(Math.max(pop, 0.0001))
      e.g.visible = pop > 0.002
    })
    // the frame (interface surface) rises behind the regions
    const fr = outCubic(seg(m1, 0.15, 0.85))
    this.frame.scale.set(lerp(0.7, 1, fr), lerp(0.7, 1, fr), 1)
    this.frame.visible = this.frameEdge.visible = fr > 0.002
    ;(this.frameEdge.material as THREE.MeshBasicMaterial).opacity = 0.28 * fr * (1 - o)
    this.frame.position.z = lerp(-0.6, 0, fr)
    this.frameEdge.position.z = this.frame.position.z - 0.03

    /* connections draw with the flow, then dissolve as it reorganises */
    const links = 1 - seg(m1, 0, 0.4)
    this.paths.forEach((p, i) => p.set(outCubic(seg(a, 0.1 + i * 0.14, 0.3 + i * 0.14)), (i === 4 ? 0.5 : 0.95) * links * (1 - o), 0, 0))
    ;(this.changes.children[0] as THREE.Mesh).visible = links > 0.01 && a > 0.5
    ;((this.changes.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.6 * outCubic(seg(a, 0.5, 0.75)) * links
    // pulse travels Start → Complete
    const pt = seg(a, 0.62, 1)
    const leg = Math.min(3, Math.floor(pt * 4))
    this.paths[leg].curve.getPoint(clamp01(pt * 4 - leg), this.pulse.position)
    this.pulse.visible = pt > 0 && pt < 1 && links > 0.5 && !c.still
    if (c.still && a >= 1 && m1 === 0) {
      this.pulse.visible = true
      this.paths[2].curve.getPoint(0.6, this.pulse.position)
    }

    /* interaction: plays once on arrival at the finished interface, then holds */
    const settled = T >= 2.95 && o === 0
    const wall = performance.now() / 1000
    if (!settled) this.arrivedAt = -1
    else if (this.arrivedAt < 0) this.arrivedAt = wall
    const tau = c.still ? 99 : settled ? wall - this.arrivedAt : -1
    this.play(tau, c.still)
  }

  /** τ = seconds since the dashboard settled (99 = final state for still images) */
  private play(tau: number, still: boolean) {
    const p = this.pointer
    const D = this.drawer.group
    const toast = this.toast.group
    if (tau < 0) {
      this.setState({ sel: -1, status: 'Pending', bar: 0, approved: false, pressed: false })
      p.group.visible = false
      D.visible = false
      toast.visible = false
      return
    }
    const row = this.at('rows', 500, 440, 0.3)
    const start = new THREE.Vector3(2.4, -1.4, 0.6)
    const btn = this.at('drawer', 320, 1188, 0.6)
    const away = new THREE.Vector3(2.2, -1.2, 0.6)
    let pos: THREE.Vector3
    if (tau < 0.9) pos = start.clone().lerp(row, inOutCubic(seg(tau, 0.1, 0.9)))
    else if (tau < 1.7) pos = row
    else if (tau < 2.5) pos = row.clone().lerp(btn, inOutCubic(seg(tau, 1.7, 2.5)))
    else if (tau < 3.6) pos = btn
    else pos = btn.clone().lerp(away, inOutCubic(seg(tau, 3.6, 4.4)))
    p.group.position.copy(pos)
    p.group.visible = !still && tau < 4.4
    const click1 = seg(tau, 0.9, 1.15)
    const click2 = seg(tau, 2.5, 2.75)
    const dip = Math.sin(click1 * Math.PI) + Math.sin(click2 * Math.PI)
    p.group.scale.setScalar(1 - dip * 0.15)
    const ring = p.ring.material as THREE.MeshBasicMaterial
    const rp = click1 > 0 && click1 < 1 ? click1 : click2
    p.ring.scale.setScalar(1 + rp * 3)
    ring.opacity = rp > 0 && rp < 1 ? (1 - rp) * 0.9 : 0

    // state machine
    const sel = tau >= 1.0 ? 1 : -1
    const pressed = tau >= 2.55 && tau < 2.8
    const approved = tau >= 2.75
    const bar = approved ? outCubic(seg(tau, 2.8, 3.3)) : 0
    this.setState({ sel, pressed, approved, status: approved ? 'Approved' : 'Pending', bar: Math.round(bar * 4) / 4 })

    // details drawer slides in over the rows
    const din = outCubic(seg(tau, 1.1, 1.7))
    const final = new THREE.Vector3(1.02, -0.1, 0.42)
    D.position.set(lerp(3.3, final.x, din), final.y, final.z)
    D.rotation.y = lerp(-0.5, 0, din)
    D.visible = din > 0.001
    // confirmation
    const tin = outBack(seg(tau, 3.0, 3.4), 1.6)
    toast.position.set(0.25, 1.42 + (1 - tin) * 0.2, 0.55)
    toast.scale.setScalar(Math.max(tin, 0.0001))
    toast.visible = tin > 0.01
  }

  dispose() {
    this.paths.forEach((p) => p.dispose())
  }
}

function makeSlab(w: number, h: number, d: number, painter: (x: Ctx2D, w: number, h: number) => void) {
  const g = new THREE.Group()
  const body = new THREE.Mesh(roundedBox(w, h, d, Math.min(w, h) * 0.08, 4), satin('#171d30', { metalness: 0.3, roughness: 0.25, clearcoat: 1 }))
  const surf = new Surface(Math.round(w * 560), Math.round(h * 560), painter)
  const face = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: surf.tex, transparent: true, toneMapped: false, depthWrite: false }))
  face.scale.set(w * 0.985, h * 0.985, 1)
  face.position.z = d / 2 + 0.003
  g.add(body, face)
  return { group: g, surf }
}

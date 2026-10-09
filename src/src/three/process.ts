/**
 * Design Approach — one framed process stage, five models (one per step):
 *  01 Map the workflow       labelled goal / pain-point / decision notes organise into a connected flow; a signal runs it
 *  02 Shape in low fidelity  one screen goes wireframe → typography → colour → detail, every element staying in place
 *  03 Prototype              select → open details → submit → validation → correct → success, with a pointer
 *  04 Systemise              colour / type / spacing tokens feed components that assemble desktop and mobile;
 *                            one token change propagates to both
 *  05 Hand off cleanly       desktop / mobile spec model: reflow, measurements, states, spec panel, final check
 * Switching steps slides the outgoing model out and the incoming one in (direction follows the step order);
 * each model then plays its own sequence once and holds. Illustrative process with neutral sample content.
 */
import * as THREE from 'three'
import type { View3D } from './engine'
import { COL, GlowPath, clamp01, damp, disposeTree, haloSprite, inOutCubic, lerp, outBack, outCubic, plane, roundedBox, satin, seg, sphere, type Quality } from './kit'
import { Surface, UI, chip, pointerMesh, rrect, skeleton, text, wireImage, type Painter } from './ui'
import { crispLabel } from './hero/tools'

const MONO = '"Geist Mono Variable", ui-monospace, monospace'
const bodyMat = (c = '#151b2c') => satin(c, { metalness: 0.4, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.1 })

/** modelled slab + crisp face(s); extra faces stack for cross-fades */
function slab(w: number, h: number, d: number, painters: Painter[], density = 480, bodyCol?: string) {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(roundedBox(w, h, d, Math.min(w, h) * 0.08, 4), bodyMat(bodyCol)))
  const surfs = painters.map((p) => new Surface(Math.min(2048, Math.round(w * density)), Math.min(2048, Math.round(h * density)), p))
  const faces = surfs.map((s, i) => {
    const m = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: s.tex, transparent: true, toneMapped: false, depthWrite: false, opacity: i === 0 ? 1 : 0 }))
    m.scale.set(w * 0.985, h * 0.985, 1)
    m.position.z = d / 2 + 0.002 + i * 0.0015
    g.add(m)
    return m
  })
  return { g, surfs, faces, w, h }
}
const op = (m: THREE.Mesh, v: number) => ((m.material as THREE.MeshBasicMaterial).opacity = v)
const H = (w: number, h: number) => (h / w) * 1000

interface Step {
  group: THREE.Group
  update(tau: number, still: boolean, clock: number): void
}

/* ═══════════════ 01 · Map the workflow ═══════════════ */
const NODES = [
  { k: 'USER GOAL', t: 'Get a request approved', c: UI.green, flow: [-1.62, 0.62, 0.1], loose: [-1.4, 1.2, 0.6, 0.25] },
  { k: 'TASK', t: 'Find the request', c: UI.accentSoft, flow: [0.02, 0.62, 0], loose: [1.3, 1.25, -0.4, -0.2] },
  { k: 'PAIN POINT', t: 'Too many steps', c: UI.red, flow: [0.02, 1.4, 0.2], loose: [-1.9, -0.9, 0.4, 0.3] },
  { k: 'DECISION', t: 'Approve or ask?', c: UI.amber, flow: [1.62, 0.05, -0.1], loose: [0.2, -1.25, 0.8, -0.15] },
  { k: 'TASK', t: 'Review details', c: UI.accentSoft, flow: [0.02, -0.52, 0], loose: [1.9, 0.1, -0.6, 0.2] },
  { k: 'OUTCOME', t: 'Request approved', c: UI.accent, flow: [-1.62, -0.52, 0.15], loose: [-0.4, 0.3, 1.2, -0.3] },
  { k: 'TASK', t: 'Ask for changes', c: UI.faint, flow: [1.62, -1.15, -0.1], loose: [1.0, -0.5, -1.0, 0.25] },
]
function paintNote(k: string, t: string, c: string, muted = false): Painter {
  return (x, w, h) => {
    const hh = H(w, h)
    rrect(x, 4, 4, 992, hh - 8, 60, muted ? '#161b2a' : '#1a2034', c + (muted ? '55' : '99'), 4)
    rrect(x, 40, 70, 24, hh - 140, 12, c)
    text(x, k, 100, hh * 0.32, 62, c, 650, 'left', MONO)
    text(x, t, 100, hh * 0.66, 92, muted ? UI.muted : UI.text, 600)
  }
}
class MapStep implements Step {
  group = new THREE.Group()
  private nodes: { s: ReturnType<typeof slab>; flow: THREE.Vector3; loose: THREE.Vector3; rz: number }[] = []
  private paths: GlowPath[] = []
  private pain: GlowPath
  private pulse = new THREE.Group()
  constructor() {
    NODES.forEach((n, i) => {
      const s = slab(1.2, 0.46, 0.1, [paintNote(n.k, n.t, n.c, i === 6)], 520)
      this.group.add(s.g)
      this.nodes.push({ s, flow: new THREE.Vector3(...(n.flow as [number, number, number])), loose: new THREE.Vector3(n.loose[0], n.loose[1], n.loose[2]), rz: n.loose[3] })
    })
    const P = (i: number) => this.nodes[i].flow
    const link = (a: number, b: number, muted = false) => {
      const sx = Math.abs(P(b).x - P(a).x) < 0.3 ? 0 : Math.sign(P(b).x - P(a).x)
      const sy = sx === 0 ? Math.sign(P(b).y - P(a).y) : 0
      const A = P(a).clone().add(new THREE.Vector3(sx * 0.6, sy * 0.24, 0))
      const B = P(b).clone().add(new THREE.Vector3(-sx * 0.6, -sy * 0.24, 0))
      const p = new GlowPath(
        [A, new THREE.Vector3(lerp(A.x, B.x, 0.45), lerp(A.y, B.y, 0.1), lerp(A.z, B.z, 0.3)), new THREE.Vector3(lerp(A.x, B.x, 0.6), lerp(A.y, B.y, 0.9), lerp(A.z, B.z, 0.7)), B],
        muted ? 0.008 : 0.016,
        muted ? '#56607e' : COL.blueSoft,
        '#ffffff',
        64,
      )
      p.mat.uniforms.uSpeed.value = 0
      this.group.add(p.mesh)
      return p
    }
    this.paths = [link(0, 1), link(1, 3), link(3, 4), link(4, 5), link(3, 6, true)]
    // pain point annotates "Find the request"
    const a = P(1).clone().add(new THREE.Vector3(0, 0.24, 0))
    const b = P(2).clone().add(new THREE.Vector3(0, -0.24, 0))
    this.pain = new GlowPath([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0.12, 0, 0.1)), b], 0.01, '#ff6b6b', '#ffd0d0', 32)
    this.pain.mat.uniforms.uSpeed.value = 0
    this.group.add(this.pain.mesh)
    this.pulse.add(new THREE.Mesh(sphere(0.07, 16), new THREE.MeshBasicMaterial({ color: '#fff', toneMapped: false })), haloSprite('#7d9bff', 0.75, 0.95))
    this.group.add(this.pulse)
  }
  update(tau: number, still: boolean) {
    const org = still ? 1 : seg(tau, 0.25, 1.5)
    this.nodes.forEach((n, i) => {
      const k = inOutCubic(clamp01((org - i * 0.06) / 0.7))
      n.s.g.position.lerpVectors(n.loose, n.flow, k)
      n.s.g.rotation.set(0, lerp(n.rz * 0.8, 0, k), lerp(n.rz, 0, k))
    })
    const draw = still ? 1 : seg(tau, 1.4, 2.1)
    this.paths.forEach((p, i) => p.set(outCubic(clamp01(draw * 1.3 - i * 0.12)), i === 4 ? 0.5 : 0.95, 0, 0))
    this.pain.set(still ? 1 : outCubic(seg(tau, 1.6, 2.0)), 0.8, 0, 0)
    const pt = still ? 0.999 : seg(tau, 2.1, 3.4)
    const leg = Math.min(3, Math.floor(pt * 4))
    this.paths[leg].curve.getPoint(clamp01(pt * 4 - leg), this.pulse.position)
    this.pulse.visible = !still && pt > 0 && pt < 1
    const goal = this.nodes[5].s.g
    const pop = !still && tau > 3.3 ? Math.sin(seg(tau, 3.3, 3.7) * Math.PI) * 0.08 : 0
    goal.scale.setScalar(1 + pop)
  }
}

/* ═══════════════ 02 · Shape in low fidelity ═══════════════ */
type Mode = 'wire' | 'type' | 'final'
const REG: Record<string, { p: [number, number]; s: [number, number] }> = {
  nav: { p: [0, 1.03], s: [3.6, 0.26] },
  side: { p: [-1.42, -0.15], s: [0.72, 1.86] },
  hero: { p: [0.38, 0.58], s: [2.76, 0.58] },
  s1: { p: [-0.53, -0.07], s: [0.86, 0.52] },
  s2: { p: [0.38, -0.07], s: [0.86, 0.52] },
  s3: { p: [1.29, -0.07], s: [0.86, 0.52] },
  list: { p: [0.38, -0.72], s: [2.76, 0.58] },
}
function regionPainter(key: string, mode: Mode): Painter {
  const wire = mode === 'wire'
  const color = mode === 'final'
  const bg = wire ? UI.wireFill : color ? '#171d31' : '#1a1d24'
  const ink = color ? UI.text : '#d6d9df'
  const sub = color ? UI.muted : '#8a8f99'
  const acc = color ? UI.accent : '#6b7079'
  return (x, w, h) => {
    const hh = H(w, h)
    rrect(x, 2, 2, 996, hh - 4, 22, bg, wire ? UI.wire : color ? '#26304f' : '#2c3038', 3)
    if (key === 'nav') {
      if (wire) {
        skeleton(x, 30, hh / 2, 120, 26)
        for (let i = 0; i < 3; i++) skeleton(x, 400 + i * 130, hh / 2, 90, 18)
        rrect(x, 860, hh / 2 - 22, 110, 44, 22, undefined, UI.wire, 3)
      } else {
        x.beginPath()
        x.arc(44 * x.u, (hh / 2) * x.u, 13 * x.u, 0, Math.PI * 2)
        x.fillStyle = acc
        x.fill()
        text(x, 'Studio', 66, hh / 2 + 1, 30, ink, 650)
        ;['Projects', 'Team', 'Reports'].forEach((t, i) => text(x, t, 400 + i * 130, hh / 2 + 1, 24, i === 0 ? ink : sub, 500))
        rrect(x, 860, hh / 2 - 22, 110, 44, 22, color ? UI.violet : '#5a5e66')
      }
    } else if (key === 'side') {
      for (let i = 0; i < 6; i++) {
        const y = 110 + i * 150
        if (wire) skeleton(x, 70, y, i === 0 ? 560 : 440, 40)
        else {
          if (i === 0) rrect(x, 40, y - 60, 920, 120, 26, color ? UI.accent + '33' : '#2a2e36')
          text(x, ['Overview', 'Projects', 'Tasks', 'Files', 'Team', 'Settings'][i], 80, y, 84, i === 0 ? ink : sub, i === 0 ? 650 : 500)
        }
      }
    } else if (key === 'hero') {
      if (wire) {
        skeleton(x, 40, 70, 360, 34)
        skeleton(x, 40, 140, 520, 20)
        wireImage(x, 640, 30, 170, 150)
        rrect(x, 840, 70, 130, 64, 32, undefined, UI.wire, 3)
      } else {
        text(x, 'Good morning, Sam', 40, 70, 46, ink, 650)
        text(x, '3 reviews waiting · 2 due today', 40, 140, 28, sub, 500)
        rrect(x, 640, 30, 170, 150, 16, color ? '#2a3870' : '#2a2e36')
        if (color) {
          for (let i = 0; i < 4; i++) rrect(x, 660 + i * 38, 150 - (i + 1) * 22, 24, (i + 1) * 22, 4, i === 3 ? UI.accentSoft : '#4a5aa0')
        }
      }
    } else if (key.startsWith('s')) {
      const i = Number(key[1]) - 1
      const lbl = ['Open', 'In review', 'Done'][i]
      const val = ['12', '4', '18'][i]
      const c = [UI.accentSoft, UI.amber, UI.green][i]
      if (wire) {
        skeleton(x, 60, 120, 300, 40)
        skeleton(x, 60, 300, 200, 90)
      } else {
        text(x, lbl, 60, 120, 70, sub, 500)
        text(x, val, 60, 320, 190, ink, 650)
        if (color) rrect(x, 60, 460, 160, 22, 11, c)
      }
    } else {
      for (let r = 0; r < 2; r++) {
        const y = 75 + r * 110
        if (wire) {
          wireImage(x, 30, y - 35, 70, 70)
          skeleton(x, 130, y - 10, 420, 22)
          skeleton(x, 130, y + 24, 260, 16)
          rrect(x, 820, y - 20, 150, 40, 20, undefined, UI.wire, 3)
        } else {
          rrect(x, 30, y - 35, 70, 70, 16, color ? ['#2b3a78', '#3a2f6b'][r] : '#2a2e36')
          text(x, ['Homepage review', 'Onboarding flow'][r], 130, y - 10, 30, ink, 600)
          text(x, ['Due today', 'Due Friday'][r], 130, y + 24, 22, sub, 500)
          if (color) chip(x, r === 0 ? 'In review' : 'Open', 970, y, r === 0 ? 'amber' : 'blue', 22, 'right')
          else rrect(x, 820, y - 20, 150, 40, 20, '#3a3e46')
        }
      }
    }
  }
}
const STAGES = ['Wireframe', 'Typography', 'Colour', 'Detail']
class LofiStep implements Step {
  group = new THREE.Group()
  private regions: ReturnType<typeof slab>[] = []
  private frame: THREE.Mesh
  private btn: ReturnType<typeof slab>
  private stage: Surface
  private stageN = -1
  constructor() {
    this.frame = new THREE.Mesh(roundedBox(3.84, 2.54, 0.06, 0.08), bodyMat('#0b0f19'))
    this.group.add(this.frame)
    Object.entries(REG).forEach(([key, r]) => {
      const s = slab(r.s[0], r.s[1], 0.05, [regionPainter(key, 'wire'), regionPainter(key, 'type'), regionPainter(key, 'final')], 480)
      s.g.position.set(r.p[0], r.p[1], 0.06)
      this.group.add(s.g)
      this.regions.push(s)
    })
    // primary action — gains its states in the "detail" stage
    this.btn = slab(0.62, 0.2, 0.06, [
      (x, w, h) => rrect(x, 0, 0, 1000, H(w, h), H(w, h) / 2, undefined, UI.wire, 8),
      (x, w, h) => {
        rrect(x, 0, 0, 1000, H(w, h), H(w, h) / 2, '#4b4f57')
        text(x, 'New task', 500, H(w, h) / 2 + 4, 120, '#e3e5ea', 650, 'center')
      },
      (x, w, h) => {
        rrect(x, 0, 0, 1000, H(w, h), H(w, h) / 2, UI.accent)
        text(x, '+  New task', 500, H(w, h) / 2 + 4, 120, '#ffffff', 650, 'center')
      },
    ])
    this.btn.g.position.set(1.4, 0.58, 0.12)
    this.group.add(this.btn.g)
    this.stage = new Surface(1600, 140, () => undefined)
    const sm = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: this.stage.tex, transparent: true, toneMapped: false, depthWrite: false }))
    sm.scale.set(3.4, 0.3, 1)
    sm.position.set(0, 1.62, 0.1)
    this.group.add(sm)
  }
  private paintStage(n: number) {
    if (n === this.stageN) return
    this.stageN = n
    this.stage.paint((x) => {
      STAGES.forEach((s, i) => {
        const X = 20 + i * 245
        const on = i <= n
        rrect(x, X, 6, 220, 64, 32, on ? (i === n ? UI.accent : '#24305e') : '#161b2a', on ? undefined : '#2a3352', 2)
        text(x, `${i + 1}  ${s}`, X + 110, 39, 26, on ? '#ffffff' : UI.faint, 600, 'center')
        if (i < 3) text(x, '→', X + 232, 39, 22, UI.faint, 600, 'center')
      })
    })
  }
  update(tau: number, still: boolean) {
    const t = still ? 99 : tau
    const typeK = outCubic(seg(t, 0.8, 1.5))
    const colK = outCubic(seg(t, 1.9, 2.6))
    const det = outCubic(seg(t, 3.0, 3.6))
    this.paintStage(t < 0.8 ? 0 : t < 1.9 ? 1 : t < 3.0 ? 2 : 3)
    this.regions.forEach((r, i) => {
      const lag = i * 0.03
      const tk = clamp01(typeK - lag)
      const ck = clamp01(colK - lag)
      op(r.faces[0], 1 - tk)
      op(r.faces[1], tk * (1 - ck))
      op(r.faces[2], ck)
      // detail: content cards gain a little elevation
      r.g.position.z = 0.06 + (i >= 3 && i <= 5 ? det * 0.08 : 0)
    })
    op(this.btn.faces[0], 1 - typeK)
    op(this.btn.faces[1], typeK * (1 - colK))
    op(this.btn.faces[2], colK)
    // detail: the button demonstrates hover → pressed
    const hov = still ? 0 : Math.sin(seg(t, 3.6, 4.4) * Math.PI)
    this.btn.g.position.z = 0.12 + det * 0.06 + hov * 0.05
    this.btn.g.scale.setScalar(1 + hov * 0.06)
  }
}

/* ═══════════════ 03 · Prototype the interaction ═══════════════ */
interface ProtoState {
  sel: number
  error: boolean
  typed: number
  done: boolean
  pressed: boolean
}
const ITEMS = ['Homepage review', 'Q3 budget', 'Onboarding flow', 'Access request']
const DATE = 'Fri 14 Oct'
class ProtoStep implements Step {
  group = new THREE.Group()
  private app: ReturnType<typeof slab>
  private detail: ReturnType<typeof slab>
  private toast: ReturnType<typeof slab>
  private ptr = pointerMesh(0.2)
  private st: ProtoState = { sel: -1, error: false, typed: 0, done: false, pressed: false }
  private key = ''
  private burst: THREE.Mesh
  constructor() {
    this.app = slab(3.6, 2.4, 0.07, [() => undefined], 440, '#0d111c')
    this.group.add(this.app.g)
    this.detail = slab(1.62, 2.06, 0.08, [() => undefined], 520)
    this.group.add(this.detail.g)
    this.toast = slab(1.5, 0.28, 0.06, [
      (x, w, h) => {
        const hh = H(w, h)
        rrect(x, 0, 0, 1000, hh, hh / 2, '#123826', UI.green, 4)
        text(x, '✓  Request submitted', 500, hh / 2 + 3, 90, '#c9f5df', 650, 'center')
      },
    ])
    this.group.add(this.toast.g)
    this.burst = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.12, 48), new THREE.MeshBasicMaterial({ color: UI.green, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }))
    this.group.add(this.burst, this.ptr.group)
    this.paint()
  }
  private paint() {
    const k = JSON.stringify(this.st)
    if (k === this.key) return
    this.key = k
    const st = this.st
    this.app.surfs[0].paint((x, w, h) => {
      const hh = H(w, h)
      rrect(x, 0, 0, 1000, hh, 24, UI.bg)
      rrect(x, 0, 0, 1000, 70, 24, UI.surface)
      text(x, 'Requests', 36, 36, 30, UI.text, 650)
      text(x, 'Prototype · interactive', 964, 36, 20, UI.faint, 600, 'right', MONO)
      ITEMS.forEach((t, i) => {
        const y = 140 + i * 120
        if (i === st.sel) rrect(x, 20, y - 50, 520, 100, 16, UI.accent + '2a', UI.accent, 2)
        rrect(x, 40, y - 26, 52, 52, 12, ['#2b3a78', '#3a2f6b', '#24454a', '#3d3326'][i])
        text(x, t, 112, y - 10, 28, UI.text, 600)
        text(x, i === 1 && st.done ? 'Submitted' : 'Draft', 112, y + 22, 21, i === 1 && st.done ? UI.green : UI.muted, 500)
      })
      if (st.sel < 0) text(x, 'Select a request', 770, hh / 2, 28, UI.faint, 500, 'center')
    })
    this.detail.surfs[0].paint((x, w, h) => {
      const hh = H(w, h)
      rrect(x, 0, 0, 1000, hh, 30, '#1a2034', '#34407a', 3)
      text(x, 'Q3 budget', 60, 100, 76, UI.text, 650)
      chip(x, st.done ? 'Submitted' : 'Draft', 60, 200, st.done ? 'green' : 'muted', 36)
      text(x, 'Owner', 60, 320, 42, UI.muted, 500)
      text(x, 'Finance team', 940, 320, 42, UI.text, 600, 'right')
      text(x, 'Due date', 60, 450, 42, st.error ? UI.red : UI.muted, 600)
      rrect(x, 60, 490, 880, 130, 22, '#121726', st.error ? UI.red : st.typed > 0 ? UI.accent : UI.line, 4)
      const typed = DATE.slice(0, st.typed)
      text(x, typed || 'dd / mm', 100, 556, 50, typed ? UI.text : UI.faint, 500)
      if (st.error) text(x, 'Add a due date to submit', 60, 680, 38, UI.red, 600)
      if (st.done) {
        rrect(x, 60, hh - 220, 880, 140, 70, UI.green + '33', UI.green, 3)
        text(x, '✓  Submitted', 500, hh - 150, 56, UI.green, 650, 'center')
      } else {
        rrect(x, 60, hh - 220, 880, 140, 70, st.pressed ? '#2448d6' : UI.accent)
        text(x, 'Submit', 500, hh - 150, 56, '#ffffff', 650, 'center')
      }
    })
  }
  /** detail-panel design coordinates → step-local position */
  private dAt(dx: number, dy: number) {
    const w = 1.62
    const h = 2.06
    const hh = H(w, h)
    return new THREE.Vector3(0.88 - w / 2 + (dx / 1000) * w, -0.1 + h / 2 - (dy / hh) * h, 0.5)
  }
  update(tau: number, still: boolean) {
    const t = still ? 99 : tau
    const item = new THREE.Vector3(-1.8 + 0.3 * 3.6, 1.2 - (260 / H(3.6, 2.4)) * 2.4, 0.3)
    const field = this.dAt(500, 556)
    const submit = this.dAt(500, H(1.62, 2.06) - 150)
    const start = new THREE.Vector3(2.2, -1.5, 0.6)
    const keys: [number, THREE.Vector3][] = [
      [0.2, start],
      [0.9, item],
      [1.6, item],
      [2.2, submit],
      [2.6, submit],
      [3.1, field],
      [4.0, field],
      [4.5, submit],
      [5.6, submit],
      [6.2, start],
    ]
    let pos = start
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, a] = keys[i]
      const [t1, b] = keys[i + 1]
      if (t >= t0 && t <= t1) pos = a.clone().lerp(b, inOutCubic(seg(t, t0, t1)))
      else if (t > t1) pos = b
    }
    this.ptr.group.position.copy(pos)
    this.ptr.group.visible = !still && t < 6.2
    const clicks = [0.95, 2.25, 3.15, 4.55]
    let ring = 0
    let dip = 0
    clicks.forEach((c) => {
      const k = seg(t, c, c + 0.3)
      if (k > 0 && k < 1) {
        ring = k
        dip = Math.sin(k * Math.PI)
      }
    })
    this.ptr.group.scale.setScalar(1 - dip * 0.15)
    this.ptr.ring.scale.setScalar(1 + ring * 3)
    op(this.ptr.ring, ring > 0 ? (1 - ring) * 0.9 : 0)

    Object.assign(this.st, {
      sel: t >= 1.0 ? 1 : -1,
      pressed: (t >= 2.3 && t < 2.5) || (t >= 4.6 && t < 4.8),
      error: t >= 2.45 && t < 3.25,
      typed: t < 3.3 ? 0 : Math.min(DATE.length, Math.floor(seg(t, 3.3, 4.0) * DATE.length + 0.001)),
      done: t >= 4.8,
    })
    this.paint()
    // the detail panel slides in from the right; a small shake on validation
    const din = outCubic(seg(t, 1.05, 1.6))
    const shake = this.st.error && !still ? Math.sin(seg(t, 2.45, 2.85) * Math.PI * 6) * 0.04 * (1 - seg(t, 2.45, 2.85)) : 0
    this.detail.g.position.set(lerp(3.4, 0.88, din) + shake, -0.1, 0.4)
    this.detail.g.rotation.y = lerp(-0.5, 0, din)
    this.detail.g.visible = din > 0.001
    const ok = outBack(seg(t, 4.9, 5.3), 1.6)
    this.toast.g.position.set(0, 1.36 + (1 - ok) * 0.2, 0.6)
    this.toast.g.scale.setScalar(Math.max(ok, 0.0001))
    this.toast.g.visible = ok > 0.01
    const b = seg(t, 4.8, 5.5)
    this.burst.position.copy(submit).add(new THREE.Vector3(0, 0, 0.05))
    this.burst.scale.setScalar(1 + b * 6)
    op(this.burst, b > 0 && b < 1 ? (1 - b) * 0.8 : 0)
  }
}

/* ═══════════════ 04 · Systemise ═══════════════ */
const ACC0 = new THREE.Color('#2F5BFF')
const ACC1 = new THREE.Color('#8E7CFF')
class SystemStep implements Step {
  group = new THREE.Group()
  private tokens: ReturnType<typeof slab>[] = []
  private comps: ReturnType<typeof slab>[] = []
  private desk: ReturnType<typeof slab>
  private phone: ReturnType<typeof slab>
  private links: GlowPath[] = []
  private out: GlowPath[] = []
  private acc = '#2F5BFF'
  private accN = -1
  constructor() {
    const tw = 1.15
    const th = 0.5
    ;[0, 1, 2].forEach((i) => {
      const s = slab(tw, th, 0.08, [() => undefined], 520)
      s.g.position.set(-2.15, 0.8 - i * 0.78, 0)
      this.group.add(s.g)
      this.tokens.push(s)
    })
    const cdef: [number, number][] = [
      [1.0, 0.3],
      [1.15, 0.32],
      [1.15, 0.62],
    ]
    cdef.forEach(([w, h], i) => {
      const s = slab(w, h, 0.07, [() => undefined], 560)
      s.g.position.set(-0.55, [0.85, 0.3, -0.45][i], 0)
      this.group.add(s.g)
      this.comps.push(s)
    })
    this.desk = slab(1.95, 1.3, 0.07, [() => undefined], 520, '#0d111c')
    this.desk.g.position.set(1.25, 0.2, 0)
    this.phone = slab(0.68, 1.36, 0.08, [() => undefined], 560, '#0d111c')
    this.phone.g.position.set(2.3, -0.3, 0.35)
    this.group.add(this.desk.g, this.phone.g)
    const L = (a: THREE.Vector3, b: THREE.Vector3, list: GlowPath[]) => {
      const p = new GlowPath([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0, 0.25)), b], 0.01, COL.blueSoft, '#ffffff', 40)
      p.mat.uniforms.uSpeed.value = 0
      this.group.add(p.mesh)
      list.push(p)
    }
    const tR = (i: number) => this.tokens[i].g.position.clone().add(new THREE.Vector3(tw / 2, 0, 0))
    const cL = (i: number) => this.comps[i].g.position.clone().add(new THREE.Vector3(-cdef[i][0] / 2, 0, 0))
    const cR = (i: number) => this.comps[i].g.position.clone().add(new THREE.Vector3(cdef[i][0] / 2, 0, 0))
    // colour → button, card; type → field, card; spacing → card
    L(tR(0), cL(0), this.links)
    L(tR(0), cL(2), this.links)
    L(tR(1), cL(1), this.links)
    L(tR(1), cL(2), this.links)
    L(tR(2), cL(2), this.links)
    ;[0, 1, 2].forEach((i) => L(cR(i), this.desk.g.position.clone().add(new THREE.Vector3(-0.97, 0.3 - i * 0.25, 0)), this.out))
    L(cR(0), this.phone.g.position.clone().add(new THREE.Vector3(-0.34, -0.4, 0.05)), this.out)
    this.repaint(0)
  }
  private repaint(k: number) {
    const n = Math.round(k * 6)
    if (n === this.accN) return
    this.accN = n
    const acc = '#' + ACC0.clone().lerp(ACC1, n / 6).getHexString()
    this.acc = acc
    const [ct, tt, st] = this.tokens
    ct.surfs[0].paint((x, w, h) => {
      const hh = H(w, h)
      rrect(x, 0, 0, 1000, hh, 40, '#171d31')
      text(x, 'COLOR', 50, 90, 52, UI.muted, 650, 'left', MONO)
      rrect(x, 50, 150, 180, 180, 30, acc)
      text(x, 'accent', 270, 200, 66, UI.text, 600)
      text(x, acc.toUpperCase(), 270, 285, 56, UI.muted, 500, 'left', MONO)
    })
    tt.surfs[0].paint((x, w, h) => {
      rrect(x, 0, 0, 1000, H(w, h), 40, '#171d31')
      text(x, 'TYPE', 50, 90, 52, UI.muted, 650, 'left', MONO)
      text(x, 'Aa', 50, 250, 150, UI.text, 600)
      text(x, 'heading 24 / body 16', 300, 250, 52, UI.muted, 500)
    })
    st.surfs[0].paint((x, w, h) => {
      rrect(x, 0, 0, 1000, H(w, h), 40, '#171d31')
      text(x, 'SPACING', 50, 90, 52, UI.muted, 650, 'left', MONO)
      ;[8, 16, 24].forEach((v, i) => {
        rrect(x, 50 + i * 290, 170, v * 7, 90, 10, acc + '88')
        text(x, String(v), 50 + i * 290 + v * 7 + 22, 218, 52, UI.text, 600)
      })
    })
    const [b, f, c] = this.comps
    b.surfs[0].paint((x, w, h) => {
      const hh = H(w, h)
      rrect(x, 0, 0, 1000, hh, hh / 2, acc)
      text(x, 'Button', 500, hh / 2 + 4, 120, '#ffffff', 650, 'center')
    })
    f.surfs[0].paint((x, w, h) => {
      const hh = H(w, h)
      rrect(x, 0, 0, 1000, hh, hh / 2, '#121726', acc, 6)
      text(x, 'Field', 70, hh / 2 + 4, 110, UI.muted, 500)
    })
    c.surfs[0].paint((x, w, h) => {
      const hh = H(w, h)
      rrect(x, 0, 0, 1000, hh, 50, '#171d31')
      text(x, 'Card', 60, 110, 100, UI.text, 650)
      skeleton(x, 60, 250, 600, 34, '#2f3a62')
      rrect(x, 60, 360, 300, 110, 55, acc)
    })
    this.desk.surfs[0].paint((x, w, h) => {
      const hh = H(w, h)
      rrect(x, 0, 0, 1000, hh, 30, UI.bg)
      rrect(x, 0, 0, 1000, 80, 30, UI.surface)
      text(x, 'Desktop · 1440', 40, 42, 32, UI.muted, 600, 'left', MONO)
      rrect(x, 760, 18, 200, 46, 23, acc)
      text(x, 'Button', 860, 42, 24, '#fff', 650, 'center')
      ;[0, 1, 2].forEach((i) => {
        const X = 40 + i * 315
        rrect(x, X, 120, 290, 260, 22, '#171d31')
        text(x, 'Card', X + 26, 170, 32, UI.text, 650)
        skeleton(x, X + 26, 230, 200, 14, '#2f3a62')
        rrect(x, X + 26, 290, 120, 50, 25, acc)
      })
      rrect(x, 40, 410, 600, 64, 32, '#121726', acc, 3)
      text(x, 'Field', 70, 442, 26, UI.muted, 500)
      rrect(x, 670, 410, 290, 64, 32, acc)
      text(x, 'Button', 815, 442, 26, '#fff', 650, 'center')
      void hh
    })
    this.phone.surfs[0].paint((x, w, h) => {
      const hh = H(w, h)
      rrect(x, 0, 0, 1000, hh, 110, UI.bg)
      rrect(x, 380, 40, 240, 50, 25, '#05070c')
      text(x, 'Mobile · 390', 70, 170, 64, UI.muted, 600, 'left', MONO)
      ;[0, 1].forEach((i) => {
        const Y = 250 + i * 520
        rrect(x, 60, Y, 880, 470, 50, '#171d31')
        text(x, 'Card', 110, Y + 90, 80, UI.text, 650)
        skeleton(x, 110, Y + 200, 500, 34, '#2f3a62')
        rrect(x, 110, Y + 300, 340, 110, 55, acc)
      })
      rrect(x, 60, hh - 230, 880, 140, 70, acc)
      text(x, 'Button', 500, hh - 158, 70, '#fff', 650, 'center')
    })
  }
  update(tau: number, still: boolean) {
    const t = still ? 99 : tau
    this.tokens.forEach((s, i) => {
      const k = outBack(seg(t, 0.2 + i * 0.15, 0.7 + i * 0.15), 1.4)
      s.g.scale.setScalar(Math.max(k, 0.0001))
    })
    const lk = seg(t, 1.0, 1.7)
    this.links.forEach((p, i) => p.set(outCubic(clamp01(lk * 1.4 - i * 0.08)), 0.85, 0, 0))
    this.comps.forEach((s, i) => s.g.scale.setScalar(Math.max(outBack(seg(t, 1.3 + i * 0.12, 1.8 + i * 0.12), 1.5), 0.0001)))
    const ok = seg(t, 2.0, 2.7)
    this.out.forEach((p, i) => p.set(outCubic(clamp01(ok * 1.3 - i * 0.08)), 0.7, 0, 0))
    const ik = outCubic(seg(t, 2.3, 3.0))
    this.desk.g.scale.setScalar(Math.max(lerp(0.85, 1, ik), 0.0001))
    this.phone.g.scale.setScalar(Math.max(lerp(0.85, 1, ik), 0.0001))
    op(this.desk.faces[0], ik)
    op(this.phone.faces[0], ik)
    this.desk.g.visible = this.phone.g.visible = ik > 0.002
    // one token change propagates: token → components → both interfaces
    const ch = still ? 1 : seg(t, 3.4, 4.6)
    this.repaint(ch)
    const pulseOn = !still && ch > 0 && ch < 1
    ;[...this.links, ...this.out].forEach((p, i) => {
      p.mat.uniforms.uPulse.value = pulseOn ? 1 : 0
      p.mat.uniforms.uPhase.value = clamp01(ch * 1.6 - (i >= this.links.length ? 0.5 : 0))
    })
    this.tokens[0].g.scale.setScalar(this.tokens[0].g.scale.x * (1 + (pulseOn ? Math.sin(seg(ch, 0, 0.3) * Math.PI) * 0.08 : 0)))
    void this.acc
  }
}

/* ═══════════════ 05 · Hand off cleanly ═══════════════ */
class HandoffStep implements Step {
  group = new THREE.Group()
  private desk: ReturnType<typeof slab>
  private phone: ReturnType<typeof slab>
  private cards: ReturnType<typeof slab>[] = []
  private reds: { g: THREE.Group; delay: number }[] = []
  private states: ReturnType<typeof slab>
  private spec: ReturnType<typeof slab>
  private scan: THREE.Mesh
  private check: THREE.Group
  constructor() {
    this.desk = slab(2.9, 1.82, 0.07, [
      (x, w, h) => {
        const hh = H(w, h)
        rrect(x, 0, 0, 1000, hh, 26, UI.bg)
        rrect(x, 0, 0, 1000, 70, 26, UI.surface)
        text(x, 'Projects', 36, 36, 30, UI.text, 650)
        rrect(x, 790, 16, 180, 40, 20, UI.accent)
        text(x, 'New project', 880, 37, 20, '#fff', 650, 'center')
        text(x, 'Recent', 36, 120, 24, UI.muted, 600)
      },
    ], 440, '#0d111c')
    this.desk.g.position.set(-0.95, 0.32, 0)
    this.phone = slab(0.86, 1.82, 0.09, [
      (x, w, h) => {
        const hh = H(w, h)
        rrect(x, 0, 0, 1000, hh, 120, UI.bg)
        rrect(x, 370, 40, 260, 56, 28, '#05070c')
        text(x, 'Projects', 70, 190, 80, UI.text, 650)
        rrect(x, 70, hh - 240, 860, 150, 75, UI.accent)
        text(x, 'New project', 500, hh - 162, 66, '#fff', 650, 'center')
      },
    ], 520, '#0d111c')
    this.phone.g.position.set(1.62, 0.32, 0.1)
    this.group.add(this.desk.g, this.phone.g)
    // three content cards: desktop row → stacked on mobile (responsive reflow)
    for (let i = 0; i < 3; i++) {
      const c = slab(0.82, 0.86, 0.05, [
        (x, w, h) => {
          const hh = H(w, h)
          rrect(x, 0, 0, 1000, hh, 50, '#171d31')
          rrect(x, 60, 60, 880, 380, 34, ['#2b3a78', '#3a2f6b', '#24454a'][i])
          text(x, ['Brand refresh', 'Onboarding', 'Help centre'][i], 60, 560, 90, UI.text, 650)
          text(x, ['12 screens', '8 screens', '5 screens'][i], 60, 680, 66, UI.muted, 500)
        },
      ], 400)
      this.group.add(c.g)
      this.cards.push(c)
    }
    const red = (label: string, w: number, pos: [number, number, number], delay: number, vertical = false) => {
      const g = new THREE.Group()
      const m = new THREE.MeshBasicMaterial({ color: '#FF5A5A', toneMapped: false, transparent: true, depthWrite: false })
      const bar = new THREE.Mesh(plane(), m)
      bar.scale.set(w, 0.012, 1)
      const c1 = new THREE.Mesh(plane(), m)
      c1.scale.set(0.012, 0.1, 1)
      c1.position.x = -w / 2
      const c2 = c1.clone()
      c2.position.x = w / 2
      const t = crispLabel(label, 0.11, '#FFB0B0', 650)
      t.position.y = 0.11
      if (vertical) t.rotation.z = -Math.PI / 2
      g.add(bar, c1, c2, t)
      g.position.set(...pos)
      if (vertical) g.rotation.z = Math.PI / 2
      this.group.add(g)
      this.reds.push({ g, delay })
    }
    red('1440 px', 2.9, [-0.95, 1.38, 0.1], 0)
    red('390 px', 0.86, [1.62, 1.38, 0.15], 0.1)
    red('24 px gap', 0.1, [-0.95 - 0.46, 0.08, 0.2], 0.2)
    red('16 px padding', 0.08, [-0.95 - 0.92 - 0.37, -0.32, 0.2], 0.3)
    // component states
    this.states = slab(2.9, 0.34, 0.05, [
      (x, w, h) => {
        const hh = H(w, h)
        rrect(x, 0, 0, 1000, hh, hh / 2, '#121726', '#26304f', 2)
        text(x, 'Button states', 30, hh / 2 + 2, 30, UI.muted, 600)
        ;[
          ['Default', UI.accent, '#fff'],
          ['Hover', '#4a70ff', '#fff'],
          ['Pressed', '#2246d0', '#fff'],
          ['Disabled', '#2a3045', '#7d859c'],
        ].forEach(([t, f, c], i) => {
          rrect(x, 240 + i * 186, 22, 170, hh - 44, (hh - 44) / 2, f)
          text(x, t, 325 + i * 186, hh / 2 + 2, 26, c, 650, 'center')
        })
      },
    ], 480)
    this.states.g.position.set(-0.95, -0.98, 0.05)
    this.group.add(this.states.g)
    this.spec = slab(1.5, 1.1, 0.06, [
      (x, w, h) => {
        const hh = H(w, h)
        rrect(x, 0, 0, 1000, hh, 40, '#151b2e', '#2f3a62', 3)
        text(x, 'SPEC · Button / Primary', 50, 80, 46, UI.accentSoft, 650, 'left', MONO)
        const rows: [string, string][] = [
          ['Height', '48 px'],
          ['Radius', '24 px'],
          ['Padding', '16 / 24 px'],
          ['Fill', 'color.accent'],
          ['Label', 'Geist 16 / 600'],
        ]
        rows.forEach(([k, v], i) => {
          const y = 175 + i * 110
          text(x, k, 50, y, 50, UI.muted, 500)
          text(x, v, 950, y, 50, UI.text, 600, 'right', MONO)
        })
        void hh
      },
    ], 500)
    this.spec.g.position.set(1.62, -1.0, 0.25)
    this.group.add(this.spec.g)
    this.scan = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ color: '#9fb3ff', transparent: true, opacity: 0, toneMapped: false, depthWrite: false }))
    this.scan.scale.set(0.02, 3.2, 1)
    this.group.add(this.scan)
    this.check = new THREE.Group()
    const ck = crispLabel('✓  Design and spec agree', 0.15, '#9fe8c7', 650)
    this.check.add(ck)
    this.check.position.set(0.3, -1.72, 0.3)
    this.group.add(this.check)
  }
  update(tau: number, still: boolean) {
    const t = still ? 99 : tau
    // reflow: three desktop cards; copies settle into a stacked mobile column
    const rf = inOutCubic(seg(t, 0.3, 1.3))
    this.cards.forEach((c, i) => {
      const desk = new THREE.Vector3(-0.95 - 0.92 + i * 0.92, -0.32 + 0.4, 0.06)
      const mob = new THREE.Vector3(1.62, 0.55 - i * 0.42, 0.16)
      c.g.position.copy(desk)
      c.g.scale.set(0.95, 0.95, 1)
      if (i < 2) {
        // the mobile copy
        let copy = c.g.userData.copy as THREE.Group | undefined
        if (!copy) {
          copy = c.g.clone()
          c.g.userData.copy = copy
          this.group.add(copy)
        }
        copy.position.lerpVectors(desk, mob, rf)
        const s = lerp(0.95, 0.88, rf)
        copy.scale.set(s, lerp(0.95, 0.46, rf), 1)
        copy.visible = rf > 0.001
      }
    })
    this.reds.forEach((r) => {
      const e = outCubic(seg(t, 1.3 + r.delay * 2, 1.8 + r.delay * 2))
      r.g.scale.set(Math.max(e, 0.0001), 1, 1)
      r.g.visible = e > 0.01
    })
    const sk = outBack(seg(t, 2.3, 2.8), 1.4)
    this.states.g.scale.setScalar(Math.max(sk, 0.0001))
    const sp = outBack(seg(t, 2.8, 3.3), 1.4)
    this.spec.g.scale.setScalar(Math.max(sp, 0.0001))
    // final check: a scan compares the design with the spec
    const sc = seg(t, 3.6, 4.4)
    this.scan.position.set(lerp(-2.4, 2.5, sc), 0, 0.35)
    op(this.scan, !still && sc > 0 && sc < 1 ? 0.85 : 0)
    const ck = outBack(seg(t, 4.3, 4.7), 1.8)
    this.check.scale.setScalar(Math.max(ck, 0.0001))
    this.check.visible = ck > 0.01
  }
}

/* ═══════════════ view ═══════════════ */
export class ProcessView implements View3D {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(30, 1.4, 0.1, 80)
  private steps: Step[]
  private holders: THREE.Group[] = []
  private current = 0
  private prev = -1
  private dir = 1
  private switchAt = -10
  private still: boolean
  private aspect = 1.4
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  private onPointer = (e: PointerEvent) => {
    this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
    this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1
  }

  constructor(env: THREE.Texture, _q: Quality, still = false, initial = 0) {
    this.still = still
    this.scene.environment = env
    const hemi = new THREE.HemisphereLight('#c7d2ff', '#0b0c10', 0.8)
    const key = new THREE.DirectionalLight('#ffffff', 2.2)
    key.position.set(4, 6, 7)
    const rim = new THREE.DirectionalLight('#5b7cff', 1.2)
    rim.position.set(-6, 2, -4)
    this.scene.add(hemi, key, rim)
    this.steps = [new MapStep(), new LofiStep(), new ProtoStep(), new SystemStep(), new HandoffStep()]
    this.steps.forEach((s) => {
      const h = new THREE.Group()
      h.add(s.group)
      h.visible = false
      this.holders.push(h)
      this.scene.add(h)
    })
    this.current = initial
    this.holders[initial].visible = true
    this.switchAt = still ? -10 : performance.now() / 1000
  }

  get step() {
    return this.current
  }

  setStep(i: number) {
    if (i === this.current) return
    this.prev = this.current
    this.dir = i > this.current ? 1 : -1
    this.current = i
    this.switchAt = performance.now() / 1000
  }
  /** restart the current model's sequence (e.g. when it scrolls back into view) */
  replay() {
    this.switchAt = performance.now() / 1000 - 0.7
  }

  activate(on: boolean) {
    if (on && window.matchMedia('(pointer: fine)').matches) window.addEventListener('pointermove', this.onPointer, { passive: true })
    else window.removeEventListener('pointermove', this.onPointer)
  }

  setQuality() {}

  /** the box each model is composed in (world units) — the camera keeps it fully in view */
  private static BOX: [number, number][] = [
    [4.6, 3.3],
    [4.0, 3.6],
    [3.9, 3.45],
    [5.6, 2.8],
    [4.8, 3.8],
  ]
  private fitDist(i: number) {
    const [bw, bh] = ProcessView.BOX[i]
    const t = Math.tan(THREE.MathUtils.degToRad(15))
    return Math.max(bh / 2 / t, bw / 2 / (t * this.aspect)) * 1.08
  }
  resize(w: number, h: number) {
    this.aspect = w / h
    this.camera.aspect = this.aspect
    this.camera.position.set(0, 0, this.fitDist(this.current))
    this.camera.updateProjectionMatrix()
  }

  update(dt: number, _elapsed: number) {
    const wall = performance.now() / 1000
    const since = this.still ? 99 : wall - this.switchAt
    const p = this.pointer
    p.x = damp(p.x, this.still ? 0 : p.tx, 3, dt)
    p.y = damp(p.y, this.still ? 0 : p.ty, 3, dt)
    // camera eases to the framing of the current model (it never crops)
    const want = this.fitDist(this.current)
    this.camera.position.z = this.still ? want : damp(this.camera.position.z, want, 3.5, dt)
    // outgoing slides fully out first, then the incoming model slides in from the other side
    const outK = this.still ? 1 : seg(since, 0, 0.45)
    const inK = this.still ? 1 : outCubic(seg(since, 0.4, 1.0))
    this.holders.forEach((h, i) => {
      const isCur = i === this.current
      const isPrev = i === this.prev && outK < 1
      h.visible = isCur ? inK > 0.001 || this.still : isPrev
      if (!h.visible) return
      if (isCur) h.position.x = (1 - inK) * 7.5 * this.dir
      else h.position.x = -outK * outK * 7.5 * this.dir
      h.rotation.set(-0.08 - p.y * 0.04, -0.12 + p.x * 0.07 - (h.position.x / 7.5) * 0.35, 0)
    })
    // each model plays its own sequence once it has arrived, then holds
    this.steps[this.current].update(this.still ? 99 : Math.max(0, since - 0.85), this.still, wall)
  }

  dispose() {
    window.removeEventListener('pointermove', this.onPointer)
    disposeTree(this.scene)
  }
}

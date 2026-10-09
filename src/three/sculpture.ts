/**
 * Design Approach — the "process sculpture". One composition carried through the five steps:
 *   -1  loose observations           (notes and questions)
 *    0  Map the workflow             notes gather; the same pieces become a flow in depth; a signal runs start → goal
 *    1  Shape it in low fidelity     nodes flatten onto a frame as wireframe regions; a guide sweeps the grid
 *    2  Prototype the interaction    the frame turns; the action is pressed and links to a second, edge-case state
 *    3  Systemise                    the layers separate; a master component sends instances into both screens
 *    4  Hand off cleanly             layers settle; a responsive pair with redlines, sizes and component states
 * The continuous value `s` (tweened by the page) interpolates every element between neighbouring states, so
 * scrolling up plays the same transformation backwards. Each state also has one focal moment that plays once
 * on arrival. Illustrative process — sample content, not client work.
 */
import * as THREE from 'three'
import type { View3D } from './engine'
import { COL, MONO, GlowPath, clamp01, damp, disposeTree, glow, haloSprite, label, lerp, outBack, outCubic, plane, roundedBox, satin, seg, smooth, sphere, torus, unitEdges, unitSlab, type Quality } from './kit'

type V3 = [number, number, number]
interface ES {
  p: V3
  s: V3
  ry?: number
  rx?: number
  rz?: number
  o?: number
  /** 0 wire … 1 solid surface */
  solid?: number
  c?: string
}
type Id = 'B0' | 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'N0' | 'N1' | 'N2' | 'N3' | 'Q0' | 'Q1' | 'F' | 'S2' | 'M' | 'SP' | 'I1' | 'I2'
const IDS: Id[] = ['F', 'S2', 'M', 'B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'N0', 'N1', 'N2', 'N3', 'Q0', 'Q1', 'SP', 'I1', 'I2']

const PAPER = '#e9e6dc'
const NODE = '#1d2436'
const DARK = '#141a29'
const WIRE = '#10141f'

/* wireframe layout, relative to the frame centre (frame 5.4 × 3.6) */
const L: Record<'B0' | 'B1' | 'B2' | 'B3' | 'B4' | 'B5', { p: V3; s: V3 }> = {
  B0: { p: [0, 1.45, 0.08], s: [5.0, 0.38, 0.05] },
  B1: { p: [-2.05, -0.25, 0.08], s: [0.9, 2.75, 0.05] },
  B2: { p: [-0.6, 0.6, 0.08], s: [1.75, 1.0, 0.05] },
  B3: { p: [1.45, 0.6, 0.08], s: [1.75, 1.0, 0.05] },
  B4: { p: [0.42, -0.88, 0.08], s: [3.85, 1.5, 0.05] },
  B5: { p: [-0.72, -1.28, 0.12], s: [1.05, 0.32, 0.09] },
}
const S2_BTN: V3 = [0, -0.95, 0.12]

/** place a frame-relative element inside a frame transform */
function inFrame(frame: { p: V3; ry: number; k: number }, local: { p: V3; s: V3 }, lift = 0, extra: Partial<ES> = {}): ES {
  const c = Math.cos(frame.ry)
  const s = Math.sin(frame.ry)
  const x = local.p[0] * frame.k
  const z = (local.p[2] + lift) * frame.k
  return {
    p: [frame.p[0] + x * c + z * s, frame.p[1] + local.p[1] * frame.k, frame.p[2] - x * s + z * c],
    s: [local.s[0] * frame.k, local.s[1] * frame.k, local.s[2] * frame.k],
    ry: frame.ry,
    ...extra,
  }
}
const hid = (p: V3, s: V3 = [0.3, 0.3, 0.05]): ES => ({ p, s, o: 0 })

const F1 = { p: [0, 0, 0] as V3, ry: 0, k: 1 }
const F2 = { p: [-1.25, 0.1, -0.2] as V3, ry: 0.28, k: 0.74 }
const F3 = { p: [-1.25, 0.1, -0.9] as V3, ry: 0.28, k: 0.74 }
const F4 = { p: [-1.05, 0.15, 0] as V3, ry: 0.1, k: 0.78 }
const S2P = { p: [2.15, -0.05, 0.55] as V3, ry: -0.38, k: 1 }

function frameState(F: typeof F1, solid: number, styled: boolean, lift = [0, 0, 0]): Partial<Record<Id, ES>> {
  const col = (id: keyof typeof L) =>
    !styled ? WIRE : id === 'B5' ? '#2F5BFF' : id === 'B2' ? '#22306a' : id === 'B3' ? '#2d2a5e' : id === 'B0' ? '#1a2032' : DARK
  const out: Partial<Record<Id, ES>> = {
    F: { p: [F.p[0], F.p[1], F.p[2] + lift[0]], s: [5.4 * F.k, 3.6 * F.k, 0.06], ry: F.ry, solid: Math.max(0.35, solid * 0.9), c: '#0f1422' },
  }
  ;(Object.keys(L) as (keyof typeof L)[]).forEach((id) => {
    out[id] = inFrame(F, L[id], id === 'B5' ? lift[2] : lift[1], { solid, c: col(id) })
  })
  return out
}

const S: Record<number, Partial<Record<Id, ES>>> = {
  /* -1 · loose observations */
  [-1]: {
    B0: { p: [-2.4, 1.3, 0.6], s: [0.95, 0.72, 0.05], rx: 0.2, ry: 0.35, rz: -0.18, solid: 1, c: PAPER },
    B1: { p: [-0.6, 1.75, -0.8], s: [0.95, 0.72, 0.05], rx: -0.1, ry: -0.3, rz: 0.12, solid: 1, c: PAPER },
    B2: { p: [1.3, 1.25, 0.3], s: [0.95, 0.72, 0.05], rx: 0.25, ry: 0.4, rz: 0.1, solid: 1, c: PAPER },
    B3: { p: [2.55, -0.2, -0.5], s: [0.95, 0.72, 0.05], rx: -0.2, ry: -0.5, rz: -0.14, solid: 1, c: PAPER },
    B4: { p: [-1.6, -1.25, 0.2], s: [0.95, 0.72, 0.05], rx: 0.1, ry: 0.5, rz: 0.2, solid: 1, c: PAPER },
    B5: { p: [0.9, -1.55, 0.9], s: [0.95, 0.72, 0.05], rx: -0.3, ry: -0.2, rz: -0.1, solid: 1, c: PAPER },
    N0: { p: [0.1, 0.35, 1.1], s: [0.7, 0.55, 0.04], rx: 0.15, ry: 0.2, rz: 0.2, solid: 1, c: '#d8dff3' },
    N1: { p: [-2.7, -0.15, -0.6], s: [0.7, 0.55, 0.04], rx: -0.2, ry: 0.4, rz: -0.25, solid: 1, c: '#d8dff3' },
    N2: { p: [2.2, 1.95, -1.0], s: [0.7, 0.55, 0.04], rx: 0.1, ry: -0.5, rz: 0.15, solid: 1, c: '#d8dff3' },
    N3: { p: [2.45, -1.75, 0.4], s: [0.7, 0.55, 0.04], rx: 0.3, ry: -0.3, rz: 0.3, solid: 1, c: '#d8dff3' },
    Q0: { p: [-0.9, -0.1, 0.6], s: [0.42, 0.42, 0.1], rx: 0.2, solid: 1, c: '#2F5BFF' },
    Q1: { p: [0.95, -0.3, -0.7], s: [0.42, 0.42, 0.1], rx: -0.2, solid: 1, c: '#2F5BFF' },
  },
  /* 0 · Map the workflow — pathways in depth */
  0: {
    B0: { p: [-2.7, 0, 0], s: [1.15, 0.5, 0.24], solid: 1, c: NODE },
    B1: { p: [-0.95, 1.25, -0.5], s: [1.15, 0.5, 0.24], solid: 1, c: NODE },
    B2: { p: [-0.95, -1.25, 0.5], s: [1.15, 0.5, 0.24], solid: 1, c: NODE },
    B3: { p: [0.85, 0, 0], s: [1.15, 0.5, 0.24], solid: 1, c: NODE },
    B4: { p: [2.65, 0.05, 0.35], s: [1.25, 0.56, 0.28], solid: 1, c: '#22306a' },
    B5: hid([2.65, 0.05, 0.35]),
    N0: hid([-0.95, 1.25, -0.5]),
    N1: hid([-2.7, 0, 0]),
    N2: hid([0.85, 0, 0]),
    N3: hid([-0.95, -1.25, 0.5]),
    Q0: hid([-0.95, -1.25, 0.5], [0.2, 0.2, 0.05]),
    Q1: hid([0.85, 0, 0], [0.2, 0.2, 0.05]),
  },
  /* 1 · Shape it in low fidelity */
  1: { ...frameState(F1, 0.06, false) },
  /* 2 · Prototype the interaction */
  2: {
    ...frameState(F2, 0.42, false),
    S2: { p: S2P.p, s: [2.15, 2.85, 0.06], ry: S2P.ry, solid: 0.55, c: '#121726' },
    I2: inFrame(S2P, { p: S2_BTN, s: [1.3, 0.3, 0.08] }, 0, { solid: 0.4, c: WIRE }),
  },
  /* 3 · Systemise — layers separate, components instanced */
  3: {
    ...frameState(F3, 1, true, [-0.45, 0.3, 0.75]),
    S2: { p: [S2P.p[0], S2P.p[1], S2P.p[2] - 0.4], s: [2.15, 2.85, 0.06], ry: S2P.ry, solid: 0.9, c: '#121726' },
    SP: { p: [0.35, 2.15, 0.9], s: [1.1, 0.36, 0.16], solid: 1, c: '#2F5BFF' },
    I1: inFrame(F3, L.B5, 0.75, { solid: 1, c: '#5c7cff' }),
    I2: inFrame(S2P, { p: [S2_BTN[0], S2_BTN[1], S2_BTN[2] + 0.35], s: [1.3, 0.3, 0.08] }, 0, { solid: 1, c: '#5c7cff' }),
  },
  /* 4 · Hand off cleanly — responsive pair */
  4: {
    ...frameState(F4, 1, true),
    S2: { p: [2.6, -0.2, -1.4], s: [1.2, 1.6, 0.06], ry: -0.3, o: 0, solid: 0.9, c: '#121726' },
    M: { p: [2.55, -0.15, 0.35], s: [1.22, 2.5, 0.12], ry: -0.22, solid: 1, c: '#0d111b' },
    I1: inFrame(F4, L.B5, 0.02, { solid: 1, c: '#2F5BFF', o: 0 }),
    I2: { p: [2.55, -1.0, 0.45], s: [0.9, 0.24, 0.06], ry: -0.22, solid: 1, c: '#2F5BFF' },
  },
}
// fill gaps: an element missing from a state stays hidden near its neighbour state's position
const ORDER = [-1, 0, 1, 2, 3, 4]
for (const id of IDS) {
  let last: ES | undefined
  for (const k of ORDER) {
    if (S[k][id]) last = S[k][id]
  }
  for (const k of ORDER) {
    if (!S[k][id]) {
      const near = ORDER.map((j) => S[j][id]).find(Boolean) ?? last
      S[k][id] = near ? { ...near, o: 0 } : hid([0, 0, 0])
    }
  }
}
const RIG: Record<number, [number, number]> = { [-1]: [0.22, -0.3], 0: [0.48, -0.22], 1: [0.1, -0.1], 2: [0.08, -0.32], 3: [0.22, -0.62], 4: [0.12, -0.3] }

interface El {
  id: Id
  g: THREE.Group
  body: THREE.Mesh
  edges: THREE.LineSegments
  mat: THREE.MeshPhysicalMaterial
  emat: THREE.LineBasicMaterial
  label?: THREE.Mesh
}

const FLOW_LABEL: Partial<Record<Id, string>> = { B0: 'Start', B1: 'Explore', B2: 'Search', B3: 'Review', B4: 'Complete' }
const NOTE_LABEL: Partial<Record<Id, string>> = { B0: 'User goal', B1: 'Pain point', B2: 'Question', B3: 'Opportunity', B4: 'Constraint', B5: 'Next step' }

export class Sculpture implements View3D {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(30, 1.25, 0.1, 80)
  /** written by the page (GSAP tween) */
  s = -1
  private target = -1
  private arrivedAt = -10

  private still: boolean
  private rig = new THREE.Group()
  private els = new Map<Id, El>()
  private flowPaths: GlowPath[] = []
  private protoPath: GlowPath
  private sysPaths: GlowPath[] = []
  private pulse: THREE.Group
  private ripple: THREE.Mesh
  private alert: THREE.Group
  private guide: THREE.Mesh
  private grid: THREE.LineSegments
  private redlines: { g: THREE.Group; delay: number }[] = []
  private pills: THREE.Group[] = []
  private phoneUi: THREE.Group
  private check: THREE.Group
  private noteLabels: THREE.Mesh[] = []
  private flowLabels: THREE.Mesh[] = []
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  private tmpC = new THREE.Color()
  private tmpC2 = new THREE.Color()

  constructor(env: THREE.Texture, _q: Quality, still = false) {
    this.still = still
    this.scene.environment = env
    this.camera.position.set(0, 0.1, 11)
    const hemi = new THREE.HemisphereLight('#c7d2ff', '#0b0c10', 0.8)
    const key = new THREE.DirectionalLight('#ffffff', 2.6)
    key.position.set(4, 6, 7)
    const glowLight = new THREE.PointLight('#5b7cff', 7, 18, 2)
    glowLight.position.set(-3, -2.5, 7)
    this.scene.add(glowLight)
    const rim = new THREE.DirectionalLight('#5b7cff', 1.4)
    rim.position.set(-6, 2, -4)
    this.scene.add(hemi, key, rim, this.rig)

    for (const id of IDS) {
      const g = new THREE.Group()
      const mat = satin('#ffffff', { transparent: true, clearcoat: 1, clearcoatRoughness: 0.18, roughness: 0.38 })
      const body = new THREE.Mesh(id === 'Q0' || id === 'Q1' ? new THREE.CylinderGeometry(0.5, 0.5, 1, 40).rotateX(Math.PI / 2) : unitSlab(), mat)
      const emat = new THREE.LineBasicMaterial({ color: id === 'B5' ? '#9fb3ff' : '#7d9bff', transparent: true })
      const edges = new THREE.LineSegments(unitEdges(), emat)
      g.add(body, edges)
      if (id === 'Q0' || id === 'Q1') {
        const q = label('?', 0.3, { size: 80, weight: 600, color: '#ffffff' })
        q.position.z = 0.06
        g.add(q)
      }
      this.rig.add(g)
      this.els.set(id, { id, g, body, edges, mat, emat })
    }
    // labels: observations on the notes, step names on the flow nodes
    ;(Object.keys(NOTE_LABEL) as Id[]).forEach((id) => {
      const l = label(NOTE_LABEL[id]!, 0.17, { size: 48, weight: 550, color: '#2a2a2a' })
      l.position.z = 0.04
      this.els.get(id)!.g.add(l)
      this.noteLabels.push(l)
    })
    ;(Object.keys(FLOW_LABEL) as Id[]).forEach((id) => {
      const l = label(FLOW_LABEL[id]!, 0.18, { size: 52, weight: 550, color: '#eef2ff' })
      l.position.z = 0.15
      this.els.get(id)!.g.add(l)
      this.flowLabels.push(l)
    })

    /* flow connectors (state 0) */
    const P = (id: Id) => new THREE.Vector3(...S[0][id]!.p)
    const link = (a: Id, b: Id) => {
      const A = P(a).add(new THREE.Vector3(0.6, 0, 0))
      const B = P(b).add(new THREE.Vector3(-0.6, 0, 0))
      const m1 = new THREE.Vector3(lerp(A.x, B.x, 0.45), lerp(A.y, B.y, 0.15), lerp(A.z, B.z, 0.3))
      const m2 = new THREE.Vector3(lerp(A.x, B.x, 0.6), lerp(A.y, B.y, 0.85), lerp(A.z, B.z, 0.75))
      const p = new GlowPath([A, m1, m2, B], 0.024, COL.blueSoft, '#ffffff', 64)
      p.mat.uniforms.uSpeed.value = 0
      this.rig.add(p.mesh)
      return p
    }
    this.flowPaths = [link('B0', 'B1'), link('B0', 'B2'), link('B1', 'B3'), link('B2', 'B3'), link('B3', 'B4')]
    this.pulse = new THREE.Group()
    this.pulse.add(new THREE.Mesh(sphere(0.07, 16), new THREE.MeshBasicMaterial({ color: '#fff', toneMapped: false, transparent: true })))
    this.pulse.add(haloSprite('#7d9bff', 0.7, 0.9))
    this.rig.add(this.pulse)

    /* wireframe grid + guide (state 1) */
    const pts: number[] = []
    for (let i = 0; i <= 12; i++) {
      const x = -2.5 + (i * 5) / 12
      pts.push(x, -1.7, 0.04, x, 1.7, 0.04)
    }
    const gg = new THREE.BufferGeometry()
    gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    this.grid = new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: '#3b4d8f', transparent: true, opacity: 0 }))
    this.els.get('F')!.g.add(this.grid)
    this.guide = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ color: '#9fb3ff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }))
    this.guide.scale.set(0.02, 3.6, 1)
    this.guide.position.z = 0.1
    this.els.get('F')!.g.add(this.guide)

    /* prototype link + ripple + edge-case alert (state 2) */
    const b5 = inFrame(F2, L.B5)
    const A = new THREE.Vector3(b5.p[0] + 0.45, b5.p[1], b5.p[2] + 0.1)
    const s2 = S[2].S2!
    const B = new THREE.Vector3(s2.p[0] - 1.0, s2.p[1] - 0.6, s2.p[2] + 0.3)
    this.protoPath = new GlowPath([A, new THREE.Vector3(lerp(A.x, B.x, 0.4), A.y + 0.9, A.z + 0.8), new THREE.Vector3(lerp(A.x, B.x, 0.75), B.y + 0.5, B.z + 0.6), B], 0.018, '#9fb3ff', '#ffffff', 64)
    this.protoPath.mat.uniforms.uSpeed.value = 0
    this.rig.add(this.protoPath.mesh)
    this.ripple = new THREE.Mesh(torus(0.5, 0.012, 64), glow('#9fb3ff', 0))
    this.rig.add(this.ripple)
    this.alert = new THREE.Group()
    const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 40).rotateX(Math.PI / 2), satin('#f0a640', { emissive: new THREE.Color('#7a4a00'), emissiveIntensity: 0.6, clearcoat: 1 }))
    const bang = label('!', 0.26, { size: 80, weight: 700, color: '#1a1206' })
    bang.position.z = 0.06
    const atext = label('Check required fields', 0.12, { size: 44, weight: 500, color: '#f2d3a0' })
    atext.position.set(0.3 + atext.scale.x / 2, 0, 0.02)
    this.alert.add(puck, bang, atext)
    this.rig.add(this.alert)

    /* system links (state 3) */
    const sp = new THREE.Vector3(...S[3].SP!.p)
    ;[S[3].I1!, S[3].I2!].forEach((t) => {
      const T = new THREE.Vector3(...t.p)
      const p = new GlowPath([sp, sp.clone().lerp(T, 0.5).add(new THREE.Vector3(0, 0.6, 0.6)), T], 0.012, COL.blueSoft, '#ffffff', 48)
      p.mat.uniforms.uSpeed.value = 0
      this.sysPaths.push(p)
      this.rig.add(p.mesh)
    })

    /* hand-off: redlines, sizes, component states, phone content (state 4) */
    const red = (w: number, text: string, pos: V3, ry: number, delay: number, vertical = false) => {
      const g = new THREE.Group()
      const m = new THREE.MeshBasicMaterial({ color: COL.red, transparent: true, toneMapped: false, depthWrite: false })
      const bar = new THREE.Mesh(plane(), m)
      bar.scale.set(w, 0.018, 1)
      const c1 = new THREE.Mesh(plane(), m)
      c1.scale.set(0.018, 0.16, 1)
      c1.position.x = -w / 2
      const c2 = c1.clone()
      c2.position.x = w / 2
      const t = label(text, 0.15, { size: 44, weight: 600, color: '#ff9a9a', font: MONO })
      t.position.y = 0.16
      g.add(bar, c1, c2, t)
      g.position.set(...pos)
      g.rotation.y = ry
      if (vertical) g.rotation.z = Math.PI / 2
      this.rig.add(g)
      this.redlines.push({ g, delay })
    }
    const f4b2 = inFrame(F4, L.B2)
    const f4b3 = inFrame(F4, L.B3)
    const gapX = (f4b2.p[0] + f4b2.s[0] / 2 + f4b3.p[0] - f4b3.s[0] / 2) / 2
    red(0.42, '24', [gapX, f4b2.p[1] + 0.05, f4b2.p[2] + 0.12], F4.ry, 0)
    red(5.4 * F4.k, '1440 px', [F4.p[0], F4.p[1] + 1.8 * F4.k + 0.3, F4.p[2]], F4.ry, 0.12)
    red(1.22, '390 px', [2.55, 1.55, 0.35], -0.22, 0.24)
    ;['Default', 'Hover', 'Disabled'].forEach((t, i) => {
      const g = new THREE.Group()
      const pill = new THREE.Mesh(roundedBox(1.0, 0.3, 0.08, 0.14), satin(i === 2 ? '#2a2f42' : COL.blue, { emissive: new THREE.Color(i === 1 ? '#3d63ff' : '#000000'), emissiveIntensity: i === 1 ? 0.6 : 0, clearcoat: 1 }))
      const l = label(t, 0.12, { size: 44, weight: 600, color: i === 2 ? '#8c93a8' : '#ffffff' })
      l.position.z = 0.05
      g.add(pill, l)
      g.position.set(F4.p[0] - 1.3 + i * 1.15, F4.p[1] - 1.8 * F4.k - 0.5, F4.p[2] + 0.2)
      g.rotation.y = F4.ry
      this.rig.add(g)
      this.pills.push(g)
    })
    this.phoneUi = new THREE.Group()
    const ui = (x: number, y: number, w: number, h: number, c: string) => {
      const m = new THREE.Mesh(roundedBox(w, h, 0.03, Math.min(w, h) * 0.2), satin(c, { clearcoat: 0.6 }))
      m.position.set(x, y, 0.08)
      this.phoneUi.add(m)
    }
    ui(0, 0.92, 0.95, 0.16, '#1a2032')
    ui(0, 0.5, 0.95, 0.5, '#22306a')
    ui(0, -0.05, 0.95, 0.42, '#2d2a5e')
    ui(0, -0.5, 0.95, 0.3, DARK)
    this.els.get('M')!.g.add(this.phoneUi)
    this.check = new THREE.Group()
    const ring = new THREE.Mesh(torus(0.2, 0.025, 48), glow('#58e0a8', 0.95))
    const tick = label('✓', 0.26, { size: 80, weight: 700, color: '#58e0a8' })
    this.check.add(ring, tick)
    this.check.position.set(1.85, 1.35, 0.5)
    this.rig.add(this.check)
  }

  setQuality() {}

  /** called by the page when the active step changes (for the focal moment timing) */
  setTarget(t: number) {
    if (t !== this.target) {
      this.target = t
      this.arrivedAt = -10
    }
  }

  private onPointer = (e: PointerEvent) => {
    this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
    this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1
  }
  activate(on: boolean) {
    if (on && window.matchMedia('(pointer: fine)').matches) window.addEventListener('pointermove', this.onPointer, { passive: true })
    else window.removeEventListener('pointermove', this.onPointer)
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h
    // keep the whole sculpture in view on narrow panels
    const fitW = 7.4
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(15)) * 11
    const visW = visH * this.camera.aspect
    this.camera.zoom = Math.min(1, visW / fitW)
    this.camera.updateProjectionMatrix()
  }

  update(dt: number, elapsed: number) {

    const s = Math.max(-1, Math.min(4, this.s))
    const i0 = Math.min(3, Math.floor(s))
    const f = smooth(clamp01(s - i0))
    const A = S[i0]
    const B = S[i0 + 1]
    // arrival → focal moment clock
    // focal moments run on wall-clock time, so a slow device still sees them complete
    const wall = performance.now() / 1000
    const settled = Math.abs(s - this.target) < 0.002
    if (settled && this.arrivedAt < 0) this.arrivedAt = wall
    if (!settled) this.arrivedAt = -10
    const focal = this.still ? 1 : this.arrivedAt < 0 ? 0 : clamp01((wall - this.arrivedAt) / 1.8)
    const at = (k: number) => (Math.round(s) === k && settled ? focal : 0)
    const near = (k: number) => clamp01(1 - Math.abs(s - k))

    const p = this.pointer
    p.x = damp(p.x, this.still ? 0 : p.tx, 3, dt)
    p.y = damp(p.y, this.still ? 0 : p.ty, 3, dt)
    const r0 = RIG[i0]
    const r1 = RIG[i0 + 1]
    this.rig.rotation.set(lerp(r0[0], r1[0], f) - p.y * 0.05, lerp(r0[1], r1[1], f) + p.x * 0.08 + (this.still ? 0 : Math.sin(elapsed * 0.25) * 0.015), 0)

    for (const id of IDS) {
      const e = this.els.get(id)!
      const a = A[id]!
      const b = B[id]!
      const ff = id.startsWith('N') || id.startsWith('Q') ? smooth(clamp01(f * 1.6)) : f
      e.g.position.set(lerp(a.p[0], b.p[0], ff), lerp(a.p[1], b.p[1], ff), lerp(a.p[2], b.p[2], ff))
      e.g.rotation.set(lerp(a.rx ?? 0, b.rx ?? 0, ff), lerp(a.ry ?? 0, b.ry ?? 0, ff), lerp(a.rz ?? 0, b.rz ?? 0, ff))
      const sx = lerp(a.s[0], b.s[0], ff)
      const sy = lerp(a.s[1], b.s[1], ff)
      const sz = lerp(a.s[2], b.s[2], ff)
      e.body.scale.set(sx, sy, sz)
      e.edges.scale.set(sx, sy, sz)
      const o = lerp(a.o ?? 1, b.o ?? 1, ff)
      const solid = lerp(a.solid ?? 1, b.solid ?? 1, ff)
      this.tmpC.set(a.c ?? NODE)
      this.tmpC2.set(b.c ?? NODE)
      e.mat.color.copy(this.tmpC).lerp(this.tmpC2, ff)
      e.mat.opacity = o * (0.12 + 0.88 * solid)
      e.emat.opacity = o * clamp01(1.15 - solid) * 0.9
      e.g.visible = o > 0.01
      e.edges.visible = e.emat.opacity > 0.01
    }

    /* labels follow their state */
    this.noteLabels.forEach((l) => ((l.material as THREE.MeshBasicMaterial).opacity = near(-1) * 0.85))
    this.flowLabels.forEach((l) => ((l.material as THREE.MeshBasicMaterial).opacity = near(0)))

    /* 0 — connectors draw in as the flow forms; a signal runs start → goal on arrival */
    const w0 = near(0)
    this.flowPaths.forEach((pp, i) => pp.set(clamp01((1 - Math.abs(s - 0) * 1.6) * 1.2 - i * 0.04), w0 * 0.95, 0, 0))
    const route = [0, 2, 4]
    const ft = at(0)
    const k = Math.min(2, Math.floor(ft * 3))
    this.flowPaths[route[k]].curve.getPoint(clamp01(ft * 3 - k), this.pulse.position)
    const pv = ft > 0 && ft < 1 ? 1 : 0
    this.pulse.visible = pv > 0
    const goal = this.els.get('B4')!
    const pop = at(0) > 0.85 ? Math.sin(seg(at(0), 0.85, 1) * Math.PI) * 0.12 : 0
    goal.g.scale.setScalar(1 + pop)
    goal.mat.emissive.set('#2F5BFF')
    goal.mat.emissiveIntensity = w0 * (this.still ? 0.35 : seg(at(0), 0.8, 1) * 0.6)

    /* 1 — grid lines and a guide sweep across the frame */
    const w1 = near(1)
    ;(this.grid.material as THREE.LineBasicMaterial).opacity = w1 * 0.45
    const sweep = at(1)
    this.guide.position.x = lerp(-2.6, 2.6, outCubic(sweep))
    ;(this.guide.material as THREE.MeshBasicMaterial).opacity = sweep > 0 && sweep < 1 ? 0.9 * Math.sin(sweep * Math.PI) : 0

    /* 2 — press, ripple, link to the second state, edge case surfaces */
    const w2 = near(2)
    const f2 = at(2)
    const press = Math.sin(seg(f2, 0, 0.3) * Math.PI)
    const btn = this.els.get('B5')!
    btn.body.scale.z *= 1 - press * 0.55 * w2
    const rp = seg(f2, 0.05, 0.6)
    this.ripple.position.copy(btn.g.position).add(new THREE.Vector3(0, 0, 0.12))
    this.ripple.rotation.y = btn.g.rotation.y
    this.ripple.scale.setScalar(0.4 + rp * 1.4)
    ;(this.ripple.material as THREE.MeshBasicMaterial).opacity = rp > 0 && rp < 1 ? (1 - rp) * 0.9 * w2 : 0
    const protoDraw = this.still ? 1 : outCubic(seg(f2, 0.2, 0.65))
    this.protoPath.set(w2 > 0.99 ? protoDraw : 0, w2, 0, !this.still && f2 > 0.6 && f2 < 0.95 ? 1 : 0)
    this.protoPath.mat.uniforms.uPhase.value = seg(f2, 0.6, 0.95)
    const s2 = this.els.get('S2')!
    const al = outBack(seg(f2, 0.65, 0.95), 2)
    this.alert.position.copy(s2.g.position).add(new THREE.Vector3(-0.55, 0.85, 0.12).applyAxisAngle(new THREE.Vector3(0, 1, 0), s2.g.rotation.y))
    this.alert.rotation.y = s2.g.rotation.y
    const alertS = Math.max(al * w2, 0.0001)
    this.alert.scale.setScalar(alertS)
    this.alert.visible = alertS > 0.01

    /* 3 — master component sends instances into both screens */
    const w3 = near(3)
    const f3 = at(3)
    const fly = this.still ? 1 : outCubic(seg(f3, 0.05, 0.6))
    this.sysPaths.forEach((pp) => pp.set(w3 > 0.99 ? (this.still ? 1 : outCubic(seg(f3, 0, 0.4))) : 0, w3 * 0.9, 0, 0))
    ;(['I1', 'I2'] as Id[]).forEach((id) => {
      const e = this.els.get(id)!
      if (w3 > 0.99 && !this.still) {
        const sp = this.els.get('SP')!.g.position
        const tp = S[3][id]!.p
        e.g.position.set(lerp(sp.x, tp[0], fly), lerp(sp.y, tp[1], fly) + Math.sin(fly * Math.PI) * 0.5, lerp(sp.z, tp[2], fly))
        e.g.visible = f3 > 0
      }
    })

    /* 4 — redlines extend, states appear, hand-off confirmed */
    const w4 = near(4)
    const f4 = this.still ? 1 : at(4)
    this.redlines.forEach((r) => {
      const e = outCubic(seg(f4, r.delay, r.delay + 0.45)) * (w4 > 0.99 ? 1 : 0)
      r.g.scale.set(Math.max(e, 0.0001), 1, 1)
      r.g.visible = e > 0.01
    })
    this.pills.forEach((g, i) => {
      const e = outBack(seg(f4, 0.3 + i * 0.1, 0.6 + i * 0.1), 1.6) * w4
      g.scale.setScalar(Math.max(e, 0.0001))
      g.visible = e > 0.01
    })
    this.phoneUi.visible = w4 > 0.3
    this.phoneUi.children.forEach((m, i) => (m.scale.setScalar(Math.max(outCubic(seg(w4, 0.5 + i * 0.1, 0.9 + i * 0.1)), 0.0001))))
    const ck = outBack(seg(f4, 0.75, 1), 2) * (w4 > 0.99 ? 1 : 0)
    this.check.scale.setScalar(Math.max(ck, 0.0001))
    this.check.visible = ck > 0.01
  }

  dispose() {
    window.removeEventListener('pointermove', this.onPointer)
    this.flowPaths.forEach((p) => p.dispose())
    this.sysPaths.forEach((p) => p.dispose())
    this.protoPath.dispose()
    disposeTree(this.scene)
  }
}

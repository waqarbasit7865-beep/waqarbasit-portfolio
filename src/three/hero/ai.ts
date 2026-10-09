/**
 * 02 · AI-assisted exploration, human-led design.
 * Brief → AI exploration → designer judgement → refined prototype concept.  Choreography: GENERATE → SELECT → REFINE.
 *  • a short brief (with its assumptions marked "to validate") feeds a compact exploration core, assisted by the
 *    AI tools actually used (Claude, ChatGPT, Midjourney — official logos);
 *  • the core generates three distinct interface alternatives (sidebar dashboard, card grid, list) and three
 *    UX-copy options for the primary action;
 *  • a designer-controlled selection frame examines each layout and settles on one; the designer also picks the copy;
 *  • the chosen concept moves onto a refinement platform while the others recede; four deliberate refinements
 *    resolve it, the chosen copy lands on its button, and it becomes a clickable prototype concept.
 * Nothing here is presented as research or a validated result. Scroll-driven, so it reverses with the page.
 */
import * as THREE from 'three'
import { COL, GlowPath, glass, haloSprite, inOutCubic, inCubic, lerp, outBack, outCubic, roundedBox, satin, seg, setOpacity, torus, type Quality } from '../kit'
import { Surface, UI, chip, mono, pointerMesh, rrect, skeleton, text, type Ctx2D } from '../ui'
import { crispLabel, makeToken, toolById, type Token } from './tools'
import { WIN, type Comp, type Ctx } from './common'

const body = (c = '#151b2c') => satin(c, { metalness: 0.4, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.1 })
function faceMesh(surf: Surface, w: number, h: number, z: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: surf.tex, transparent: true, toneMapped: false, depthWrite: false }))
  m.scale.set(w * 0.985, h * 0.985, 1)
  m.position.z = z
  return m
}

/* ───────── concept painters (each a recognisably different layout) ───────── */
const paintA = (x: Ctx2D, w: number, h: number) => {
  // A — sidebar dashboard, dense
  const H = (h / w) * 1000
  rrect(x, 0, 0, 1000, H, 34, '#141a2b')
  rrect(x, 0, 0, 230, H, 34, '#191f33')
  for (let i = 0; i < 6; i++) skeleton(x, 40, 90 + i * 90, 150, 22, i === 1 ? UI.accent : '#33406b')
  text(x, 'Overview', 270, 70, 44, UI.text, 650)
  for (let i = 0; i < 3; i++) rrect(x, 270 + i * 240, 120, 220, 130, 16, '#1c2338')
  for (let i = 0; i < 9; i++) rrect(x, 290 + i * 76, 600 - (i % 4) * 60 - 120, 44, (i % 4) * 60 + 120, 6, '#3a4a86')
}
const paintBrough = (x: Ctx2D, w: number, h: number) => {
  // B (rough) — card grid with uneven spacing, mixed type sizes, weak contrast
  const H = (h / w) * 1000
  rrect(x, 0, 0, 1000, H, 34, '#141a2b')
  text(x, 'Team dashboard', 46, 74, 58, '#6b7697', 700)
  text(x, 'Priorities this week', 52, 132, 30, '#4f5a7a', 500)
  const cards = [
    [40, 180, 290, 200],
    [352, 196, 270, 186],
    [648, 178, 316, 210],
    [52, 412, 430, 220],
    [512, 404, 452, 240],
  ]
  cards.forEach(([X, Y, W, Hh], i) => {
    rrect(x, X, Y, W, Hh, 10 + i * 4, '#1a2035')
    skeleton(x, X + 24, Y + 40, W * 0.5, 16 + (i % 2) * 8, '#2c3557')
    skeleton(x, X + 24, Y + 80, W * 0.7, 12, '#262f4e')
  })
  rrect(x, 760, 60, 200, 64, 10, '#2c3b8a')
  text(x, 'Add', 860, 94, 30, '#6d7cb0', 600, 'center')
}
const paintBrefined = (x: Ctx2D, w: number, h: number) => {
  // B (refined) — same layout on an 8-pt grid, one type scale, AA contrast, resolved components
  const H = (h / w) * 1000
  rrect(x, 0, 0, 1000, H, 34, '#141a2b')
  text(x, 'Team dashboard', 48, 78, 54, UI.text, 650)
  text(x, 'Priorities this week', 48, 134, 32, UI.muted, 500)
  rrect(x, 722, 50, 230, 64, 32, UI.accent)
  text(x, '+ New task', 837, 84, 30, '#ffffff', 650, 'center')
  const col = (i: number) => 48 + i * 304
  const top = [
    ['Open', '12', UI.accentSoft],
    ['In review', '4', UI.amber],
    ['Done', '18', UI.green],
  ]
  top.forEach(([t, v, c], i) => {
    rrect(x, col(i), 184, 280, 196, 22, '#1b2236')
    text(x, t, col(i) + 28, 232, 30, UI.muted, 500)
    text(x, v, col(i) + 28, 312, 72, UI.text, 650)
    rrect(x, col(i) + 28, 350, 60, 8, 4, c)
  })
  rrect(x, 48, 404, 432, 236, 22, '#1b2236')
  text(x, 'Next steps', 76, 450, 30, UI.text, 600)
  ;['Review wireframes', 'Share prototype', 'Update tokens'].forEach((t, i) => {
    x.beginPath()
    x.arc(90 * x.u, (504 + i * 46) * x.u, 9 * x.u, 0, Math.PI * 2)
    x.fillStyle = i === 0 ? UI.green : UI.faint
    x.fill()
    text(x, t, 112, 506 + i * 46, 26, '#c9d1e6', 500)
  })
  rrect(x, 504, 404, 448, 236, 22, '#1b2236')
  text(x, 'Activity', 532, 450, 30, UI.text, 600)
  ;[0.4, 0.62, 0.5, 0.78, 0.66, 0.9].forEach((v, i) => rrect(x, 540 + i * 66, 620 - v * 140, 40, v * 140, 8, i === 5 ? UI.accent : '#3a4a86'))
}
const paintC = (x: Ctx2D, w: number, h: number) => {
  // C — list layout
  const H = (h / w) * 1000
  rrect(x, 0, 0, 1000, H, 34, '#141a2b')
  text(x, 'Tasks', 46, 72, 46, UI.text, 650)
  rrect(x, 640, 40, 320, 60, 30, '#1c2338')
  for (let i = 0; i < 5; i++) {
    const y = 150 + i * 102
    rrect(x, 40, y, 920, 84, 14, '#1a2035')
    x.beginPath()
    x.arc(84 * x.u, (y + 42) * x.u, 14 * x.u, 0, Math.PI * 2)
    x.fillStyle = '#3a4a86'
    x.fill()
    skeleton(x, 120, y + 42, 300 + (i % 3) * 80, 18, '#2f3a62')
    rrect(x, 800, y + 24, 120, 36, 18, '#24305a')
  }
}

const CHECKS = ['Spacing aligned to 8-pt grid', 'One type scale', 'Contrast AA · 4.8 : 1', 'Components resolved']
const COPY = ['Add', 'Create item', '+ New task']
const paintCopy = (sel: number) => (x: Ctx2D, w: number, h: number) => {
  const H = (h / w) * 1000
  rrect(x, 0, 0, 1000, H, 40, '#171d31')
  text(x, 'UX COPY · PRIMARY ACTION', 56, 76, 38, UI.accentSoft, 650, 'left', mono)
  COPY.forEach((t, i) => {
    const y = 150 + i * 132
    const on = sel > 0 && i === 2
    rrect(x, 48, y, 904, 104, 26, on ? '#16352a' : '#1c2338', on ? UI.green : undefined, 4)
    text(x, `“${t}”`, 92, y + 54, 46, on ? UI.text : '#AEB8D6', on ? 650 : 500)
    if (on) text(x, '✓ Designer pick', 920, y + 54, 34, UI.green, 650, 'right')
  })
}

export class AiComp implements Comp {
  group = new THREE.Group()
  box = { w: 5.4, h: 4.3 }
  private rig = new THREE.Group()
  private brief: THREE.Group
  private core = new THREE.Group()
  private coreGem: THREE.Mesh
  private coreRing: THREE.Mesh
  private coreLabel: THREE.Mesh
  private feed: GlowPath
  private emit: GlowPath[] = []
  private concepts: { g: THREE.Group; home: THREE.Vector3; rot: number; tag: THREE.Mesh }[] = []
  private refinedFace: THREE.Mesh
  private roughFace!: THREE.Mesh
  private frame = new THREE.Group()
  private frameLabel: THREE.Mesh
  private selected: THREE.Mesh
  private platform = new THREE.Group()
  private checks: { surf: Surface; g: THREE.Group }
  private checkState = -1
  private copy: { surf: Surface; g: THREE.Group; state: number }
  private aiTools: { t: Token; path: GlowPath }[] = []
  private ptr = pointerMesh(0.085)
  private protoLabel: THREE.Mesh

  constructor(q: Quality) {
    this.group.add(this.rig)

    /* brief */
    const bw = 1.22
    const bh = 0.76
    this.brief = new THREE.Group()
    const bs = new Surface(Math.round(bw * 560), Math.round(bh * 560), (x, w, h) => {
      const H = (h / w) * 1000
      rrect(x, 0, 0, 1000, H, 40, '#171d31')
      text(x, 'BRIEF', 56, 90, 42, UI.accentSoft, 650, 'left', '"Geist Mono Variable", ui-monospace, monospace')
      text(x, 'Team dashboard', 56, 210, 84, UI.text, 650)
      text(x, 'Clear priorities, fewer clicks', 56, 310, 50, UI.muted, 500)
      chip(x, 'Desktop', 56, 420, 'blue', 40)
      chip(x, 'AA contrast', 360, 420, 'green', 40)
      text(x, 'Assumptions — to validate with users', 56, 540, 34, UI.amber, 500, 'left', mono)
    })
    this.brief.add(new THREE.Mesh(roundedBox(bw, bh, 0.08, 0.06, 4), body()), faceMesh(bs, bw, bh, 0.043))
    this.brief.position.set(-2.0, 0.98, -0.2)
    this.brief.rotation.y = 0.25
    this.rig.add(this.brief)

    /* exploration core: a compact gem inside a vertical lens ring (deliberately unlike the intro engine) */
    this.coreGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), new THREE.MeshPhysicalMaterial({ color: '#8ea6ff', emissive: new THREE.Color('#3a5cff'), emissiveIntensity: 1.2, metalness: 0.2, roughness: 0.15, clearcoat: 1, flatShading: true }))
    this.coreRing = new THREE.Mesh(torus(0.36, 0.022, 96), glass(q, '#e6ecff', { thickness: 0.3 }))
    this.core.add(haloSprite('#4d6fff', 1.5, 0.55), this.coreGem, this.coreRing)
    this.coreLabel = crispLabel('AI exploration', 0.1, '#C9D3EE', 560)
    this.coreLabel.position.set(0, -0.56, 0)
    this.core.add(this.coreLabel)
    this.core.position.set(-1.12, 0.06, 0)
    this.rig.add(this.core)
    this.feed = new GlowPath([new THREE.Vector3(-1.85, 0.58, -0.15), new THREE.Vector3(-1.6, 0.35, 0), new THREE.Vector3(-1.32, 0.16, 0)], 0.011, COL.blueSoft, '#ffffff', 48)
    this.feed.mat.uniforms.uSpeed.value = 0
    this.rig.add(this.feed.mesh)

    /* three concepts on a fan */
    const cw = 0.98
    const chh = 0.68
    const homes: [number, number, number, number][] = [
      [0.05, 1.05, -0.35, 0.2],
      [0.3, -0.02, 0.0, 0.12],
      [0.05, -1.08, -0.35, 0.2],
    ]
    const painters = [paintA, paintBrough, paintC]
    homes.forEach(([x, y, z, r], i) => {
      const g = new THREE.Group()
      const s = new Surface(Math.round(cw * 600), Math.round(chh * 600), painters[i])
      g.add(new THREE.Mesh(roundedBox(cw, chh, 0.06, 0.05, 4), body('#121827')))
      const f = faceMesh(s, cw, chh, 0.033)
      g.add(f)
      if (i === 1) this.roughFace = f
      const tag = crispLabel(['A', 'B', 'C'][i], 0.1, i === 1 ? '#ffffff' : '#AEB8D6', 650)
      tag.position.set(-cw / 2 - 0.12, chh / 2 - 0.06, 0.05)
      g.add(tag)
      this.rig.add(g)
      this.concepts.push({ g, home: new THREE.Vector3(x, y, z), rot: r, tag })
      const A = new THREE.Vector3(-0.92, 0.06, 0)
      const B = new THREE.Vector3(x - cw / 2, y, z)
      const p = new GlowPath([A, A.clone().lerp(B, 0.5).add(new THREE.Vector3(0, (y > 0 ? 0.15 : y < -0.5 ? -0.15 : 0), 0.2)), B], 0.008, '#7d9bff', '#ffffff', 48)
      p.mat.uniforms.uSpeed.value = 0
      this.emit.push(p)
      this.rig.add(p.mesh)
    })
    // the refined face sits on concept B and fades in during refinement
    const rs = new Surface(Math.round(cw * 900), Math.round(chh * 900), paintBrefined)
    this.refinedFace = faceMesh(rs, cw, chh, 0.035)
    this.concepts[1].g.add(this.refinedFace)

    /* designer-controlled selection frame: four corner brackets */
    const brMat = new THREE.MeshBasicMaterial({ color: '#F4F1E8', toneMapped: false, transparent: true })
    const L = 0.16
    const T = 0.016
    for (const sx of [-1, 1])
      for (const sy of [-1, 1]) {
        const h1 = new THREE.Mesh(new THREE.PlaneGeometry(L, T), brMat)
        h1.position.set(sx * (cw / 2 + 0.06 - L / 2), sy * (chh / 2 + 0.06), 0)
        const v1 = new THREE.Mesh(new THREE.PlaneGeometry(T, L), brMat)
        v1.position.set(sx * (cw / 2 + 0.06), sy * (chh / 2 + 0.06 - L / 2), 0)
        this.frame.add(h1, v1)
      }
    this.frameLabel = crispLabel('Designer review', 0.09, '#F4F1E8', 600)
    this.frameLabel.position.set(cw / 2 - 0.2, chh / 2 + 0.16, 0)
    this.frame.add(this.frameLabel)
    this.rig.add(this.frame)
    this.selected = crispLabel('✓ Selected', 0.09, '#9fe8c7', 650)
    this.selected.position.set(0, -chh / 2 - 0.13, 0.05)
    this.concepts[1].g.add(this.selected)

    /* refinement platform */
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.0, 0.07, 64), glass(q, '#dfe6ff', { thickness: 0.4 }))
    const rim = new THREE.Mesh(torus(0.97, 0.008, 160), new THREE.MeshBasicMaterial({ color: '#7d9bff', toneMapped: false, transparent: true, opacity: 0.8 }))
    rim.rotation.x = Math.PI / 2
    rim.position.y = 0.04
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.04, 0.05, 64), satin('#0f1424', { metalness: 0.6, roughness: 0.3 }))
    base.position.y = -0.06
    this.platform.add(base, disc, rim)
    this.platform.position.set(1.65, -0.82, 0.2)
    this.rig.add(this.platform)

    /* refinement checklist */
    const kw = 1.2
    const kh = 0.62
    const ks = new Surface(Math.round(kw * 600), Math.round(kh * 600), () => undefined)
    const kg = new THREE.Group()
    kg.add(new THREE.Mesh(roundedBox(kw, kh, 0.06, 0.05, 4), body('#141a2b')), faceMesh(ks, kw, kh, 0.033))
    kg.position.set(1.65, -1.55, 0.75)
    this.rig.add(kg)
    this.checks = { surf: ks, g: kg }
    this.paintChecks(0)

    /* UX-copy options for the primary action, generated alongside the layouts */
    const cw2 = 1.14
    const ch2 = 0.74
    const cs = new Surface(Math.round(cw2 * 600), Math.round(ch2 * 600), paintCopy(0))
    const cg = new THREE.Group()
    cg.add(new THREE.Mesh(roundedBox(cw2, ch2, 0.07, 0.06, 4), body()), faceMesh(cs, cw2, ch2, 0.038))
    cg.position.set(-2.1, -0.62, -0.1)
    cg.rotation.y = 0.22
    this.rig.add(cg)
    this.copy = { surf: cs, g: cg, state: 0 }

    /* the AI tools that assist the exploration — official logos on small carriers, each wired to the core */
    ;['claude', 'chatgpt', 'midjourney'].forEach((id, i) => {
      const t = makeToken(toolById(id), 0.33, 0.1, 0.3)
      // own copy of the shared carrier material: this rig fades its materials on exit
      const bodyMesh = t.face.children[0] as THREE.Mesh
      bodyMesh.material = (bodyMesh.material as THREE.Material).clone()
      t.root.position.set(-1.78 + i * 0.48, -1.42, 0.1)
      this.rig.add(t.root)
      const a = t.root.position.clone().add(new THREE.Vector3(0, 0.15, 0))
      const b = this.core.position.clone().add(new THREE.Vector3(0, -0.3, 0))
      const p = new GlowPath([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0.05, -0.05, 0.15)), b], 0.006, i === 0 ? '#D97757' : COL.blueSoft, '#ffffff', 32)
      p.mat.uniforms.uSpeed.value = 0
      this.rig.add(p.mesh)
      this.aiTools.push({ t, path: p })
    })

    /* prototype concept: a pointer taps the chosen action on the refined design */
    this.ptr.group.visible = false
    this.concepts[1].g.add(this.ptr.group)
    this.protoLabel = crispLabel('Prototype concept · designer-refined', 0.085, '#DCE4FF', 600)
    this.protoLabel.position.set(0, -chh / 2 - 0.13, 0.05)
    this.concepts[1].g.add(this.protoLabel)
  }

  private paintChecks(n: number) {
    if (n === this.checkState) return
    this.checkState = n
    this.checks.surf.paint((x, w, h) => {
      const H = (h / w) * 1000
      rrect(x, 0, 0, 1000, H, 30, '#141a2b')
      text(x, 'Designer refinements', 50, 70, 46, UI.muted, 600)
      CHECKS.forEach((t, i) => {
        const y = 150 + i * 92
        const done = i < n
        x.beginPath()
        x.arc(70 * x.u, y * x.u, 20 * x.u, 0, Math.PI * 2)
        x.fillStyle = done ? UI.green : '#2a3352'
        x.fill()
        if (done) text(x, '✓', 70, y + 2, 28, '#0d2a1c', 800, 'center')
        text(x, t, 112, y + 2, 40, done ? UI.text : UI.faint, done ? 600 : 500)
      })
    })
  }

  setQuality() {}

  exports() {
    this.group.updateMatrixWorld()
    return { aiCore: this.core.getWorldPosition(new THREE.Vector3()) }
  }

  update(c: Ctx) {
    const { T, clock } = c
    const [i0] = WIN[3].in
    const e1 = seg(T, i0, 6.1) // brief + core
    const e2 = seg(T, 6.05, 6.38) // concepts generated
    const s = seg(T, 6.38, 6.8) // designer examines A, C, then B
    const mv = inOutCubic(seg(T, 6.8, 7.02)) // chosen concept to the platform
    const rf = seg(T, 6.98, 7.3) // refinements
    const o = seg(T, WIN[3].out[0], WIN[3].out[1])
    this.group.visible = T >= i0 - 0.001 && T <= WIN[3].out[1] + 0.001
    if (!this.group.visible) return
    const idle = c.still ? 0 : clock

    this.rig.rotation.set(-0.06 - c.pointer.y * 0.04, -0.2 + c.pointer.x * 0.08, 0)
    this.rig.position.set(0, 0, -1.6 * inCubic(o))
    setOpacity(this.rig, 1 - outCubic(o))

    // brief + core
    const bA = outBack(e1, 1.3)
    this.brief.scale.setScalar(Math.max(bA, 0.0001))
    const cA = outBack(seg(e1, 0.3, 1), 1.8)
    this.core.scale.setScalar(Math.max(cA, 0.0001))
    this.coreGem.rotation.set(idle * 0.6, idle * 0.9, 0)
    this.coreRing.rotation.set(0, idle * 0.5 + 0.4, 0)
    this.feed.set(outCubic(seg(e1, 0.4, 1)), 0.9 * (1 - mv * 0.7), 0, e1 > 0.5 && e1 < 1 ? 1 : 0)
    this.feed.mat.uniforms.uPhase.value = seg(e1, 0.5, 1)

    // concepts emitted on a fan; rejected ones recede once a choice is made
    this.concepts.forEach((k, i) => {
      const em = outBack(seg(e2, i * 0.18, i * 0.18 + 0.55), 1.4)
      const fromC = this.core.position
      const p = new THREE.Vector3().lerpVectors(fromC, k.home, outCubic(seg(e2, i * 0.18, i * 0.18 + 0.55)))
      let sc = Math.max(em, 0.0001)
      let ry = k.rot
      if (i === 1) {
        // chosen: forward onto the platform, larger
        const dest = new THREE.Vector3(1.65, 0.12, 0.6)
        p.lerp(dest, mv)
        sc *= lerp(1, 1.55, mv)
        ry = lerp(k.rot, -0.05, mv)
        p.y += Math.sin(mv * Math.PI) * 0.15
      } else {
        p.z -= mv * 1.3
        p.x -= mv * 0.25
        sc *= lerp(1, 0.78, mv)
      }
      k.g.position.copy(p)
      k.g.rotation.set(0, ry, 0)
      k.g.scale.setScalar(sc)
      k.g.visible = em > 0.002
      const dim = (i === 1 ? 1 : 1 - mv * 0.65) * (1 - outCubic(o))
      k.g.traverse((n) => {
        const mat = (n as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
        if (mat && (mat as THREE.MeshBasicMaterial).map && n !== this.refinedFace) {
          mat.opacity = dim
        }
      })
      this.emit[i].set(outCubic(seg(e2, i * 0.18, i * 0.18 + 0.4)), 0.7 * (1 - mv), 0, 0)
    })
    ;(this.refinedFace.material as THREE.MeshBasicMaterial).opacity = outCubic(seg(rf, 0.1, 0.9)) * (1 - outCubic(o))
    ;(this.roughFace.material as THREE.MeshBasicMaterial).opacity = (1 - outCubic(seg(rf, 0.3, 1))) * (1 - outCubic(o))

    // selection frame: A → C → B, then locks on B and travels with it
    const pick = (i: number) => this.concepts[i].g.position
    const fr = new THREE.Vector3()
    if (s < 0.33) fr.copy(pick(0))
    else if (s < 0.4) fr.lerpVectors(pick(0), pick(2), inOutCubic(seg(s, 0.33, 0.4)))
    else if (s < 0.66) fr.copy(pick(2))
    else if (s < 0.75) fr.lerpVectors(pick(2), pick(1), inOutCubic(seg(s, 0.66, 0.75)))
    else fr.copy(pick(1))
    this.frame.position.copy(fr).add(new THREE.Vector3(0, 0, 0.06))
    const fsel = s >= 0.75 ? this.concepts[1].g : s >= 0.4 ? this.concepts[2].g : this.concepts[0].g
    this.frame.rotation.copy(fsel.rotation)
    this.frame.scale.setScalar(fsel.scale.x)
    const fo = outCubic(seg(s, 0, 0.12)) * (1 - seg(rf, 0.6, 1) * 0.6) * (1 - outCubic(o))
    this.frame.visible = fo > 0.01
    this.frame.traverse((n) => {
      const m = (n as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined
      if (m) m.opacity = fo
    })
    const selA = seg(s, 0.85, 1)
    ;(this.selected.material as THREE.MeshBasicMaterial).opacity = selA * (1 - rf) * (1 - outCubic(o))

    // platform and refinements
    const pl = outBack(seg(mv, 0.2, 1), 1.3)
    this.platform.scale.setScalar(Math.max(pl, 0.0001))
    this.platform.visible = pl > 0.002
    this.platform.rotation.y = idle * 0.2
    const ck = outBack(seg(rf, 0, 0.3), 1.4)
    this.checks.g.scale.setScalar(Math.max(ck, 0.0001))
    this.checks.g.visible = ck > 0.002
    this.paintChecks(c.still ? 4 : Math.min(4, Math.floor(seg(rf, 0.15, 1) * 4.999)))

    // AI tools assist the exploration, then step back once the designer takes over
    const tl = outBack(seg(e1, 0.15, 0.8), 1.4)
    this.aiTools.forEach(({ t, path }, i) => {
      t.root.scale.setScalar(Math.max(tl * (1 - mv * 0.18), 0.0001))
      t.root.visible = tl > 0.002
      const ph = seg(e2, i * 0.15, i * 0.15 + 0.5)
      path.set(outCubic(seg(e1, 0.4, 1)), (0.55 + (ph > 0 && ph < 1 ? 0.4 : 0)) * (1 - mv * 0.6) * (1 - outCubic(o)), 0, ph > 0 && ph < 1 ? 1 : 0)
      path.mat.uniforms.uPhase.value = 1 - Math.min(ph, 0.999)
      t.rim.opacity = (0.3 + (ph > 0 && ph < 1 ? 0.4 : 0)) * (1 - outCubic(o))
    })

    // copy options: generated with the layouts, the designer picks one as the layout is chosen
    const cpA = outBack(seg(e2, 0.35, 0.9), 1.4)
    this.copy.g.scale.setScalar(Math.max(cpA * (1 - mv * 0.12), 0.0001))
    this.copy.g.visible = cpA > 0.002
    const chosen = c.still || s >= 0.85 ? 1 : 0
    if (chosen !== this.copy.state) {
      this.copy.state = chosen
      this.copy.surf.paint(paintCopy(chosen))
    }

    // prototype: once refined, a pointer taps the chosen action and the hotspot answers
    const pr = c.still ? 1 : seg(rf, 0.7, 1)
    ;(this.protoLabel.material as THREE.MeshBasicMaterial).opacity = outCubic(pr) * (1 - outCubic(o))
    const btn = new THREE.Vector3(0.36, 0.25, 0.08)
    const from = new THREE.Vector3(0.62, -0.12, 0.12)
    this.ptr.group.visible = pr > 0.01 && o < 0.5
    this.ptr.group.position.lerpVectors(from, btn, inOutCubic(seg(pr, 0, 0.8)))
    const tap = c.still ? 0 : pr >= 1 ? ((clock % 2.6) / 2.6) : 0
    const tp = seg(tap, 0.1, 0.45)
    this.ptr.ring.scale.setScalar(1 + tp * 2.4)
    ;(this.ptr.ring.material as THREE.MeshBasicMaterial).opacity = tp > 0 && tp < 1 ? (1 - tp) * 0.9 : 0
  }

  dispose() {
    this.feed.dispose()
    this.emit.forEach((p) => p.dispose())
    this.aiTools.forEach((a) => a.path.dispose())
  }
}


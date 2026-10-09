/**
 * 01 · Introduction — UI/UX and product design, with a clear hierarchy of tools.
 * A blue crystal core (with slow internal ribbons in a few brand colours) inside three gimbal rings.
 *  • PRIMARY   — Figma, the largest carrier, sits in front of the core at the focal point;
 *               around the core, compact models of the product-design skills ride the inner orbit:
 *               user flows, wireframes → UI, prototypes, design systems (illustrative visuals, labelled).
 *  • SECONDARY — middle orbit: Framer, Webflow, WordPress, Wix (website build & publishing) and
 *               Photoshop, Illustrator (visual design).
 *  • SUPPORT   — outer orbit, smaller and further back: Claude, ChatGPT, Midjourney (AI-assisted exploration)
 *               and Unity, Godot (application / game development). Still fully readable.
 * Hierarchy comes from scale, proximity to the core and rim-light intensity — never from fading logos out.
 * Every item faces the viewer; the layout is pre-computed so carriers and labels never collide and never sit
 * behind the core across the whole drift range. Every couple of seconds one item sends a pulse into the core
 * (Figma most often). Exit: everything is drawn into the core, which travels on into scene 02.
 */
import * as THREE from 'three'
import { COL, GlowPath, clamp01, glass, haloSprite, inCubic, lerp, metal, outBack, outCubic, seg, sphere, torus, type Quality } from '../kit'
import { WIN, type Comp, type Ctx } from './common'
import { TOOLS, makeToken, toolById } from './tools'
import { SKILLS, makeSkill, type SkillModel } from './skills'

/** orbit planes: radius, tilt about X, tilt in the screen plane (applied X then Z) */
const RINGS: [number, number, number][] = [
  [1.85, -0.95, 0.35],
  [2.6, 0.8, -0.2],
  [3.1, 1.2, 0.12],
]
/** orbit items in order, with their home angle (found offline: no overlaps across the whole drift range) */
const ORBIT: { kind: 'skill' | 'tool'; id: string; ring: 0 | 1 | 2; angle: number }[] = [
  { kind: 'skill', id: 'flow', ring: 0, angle: 5.488 },
  { kind: 'skill', id: 'wire', ring: 0, angle: 4.476 },
  { kind: 'skill', id: 'proto', ring: 0, angle: 2.255 },
  { kind: 'skill', id: 'system', ring: 0, angle: 0.49 },
  { kind: 'tool', id: 'photoshop', ring: 1, angle: 2.735 },
  { kind: 'tool', id: 'illustrator', ring: 1, angle: 0.222 },
  { kind: 'tool', id: 'framer', ring: 1, angle: 4.417 },
  { kind: 'tool', id: 'webflow', ring: 1, angle: 4.2 },
  { kind: 'tool', id: 'wordpress', ring: 1, angle: 0.922 },
  { kind: 'tool', id: 'wix', ring: 1, angle: 5.98 },
  { kind: 'tool', id: 'claude', ring: 2, angle: 3.467 },
  { kind: 'tool', id: 'chatgpt', ring: 2, angle: 5.458 },
  { kind: 'tool', id: 'midjourney', ring: 2, angle: 4.273 },
  { kind: 'tool', id: 'unity', ring: 2, angle: 5.922 },
  { kind: 'tool', id: 'godot', ring: 2, angle: 0.826 },
]
const DRIFT = 0.07
/** carrier size and label height per ring (hierarchy by scale) */
const SIZE = [0.72, 0.48, 0.4]
const LABEL = [0.17, 0.145, 0.135]
/** primary: Figma in front of the core */
const FIGMA_AT = new THREE.Vector3(-1.55, -0.72, 1.1)
const FIGMA_SIZE = 0.92

interface Slot {
  root: THREE.Group
  face: THREE.Group
  rim: THREE.MeshBasicMaterial
  rimBase: number
  label: THREE.Mesh
  ring: number // -1 = primary (not on an orbit)
  angle: number
  path: GlowPath
  curve: THREE.CatmullRomCurve3
  skill?: SkillModel
}

export class IntroComp implements Comp {
  group = new THREE.Group()
  box = { w: 6.6, h: 5.7 }
  private sculpt = new THREE.Group()
  private core: THREE.Mesh
  private shell: THREE.Mesh
  private ribbons: GlowPath[] = []
  private ribbonGroup = new THREE.Group()
  private rings: { mesh: THREE.Mesh; target: THREE.Euler; speed: number }[] = []
  private halo: THREE.Sprite
  private figmaHalo: THREE.Sprite
  private tilts: THREE.Group[] = []
  private rails: THREE.Mesh[] = []
  private beads: { m: THREE.Mesh; ring: number; phase: number }[] = []
  private slots: Slot[] = []
  private figma!: Slot
  private q: Quality
  private tmpQ = new THREE.Quaternion()
  private tmpV = new THREE.Vector3()

  constructor(q: Quality) {
    this.q = q
    this.group.add(this.sculpt)

    /* core: deep-blue iridescent sphere inside a faceted crystal shell */
    this.core = new THREE.Mesh(
      sphere(0.44, 64),
      new THREE.MeshPhysicalMaterial({ color: '#2a4dff', metalness: 0.3, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.45, iridescenceIOR: 1.3, emissive: new THREE.Color('#0f1f73'), emissiveIntensity: 0.8, envMapIntensity: 1.2 }),
    )
    this.shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.74, 1), glass(q, '#e8edff', { flatShading: true, thickness: 0.9, roughness: 0.05 }))
    this.halo = haloSprite('#2f5bff', 3.0, 0.3)
    this.sculpt.add(this.halo, this.core, this.ribbonGroup, this.shell)

    /* internal ribbons: a restrained mix of tool colours moving inside the crystal (blue stays dominant) */
    const ribbonCols = ['#5b7cff', '#A259FF', '#D97757', '#31A8FF']
    ribbonCols.forEach((col, k) => {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i < 64; i++) {
        const t = (i / 64) * Math.PI * 2
        pts.push(new THREE.Vector3(Math.cos(t) * 0.58, Math.sin(2 * t + k) * 0.2, Math.sin(t) * 0.58))
      }
      const curve = new THREE.CatmullRomCurve3(pts, true)
      const r = new GlowPath(curve, k === 0 ? 0.016 : 0.011, col, '#ffffff', 128)
      r.mat.uniforms.uSpeed.value = 0.12 + k * 0.03
      r.mesh.rotation.set(k * 0.9, k * 1.3, k * 0.5)
      this.ribbons.push(r)
      this.ribbonGroup.add(r.mesh)
    })

    /* gimbal rings */
    const ringMat = metal('#cdd6ff', 0.2)
    const specs = [
      { R: 0.98, r: 0.016, e: new THREE.Euler(1.2, 0.3, 0), speed: 0.3 },
      { R: 1.12, r: 0.012, e: new THREE.Euler(0.2, 1.1, 0.4), speed: -0.2 },
      { R: 1.27, r: 0.01, e: new THREE.Euler(-0.6, -0.5, 1.2), speed: 0.13 },
    ]
    specs.forEach((s) => {
      const mesh = new THREE.Mesh(torus(s.R, s.r, 160), ringMat)
      this.sculpt.add(mesh)
      this.rings.push({ mesh, target: s.e, speed: s.speed })
    })

    /* three orbital paths */
    RINGS.forEach(([R, rx, rz], i) => {
      const tilt = new THREE.Group()
      tilt.rotation.set(rx, 0, rz, 'ZYX')
      this.group.add(tilt)
      this.tilts.push(tilt)
      const rail = new THREE.Mesh(torus(R, 0.005, 240), new THREE.MeshBasicMaterial({ color: i === 0 ? '#9fb3ff' : '#6f88e6', transparent: true, opacity: 0.3, depthWrite: false }))
      rail.rotation.x = Math.PI / 2
      tilt.add(rail)
      this.rails.push(rail)
      for (let b = 0; b < 2; b++) {
        const m = new THREE.Mesh(sphere(0.022, 12), new THREE.MeshBasicMaterial({ color: '#dfe6ff', toneMapped: false, transparent: true }))
        tilt.add(m)
        this.beads.push({ m, ring: i, phase: b * Math.PI + i })
      }
    })

    ORBIT.forEach((o) => {
      const [R] = RINGS[o.ring]
      const home = new THREE.Vector3(Math.cos(o.angle) * R, 0, Math.sin(o.angle) * R)
      let slot: Omit<Slot, 'path' | 'curve' | 'ring' | 'angle'>
      let brand: THREE.ColorRepresentation = COL.blueSoft
      if (o.kind === 'skill') {
        const sk = makeSkill(o.id as (typeof SKILLS)[number]['id'], SIZE[0], LABEL[0])
        slot = { root: sk.root, face: sk.face, rim: sk.rim, rimBase: 0.3, label: sk.label, skill: sk }
      } else {
        const def = toolById(o.id)
        const rimBase = o.ring === 1 ? 0.32 : 0.22
        const t = makeToken(def, SIZE[o.ring], LABEL[o.ring], rimBase)
        slot = { root: t.root, face: t.face, rim: t.rim, rimBase, label: t.label }
        if (def.brand !== '#E8ECF5') brand = def.brand
      }
      slot.root.position.copy(home)
      this.tilts[o.ring].add(slot.root)
      const dir = home.clone().normalize()
      const curve = new THREE.CatmullRomCurve3(
        [home.clone(), home.clone().multiplyScalar(0.6).add(new THREE.Vector3(0, 0.3, 0)), dir.clone().multiplyScalar(0.82), new THREE.Vector3(0, 0, 0)],
        false,
        'centripetal',
      )
      const path = new GlowPath(curve, o.ring === 0 ? 0.009 : 0.007, brand, '#ffffff', 64)
      path.mat.uniforms.uSpeed.value = 0
      this.tilts[o.ring].add(path.mesh)
      this.slots.push({ ...slot, ring: o.ring, angle: o.angle, path, curve })
    })

    /* primary: Figma, in front of the core, with a restrained brand-coloured key light */
    const fdef = TOOLS.find((t) => t.tier === 'primary')!
    const ft = makeToken(fdef, FIGMA_SIZE, 0.2, 0.42)
    ft.root.position.copy(FIGMA_AT)
    this.group.add(ft.root)
    this.figmaHalo = haloSprite(fdef.brand, 1.9, 0.16)
    this.figmaHalo.position.copy(FIGMA_AT).add(new THREE.Vector3(0, 0, -0.25))
    this.group.add(this.figmaHalo)
    const fcurve = new THREE.CatmullRomCurve3(
      [FIGMA_AT.clone(), FIGMA_AT.clone().multiplyScalar(0.55).add(new THREE.Vector3(0.1, 0.25, 0)), FIGMA_AT.clone().normalize().multiplyScalar(0.8), new THREE.Vector3()],
      false,
      'centripetal',
    )
    const fpath = new GlowPath(fcurve, 0.012, fdef.brand, '#ffffff', 64)
    fpath.mat.uniforms.uSpeed.value = 0
    this.group.add(fpath.mesh)
    this.figma = { root: ft.root, face: ft.face, rim: ft.rim, rimBase: 0.42, label: ft.label, ring: -1, angle: 0, path: fpath, curve: fcurve }
    this.slots.push(this.figma)
  }

  setQuality(q: Quality) {
    if (q === this.q) return
    this.q = q
    const old = this.shell.material as THREE.Material
    this.shell.material = glass(q, '#e8edff', { flatShading: true, thickness: 0.9, roughness: 0.05 })
    old.dispose()
  }

  exports() {
    return { core: this.core.getWorldPosition(new THREE.Vector3()) }
  }

  update(c: Ctx) {
    const { T, clock } = c
    const [i0, i1] = WIN[0].in
    const [o0, o1] = WIN[0].out
    const a = seg(T, i0, i1) // load assembly
    const o = seg(T, o0, o1) // exit into scene 02
    this.group.visible = T <= o1 + 0.001
    if (!this.group.visible) return
    const idle = c.still ? 0 : clock

    this.group.rotation.y = c.pointer.x * 0.1
    this.group.rotation.x = -c.pointer.y * 0.05

    /* core, shell and ribbons */
    const ca = outBack(seg(a, 0, 0.35), 1.4)
    this.core.scale.setScalar(Math.max(ca * lerp(1, 0.42, outCubic(o)), 0.0001))
    const sh = outCubic(seg(a, 0.08, 0.45)) * (1 - inCubic(o))
    this.shell.scale.setScalar(Math.max(sh, 0.0001))
    this.shell.rotation.set(idle * 0.09, idle * 0.14, 0)
    this.ribbonGroup.scale.setScalar(Math.max(sh, 0.0001))
    this.ribbonGroup.rotation.y = idle * 0.18
    this.ribbons.forEach((r, k) => r.set(1, (k === 0 ? 0.9 : 0.5) * outCubic(seg(a, 0.3, 0.8)), c.still ? 1.5 + k : idle, 1))

    // pulse: every 2.2 s one item sends a signal into the core — Figma every third beat
    const period = 2.2
    const order = [15, 0, 7, 15, 1, 4, 15, 2, 10, 15, 3, 8, 15, 9, 12, 15, 5, 13, 15, 6, 11, 15, 14]
    const beat = c.still ? -1 : Math.floor(idle / period) % order.length
    const active = beat < 0 ? -1 : order[beat]
    const pp = c.still ? 0 : seg((idle % period) / period, 0.05, 0.6)
    const arrive = c.still ? 0 : Math.max(0, 1 - Math.abs(pp - 0.97) * 12)
    this.halo.material.opacity = (0.3 + arrive * 0.22) * clamp01(a * 2) * (1 - o * 0.6)

    // continuity: the core travels on into the next scene
    const target = c.handoff.aiCore ?? c.handoff.flowRoot
    if (target && o > 0) {
      this.sculpt.parent!.updateMatrixWorld()
      const local = this.group.worldToLocal(this.tmpV.copy(target))
      this.sculpt.position.lerpVectors(new THREE.Vector3(), local, outCubic(seg(o, 0.25, 1)))
    } else this.sculpt.position.set(0, 0, 0)

    const ru = outCubic(seg(a, 0.12, 0.62))
    this.rings.forEach((r) => {
      r.mesh.rotation.set(lerp(Math.PI / 2, r.target.x, ru), lerp(0, r.target.y, ru), lerp(0, r.target.z, ru) + idle * r.speed)
      r.mesh.scale.setScalar(Math.max(ru * (1 - outCubic(o)) * lerp(0.4, 1, ru), 0.0001))
    })

    const railA = outCubic(seg(a, 0.2, 0.7)) * (1 - o)
    this.rails.forEach((r, i) => ((r.material as THREE.MeshBasicMaterial).opacity = (i === 0 ? 0.34 : 0.24) * railA))
    this.beads.forEach((b) => {
      const R = RINGS[b.ring][0]
      const t = idle * (0.16 - b.ring * 0.03) + b.phase
      b.m.position.set(Math.cos(t) * R, 0, Math.sin(t) * R)
      ;(b.m.material as THREE.MeshBasicMaterial).opacity = railA
    })

    c.camera.getWorldQuaternion(this.tmpQ)
    const fly = outCubic(o)
    this.slots.forEach((s, k) => {
      const primary = s.ring < 0
      // primary arrives first, then the inner skills, then the orbits outward
      const d0 = primary ? 0.18 : 0.26 + s.ring * 0.06 + (k % 5) * 0.025
      const kk = outBack(seg(a, d0, d0 + 0.36), 1.25)
      if (fly > 0) {
        s.curve.getPoint(Math.min(fly, 1), s.root.position)
      } else if (primary) {
        s.root.position.copy(FIGMA_AT)
        s.root.position.y += c.still ? 0 : Math.sin(idle * 0.7) * 0.04
        s.root.position.x -= (1 - outCubic(seg(a, d0, d0 + 0.4))) * 0.6
      } else {
        const R = RINGS[s.ring][0]
        // one shared drift phase: the layout was solved for the whole constellation swaying together
        const th = s.angle + (c.still ? 0 : DRIFT * Math.sin(idle * 0.3))
        const r = R * lerp(1.25, 1, outCubic(seg(a, d0, d0 + 0.36)))
        s.root.position.set(Math.cos(th) * r, 0, Math.sin(th) * r)
      }
      s.root.scale.setScalar(Math.max(kk * lerp(1, 0.15, fly), 0.0001))
      // every item faces the viewer
      s.root.parent!.getWorldQuaternion(s.face.quaternion).invert().multiply(this.tmpQ)
      if (s.skill) s.skill.tick(idle, c.still)
      const isActive = k === active
      const draw = outCubic(seg(a, 0.55 + (k % 8) * 0.02, 0.98))
      const base = primary ? 0.42 : s.ring === 0 ? 0.3 : 0.2
      s.path.set(draw, (isActive ? 0.95 : base) * (1 - 0.6 * o) * (kk > 0.01 ? 1 : 0), 0, isActive && pp > 0 && pp < 1 ? 1 : 0)
      s.path.mat.uniforms.uPhase.value = Math.min(pp, 0.999)
      s.path.mat.uniforms.uFrom.value = fly
      s.rim.opacity = s.rimBase + (isActive ? Math.sin(Math.min(pp * 3, 1) * Math.PI) * 0.5 : 0)
      ;(s.label.material as THREE.MeshBasicMaterial).opacity = (1 - fly) * clamp01(kk)
    })
    this.figmaHalo.material.opacity = 0.16 * clamp01(seg(a, 0.2, 0.6)) * (1 - fly) * (1 + (active === 15 ? arrive * 0.6 : 0))
  }

  dispose() {
    this.slots.forEach((s) => {
      s.path.dispose()
      s.skill?.dispose()
    })
    this.ribbons.forEach((r) => r.dispose())
  }
}

/**
 * Layered waves across the whole hero: thin ribbons that start at the height of the "Clear" underline on the
 * left, pass behind the headline, and rise into the orbital composition on the right. Mostly blue, with two
 * faint brand-colour layers; each carries a slow travelling highlight. Shown with scene 01 only.
 */
const waveVert = /* glsl */ `
  uniform float uTime; uniform float uAmp; uniform float uFreq; uniform float uPhase; uniform float uWidth; uniform float uThick;
  uniform float uY0; uniform float uY1; uniform float uBend;
  varying float vX; varying float vEdge;
  void main() {
    vec3 p = position;
    float x = p.x;                       // -0.5 … 0.5
    float u = x + 0.5;
    p.x *= uWidth;
    p.y *= uThick;
    // the same easing as the underline stroke: flat at the start, lifting toward the engine
    float rise = smoothstep(0.18, 0.95, u);
    float w = sin(u * uFreq * 6.2831 + uTime * 0.3 + uPhase) * uAmp * (0.35 + 0.65 * rise)
            + sin(u * uFreq * 2.3 * 6.2831 - uTime * 0.2 + uPhase * 1.7) * uAmp * 0.3;
    p.y += mix(uY0, uY1, rise) + w + sin(u * 3.1416) * uBend;
    p.z += cos(u * 3.0 + uPhase) * 0.35;
    vX = u; vEdge = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const waveFrag = /* glsl */ `
  uniform vec3 uColor; uniform vec3 uHi; uniform float uTime; uniform float uOpacity; uniform float uPhase; uniform float uSpeed;
  varying float vX; varying float vEdge;
  void main() {
    float fade = smoothstep(0.0, 0.08, vX) * (1.0 - smoothstep(0.9, 1.0, vX));
    float core = 1.0 - abs(vEdge - 0.5) * 2.0;
    float h = fract(uTime * uSpeed + uPhase * 0.13);
    float hi = exp(-pow((vX - h) * 10.0, 2.0));
    float a = (0.34 + hi * 1.2) * fade * core * uOpacity;
    gl_FragColor = vec4(mix(uColor, uHi, hi * 0.7) * a, a);
  }
`
export class Waves {
  group = new THREE.Group()
  private mats: THREE.ShaderMaterial[] = []
  private meshes: THREE.Mesh[] = []
  constructor(q: Quality) {
    // [line colour, highlight colour, opacity]
    const layers: [string, string, number][] = [
      ['#2F5BFF', '#ffffff', 1.4],
      ['#7D9BFF', '#ffffff', 1.1],
      ['#4566ff', '#D97757', 0.95], // Claude-orange highlight
      ['#A7BEFF', '#ffffff', 0.8],
      ['#5a49d6', '#A259FF', 0.75], // Figma-purple line
      ['#2F5BFF', '#31A8FF', 0.7],
      ['#7D9BFF', '#ffffff', 0.55],
    ].slice(0, q === 'high' ? 7 : 4) as [string, string, number][]
    layers.forEach(([col, hi, op], i) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader: waveVert,
        fragmentShader: waveFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: 0.16 + i * 0.05 },
          uFreq: { value: 0.75 + i * 0.13 },
          uPhase: { value: i * 1.37 },
          uWidth: { value: 16 },
          uThick: { value: 0.012 },
          uY0: { value: 0 },
          uY1: { value: 0 },
          uBend: { value: 0 },
          uColor: { value: new THREE.Color(col) },
          uHi: { value: new THREE.Color(hi) },
          uOpacity: { value: op },
          uSpeed: { value: 0.04 + i * 0.011 },
        },
      })
      mat.userData.base = op
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 260, 1), mat)
      mesh.position.set(0, 0, -1.6 - i * 0.45)
      mesh.frustumCulled = false
      this.group.add(mesh)
      this.mats.push(mat)
      this.meshes.push(mesh)
    })
  }
  /** width of the hero at the waves' depth; left height (underline) and right height (engine centre) */
  fit(width: number, yLeft: number, yRight: number) {
    this.meshes.forEach((m, i) => {
      const u = (m.material as THREE.ShaderMaterial).uniforms
      u.uWidth.value = width * (1.12 + i * 0.05)
      u.uThick.value = 0.011 + i * 0.004
      u.uY0.value = yLeft - i * 0.07
      u.uY1.value = yRight + (i - 3) * 0.14
      u.uBend.value = -0.18 + i * 0.05
    })
  }
  update(T: number, clock: number, still: boolean) {
    const a = seg(T, WIN[0].in[0], WIN[0].in[0] + 1.6)
    const o = seg(T, WIN[0].out[0] - 0.2, WIN[0].out[1])
    const op = a * (1 - o)
    this.group.visible = op > 0.002
    this.mats.forEach((m, i) => {
      m.uniforms.uTime.value = still ? 4 + i : clock
      m.uniforms.uOpacity.value = op * (m.userData.base as number)
    })
  }
  dispose() {
    this.meshes.forEach((m) => m.geometry.dispose())
    this.mats.forEach((m) => m.dispose())
  }
}

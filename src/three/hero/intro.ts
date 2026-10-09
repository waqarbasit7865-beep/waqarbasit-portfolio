/**
 * 01 · Introduction — "a sculptural creative engine with connected tools".
 * A crystal core inside three gimbal rings; twelve tool symbols ride two tilted orbits at different depths,
 * each joined to the core by an illuminated path whose highlights flow inward (tools feeding the engine).
 * Choreography: ORBIT. Load: the engine assembles and the orbits fill. Exit: tools are drawn along their
 * paths into the core, which shrinks and is handed to scene 02 as the first node of the user flow.
 */
import * as THREE from 'three'
import { COL, GlowPath, clamp01, glass, haloSprite, inCubic, lerp, metal, outBack, outCubic, seg, sphere, torus, type Quality } from '../kit'
import { WIN, type Comp, type Ctx } from './common'
import { TOOLS, makeToken, type Token } from './tools'

interface Orbit {
  tilt: THREE.Group
  spin: THREE.Group
  speed: number
  R: number
}
interface Slot {
  token: Token
  orbit: Orbit
  angle: number
  r: number
  lift: number
  path: GlowPath
  curve: THREE.CatmullRomCurve3
  home: THREE.Vector3
}

export class IntroComp implements Comp {
  group = new THREE.Group()
  box = { w: 4.9, h: 4.0 }
  private sculpt = new THREE.Group()
  private core: THREE.Mesh
  private shell: THREE.Mesh
  private rings: { mesh: THREE.Mesh; target: THREE.Euler; speed: number; axis: THREE.Vector3 }[] = []
  private beads: { mesh: THREE.Mesh; ring: number; speed: number; phase: number }[] = []
  private halo: THREE.Sprite
  private orbits: Orbit[] = []
  private slots: Slot[] = []
  private rails: THREE.Mesh[] = []
  private q: Quality
  private tmpQ = new THREE.Quaternion()
  private tmpV = new THREE.Vector3()

  constructor(q: Quality) {
    this.q = q
    this.group.add(this.sculpt)

    /* core: iridescent sphere inside a faceted crystal shell */
    this.core = new THREE.Mesh(
      sphere(0.46, 64),
      new THREE.MeshPhysicalMaterial({ color: COL.blue, metalness: 0.25, roughness: 0.12, clearcoat: 1, iridescence: 0.7, iridescenceIOR: 1.35, emissive: new THREE.Color('#14246e'), emissiveIntensity: 0.9, envMapIntensity: 1.4 }),
    )
    this.shell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.74, 1), glass(q, '#e6ecff', { flatShading: true, thickness: 0.9, roughness: 0.06 }))
    this.halo = haloSprite('#3d63ff', 3.2, 0.32)
    this.sculpt.add(this.halo, this.core, this.shell)

    /* gimbal rings */
    const ringMat = metal('#c9d4ff', 0.22)
    const specs = [
      { R: 0.98, r: 0.016, e: new THREE.Euler(1.2, 0.3, 0), speed: 0.35, axis: new THREE.Vector3(0, 0, 1) },
      { R: 1.12, r: 0.012, e: new THREE.Euler(0.2, 1.1, 0.4), speed: -0.22, axis: new THREE.Vector3(0, 0, 1) },
      { R: 1.27, r: 0.01, e: new THREE.Euler(-0.6, -0.5, 1.2), speed: 0.15, axis: new THREE.Vector3(0, 0, 1) },
    ]
    specs.forEach((s, i) => {
      const mesh = new THREE.Mesh(torus(s.R, s.r, 160), ringMat)
      this.sculpt.add(mesh)
      this.rings.push({ mesh, target: s.e, speed: s.speed, axis: s.axis })
      const bead = new THREE.Mesh(sphere(0.035, 16), new THREE.MeshBasicMaterial({ color: '#dfe7ff', toneMapped: false }))
      mesh.add(bead)
      this.beads.push({ mesh: bead, ring: i, speed: 0.6 + i * 0.25, phase: i * 2.1 })
    })

    /* two tilted orbits: AI tools close to the core, design / web / build tools further out */
    const mkOrbit = (R: number, rx: number, rz: number, speed: number) => {
      const tilt = new THREE.Group()
      tilt.rotation.set(rx, 0, rz)
      const spin = new THREE.Group()
      tilt.add(spin)
      this.group.add(tilt)
      const rail = new THREE.Mesh(torus(R, 0.0045, 220), new THREE.MeshBasicMaterial({ color: COL.lilac, transparent: true, opacity: 0.22, depthWrite: false }))
      rail.rotation.x = Math.PI / 2
      spin.add(rail)
      this.rails.push(rail)
      const o = { tilt, spin, speed, R }
      this.orbits.push(o)
      return o
    }
    const inner = mkOrbit(1.5, -0.55, 0.35, -0.07)
    const outer = mkOrbit(2.12, 0.4, -0.16, 0.045)

    const inn = TOOLS.filter((t) => t.group === 'ai')
    const out = TOOLS.filter((t) => t.group !== 'ai')
    const place = (defs: typeof TOOLS, orbit: Orbit, start: number, spread: number) =>
      defs.forEach((def, i) => {
        // clusters per category along the orbit, small radius/height variations for depth
        const angle = start + i * spread
        const r = orbit.R + (i % 2 ? 0.06 : -0.06)
        const lift = (i % 3 === 0 ? 0.14 : i % 3 === 1 ? -0.1 : 0.03) * (orbit === inner ? 0.6 : 1)
        const token = makeToken(def, orbit === inner ? 0.24 : 0.25, this.q)
        const home = new THREE.Vector3(Math.cos(angle) * r, lift, Math.sin(angle) * r)
        token.root.position.copy(home)
        orbit.spin.add(token.root)
        const dir = home.clone().normalize()
        const curve = new THREE.CatmullRomCurve3([
          home.clone(),
          home.clone().multiplyScalar(0.62).add(new THREE.Vector3(0, 0.28 + lift, 0)),
          dir.clone().multiplyScalar(0.8).add(new THREE.Vector3(0, 0.05, 0)),
          new THREE.Vector3(0, 0, 0),
        ], false, 'centripetal')
        const path = new GlowPath(curve, 0.0075, def.group === 'ai' ? COL.lilac : COL.blueSoft, '#ffffff', 64)
        path.mat.uniforms.uSpeed.value = 0.28
        orbit.spin.add(path.mesh)
        this.slots.push({ token, orbit, angle, r, lift, path, curve, home })
      })
    place(inn, inner, 0.5, (Math.PI * 2) / 3)
    place(out, outer, -0.4, (Math.PI * 2) / 9)
  }

  setQuality(q: Quality) {
    if (q === this.q) return
    this.q = q
    const old = this.shell.material as THREE.Material
    this.shell.material = glass(q, '#e6ecff', { flatShading: true, thickness: 0.9, roughness: 0.06 })
    old.dispose()
    this.slots.forEach((s) => s.token.setQuality(q))
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

    /* pointer: lean toward the pointer, never follow it */
    this.group.rotation.y = c.pointer.x * 0.14
    this.group.rotation.x = -c.pointer.y * 0.07

    /* core + shell */
    const ca = outBack(seg(a, 0, 0.35), 1.4)
    const coreS = ca * lerp(1, 0.42, outCubic(o))
    this.core.scale.setScalar(Math.max(coreS, 0.0001))
    this.shell.scale.setScalar(Math.max(outCubic(seg(a, 0.08, 0.45)) * (1 - inCubic(o)), 0.0001))
    this.shell.rotation.set(idle * 0.11, idle * 0.17, 0)
    this.halo.material.opacity = 0.32 * clamp01(a * 2) * (1 - o * 0.6)

    // hand the core to scene 02 (its first flow node)
    const target = c.handoff.flowRoot
    if (target && o > 0) {
      this.sculpt.parent!.updateMatrixWorld()
      const local = this.group.worldToLocal(this.tmpV.copy(target))
      this.sculpt.position.lerpVectors(new THREE.Vector3(), local, outCubic(seg(o, 0.25, 1)))
    } else this.sculpt.position.set(0, 0, 0)

    /* rings unfold from flat, then turn slowly on their own axes */
    const ru = outCubic(seg(a, 0.12, 0.62))
    this.rings.forEach((r, i) => {
      r.mesh.rotation.set(lerp(Math.PI / 2, r.target.x, ru), lerp(0, r.target.y, ru), lerp(0, r.target.z, ru) + idle * r.speed)
      const s = Math.max(ru * (1 - outCubic(o)) * lerp(0.4, 1, ru), 0.0001)
      r.mesh.scale.setScalar(s)
      const b = this.beads[i]
      const ang = idle * b.speed + b.phase
      b.mesh.position.set(Math.cos(ang) * (r.mesh.geometry as THREE.TorusGeometry).parameters.radius, Math.sin(ang) * (r.mesh.geometry as THREE.TorusGeometry).parameters.radius, 0)
    })

    /* orbits */
    this.orbits.forEach((orb) => (orb.spin.rotation.y = idle * orb.speed + 0.2))
    this.rails.forEach((r) => ((r.material as THREE.MeshBasicMaterial).opacity = 0.2 * outCubic(seg(a, 0.2, 0.7)) * (1 - o)))
    c.camera.getWorldQuaternion(this.tmpQ)
    this.slots.forEach((s, i) => {
      const k = outBack(seg(a, 0.25 + i * 0.03, 0.62 + i * 0.03), 1.25)
      const fly = outCubic(o) // along the path into the core
      if (fly > 0) {
        s.curve.getPoint(Math.min(fly, 1), s.token.root.position)
      } else {
        s.token.root.position.copy(s.home).multiplyScalar(lerp(1.9, 1, outCubic(seg(a, 0.25 + i * 0.03, 0.62 + i * 0.03))))
      }
      s.token.root.scale.setScalar(Math.max(k * lerp(1, 0.15, fly), 0.0001))
      // face the camera: undo the parent rotation, apply the camera's
      s.token.root.parent!.getWorldQuaternion(s.token.face.quaternion).invert().multiply(this.tmpQ)
      const draw = outCubic(seg(a, 0.55 + i * 0.02, 0.98))
      s.path.set(draw, (0.9 - 0.4 * o) * (k > 0.01 ? 1 : 0), c.still ? 0 : clock, c.still ? 0 : 1)
      s.path.mat.uniforms.uFrom.value = fly
    })
  }

  dispose() {
    this.slots.forEach((s) => s.path.dispose())
  }
}

/**
 * Layered waves behind the composition and (faintly) behind the headline: thin ribbons displaced in a
 * vertex shader, each with a slow travelling highlight. Shown with scene 01 only.
 */
const waveVert = /* glsl */ `
  uniform float uTime; uniform float uAmp; uniform float uFreq; uniform float uPhase; uniform float uWidth; uniform float uThick;
  varying float vX; varying float vEdge;
  void main() {
    vec3 p = position;
    float x = p.x;
    p.x *= uWidth;
    p.y *= uThick;
    float w = sin(x * uFreq * 6.2831 + uTime * 0.35 + uPhase) * uAmp
            + sin(x * uFreq * 2.7 * 6.2831 - uTime * 0.22 + uPhase * 1.7) * uAmp * 0.35;
    p.y += w;
    p.z += cos(x * 3.1 + uPhase) * 0.4;
    vX = x + 0.5; vEdge = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const waveFrag = /* glsl */ `
  uniform vec3 uColor; uniform float uTime; uniform float uOpacity; uniform float uPhase; uniform float uSpeed;
  varying float vX; varying float vEdge;
  void main() {
    float fade = smoothstep(0.0, 0.18, vX) * (1.0 - smoothstep(0.82, 1.0, vX));
    float core = 1.0 - abs(vEdge - 0.5) * 2.0;
    float h = fract(uTime * uSpeed + uPhase * 0.13);
    float hi = exp(-pow((vX - h) * 9.0, 2.0));
    float a = (0.3 + hi * 1.3) * fade * core * uOpacity;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), hi * 0.55) * a, a);
  }
`
export class Waves {
  group = new THREE.Group()
  private mats: THREE.ShaderMaterial[] = []
  private meshes: THREE.Mesh[] = []
  private width = 16
  constructor(q: Quality) {
    const layers = q === 'high' ? 6 : 3
    const cols = [COL.blue, COL.lilac, COL.violet, COL.blueSoft, COL.teal, COL.lilac]
    for (let i = 0; i < layers; i++) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: waveVert,
        fragmentShader: waveFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: 0.32 + i * 0.07 },
          uFreq: { value: 0.55 + i * 0.12 },
          uPhase: { value: i * 1.37 },
          uWidth: { value: this.width },
          uThick: { value: 0.014 },
          uColor: { value: cols[i % cols.length].clone() },
          uOpacity: { value: 0.5 },
          uSpeed: { value: 0.045 + i * 0.012 },
        },
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 220, 1), mat)
      mesh.position.set(0, -0.25 - i * 0.18, -2.2 - i * 0.55)
      mesh.frustumCulled = false
      this.group.add(mesh)
      this.mats.push(mat)
      this.meshes.push(mesh)
    }
  }
  /** width of the visible area at the waves' depth */
  fit(width: number, y: number) {
    this.width = width
    this.meshes.forEach((m, i) => {
      const u = (m.material as THREE.ShaderMaterial).uniforms
      u.uWidth.value = width * (1.25 + i * 0.12)
      u.uThick.value = 0.014 + i * 0.005
      m.position.y = y - i * 0.16
    })
  }
  update(T: number, clock: number, still: boolean) {
    const a = seg(T, WIN[0].in[0], WIN[0].in[0] + 1.6)
    const o = seg(T, WIN[0].out[0] - 0.2, WIN[0].out[1])
    const op = a * (1 - o)
    this.group.visible = op > 0.002
    this.mats.forEach((m, i) => {
      m.uniforms.uTime.value = still ? 4 + i : clock
      m.uniforms.uOpacity.value = op * (1.0 - i * 0.1)
    })
  }
  dispose() {
    this.meshes.forEach((m) => m.geometry.dispose())
    this.mats.forEach((m) => m.dispose())
  }
}

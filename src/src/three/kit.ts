/**
 * Shared building blocks for the 3D scenes: palette, easing, cached geometry/materials,
 * illuminated paths, text and interface textures. Geometry and materials are cached and reused.
 */
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/* ───────── palette (matches the site tokens) ───────── */
export const COL = {
  ink: new THREE.Color('#0D0E10'),
  panel: new THREE.Color('#161a24'),
  panel2: new THREE.Color('#1d2333'),
  paper: new THREE.Color('#F4F4F1'),
  blue: new THREE.Color('#2F5BFF'),
  blueSoft: new THREE.Color('#7D9BFF'),
  lilac: new THREE.Color('#A7BEFF'),
  violet: new THREE.Color('#8E7CFF'),
  teal: new THREE.Color('#4FD1C5'),
  gold: new THREE.Color('#E2B65C'),
  coral: new THREE.Color('#FF7A59'),
  red: new THREE.Color('#FF5A5A'),
}

/* ───────── math ───────── */
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** progress of t through [a, b] */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
export const smooth = (t: number) => t * t * (3 - 2 * t)
export const outCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const inCubic = (t: number) => t * t * t
export const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const outBack = (t: number, s = 1.6) => {
  const c3 = s + 1
  return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)
}
export const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
/** frame-rate independent damping */
export const damp = (cur: number, target: number, lambda: number, dt: number) => lerp(cur, target, 1 - Math.exp(-lambda * dt))
export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)

/* ───────── environment (one PMREM per renderer) ───────── */
let envTex: THREE.Texture | null = null
export function environment(renderer: THREE.WebGLRenderer) {
  if (envTex) return envTex
  const pm = new THREE.PMREMGenerator(renderer)
  envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture
  pm.dispose()
  return envTex
}

/* ───────── cached geometry ───────── */
const geos = new Map<string, THREE.BufferGeometry>()
export function cachedGeo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geos.get(key)
  if (!g) {
    g = make()
    geos.set(key, g)
  }
  return g as T
}
export const roundedBox = (w: number, h: number, d: number, r: number, seg = 4) =>
  cachedGeo(`rb:${w}:${h}:${d}:${r}:${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, r))
/** unit slab that is scaled per element (small radius so scaling stays clean) */
export const unitSlab = () => roundedBox(1, 1, 1, 0.08, 3)
export const unitEdges = () => cachedGeo('edges:unit', () => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)))
export const sphere = (r = 1, s = 32) => cachedGeo(`sph:${r}:${s}`, () => new THREE.SphereGeometry(r, s, Math.round(s * 0.75)))
export const plane = () => cachedGeo('plane', () => new THREE.PlaneGeometry(1, 1))
export const torus = (R: number, r: number, s = 128) => cachedGeo(`tor:${R}:${r}:${s}`, () => new THREE.TorusGeometry(R, r, 12, s))

/** smooth glass "coin" — a lathe profile with rounded edges, axis along Z */
export const coin = (r: number, t: number) =>
  cachedGeo(`coin:${r}:${t}`, () => {
    const pts: THREE.Vector2[] = []
    const e = t / 2
    pts.push(new THREE.Vector2(0, -e))
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI
      pts.push(new THREE.Vector2(r - e + Math.cos(a) * e, Math.sin(a) * e))
    }
    pts.push(new THREE.Vector2(0, e))
    const g = new THREE.LatheGeometry(pts, 64)
    g.rotateX(Math.PI / 2)
    return g
  })

/* ───────── materials ───────── */
export type Quality = 'high' | 'low'
export function glass(quality: Quality, tint = '#cfdcff', opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  if (quality === 'high')
    return new THREE.MeshPhysicalMaterial({
      color: tint,
      metalness: 0,
      roughness: 0.16,
      transmission: 1,
      thickness: 0.5,
      ior: 1.42,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      attenuationColor: new THREE.Color('#6f8dff'),
      attenuationDistance: 2.2,
      envMapIntensity: 1.1,
      ...opts,
    })
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    metalness: 0.1,
    roughness: 0.2,
    transparent: true,
    opacity: 0.32,
    clearcoat: 1,
    envMapIntensity: 1.2,
    depthWrite: false,
    ...opts,
  })
}
export const satin = (color: THREE.ColorRepresentation, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.3, envMapIntensity: 0.9, ...opts })
export const metal = (color: THREE.ColorRepresentation, roughness = 0.24) =>
  new THREE.MeshStandardMaterial({ color, metalness: 1, roughness, envMapIntensity: 1.2 })
export const glow = (color: THREE.ColorRepresentation, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })

/** soft radial sprite texture used for glows and signal halos */
let haloTex: THREE.Texture | null = null
export function halo() {
  if (haloTex) return haloTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 128, 128)
  haloTex = new THREE.CanvasTexture(c)
  haloTex.colorSpace = THREE.SRGBColorSpace
  return haloTex
}
export function haloSprite(color: THREE.ColorRepresentation, size: number, opacity = 0.9) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }))
  s.scale.setScalar(size)
  return s
}

/* ───────── illuminated paths: a thin tube that draws on and carries travelling highlights ───────── */
const pathVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const pathFrag = /* glsl */ `
  uniform vec3 uColor; uniform vec3 uHot;
  uniform float uDraw; uniform float uOpacity; uniform float uTime; uniform float uSpeed;
  uniform float uPulse; uniform float uPhase; uniform float uFrom;
  varying vec2 vUv;
  void main() {
    float u = vUv.x;
    if (u < uFrom || u > uDraw) discard;
    float base = 0.55;
    // travelling highlight (wraps); a short bright head with a soft tail
    float p = fract(uTime * uSpeed + uPhase);
    float d = u - p;
    float head = smoothstep(-0.16, 0.0, d) * (1.0 - smoothstep(0.0, 0.025, d));
    float tip = 1.0 - smoothstep(0.0, 0.03, abs(uDraw - u)); // bright drawing tip while the path draws on
    float a = (base + head * uPulse * 1.6 + tip * step(uDraw, 0.999) * 0.9) * uOpacity;
    vec3 col = mix(uColor, uHot, clamp(head * uPulse + tip * 0.6, 0.0, 1.0));
    gl_FragColor = vec4(col * a, a);
  }
`
export class GlowPath {
  mesh: THREE.Mesh
  mat: THREE.ShaderMaterial
  curve: THREE.Curve<THREE.Vector3>
  constructor(points: THREE.Vector3[] | THREE.Curve<THREE.Vector3>, radius = 0.012, color: THREE.ColorRepresentation = COL.blueSoft, hot: THREE.ColorRepresentation = '#ffffff', segments = 96) {
    this.curve = Array.isArray(points) ? new THREE.CatmullRomCurve3(points, false, 'centripetal') : points
    const geo = new THREE.TubeGeometry(this.curve, segments, radius, 6, false)
    this.mat = new THREE.ShaderMaterial({
      vertexShader: pathVert,
      fragmentShader: pathFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uHot: { value: new THREE.Color(hot) },
        uDraw: { value: 1 },
        uFrom: { value: 0 },
        uOpacity: { value: 1 },
        uTime: { value: 0 },
        uSpeed: { value: 0.35 },
        uPulse: { value: 1 },
        uPhase: { value: Math.random() },
      },
    })
    this.mesh = new THREE.Mesh(geo, this.mat)
    this.mesh.frustumCulled = false
  }
  set(draw: number, opacity: number, time: number, pulse = 1) {
    const u = this.mat.uniforms
    u.uDraw.value = draw
    u.uOpacity.value = opacity
    u.uTime.value = time
    u.uPulse.value = pulse
    this.mesh.visible = opacity > 0.002 && draw > 0.002
  }
  dispose() {
    this.mesh.geometry.dispose()
    this.mat.dispose()
  }
}

/* ───────── text / interface textures ───────── */
export const FONT = '"Geist Variable", "Geist", system-ui, sans-serif'
export const MONO = '"Geist Mono Variable", "Geist Mono", ui-monospace, monospace'
export const SERIF = '"Instrument Serif", Georgia, serif'

export function textTexture(text: string, opts: { font?: string; size?: number; weight?: number | string; color?: string; pad?: number; italic?: boolean; letter?: number } = {}) {
  const size = opts.size ?? 64
  const font = `${opts.italic ? 'italic ' : ''}${opts.weight ?? 500} ${size}px ${opts.font ?? FONT}`
  const c = document.createElement('canvas')
  const x = c.getContext('2d')!
  x.font = font
  const pad = opts.pad ?? size * 0.3
  const w = Math.ceil(x.measureText(text).width + pad * 2 + (opts.letter ?? 0) * text.length)
  const h = Math.ceil(size * 1.4)
  c.width = w
  c.height = h
  x.font = font
  if (opts.letter) (x as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${opts.letter}px`
  x.fillStyle = opts.color ?? '#F4F4F1'
  x.textBaseline = 'middle'
  x.fillText(text, pad, h / 2 + size * 0.04)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return { tex: t, aspect: w / h }
}
/** A text label as a flat mesh (height in world units). */
export function label(text: string, height: number, opts: Parameters<typeof textTexture>[1] & { opacity?: number } = {}) {
  const { tex, aspect } = textTexture(text, opts)
  const m = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: opts.opacity ?? 1, depthWrite: false, toneMapped: false }))
  m.scale.set(height * aspect, height, 1)
  return m
}

export function canvasTexture(w: number, h: number, paint: (x: CanvasRenderingContext2D, w: number, h: number) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  paint(c.getContext('2d')!, w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
export function rr(x: CanvasRenderingContext2D, X: number, Y: number, W: number, H: number, R: number) {
  x.beginPath()
  x.roundRect(X, Y, W, H, R)
}

/** Fades every material under an object (materials must be transparent-capable). */
export function setOpacity(obj: THREE.Object3D, o: number) {
  obj.visible = o > 0.003
  obj.traverse((n) => {
    const m = (n as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
    if (!m) return
    const arr = Array.isArray(m) ? m : [m]
    for (const mm of arr) {
      const base = (mm.userData.baseOpacity ??= mm.opacity)
      mm.opacity = base * o
      if (!mm.transparent && o < 0.999) {
        mm.transparent = true
        mm.needsUpdate = true
      }
    }
  })
}

export function disposeTree(o: THREE.Object3D) {
  o.traverse((n) => {
    const mesh = n as THREE.Mesh
    if (mesh.material) {
      const arr = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      arr.forEach((m) => {
        Object.values(m).forEach((v) => v instanceof THREE.Texture && v !== haloTex && v !== envTex && v.dispose())
        m.dispose()
      })
    }
  })
}

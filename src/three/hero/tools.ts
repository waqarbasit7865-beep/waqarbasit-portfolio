/**
 * Tool symbols for the introduction: each official logo (bundled locally in /public/brand) is rasterised
 * once into a crisp texture and mounted, undistorted, on the face of a polished 3D carrier.
 * Sources and licences: public/brand/SOURCES.txt. Trademarks belong to their owners.
 */
import * as THREE from 'three'
import { FONT, plane, roundedBox, type Quality } from '../kit'

export interface ToolDef {
  id: string
  name: string
  file: string
  /** the logo is itself an app tile (Adobe) — it fills the carrier face */
  tile?: boolean
  /** brand colour used for the carrier rim and the core ribbons */
  brand: string
  /**
   * hierarchy in the introduction:
   *  primary   — Figma, the main design tool: largest, in front of the core
   *  secondary — website implementation & publishing (Framer, Webflow, WordPress, Wix) and visual design (Photoshop, Illustrator)
   *  support   — AI-assisted exploration (Claude, ChatGPT, Midjourney) and application / game development (Unity, Godot)
   */
  tier: 'primary' | 'secondary' | 'support'
  /** what the tool stands for in this portfolio (screen-reader list and fallback captions) */
  role: string
}
export const TOOLS: ToolDef[] = [
  { id: 'figma', name: 'Figma', file: 'figma.svg', brand: '#A259FF', tier: 'primary', role: 'Product & interface design' },
  { id: 'photoshop', name: 'Photoshop', file: 'photoshop.svg', tile: true, brand: '#31A8FF', tier: 'secondary', role: 'Visual design' },
  { id: 'illustrator', name: 'Illustrator', file: 'illustrator.svg', tile: true, brand: '#FF9A00', tier: 'secondary', role: 'Visual design' },
  { id: 'framer', name: 'Framer', file: 'framer.svg', brand: '#0055FF', tier: 'secondary', role: 'Website build & publishing' },
  { id: 'webflow', name: 'Webflow', file: 'webflow.svg', brand: '#146EF5', tier: 'secondary', role: 'Website build & publishing' },
  { id: 'wordpress', name: 'WordPress', file: 'wordpress.svg', brand: '#21759B', tier: 'secondary', role: 'Website build & publishing' },
  { id: 'wix', name: 'Wix', file: 'wix.svg', brand: '#E8ECF5', tier: 'secondary', role: 'Website build & publishing' },
  { id: 'claude', name: 'Claude', file: 'claude.svg', brand: '#D97757', tier: 'support', role: 'AI-assisted exploration' },
  { id: 'chatgpt', name: 'ChatGPT', file: 'chatgpt.svg', brand: '#E8ECF5', tier: 'support', role: 'AI-assisted exploration' },
  { id: 'midjourney', name: 'Midjourney', file: 'midjourney.svg', brand: '#E8ECF5', tier: 'support', role: 'AI-assisted exploration' },
  { id: 'unity', name: 'Unity', file: 'unity.svg', brand: '#E8ECF5', tier: 'support', role: 'Application & game development' },
  { id: 'godot', name: 'Godot', file: 'godot.svg', brand: '#478CBF', tier: 'support', role: 'Application & game development' },
]
export const toolById = (id: string) => TOOLS.find((t) => t.id === id)!

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

/** Rasterise an SVG logo into a texture (square, transparent background, aspect preserved). */
const logoCache = new Map<string, THREE.CanvasTexture>()
const pending: Promise<void>[] = []
/** resolves when every requested logo has been rasterised (used before still renders) */
export const logosReady = () => Promise.all(pending).then(() => undefined)
/** start rasterising every tool logo now (same sizes the carriers use) and resolve when all are ready —
 *  call before taking still images, so no carrier is captured empty */
export function preloadLogos() {
  TOOLS.forEach((d) => logoTexture(d.file, 512, d.tile ? 0 : 40))
  return logosReady()
}
export function logoTexture(file: string, px = 512, pad = 0): THREE.CanvasTexture {
  const key = `${file}:${px}:${pad}`
  const hit = logoCache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = c.height = px
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  const img = new Image()
  img.decoding = 'async'
  let done: () => void = () => undefined
  pending.push(new Promise<void>((r) => (done = r)))
  img.onerror = () => done()
  img.onload = () => {
    const x = c.getContext('2d')!
    const iw = img.naturalWidth || px
    const ih = img.naturalHeight || px
    const box = px - pad * 2
    const s = Math.min(box / iw, box / ih)
    const w = iw * s
    const h = ih * s
    x.clearRect(0, 0, px, px)
    x.drawImage(img, (px - w) / 2, (px - h) / 2, w, h)
    tex.needsUpdate = true
    done()
  }
  // give the SVG an explicit pixel size so it rasterises sharply
  fetch(`${BASE}/brand/${file}`)
    .then((r) => r.text())
    .then((svg) => {
      const sized = svg.replace('<svg ', `<svg width="${px}" height="${px}" `)
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`
    })
    .catch(() => done())
  logoCache.set(key, tex)
  return tex
}

/** High-resolution text label (always crisp, high contrast). */
export function crispLabel(text: string, height: number, color = '#EEF2FF', weight = 560, pill = true) {
  const size = 96
  const c = document.createElement('canvas')
  const x = c.getContext('2d')!
  x.font = `${weight} ${size}px ${FONT}`
  const w = Math.ceil(x.measureText(text).width + size * 0.6)
  c.width = w
  c.height = Math.ceil(size * 1.35)
  x.font = `${weight} ${size}px ${FONT}`
  if (pill) {
    // quiet backing so labels stay readable over lines and rails
    x.fillStyle = 'rgba(9, 11, 18, 0.72)'
    x.beginPath()
    x.roundRect(size * 0.08, size * 0.12, w - size * 0.16, c.height - size * 0.24, (c.height - size * 0.24) / 2)
    x.fill()
  }
  x.fillStyle = color
  x.textBaseline = 'middle'
  x.textAlign = 'center'
  x.fillText(text, w / 2, c.height / 2 + size * 0.04)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const m = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }))
  m.scale.set((height * w) / c.height, height, 1)
  return m
}

export interface Token {
  def: ToolDef
  root: THREE.Group // positioned along its orbit
  face: THREE.Group // turned toward the camera
  rim: THREE.MeshBasicMaterial
  label: THREE.Mesh
  setQuality(q: Quality): void
}

let bodyMat: THREE.MeshPhysicalMaterial | null = null
const carrierBody = () =>
  (bodyMat ??= new THREE.MeshPhysicalMaterial({
    color: '#141a29',
    metalness: 0.55,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.1,
  }))

/** A polished squircle carrier: metal-glass body, a thin brand-coloured rim light, the logo on its face. */
export function makeToken(def: ToolDef, size: number, labelH = size * 0.3, rimOpacity = 0.32): Token {
  const root = new THREE.Group()
  const face = new THREE.Group()
  root.add(face)
  const depth = size * 0.22
  const body = new THREE.Mesh(roundedBox(size, size, depth, size * 0.24, 5), carrierBody())
  face.add(body)
  // rim: a slightly larger, very thin plate behind the body, lit in the tool's colour
  const rim = new THREE.MeshBasicMaterial({ color: def.brand, transparent: true, opacity: rimOpacity, toneMapped: false, depthWrite: false })
  const rimMesh = new THREE.Mesh(roundedBox(size * 1.07, size * 1.07, depth * 0.4, size * 0.27, 4), rim)
  rimMesh.position.z = -depth * 0.25
  face.add(rimMesh)
  // the logo itself: an undistorted square texture on the front face
  const logo = new THREE.Mesh(
    plane(),
    new THREE.MeshBasicMaterial({ map: logoTexture(def.file, 512, def.tile ? 0 : 40), transparent: true, toneMapped: false, depthWrite: false }),
  )
  const ls = def.tile ? size * 0.86 : size * 0.72
  logo.scale.set(ls, ls, 1)
  logo.position.z = depth / 2 + 0.002
  face.add(logo)
  const label = crispLabel(def.name, labelH)
  label.position.set(0, -size / 2 - labelH * 0.75, 0.01)
  face.add(label)
  return { def, root, face, rim, label, setQuality() {} }
}

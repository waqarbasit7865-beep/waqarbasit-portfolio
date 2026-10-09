/**
 * Crisp interface surfaces for the 3D scenes: a canvas-painted face on a modelled slab.
 * All sample content is neutral and illustrative (interface concepts, not client work).
 */
import * as THREE from 'three'
import { FONT, MONO, SERIF, plane, roundedBox, satin } from './kit'

export const UI = {
  bg: '#0e1220',
  surface: '#151a2a',
  surface2: '#1b2134',
  line: '#283050',
  text: '#EEF2FB',
  muted: '#8F9AB6',
  faint: '#5d6785',
  accent: '#2F5BFF',
  accentSoft: '#7D9BFF',
  violet: '#8E7CFF',
  green: '#35C98A',
  amber: '#F0B44C',
  red: '#FF6B6B',
  wire: '#3a4466',
  wireFill: '#141927',
}

export type Painter = (x: Ctx2D, w: number, h: number) => void
export type Ctx2D = CanvasRenderingContext2D & { u: number }

/** A repaintable canvas texture. `u` = canvas pixels per design pixel (designs are drawn in a 1000-wide space). */
export class Surface {
  canvas = document.createElement('canvas')
  tex: THREE.CanvasTexture
  private painter: Painter
  constructor(
    public pxW: number,
    public pxH: number,
    painter: Painter,
  ) {
    this.canvas.width = pxW
    this.canvas.height = pxH
    this.tex = new THREE.CanvasTexture(this.canvas)
    this.tex.colorSpace = THREE.SRGBColorSpace
    this.tex.anisotropy = 8
    this.painter = painter
    this.paint()
  }
  paint(p?: Painter) {
    if (p) this.painter = p
    const x = this.canvas.getContext('2d')! as Ctx2D
    x.u = this.pxW / 1000
    x.clearRect(0, 0, this.pxW, this.pxH)
    this.painter(x, this.pxW, this.pxH)
    this.tex.needsUpdate = true
  }
}

/** Slab with a crisp UI face. Size in world units; texture resolution follows the size. */
export function uiSlab(w: number, h: number, d: number, painter: Painter, opts: { radius?: number; body?: string; density?: number; faceInset?: number } = {}) {
  const g = new THREE.Group()
  const r = opts.radius ?? Math.min(w, h) * 0.08
  const body = new THREE.Mesh(roundedBox(w, h, d, r, 4), satin(opts.body ?? '#121726', { metalness: 0.35, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 }))
  g.add(body)
  const density = opts.density ?? 420
  const pxW = Math.min(2048, Math.round(w * density))
  const pxH = Math.min(2048, Math.round(h * density))
  const surf = new Surface(pxW, pxH, painter)
  const inset = opts.faceInset ?? 0.985
  const face = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: surf.tex, transparent: true, toneMapped: false, depthWrite: false }))
  face.scale.set(w * inset, h * inset, 1)
  face.position.z = d / 2 + 0.002
  g.add(face)
  return { group: g, body, face, surf }
}

/* ───────── drawing helpers (design units; multiply by x.u) ───────── */
export function rrect(x: Ctx2D, X: number, Y: number, W: number, H: number, R: number, fill?: string, stroke?: string, lw = 1.5) {
  const u = x.u
  x.beginPath()
  x.roundRect(X * u, Y * u, W * u, H * u, R * u)
  if (fill) {
    x.fillStyle = fill
    x.fill()
  }
  if (stroke) {
    x.strokeStyle = stroke
    x.lineWidth = lw * u
    x.stroke()
  }
}
export function text(x: Ctx2D, s: string, X: number, Y: number, size: number, color: string = UI.text, weight: number | string = 500, align: CanvasTextAlign = 'left', font = FONT) {
  const u = x.u
  x.font = `${weight} ${size * u}px ${font}`
  x.fillStyle = color
  x.textAlign = align
  x.textBaseline = 'middle'
  x.fillText(s, X * u, Y * u)
}
export const mono = MONO
export const serif = SERIF

export function chip(x: Ctx2D, label: string, X: number, Y: number, kind: 'green' | 'amber' | 'blue' | 'red' | 'muted', size = 22, align: 'left' | 'right' = 'left') {
  const col = { green: UI.green, amber: UI.amber, blue: UI.accentSoft, red: UI.red, muted: UI.muted }[kind]
  x.font = `600 ${size * x.u}px ${FONT}`
  const tw = x.measureText(label).width / x.u
  const W = tw + size * 1.9
  const H = size * 1.55
  const X0 = align === 'right' ? X - W : X
  rrect(x, X0, Y - H / 2, W, H, H / 2, col + '26')
  x.beginPath()
  x.arc((X0 + size * 0.75) * x.u, Y * x.u, size * 0.22 * x.u, 0, Math.PI * 2)
  x.fillStyle = col
  x.fill()
  text(x, label, X0 + size * 1.2, Y + 1, size, col, 600)
  return W
}
export function skeleton(x: Ctx2D, X: number, Y: number, W: number, H = 14, col: string = UI.wire) {
  rrect(x, X, Y - H / 2, W, H, H / 2, col)
}
/** Wireframe image placeholder: a box with a cross */
export function wireImage(x: Ctx2D, X: number, Y: number, W: number, H: number) {
  rrect(x, X, Y, W, H, 8, undefined, UI.wire, 2)
  const u = x.u
  x.beginPath()
  x.moveTo(X * u, Y * u)
  x.lineTo((X + W) * u, (Y + H) * u)
  x.moveTo((X + W) * u, Y * u)
  x.lineTo(X * u, (Y + H) * u)
  x.strokeStyle = UI.wire
  x.lineWidth = 1.5 * u
  x.stroke()
}

/** A modelled pointer (arrow cursor) with a dark outline. */
export function pointerMesh(size = 0.24) {
  const s = new THREE.Shape()
  const pts: [number, number][] = [
    [0, 0],
    [0, -1],
    [0.27, -0.76],
    [0.45, -1.15],
    [0.6, -1.08],
    [0.42, -0.7],
    [0.75, -0.7],
  ]
  s.moveTo(pts[0][0], pts[0][1])
  pts.slice(1).forEach((p) => s.lineTo(p[0], p[1]))
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 })
  geo.scale(size, size, size)
  const g = new THREE.Group()
  const outline = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#0b0d14', toneMapped: false }))
  outline.scale.set(1.12, 1.08, 0.9)
  outline.position.set(-size * 0.04, size * 0.04, -0.01)
  const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35, metalness: 0.05, emissive: '#ffffff', emissiveIntensity: 0.25 }))
  g.add(outline, body)
  // click ripple
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.08, 40), new THREE.MeshBasicMaterial({ color: '#9fb3ff', transparent: true, opacity: 0, toneMapped: false, depthWrite: false }))
  g.add(ring)
  return { group: g, ring }
}

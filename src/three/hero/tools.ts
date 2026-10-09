import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { TOOL_PATHS } from '../toolPaths'
import { cachedGeo, coin, glass, label, textTexture, plane, type Quality } from '../kit'

export interface ToolDef {
  id: string
  name: string
  /** monogram instead of a path (Adobe apps) */
  mono?: string
  group: 'ai' | 'design' | 'web' | 'build'
}
export const TOOLS: ToolDef[] = [
  { id: 'claude', name: 'Claude', group: 'ai' },
  { id: 'chatgpt', name: 'ChatGPT', group: 'ai' },
  { id: 'midjourney', name: 'Midjourney', group: 'ai' },
  { id: 'figma', name: 'Figma', group: 'design' },
  { id: 'photoshop', name: 'Photoshop', mono: 'Ps', group: 'design' },
  { id: 'illustrator', name: 'Illustrator', mono: 'Ai', group: 'design' },
  { id: 'framer', name: 'Framer', group: 'web' },
  { id: 'webflow', name: 'Webflow', group: 'web' },
  { id: 'wordpress', name: 'WordPress', group: 'web' },
  { id: 'wix', name: 'Wix', group: 'web' },
  { id: 'unity', name: 'Unity', group: 'build' },
  { id: 'godot', name: 'Godot', group: 'build' },
]

/** Extruded geometry from a 24×24 icon path, centred and normalised to a 1-unit box. */
function iconGeometry(id: string): THREE.BufferGeometry | null {
  const def = TOOL_PATHS[id]
  if (!def) return null
  return cachedGeo(`icon:${id}`, () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${def.d}" ${def.stroke ? 'fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"' : 'fill="#fff"'}/></svg>`
    const data = new SVGLoader().parse(svg)
    const geos: THREE.BufferGeometry[] = []
    for (const p of data.paths) {
      if (def.stroke) {
        for (const sp of p.subPaths) {
          const g = SVGLoader.pointsToStroke(sp.getPoints(), { ...SVGLoader.getStrokeStyle(1.6, '#fff', 'round', 'round', 4) })
          if (g) geos.push(g)
        }
      } else {
        for (const s of SVGLoader.createShapes(p)) geos.push(new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.12, bevelSegments: 2, curveSegments: 10 }))
      }
    }
    const merged = mergeSimple(geos)
    merged.computeBoundingBox()
    const bb = merged.boundingBox!
    const c = bb.getCenter(new THREE.Vector3())
    merged.translate(-c.x, -c.y, -c.z)
    const s = 1 / Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y)
    merged.scale(s, -s, def.stroke ? s * 6 : s) // SVG y points down; stroke geometry is flat, give it presence
    merged.computeVertexNormals()
    return merged
  })
}

/** minimal non-indexed merge (avoids pulling in BufferGeometryUtils) */
function mergeSimple(list: THREE.BufferGeometry[]) {
  const pos: number[] = []
  for (const g0 of list) {
    const g = g0.index ? g0.toNonIndexed() : g0
    const a = g.getAttribute('position')
    for (let i = 0; i < a.count; i++) pos.push(a.getX(i), a.getY(i), a.getZ(i))
    g0.dispose()
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  return out
}

let iconMat: THREE.MeshStandardMaterial | null = null
const iconMaterial = () =>
  (iconMat ??= new THREE.MeshStandardMaterial({ color: '#eef2ff', emissive: new THREE.Color('#b8c8ff'), emissiveIntensity: 0.55, metalness: 0.2, roughness: 0.35, side: THREE.DoubleSide }))

export interface Token {
  def: ToolDef
  root: THREE.Group // positioned by the orbit
  face: THREE.Group // turned toward the camera
  shell: THREE.Mesh
  setQuality(q: Quality): void
}

export function makeToken(def: ToolDef, radius: number, q: Quality): Token {
  const root = new THREE.Group()
  const face = new THREE.Group()
  root.add(face)
  const shellMat = glass(q, '#dfe6ff', { thickness: 0.35 })
  const shell = new THREE.Mesh(coin(radius, radius * 0.34), shellMat)
  face.add(shell)
  const s = radius * 1.0
  const geo = iconGeometry(def.id)
  if (geo) {
    const icon = new THREE.Mesh(geo, iconMaterial())
    icon.scale.set(s, s, s)
    face.add(icon)
  } else {
    // Monogram (Adobe apps): a text face inside the glass
    const { tex, aspect } = textTexture(def.mono ?? def.name.slice(0, 2), { size: 96, weight: 650, color: '#eef2ff', pad: 10 })
    const m = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }))
    m.scale.set(s * 0.95 * aspect * 0.62, s * 0.95 * 0.62, 1)
    m.position.z = radius * 0.02
    face.add(m)
  }
  const name = label(def.name, radius * 0.42, { size: 48, weight: 500, color: '#dfe5f6', opacity: 0.9 })
  name.position.set(0, -radius * 1.55, 0)
  face.add(name)
  return {
    def,
    root,
    face,
    shell,
    setQuality(nq) {
      const old = shell.material as THREE.Material
      shell.material = glass(nq, '#dfe6ff', { thickness: 0.35 })
      old.dispose()
    },
  }
}

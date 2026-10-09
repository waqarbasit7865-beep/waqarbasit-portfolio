/**
 * Product-design capabilities as compact 3D models for the introduction (illustrative, no brand marks):
 *  • User flows       — three connected nodes (start → decision → outcome) with a travelling signal
 *  • Wireframes → UI  — one screen that resolves from wireframe to finished interface and back
 *  • Prototypes       — a phone where a pointer taps a row and the next screen slides in
 *  • Design systems   — reusable layers (tokens, button, toggle) stacked in an exploded view
 * Each sits on a polished carrier like the tool logos, so the orbit reads as one family, and carries a crisp label.
 */
import * as THREE from 'three'
import { GlowPath, clamp01, inOutCubic, outCubic, plane, roundedBox, satin, seg, sphere, smooth } from '../kit'
import { Surface, UI, chip, rrect, skeleton, text, pointerMesh, type Painter } from '../ui'
import { crispLabel } from './tools'

export type SkillId = 'flow' | 'wire' | 'proto' | 'system'
export const SKILLS: { id: SkillId; name: string }[] = [
  { id: 'flow', name: 'User flows' },
  { id: 'wire', name: 'Wireframes → UI' },
  { id: 'proto', name: 'Prototypes' },
  { id: 'system', name: 'Design systems' },
]

export interface SkillModel {
  id: SkillId
  root: THREE.Group
  face: THREE.Group
  rim: THREE.MeshBasicMaterial
  label: THREE.Mesh
  /** idle animation; `t` in seconds (0 = resolved still pose) */
  tick(t: number, still: boolean): void
  dispose(): void
}

let carrier: THREE.MeshPhysicalMaterial | null = null
const carrierMat = () =>
  (carrier ??= new THREE.MeshPhysicalMaterial({ color: '#121827', metalness: 0.5, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.05 }))

function faceOf(surf: Surface, w: number, h: number, z: number) {
  const m = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: surf.tex, transparent: true, toneMapped: false, depthWrite: false }))
  m.scale.set(w, h, 1)
  m.position.z = z
  return m
}
const op = (m: THREE.Mesh, o: number) => ((m.material as THREE.MeshBasicMaterial).opacity = o)

/* ───────── painters ───────── */
const wirePaint: Painter = (x, w, h) => {
  const H = (h / w) * 1000
  rrect(x, 0, 0, 1000, H, 40, UI.wireFill, UI.wire, 4)
  skeleton(x, 60, 80, 260, 26)
  rrect(x, 700, 52, 240, 56, 28, undefined, UI.wire, 4)
  for (let i = 0; i < 3; i++) rrect(x, 60 + i * 300, 160, 270, 170, 18, undefined, UI.wire, 4)
  for (let i = 0; i < 3; i++) skeleton(x, 60, 400 + i * 62, 520 - i * 90, 20)
}
const uiPaint: Painter = (x, w, h) => {
  const H = (h / w) * 1000
  rrect(x, 0, 0, 1000, H, 40, '#141a2b')
  text(x, 'Projects', 60, 82, 52, UI.text, 650)
  rrect(x, 700, 52, 240, 56, 28, UI.accent)
  text(x, '+ New', 820, 81, 30, '#fff', 650, 'center')
  const c = [UI.accentSoft, UI.green, UI.amber]
  for (let i = 0; i < 3; i++) {
    rrect(x, 60 + i * 300, 160, 270, 170, 18, '#1c2338')
    rrect(x, 84 + i * 300, 190, 110, 12, 6, c[i])
    text(x, ['12', '4', '18'][i], 84 + i * 300, 270, 64, UI.text, 650)
  }
  ;['Homepage review', 'Q3 roadmap', 'Design tokens'].forEach((t, i) => {
    rrect(x, 60, 376 + i * 62, 880, 48, 12, '#182036')
    text(x, t, 90, 401 + i * 62, 26, '#c9d1e6', 500)
  })
}
const listPaint: Painter = (x, w, h) => {
  const H = (h / w) * 1000
  rrect(x, 0, 0, 1000, H, 90, '#141a2b')
  text(x, 'Inbox', 80, 150, 90, UI.text, 650)
  ;['Review request', 'Design handoff', 'Sprint notes', 'Onboarding'].forEach((t, i) => {
    const y = 280 + i * 230
    rrect(x, 60, y, 880, 190, 40, i === 0 ? '#1f2a4d' : '#1a2035', i === 0 ? UI.accentSoft : undefined, 5)
    text(x, t, 110, y + 76, 58, UI.text, 600)
    skeleton(x, 110, y + 140, 420, 22, '#2f3a62')
  })
}
const detailPaint: Painter = (x, w, h) => {
  const H = (h / w) * 1000
  rrect(x, 0, 0, 1000, H, 90, '#141a2b')
  text(x, '‹  Review request', 70, 150, 64, UI.accentSoft, 600)
  text(x, 'Homepage', 80, 300, 96, UI.text, 650)
  chip(x, 'Ready', 80, 420, 'green', 48)
  for (let i = 0; i < 4; i++) skeleton(x, 80, 560 + i * 80, 820 - i * 120, 26, '#2f3a62')
  rrect(x, 80, H - 260, 840, 150, 75, UI.accent)
  text(x, 'Approve', 500, H - 184, 64, '#fff', 650, 'center')
}

/* ───────── models ───────── */
function base(w: number, h: number, brand: string) {
  const face = new THREE.Group()
  const d = 0.07
  const body = new THREE.Mesh(roundedBox(w, h, d, Math.min(w, h) * 0.16, 5), carrierMat())
  face.add(body)
  const rim = new THREE.MeshBasicMaterial({ color: brand, transparent: true, opacity: 0.3, toneMapped: false, depthWrite: false })
  const rimMesh = new THREE.Mesh(roundedBox(w * 1.04, h * 1.05, d * 0.4, Math.min(w, h) * 0.18, 4), rim)
  rimMesh.position.z = -d * 0.3
  face.add(rimMesh)
  return { face, rim, top: d / 2 }
}

export function makeSkill(id: SkillId, size: number, labelH: number): SkillModel {
  const root = new THREE.Group()
  const w = size
  const h = size * 0.78
  const { face, rim, top } = base(w, h, '#5B7CFF')
  root.add(face)
  const name = SKILLS.find((s) => s.id === id)!.name
  const label = crispLabel(name, labelH, '#EAF0FF', 600)
  label.position.set(0, -h / 2 - labelH * 0.75, 0.02)
  face.add(label)
  const disposers: (() => void)[] = []
  let tick: SkillModel['tick'] = () => undefined

  if (id === 'flow') {
    const mk = (col: string, shape: 'pill' | 'diamond' | 'ring') => {
      if (shape === 'ring') {
        const m = new THREE.Mesh(new THREE.TorusGeometry(w * 0.075, w * 0.026, 12, 40), satin(col, { metalness: 0.3, roughness: 0.25, clearcoat: 1, emissive: new THREE.Color(col), emissiveIntensity: 0.35 }))
        return m
      }
      const s = shape === 'pill' ? [w * 0.22, w * 0.11] : [w * 0.13, w * 0.13]
      const m = new THREE.Mesh(roundedBox(s[0], s[1], w * 0.07, s[1] * 0.45, 3), satin(col, { metalness: 0.25, roughness: 0.25, clearcoat: 1, emissive: new THREE.Color(col), emissiveIntensity: 0.3 }))
      if (shape === 'diamond') m.rotation.z = Math.PI / 4
      return m
    }
    const pts = [new THREE.Vector3(-w * 0.28, h * 0.2, top + 0.05), new THREE.Vector3(0, -h * 0.05, top + 0.08), new THREE.Vector3(w * 0.29, h * 0.2, top + 0.05)]
    const nodes = [mk(UI.green, 'pill'), mk(UI.accent, 'diamond'), mk(UI.violet, 'ring')]
    nodes.forEach((n, i) => {
      n.position.copy(pts[i])
      face.add(n)
    })
    const links = [0, 1].map((i) => {
      const a = pts[i]
      const b = pts[i + 1]
      const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -h * 0.12, 0.02))
      const p = new GlowPath([a, mid, b], 0.006, '#9fb3ff', '#ffffff', 32)
      p.mat.uniforms.uSpeed.value = 0
      face.add(p.mesh)
      disposers.push(() => p.dispose())
      return p
    })
    // a muted "no" branch from the decision
    const alt = new GlowPath([pts[1], pts[1].clone().add(new THREE.Vector3(w * 0.06, -h * 0.22, 0)), new THREE.Vector3(w * 0.24, -h * 0.28, top + 0.04)], 0.004, '#5d6785', '#9fb3ff', 24)
    alt.mat.uniforms.uSpeed.value = 0
    face.add(alt.mesh)
    disposers.push(() => alt.dispose())
    const altNode = new THREE.Mesh(sphere(w * 0.025, 12), new THREE.MeshBasicMaterial({ color: '#7d88a8', toneMapped: false }))
    altNode.position.set(w * 0.25, -h * 0.28, top + 0.04)
    face.add(altNode)
    tick = (t, still) => {
      const cyc = still ? 0.999 : (t % 3.2) / 3.2
      links.forEach((p, i) => {
        const ph = clamp01(cyc * 2 - i)
        p.set(1, 0.9, 0, !still && ph > 0 && ph < 1 ? 1 : 0)
        p.mat.uniforms.uPhase.value = Math.min(ph, 0.999)
      })
      alt.set(1, 0.45, 0, 0)
      nodes.forEach((n, i) => {
        const hit = still ? 0 : Math.max(0, 1 - Math.abs(cyc * 2 - i) * 4)
        n.scale.setScalar(1 + hit * 0.18)
      })
      nodes[2].rotation.y = still ? 0 : t * 0.8
    }
  } else if (id === 'wire') {
    const sw = w * 0.84
    const sh = h * 0.72
    const screen = new THREE.Mesh(roundedBox(sw, sh, 0.03, 0.03, 3), satin('#0d1220', { metalness: 0.3, roughness: 0.3, clearcoat: 1 }))
    screen.position.z = top + 0.03
    face.add(screen)
    const s1 = new Surface(Math.round(sw * 700), Math.round(sh * 700), wirePaint)
    const s2 = new Surface(Math.round(sw * 700), Math.round(sh * 700), uiPaint)
    const f1 = faceOf(s1, sw * 0.98, sh * 0.98, top + 0.047)
    const f2 = faceOf(s2, sw * 0.98, sh * 0.98, top + 0.048)
    face.add(f1, f2)
    // scan bar that sweeps across as the wireframe resolves
    const bar = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ color: '#9fb3ff', transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }))
    bar.scale.set(0.012, sh * 0.96, 1)
    bar.position.z = top + 0.05
    face.add(bar)
    disposers.push(() => {
      s1.tex.dispose()
      s2.tex.dispose()
    })
    tick = (t, still) => {
      // hold wireframe → sweep → hold interface → fade back
      const c = still ? 2.5 : t % 6
      const k = c < 1.6 ? 0 : c < 2.6 ? inOutCubic(seg(c, 1.6, 2.6)) : c < 5.2 ? 1 : 1 - smooth(seg(c, 5.2, 6))
      op(f2, k)
      op(f1, 1 - k * 0.92)
      const sweeping = c >= 1.6 && c < 2.6
      op(bar, sweeping ? 0.75 : 0)
      bar.position.x = -sw / 2 + sw * k
    }
  } else if (id === 'proto') {
    const pw = w * 0.42
    const ph = h * 0.9
    const phone = new THREE.Mesh(roundedBox(pw, ph, 0.05, pw * 0.16, 4), satin('#0b0e18', { metalness: 0.6, roughness: 0.25, clearcoat: 1 }))
    phone.position.set(-w * 0.12, 0, top + 0.04)
    face.add(phone)
    const s1 = new Surface(Math.round(pw * 900), Math.round(ph * 900), listPaint)
    const s2 = new Surface(Math.round(pw * 900), Math.round(ph * 900), detailPaint)
    const f1 = faceOf(s1, pw * 0.9, ph * 0.93, top + 0.067)
    const f2 = faceOf(s2, pw * 0.9, ph * 0.93, top + 0.068)
    f1.position.x = f2.position.x = -w * 0.12
    face.add(f1, f2)
    const ptr = pointerMesh(w * 0.13)
    face.add(ptr.group)
    // hotspot link: the prototype connection from the tapped row to the next screen
    const link = new GlowPath([new THREE.Vector3(-w * 0.02, h * 0.18, top + 0.08), new THREE.Vector3(w * 0.2, h * 0.3, top + 0.1), new THREE.Vector3(w * 0.32, h * 0.05, top + 0.08)], 0.005, '#7d9bff', '#ffffff', 24)
    link.mat.uniforms.uSpeed.value = 0
    face.add(link.mesh)
    const target = new THREE.Mesh(roundedBox(w * 0.14, w * 0.2, 0.02, 0.012, 2), satin('#1b2236', { metalness: 0.3, roughness: 0.3, clearcoat: 1, emissive: new THREE.Color('#2F5BFF'), emissiveIntensity: 0.25 }))
    target.position.set(w * 0.32, -h * 0.05, top + 0.05)
    face.add(target)
    disposers.push(() => {
      s1.tex.dispose()
      s2.tex.dispose()
      link.dispose()
    })
    const rowAt = new THREE.Vector3(-w * 0.12, h * 0.17, top + 0.12)
    const rest = new THREE.Vector3(w * 0.22, -h * 0.22, top + 0.14)
    tick = (t, still) => {
      const c = still ? 3.0 : t % 4.4
      const go = inOutCubic(seg(c, 0.3, 1.1))
      const back = inOutCubic(seg(c, 3.4, 4.2))
      ptr.group.position.lerpVectors(rest, rowAt, go * (1 - back))
      const tap = seg(c, 1.1, 1.5)
      ptr.ring.scale.setScalar(1 + tap * 2.2)
      op(ptr.ring, tap > 0 && tap < 1 ? (1 - tap) * 0.9 : 0)
      const sw = outCubic(seg(c, 1.35, 1.9)) * (1 - smooth(seg(c, 3.6, 4.3)))
      op(f2, sw)
      op(f1, 1 - sw)
      f2.position.x = -w * 0.12 + (1 - sw) * pw * 0.25
      link.set(1, 0.35 + 0.5 * sw, 0, !still && tap > 0 && c < 2.2 ? 1 : 0)
      link.mat.uniforms.uPhase.value = Math.min(seg(c, 1.1, 2.0), 0.999)
      ptr.group.visible = !still
    }
  } else {
    // design system: tokens → button → toggle, exploded in depth
    const layer = (lw: number, lh: number, painter: Painter) => {
      const g = new THREE.Group()
      g.add(new THREE.Mesh(roundedBox(lw, lh, 0.03, lh * 0.3, 3), satin('#151b2d', { metalness: 0.35, roughness: 0.28, clearcoat: 1 })))
      const s = new Surface(Math.round(lw * 900), Math.round(lh * 900), painter)
      g.add(faceOf(s, lw * 0.97, lh * 0.94, 0.017))
      disposers.push(() => s.tex.dispose())
      face.add(g)
      return g
    }
    const sw = [UI.accent, UI.violet, UI.green, UI.amber, '#EEF2FB']
    const tokens = layer(w * 0.86, h * 0.22, (x, cw, ch) => {
      const H = (ch / cw) * 1000
      rrect(x, 0, 0, 1000, H, H * 0.3, '#151b2d')
      sw.forEach((c, i) => {
        x.beginPath()
        x.arc((110 + i * 195) * x.u, (H / 2) * x.u, H * 0.3 * x.u, 0, Math.PI * 2)
        x.fillStyle = c
        x.fill()
      })
    })
    const btn = new THREE.Group()
    const bm = new THREE.Mesh(roundedBox(w * 0.5, h * 0.2, 0.05, h * 0.1, 4), satin(UI.accent, { metalness: 0.2, roughness: 0.25, clearcoat: 1, emissive: new THREE.Color('#1c3bd9'), emissiveIntensity: 0.35 }))
    const bs = new Surface(Math.round(w * 0.5 * 900), Math.round(h * 0.2 * 900), (x, cw, ch) => text(x, 'Button', 500, ((ch / cw) * 1000) / 2 + 4, ((ch / cw) * 1000) * 0.5, '#ffffff', 650, 'center'))
    disposers.push(() => bs.tex.dispose())
    const bf = faceOf(bs, w * 0.5, h * 0.2, 0.026)
    btn.add(bm, bf)
    face.add(btn)
    const tog = new THREE.Group()
    const track = new THREE.Mesh(roundedBox(w * 0.26, h * 0.15, 0.035, h * 0.075, 4), satin('#2a3352', { metalness: 0.3, roughness: 0.3, clearcoat: 1 }))
    const knob = new THREE.Mesh(sphere(h * 0.058, 24), satin('#ffffff', { metalness: 0.1, roughness: 0.2, clearcoat: 1 }))
    tog.add(track, knob)
    face.add(tog)
    const trackMat = track.material as THREE.MeshPhysicalMaterial
    const off = new THREE.Color('#2a3352')
    const on = new THREE.Color(UI.green)
    tick = (t, still) => {
      const br = still ? 0.6 : 0.5 + 0.5 * Math.sin(t * 0.9)
      const gap = 0.03 + br * 0.05
      tokens.position.set(0, -h * 0.26, top + 0.02)
      btn.position.set(-w * 0.16, h * 0.02, top + 0.02 + gap)
      tog.position.set(w * 0.25, h * 0.02, top + 0.02 + gap)
      // the same tokens feed both components: the toggle flips on a slow beat
      const k = still ? 1 : smooth(seg((t % 4) / 4, 0.35, 0.5)) * (1 - smooth(seg((t % 4) / 4, 0.85, 1)))
      knob.position.set(lerpN(-w * 0.065, w * 0.065, k), 0, 0.03)
      trackMat.color.copy(off).lerp(on, k)
      const press = still ? 0 : Math.max(0, Math.sin(((t + 1.3) % 4) / 4 * Math.PI * 2)) ** 8
      btn.scale.z = 1 - press * 0.45
      tokens.rotation.x = -0.25
    }
  }

  return {
    id,
    root,
    face,
    rim,
    label,
    tick,
    dispose: () => disposers.forEach((f) => f()),
  }
}
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t

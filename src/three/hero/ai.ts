/**
 * 04 · AI + human judgment — "AI-assisted exploration. Human-led design."
 * Choreography: TRANSFORMATION. A seed bursts into a cloud of possibilities (many small interface tiles in
 * orbit); they organise into three candidate directions; a human selection ring settles on one; the chosen
 * direction is refined into a single, ordered result while the others fall away.
 */
import * as THREE from 'three'
import { COL, label, lerp, outBack, outCubic, inOutCubic, inCubic, roundedBox, satin, seg, setOpacity, torus, glow, type Quality } from '../kit'
import { WIN, type Comp, type Ctx } from './common'

const N = 72

export class AiComp implements Comp {
  group = new THREE.Group()
  box = { w: 5.2, h: 4.2 }
  private rig = new THREE.Group()
  private tiles: THREE.InstancedMesh
  private cloud: THREE.Vector3[] = []
  private cloudQ: THREE.Quaternion[] = []
  private cand: THREE.Vector3[] = []
  private refined: THREE.Vector3[] = []
  private refinedS: THREE.Vector3[] = []
  private ring: THREE.Mesh
  private ringGlow: THREE.Mesh
  private panel: THREE.Mesh
  private letters: THREE.Mesh[] = []
  private resultLabel: THREE.Mesh
  private m = new THREE.Matrix4()
  private q = new THREE.Quaternion()
  private s = new THREE.Vector3()
  private p = new THREE.Vector3()
  private qi = new THREE.Quaternion()

  constructor(_q: Quality) {
    this.group.add(this.rig)
    this.tiles = new THREE.InstancedMesh(roundedBox(0.3, 0.2, 0.04, 0.03, 2), satin('#ffffff', { clearcoat: 1, clearcoatRoughness: 0.2, roughness: 0.35, emissive: new THREE.Color('#0d1638'), emissiveIntensity: 0.4 }), N)
    this.tiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    const palette = [COL.blueSoft, COL.lilac, COL.violet, COL.teal, COL.blue, new THREE.Color('#d9def0')]
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      // possibilities: a fibonacci sphere
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const th = golden * i
      const p = new THREE.Vector3(Math.cos(th) * r, y * 0.86, Math.sin(th) * r).multiplyScalar(1.62)
      this.cloud.push(p)
      this.cloudQ.push(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(p, new THREE.Vector3(), new THREE.Vector3(0, 1, 0))))
      // three candidate directions (A irregular, B ordered, C sparse)
      const ci = i % 3
      const k = Math.floor(i / 3)
      const col = k % 4
      const row = Math.floor(k / 4)
      const jitter = ci === 0 ? [Math.sin(i * 1.7) * 0.07, Math.cos(i * 2.3) * 0.06] : ci === 2 ? [0, 0] : [0, 0]
      const spread = ci === 2 ? 1.25 : 1
      this.cand.push(new THREE.Vector3(-1.75 + ci * 1.75 + (col - 1.5) * 0.36 * spread + jitter[0], (2.5 - row) * 0.26 * spread + jitter[1], ci === 1 ? 0.3 : -0.2))
      // refined result (only B's tiles): an ordered interface — header, nav column, cards, chart row
      this.refined.push(new THREE.Vector3())
      this.refinedS.push(new THREE.Vector3(1, 1, 1))
      this.tiles.setColorAt(i, palette[(i * 7) % palette.length])
    }
    this.layoutRefined()
    this.tiles.instanceColor!.needsUpdate = true
    this.rig.add(this.tiles)

    this.panel = new THREE.Mesh(roundedBox(2.75, 1.85, 0.06, 0.07), satin('#121827', { clearcoat: 1, clearcoatRoughness: 0.15, transparent: true }))
    this.panel.position.set(0, 0, 0.05)
    this.rig.add(this.panel)

    this.ring = new THREE.Mesh(torus(1.0, 0.012, 160), glow('#f4f1e8', 0.95))
    this.ringGlow = new THREE.Mesh(torus(1.0, 0.05, 120), glow('#7d9bff', 0.18))
    this.rig.add(this.ring, this.ringGlow)
    ;['A', 'B', 'C'].forEach((t, i) => {
      const l = label(t, 0.16, { size: 52, weight: 600, color: i === 1 ? '#ffffff' : '#9aa6c8', font: '"Geist Mono Variable", ui-monospace, monospace' })
      l.position.set(-1.75 + i * 1.75, 1.05, 0.3)
      this.letters.push(l)
      this.rig.add(l)
    })
    this.resultLabel = label('Refined direction · human-reviewed', 0.1, { size: 42, weight: 500, color: '#c9d3ee', font: '"Geist Mono Variable", ui-monospace, monospace' })
    this.resultLabel.position.set(0, -1.18, 0.1)
    this.rig.add(this.resultLabel)
  }

  /** B's 24 tiles become a tidy dashboard-like structure */
  private layoutRefined() {
    const slots: [number, number, number, number][] = []
    slots.push([0, 0.72, 2.5, 0.16]) // header
    for (let i = 0; i < 4; i++) slots.push([-1.0, 0.42 - i * 0.22, 0.5, 0.13]) // navigation
    for (let i = 0; i < 3; i++) slots.push([-0.3 + i * 0.62, 0.36, 0.56, 0.36]) // cards
    const hs = [0.2, 0.32, 0.26, 0.42, 0.36, 0.48, 0.4, 0.52]
    for (let i = 0; i < 8; i++) slots.push([-0.5 + i * 0.105, -0.78 + hs[i] / 2, 0.07, hs[i]]) // chart
    for (let i = 0; i < 3; i++) slots.push([-0.48 + i * 0.27, 0.04, 0.22, 0.08]) // status chips
    for (let i = 0; i < 4; i++) slots.push([0.82, 0.02 - i * 0.16, 0.8, 0.1]) // list rows
    slots.push([0.82, -0.7, 0.8, 0.16]) // primary action
    let b = 0
    for (let i = 0; i < N; i++) {
      if (i % 3 !== 1) continue
      const [x, y, w, h] = slots[b++] ?? [0, 0, 0.1, 0.1]
      this.refined[i].set(x, y, 0.12)
      this.refinedS[i].set(w / 0.3, h / 0.2, 1)
    }
  }

  setQuality() {}

  update(c: Ctx) {
    const { T, clock } = c
    const [i0] = WIN[3].in
    const e = outCubic(seg(T, i0, 6.4)) // seed → cloud
    const k = inOutCubic(seg(T, 6.4, 6.85)) // cloud → candidates
    const r = inOutCubic(seg(T, 6.85, 7.3)) // candidates → refined
    const o = seg(T, WIN[3].out[0], WIN[3].out[1])
    this.group.visible = T >= i0 - 0.001 && T <= WIN[3].out[1] + 0.001
    if (!this.group.visible) return
    const idle = c.still ? 0 : clock

    this.rig.rotation.set(-0.08 - c.pointer.y * 0.05, -0.22 + c.pointer.x * 0.1 + (1 - k) * idle * 0.0, 0)
    this.rig.position.set(0, 0, -1.4 * inCubic(o))
    const spin = (1 - k) * (idle * 0.18 + e * 1.2)
    const cosS = Math.cos(spin)
    const sinS = Math.sin(spin)
    this.qi.setFromAxisAngle(new THREE.Vector3(0, 1, 0), spin)

    for (let i = 0; i < N; i++) {
      const ci = i % 3
      const cl = this.cloud[i]
      // rotate cloud position around Y
      const cx = cl.x * cosS + cl.z * sinS
      const cz = -cl.x * sinS + cl.z * cosS
      this.p.set(cx * e, cl.y * e, cz * e)
      this.p.lerp(this.cand[i], k)
      this.q.copy(this.qi).multiply(this.cloudQ[i]).slerp(new THREE.Quaternion(), k)
      let sc = Math.max(outBack(seg(T, i0 + (i % 12) * 0.02, i0 + 0.35 + (i % 12) * 0.02), 1.5), 0.0001)
      this.s.set(sc, sc, sc)
      if (ci === 1) {
        this.p.lerp(this.refined[i], r)
        this.s.set(lerp(sc, this.refinedS[i].x, r), lerp(sc, this.refinedS[i].y, r), 1)
      } else {
        // discarded directions dim, shrink and fall back
        const d = r
        this.p.z -= d * 1.2
        this.p.y -= d * 0.6
        sc *= 1 - outCubic(seg(r, 0, 0.6))
        this.s.setScalar(Math.max(sc * lerp(1, 0.75, k), 0.0001))
      }
      this.s.multiplyScalar(1 - outCubic(o) * 0.0)
      this.m.compose(this.p, this.q, this.s)
      this.tiles.setMatrixAt(i, this.m)
    }
    this.tiles.instanceMatrix.needsUpdate = true

    // selection ring descends onto candidate B, then frames the refined result
    const sel = outCubic(seg(T, 6.55, 6.95))
    this.ring.position.set(0, lerp(2.4, 0.04, sel), 0.32)
    const rs = lerp(lerp(0.7, 1.0, sel), 1.75, r)
    this.ring.scale.set(rs * lerp(1, 1.0, r), rs * lerp(1, 0.66, r), 1)
    this.ringGlow.position.copy(this.ring.position)
    this.ringGlow.scale.copy(this.ring.scale)
    const ringO = sel * (1 - r * 0.55) * (1 - o)
    ;(this.ring.material as THREE.MeshBasicMaterial).opacity = 0.95 * ringO
    ;(this.ringGlow.material as THREE.MeshBasicMaterial).opacity = (0.18 + (c.still ? 0 : Math.sin(idle * 2) * 0.05)) * ringO
    this.ring.visible = this.ringGlow.visible = ringO > 0.01

    this.letters.forEach((l, i) => {
      ;(l.material as THREE.MeshBasicMaterial).opacity = k * (1 - r) * (i === 1 ? 1 : 0.6)
      l.visible = k * (1 - r) > 0.01
    })
    const pa = outCubic(seg(r, 0.35, 1))
    this.panel.scale.set(lerp(0.85, 1, pa), lerp(0.85, 1, pa), 1)
    setOpacity(this.panel, pa * 0.96 * (1 - o))
    ;(this.resultLabel.material as THREE.MeshBasicMaterial).opacity = pa * (1 - o)
    this.resultLabel.visible = pa > 0.01
    setOpacity(this.tiles, 1 - outCubic(o))
  }

  dispose() {}
}

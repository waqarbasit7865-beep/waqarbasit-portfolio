/**
 * 03 · Visual craft — "Precision in every screen. Character in every detail."
 * Choreography: ASSEMBLY. Modelled interface components (type specimen, colour tokens, button, toggle, input,
 * card, chart) arrive from an exploded state and lock onto a precise grid; guides draw first, then a redline
 * measures the spacing, the toggle switches and the button presses — the details that give it character.
 * Illustrative elements — not client work.
 */
import * as THREE from 'three'
import { COL, SERIF, MONO, canvasTexture, label, lerp, outBack, outCubic, inCubic, plane, roundedBox, satin, seg, setOpacity, sphere, type Quality } from '../kit'
import { WIN, type Comp, type Ctx } from './common'

interface Part {
  obj: THREE.Object3D
  home: THREE.Vector3
  from: THREE.Vector3
  rot: THREE.Euler
  delay: number
}

export class CraftComp implements Comp {
  group = new THREE.Group()
  box = { w: 5.0, h: 4.0 }
  private rig = new THREE.Group()
  private plate: THREE.Mesh
  private guides: THREE.Mesh[] = []
  private parts: Part[] = []
  private knob: THREE.Mesh
  private button: THREE.Group
  private redline: THREE.Group
  private gridLines: THREE.LineSegments

  constructor(_q: Quality) {
    this.group.add(this.rig)
    this.plate = new THREE.Mesh(roundedBox(4.1, 3.0, 0.08, 0.08), satin('#121726', { clearcoat: 1, clearcoatRoughness: 0.25, transparent: true }))
    this.rig.add(this.plate)
    // 12-column layout grid engraved on the board
    const pts: number[] = []
    for (let i = 0; i <= 12; i++) {
      const x = -1.9 + (i * 3.8) / 12
      pts.push(x, -1.38, 0.045, x, 1.38, 0.045)
    }
    for (let j = 0; j <= 8; j++) {
      const y = -1.38 + (j * 2.76) / 8
      pts.push(-1.9, y, 0.045, 1.9, y, 0.045)
    }
    const gg = new THREE.BufferGeometry()
    gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    this.gridLines = new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: '#3b4d8f', transparent: true, opacity: 0.35 }))
    this.rig.add(this.gridLines)
    // three key guides (columns 1 / 7 / 13)
    for (const x of [-1.9, 0.0, 1.9]) {
      const g = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ color: COL.blueSoft, transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false }))
      g.scale.set(0.012, 3.4, 1)
      g.position.set(x, 0, 0.06)
      this.guides.push(g)
      this.rig.add(g)
    }

    const add = (obj: THREE.Object3D, x: number, y: number, z: number, delay: number, seed: number) => {
      const r = (k: number) => Math.sin(seed * 12.9898 + k * 78.233) * 0.5 + 0.5
      const home = new THREE.Vector3(x, y, z)
      const from = new THREE.Vector3(x + (r(1) - 0.5) * 4.2, y + (r(2) - 0.3) * 3.2, z + 1.6 + r(3) * 2.4)
      const rot = new THREE.Euler((r(4) - 0.5) * 1.4, (r(5) - 0.5) * 1.6, (r(6) - 0.5) * 1.0)
      obj.position.copy(home)
      this.rig.add(obj)
      this.parts.push({ obj, home, from, rot, delay })
    }

    /* type specimen */
    const type = new THREE.Group()
    const typeTex = canvasTexture(512, 512, (x, w, h) => {
      x.fillStyle = '#1b2134'
      x.fillRect(0, 0, w, h)
      x.fillStyle = '#F4F4F1'
      x.font = `italic 300px ${SERIF}`
      x.textBaseline = 'alphabetic'
      x.fillText('Aa', 44, 330)
      x.font = `500 30px ${MONO}`
      x.fillStyle = '#8f9bc2'
      x.fillText('DISPLAY · INSTRUMENT SERIF', 44, 430)
      x.fillText('TEXT · GEIST 400–600', 44, 472)
    })
    const typeBody = new THREE.Mesh(roundedBox(1.15, 1.15, 0.1, 0.07), satin('#1b2134', { clearcoat: 1 }))
    const typeFace = new THREE.Mesh(plane(), new THREE.MeshBasicMaterial({ map: typeTex, toneMapped: false, transparent: true }))
    typeFace.scale.set(1.08, 1.08, 1)
    typeFace.position.z = 0.051
    type.add(typeBody, typeFace)
    add(type, -1.28, 0.62, 0.1, 0, 1)

    /* colour tokens */
    const sw = [COL.ink, COL.paper, COL.blue, COL.lilac]
    sw.forEach((c, i) => {
      const m = new THREE.Mesh(roundedBox(0.36, 0.36, 0.2, 0.06), satin(c, { clearcoat: 1, clearcoatRoughness: 0.06, roughness: 0.28 }))
      add(m, -0.28 + i * 0.47, 0.98, 0.14, 0.06 + i * 0.03, 2 + i)
    })

    /* primary button */
    this.button = new THREE.Group()
    const btn = new THREE.Mesh(roundedBox(1.12, 0.32, 0.16, 0.15), satin(COL.blue, { emissive: new THREE.Color('#1c3cff'), emissiveIntensity: 0.5, clearcoat: 1, clearcoatRoughness: 0.1 }))
    const btnText = label('Publish design  ↗', 0.12, { size: 48, weight: 600 })
    btnText.position.z = 0.082
    this.button.add(btn, btnText)
    add(this.button, -0.08, 0.36, 0.12, 0.16, 7)

    /* toggle */
    const toggle = new THREE.Group()
    const track = new THREE.Mesh(roundedBox(0.62, 0.3, 0.12, 0.14), satin('#253056', { clearcoat: 1 }))
    this.knob = new THREE.Mesh(sphere(0.11, 32), satin(COL.paper, { clearcoat: 1, roughness: 0.2 }))
    this.knob.position.z = 0.09
    toggle.add(track, this.knob)
    add(toggle, 1.1, 0.36, 0.12, 0.22, 8)

    /* input */
    const input = new THREE.Group()
    const inBody = new THREE.Mesh(roundedBox(1.9, 0.3, 0.08, 0.07), satin('#1a2030', { clearcoat: 0.6 }))
    const inText = label('Search components…', 0.11, { size: 44, weight: 450, color: '#8c96b4' })
    inText.position.set(-0.95 + inText.scale.x / 2 + 0.08, 0, 0.042)
    input.add(inBody, inText)
    add(input, 0.48, -0.1, 0.1, 0.28, 9)

    /* card */
    const card = new THREE.Group()
    const cBody = new THREE.Mesh(roundedBox(1.8, 1.0, 0.12, 0.08), satin('#1d2436', { clearcoat: 1, clearcoatRoughness: 0.2 }))
    const cTitle = label('Project overview', 0.13, { size: 52, weight: 600 })
    cTitle.position.set(-0.9 + cTitle.scale.x / 2 + 0.06, 0.28, 0.062)
    const cCopy = label('A consistent system. A clearer experience.', 0.085, { size: 40, weight: 450, color: '#a9b3cc' })
    cCopy.position.set(-0.9 + cCopy.scale.x / 2 + 0.06, 0.06, 0.062)
    const dot = new THREE.Mesh(sphere(0.04, 16), new THREE.MeshBasicMaterial({ color: '#58e0a8', toneMapped: false }))
    dot.position.set(-0.74, -0.28, 0.07)
    const cStatus = label('Ready for review', 0.085, { size: 40, weight: 500, color: '#9fe8c7' })
    cStatus.position.set(-0.68 + cStatus.scale.x / 2, -0.28, 0.062)
    card.add(cBody, cTitle, cCopy, dot, cStatus)
    add(card, -1.0, -0.8, 0.1, 0.34, 10)

    /* chart */
    const chart = new THREE.Group()
    const chBody = new THREE.Mesh(roundedBox(1.25, 1.0, 0.08, 0.07), satin('#171c2b', { clearcoat: 0.8 }))
    chart.add(chBody)
    const hs = [0.32, 0.5, 0.4, 0.66, 0.56, 0.76]
    const barMat = satin(COL.blueSoft, { emissive: new THREE.Color(COL.blue), emissiveIntensity: 0.3, clearcoat: 1 })
    hs.forEach((h, i) => {
      const b = new THREE.Mesh(roundedBox(0.12, h, 0.12, 0.03), barMat)
      b.position.set(-0.45 + i * 0.18, -0.38 + h / 2, 0.08)
      chart.add(b)
    })
    add(chart, 1.25, -0.8, 0.1, 0.4, 11)

    /* redline: measures the 24 px gap between card and chart */
    this.redline = new THREE.Group()
    const red = new THREE.MeshBasicMaterial({ color: COL.red, toneMapped: false, transparent: true })
    const bar = new THREE.Mesh(plane(), red)
    bar.scale.set(0.5, 0.014, 1)
    const capL = new THREE.Mesh(plane(), red)
    capL.scale.set(0.014, 0.12, 1)
    capL.position.x = -0.25
    const capR = capL.clone()
    capR.position.x = 0.25
    const num = label('24', 0.1, { size: 40, weight: 600, color: '#ff8a8a', font: MONO })
    num.position.y = 0.11
    this.redline.add(bar, capL, capR, num)
    this.redline.position.set(0.14, -0.8, 0.2)
    this.rig.add(this.redline)
  }

  setQuality() {}

  update(c: Ctx) {
    const { T, clock } = c
    const a = seg(T, WIN[2].in[0], WIN[2].in[1])
    const o = seg(T, WIN[2].out[0], WIN[2].out[1])
    this.group.visible = T >= WIN[2].in[0] - 0.001 && T <= WIN[2].out[1] + 0.001
    if (!this.group.visible) return
    const idle = c.still ? 0 : clock

    // board presents itself toward the copy, then recedes on exit
    this.rig.rotation.set(-0.22 - c.pointer.y * 0.05 + 0.15 * (1 - outCubic(a)), 0.36 + c.pointer.x * 0.1 + Math.sin(idle * 0.3) * 0.02, 0)
    this.rig.position.set(0, -0.4 * (1 - outCubic(seg(a, 0, 0.35))), -2.2 * inCubic(o))
    const plateA = outCubic(seg(a, 0, 0.3))
    setOpacity(this.plate, plateA * (1 - o))
    setOpacity(this.gridLines, plateA * (1 - o))
    this.guides.forEach((g, i) => {
      const k = outCubic(seg(a, 0.04 + i * 0.05, 0.3 + i * 0.05))
      g.scale.y = 3.4 * Math.max(k, 0.0001)
      ;(g.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - seg(a, 0.75, 1) * 0.6) * (1 - o)
      g.visible = k > 0.001 && o < 1
    })

    this.parts.forEach((p, i) => {
      const k = seg(a, 0.12 + p.delay, 0.5 + p.delay)
      const e = outBack(k, 1.25)
      const out = inCubic(seg(o, i * 0.04, 0.6 + i * 0.04))
      p.obj.position.lerpVectors(p.from, p.home, e)
      p.obj.position.y += out * 2.4
      p.obj.position.z += out * 1.6
      const r = 1 - outCubic(k) + out * 0.6
      p.obj.rotation.set(p.rot.x * r, p.rot.y * r, p.rot.z * r)
      const vis = Math.min(1, k * 3) * (1 - out)
      p.obj.scale.setScalar(Math.max(lerp(0.6, 1, Math.min(1, k * 1.5)), 0.0001))
      p.obj.visible = vis > 0.01
    })

    // details once everything has landed
    const d = seg(a, 0.82, 1)
    const red = outCubic(seg(d, 0, 0.5))
    this.redline.scale.set(Math.max(red, 0.0001), 1, 1)
    this.redline.visible = red > 0.01 && o < 0.5
    const flip = c.still ? 1 : seg(d, 0.35, 0.7) > 0 ? (Math.floor(idle / 3.2) % 2 === 0 ? 1 : 0) : 0
    this.knob.position.x = lerp(this.knob.position.x, lerp(-0.155, 0.155, flip), c.still ? 1 : 0.12)
    ;(this.knob.material as THREE.MeshPhysicalMaterial).color.lerpColors(COL.paper, COL.lilac, flip * 0.4)
    // the button presses in once, with a soft rebound
    const press = seg(d, 0.45, 0.85)
    const dip = Math.sin(press * Math.PI) * 0.45
    this.button.scale.set(1 - dip * 0.08, 1 - dip * 0.08, Math.max(1 - dip, 0.0001))
  }

  dispose() {}
}

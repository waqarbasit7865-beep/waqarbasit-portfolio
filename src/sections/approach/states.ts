/**
 * Geometry for the Design Approach canvas — an ILLUSTRATIVE process graphic, not client work.
 * The same shapes persist through every state so each step transforms the previous one.
 *
 * Coordinates are % of the canvas (x of width, y of height). Canvas aspect ratio is 5 : 4.
 * State index = step index: 0 Map the workflow · 1 Shape it in low fidelity · 2 Prototype the interaction
 *                           3 Systemise · 4 Hand off cleanly.   -1 = loose notes before step 1.
 */
export type ElId =
  | 'B0' | 'B1' | 'B2' | 'B3' | 'B4' | 'B5'
  | 'n6' | 'n7' | 'n8' | 'n9' | 'q1' | 'q2'
  | 'F' | 'S2' | 'SP' | 'I1' | 'I2' | 'M'
  | 'AS' | 'AT' | 'AR1' | 'AR2'

export interface Geo {
  x: number
  y: number
  w: number
  h: number
  r?: number // rotation (deg)
  o?: number // opacity
  s?: number // scale
}
export type StateGeo = Record<ElId, Geo>

export const BLOCKS: ElId[] = ['B0', 'B1', 'B2', 'B3', 'B4', 'B5']
export const NOTES: ElId[] = ['n6', 'n7', 'n8', 'n9', 'q1', 'q2']
export const ALL: ElId[] = [...BLOCKS, ...NOTES, 'F', 'S2', 'SP', 'I1', 'I2', 'M', 'AS', 'AT', 'AR1', 'AR2']

type Rect = [number, number, number, number]
const g = (r: Rect, extra: Partial<Geo> = {}): Geo => ({ x: r[0], y: r[1], w: r[2], h: r[3], ...extra })
const hidden = (r: Rect, extra: Partial<Geo> = {}): Geo => g(r, { o: 0, ...extra })
/** Place a rect given relative to a frame (both in %) */
const rel = (f: Rect, r: Rect): Rect => [f[0] + (r[0] * f[2]) / 100, f[1] + (r[1] * f[3]) / 100, (r[2] * f[2]) / 100, (r[3] * f[3]) / 100]

/** Wireframe regions, relative to the frame */
const WF: Record<'B0' | 'B1' | 'B2' | 'B3' | 'B4' | 'B5', Rect> = {
  B0: [3, 4, 94, 10], // header
  B1: [3, 18, 20, 78], // navigation
  B2: [26, 18, 34, 34], // content region
  B3: [63, 18, 34, 34], // content region
  B4: [26, 56, 71, 40], // main content
  B5: [30, 82, 18, 8], // primary action
}
const S2_BTN: Rect = [12, 76, 44, 10] // action inside the second (state) screen

const F1: Rect = [6, 8, 88, 84] // wireframe frame (step 2)
const F2: Rect = [3, 14, 62, 72] // frame shifted left for the prototype + system steps
const F3: Rect = [4, 16, 58, 66] // final presentation
const S2R: Rect = [69, 24, 28, 54]
const MR: Rect = [70, 16, 17, 66]

/** Elements not used by a state sit invisibly at a sensible position so the next transition starts nearby */
const base = (): StateGeo => ({
  B0: g([10, 10, 15, 12]), B1: g([64, 8, 15, 12]), B2: g([33, 38, 15, 12]), B3: g([74, 50, 15, 12]),
  B4: g([12, 66, 15, 12]), B5: g([48, 72, 13, 10]),
  n6: g([38, 10, 13, 10]), n7: g([84, 26, 13, 10]), n8: g([58, 36, 13, 10]), n9: g([28, 82, 13, 10]),
  q1: g([22, 36, 6, 7.5]), q2: g([68, 80, 6, 7.5]),
  F: hidden(F1), S2: hidden(S2R, { s: 0.96 }), SP: hidden([69, 5, 28, 15], { s: 0.92 }),
  I1: hidden([72, 8, 12, 5], { s: 0.6 }), I2: hidden([72, 8, 12, 5], { s: 0.6 }), M: hidden(MR, { s: 0.96 }),
  AS: hidden([0, 0, 1, 1]), AT: hidden([0, 0, 1, 1]), AR1: hidden([0, 0, 1, 1]), AR2: hidden([0, 0, 1, 1]),
})

/** -1 · loose notes and open questions */
const pre: StateGeo = {
  ...base(),
  B0: g([10, 10, 15, 12], { r: -6 }), B1: g([64, 8, 15, 12], { r: 4 }), B2: g([33, 38, 15, 12], { r: -3 }),
  B3: g([74, 50, 15, 12], { r: 6 }), B4: g([12, 66, 15, 12], { r: 3 }), B5: g([48, 72, 13, 10], { r: -5 }),
  n6: g([38, 10, 13, 10], { r: 5 }), n7: g([82, 26, 13, 10], { r: -4 }), n8: g([58, 36, 13, 10], { r: 2 }),
  n9: g([28, 82, 13, 10], { r: -6 }), q1: g([22, 36, 6, 7.5]), q2: g([68, 80, 6, 7.5]),
}

/** 0a · notes sort into related clusters; one group gains emphasis */
export const clusters: StateGeo = {
  ...base(),
  B0: g([8, 16, 14, 11]), B1: g([24, 16, 14, 11]), n6: g([8, 30, 14, 11]), q1: g([26, 31, 6, 7.5]),
  B2: g([62, 16, 14, 11], { o: 0.4 }), B3: g([78, 16, 14, 11], { o: 0.4 }), n7: g([62, 30, 14, 11], { o: 0.4 }),
  B4: g([30, 62, 14, 11], { o: 0.4 }), B5: g([46, 62, 14, 11], { o: 0.4 }), n8: g([62, 62, 14, 11], { o: 0.4 }),
  n9: g([30, 76, 14, 11], { o: 0.4 }), q2: g([48, 77, 6, 7.5], { o: 0.4 }),
}

/** 0 · Map the workflow — the same elements become a clear flow */
const flow: StateGeo = {
  ...base(),
  B0: g([4, 44, 15, 11]), B1: g([27, 20, 15, 11]), B2: g([27, 68, 15, 11]), B3: g([51, 44, 15, 11]),
  B4: g([76, 44, 18, 11]), B5: hidden([80, 47, 8, 5]),
  n6: hidden([28, 22, 10, 8], { s: 0.7 }), n7: hidden([52, 46, 10, 8], { s: 0.7 }), n8: hidden([52, 46, 10, 8], { s: 0.7 }),
  n9: hidden([28, 70, 10, 8], { s: 0.7 }), q1: hidden([8, 46, 5, 6], { s: 0.7 }), q2: hidden([78, 46, 5, 6], { s: 0.7 }),
}

const fromFrame = (f: Rect, extra: Partial<Record<ElId, Partial<Geo>>> = {}): StateGeo => {
  const st: StateGeo = { ...flow, F: g(f) }
  ;(Object.keys(WF) as (keyof typeof WF)[]).forEach((k) => {
    st[k] = g(rel(f, WF[k]))
  })
  NOTES.forEach((k) => (st[k] = hidden([f[0] + 30, f[1] + 40, 8, 6], { s: 0.6 })))
  // Elements a state brings in become fully visible at normal scale unless the state says otherwise
  ;(Object.keys(extra) as ElId[]).forEach((k) => (st[k] = { ...st[k], o: 1, s: 1, r: 0, ...extra[k] } as Geo))
  return st
}

/** 1 · Shape it in low fidelity — nodes reshape into a wireframe on a grid */
const wire = fromFrame(F1)
/** 2 · Prototype the interaction — the action links to a second screen state (an edge case) */
const proto = fromFrame(F2, { S2: g(S2R) })
/** 3 · Systemise — same layout, now styled; a component specimen spreads into instances */
const btn = rel(F2, WF.B5)
const s2btn = rel(S2R, S2_BTN)
const system = fromFrame(F2, {
  S2: g(S2R),
  SP: g([69, 5, 28, 15]),
  I1: g(btn),
  I2: g(s2btn),
})
/** 4 · Hand off cleanly — calm presentation with spacing, states and responsive notes */
const f3b2 = rel(F3, WF.B2)
const f3b3 = rel(F3, WF.B3)
const handoff = fromFrame(F3, {
  I1: g(rel(F3, WF.B5)),
  M: g(MR),
  AS: g([f3b2[0] + f3b2[2], f3b2[1] + f3b2[3] / 2 - 4, f3b3[0] - (f3b2[0] + f3b2[2]), 8]),
  AT: g([F3[0], F3[1] + F3[3] + 3, 44, 6]),
  AR1: g([F3[0], F3[1] - 7, 20, 5]),
  AR2: g([MR[0], MR[1] - 7, 17, 5]),
})

export const STATES: Record<number, StateGeo> = { [-1]: pre, 0: flow, 1: wire, 2: proto, 3: system, 4: handoff }

/** Flow connectors (step 1) between node centres; viewBox is 100 × 80 to match the 5 : 4 canvas */
const c = (k: ElId): [number, number] => [flow[k].x + flow[k].w / 2, (flow[k].y + flow[k].h / 2) * 0.8]
const curve = (a: [number, number], b: [number, number]) => {
  const mx = (a[0] + b[0]) / 2
  return `M${a[0]} ${a[1]} C ${mx} ${a[1]}, ${mx} ${b[1]}, ${b[0]} ${b[1]}`
}
export const CONNECTORS = [curve(c('B0'), c('B1')), curve(c('B0'), c('B2')), curve(c('B1'), c('B3')), curve(c('B2'), c('B3')), curve(c('B3'), c('B4'))]
/** Main route for the one-off pulse: start → B1 → B3 → goal */
export const ROUTE = `${curve(c('B0'), c('B1'))} ${curve(c('B1'), c('B3')).replace('M', 'L')} ${curve(c('B3'), c('B4')).replace('M', 'L')}`

/** Prototype link (step 3) from the primary action to the second screen */
const pb: [number, number] = [btn[0] + btn[2], (btn[1] + btn[3] / 2) * 0.8]
const s2l: [number, number] = [S2R[0], (S2R[1] + S2R[3] / 2) * 0.8]
export const PROTO_LINK = `M${pb[0]} ${pb[1]} C ${pb[0] + 8} ${pb[1]}, ${s2l[0] - 8} ${s2l[1]}, ${s2l[0]} ${s2l[1]}`
export const HOTSPOT = { x: btn[0] + btn[2] / 2, y: btn[1] + btn[3] / 2 }
/** Grid guide (step 2): left edge of the content column */
export const GUIDE_X = F1[0] + (WF.B2[0] * F1[2]) / 100

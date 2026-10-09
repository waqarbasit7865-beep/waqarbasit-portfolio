import * as THREE from 'three'
import type { Quality } from '../kit'

/**
 * Hero timeline windows. Every composition reads a time T derived from the GSAP scroll timeline, so scrolling up
 * simply plays everything in reverse. Composition-local windows: Each composition is authored on its own time span below; the page order of the
 * scenes is ORDER, and world.ts maps the global timeline time into each composition's span (see localT).
 */
export const WIN = [
  { in: [-2.6, 0], out: [1.0, 1.45], settle: 0 }, // 01 Introduction — the load animation runs on T ∈ [-2.6, 0]
  { in: [1.47, 2.3], out: [3.2, 3.65], settle: 3.05 }, // 02 Product thinking (morph 2.35 → 3.0)
  { in: [3.66, 4.45], out: [5.4, 5.86], settle: 5.0 }, // 03 Visual craft
  { in: [5.88, 7.3], out: [7.65, 8.05], settle: 7.35 }, // 04 AI + human judgment
  { in: [8.06, 9.0], out: [98, 99], settle: 9.4 }, // 05 Ready to build
] as const

export interface Ctx {
  T: number
  clock: number
  dt: number
  camera: THREE.PerspectiveCamera
  /** -1..1, damped */
  pointer: { x: number; y: number }
  quality: Quality
  /** still image: settled pose, no idle motion */
  still: boolean
  /** world positions other compositions hand objects to (continuity between scenes) */
  handoff: Record<string, THREE.Vector3>
}

export interface Comp {
  group: THREE.Group
  /** nominal size of the composition in world units, used to fit it into the free space */
  box: { w: number; h: number }
  /** resting orientation of the whole composition (yaw), mirrored automatically when it sits on the left */
  update(c: Ctx): void
  setQuality(q: Quality): void
  dispose(): void
  /** world-space points other scenes connect to */
  exports?(): Record<string, THREE.Vector3>
}

/** visible between the start of its entry and the end of its exit */
export const live = (i: number, T: number) => T >= WIN[i].in[0] - 0.001 && T <= WIN[i].out[1] + 0.001

/** page order of the scenes → composition index (0 intro, 1 product flow, 2 visual craft, 3 AI, 4 delivery) */
export const ORDER = [0, 3, 1, 2, 4] as const
/** global timeline span of each page position (matches Hero.tsx BOUNDS) */
const SLOT_SPAN: [number, number][] = [
  [-2.6, 1.45],
  [1.47, 3.65],
  [3.66, 5.86],
  [5.88, 8.05],
  [8.06, 99],
]
/** composition-local span (its WIN entry start → exit end) */
const COMP_SPAN: [number, number][] = [
  [-2.6, 1.45],
  [1.47, 3.65],
  [3.66, 5.86],
  [5.88, 8.05],
  [8.06, 99],
]
/** page position of a composition */
export const slotOf = (comp: number) => ORDER.indexOf(comp as (typeof ORDER)[number])
/** global timeline time → the composition's own time (a linear remap of its page slot onto its authored span) */
export function localT(comp: number, T: number) {
  const s = SLOT_SPAN[slotOf(comp)]
  const c = COMP_SPAN[comp]
  if (s[0] === c[0] && s[1] === c[1]) return T
  return c[0] + ((T - s[0]) * (c[1] - c[0])) / (s[1] - s[0])
}
/** global time at which a composition-local time occurs (inverse of localT) */
export function globalT(comp: number, t: number) {
  const s = SLOT_SPAN[slotOf(comp)]
  const c = COMP_SPAN[comp]
  return s[0] + ((t - c[0]) * (s[1] - s[0])) / (c[1] - c[0])
}

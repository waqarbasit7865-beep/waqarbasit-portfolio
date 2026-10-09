/**
 * Capability checks for the 3D layer. This module never imports three.js, so it is safe in the main bundle.
 *
 * Modes
 *  • 'live'  — WebGL available and motion allowed: one shared renderer animates the active scene.
 *  • 'still' — WebGL available but reduced motion requested: the same 3D scenes are rendered once as still images.
 *  • 'off'   — no WebGL (or it failed): the existing HTML/SVG illustrations are shown instead.
 */
export type Mode3D = 'live' | 'still' | 'off'

let webgl: boolean | null = null
export function hasWebGL(): boolean {
  if (webgl !== null) return webgl
  try {
    if (typeof window === 'undefined') return (webgl = false)
    if (new URLSearchParams(window.location.search).has('no3d')) return (webgl = false)
    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    webgl = !!gl
    // free the probe context immediately
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webgl = false
  }
  return webgl
}

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Phones, small tablets and machines that report very little memory / few cores get simplified scenes. */
export function isLowPower(): boolean {
  if (typeof window === 'undefined') return true
  const nav = navigator as Navigator & { deviceMemory?: number }
  const small = window.matchMedia('(max-width: 1023px), (pointer: coarse)').matches
  const weak = (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) || (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4)
  return small || weak
}

export function mode3D(): Mode3D {
  if (!hasWebGL()) return 'off'
  return reducedMotion() ? 'still' : 'live'
}

/** 3D layer failed at runtime (chunk failed to load, context lost): fall back to the HTML illustrations. */
export function disable3D() {
  webgl = false
  document.documentElement.classList.remove('has-3d')
  document.documentElement.classList.add('no-3d')
}

/** Lazy entry point: the three.js chunk only downloads when a 3D section mounts. */
export const load3D = () => import('./index')

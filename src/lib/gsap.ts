import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
gsap.defaults({ ease: 'power3.out', duration: 0.9 })
// Sections hide themselves when content is missing; don't warn about absent optional targets.
gsap.config({ nullTargetWarn: false })

/** Media query used for all motion. Reduced-motion users get the static, fully visible layout. */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'
export const DESKTOP = '(min-width: 1024px)'

export const EASE = {
  out: 'power3.out',
  expo: 'expo.out',
  inOut: 'power3.inOut',
  mask: 'power4.inOut',
}

export { gsap, ScrollTrigger }

/**
 * Play a reveal once when its trigger is reached, without killing the trigger
 * (`once: true` can remove triggers mid-refresh when a page mounts already scrolled).
 */
export const PLAY_ONCE = 'play none none none'

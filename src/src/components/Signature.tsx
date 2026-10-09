import { useRef } from 'react'
import { site } from '../content/site'
import { gsap, MOTION_OK, PLAY_ONCE } from '../lib/gsap'
import { useIsoLayoutEffect } from '../lib/hooks'

/**
 * Optional handwritten signature that draws itself when scrolled into view.
 * Renders NOTHING until `site.signature` is supplied with a real SVG path from your own signature.
 */
export function Signature({ color = 'currentColor' }: { color?: string }) {
  const sig = site.signature
  const pathRef = useRef<SVGPathElement>(null)

  useIsoLayoutEffect(() => {
    const path = pathRef.current
    if (!path) return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const len = path.getTotalLength()
      gsap.fromTo(
        path,
        { strokeDasharray: len, strokeDashoffset: len },
        {
          strokeDashoffset: 0,
          duration: 2.2,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: path, start: 'top 85%', toggleActions: PLAY_ONCE },
        },
      )
    })
    return () => mm.revert()
  }, [sig])

  if (!sig) return null
  return (
    <svg className="signature" viewBox={sig.viewBox} role="img" aria-label={`${site.name} signature`}>
      <path
        ref={pathRef}
        d={sig.svgPath}
        fill="none"
        stroke={color}
        strokeWidth={sig.strokeWidth ?? 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

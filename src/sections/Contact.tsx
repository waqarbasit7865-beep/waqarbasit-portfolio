import { useRef, useState } from 'react'
import { site } from '../content/site'
import { SplitWords } from '../components/SplitWords'
import { Magnetic } from '../components/Magnetic'
import { ArrowUpRight, Download } from '../components/Icons'
import { gsap, MOTION_OK, PLAY_ONCE } from '../lib/gsap'
import { useIsoLayoutEffect } from '../lib/hooks'
import { scrollToId } from '../lib/nav'

export function Contact() {
  const root = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.matchMedia().add(MOTION_OK, () => {
        // Colour transition: charcoal → electric blue as the section arrives
        gsap.fromTo(
          root.current,
          { backgroundColor: '#0D0E10' },
          {
            backgroundColor: '#2F5BFF',
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top 90%', end: 'top 25%', scrub: true },
          },
        )
        const tl = gsap.timeline({ scrollTrigger: { trigger: '.contact__big', start: 'top 80%', toggleActions: PLAY_ONCE } })
        tl.from('.contact__big .wi', { yPercent: 120, rotate: 4, stagger: 0.07, duration: 1.3, ease: 'expo.out' })
          .from('.contact__mail-rule', { scaleX: 0, transformOrigin: 'left', duration: 1.2, ease: 'power4.inOut' }, 0.4)
          .from('.contact__mail', { yPercent: 60, autoAlpha: 0, duration: 1, ease: 'expo.out' }, 0.5)
          .from('.contact__links li', { y: 30, autoAlpha: 0, stagger: 0.06, duration: 0.8 }, 0.7)
        gsap.to('.contact__ring', {
          rotate: 360,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      window.location.href = `mailto:${site.email}`
    }
  }

  return (
    <section ref={root} id="contact" tabIndex={-1} className="contact" aria-labelledby="contact-title">
      <div className="contact__ring" aria-hidden="true">
        <svg viewBox="0 0 200 200">
          <defs>
            <path id="ring-path" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
          </defs>
          <text>
            <textPath href="#ring-path">UI/UX · PRODUCT DESIGN · DESIGN SYSTEMS · DASHBOARDS · </textPath>
          </text>
        </svg>
      </div>

      <div className="container contact__inner">
        <p className="eyebrow eyebrow--light">
          <span className="tick" aria-hidden="true" /> Contact
        </p>
        <h2 id="contact-title" className="contact__big">
          <span className="contact__line">
            <SplitWords text="Have a complex product?" />
          </span>
          <span className="contact__line">
            <SplitWords text="Let's make it *clear.*" />
          </span>
        </h2>

        <div className="contact__mail-wrap">
          <span className="contact__mail-rule" aria-hidden="true" />
          <a className="contact__mail" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <button className="contact__copy" onClick={copy} aria-live="polite">
            {copied ? 'Copied ✓' : 'Copy email'}
          </button>
        </div>

        <ul className="contact__links" aria-label="Professional profiles">
          {site.links.map((l) => (
            <li key={l.label}>
              <Magnetic>
                <a className="pill" href={l.href} target="_blank" rel="noopener noreferrer">
                  <span className="pill__fill" aria-hidden="true" />
                  <span className="pill__label">
                    {l.label} <ArrowUpRight />
                  </span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Magnetic>
            </li>
          ))}
          <li>
            <Magnetic>
              <a className="pill pill--solid" href={site.resume} download>
                <span className="pill__fill" aria-hidden="true" />
                <span className="pill__label">
                  Download resume <Download />
                </span>
              </a>
            </Magnetic>
          </li>
        </ul>
      </div>

      <footer className="footer container">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
        <span>{site.location}</span>
        <a
          href="/#top"
          onClick={(e) => {
            e.preventDefault()
            scrollToId('top')
          }}
        >
          Back to top ↑
        </a>
      </footer>
    </section>
  )
}

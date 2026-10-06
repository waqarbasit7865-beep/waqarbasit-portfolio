import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { site } from '../content/site'
import { SplitWords } from '../components/SplitWords'
import { pad } from '../lib/content'
import { gsap, ScrollTrigger, MOTION_OK, PLAY_ONCE } from '../lib/gsap'
import { useIsoLayoutEffect } from '../lib/hooks'
import { Canvas } from './approach/Canvas'
import { ALL, STATES, clusters, type ElId, type StateGeo } from './approach/states'

const LIVE = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'

/**
 * Design Approach — the five existing steps (site.approach) in natural document flow,
 * beside one sticky illustrative canvas that evolves as each step comes into focus.
 * Mobile and reduced-motion visitors get each step with its own static visual instead.
 */
export function Approach() {
  const root = useRef<HTMLElement>(null)
  const liveRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(-1)
  const steps = site.approach

  useIsoLayoutEffect(() => {
    const el = root.current
    if (!el) return
    let current = -1
    const ctx = gsap.context(() => {
      /* Active step (all modes): number accent + extending rule + aria-current */
      const items = gsap.utils.toArray<HTMLElement>('.ap-step')
      let goTo: (i: number) => void = () => undefined
      const triggers = items.map((item, i) =>
        ScrollTrigger.create({
          trigger: item,
          start: 'top 58%',
          end: 'bottom 58%',
          onToggle: (self) => {
            if (self.isActive) {
              setActive(i)
              goTo(i)
            }
          },
          onLeaveBack: i === 0 ? () => (setActive(-1), goTo(-1)) : undefined,
        }),
      )

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.from('.approach__title .wi', {
          yPercent: 115,
          stagger: 0.06,
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.approach__title', start: 'top 85%', toggleActions: PLAY_ONCE },
        })
        gsap.from('.playground', {
          y: 60,
          autoAlpha: 0,
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.playground', start: 'top 85%', toggleActions: PLAY_ONCE },
        })
      })

      /* Desktop with motion: one sticky canvas, transformed state by state */
      mm.add(LIVE, () => {
        const cv = liveRef.current
        if (!cv) return
        el.classList.add('approach--live')
        const q = gsap.utils.selector(cv)
        const els = Object.fromEntries(ALL.map((id) => [id, cv.querySelector(`[data-el="${id}"]`)])) as Record<ElId, HTMLElement>
        const links = q('.cv-link')
        const pulse = q('.cv-pulse')
        const proto = q('.cv-proto')
        const ref: { tl: gsap.core.Timeline | null } = { tl: null }

        const place = (st: StateGeo, ids: ElId[] = ALL) =>
          ids.forEach((id) => {
            const g = st[id]
            gsap.set(els[id], { left: `${g.x}%`, top: `${g.y}%`, width: `${g.w}%`, height: `${g.h}%`, rotation: g.r ?? 0, scale: g.s ?? 1, opacity: g.o ?? 1 })
          })
        const apply = (t: gsap.core.Timeline, st: StateGeo, at: number, dur = 0.85, ease = 'power3.inOut') =>
          ALL.forEach((id, k) => {
            const g = st[id]
            t.to(
              els[id],
              { left: `${g.x}%`, top: `${g.y}%`, width: `${g.w}%`, height: `${g.h}%`, rotation: g.r ?? 0, scale: g.s ?? 1, opacity: g.o ?? 1, duration: dur, ease },
              at + (k % 6) * 0.025,
            )
          })

        // Start: loose notes, nothing drawn
        place(STATES[-1])
        gsap.set([...links, ...proto], { strokeDashoffset: 1 })
        gsap.set(pulse, { opacity: 0 })
        cv.dataset.state = '-1'

        goTo = (target: number) => {
          if (target === current) return
          const from = current
          current = target
          ref.tl?.kill()
          const t = gsap.timeline()
          ref.tl = t
          // Undraw anything owned by the state we are leaving
          if (from === 0) t.to(links, { strokeDashoffset: 1, duration: 0.35, ease: 'power2.in' }, 0)
          if (from === 2) t.to(proto, { strokeDashoffset: 1, duration: 0.3, ease: 'power2.in' }, 0)

          if (target === 0 && from < 0) {
            // Notes settle into related clusters, one group gains emphasis…
            t.call(() => void (cv.dataset.state = 'c'), [], 0)
            apply(t, clusters, 0, 0.8, 'back.out(1.15)')
            // …then the same elements reposition into a clear flow; connectors draw; a pulse travels the main route once
            t.call(() => void (cv.dataset.state = '0'), [], 1.25)
            apply(t, STATES[0], 1.25, 0.85)
            t.fromTo(links, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, 1.95)
            t.fromTo(pulse, { strokeDashoffset: 0.07, opacity: 1 }, { strokeDashoffset: -1, duration: 1.2, ease: 'power1.inOut' }, 2.55)
            t.to(pulse, { opacity: 0, duration: 0.2 }, 3.7)
            t.fromTo(els.B4, { scale: 1.07 }, { scale: 1, duration: 0.5, ease: 'power2.out' }, 3.65)
            return
          }

          t.call(() => void (cv.dataset.state = String(target)), [], target < 0 ? 0.4 : 0.05)
          if (target === 0) {
            apply(t, STATES[0], 0.1)
            t.to(links, { strokeDashoffset: 0, duration: 0.45, stagger: 0.05 }, 0.7)
          } else if (target === 1) {
            // Regions snap to the grid; a guide line appears briefly
            apply(t, STATES[1], 0.15, 0.85, 'power3.inOut')
            t.fromTo(q('.cv-guide'), { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, duration: 0.3, ease: 'power2.out' }, 0.7)
              .to(q('.cv-guide'), { opacity: 0, duration: 0.4 }, 1.25)
              .fromTo(els.B2, { x: -6 }, { x: 0, duration: 0.35, ease: 'back.out(3)' }, 0.95)
          } else if (target === 2) {
            // The action links to a second screen state; the connection completes with a tiny pulse
            apply(t, STATES[2], 0.1)
            t.fromTo(proto, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, 0.85)
              .fromTo(q('.cv-hot'), { opacity: 0.9, scale: 0.4 }, { opacity: 0, scale: 1.7, duration: 0.7, ease: 'power2.out' }, 0.75)
              .fromTo(els.S2, { scale: 1.03 }, { scale: 1, duration: 0.45, ease: 'power2.out' }, 1.45)
          } else if (target === 3) {
            // A component specimen spreads into consistent instances; colour specimen softly fills
            if (from < 3) gsap.set([els.I1, els.I2], { left: '74%', top: '10%', width: '12%', height: '5%', opacity: 0, scale: 0.6 })
            apply(t, STATES[3], 0.1)
            t.fromTo(q('.cv-swatches i'), { scale: 0 }, { scale: 1, duration: 0.45, stagger: 0.08, ease: 'power2.out' }, 0.55)
          } else if (target === 4) {
            // Calm presentation; annotations draw into place
            apply(t, STATES[4], 0.1, 0.9)
            t.fromTo(q('.cv-redline'), { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: 'power2.out' }, 0.85)
              .fromTo(q('.cv-states i'), { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.07 }, 0.95)
          } else {
            apply(t, STATES[-1], 0.1, 0.8)
          }
        }

        // Page opened (or restored) part-way through the section: show the matching state immediately
        const now = triggers.findIndex((tr) => tr.isActive)
        if (now >= 0) {
          goTo(now)
          ref.tl?.progress(1)
        }

        // Nothing decorative keeps running offscreen: finish any in-flight transition when the section leaves view
        const io = new IntersectionObserver(([e]) => {
          if (!e.isIntersecting) ref.tl?.progress(1)
        })
        io.observe(el)

        return () => {
          io.disconnect()
          ref.tl?.kill()
          goTo = () => undefined
          current = -1
          el.classList.remove('approach--live')
          delete cv.dataset.state
          gsap.set([...ALL.map((id) => els[id]), ...links, ...proto, ...pulse, ...q('.cv-guide, .cv-hot, .cv-swatches i, .cv-redline, .cv-states i')], { clearProps: 'all' })
        }
      })
    }, el)
    return () => ctx.revert()
  }, [])

  // Keep React's active index in sync if the section unmounts mid-scroll
  useEffect(() => () => setActive(-1), [])

  const cur = active >= 0 ? steps[active] : null

  return (
    <section ref={root} id="approach" tabIndex={-1} className="approach section" aria-labelledby="approach-title">
      <div className="approach__light" aria-hidden="true" />
      <div className="container">
        <header className="approach__head">
          <p className="eyebrow">
            <span className="tick" aria-hidden="true" /> Design approach
          </p>
          <h2 className="approach__title h-xl" id="approach-title">
            <SplitWords text="From tangled workflow to *clean system*" />
          </h2>
        </header>

        <div className="ap-grid">
          <ol className="ap-steps">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className={`ap-step${i === active ? ' is-current' : ''}${i < active ? ' is-past' : ''}`}
                aria-current={i === active ? 'step' : undefined}
                style={{ ['--i' as string]: i } as CSSProperties}
              >
                <div className="ap-step__head">
                  <span className="ap-step__num">{pad(i + 1)}</span>
                  <span className="ap-step__rule" aria-hidden="true" />
                </div>
                <h3 className="ap-step__title">{s.title}</h3>
                <p className="ap-step__body">{s.body}</p>
                <div className="ap-step__visual">
                  <Canvas state={i} />
                  <p className="ap-cap">Illustrative process</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="ap-aside">
            <div className="ap-sticky">
              <Canvas ref={liveRef} state={-1} live />
              <p className="ap-cap">
                Illustrative process
                {cur && (
                  <span>
                    {' '}
                    · {pad(active + 1)} {cur.title}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <Playground />
      </div>
    </section>
  )
}

/* ─────────── Signature interaction: a live token playground (generic demo components, not client work) ─────────── */

const ACCENTS = [
  { name: 'Electric', value: '#2F5BFF', on: '#FFFFFF' },
  { name: 'Ember', value: '#FF6B3D', on: '#140803' },
  { name: 'Teal', value: '#2EC4B6', on: '#03201D' },
  { name: 'Lime', value: '#C6F432', on: '#141A02' },
]
const RADII = [0, 6, 12, 22]
const DENSITY = [
  { name: 'Compact', space: 10 },
  { name: 'Regular', space: 16 },
  { name: 'Airy', space: 24 },
]

function Playground() {
  const [accent, setAccent] = useState(0)
  const [radius, setRadius] = useState(2)
  const [density, setDensity] = useState(1)
  const a = ACCENTS[accent]
  const vars = {
    '--pg-accent': a.value,
    '--pg-on': a.on,
    '--pg-r': `${RADII[radius]}px`,
    '--pg-s': `${DENSITY[density].space}px`,
  } as CSSProperties

  return (
    <div className="playground" style={vars}>
      <div className="playground__intro">
        <p className="eyebrow">
          <span className="tick" aria-hidden="true" /> Signature interaction
        </p>
        <h3 className="h-md">One token change, every component follows.</h3>
        <p className="playground__note">
          A small, live illustration of how I build design systems: components inherit shared tokens, so a single decision
          stays consistent everywhere. <em>Generic demo components — not client work.</em>
        </p>

        <fieldset className="pg-field">
          <legend>Accent</legend>
          <div className="pg-options">
            {ACCENTS.map((c, i) => (
              <label key={c.name} className="pg-swatch" style={{ ['--c' as string]: c.value }}>
                <input type="radio" name="pg-accent" checked={accent === i} onChange={() => setAccent(i)} />
                <span className="sr-only">{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="pg-field">
          <legend>Corner radius</legend>
          <div className="pg-options">
            {RADII.map((r, i) => (
              <label key={r} className="pg-chip">
                <input type="radio" name="pg-radius" checked={radius === i} onChange={() => setRadius(i)} />
                <span>{r}px</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="pg-field">
          <legend>Density</legend>
          <div className="pg-options">
            {DENSITY.map((d, i) => (
              <label key={d.name} className="pg-chip">
                <input type="radio" name="pg-density" checked={density === i} onChange={() => setDensity(i)} />
                <span>{d.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <code className="pg-tokens" aria-live="polite">
          accent: {a.value}; radius: {RADII[radius]}px; space: {DENSITY[density].space}px;
        </code>
      </div>

      <div className="specimen" aria-label="Demo components reacting to the selected tokens">
        <div className="sp-card">
          <div className="sp-row">
            <span className="sp-avatar" aria-hidden="true" />
            <div>
              <div className="sp-line sp-line--strong" />
              <div className="sp-line sp-line--short" />
            </div>
            <span className="sp-badge">Active</span>
          </div>
          <div className="sp-bars" aria-hidden="true">
            {[38, 64, 46, 82, 58, 92, 70].map((h, i) => (
              <span key={i} style={{ height: `${h}%`, transitionDelay: `${i * 40}ms` }} />
            ))}
          </div>
        </div>
        <div className="sp-card sp-form">
          <span className="sp-label">Label</span>
          <span className="sp-input">Input field</span>
          <div className="sp-actions">
            <span className="sp-btn sp-btn--primary">Primary</span>
            <span className="sp-btn">Secondary</span>
          </div>
        </div>
        <div className="sp-chips">
          {['Filter', 'Status', 'Segment'].map((c, i) => (
            <span key={c} className={`sp-chip${i === 0 ? ' is-on' : ''}`}>
              {c}
            </span>
          ))}
          <span className="sp-toggle" aria-hidden="true">
            <span />
          </span>
        </div>
      </div>
    </div>
  )
}

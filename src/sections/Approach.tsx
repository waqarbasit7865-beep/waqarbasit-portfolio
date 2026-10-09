import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { site } from '../content/site'
import { SplitWords } from '../components/SplitWords'
import { pad } from '../lib/content'
import { gsap, ScrollTrigger, MOTION_OK, PLAY_ONCE } from '../lib/gsap'
import { useIsoLayoutEffect, useMedia } from '../lib/hooks'
import { Canvas } from './approach/Canvas'
import { useProcess3D, type ProcessHandle } from './approach/use3d'

/** Desktop with motion: the stage pins and vertical scroll steps through the five stages. */
const PIN = '(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)'
const N = site.approach.length

/**
 * Design Approach — one clearly framed process stage: a five-step navigation, the active step's number,
 * title, description and tools, and one large 3D model that changes with the step.
 *  • desktop (motion allowed): the stage pins; scrolling advances the steps with left-to-right transitions,
 *    each with a hold; clicking a step scrolls to its position; the section releases after step 05;
 *  • mobile / reduced motion: no pinning, no scroll hijacking — the step buttons switch the stage.
 */
export function Approach() {
  const root = useRef<HTMLElement>(null)
  const stRef = useRef<ScrollTrigger | null>(null)
  const view = useRef<ProcessHandle | null>(null)
  const activeRef = useRef(0)
  const lockUntil = useRef(0)
  const [active, setActive] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const pinned = useMedia(PIN)
  const steps = site.approach

  const apply = useCallback((i: number) => {
    if (i === activeRef.current) return
    setDir(i > activeRef.current ? 1 : -1)
    activeRef.current = i
    setActive(i)
    view.current?.setStep(i)
  }, [])

  const mode = useProcess3D(root, view, activeRef)

  /* select from the step buttons: scroll the pinned stage to that step, or switch directly */
  const select = (i: number) => {
    const st = stRef.current
    if (st) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const y = st.start + ((i + 0.5) / N) * (st.end - st.start)
      // ignore the steps we pass on the way there
      lockUntil.current = performance.now() + (reduce ? 120 : 1100)
      window.scrollTo({ top: Math.round(y), behavior: reduce ? 'auto' : 'smooth' })
      apply(i)
    } else apply(i)
  }
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let n = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % N
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + N) % N
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = N - 1
    if (n < 0) return
    e.preventDefault()
    select(n)
    root.current?.querySelector<HTMLButtonElement>(`#ap-tab-${n}`)?.focus({ preventScroll: true })
  }

  useIsoLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
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
      /* desktop: pin the stage; each fifth of the pinned distance is one step (with a snap to its centre) */
      mm.add(PIN, () => {
        const st = ScrollTrigger.create({
          trigger: '.ap-pin',
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 2.6)}`,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            snapTo: (v: number) => {
              const cur = stRef.current?.progress ?? v
              return (Math.min(N - 1, Math.floor(cur * N)) + 0.5) / N
            },
            duration: { min: 0.2, max: 0.5 },
            delay: 0.25,
            ease: 'power2.inOut',
          },
          onUpdate: (self) => {
            if (performance.now() < lockUntil.current) return
            apply(Math.min(N - 1, Math.max(0, Math.floor(self.progress * N))))
          },
        })
        stRef.current = st
        return () => {
          stRef.current = null
        }
      })
    }, el)
    return () => ctx.revert()
  }, [apply])

  // Keep the 3D model in step if the view mounts after the user already moved
  useEffect(() => view.current?.setStep(activeRef.current), [mode])

  const s = steps[active]
  return (
    <section ref={root} id="approach" tabIndex={-1} className={`approach section approach--stage${pinned ? ' is-pinned' : ''}`} aria-labelledby="approach-title">
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
      </div>

      <div className="ap-pin">
        <div className="container">
          <div className="ap-stage">
            <div className="ap-tabs" role="tablist" aria-label="Process steps">
              {steps.map((st, i) => (
                <button
                  key={st.title}
                  id={`ap-tab-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-controls="ap-panel"
                  tabIndex={i === active ? 0 : -1}
                  className={`ap-tab${i === active ? ' is-active' : ''}${i < active ? ' is-past' : ''}`}
                  onClick={() => select(i)}
                  onKeyDown={(e) => onKey(e, i)}
                >
                  <span className="ap-tab__num">{pad(i + 1)}</span>
                  <span className="ap-tab__label">{st.tab}</span>
                </button>
              ))}
              <span className="ap-tabs__bar" aria-hidden="true" style={{ ['--p' as string]: (active + 1) / N } as CSSProperties} />
            </div>

            <div className="ap-body">
              <div className="ap-copy" id="ap-panel" role="tabpanel" aria-labelledby={`ap-tab-${active}`}>
                <div key={active} className={`ap-copy__in ap-copy__in--${dir > 0 ? 'next' : 'prev'}`}>
                  <p className="ap-num">
                    <span>{pad(active + 1)}</span> / {pad(N)}
                  </p>
                  <h3 className="ap-title">{s.title}</h3>
                  <p className="ap-desc">{s.body}</p>
                  <ul className="ap-tools" aria-label="Tools">
                    {s.tools.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <figure className="ap-view">
                <div className="ap3d" aria-hidden="true">
                  <img className="ap3d__still" alt="" decoding="async" />
                </div>
                <div className="ap-fallback" aria-hidden="true">
                  <Canvas state={active} />
                </div>
                <figcaption className="ap-cap">
                  Illustrative process · {pad(active + 1)} {s.title}
                </figcaption>
              </figure>
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
              <strong>Design workspace</strong>
              <p className="sp-caption">Weekly activity · Sample data</p>
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
          <span className="sp-label">Project name</span>
          <span className="sp-input">Customer workspace</span>
          <div className="sp-actions">
            <span className="sp-btn sp-btn--primary">Create project</span>
            <span className="sp-btn">Save draft</span>
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

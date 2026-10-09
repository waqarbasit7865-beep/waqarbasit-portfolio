import { useEffect, useRef, type CSSProperties } from 'react'
import { Link, useLocation, useNavigationType } from 'react-router-dom'
import type { Project, Visual } from '../content/types'
import { Media } from '../components/Media'
import { CoverFrame } from '../components/CoverFrame'
import { SplitWords } from '../components/SplitWords'
import { ArrowRight } from '../components/Icons'
import { coverVT, pad, showVisual, visibleProjects } from '../lib/content'
import { gsap, ScrollTrigger, MOTION_OK, PLAY_ONCE } from '../lib/gsap'
import { useIsoLayoutEffect } from '../lib/hooks'
import { clearWorkReturn, readWorkReturn, saveWorkReturn, type WorkReturn } from '../lib/workReturn'
import { MoreWork } from './MoreWork'

/** Editorial rhythm: first = wide feature, last = full-width closing, the rest alternate. */
type Layout = 'feature' | 'offset' | 'wide' | 'closing'
const layoutFor = (i: number, n: number): Layout =>
  i === 0 ? 'feature' : i === n - 1 ? 'closing' : i % 2 === 1 ? 'offset' : 'wide'

export const titleVT = (slug: string) => `title-${slug}`

const themeVars = (p: Project) =>
  ({ '--accent': p.brand.accent, '--on-accent': p.brand.onAccent, '--surface': p.brand.surface }) as CSSProperties

export function Work() {
  const root = useRef<HTMLElement>(null)
  const location = useLocation()
  const navType = useNavigationType()
  const projects = visibleProjects

  /* ── Returning from a case study: restore scroll position and focus the project that was opened ── */
  useIsoLayoutEffect(() => {
    const state = location.state as { workReturn?: WorkReturn } | null
    const fromBack = navType === 'POP' ? readWorkReturn() : null
    const ret = state?.workReturn ?? fromBack
    if (!ret) return
    if (state?.workReturn) window.scrollTo(0, ret.y) // browser Back restores scroll natively
    const cta = root.current?.querySelector<HTMLElement>(`[data-cta="${ret.slug}"]`)
    cta?.focus({ preventScroll: true })
    clearWorkReturn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Heading + "frame to canvas" motion ── */
  useIsoLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      // Soft background light follows the project in view (works with or without motion)
      gsap.utils.toArray<HTMLElement>('.wg-item').forEach((item) => {
        ScrollTrigger.create({
          trigger: item,
          start: 'top 65%',
          end: 'bottom 35%',
          onToggle: (self) => {
            if (self.isActive) el.style.setProperty('--wl', item.dataset.accent || '')
          },
        })
      })

      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from('.work__title .wi', {
          yPercent: 115,
          stagger: 0.06,
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.work__head', start: 'top 80%', toggleActions: PLAY_ONCE },
        })
        gsap.from('.work__head .fade-up', {
          y: 24,
          autoAlpha: 0,
          stagger: 0.08,
          scrollTrigger: { trigger: '.work__head', start: 'top 80%', toggleActions: PLAY_ONCE },
        })

        gsap.utils.toArray<HTMLElement>('.wg-item').forEach((item) => {
          const q = gsap.utils.selector(item)
          // 1–3: frame line extends, aperture opens, number + title settle — scrubbed over the approach, then at rest
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: item, start: 'top 95%', end: 'top 42%', scrub: 0.6 },
          })
          tl.fromTo(q('.wg-frame__t, .wg-frame__b'), { scaleX: 0 }, { scaleX: 1, duration: 0.6 }, 0)
            .fromTo(q('.wg-frame__l, .wg-frame__r'), { scaleY: 0 }, { scaleY: 1, duration: 0.6 }, 0.15)
            .fromTo(
              q('.wg-aperture'),
              { clipPath: 'inset(6% 7% 6% 7% round 14px)' },
              { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 0.85 },
              0.1,
            )
            .fromTo(q('.wg-aperture__inner'), { scale: 1.07 }, { scale: 1, duration: 0.85 }, 0.1)
            .fromTo(q('.wg-num, .wg-title'), { y: 28 }, { y: 0, duration: 0.7, stagger: 0.08 }, 0.2)
            .fromTo(q('.wg-support'), { y: 46 }, { y: 0, duration: 0.8, stagger: 0.12 }, 0.25)
          // banner devices settle from a lifted, spread pose into the resting composition
          const stage = item.querySelector<HTMLElement>('.pstage')
          if (stage)
            gsap.fromTo(stage, { '--sp': 0 }, { '--sp': 1, ease: 'none', scrollTrigger: { trigger: item, start: 'top 95%', end: 'top 35%', scrub: 0.8 } })
          // 4: supporting visuals drift a little independently across the whole pass (restrained depth)
          gsap.fromTo(
            q('.wg-support__inner'),
            { y: 18 },
            { y: -18, ease: 'none', scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true } },
          )
        })
      })
    }, el)
    return () => ctx.revert()
  }, [])

  /* ── Restrained pointer tilt of the banner devices (fine pointer, motion allowed) ── */
  useEffect(() => {
    const el = root.current
    if (!el || !window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
    const stages = Array.from(el.querySelectorAll<HTMLElement>('.wg-item .pstage'))
    const offs = stages.map((st) => {
      const tx = gsap.quickTo(st, '--tx', { duration: 0.9, ease: 'power3.out' })
      const ty = gsap.quickTo(st, '--ty', { duration: 0.9, ease: 'power3.out' })
      const move = (e: PointerEvent) => {
        const r = st.getBoundingClientRect()
        tx(Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)))
        ty(Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)))
      }
      const leave = () => {
        tx(0)
        ty(0)
      }
      st.addEventListener('pointermove', move)
      st.addEventListener('pointerleave', leave)
      return () => {
        st.removeEventListener('pointermove', move)
        st.removeEventListener('pointerleave', leave)
        gsap.killTweensOf(st)
      }
    })
    return () => offs.forEach((f) => f())
  }, [])

  if (projects.length === 0) return null
  const n = projects.length

  return (
    <section
      ref={root}
      id="work"
      tabIndex={-1}
      className="work"
      aria-labelledby="work-title"
      style={{ ['--wl' as string]: projects[0].brand.accent }}
    >
      <div className="work__light" aria-hidden="true" />
      <div className="container work__inner">
        <header className="work__head">
          <p className="eyebrow fade-up">
            <span className="tick" aria-hidden="true" /> Selected work <span className="count">({pad(n)})</span>
          </p>
          <h2 className="work__title h-xl" id="work-title">
            <SplitWords text="Products I've *shaped*" />
          </h2>
          <p className="work__lede lede fade-up">
            SaaS dashboards, fintech and healthcare apps, and responsive websites — designed from user flow to developer-ready
            interface.
          </p>
        </header>

        <ol className="wg">
          {projects.map((p, i) => (
            <WorkItem key={p.slug} project={p} index={i} total={n} layout={layoutFor(i, n)} />
          ))}
        </ol>

        <MoreWork />
      </div>
    </section>
  )
}

function WorkItem({ project: p, index, total, layout }: { project: Project; index: number; total: number; layout: Layout }) {
  const coverRef = useRef<HTMLAnchorElement>(null)
  const supports = (p.heroScreens ?? []).filter(showVisual).slice(0, p.composition === 'mobile' ? 2 : 1) as Visual[]
  const to = `/work/${p.slug}`
  const onOpen = () => saveWorkReturn(p.slug, coverRef.current?.querySelector('.cover-frame'))

  return (
    <li
      className={`wg-item wg-item--${layout} wg-item--${p.composition}${supports.length ? ' has-support' : ''}`}
      style={themeVars(p)}
      data-accent={p.brand.accent}
    >
      <article className="wg-article" aria-labelledby={`wg-title-${p.slug}`}>
        <div className="wg-media">
          <Link
            ref={coverRef}
            to={to}
            viewTransition
            onClick={onOpen}
            className="wg-cover"
            tabIndex={-1}
            aria-hidden="true"
          >
            <span className="wg-aperture">
              <span className="wg-aperture__inner">
                <span className="wg-zoom" style={{ viewTransitionName: coverVT(p.slug) }}>
                  <CoverFrame project={p} sizes={layout === 'offset' ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 85vw, 100vw'} />
                </span>
              </span>
            </span>
            <span className="wg-frame" aria-hidden="true">
              <i className="wg-frame__t" />
              <i className="wg-frame__r" />
              <i className="wg-frame__b" />
              <i className="wg-frame__l" />
            </span>
          </Link>

          {supports.length > 0 && (
            <div className="wg-supports" aria-hidden="true">
              {supports.map((v, k) => (
                <div key={k} className={`wg-support wg-support--${k}`}>
                  <div className="wg-support__inner">
                    <Media visual={v} sizes="(min-width: 1024px) 28vw, 45vw" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="wg-text">
          <span className="wg-num" aria-hidden="true">
            {pad(index + 1)}
            <small> / {pad(total)}</small>
          </span>
          <h3 className="wg-title" id={`wg-title-${p.slug}`}>
            <span style={{ viewTransitionName: titleVT(p.slug) }}>{p.title}</span>
          </h3>
          <p className="wg-cat">{p.category}</p>
          <p className="wg-desc">{p.tagline ?? p.summary}</p>
          <Link to={to} viewTransition onClick={onOpen} className="wg-cta" data-cta={p.slug}>
            <span>View case study</span>
            <span className="sr-only">: {p.title}</span>
            <ArrowRight />
          </Link>
          {p.brand.provisional && <span className="dev-note">Provisional brand colour</span>}
        </div>
      </article>
    </li>
  )
}

/** Keeps ScrollTrigger positions correct after fonts load */
export function useRefreshOnFonts() {
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [])
}

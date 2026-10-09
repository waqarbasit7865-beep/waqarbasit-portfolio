import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Copy as CopyT, Project, Visual } from '../content/types'
import { site } from '../content/site'
import { Media, ratioOf } from '../components/Media'
import { Copy } from '../components/Copy'
import { CoverFrame } from '../components/CoverFrame'
import { Lightbox } from '../components/Lightbox'
import { ArrowLeft, ArrowRight, ArrowUpRight } from '../components/Icons'
import { Comparison } from '../components/Comparison'
import { MissingChecklist } from '../components/MissingChecklist'
import { coverVT, getProject, hasCopy, neighbours, pad, showVisual, visibleProjects } from '../lib/content'
import { gsap, ScrollTrigger, MOTION_OK, PLAY_ONCE } from '../lib/gsap'
import { useDocumentMeta, useIsoLayoutEffect } from '../lib/hooks'
import { readWorkReturn, supportsViewTransitions, takeCoverRect } from '../lib/workReturn'
import { titleVT } from '../sections/Work'
import NotFound from './NotFound'

export default function ProjectPage() {
  const { slug } = useParams()
  const project = getProject(slug)
  if (!project) return <NotFound />
  // key forces a clean remount (and fresh animations) when moving between projects
  return <CaseStudy key={project.slug} project={project} />
}

const asList = (c: CopyT | CopyT[] | undefined) => (c === undefined ? [] : Array.isArray(c) ? c : [c]).filter(hasCopy)

function CaseStudy({ project: p }: { project: Project }) {
  const root = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const { index, prev, next } = neighbours(p.slug)
  const n = visibleProjects.length
  const [viewer, setViewer] = useState<{ visual: Visual; trigger: HTMLElement } | null>(null)
  const closeViewer = useCallback(() => setViewer(null), [])

  useDocumentMeta(`${p.title} — ${p.category} · ${site.name}`, p.summary)

  /** Back to the gallery at the same scroll position, focusing this project */
  const backToWork = useCallback(() => {
    const saved = readWorkReturn()
    const ret = saved && saved.slug === p.slug ? saved : { slug: p.slug, y: -1 }
    if (ret.y < 0) {
      navigate('/', { state: { scrollTo: 'work' } })
      return
    }
    navigate('/', { state: { workReturn: ret }, preventScrollReset: true, viewTransition: true })
  }, [navigate, p.slug])

  // Keyboard: ← / → between projects, Esc back to the gallery. Ignored while typing, in controls or in the viewer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.defaultPrevented) return
      if (document.querySelector('dialog[open]')) return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable="true"], [role="slider"]')) return
      if (e.key === 'ArrowRight' && n > 1) navigate(`/work/${next.slug}`, { viewTransition: true })
      else if (e.key === 'ArrowLeft' && n > 1) navigate(`/work/${prev.slug}`, { viewTransition: true })
      else if (e.key === 'Escape') backToWork()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, next.slug, prev.slug, n, backToWork])

  /* ── Opening: cover arrives (shared element or fallback), then the content reveals ── */
  useIsoLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.matchMedia().add(MOTION_OK, () => {
        // Fallback for browsers without View Transitions: expand from the clicked cover with a uniform scale (never stretched)
        const from = !supportsViewTransitions() ? takeCoverRect(p.slug) : null
        const cover = el.querySelector<HTMLElement>('.cs-cover .cover-frame')
        if (from && cover) {
          const to = cover.getBoundingClientRect()
          const s = from.width / to.width
          gsap.from(cover, {
            x: from.left - to.left,
            y: from.top - to.top,
            scale: s,
            transformOrigin: '0 0',
            duration: 0.55,
            ease: 'power3.inOut',
            clearProps: 'transform',
          })
        }
        // Content reveals once the cover has settled (~0.45s)
        gsap.from('.cs-head .cs-reveal', { y: 18, opacity: 0, duration: 0.6, stagger: 0.05, delay: 0.42, ease: 'power3.out' })
        gsap.utils.toArray<HTMLElement>('.cs-section').forEach((s) => {
          gsap.from(s.querySelectorAll('.cs-in'), {
            y: 28,
            opacity: 0,
            duration: 0.8,
            stagger: 0.06,
            ease: 'power3.out',
            scrollTrigger: { trigger: s, start: 'top 82%', toggleActions: PLAY_ONCE },
          })
        })
        gsap.utils.toArray<HTMLElement>('.cs-shot__frame').forEach((f) => {
          gsap.fromTo(
            f,
            { clipPath: 'inset(4% 5% 4% 5% round 12px)' },
            {
              clipPath: 'inset(0% 0% 0% 0% round 12px)',
              ease: 'none',
              scrollTrigger: { trigger: f, start: 'top 95%', end: 'top 55%', scrub: 0.5 },
            },
          )
        })
      })
    }, el)
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => {
      cancelAnimationFrame(id)
      ctx.revert()
    }
  }, [p.slug])

  const theme = { '--accent': p.brand.accent, '--on-accent': p.brand.onAccent, '--surface': p.brand.surface } as CSSProperties

  const intro = asList(p.intro)
  const problem = asList(p.problem)
  const constraints = (p.constraints ?? []).filter(hasCopy)
  const decisions = (p.decisions ?? []).filter((d) => hasCopy(d.title) || hasCopy(d.body))
  const screens = (p.screens ?? []).filter(showVisual)
  const outcomes = p.outcomes ?? []
  const links = p.links ?? []
  const decisionVisual = showVisual(p.decisionVisual) ? p.decisionVisual : undefined
  const hasRole = hasCopy(p.role) || !!p.scope?.length || !!p.tools?.length || !!p.features?.length
  const hasProblem = problem.length > 0 || constraints.length > 0 || !!p.goals?.length
  const hasScreens = screens.length > 0 || !!p.flow?.length || !!p.ia?.length
  const hasOutcomes = outcomes.length > 0 || !!p.outcomeSummary
  let sec = 0
  const num = () => pad(++sec)

  const openViewer = (visual: Visual, trigger: HTMLElement) => setViewer({ visual, trigger })

  return (
    <article ref={root} className="cs" style={theme} aria-labelledby="cs-title">
      <div className="cs-light" aria-hidden="true" />

      {/* ── Header ── */}
      <header className="cs-head">
        <div className="container">
          <div className="cs-bar">
            <button type="button" className="cs-back" onClick={backToWork}>
              <ArrowLeft /> Back to selected work
            </button>
            <span className="cs-index" aria-label={`Project ${index + 1} of ${n}`}>
              {pad(index + 1)} / {pad(n)}
            </span>
            {n > 1 && (
              <nav className="cs-arrows" aria-label="Project navigation">
                <Link to={`/work/${prev.slug}`} viewTransition className="icon-btn" aria-label={`Previous project: ${prev.title}`}>
                  <ArrowLeft />
                </Link>
                <Link to={`/work/${next.slug}`} viewTransition className="icon-btn" aria-label={`Next project: ${next.title}`}>
                  <ArrowRight />
                </Link>
              </nav>
            )}
          </div>

          <MissingChecklist project={p} />

          <div className="cs-titlebar">
            <p className="cs-cat cs-reveal">
              <span className="cs-dot" aria-hidden="true" /> {p.category}
            </p>
            <h1 id="cs-title" className="cs-title">
              <span style={{ viewTransitionName: titleVT(p.slug) }}>{p.title}</span>
            </h1>
            <p className="cs-summary cs-reveal">{p.summary}</p>
          </div>
        </div>

        {showVisual(p.cover) && (
          <div className="cs-cover container">
            <span className="cs-cover__vt" style={{ viewTransitionName: coverVT(p.slug) }}>
              <CoverFrame project={p} priority sizes="(min-width: 1440px) 1360px, 100vw" />
            </span>
          </div>
        )}
      </header>

      <div className="cs-body">
        {/* 1. Overview */}
        {intro.length > 0 && (
          <section className="cs-section cs-overview container" aria-labelledby="cs-overview">
            <SectionHead id="cs-overview" n={num()} title="Overview" />
            <div className="cs-overview__text">
              {intro.map((c, i) => (
                <p key={i} className={`cs-in${i === 0 ? ' cs-lead' : ''}`}>
                  <Copy value={c} />
                </p>
              ))}
            </div>
          </section>
        )}

        {/* 2. Role & scope */}
        {hasRole && (
          <section className="cs-section container" aria-labelledby="cs-role">
            <SectionHead id="cs-role" n={num()} title="My role and scope" />
            <dl className="cs-facts">
              {hasCopy(p.role) && (
                <div className="cs-fact cs-in">
                  <dt>Role</dt>
                  <dd>
                    <Copy value={p.role} />
                  </dd>
                </div>
              )}
              {!!p.sectors?.length && (
                <div className="cs-fact cs-in">
                  <dt>Industry</dt>
                  <dd>{p.sectors.join(' · ')}</dd>
                </div>
              )}
              {!!p.platforms?.length && (
                <div className="cs-fact cs-in">
                  <dt>Platform</dt>
                  <dd>{p.platforms.join(' · ')}</dd>
                </div>
              )}
              {!!p.tools?.length && (
                <div className="cs-fact cs-in">
                  <dt>Tools</dt>
                  <dd>{p.tools.join(' · ')}</dd>
                </div>
              )}
              {!!p.scope?.length && (
                <div className="cs-fact cs-fact--wide cs-in">
                  <dt>Scope</dt>
                  <dd>
                    <ul className="cs-tags">
                      {p.scope.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
            {!!p.features?.length && (
              <div className="cs-features cs-in">
                <h3 className="cs-h3">Included in the project</h3>
                <ul className="cs-list">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* 3. Problem & constraints */}
        {hasProblem && (
          <section className="cs-section container" aria-labelledby="cs-problem">
            <SectionHead id="cs-problem" n={num()} title="Problem and constraints" />
            <div className="cs-problem">
              <div className="cs-problem__text">
                {problem.map((c, i) => (
                  <p key={i} className="cs-in">
                    <Copy value={c} />
                  </p>
                ))}
              </div>
              <div className="cs-problem__aside">
                {constraints.length > 0 && (
                  <div className="cs-in">
                    <h3 className="cs-h3">What visitors expect</h3>
                    <ol className="cs-numlist">
                      {constraints.map((c, i) => (
                        <li key={i}>
                          <span>{pad(i + 1)}</span>
                          <Copy value={c} />
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {!!p.goals?.length && (
                  <div className="cs-in">
                    <h3 className="cs-h3">Goals</h3>
                    <ol className="cs-numlist">
                      {p.goals.map((g, i) => (
                        <li key={g}>
                          <span>{pad(i + 1)}</span>
                          {g}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 4. Key design decisions — image held beside the list on desktop, within this subsection only */}
        {decisions.length > 0 && (
          <section className="cs-section container" aria-labelledby="cs-decisions">
            <SectionHead id="cs-decisions" n={num()} title="Key design decisions" />
            <div className={`cs-decisions${decisionVisual ? ' has-visual' : ''}`}>
              {decisionVisual && (
                <div className="cs-decisions__visual">
                  <div className="cs-decisions__sticky">
                    <Shot visual={decisionVisual} onOpen={openViewer} sizes="(min-width: 1024px) 50vw, 100vw" />
                  </div>
                </div>
              )}
              <ol className="cs-decisions__list">
                {decisions.map((d, i) => (
                  <li key={i} className="cs-decision cs-in">
                    <span className="cs-decision__n">{pad(i + 1)}</span>
                    <div>
                      {hasCopy(d.title) && (
                        <h3 className="cs-decision__title">
                          <Copy value={d.title} />
                        </h3>
                      )}
                      {hasCopy(d.body) && (
                        <p className="cs-decision__body">
                          <Copy value={d.body} />
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* 5. Screens & user flows */}
        {hasScreens && (
          <section className="cs-section container" aria-labelledby="cs-screens">
            <SectionHead id="cs-screens" n={num()} title="Screens and user flows" />
            {(!!p.ia?.length || !!p.flow?.length) && (
              <div className="cs-flows cs-in">
                {!!p.ia?.length && (
                  <div>
                    <h3 className="cs-h3">Information architecture</h3>
                    <ol className="cs-ia">
                      {p.ia.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {!!p.flow?.length && (
                  <div>
                    <h3 className="cs-h3">User flow</h3>
                    <ol className="cs-flow">
                      {p.flow.map((x, i) => (
                        <li key={x} className={i === p.flow!.length - 1 ? 'is-goal' : ''}>
                          <span>{i + 1}</span>
                          {x}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
            {screens.length > 0 && (
              <div className="cs-shots">
                {screens.map((v, i) => (
                  <figure key={i} className={`cs-shot ${shotSize(v, i)}`}>
                    <Shot visual={v} onOpen={openViewer} sizes="(min-width: 1024px) 66vw, 100vw" />
                    {v.kind === 'image' && v.caption && <figcaption>{v.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            )}
            {p.comparison && <Comparison {...p.comparison} />}
          </section>
        )}

        {/* 6. Outcomes — only with supplied evidence or a clearly sourced statement */}
        {hasOutcomes && (
          <section className="cs-section container" aria-labelledby="cs-outcomes">
            <SectionHead id="cs-outcomes" n={num()} title="Outcomes" />
            {p.outcomeSummary && (
              <blockquote className="cs-outcome cs-in">
                <p>{p.outcomeSummary.text}</p>
                <footer>{p.outcomeSummary.source}</footer>
              </blockquote>
            )}
            {outcomes.length > 0 && (
              <ul className="cs-metrics">
                {outcomes.map((o) => (
                  <li key={o.label} className="cs-in">
                    <span className="cs-metrics__value">{o.value}</span>
                    <span className="cs-metrics__label">{o.label}</span>
                    <span className={`cs-metrics__type cs-metrics__type--${o.type}`}>
                      {o.type === 'platform-engagement' ? 'Platform engagement — not a business metric' : 'Supported result'}
                    </span>
                    <span className="cs-metrics__source">Source: {o.source}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* 7. Live site / prototype */}
        {links.length > 0 && (
          <section className="cs-section cs-links container" aria-labelledby="cs-links">
            <SectionHead
              id="cs-links"
              n={num()}
              title={links.some((l) => l.kind !== 'case-study') ? 'Live website and links' : 'Published case study'}
            />
            <div className="cs-links__row cs-in">
              {links.map((l) => (
                <a key={l.href} className="btn btn--accent" href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label} <ArrowUpRight />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="container cs-backrow">
          <button type="button" className="cs-back" onClick={backToWork}>
            <ArrowLeft /> Back to selected work
          </button>
        </div>
      </div>

      {/* ── Next project ── */}
      {n > 1 && (
        <Link
          to={`/work/${next.slug}`}
          viewTransition
          className="next"
          style={{ ['--next' as string]: next.brand.accent, ['--next-on' as string]: next.brand.onAccent }}
        >
          <span className="container next__inner">
            <span className="next__label">Next project · press →</span>
            <span className="next__title">{next.title}</span>
            <span className="next__cat">{next.category}</span>
            {showVisual(next.cover) && (
              <span className="next__thumb" aria-hidden="true">
                <Media visual={next.cover} />
              </span>
            )}
            <ArrowRight className="next__arrow" />
          </span>
        </Link>
      )}

      <Lightbox visual={viewer?.visual ?? null} returnFocus={viewer?.trigger ?? null} onClose={closeViewer} />
    </article>
  )
}

function SectionHead({ id, n, title }: { id: string; n: string; title: string }) {
  return (
    <div className="cs-sechead cs-in">
      <span className="cs-sechead__n" aria-hidden="true">
        {n}
      </span>
      <h2 id={id} className="cs-h2">
        {title}
      </h2>
    </div>
  )
}

/** Varied editorial sizes from real aspect ratios: very tall boards and landscape shots span wider. */
function shotSize(v: Visual, i: number) {
  const tall = v.kind === 'image' && !v.crop && v.height > v.width * 2
  if (tall) return 'is-board'
  if (i === 0) return 'is-full'
  return i % 3 === 0 ? 'is-wide' : 'is-half'
}

/** A screen that opens in the enlarged viewer (real images only; placeholders are not interactive). */
function Shot({ visual, onOpen, sizes }: { visual: Visual; onOpen: (v: Visual, t: HTMLElement) => void; sizes?: string }) {
  const tall = visual.kind === 'image' && !visual.crop && visual.height > visual.width * 2
  // Very tall boards are previewed as their top portion; the viewer shows the whole board
  const preview: Visual =
    tall && visual.kind === 'image' ? { ...visual, crop: { x: 0, y: 0, w: visual.width, h: Math.round(visual.width * 0.9) } } : visual
  if (visual.kind !== 'image') {
    return (
      <div className="cs-shot__frame" style={{ aspectRatio: ratioOf(visual) }}>
        <Media visual={visual} sizes={sizes} />
      </div>
    )
  }
  const label = `Enlarge image: ${visual.caption ?? visual.alt}`
  return (
    <button type="button" className="cs-shot__frame cs-shot__btn" aria-label={label} onClick={(e) => onOpen(visual, e.currentTarget)}>
      <Media visual={preview} sizes={sizes} />
      <span className="cs-shot__hint" aria-hidden="true">
        {tall ? 'View full board' : 'Enlarge'}
      </span>
    </button>
  )
}

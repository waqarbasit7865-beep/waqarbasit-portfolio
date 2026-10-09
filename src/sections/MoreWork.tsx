/**
 * More Client Work — a horizontal gallery under the featured projects.
 *  • 3 cards visible on desktop, 2 on tablet, 1 (with the next card peeking) on mobile.
 *  • Previous / Next buttons, a position indicator, native touch swipe (scroll-snap), arrow keys on the track.
 *  • No autoplay, no marquee.
 *  • "View project" opens the case study on this site when there is one, otherwise an accessible dialog
 *    with the verified details, the available images and the original portfolio / live links.
 * Content: src/content/more-work.json.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { moreWork, type MoreImage, type MoreProject } from '../content/moreWork'
import { ArrowRight, ArrowUpRight } from '../components/Icons'
import { pad } from '../lib/content'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Self-hosted image first, then the published original; reports failure so the card can say so. */
function GalleryImage({ image, eager, onColour, className }: { image: MoreImage; eager?: boolean; onColour?: (c: string) => void; className?: string }) {
  const [src, setSrc] = useState(image.hosted ? image.local : image.remote)
  const [failed, setFailed] = useState(false)
  if (failed) return <span className={`mw-img mw-img--missing ${className ?? ''}`}>Image unavailable</span>
  return (
    <img
      className={`mw-img ${className ?? ''}`}
      src={src}
      alt={image.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={() => (src === image.local && src !== image.remote ? setSrc(image.remote) : setFailed(true))}
      onLoad={(e) => {
        if (!onColour || src !== image.local) return
        // project colour from the self-hosted thumbnail (same-origin, so the canvas is readable)
        try {
          const c = document.createElement('canvas')
          c.width = c.height = 12
          const x = c.getContext('2d', { willReadFrequently: true })!
          x.drawImage(e.currentTarget, 0, 0, 12, 12)
          const d = x.getImageData(0, 0, 12, 12).data
          let best = { s: -1, r: 47, g: 91, b: 255 }
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i]
            const g = d[i + 1]
            const b = d[i + 2]
            const mx = Math.max(r, g, b)
            const mn = Math.min(r, g, b)
            const s = mx === 0 ? 0 : (mx - mn) / mx
            const score = s * (mx / 255) * (mx > 60 ? 1 : 0.2)
            if (score > best.s) best = { s: score, r, g, b }
          }
          if (best.s > 0.18) onColour(`rgb(${best.r} ${best.g} ${best.b})`)
        } catch {
          /* keep the default accent */
        }
      }}
    />
  )
}

function Card({ p, index, total, onOpen }: { p: MoreProject; index: number; total: number; onOpen: (p: MoreProject, el: HTMLElement) => void }) {
  const [colour, setColour] = useState<string | undefined>(p.accent)
  const style = (colour ? { '--mw-accent': colour } : undefined) as CSSProperties | undefined
  const titleId = `mw-title-${p.id}`
  return (
    <li className="mw-slide">
      <article className="mw-card" style={style} aria-labelledby={titleId}>
        <div className="mw-thumb" data-cursor="view" aria-hidden="true">
          <span className="mw-thumb__backdrop">
            <GalleryImage image={{ ...p.thumb, alt: '' }} />
          </span>
          <span className="mw-thumb__frame">
            <GalleryImage image={p.thumb} eager={index < 3} onColour={p.accent ? undefined : setColour} />
          </span>
          <span className="mw-thumb__src">{p.source}</span>
        </div>
        <div className="mw-body">
          <p className="mw-type">
            <span className="sr-only">
              Project {index + 1} of {total}.{' '}
            </span>
            {p.type}
          </p>
          <h4 className="mw-title" id={titleId}>
            {p.title}
          </h4>
          <p className="mw-desc">{p.description}</p>
          {p.caseStudy ? (
            <Link className="mw-cta" to={`/work/${p.caseStudy}`} viewTransition>
              View project <span className="sr-only">: {p.title}</span>
              <ArrowRight />
            </Link>
          ) : (
            <button type="button" className="mw-cta" aria-haspopup="dialog" onClick={(e) => onOpen(p, e.currentTarget)}>
              View project <span className="sr-only">: {p.title}</span>
              <ArrowRight />
            </button>
          )}
        </div>
      </article>
    </li>
  )
}

function ProjectDialog({ p, onClose, returnFocus }: { p: MoreProject | null; onClose: () => void; returnFocus: HTMLElement | null }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (p && !d.open) {
      d.showModal()
      document.documentElement.classList.add('dialog-open')
    }
    if (!p && d.open) d.close()
  }, [p])
  useEffect(() => {
    const d = ref.current
    if (!d) return
    const closed = () => {
      document.documentElement.classList.remove('dialog-open')
      onClose()
      returnFocus?.focus({ preventScroll: true })
    }
    d.addEventListener('close', closed)
    return () => d.removeEventListener('close', closed)
  }, [onClose, returnFocus])
  useEffect(() => () => document.documentElement.classList.remove('dialog-open'), [])

  const images = p ? [p.thumb, ...(p.images ?? [])] : []
  return (
    <dialog
      ref={ref}
      className="mw-dialog"
      aria-labelledby="mw-dialog-title"
      style={(p?.accent ? { '--mw-accent': p.accent } : undefined) as CSSProperties | undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close()
      }}
    >
      {p && (
        <div className="mw-dialog__inner">
          <header className="mw-dialog__head">
            <div>
              <p className="mw-type">{p.type}</p>
              <h3 className="mw-dialog__title" id="mw-dialog-title">
                {p.title}
              </h3>
            </div>
            <button type="button" className="mw-dialog__close" onClick={() => ref.current?.close()} autoFocus>
              Close <span aria-hidden="true">✕</span>
            </button>
          </header>
          <div className="mw-dialog__grid">
            <div className="mw-dialog__media">
              {images.map((im, i) => (
                <figure key={im.local + i} className="mw-dialog__fig">
                  <GalleryImage image={im} eager={i === 0} />
                </figure>
              ))}
            </div>
            <div className="mw-dialog__facts">
              <p className="mw-dialog__desc">{p.description}</p>
              <dl>
                {p.client && (
                  <>
                    <dt>Client</dt>
                    <dd>{p.client}</dd>
                  </>
                )}
                {p.role && (
                  <>
                    <dt>Role</dt>
                    <dd>{p.role}</dd>
                  </>
                )}
                {p.tools?.length ? (
                  <>
                    <dt>Tools</dt>
                    <dd>{p.tools.join(', ')}</dd>
                  </>
                ) : null}
                <dt>Published on</dt>
                <dd>{p.source}</dd>
              </dl>
              <div className="mw-dialog__links">
                <a className="btn btn--primary" href={p.href} target="_blank" rel="noopener noreferrer">
                  View on {p.source} <ArrowUpRight />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                {p.live && (
                  <a className="btn btn--ghost" href={p.live} target="_blank" rel="noopener noreferrer">
                    Live site <ArrowUpRight />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
                {p.alsoOn && (
                  <a className="mw-dialog__also" href={p.alsoOn.href} target="_blank" rel="noopener noreferrer">
                    {p.alsoOn.label} <ArrowUpRight />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}

export function MoreWork() {
  const track = useRef<HTMLDivElement>(null)
  const slidesOf = () => Array.from(track.current?.querySelector('.mw-list')?.children ?? []) as HTMLElement[]
  const [pos, setPos] = useState({ first: 0, visible: 1 })
  const [open, setOpen] = useState<MoreProject | null>(null)
  const [opener, setOpener] = useState<HTMLElement | null>(null)
  const n = moreWork.length

  const measure = useCallback(() => {
    const t = track.current
    if (!t) return
    const slides = slidesOf()
    if (!slides.length) return
    const step = slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : slides[0].offsetWidth
    const first = Math.round(t.scrollLeft / Math.max(1, step))
    const visible = Math.max(1, Math.floor((t.clientWidth + 8) / Math.max(1, step)))
    setPos((p) => (p.first === first && p.visible === visible ? p : { first: Math.min(first, n - 1), visible }))
  }, [n])

  useEffect(() => {
    const t = track.current
    if (!t) return
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }
    measure()
    t.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      cancelAnimationFrame(raf)
      t.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [measure])

  const go = (dir: 1 | -1) => {
    const t = track.current
    if (!t) return
    const slides = slidesOf()
    const target = Math.max(0, Math.min(n - 1, pos.first + dir * Math.max(1, pos.visible)))
    const left = slides[target]?.offsetLeft ?? 0
    t.scrollTo({ left: left - slides[0].offsetLeft, behavior: reduced() ? 'auto' : 'smooth' })
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(-1)
    }
  }
  const onOpen = useCallback((p: MoreProject, el: HTMLElement) => {
    setOpener(el)
    setOpen(p)
  }, [])
  const onClose = useCallback(() => setOpen(null), [])

  if (!n) return null
  const last = Math.min(n, pos.first + pos.visible)
  const atStart = pos.first <= 0
  const atEnd = last >= n

  return (
    <section className="mw" aria-labelledby="mw-heading">
      <header className="mw-head">
        <div>
          <p className="eyebrow">
            <span className="tick" aria-hidden="true" /> More client work <span className="count">({pad(n)})</span>
          </p>
          <h3 className="mw-heading" id="mw-heading">
            More Client Work
          </h3>
          <p className="mw-lede">Websites, e-commerce, apps and campaigns published on my Behance and Contra profiles.</p>
        </div>
        <div className="mw-controls">
          <p className="mw-pos" aria-live="polite">
            <span className="sr-only">Showing projects </span>
            {pad(pos.first + 1)}
            {last > pos.first + 1 ? `–${pad(last)}` : ''} <span aria-hidden="true">/</span>
            <span className="sr-only"> of </span> {pad(n)}
          </p>
          <button type="button" className="mw-btn" onClick={() => go(-1)} disabled={atStart} aria-label="Previous projects">
            <ArrowRight />
          </button>
          <button type="button" className="mw-btn mw-btn--next" onClick={() => go(1)} disabled={atEnd} aria-label="Next projects">
            <ArrowRight />
          </button>
        </div>
      </header>
      <div className="mw-viewport">
        <div
          ref={track}
          className="mw-track"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="More client work. Use the left and right arrow keys to move."
          onKeyDown={onKey}
        >
          <ul className="mw-list">
            {moreWork.map((p, i) => (
              <Card key={p.id} p={p} index={i} total={n} onOpen={onOpen} />
            ))}
          </ul>
        </div>
      </div>
      <div className="mw-dots" aria-hidden="true">
        {moreWork.map((p, i) => (
          <i key={p.id} className={i >= pos.first && i < last ? 'is-on' : ''} />
        ))}
      </div>
      <ProjectDialog p={open} onClose={onClose} returnFocus={opener} />
    </section>
  )
}

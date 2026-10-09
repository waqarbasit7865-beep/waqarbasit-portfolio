import type { CSSProperties } from 'react'
import type { Project, ShowcaseDevice } from '../content/types'
import { Media } from './Media'

/**
 * The project's main visual, framed for its content type.
 * Projects with a `showcase` get a project-specific banner: real screens (crops of the project's own
 * published images) inside modelled devices on a stage in the project's colours. Others show the cover
 * as before (websites with a minimal browser frame).
 * The same component is used in Selected Work and in the case-study header so the
 * shared-element transition morphs one identical object.
 */
export function CoverFrame({ project: p, priority, sizes }: { project: Project; priority?: boolean; sizes?: string }) {
  const host = p.links?.find((l) => l.kind === 'live')?.href.replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (p.showcase?.length) {
    return (
      <div className={`cover-frame cover-frame--${p.composition} cover-frame--stage`}>
        <div className={`pstage pstage--${p.slug} pstage--${p.composition}`} role="img" aria-label={`${p.title}: ${p.showcase.map((d) => d.alt).join('; ')}`}>
          <span className="pstage__bg" aria-hidden="true" />
          <span className="pstage__mark" aria-hidden="true">
            {p.title}
          </span>
          <span className="pstage__chip" aria-hidden="true">
            {p.category}
          </span>
          <span className="pstage__rig" aria-hidden="true">
            {p.showcase.map((d, i) => (
              <Device key={i} d={d} i={i} n={p.showcase!.length} host={host} priority={priority} />
            ))}
          </span>
          <span className="pstage__floor" aria-hidden="true" />
        </div>
      </div>
    )
  }
  return (
    <div className={`cover-frame cover-frame--${p.composition}`}>
      {p.composition === 'website' && (
        <div className="cover-frame__chrome" aria-hidden="true">
          <i />
          <i />
          <i />
          {host && <span className="cover-frame__url">{host}</span>}
        </div>
      )}
      <Media visual={p.cover} priority={priority} sizes={sizes} />
    </div>
  )
}

function Device({ d, i, n, host, priority }: { d: ShowcaseDevice; i: number; n: number; host?: string; priority?: boolean }) {
  const style = { ['--i' as string]: i, ['--n' as string]: n } as CSSProperties
  const img = <img src={d.src} width={d.width} height={d.height} alt="" loading={priority ? 'eager' : 'lazy'} decoding="async" draggable={false} />
  if (d.kind === 'laptop')
    return (
      <span className="dev dev--laptop" style={style}>
        <span className="dev__lid">
          <span className="dev__screen">{img}</span>
        </span>
        <span className="dev__base" />
      </span>
    )
  if (d.kind === 'browser')
    return (
      <span className="dev dev--browser" style={style}>
        <span className="dev__bar">
          <i />
          <i />
          <i />
          {host && <b>{host}</b>}
        </span>
        <span className="dev__screen">{img}</span>
      </span>
    )
  return (
    <span className={`dev dev--phone dev--p${i}`} style={style}>
      <span className="dev__edge" />
      <span className="dev__screen">
        {img}
        <span className="dev__island" />
      </span>
    </span>
  )
}

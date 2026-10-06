import type { Project } from '../content/types'
import { Media } from './Media'

/**
 * The project's main visual, framed for its content type.
 * Websites get a minimal browser frame; apps and dashboards are shown as-is.
 * The same component is used in Selected Work and in the case-study header so the
 * shared-element transition morphs one identical object.
 */
export function CoverFrame({ project: p, priority, sizes }: { project: Project; priority?: boolean; sizes?: string }) {
  const host = p.links?.find((l) => l.kind === 'live')?.href.replace(/^https?:\/\//, '').replace(/\/$/, '')
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

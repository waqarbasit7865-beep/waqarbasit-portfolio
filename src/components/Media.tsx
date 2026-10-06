import { useState, type CSSProperties } from 'react'
import type { ImageAsset, Visual } from '../content/types'

interface Props {
  visual: Visual
  /** Above-the-fold images load eagerly with high priority; everything else is lazy */
  priority?: boolean
  className?: string
  style?: CSSProperties
  sizes?: string
  /** Shared-element transition name (View Transitions API) */
  vtName?: string
}

/** Aspect ratio a visual occupies (a crop uses the crop's own ratio). */
export const ratioOf = (v: Visual) =>
  v.kind === 'image' && v.crop ? `${v.crop.w} / ${v.crop.h}` : `${v.width} / ${v.height}`

/**
 * Renders a real image with fixed intrinsic dimensions (no layout shift), or — in drafts only —
 * a clearly labelled placeholder frame of the same aspect ratio. Placeholders are deliberately
 * abstract so they can never be mistaken for real UI work.
 *
 * Images may be cropped (never stretched) and fall back to a solid labelled panel if they fail to load.
 */
export function Media({ visual, priority, className = '', style, sizes, vtName }: Props) {
  const ratio = ratioOf(visual)
  const vtStyle: CSSProperties = vtName ? { viewTransitionName: vtName } : {}

  if (visual.kind === 'image') {
    return <Img visual={visual} priority={priority} className={className} style={style} sizes={sizes} vtStyle={vtStyle} ratio={ratio} />
  }

  return (
    <div
      className={`media ph ${className}`}
      style={{ aspectRatio: ratio, ...vtStyle, ...style }}
      role="img"
      aria-label={`Development placeholder: ${visual.label}`}
    >
      <span className="ph__corner" aria-hidden="true" />
      <span className="ph__label">
        <span className="ph__tag">Placeholder</span>
        <span className="ph__text">{visual.label}</span>
        <span className="ph__dims">
          {visual.width}×{visual.height}
        </span>
      </span>
    </div>
  )
}

function Img({
  visual,
  priority,
  className,
  style,
  sizes,
  vtStyle,
  ratio,
}: {
  visual: ImageAsset
  priority?: boolean
  className: string
  style?: CSSProperties
  sizes?: string
  vtStyle: CSSProperties
  ratio: string
}) {
  const [failed, setFailed] = useState(false)
  const common = {
    src: visual.src,
    srcSet: visual.srcSet,
    sizes,
    width: visual.width,
    height: visual.height,
    alt: visual.alt,
    loading: (priority ? 'eager' : 'lazy') as 'eager' | 'lazy',
    decoding: 'async' as const,
    fetchPriority: (priority ? 'high' : 'auto') as 'high' | 'auto',
    onError: () => setFailed(true),
  }

  if (failed) {
    return (
      <div className={`media media-fallback ${className}`} style={{ aspectRatio: ratio, ...vtStyle, ...style }} role="img" aria-label={visual.alt}>
        <span className="media-fallback__label">
          {visual.source === 'behance' ? 'Image hosted on Behance — it could not load here' : 'Image could not load'}
        </span>
      </div>
    )
  }

  if (visual.crop) {
    const { x, y, w, h } = visual.crop
    return (
      <div className={`media media-crop ${className}`} style={{ aspectRatio: ratio, ...vtStyle, ...style }}>
        <img
          {...common}
          sizes="100vw"
          style={{
            position: 'absolute',
            maxWidth: 'none',
            width: `${(visual.width / w) * 100}%`,
            height: 'auto',
            left: `${(-x / w) * 100}%`,
            top: `${(-y / h) * 100}%`,
          }}
        />
      </div>
    )
  }

  return <img {...common} className={`media ${className}`} style={{ aspectRatio: ratio, ...vtStyle, ...style }} />
}

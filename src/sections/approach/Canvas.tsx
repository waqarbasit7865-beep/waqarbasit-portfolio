import { forwardRef, type CSSProperties } from 'react'
import { ALL, CONNECTORS, GUIDE_X, HOTSPOT, PROTO_LINK, ROUTE, STATES, type ElId, type Geo } from './states'

/** Inline geometry for a static (non-animated) render of a state */
export const geoStyle = (g: Geo): CSSProperties => ({
  left: `${g.x}%`,
  top: `${g.y}%`,
  width: `${g.w}%`,
  height: `${g.h}%`,
  opacity: g.o ?? 1,
  transform: `rotate(${g.r ?? 0}deg) scale(${g.s ?? 1})`,
})

const bars = (n: number) => (
  <span className="cv-bars">
    {Array.from({ length: n }, (_, i) => (
      <b key={i} />
    ))}
  </span>
)

function inner(id: ElId) {
  switch (id) {
    case 'B0':
      return (
        <span className="cv-bars cv-bars--row">
          <i className="cv-logo" />
          <b />
          <b />
          <b />
        </span>
      )
    case 'B1':
      return bars(5)
    case 'B4':
      return bars(4)
    case 'B5':
      return <span className="cv-btn-label" />
    case 'q1':
    case 'q2':
      return <span className="cv-qmark">?</span>
    case 'F':
      return (
        <>
          <span className="cv-chrome">
            <i />
            <i />
            <i />
          </span>
          <span className="cv-grid">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        </>
      )
    case 'S2':
      return (
        <>
          <span className="cv-s2-head" />
          <span className="cv-alert">
            <i>!</i>
            <span className="cv-bars">
              <b />
              <b />
            </span>
          </span>
          <span className="cv-s2-btn" />
        </>
      )
    case 'SP':
      return (
        <>
          <span className="cv-sp-label">Component</span>
          <span className="cv-master" />
          <span className="cv-swatches">
            <i />
            <i />
            <i />
          </span>
        </>
      )
    case 'M':
      return (
        <>
          <span className="cv-m-notch" />
          <span className="cv-m-head" />
          <span className="cv-m-card" />
          <span className="cv-m-card" />
          <span className="cv-m-btn" />
        </>
      )
    case 'AS':
      return (
        <>
          <span className="cv-redline" />
          <span className="cv-anno-label">24</span>
        </>
      )
    case 'AT':
      return (
        <span className="cv-states">
          <i>Default</i>
          <i>Hover</i>
          <i>Disabled</i>
        </span>
      )
    case 'AR1':
      return <span className="cv-anno-label">1440 px</span>
    case 'AR2':
      return <span className="cv-anno-label">390 px</span>
    default:
      return bars(id.startsWith('n') ? 2 : 3)
  }
}

const kind = (id: ElId) =>
  id.startsWith('B') ? `cv-block${id === 'B5' ? ' cv-btn' : ''}` : id.startsWith('n') ? 'cv-note' : id.startsWith('q') ? 'cv-q' : id.startsWith('A') ? 'cv-anno' : `cv-${id.toLowerCase()}`

/**
 * The illustrative canvas. `state` renders a fixed state (static mode); in live mode the parent
 * animates element geometry with GSAP and switches `data-state` for styling.
 */
export const Canvas = forwardRef<HTMLDivElement, { state: number; live?: boolean }>(function Canvas({ state, live }, ref) {
  const geo = STATES[state]
  return (
    <div ref={ref} className={`cv${live ? ' cv--live' : ''}`} data-state={state} aria-hidden="true">
      <div className="cv-stage">
        {/* order matters for stacking: frame, screens, blocks, notes, overlays */}
        {(['F', 'S2', 'M'] as ElId[]).map((id) => (
          <div key={id} className={`cv-el ${kind(id)}`} data-el={id} style={geoStyle(geo[id])}>
            {inner(id)}
          </div>
        ))}
        <span className="cv-guide" style={{ left: `${GUIDE_X}%` }} />
        <svg className="cv-svg" viewBox="0 0 100 80" preserveAspectRatio="none">
          {CONNECTORS.map((d, i) => (
            <path key={i} className="cv-link" d={d} pathLength={1} style={{ strokeDashoffset: state === 0 ? 0 : 1 }} />
          ))}
          <path className="cv-pulse" d={ROUTE} pathLength={1} />
          <path className="cv-proto" d={PROTO_LINK} pathLength={1} style={{ strokeDashoffset: state === 2 ? 0 : 1 }} />
        </svg>
        {ALL.filter((id) => !['F', 'S2', 'M'].includes(id)).map((id) => (
          <div key={id} className={`cv-el ${kind(id)}`} data-el={id} style={geoStyle(geo[id])}>
            {inner(id)}
          </div>
        ))}
        <span className="cv-hot" style={{ left: `${HOTSPOT.x}%`, top: `${HOTSPOT.y}%` }} />
      </div>
    </div>
  )
})

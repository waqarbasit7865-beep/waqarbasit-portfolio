/**
 * Decorative / illustrative visuals for the hero scenes.
 * All of these are generic process illustrations — never client work — and are labelled as such.
 */
import { toolMarks } from '../../content/toolMarks'

/* ───────────── Tool marks (background layer) ───────────── */

/** Per scene: [left %, top %, scale, opacity] — the pinned timeline moves each mark between these. */
export const MARK_POS: Record<string, [number, number, number, number][]> = {
  figma: [[70, 17, 1, 0.2], [90, 19, 1.75, 0.42], [92, 14, 0.85, 0.1], [33, 86, 0.9, 0.13]],
  chatgpt: [[82, 28, 1, 0.16], [60, 90, 0.9, 0.1], [66, 91, 0.85, 0.08], [86, 31, 1.35, 0.36]],
  photoshop: [[80, 48, 1, 0.14], [5, 16, 0.9, 0.11], [47, 13, 1.3, 0.34], [44, 88, 0.9, 0.12]],
  claude: [[84, 67, 1, 0.19], [77, 91, 0.9, 0.1], [32, 91, 0.85, 0.08], [14, 31, 1.35, 0.4]],
  illustrator: [[74, 83, 1, 0.14], [40, 92, 0.9, 0.1], [53, 88, 1.25, 0.32], [56, 88, 0.9, 0.12]],
  framer: [[60, 90, 1, 0.12], [20, 91, 0.9, 0.1], [93, 80, 1.25, 0.3], [67, 86, 0.9, 0.12]],
}
/** Which scene each mark belongs to in the lighter mobile sequence */
const FLOW_SCENE: Record<string, number> = { figma: 1, photoshop: 2, illustrator: 2, framer: 2, claude: 3, chatgpt: 3 }

export function ToolMarks() {
  return (
    <div className="hero__marks" aria-hidden="true">
      {toolMarks.map((m, i) => {
        const [x, y, s, o] = MARK_POS[m.id][0]
        const fs = FLOW_SCENE[m.id]
        return (
          <div
            key={m.id}
            className={`mark mark--${m.id}${m.path ? '' : ' mark--text'}`}
            data-mark={m.id}
            style={
              {
                '--x': `${x}%`,
                '--y': `${y}%`,
                '--s': s,
                '--o': o,
                '--fy': `${fs * 25 + (i % 2 ? 6 : 14)}%`,
                '--fx': i % 2 ? '4%' : '96%',
                '--tx': i % 2 ? '0%' : '-100%',
                '--dur': `${11 + i * 1.7}s`,
                '--delay': `${-i * 2.3}s`,
              } as React.CSSProperties
            }
          >
            <div className="mark__in">
              <div className="mark__par" data-depth={8 + (i % 3) * 7}>
                <div className="mark__float">
                  {m.path ? (
                    <svg viewBox="0 0 24 24" className="mark__svg" focusable="false">
                      <path d={m.path} fill="currentColor" />
                    </svg>
                  ) : (
                    <span className="mark__label">{m.name}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ───────────── Flowing background lines ───────────── */

export function FlowLines() {
  const paths = Array.from({ length: 9 }, (_, i) => {
    const y = 80 + i * 95
    const a = 60 + (i % 3) * 40
    return `M-100 ${y} C 300 ${y - a}, 600 ${y + a}, 900 ${y} S 1500 ${y - a * 0.8}, 1800 ${y + 20}`
  })
  return (
    <svg className="hero__lines" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {paths.map((d, i) => (
        <path key={i} d={d} pathLength={1} style={{ ['--i' as string]: i }} />
      ))}
    </svg>
  )
}

/* ───────────── Scene 2: user flow → wireframe ───────────── */

type Box = [number, number, number, number] // left, top, width, height in %
export const FLOW_NODES: { label: string; flow: Box; wire: Box; lines: number }[] = [
  { label: 'Start', flow: [3, 42, 17, 16], wire: [0, 0, 100, 11], lines: 1 },
  { label: 'Explore', flow: [29, 13, 18, 16], wire: [0, 15, 20, 85], lines: 5 },
  { label: 'Search', flow: [29, 71, 18, 16], wire: [24, 15, 36, 38], lines: 3 },
  { label: 'Decide', flow: [55, 42, 18, 16], wire: [64, 15, 36, 38], lines: 3 },
  { label: 'Complete', flow: [80, 42, 17, 16], wire: [24, 57, 76, 43], lines: 4 },
]
const center = (b: Box) => [b[0] + b[2] / 2, b[1] + b[3] / 2]
const LINKS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
]
export const boxStyle = (b: Box) => ({ left: `${b[0]}%`, top: `${b[1]}%`, width: `${b[2]}%`, height: `${b[3]}%` })

export function FlowGraphic() {
  return (
    <figure className="flowgfx" aria-label="Process illustration: a simple user flow rearranging into a wireframe layout">
      <span className="viz-tag">Process illustration</span>
      <div className="flowgfx__board">
        <svg className="flowgfx__links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {LINKS.map(([a, b], i) => {
            const [x1, y1] = center(FLOW_NODES[a].flow)
            const [x2, y2] = center(FLOW_NODES[b].flow)
            const mx = (x1 + x2) / 2
            return <path key={i} d={`M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} pathLength={1} vectorEffect="non-scaling-stroke" />
          })}
        </svg>
        {FLOW_NODES.map((n, i) => (
          <div key={n.label} className="flownode" data-node={i} style={boxStyle(n.flow)} aria-hidden="true">
            <span className="flownode__label">
              <i>{String(i + 1).padStart(2, '0')}</i> {n.label}
            </span>
            <span className="flownode__skel">
              {Array.from({ length: n.lines }, (_, k) => (
                <b key={k} style={{ width: `${88 - ((k * 23) % 50)}%` }} />
              ))}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="flowgfx__caption">
        <span>User flow</span>
        <span className="flowgfx__arrow" aria-hidden="true" />
        <span>Wireframe</span>
      </figcaption>
    </figure>
  )
}

/* ───────────── Scene 3: craft board ───────────── */

export function CraftBoard() {
  return (
    <figure className="craft" aria-label="Illustrative craft elements: type specimen, colour swatches, component outlines and layout guides">
      <span className="viz-tag">Illustrative elements — not client work</span>
      <div className="craft__board">
        <div className="craft__guides" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
        <div className="craft__item craft__spec" aria-hidden="true">
          <span className="craft__aa">Aa</span>
          <span className="craft__meta">
            Display · Instrument Serif Italic
            <br />
            Text · Geist 400–600
          </span>
        </div>
        <div className="craft__item craft__swatches" aria-hidden="true">
          {[
            ['#0D0E10', 'Ink'],
            ['#F4F4F1', 'Paper'],
            ['#2F5BFF', 'Electric'],
            ['#7D9BFF', 'Tint'],
          ].map(([c, n]) => (
            <span key={c} className="craft__swatch">
              <i style={{ background: c }} />
              <small>
                {n}
                <br />
                {c}
              </small>
            </span>
          ))}
        </div>
        <div className="craft__item craft__btn" aria-hidden="true">
          <span>Button</span>
        </div>
        <div className="craft__item craft__toggle" aria-hidden="true">
          <span />
        </div>
        <div className="craft__item craft__input" aria-hidden="true">
          <span>Input · 48px</span>
        </div>
        <div className="craft__item craft__card" aria-hidden="true">
          <b />
          <b />
          <b />
          <span className="craft__redline">
            <i>24</i>
          </span>
        </div>
        <div className="craft__item craft__scale" aria-hidden="true">
          {[40, 28, 20, 15, 12].map((s) => (
            <span key={s} style={{ fontSize: `${s}px` }}>
              Aa <small>{s}</small>
            </span>
          ))}
        </div>
      </div>
    </figure>
  )
}

/* ───────────── Scene 4: flowing paths → clean grid ───────────── */

const fmt = (n: number) => n.toFixed(1)
function pathH(y: number, wave: number, seed: number) {
  const segs = 4
  const w = 1800 / segs
  let d = `M-100 ${fmt(y + (wave ? Math.sin(seed) * 60 : 0))}`
  for (let s = 0; s < segs; s++) {
    const x0 = -100 + s * w
    const o = (k: number) => (wave ? Math.sin(seed * 1.7 + s * 1.3 + k) * (70 + (seed % 3) * 25) : 0)
    d += ` C ${fmt(x0 + w / 3)} ${fmt(y + o(1))} ${fmt(x0 + (2 * w) / 3)} ${fmt(y + o(2))} ${fmt(x0 + w)} ${fmt(y + o(3))}`
  }
  return d
}
function pathV(x: number, wave: number, seed: number) {
  const segs = 3
  const h = 1100 / segs
  let d = `M${fmt(x + (wave ? Math.cos(seed) * 60 : 0))} -100`
  for (let s = 0; s < segs; s++) {
    const y0 = -100 + s * h
    const o = (k: number) => (wave ? Math.cos(seed * 1.3 + s * 1.1 + k) * (80 + (seed % 2) * 30) : 0)
    d += ` C ${fmt(x + o(1))} ${fmt(y0 + h / 3)} ${fmt(x + o(2))} ${fmt(y0 + (2 * h) / 3)} ${fmt(x + o(3))} ${fmt(y0 + h)}`
  }
  return d
}
export const GRID_PATHS = [
  ...Array.from({ length: 7 }, (_, i) => ({ grid: pathH(120 + i * 110, 0, i + 1), wave: pathH(120 + i * 110, 1, i + 1) })),
  ...Array.from({ length: 7 }, (_, j) => ({ grid: pathV(160 + j * 213, 0, j + 2), wave: pathV(160 + j * 213, 1, j + 2) })),
]
const NODES = [
  [373, 340],
  [586, 560],
  [1012, 230],
  [1225, 450],
  [799, 670],
  [160, 560],
  [1438, 340],
]

export function GridField() {
  return (
    <svg className="gridfield" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {GRID_PATHS.map((p, i) => (
        <path key={i} className="gridfield__path" d={p.grid} data-wave={p.wave} data-grid={p.grid} pathLength={1} />
      ))}
      {NODES.map(([x, y], i) => (
        <circle key={i} className="gridfield__node" cx={x} cy={y} r={5} />
      ))}
    </svg>
  )
}

/**
 * Scene 1 (Introduction) visuals: the layered "interface studio" composition and the deeper background waves.
 * Everything here is an illustrative interface concept with neutral sample content — never client work.
 *
 * DOM layering (each level owns exactly one kind of transform, so CSS, GSAP and CSS animations never fight):
 *   .hx-studio            exit tween on scroll (opacity / x / scale) · perspective root · size container
 *   └ .hx-studio__tilt    pointer tilt (GSAP rotationX / rotationY)
 *     └ .hx-studio__rig   resting 3D pose (CSS)
 *       └ .hx-layer       static depth placement per layer (CSS translate3d)
 *         └ .hx-layer__in entry tween (GSAP x / y / z / opacity)
 *           └ .hx-card    gentle float (CSS animation) + the interface itself
 */

/* ───────────── Back layer: a small user flow ───────────── */

type Node = { id: string; label: string; x: number; y: number; w: number }
const FLOW: Node[] = [
  { id: 'signin', label: 'Sign in', x: 8, y: 62, w: 70 },
  { id: 'home', label: 'Dashboard', x: 104, y: 22, w: 84 },
  { id: 'search', label: 'Search', x: 104, y: 102, w: 84 },
  { id: 'review', label: 'Review task', x: 214, y: 62, w: 92 },
  { id: 'done', label: 'Approve', x: 332, y: 62, w: 76 },
]
const NODE_H = 26
const FLOW_LINKS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
]
const linkPath = ([a, b]: [number, number]) => {
  const A = FLOW[a]
  const B = FLOW[b]
  const x1 = A.x + A.w
  const y1 = A.y + NODE_H / 2
  const x2 = B.x
  const y2 = B.y + NODE_H / 2
  const mx = (x1 + x2) / 2
  return `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
}

function FlowCard() {
  return (
    <div className="hx-card hx-card--flow">
      <p className="hx-card__label">
        <i>01</i> User flow
      </p>
      <svg className="hx-flow" viewBox="0 0 416 140" aria-hidden="true" focusable="false">
        <g className="hx-flow__links">
          {FLOW_LINKS.map((l, i) => (
            <path key={i} className="hx-flow__link" d={linkPath(l)} pathLength={1} />
          ))}
        </g>
        {/* travelling highlight: a short bright dash moving along each connection */}
        <g className="hx-flow__pulses">
          {FLOW_LINKS.map((l, i) => (
            <path key={i} className="hx-flow__pulse" d={linkPath(l)} pathLength={1} style={{ ['--k' as string]: i }} />
          ))}
        </g>
        {FLOW.map((n, i) => (
          <g key={n.id} className={`hx-flow__node${i === FLOW.length - 1 ? ' is-end' : ''}`} transform={`translate(${n.x} ${n.y})`}>
            <rect width={n.w} height={NODE_H} rx={NODE_H / 2} />
            <text x={n.w / 2} y={NODE_H / 2 + 3.6} textAnchor="middle">
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/* ───────────── Middle layer: a structured wireframe ───────────── */

function WireCard() {
  return (
    <div className="hx-card hx-card--wire">
      <p className="hx-card__label">
        <i>02</i> Wireframe
      </p>
      <div className="hx-wire">
        <div className="hx-wire__nav hx-wire__part">
          <span className="hx-wire__logo" />
          <span>Overview</span>
          <span>Tasks</span>
          <span>Reports</span>
          <span className="hx-wire__avatar" />
        </div>
        <div className="hx-wire__body">
          <div className="hx-wire__side hx-wire__part">
            <b />
            <b />
            <b />
            <b />
          </div>
          <div className="hx-wire__main">
            <div className="hx-wire__head hx-wire__part">
              <span className="hx-wire__h">Overview</span>
              <span className="hx-wire__btn">Button</span>
            </div>
            <div className="hx-wire__chart hx-wire__part">
              <span>Chart</span>
            </div>
            <div className="hx-wire__rows hx-wire__part">
              {[72, 58, 66].map((w, i) => (
                <span key={i}>
                  <i />
                  <b style={{ width: `${w}%` }} />
                  <em />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────── Front layer: the finished compact dashboard ───────────── */

const BARS: [string, number][] = [
  ['Mon', 42],
  ['Tue', 64],
  ['Wed', 52],
  ['Thu', 80],
  ['Fri', 68],
]
const TASKS: { title: string; status: string; tone: 'review' | 'done' | 'todo' }[] = [
  { title: 'Review onboarding flow', status: 'In review', tone: 'review' },
  { title: 'Update design tokens', status: 'Done', tone: 'done' },
  { title: 'Prepare hand-off notes', status: 'To do', tone: 'todo' },
]

function DashCard() {
  return (
    <div className="hx-card hx-card--dash">
      <div className="hx-dash">
        <div className="hx-dash__side">
          <span className="hx-dash__brand">
            <i />
            Workspace
          </span>
          {['Overview', 'Tasks', 'Reports', 'Settings'].map((n, i) => (
            <span key={n} className={`hx-dash__nav${i === 0 ? ' is-active' : ''}`}>
              <i />
              {n}
            </span>
          ))}
        </div>
        <div className="hx-dash__main">
          <div className="hx-dash__head">
            <span>
              <small>Project</small>
              Overview
            </span>
            <span className="hx-dash__cta">+ New task</span>
          </div>
          <div className="hx-dash__chart">
            <small>Tasks completed · this week</small>
            <div className="hx-dash__bars">
              {BARS.map(([d, v]) => (
                <span key={d} className="hx-dash__col">
                  <b className="hx-dash__bar" style={{ height: `${v * 0.78}%` }} />
                  <em>{d}</em>
                </span>
              ))}
            </div>
          </div>
          <ul className="hx-dash__tasks">
            {TASKS.map((t) => (
              <li key={t.title} className="hx-dash__task">
                <i className={`is-${t.tone}`} />
                <span>{t.title}</span>
                <em className={`hx-chip is-${t.tone}`}>{t.status}</em>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function StudioVisual({ paused }: { paused: boolean }) {
  return (
    <figure
      className={`hx-studio${paused ? ' is-paused' : ''}`}
      aria-label="Interface concept: a user flow becomes a structured wireframe and then a finished dashboard"
    >
      <div className="hx-studio__tilt">
        <div className="hx-studio__rig" aria-hidden="true">
          <div className="hx-layer hx-layer--flow">
            <div className="hx-layer__in">
              <FlowCard />
            </div>
          </div>
          <div className="hx-layer hx-layer--wire">
            <div className="hx-layer__in">
              <WireCard />
            </div>
          </div>
          <div className="hx-layer hx-layer--dash">
            <div className="hx-layer__in">
              <DashCard />
            </div>
          </div>
        </div>
      </div>
      <figcaption className="hx-studio__caption">Interface concept</figcaption>
    </figure>
  )
}

/* ───────────── Scene 1 background: layered waves with depth ───────────── */

/** Curves sweep in from the left, gather around the composition on the right, then fan out again. */
function wave(y0: number, y1: number, bend: number, k: number) {
  const fy = 455 + k * 46 // gathering height near the composition
  return `M-120 ${y0} C 360 ${y0 + bend}, 760 ${fy - bend * 0.35}, 1160 ${fy} S 1540 ${y1 - bend * 0.5}, 1740 ${y1}`
}
const WAVES: { d: string; tier: 'far' | 'mid' | 'near'; glow?: number }[] = [
  { d: wave(120, 60, 90, -4), tier: 'far' },
  { d: wave(260, 210, -70, -2.6), tier: 'far', glow: 0 },
  { d: wave(820, 880, -60, 3.6), tier: 'far' },
  { d: wave(700, 980, 80, 4.6), tier: 'far' },
  { d: wave(380, 300, 110, -1.4), tier: 'mid' },
  { d: wave(560, 760, -90, 1.6), tier: 'mid', glow: 1 },
  { d: wave(470, 520, 60, 0.2), tier: 'mid' },
  { d: wave(640, 640, 120, 2.6), tier: 'near', glow: 2 },
  { d: wave(300, 420, -120, -0.6), tier: 'near' },
]

export function IntroWaves({ paused }: { paused: boolean }) {
  return (
    <div className={`hx-waves${paused ? ' is-paused' : ''}`} aria-hidden="true">
      <svg className="hx-waves__in" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" focusable="false">
        {WAVES.map((w, i) => (
          <path key={i} className={`hx-wave hx-wave--${w.tier}`} d={w.d} />
        ))}
        {WAVES.filter((w) => w.glow !== undefined).map((w) => (
          <path key={`g${w.glow}`} className="hx-wave__glow" d={w.d} pathLength={1} style={{ ['--g' as string]: w.glow }} />
        ))}
      </svg>
    </div>
  )
}

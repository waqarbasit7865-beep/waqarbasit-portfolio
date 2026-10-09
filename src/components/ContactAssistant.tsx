/**
 * Contact assistant — a small original robot that lives in a docking hatch near the bottom-right edge.
 *  • Once per browser session, after the hero entrance has settled: the hatch opens, the robot rises and steps out,
 *    waves once with a short "Hi 👋", then rests beside the dock and blinks now and then. No sound.
 *  • The robot is a button ("Open contact options") that opens a compact panel: Email, Download Resume, WhatsApp.
 *    Escape or the close button closes it and focus returns to the robot.
 *  • "Hide assistant" tucks it away; a compact restore control brings it back (remembered in this browser).
 *  • Hidden while a project dialog or image viewer is open. Reduced motion: the resting robot, no entrance or wave.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { site } from '../content/site'

type Phase = 'docked' | 'open' | 'rise' | 'out' | 'wave' | 'rest'

const SEEN = 'wb-assistant-greeted'
const HIDDEN = 'wb-assistant-hidden'
const store = {
  get(k: string, session = false) {
    try {
      return (session ? sessionStorage : localStorage).getItem(k)
    } catch {
      return null
    }
  },
  set(k: string, v: string | null, session = false) {
    try {
      const s = session ? sessionStorage : localStorage
      if (v === null) s.removeItem(k)
      else s.setItem(k, v)
    } catch {
      /* storage unavailable: behaves as a fresh visit */
    }
  },
}

function Robot({ blink }: { blink: boolean }) {
  return (
    <svg className={`bot${blink ? ' is-blink' : ''}`} viewBox="0 0 80 104" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="bot-shell" cx="38%" cy="28%" r="80%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#dfe5f3" />
          <stop offset="1" stopColor="#8f9bb8" />
        </radialGradient>
        <linearGradient id="bot-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2340" />
          <stop offset="1" stopColor="#070a14" />
        </linearGradient>
        <radialGradient id="bot-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#b9c9ff" />
          <stop offset="0.5" stopColor="#5b7cff" />
          <stop offset="1" stopColor="#2f5bff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bot-limb" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9aa6c2" />
          <stop offset="0.5" stopColor="#e6ebf6" />
          <stop offset="1" stopColor="#8a96b3" />
        </linearGradient>
      </defs>
      {/* antenna */}
      <line x1="40" y1="15" x2="40" y2="7" stroke="#aeb8d2" strokeWidth="2.4" strokeLinecap="round" />
      <circle className="bot__beacon" cx="40" cy="5.5" r="5.5" fill="url(#bot-glow)" />
      <circle cx="40" cy="5.5" r="2.4" fill="#d6e0ff" />
      {/* ears */}
      <rect x="5" y="27" width="7" height="14" rx="3.5" fill="#5b7cff" />
      <rect x="68" y="27" width="7" height="14" rx="3.5" fill="#5b7cff" />
      {/* head */}
      <rect x="9" y="14" width="62" height="42" rx="19" fill="url(#bot-shell)" />
      <ellipse cx="27" cy="20" rx="11" ry="3.2" fill="#ffffff" opacity="0.75" />
      {/* visor + eyes */}
      <rect x="15.5" y="22" width="49" height="26" rx="13" fill="url(#bot-visor)" />
      <rect x="15.5" y="22" width="49" height="26" rx="13" fill="none" stroke="#5b7cff" strokeOpacity="0.5" />
      <g className="bot__eyes">
        <ellipse cx="30.5" cy="35" rx="5" ry="6" fill="#8fb0ff" />
        <ellipse cx="49.5" cy="35" rx="5" ry="6" fill="#8fb0ff" />
        <circle cx="32" cy="32.6" r="1.6" fill="#ffffff" />
        <circle cx="51" cy="32.6" r="1.6" fill="#ffffff" />
      </g>
      <path d="M35 43 Q40 46 45 43" fill="none" stroke="#8fb0ff" strokeWidth="1.6" strokeLinecap="round" />
      {/* neck + body */}
      <rect x="33" y="55" width="14" height="5" rx="2" fill="#7f8aa8" />
      <rect x="18" y="58" width="44" height="31" rx="15" fill="url(#bot-shell)" />
      <ellipse cx="31" cy="63" rx="8" ry="2.2" fill="#ffffff" opacity="0.65" />
      <circle className="bot__core" cx="40" cy="73" r="5" fill="url(#bot-glow)" />
      <circle cx="40" cy="73" r="2.2" fill="#e3e9ff" />
      {/* arms (right arm waves, from the shoulder) */}
      <rect x="9" y="61" width="9" height="21" rx="4.5" fill="url(#bot-limb)" transform="rotate(10 13.5 63)" />
      <g className="bot__arm">
        <rect x="62" y="61" width="9" height="21" rx="4.5" fill="url(#bot-limb)" />
        <circle cx="66.5" cy="83" r="4.6" fill="#dfe5f3" />
      </g>
      {/* feet */}
      <rect x="24" y="88" width="13" height="9" rx="4.5" fill="#7f8aa8" />
      <rect x="43" y="88" width="13" height="9" rx="4.5" fill="#7f8aa8" />
    </svg>
  )
}

const MailIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const FileIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M7 3h7l4 4v14H7z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12 10v7m0 0l-3-3m3 3l3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M9 8.8c0 3.2 2.9 6.2 6.2 6.2l1-1.4-1.9-1-1 .8a4.6 4.6 0 0 1-2.7-2.7l.8-1-1-1.9z" fill="currentColor" />
  </svg>
)

export function ContactAssistant() {
  const [hidden, setHidden] = useState(() => typeof window !== 'undefined' && store.get(HIDDEN) === '1')
  const [phase, setPhase] = useState<Phase>('docked')
  const [bubble, setBubble] = useState(false)
  const [blink, setBlink] = useState(false)
  const [open, setOpen] = useState(false)
  const botRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLButtonElement>(null)
  const focusBot = useRef(false)
  const focusRestore = useRef(false)
  const panelId = useId()
  const headId = useId()

  /* entrance: once per session, after the hero has settled */
  useEffect(() => {
    if (hidden) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || store.get(SEEN, true)) {
      setPhase('rest')
      return
    }
    const timers: number[] = []
    const at = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms))
    const start = window.location.pathname === '/' ? 3400 : 1400
    at(start, () => setPhase('open'))
    at(start + 450, () => setPhase('rise'))
    at(start + 1150, () => setPhase('out'))
    at(start + 1850, () => {
      setPhase('wave')
      setBubble(true)
      store.set(SEEN, '1', true)
    })
    at(start + 3300, () => setPhase('rest'))
    at(start + 5600, () => setBubble(false))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* occasional, gentle blinking while resting (paused in background tabs) */
  useEffect(() => {
    if (hidden || phase !== 'rest' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let t = 0
    const loop = () => {
      t = window.setTimeout(() => {
        if (!document.hidden) {
          setBlink(true)
          window.setTimeout(() => setBlink(false), 160)
        }
        loop()
      }, 3800 + Math.random() * 4200)
    }
    loop()
    return () => clearTimeout(t)
  }, [hidden, phase])

  const close = useCallback((refocus = true) => {
    setOpen(false)
    if (refocus) requestAnimationFrame(() => botRef.current?.focus())
  }, [])

  /* panel: focus first action, Escape closes, click outside closes */
  useEffect(() => {
    if (!open) return
    const first = panelRef.current?.querySelector<HTMLElement>('.assist__list a')
    first?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    const outside = (e: PointerEvent) => {
      const t = e.target as Node
      if (!panelRef.current?.contains(t) && !botRef.current?.contains(t)) close(false)
    }
    document.addEventListener('keydown', key)
    document.addEventListener('pointerdown', outside)
    return () => {
      document.removeEventListener('keydown', key)
      document.removeEventListener('pointerdown', outside)
    }
  }, [open, close])

  const hide = () => {
    setOpen(false)
    setBubble(false)
    focusRestore.current = true
    setHidden(true)
    store.set(HIDDEN, '1')
  }
  useEffect(() => {
    if (hidden && focusRestore.current) {
      focusRestore.current = false
      restoreRef.current?.focus()
    }
  }, [hidden])
  const restore = () => {
    focusBot.current = true
    setHidden(false)
    setPhase('rest')
    store.set(HIDDEN, null)
  }
  useEffect(() => {
    if (!hidden && focusBot.current) {
      focusBot.current = false
      botRef.current?.focus()
    }
  }, [hidden])

  if (hidden)
    return (
      <div className="assist assist--hidden">
        <button ref={restoreRef} type="button" className="assist__restore" onClick={restore} aria-label="Show contact assistant">
          <span className="assist__restore-face" aria-hidden="true">
            <i />
            <i />
          </span>
          <span className="assist__restore-text">Contact</span>
        </button>
      </div>
    )

  return (
    <div className={`assist is-${phase}${open ? ' is-open' : ''}`}>
      {open && (
        <div ref={panelRef} className="assist__panel" id={panelId} role="dialog" aria-modal="false" aria-labelledby={headId}>
          <div className="assist__panel-head">
            <p className="assist__panel-title" id={headId}>
              Let&rsquo;s talk
            </p>
            <button type="button" className="assist__x" onClick={() => close()} aria-label="Close contact options">
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <ul className="assist__list">
            <li>
              <a href={`mailto:${site.email}`}>
                <MailIcon />
                <span>
                  Email <small>{site.email}</small>
                </span>
              </a>
            </li>
            <li>
              <a href={site.resume} download>
                <FileIcon />
                <span>
                  Download Resume <small>PDF</small>
                </span>
              </a>
            </li>
            <li>
              <a href={site.whatsapp.href} target="_blank" rel="noopener noreferrer">
                <ChatIcon />
                <span>
                  WhatsApp <small>{site.whatsapp.display}</small>
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
          <button type="button" className="assist__hide" onClick={hide}>
            Hide assistant
          </button>
        </div>
      )}
      <div className="assist__stage">
        {bubble && (
          <p className="assist__bubble" role="status">
            Hi <span aria-hidden="true">👋</span>
          </p>
        )}
        <div className="assist__well">
          <button
            ref={botRef}
            type="button"
            className="assist__bot"
            aria-label="Open contact options"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-haspopup="dialog"
            onClick={() => (open ? close() : setOpen(true))}
            tabIndex={phase === 'docked' || phase === 'open' ? -1 : 0}
          >
            <Robot blink={blink} />
          </button>
        </div>
        <div className="assist__dock" aria-hidden="true">
          <span className="assist__door assist__door--l" />
          <span className="assist__door assist__door--r" />
          <span className="assist__led" />
        </div>
      </div>
    </div>
  )
}

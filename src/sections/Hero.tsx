import { Fragment, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { site } from '../content/site'
import { toolMarks } from '../content/toolMarks'
import { ArrowRight, ArrowUpRight, Download } from '../components/Icons'
import { gsap, ScrollTrigger, MOTION_OK, PLAY_ONCE } from '../lib/gsap'
import { useIsoLayoutEffect, useMedia } from '../lib/hooks'
import { scrollToId } from '../lib/nav'
import { HeroSound } from '../lib/heroSound'
import { CraftBoard, FlowGraphic, FlowLines, GridField, ToolMarks, FLOW_NODES, MARK_POS, boxStyle } from './hero/visuals'
import { IntroWaves, StudioVisual } from './hero/studio'
import { SpatialScene, ToolConstellation } from './hero/SpatialScene'
import { SHOW_DRAFTS } from '../lib/content'
import { useHero3D } from './hero/use3d'

const SCENES = site.hero.scenes
/** Scene 1 professional-profile links, reused from site.links */
const PROFILES = ['LinkedIn', 'Upwork']
  .map((label) => site.links.find((l) => l.label === label))
  .filter((l): l is (typeof site.links)[number] => Boolean(l))
/** Timeline label times (scene dwell positions) and the scene boundaries used for the progress indicator */
const LABELS = [0, 2.95, 5.25, 7.2, 9.4]
const BOUNDS = [1.48, 3.66, 5.86, 8.05]
/** Transition zones (timeline time). Stopping inside one snaps to its edge in the scroll direction. */
const ZONES: [number, number][] = [
  [1, 2.49],
  [3.2, 4.4],
  [5.43, 6.61],
  [7.65, 8.65],
]
/** sound cue per page position (cues are themed: 0 intro, 1 product, 2 craft, 3 AI, 4 delivery) */
const SOUND_CUE = [0, 3, 1, 2, 4]
const sceneAt = (t: number) => BOUNDS.filter((b) => t >= b).length

const PINNED = '(min-width: 1024px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)'
const FLOW_MOTION = '(prefers-reduced-motion: no-preference) and (max-width: 1023px), (prefers-reduced-motion: no-preference) and (max-height: 559px)'

function Rich({ text, underline }: { text: string; underline?: boolean }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((t, i) =>
        t.startsWith('*') && t.endsWith('*') ? (
          <em key={i} className="hx-accent">
            {t.slice(1, -1)}
            {underline && (
              <svg className="hx-underline" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <path d="M4 14 C 70 5, 160 4, 296 9" pathLength={1} />
              </svg>
            )}
          </em>
        ) : (
          <Fragment key={i}>{t}</Fragment>
        ),
      )}
    </>
  )
}

function Headline({ lines, id, as: Tag = 'h2', underline }: { lines: string[]; id: string; as?: 'h1' | 'h2'; underline?: boolean }) {
  return (
    <Tag className="hx-title" id={id}>
      {lines.map((l, i) => (
        <span className="hx-mask" key={i}>
          <span className="hx-line">
            <Rich text={l} underline={underline} />
          </span>
        </span>
      ))}
    </Tag>
  )
}

/** Honest labels for the 3D illustrations, per scene */
const CAPS = ['', 'Interface concept · AI-assisted, human-led', 'Process illustration · sample user flow', 'Illustrative elements — not client work', 'Interface concept · one system, every screen']

/** Stacked-layout slot for one scene's 3D composition (still image first; the live canvas joins when in view) */
function Slot3D({ i }: { i: number }) {
  return (
    <div className="hx3d-slot" data-slot={i} aria-hidden="true">
      <img className="hx3d-still" alt="" decoding="async" />
    </div>
  )
}

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const stRef = useRef<ScrollTrigger | null>(null)
  const sceneRef = useRef(0)
  const [scene, setScene] = useState(0)
  const [soundOn, setSoundOn] = useState(false)
  const sound = useRef<HeroSound | null>(null)
  /* 3D layer: the scroll timeline writes its time here; the WebGL world reads it every frame */
  const [time3d] = useState(() => ({ T: 0 }))
  const pinned = useMedia(PINNED)
  useHero3D(root, pinned, time3d)

  const updateScene = useCallback((i: number) => {
    if (i === sceneRef.current) return
    sceneRef.current = i
    setScene(i)
  }, [])

  /* ═════════════ Motion: one coordinated pinned timeline (desktop) / light sequence (mobile) ═════════════ */
  useIsoLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const q = gsap.utils.selector(el)
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      /* Load intro for scene 1 — runs once, on elements the scroll timeline never touches */
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
        tl.from(q('.scene--intro .hx-label'), { yPercent: 120, opacity: 0, duration: 0.6 }, 0.05)
          .from(q('.scene--intro .hx-line'), { yPercent: 112, duration: 1.05, stagger: 0.14 }, 0.15)
          .from(q('.scene--intro .hx-accent'), { skewX: -14, letterSpacing: '0.08em', duration: 1.3, ease: 'power3.out' }, 0.35)
          .fromTo(q('.hx-underline path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.85)
          .from(q('.hx-cue'), { y: 12, opacity: 0, duration: 0.6 }, 1.0)
          .from(q('.mark__in'), {
            x: (i) => [90, 120, 140, 110, 80, 60][i % 6],
            y: (i) => [-60, 30, -20, 70, 90, 40][i % 6],
            opacity: 0,
            duration: 2.2,
            stagger: 0.08,
            ease: 'power3.out',
          }, 0)
          .from(q('.hero__hud > *'), { opacity: 0, y: 10, duration: 0.6, stagger: 0.06 }, 0.9)

        /* Scene 1 additions: supporting copy, actions, waves, then the studio layers flow → structure → finished interface.
           Containers are animated (not .btn elements, whose CSS transform transition would fight the tween). */
        tl.from(q('.scene--intro .hx-sub'), { y: 18, opacity: 0, duration: 0.9 }, 0.6)
          .from(q('.scene--intro .hx-actions, .scene--intro .hx-profiles'), { y: 16, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.75)
          .from(q('.hx-waves__in'), { opacity: 0, duration: 2.2, ease: 'power2.out' }, 0.1)
          // 1 · flow
          .from(q('.hx-layer--flow .hx-layer__in'), { y: -36, z: -160, opacity: 0, duration: 1.1 }, 0.45)
          .from(q('.hx-flow__node'), { opacity: 0, scale: 0.7, transformOrigin: '50% 50%', duration: 0.45, stagger: 0.07, ease: 'back.out(1.7)' }, 0.65)
          .fromTo(q('.hx-flow__link'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, stagger: 0.07, ease: 'power2.inOut' }, 0.8)
          // 2 · structure
          .from(q('.hx-layer--wire .hx-layer__in'), { y: 44, z: -120, opacity: 0, duration: 1.1 }, 1.1)
          .from(q('.hx-wire__part'), { opacity: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out' }, 1.3)
          // 3 · finished interface
          .from(q('.hx-layer--dash .hx-layer__in'), { y: 70, z: -60, rotationX: 10, opacity: 0, duration: 1.2 }, 1.55)
          .from(q('.hx-dash__bar'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.6, stagger: 0.06, ease: 'power3.out' }, 1.95)
          .from(q('.hx-dash__task'), { x: 14, opacity: 0, duration: 0.5, stagger: 0.08 }, 2.0)
          .from(q('.hx-studio__caption'), { opacity: 0, duration: 0.7, ease: 'power2.out' }, 2.4)
      })

      /* ── Desktop: pinned four-scene timeline ── */
      mm.add(PINNED, () => {
        el.classList.add('hero--pinned')
        const marks = q('.mark')
        gsap.set(marks, {
          xPercent: -50,
          yPercent: -50,
          left: (i: number) => `${MARK_POS[toolMarks[i].id][0][0]}%`,
          top: (i: number) => `${MARK_POS[toolMarks[i].id][0][1]}%`,
          scale: (i: number) => MARK_POS[toolMarks[i].id][0][2],
          opacity: (i: number) => MARK_POS[toolMarks[i].id][0][3],
        })
        const moveMarks = (tl: gsap.core.Timeline, s: number, at: number, dur = 1) =>
          tl.to(
            marks,
            {
              left: (i: number) => `${MARK_POS[toolMarks[i].id][s][0]}%`,
              top: (i: number) => `${MARK_POS[toolMarks[i].id][s][1]}%`,
              scale: (i: number) => MARK_POS[toolMarks[i].id][s][2],
              opacity: (i: number) => MARK_POS[toolMarks[i].id][s][3],
              duration: dur,
              ease: 'power2.inOut',
              stagger: 0.03,
            },
            at,
          )

        const S = (id: string, sel = '') => q(sel ? sel.split(',').map(part => `.scene--${id} ${part.trim()}`).join(',') : `.scene--${id}`)
        // Initial pinned state: only scene 1 visible
        gsap.set([S('product'), S('craft'), S('ai'), S('delivery')], { autoAlpha: 0 })

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        tl.addLabel('s0', LABELS[0])

        /* Scene order: 01 Introduction → 02 AI → 03 Product thinking → 04 Visual craft → 05 Delivery.
           Each scene's choreography is authored on its own time span and placed into its page slot by remap()
           (the 3D compositions use the same mapping, see three/hero/common.ts). */
        const remap = (from: [number, number], to: [number, number]) => (t: number) => to[0] + ((t - from[0]) * (to[1] - to[0])) / (from[1] - from[0])
        const tA = remap([5.88, 8.05], [1.47, 3.65]) // AI → slot 2
        const tP = remap([1.47, 3.65], [3.66, 5.86]) // product → slot 3
        const tC = remap([3.66, 5.86], [5.88, 8.05]) // craft → slot 4

        /* slot transitions: lighting states and the background tool marks */
        tl.to(S('intro', '.scene__copy'), { xPercent: -14, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 1)
          // Scene 1 visual + waves leave with the copy and are gone (1.45) before scene 2 is shown (1.47)
          .to(S('intro', '.hx-studio'), { xPercent: 22, scale: 0.92, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 1)
          .to(S('intro', '.hero-tool-orbit'), { autoAlpha: 0, z: -120, duration: 0.45 }, 1)
          .to(S('intro', '.hx-waves'), { autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 1)
          .to(q('.light--0'), { opacity: 0, duration: 1 }, 1)
          .to(q('.light--1'), { opacity: 1, duration: 1 }, 1)
          .to(q('.light--1'), { opacity: 0, duration: 1 }, 3.2)
          .to(q('.light--2'), { opacity: 1, duration: 1 }, 3.2)
          .to(q('.light--2'), { opacity: 0, duration: 1 }, 5.4)
          .to(q('.light--3'), { opacity: 1, duration: 1 }, 5.4)
        moveMarks(tl, 3, 1)
        moveMarks(tl, 1, 3.2)
        moveMarks(tl, 2, 5.4)

        /* 02 · AI + human judgment: flowing paths organise into a grid */
        const paths = S('ai', '.gridfield__path') as unknown as SVGPathElement[]
        paths.forEach((p) => p.setAttribute('d', p.dataset.wave || ''))
        tl.set(S('ai'), { autoAlpha: 1 }, tA(5.88))
          .fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, stagger: 0.02, ease: 'power2.out' }, tA(5.6))
          .fromTo(S('ai', '.hx-line'), { rotateX: -75, yPercent: 40, opacity: 0, transformOrigin: '50% 100%' }, { rotateX: 0, yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.12 }, tA(5.92))
          .fromTo(S('ai', '.hx-eyebrow'), { opacity: 0, letterSpacing: '0.4em' }, { opacity: 1, letterSpacing: '0.08em', duration: 0.5 }, tA(5.9))
          .fromTo(S('ai', '.hx-tags li'), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05 }, tA(6.3))
        paths.forEach((p, i) => {
          tl.to(p, { attr: { d: p.dataset.grid || '' }, duration: 0.8, ease: 'power3.inOut' }, tA(6.45) + (i % 7) * 0.025)
        })
        tl.fromTo(S('ai', '.gridfield__node'), { scale: 0, opacity: 0, transformOrigin: 'center' }, { scale: 1, opacity: 1, duration: 0.3, stagger: 0.04 }, tA(7.0))
          .to(q('.mark--claude, .mark--chatgpt'), { opacity: 0.28, scale: 1.2, duration: 0.5 }, tA(7.05))
          .fromTo(S('ai', '.spatial'), { y: 60, rotationY: -18, autoAlpha: 0 }, { y: 0, rotationY: 0, autoAlpha: 1, duration: 0.8 }, tA(6.0))
          .addLabel('s1', LABELS[1])
        tl.to(S('ai'), { autoAlpha: 0, y: -50, duration: 0.38 }, tA(7.65))

        /* 03 · Product thinking: horizontal hand-off, then the flow rearranges into a wireframe */
        tl.set(S('product'), { autoAlpha: 1 }, tP(1.47))
          .fromTo(S('product', '.hx-eyebrow'), { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, tP(1.5))
          .fromTo(S('product', '.hx-line'), { xPercent: 55, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, tP(1.52))
          .fromTo(S('product', '.hx-tags li'), { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.05 }, tP(1.8))
          .fromTo(S('product', '.flowgfx'), { xPercent: 28, rotateY: -16, z: -120, autoAlpha: 0 }, { xPercent: 0, rotateY: 0, z: 0, autoAlpha: 1, duration: 0.75 }, tP(1.5))
          .fromTo(S('product', '.flownode'), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, stagger: 0.06, ease: 'back.out(1.6)' }, tP(1.75))
          .fromTo(S('product', '.flowgfx__links path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, stagger: 0.05 }, tP(1.95))
        FLOW_NODES.forEach((n, i) => {
          tl.to(S('product', `.flownode[data-node="${i}"]`), { ...boxStyle(n.wire), borderRadius: 6, duration: 0.6, ease: 'power3.inOut' }, tP(2.35) + i * 0.04)
        })
        tl.to(S('product', '.flowgfx__links'), { opacity: 0, duration: 0.3 }, tP(2.3))
          .to(S('product', '.flownode__label'), { opacity: 0, duration: 0.2 }, tP(2.3))
          .to(S('product', '.flownode__skel'), { opacity: 1, duration: 0.3 }, tP(2.75))
          .to(S('product', '.flowgfx__caption'), { '--p': 1, duration: 0.6 }, tP(2.35))
          .addLabel('s2', LABELS[2])
        tl.to(S('product', '.scene__copy'), { scale: 0.92, y: -30, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, tP(3.2))
          .to(S('product', '.flowgfx'), { xPercent: -18, z: -200, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, tP(3.2))

        /* 04 · Visual craft: drop the craft elements in */
        tl.set(S('craft'), { autoAlpha: 1 }, tC(3.66))
          .fromTo(S('craft', '.craft__guides span'), { scaleY: 0 }, { scaleY: 1, duration: 0.5, stagger: 0.04, transformOrigin: 'top' }, tC(3.68))
          .fromTo(S('craft', '.craft__item'), { y: -90, rotate: (i) => [-6, 5, -4, 7, -3, 4, -5][i % 7], autoAlpha: 0 }, { y: 0, rotate: 0, autoAlpha: 1, duration: 0.55, stagger: 0.07, ease: 'back.out(1.4)' }, tC(3.75))
          .fromTo(S('craft', '.viz-tag'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, tC(4.2))
          .fromTo(S('craft', '.hx-eyebrow'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, tC(3.75))
          .fromTo(S('craft', '.hx-line'), { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, stagger: 0.14, ease: 'power3.inOut' }, tC(3.8))
          .fromTo(S('craft', '.hx-tags li'), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05 }, tC(4.25))
          .addLabel('s3', LABELS[3])
        tl.to(S('craft', '.craft__item'), { y: -60, autoAlpha: 0, duration: 0.33, stagger: 0.03, ease: 'power2.in' }, tC(5.4))
          .to(S('craft', '.scene__copy'), { y: -40, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, tC(5.4))
          .to(S('craft', '.craft__guides, .viz-tag'), { autoAlpha: 0, duration: 0.3 }, tC(5.5))

        /* 05 · Ready to build */
        tl.set(S('delivery'), { autoAlpha: 1 }, 8.05)
          .fromTo(S('delivery', '.hx-line'), { yPercent: 110 }, { yPercent: 0, duration: 0.6, stagger: 0.12 }, 8.06)
          .fromTo(S('delivery', '.hx-eyebrow, .hx-tags, .hx-cta'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, 8.15)
          .fromTo(S('delivery', '.spatial'), { rotationY: 25, z: -160, autoAlpha: 0 }, { rotationY: 0, z: 0, autoAlpha: 1, duration: 0.8 }, 8.06)
          .addLabel('s4', LABELS[4]).set({}, {}, LABELS[4])

        const st = ScrollTrigger.create({
          trigger: el,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 4.3)}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.7,
          animation: tl,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // Snap only when scrolling stops mid-transition: finish it in the scroll direction. Dwell zones never snap.
          snap: {
            // ScrollTrigger passes a velocity-projected value; we use the actual resting progress instead,
            // so a fast flick or a programmatic jump never overshoots into another scene.
            snapTo: (v: number) => {
              const st = stRef.current
              const cur = st ? st.progress : v
              const d = tl.duration()
              const t = cur * d
              const dir = st?.direction ?? 1
              for (const [a, b] of ZONES) if (t > a && t < b) return (dir > 0 ? b : a) / d
              return cur
            },
            duration: { min: 0.25, max: 0.7 },
            delay: 0.15,
            ease: 'power2.inOut',
          },
          onUpdate: (self) => updateScene(sceneAt(self.progress * tl.duration())),
        })
        stRef.current = st
        tl.eventCallback('onUpdate', () => {
          time3d.T = tl.time()
        })
        return () => {
          time3d.T = 0
          stRef.current = null
          el.classList.remove('hero--pinned')
          paths.forEach((p) => p.setAttribute('d', p.dataset.grid || ''))
        }
      })

      /* ── Mobile / short screens: lighter vertical sequence, each scene animates on entry ── */
      mm.add(FLOW_MOTION, () => {
        const S = (id: string, sel = '') => q(sel ? sel.split(',').map(part => `.scene--${id} ${part.trim()}`).join(',') : `.scene--${id}`)
        const on = (id: string) => ({ trigger: S(id)[0], start: 'top 70%', toggleActions: PLAY_ONCE })
        gsap.timeline({ scrollTrigger: on('product') })
          .from(S('product', '.hx-line'), { xPercent: 40, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'expo.out' })
          .from(S('product', '.flownode'), { scale: 0.6, opacity: 0, duration: 0.35, stagger: 0.06 }, 0.2)
          .fromTo(S('product', '.flowgfx__links path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, stagger: 0.05 }, 0.4)
          .to(S('product', '.flowgfx__links'), { opacity: 0, duration: 0.3 }, 1.5)
          .to(S('product', '.flownode__label'), { opacity: 0, duration: 0.2 }, 1.5)
        FLOW_NODES.forEach((n, i) => {
          gsap.to(S('product', `.flownode[data-node="${i}"]`), {
            ...boxStyle(n.wire),
            borderRadius: 6,
            duration: 0.7,
            delay: 1.6 + i * 0.05,
            ease: 'power3.inOut',
            scrollTrigger: on('product'),
          })
        })
        gsap.to(S('product', '.flownode__skel'), { opacity: 1, duration: 0.3, delay: 2.2, scrollTrigger: on('product') })
        gsap.to(S('product', '.flowgfx__caption'), { '--p': 1, duration: 0.6, delay: 1.6, scrollTrigger: on('product') })

        gsap.timeline({ scrollTrigger: on('craft') })
          .from(S('craft', '.hx-line'), { clipPath: 'inset(0% 100% 0% 0%)', duration: 0.7, stagger: 0.12, ease: 'power3.inOut' })
          .from(S('craft', '.craft__item'), { y: -50, autoAlpha: 0, duration: 0.5, stagger: 0.06, ease: 'back.out(1.4)' }, 0.1)

        gsap.from(S('delivery', '.hx-line, .spatial'), { y: 40, opacity: 0, duration: 0.8, stagger: 0.1, scrollTrigger: on('delivery') })
        const paths = S('ai', '.gridfield__path') as unknown as SVGPathElement[]
        paths.forEach((p) => p.setAttribute('d', p.dataset.wave || ''))
        const ai = gsap.timeline({ scrollTrigger: on('ai') })
        ai.from(S('ai', '.hx-line'), { yPercent: 60, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'expo.out' })
          .from(S('ai', '.hx-cta'), { y: 20, opacity: 0, duration: 0.5 }, 0.35)
          .fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, stagger: 0.02 }, 0)
        paths.forEach((p) => ai.to(p, { attr: { d: p.dataset.grid || '' }, duration: 1, ease: 'power3.inOut' }, 0.9))
        return () => paths.forEach((p) => p.setAttribute('d', p.dataset.grid || ''))
      })

      /* ── Non-pinned modes: track the active scene for the progress indicator and sound ── */
      mm.add(`not all and ${PINNED}`, () => {
        q('.scene').forEach((s, i) =>
          ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => self.isActive && updateScene(i) }),
        )
      })
    }, el)
    return () => ctx.revert()
  }, [updateScene, time3d])

  /* ── Pointer parallax on the background marks (pinned desktop, fine pointer) ── */
  useEffect(() => {
    const el = root.current
    if (!el) return
    const mq = window.matchMedia(`${PINNED} and (pointer: fine)`)
    if (!mq.matches) return
    const pars = Array.from(el.querySelectorAll<HTMLElement>('.mark__par'))
    let raf = 0
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        pars.forEach((p) => {
          const d = Number(p.dataset.depth) || 10
          gsap.to(p, { x: -nx * d * 2, y: -ny * d * 1.4, duration: 1.2, ease: 'power3.out', overwrite: 'auto' })
        })
      })
    }
    el.addEventListener('pointermove', move)
    return () => {
      el.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
      gsap.killTweensOf(pars)
      gsap.set(pars, { clearProps: 'transform' })
    }
  }, [])

  /* ── Scene 1: restrained pointer tilt of the studio composition (pinned desktop, fine pointer) ──
     A rotation of at most ±4° / ±3°, eased; it leans toward the pointer but never follows it around. */
  const resetTilt = useRef<() => void>(() => {})
  useEffect(() => {
    const el = root.current
    const tilt = el?.querySelector<HTMLElement>('.hx-studio__tilt')
    if (!el || !tilt) return
    const mq = window.matchMedia(`${PINNED} and (pointer: fine)`)
    if (!mq.matches) return
    const rx = gsap.quickTo(tilt, 'rotationX', { duration: 1.1, ease: 'power3.out' })
    const ry = gsap.quickTo(tilt, 'rotationY', { duration: 1.1, ease: 'power3.out' })
    const clamp = gsap.utils.clamp(-1, 1)
    let raf = 0
    const neutral = () => {
      cancelAnimationFrame(raf)
      rx(0)
      ry(0)
    }
    const move = (e: PointerEvent) => {
      if (sceneRef.current !== 0) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const nx = clamp((e.clientX / window.innerWidth - 0.5) * 2)
        const ny = clamp((e.clientY / window.innerHeight - 0.5) * 2)
        ry(nx * 4)
        rx(-ny * 3)
      })
    }
    resetTilt.current = neutral
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', neutral)
    return () => {
      resetTilt.current = () => {}
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', neutral)
      cancelAnimationFrame(raf)
      gsap.killTweensOf(tilt)
      gsap.set(tilt, { clearProps: 'transform' })
    }
  }, [])
  // Return smoothly to neutral as soon as the visitor leaves scene 1
  useEffect(() => {
    if (scene !== 0) resetTilt.current()
  }, [scene])

  /* ── Pause decorative CSS loops when the hero is offscreen ── */
  useEffect(() => {
    const el = root.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-offscreen', !e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* ── Sound: one cue per scene change, only after explicit opt-in ── */
  useEffect(() => {
    if (soundOn) sound.current?.play(SOUND_CUE[scene])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])
  useEffect(() => () => sound.current?.destroy(), [])

  const toggleSound = async () => {
    if (soundOn) {
      sound.current?.disable()
      setSoundOn(false)
      return
    }
    if (!sound.current) sound.current = new HeroSound()
    const ok = await sound.current.enable()
    setSoundOn(ok)
    if (ok) sound.current.play(SOUND_CUE[sceneRef.current])
  }

  /* ── Scene controls ── */
  const goTo = (i: number) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const st = stRef.current
    if (st) {
      const tl = st.animation as gsap.core.Timeline
      const y = st.start + (LABELS[i] / tl.duration()) * (st.end - st.start)
      // Jump instantly; the scrubbed timeline animates the scenes in between (smooth native scrolling would fight snapping)
      window.scrollTo({ top: Math.round(y) + (i === SCENES.length - 1 ? -2 : 0), behavior: 'auto' })
    } else {
      root.current?.querySelectorAll('.scene')[i]?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    }
  }
  const onNavKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let n = -1
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = Math.min(SCENES.length - 1, i + 1)
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = Math.max(0, i - 1)
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = SCENES.length - 1
    if (n < 0) return
    e.preventDefault()
    goTo(n)
    root.current?.querySelector<HTMLButtonElement>(`[data-scene-btn="${n}"]`)?.focus({ preventScroll: true })
  }
  const toWork = (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToId('work')
  }

  return (
    <section ref={root} data-active-scene={scene} className={`hero${SHOW_DRAFTS ? ' hero--draft' : ''}`} id="top" tabIndex={-1} aria-labelledby="hx-title-0" aria-roledescription="introduction">
      <div className="hero__stage">
        {/* Atmosphere: four lighting states, slow flowing lines, workflow tool marks */}
        <div className="hero__atmos" aria-hidden="true">
          <div className="light light--0" />
          <div className="light light--1" />
          <div className="light light--2" />
          <div className="light light--3" />
          <FlowLines />
        </div>
        {/* single WebGL view for the pinned desktop intro (the canvas is attached here when this host is active) */}
        <div className="hx3d" aria-hidden="true" />
        {CAPS[scene] && <p className={`hx3d-cap hx3d-cap--stage hx3d-cap--${scene === 3 ? 'left' : 'right'}`}>{CAPS[scene]}</p>}
        <ToolMarks />

        {/* 01 — Introduction */}
        <div className="scene scene--intro" data-scene="0">
          <IntroWaves paused={scene !== 0} />
          <div className="hero-tool-orbit" aria-hidden="true"><ToolConstellation /></div>
          <div className="scene__copy">
            <p className="hx-label">
              <span>{site.hero.label}</span>
            </p>
            <Headline lines={SCENES[0].headline} id="hx-title-0" as="h1" underline />
            {SCENES[0].sub && <p className="hx-sub">{SCENES[0].sub}</p>}
            <div className="hx-actions">
              <a className="btn btn--primary hx-actions__main" href="/#work" onClick={toWork}>
                View Portfolio <ArrowRight />
              </a>
              <a className="btn btn--ghost hx-actions__resume" href={site.resume} download>
                Download Resume <Download />
              </a>
            </div>
            {PROFILES.length > 0 && (
              <ul className="hx-profiles" aria-label="Professional profiles">
                {PROFILES.map((p) => (
                  <li key={p.label}>
                    <a href={p.href} target="_blank" rel="noopener noreferrer" aria-label={`${p.label} profile (opens in a new tab)`}>
                      {p.label} <ArrowUpRight />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <ToolConstellation />
            <p className="hx-cue" aria-hidden="true">
              <span className="hx-cue__line" />
              Scroll to explore
            </p>
            {/* positioned against the headline's own geometry, so it never collides with it */}
            <StudioVisual paused={scene !== 0} />
            <Slot3D i={0} />
          </div>
        </div>

        {/* 02 — AI-assisted exploration, human-led design */}
        <div className="scene scene--ai" data-scene="1">
          <GridField />
          <div className="scene__copy">
            <p className="hx-eyebrow">02 — {SCENES[1].name}</p>
            <Headline lines={SCENES[1].headline} id="hx-title-1" />
            {SCENES[1].sub && <p className="hx-sub hx-sub--scene">{SCENES[1].sub}</p>}
            <ul className="hx-tags" aria-label="How AI is used">
              {SCENES[1].tags?.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <div className="scene__visual"><SpatialScene mode="ai" /><Slot3D i={1} /></div>
          <p className="hx3d-cap hx3d-cap--right">Interface concept · AI-assisted, human-led</p>
        </div>

        {/* 03 — Product thinking */}
        <div className="scene scene--product" data-scene="2">
          <div className="scene__copy">
            <p className="hx-eyebrow">03 — {SCENES[2].name}</p>
            <Headline lines={SCENES[2].headline} id="hx-title-2" />
            <ul className="hx-tags" aria-label="Capabilities">
              {SCENES[2].tags?.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <div className="scene__visual">
            <FlowGraphic />
            <Slot3D i={2} />
          </div>
          <p className="hx3d-cap hx3d-cap--right">Process illustration · sample user flow</p>
        </div>

        {/* 04 — Visual craft */}
        <div className="scene scene--craft" data-scene="3">
          <div className="scene__visual">
            <CraftBoard />
            <Slot3D i={3} />
          </div>
          <p className="hx3d-cap hx3d-cap--left">Illustrative elements — not client work</p>
          <div className="scene__copy">
            <p className="hx-eyebrow">04 — {SCENES[3].name}</p>
            <Headline lines={SCENES[3].headline} id="hx-title-3" />
            <ul className="hx-tags" aria-label="Capabilities">
              {SCENES[3].tags?.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </div>

        <div className="scene scene--delivery" data-scene="4">
          <div className="scene__copy">
            <p className="hx-eyebrow">05 — {SCENES[4].name}</p>
            <Headline lines={SCENES[4].headline} id="hx-title-4" />
            <ul className="hx-tags" aria-label="Capabilities">{SCENES[4].tags?.map(t => <li key={t}>{t}</li>)}</ul>
            <a className="hx-cta btn btn--primary" href="/#work" onClick={toWork}>See it in practice <ArrowRight /></a>
          </div>
          <div className="scene__visual"><SpatialScene mode="delivery" /><Slot3D i={4} /></div>
          <p className="hx3d-cap hx3d-cap--right">Interface concept · one system, every screen</p>
        </div>

        {/* HUD: skip, scene progress/controls, sound */}
        <div className="hero__hud">
          <a className="hud-skip" href="/#work" onClick={toWork} aria-label="Skip intro">
            Skip<span className="hud-skip__more">&nbsp;intro</span> <span aria-hidden="true">↓</span>
          </a>
          <nav className="hud-nav" aria-label="Intro scenes">
            <ol>
              {SCENES.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    data-scene-btn={i}
                    className={`hud-nav__btn${i === scene ? ' is-active' : ''}${i < scene ? ' is-past' : ''}`}
                    aria-current={i === scene ? 'step' : undefined}
                    aria-label={`Scene ${i + 1} of ${SCENES.length}: ${s.name}`}
                    onClick={() => goTo(i)}
                    onKeyDown={(e) => onNavKey(e, i)}
                  >
                    <span className="hud-nav__num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="hud-nav__bar" aria-hidden="true" />
                    <span className="hud-nav__name" aria-hidden="true">
                      {s.name}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <button type="button" className={`hud-sound${soundOn ? ' is-on' : ''}`} aria-pressed={soundOn} onClick={toggleSound}>
            <span className="hud-sound__bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {soundOn ? 'Sound on' : 'Enable sound'}
          </button>
        </div>
      </div>
    </section>
  )
}


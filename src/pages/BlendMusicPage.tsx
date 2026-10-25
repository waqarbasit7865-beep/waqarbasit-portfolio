import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Lightbox } from '../components/Lightbox'
import type { ImageAsset } from '../content/types'
import { useDocumentMeta } from '../lib/hooks'
import '../styles/blend-music.css'

const BASE = '/projects/blend-music/'
const FIGMA = 'https://www.figma.com/design/26iCZaA44RuXQVsGnvMz6j/Untitled?node-id=2-18'
const screenNames = ['login', 'home', 'search', 'player', 'playlist', 'artist', 'profile', 'premium'] as const
const labels: Record<string, string> = { login: 'Welcome', home: 'Home', search: 'Search', player: 'Now Playing', playlist: 'Playlist', artist: 'Artist', profile: 'Profile', premium: 'Premium' }
type OpenImage = (image: ImageAsset, trigger: HTMLElement) => void
const heights = [.18, .30, .58, .82, .45, .68, 1, .62, .42, .76, .5, .28, .16]

function Wave({ className = '' }: { className?: string }) {
  return <div className={`bm-wave ${className}`} aria-hidden="true">{heights.map((h, i) => <i key={i} style={{ '--bar': h } as CSSProperties} />)}</div>
}
function Phone({ screen, wireframe = false, className = '', onOpen, priority = false }: { screen: string; wireframe?: boolean; className?: string; onOpen: OpenImage; priority?: boolean }) {
  const visual: ImageAsset = { kind: 'image', src: `${BASE}${wireframe ? 'wireframe-' : ''}${screen}.webp`, width: 591, height: 1278, alt: `Blend Music ${labels[screen] ?? screen}${wireframe ? ' low-fidelity wireframe' : ' high-fidelity screen'}` }
  return <button className={`bm-phone ${className}`} onClick={e => onOpen(visual, e.currentTarget)} aria-label={`Enlarge ${visual.alt}`} type="button"><img src={visual.src} alt={visual.alt} width="591" height="1278" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" /></button>
}
function Sketch({ n, onOpen, className = '' }: { n: number; onOpen: OpenImage; className?: string }) {
  const visual: ImageAsset = { kind: 'image', src: `${BASE}sketch-${n}.webp`, width: 1688, height: 950, alt: `Original pencil sketch ${n} for Blend Music` }
  return <button className={`bm-sketch ${className}`} type="button" onClick={e => onOpen(visual, e.currentTarget)} aria-label={`Enlarge ${visual.alt}`}><img src={visual.src} alt={visual.alt} width="1688" height="950" loading="lazy" /></button>
}
function Card({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return <div className="bm-card"><span className="bm-eyebrow">{index}</span><h3>{title}</h3><p>{children}</p></div>
}
function Copy({ title, children }: { title: string; children: ReactNode }) {
  return <div className="bm-copy"><h3>{title}</h3><p>{children}</p></div>
}
function Section({ n, id, label, title, className = '', children }: { n: number; id: string; label: string; title: ReactNode; className?: string; children: ReactNode }) {
  return <section className={`bm-section ${className}`} id={id} aria-labelledby={`bm-heading-${id}`} data-section={n}>
    <header className="bm-section-head"><p className="bm-eyebrow">{String(n - 1).padStart(2, '0')} / {label}</p><h2 id={`bm-heading-${id}`}>{title}</h2></header>
    <div className="bm-section-content">{children}</div>
    <footer className="bm-section-footer"><span>BLEND MUSIC / PRODUCT DESIGN</span><span>{String(n).padStart(2, '0')}</span></footer>
  </section>
}
function ScreenGrid({ wireframe = false, onOpen }: { wireframe?: boolean; onOpen: OpenImage }) {
  return <div className="bm-screen-grid">{screenNames.map(s => <figure key={s}><Phone screen={s} wireframe={wireframe} onOpen={onOpen} /><figcaption>{labels[s]}</figcaption></figure>)}</div>
}

export default function BlendMusicPage() {
  const root = useRef<HTMLElement>(null)
  const [viewer, setViewer] = useState<{ image: ImageAsset; trigger: HTMLElement } | null>(null)
  const [progress, setProgress] = useState(0)
  const open = useCallback<OpenImage>((image, trigger) => setViewer({ image, trigger }), [])
  const close = useCallback(() => setViewer(null), [])
  useDocumentMeta('Blend Music — Music App UI/UX Case Study · Waqar Basit', 'From pencil sketches to eight high-fidelity screens: a music discovery and listening experience designed by Waqar Basit.', '/projects/blend-music/share.jpg')
  useEffect(() => {
    const update = () => { const el = root.current; if (!el) return; const start = el.offsetTop; const distance = el.offsetHeight - window.innerHeight; setProgress(Math.max(0, Math.min(1, (window.scrollY - start) / distance))) }
    update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])
  useEffect(() => {
    if (!window.IntersectionObserver || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const sections = root.current?.querySelectorAll('.bm-section-content')
    const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('bm-in-view'); observer.unobserve(e.target) } }), { threshold: .08 })
    sections?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return <>
    <article className="blend-music" ref={root} aria-label="Blend Music product design case study">
      <div className="bm-reading-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <nav className="bm-navigation" aria-label="Case study sections"><Link to="/" state={{ scrollTo: 'work' }}>← Selected work</Link><div><a href="#bm-overview">Overview</a><a href="#bm-sketches">Process</a><a href="#bm-final">Final screens</a><a href={FIGMA} target="_blank" rel="noreferrer">Figma ↗</a></div></nav>
      <div className="bm-canvas">
        <section className="bm-cover" id="bm-top" data-section="1" aria-labelledby="bm-title">
          <div className="bm-cover-labels"><span>BLEND MUSIC</span><span>MOBILE APP / UI & UX CASE STUDY</span></div>
          <h1 id="bm-title">Find your sound.<br />Feel every beat.</h1>
          <p className="bm-cover-lede">A music experience built around discovery,<br className="bm-desktop-break" /> expression and the joy of listening.</p>
          <div className="bm-cover-art"><span className="bm-orbit" /><Phone screen="search" onOpen={open} className="bm-cover-search" priority /><Phone screen="home" onOpen={open} className="bm-cover-home" priority /></div>
          <Wave className="bm-cover-wave" />
          <div className="bm-cover-credit"><p>Design by Waqar Basit</p><span>Sketches → Wireframes → Final UI</span></div>
          <footer className="bm-section-footer"><span>BLEND MUSIC / PRODUCT DESIGN</span><span>01</span></footer>
        </section>
        <Section n={2} id="bm-overview" label="PROJECT OVERVIEW" title={<>One place for your<br />next favorite track.</>}>
          <p className="bm-lede">Blend Music brings curated discovery, search, playlists and playback into a connected mobile experience.</p>
          <div className="bm-grid bm-grid-three"><Card index="PRODUCT" title="Music streaming">A mobile concept for discovering tracks, following artists and managing a personal library.</Card><Card index="ROLE" title="UI/UX design">Paper exploration, low-fidelity wireframes and high-fidelity interface design.</Card><Card index="DELIVERABLES" title="8 key screens">Entry, Home, Search, Player, Playlist, Artist, Profile and Premium.</Card></div>
        </Section>
        <Section n={3} id="bm-identity" label="VISUAL IDENTITY" title="A name with rhythm.">
          <div className="bm-wordmark"><Wave /><div><strong>Blend</strong><span>M U S I C</span></div></div>
          <p className="bm-note">A soundwave motif created for this presentation, paired with the product name.<br />Purple carries the energy; a quiet neutral canvas keeps the story clear.</p>
        </Section>
        <Section n={4} id="bm-brand" label="BRAND TOUCHPOINTS" title="Recognizable at every touch.">
          <div className="bm-brand-grid"><div className="bm-brand-icon"><Wave /><h3>Blend Music</h3></div><div className="bm-brand-social"><h3>Your mood.<br />Your music.</h3><p>A new rhythm for everyday listening.</p></div></div>
          <p className="bm-note">Brand application concepts for the case study.</p>
        </Section>
        <Section n={5} id="bm-scope" label="SCOPE OF WORK" title={<>From a rough idea<br />to a complete visual story.</>}>
          <div className="bm-grid bm-grid-four"><Card index="01" title="Explore">Sketch screen structures and identify the core listening tasks.</Card><Card index="02" title="Structure">Organize discovery, playback, library and account destinations.</Card><Card index="03" title="Design">Bring the experience to life through imagery, color and hierarchy.</Card><Card index="04" title="Present">Connect the process and the final screens in one portfolio story.</Card></div>
        </Section>
        <Section n={6} id="bm-preview" label="PRODUCT PREVIEW" title={<>Made to be seen.<br />Designed to be heard.</>} className="bm-device-section">
          <div className="bm-trio bm-trio-tilted"><span className="bm-orbit" /><Phone screen="login" onOpen={open} /><Phone screen="home" onOpen={open} /><Phone screen="player" onOpen={open} /></div>
        </Section>
        <Section n={7} id="bm-approach" label="DESIGN APPROACH" title="Give each stage a purpose.">
          <div className="bm-approach-grid"><Copy title="01 / Start on paper">Explore the arrangement of content before committing to visual detail.</Copy><Copy title="02 / Resolve the structure">Use neutral wireframes to establish hierarchy and screen relationships.</Copy><Copy title="03 / Add expression">Use artwork and purple accents to turn the structure into a music experience.</Copy></div><div className="bm-timeline" aria-hidden="true"><i /><i /><i /></div>
        </Section>
        <Section n={8} id="bm-interface" label="INTERFACE OVERVIEW" title={<>Discovery, listening<br />and a library of your own.</>} className="bm-device-section"><div className="bm-trio"><Phone screen="home" onOpen={open} /><Phone screen="search" onOpen={open} /><Phone screen="profile" onOpen={open} /></div></Section>
        <Section n={9} id="bm-foundations" label="TYPOGRAPHY & COLOR" title={<>Calm foundations.<br />Expressive accents.</>}>
          <div className="bm-type-specimen"><div><strong>Manrope</strong><p>Presentation typography</p></div><div><p>Regular / SemiBold / Bold</p><p>Aa Bb Cc 0123456789</p></div></div>
          <div className="bm-swatches">{['#FFFFFF', '#F7F7F8', '#17151C', '#B95CFF', '#7A4DFF', '#F24BD8'].map(c => <figure key={c}><span style={{ background: c }} /><figcaption>{c}</figcaption></figure>)}</div>
          <p className="bm-note">Manrope is used for this case-study presentation. Original screen typography is preserved in the supplied exports.</p>
        </Section>
        <Section n={10} id="bm-opportunities" label="DESIGN OPPORTUNITIES" title={<>Three things the experience<br />needs to get right.</>}>
          <div className="bm-grid bm-grid-three"><Card index="DISCOVER" title="Make the next track easy to find.">Balance curated playlists, familiar genres and artist-led exploration.</Card><Card index="LISTEN" title="Keep playback in focus.">Give artwork, track information and essential controls a clear visual hierarchy.</Card><Card index="COLLECT" title="Make the library feel personal.">Bring playlists, followed artists and account options into a recognizable home.</Card></div><p className="bm-note">Design goals inferred from the supplied screens; these are not reported user-research findings.</p>
        </Section>
        <Section n={11} id="bm-sketches" label="EARLY EXPLORATION" title={<>It started with<br />a pencil and a page.</>}>
          <p className="bm-intro">Original paper sketches document the first pass at screen structure, content placement and navigation.</p>
          <div className="bm-sketch-grid"><Sketch n={1} onOpen={open} /><Sketch n={2} onOpen={open} /><Sketch n={3} onOpen={open} /><Copy title="Structure before styling">The early drawings give the case study a visible starting point. They connect the finished interface to the decisions made before color and imagery.</Copy></div>
        </Section>
        <Section n={12} id="bm-problem" label="PROBLEM & SOLUTION" title={<>A clearer path<br />from browsing to listening.</>}>
          <div className="bm-problem-grid"><Copy title="The design challenge">Bring discovery, search, playback and personal content together without making every screen compete for attention.</Copy><span className="bm-arrow" aria-hidden="true">→</span><Copy title="The proposed response">Use dedicated destinations, consistent navigation and prominent artwork to give each listening task its own focus.</Copy></div><p className="bm-statement">Discover → Choose → Play → Make it yours</p>
        </Section>
        <Section n={13} id="bm-audience" label="AUDIENCE & NEEDS" title={<>Designed for everyday<br />listening moments.</>}>
          <p className="bm-eyebrow bm-sub-label">Working audience assumptions</p><div className="bm-grid bm-grid-three"><Card index="THE EXPLORER" title="Find something new">Wants easy ways to explore genres, popular tracks and artist collections.</Card><Card index="THE EVERYDAY LISTENER" title="Get to the music">Wants familiar playlists and clear playback controls with little interruption.</Card><Card index="THE COLLECTOR" title="Keep favorites close">Wants a recognizable place for playlists, artists and personal account options.</Card></div><p className="bm-note">These are design hypotheses based on the concept, not interview-validated personas.</p>
        </Section>
        <Section n={14} id="bm-journey" label="LISTENING JOURNEY" title={<>From a listening intention<br />to a personal collection.</>}>
          <p className="bm-note bm-intro">Illustrative task journey — maps the intended experience rather than observed user behavior.</p><ol className="bm-journey-grid">{[
            ['Arrive', 'Open the app', 'See curated music and familiar content.', 'Clear entry point'], ['Explore', 'Browse or search', 'Choose a genre, playlist or artist.', 'Recognizable categories'], ['Choose', 'Open a collection', 'Review tracks before playing.', 'Clear content hierarchy'], ['Listen', 'Play a track', 'Use playback controls and track details.', 'Focused player'], ['Return', 'Visit Profile', 'Find personal playlists and artists.', 'Consistent navigation']
          ].map((a, i) => <li key={a[0]}><span className="bm-eyebrow">0{i + 1}</span><h3>{a[0]}</h3><h4>{a[1]}</h4><p>{a[2]}</p><small>{a[3]}</small></li>)}</ol>
        </Section>
        <Section n={15} id="bm-wireframes" label="LOW-FIDELITY WIREFRAMES" title={<>Establish the structure.<br />Then add expression.</>}><ScreenGrid wireframe onOpen={open} /><p className="bm-note">Eight neutral layouts establish content hierarchy before the high-fidelity visual treatment.</p></Section>
        <Section n={16} id="bm-flow" label="USER FLOW" title={<>A connected route<br />through the music.</>}>
          <div className="bm-flow"><ol className="bm-flow-main">{[['Entry', 'Sign up or sign in'], ['Home', 'Curated discovery'], ['Collection', 'Playlist or artist'], ['Player', 'Listen']].map(a => <li key={a[0]}><h3>{a[0]}</h3><p>{a[1]}</p></li>)}</ol><div className="bm-flow-stem" aria-hidden="true" /><div className="bm-flow-branches">{[['Search', 'Find music'], ['Profile', 'Personal library'], ['Premium', 'Explore plans']].map(a => <div key={a[0]}><h3>{a[0]}</h3><p>{a[1]}</p></div>)}</div></div><p className="bm-note">Conceptual navigation map based on the supplied screens; authentication and payment completion states were not included.</p>
        </Section>
        <Section n={17} id="bm-player" label="NOW PLAYING" title={<>Let the track<br />take center stage.</>}>
          <div className="bm-feature"><div className="bm-feature-copy"><Copy title="Artwork leads the experience">A large circular cover sets the mood while the track name and artist remain easy to identify.</Copy><Copy title="Controls stay within reach">Playback, progress and secondary actions are grouped below the track information.</Copy><Wave /></div><div className="bm-feature-art"><span className="bm-orbit" /><Phone screen="player" onOpen={open} className="bm-tilt-right" /></div></div>
        </Section>
        <Section n={18} id="bm-layout" label="LAYOUT SYSTEM" title={<>Consistency beneath<br />the visual energy.</>}>
          <div className="bm-layout-grid"><figure><div className="bm-grid-diagram" aria-label="Suggested four-column mobile grid"><i /><i /><i /><i /></div><figcaption>394 px screen width</figcaption></figure><div className="bm-feature-copy"><Copy title="A shared mobile canvas">The supplied app exports use a 394 × 852 canvas. Repeated navigation and content groups support a consistent rhythm.</Copy><Copy title="Proposed spacing refinement">Use a clear spacing scale and consistent screen edges when refining the source file. The four-column diagram is a suggested layout aid.</Copy><p className="bm-spacing-scale">8 / 16 / 24 / 32 / 48</p></div></div>
        </Section>
        <Section n={19} id="bm-campaign" label="BRAND IN CONTEXT" title={<>Music that moves<br />with your day.</>}>
          <div className="bm-poster"><div><h3>Press play.<br />Find your<br />next obsession.</h3><p>BLEND MUSIC</p></div><Wave /></div><p className="bm-note">Promotional concept created for the portfolio presentation.</p>
        </Section>
        <Section n={20} id="bm-discovery" label="DISCOVERY & SEARCH" title={<>A familiar start.<br />A new direction.</>}>
          <div className="bm-discovery"><div className="bm-pair"><Phone screen="home" onOpen={open} /><Phone screen="search" onOpen={open} /></div><div className="bm-feature-copy"><Copy title="Curated discovery">Home combines genre filters, featured mixes and popular content in a clear browsing sequence.</Copy><Copy title="An intentional search space">A dedicated destination brings search, recent items and artist discovery together.</Copy></div></div>
        </Section>
        <Section n={21} id="bm-collections" label="PLAYLISTS & ARTISTS" title={<>Follow the artist.<br />Stay for the collection.</>}>
          <div className="bm-feature"><div className="bm-feature-copy"><Copy title="A consistent collection pattern">Playlist and artist pages share a recognizable structure: expressive artwork, summary information, prominent play actions and a scannable track list.</Copy><Copy title="Room for refinement">Distinct track titles and clearer metadata would make long lists easier to scan in the next iteration.</Copy></div><div className="bm-pair bm-pair-tilted"><span className="bm-orbit" /><Phone screen="playlist" onOpen={open} /><Phone screen="artist" onOpen={open} /></div></div>
        </Section>
        <Section n={22} id="bm-premium" label="PREMIUM EXPERIENCE" title={<>Make the upgrade<br />easy to understand.</>}>
          <div className="bm-feature"><div className="bm-feature-copy"><Copy title="The current visual direction">Dark subscription cards and purple actions connect the upgrade experience to the rest of the product.</Copy><div className="bm-premium-copy"><p className="bm-eyebrow">Proposed copy refinement</p><h3>Listen without limits.</h3><p>Ad-free listening · Offline downloads<br />High-quality audio · Clear billing terms</p><small>Suggested benefits require confirmation against the actual product offering.</small></div></div><div className="bm-feature-art"><Phone screen="premium" onOpen={open} /></div></div>
        </Section>
        <Section n={23} id="bm-profile" label="PROFILE & LIBRARY" title={<>A space that<br />feels like yours.</>}>
          <div className="bm-feature bm-feature-reverse"><div className="bm-feature-art"><Phone screen="profile" onOpen={open} className="bm-tilt-left" /></div><div className="bm-feature-copy"><Copy title="Identity at the top">Profile information gives the screen a personal anchor before moving into playlists and artist content.</Copy><Copy title="Collections close at hand">Create and import actions sit alongside the listener&apos;s saved content.</Copy><p className="bm-accent-note">Refinement opportunity: differentiate account settings, public-profile metrics and library actions more clearly.</p></div></div>
        </Section>
        <Section n={24} id="bm-final" label="HIGH-FIDELITY COLLECTION" title={<>Eight screens.<br />One visual language.</>}><ScreenGrid onOpen={open} /><p className="bm-note">Original supplied interface exports, presented together to show consistency across the experience.</p></Section>
        <Section n={25} id="bm-evolution" label="DESIGN EVOLUTION" title={<>From a first idea<br />to a finished interface.</>}>
          <div className="bm-evolution"><div><span className="bm-eyebrow">01 / PAPER</span><Sketch n={2} onOpen={open} /><Copy title="Explore structure">Fast, low-commitment decisions about layout and content.</Copy></div><figure><span className="bm-eyebrow">02 / WIREFRAME</span><Phone screen="home" wireframe onOpen={open} /><figcaption>Resolve hierarchy</figcaption></figure><figure><span className="bm-eyebrow">03 / FINAL UI</span><Phone screen="home" onOpen={open} /><figcaption>Add expression</figcaption></figure></div>
        </Section>
        <Section n={26} id="bm-refinements" label="REFINEMENT OPPORTUNITIES" title={<>Good presentation.<br />An even clearer product.</>}>
          <p className="bm-intro">A focused review of the supplied screens surfaced the following improvements for the next source-design iteration.</p><div className="bm-grid bm-grid-two"><Card index="01" title="Make plan language precise">Change “Subscription Plane” to “Subscription Plan” and “Standar” to “Standard”. Replace service-style benefits with confirmed music features.</Card><Card index="02" title="Make content recognizable">Use distinct track titles, realistic artist metadata and clearly differentiated playlist content instead of repeated placeholders.</Card><Card index="03" title="Clarify account metrics">Review the meaning and formatting of “Favorite Songs”, followers and following so profile information reads consistently.</Card><Card index="04" title="Check readability and interaction">Verify small text contrast, touch targets, navigation labels and playback states in the editable source file.</Card></div>
        </Section>
        <Section n={27} id="bm-learnings" label="LEARNINGS & NEXT STEPS" title={<>A visual foundation.<br />A clear next iteration.</>}>
          <div className="bm-grid bm-grid-two"><Copy title="What the work demonstrates">A traceable progression from paper exploration to neutral structure and a cohesive high-fidelity music interface.</Copy><Copy title="What to validate next">Test discovery, track selection, playback and playlist management with listeners. Review premium comprehension and accessibility.</Copy></div><div className="bm-evidence"><h3>Evidence, kept honest.</h3><p>This case study presents design artifacts and rationale. No usability-study results, conversion gains or customer testimonials were supplied.</p></div>
        </Section>
        <section className="bm-closing" id="bm-closing" data-section="28" aria-labelledby="bm-thanks"><p className="bm-eyebrow">BLEND MUSIC / UI & UX CASE STUDY</p><div className="bm-closing-title"><h2 id="bm-thanks">Thanks for<br />listening.</h2><Wave /></div><p>From first sketches to a more expressive<br className="bm-desktop-break" /> music experience.</p><div className="bm-closing-links"><span>Designed by Waqar Basit</span><a href={FIGMA} target="_blank" rel="noreferrer">View in Figma ↗</a><Link to="/" state={{ scrollTo: 'work' }}>Back to selected work →</Link><a href="#bm-top">Back to top ↑</a></div></section>
      </div>
    </article>
    <Lightbox visual={viewer?.image ?? null} onClose={close} returnFocus={viewer?.trigger ?? null} />
  </>
}

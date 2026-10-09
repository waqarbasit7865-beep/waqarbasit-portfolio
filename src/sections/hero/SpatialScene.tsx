import { useEffect, useRef, type CSSProperties } from 'react'

/** CSS perspective scenes: sample interfaces, never presented as client work. */
export function SpatialScene({ mode }: { mode: 'ai' | 'delivery' }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-visible', e.isIntersecting), { threshold: .1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <figure ref={ref} className={`spatial spatial--${mode}`} aria-label={mode === 'ai' ? 'Illustration: AI explores possibilities; a designer reviews and refines the interface.' : 'Illustration: one design system delivered across desktop and mobile.'}>
    <div className="spatial__orbit" aria-hidden="true"><i /><i /><i /></div>
    <div className="spatial__rig" aria-hidden="true">
      {mode === 'ai' ? <>
        <div className="spatial__panel spatial__back"><small>01 / EXPLORE</small><strong>More possibilities.</strong><p>Brief → Structure → Variations</p><div className="ai-options">{['A','B','C'].map((x,i)=><span key={x} style={{'--n':i} as CSSProperties}><b>{x}</b><i /><i /><i /></span>)}</div></div>
        <div className="spatial__panel spatial__middle"><small>02 / HUMAN REVIEW</small><strong>Better decisions.</strong><ul><li>✓ Clear hierarchy</li><li>✓ Useful interactions</li><li>✓ Accessible contrast</li></ul><span className="spatial__chip">Direction B selected</span></div>
        <div className="spatial__panel spatial__front"><small>03 / REFINE</small><MiniDashboard /><span className="spatial__chip">Designed with intention ↗</span></div>
      </> : <>
        <div className="spatial__panel spatial__desktop"><div className="device-chrome"><i /><i /><i /><span>Workspace / Desktop</span></div><MiniDashboard /><div className="delivery-tasks"><span>Components <b>Synced</b></span><span>States <b>Documented</b></span></div></div>
        <div className="spatial__panel spatial__phone"><div className="device-notch" /><small>WORKSPACE</small><strong>Your day,<br />in focus.</strong><MiniChart /><span className="phone-task">✓ Review designs</span><span className="phone-task">○ Share prototype</span><span className="phone-button">View projects ↗</span></div>
        <div className="spatial__panel spatial__spec"><small>HANDOFF / SPECS</small><code>space: 24px<br />radius: 12px<br />grid: responsive</code><span className="spatial__chip">Figma → Development</span></div>
      </>}
    </div>
    <figcaption>Interface concept · {mode === 'ai' ? 'AI-assisted. Human-led.' : 'One system, every screen.'}</figcaption>
  </figure>
}
export function MiniChart() { return <div className="mini-chart">{[35,58,43,76,62,92,80].map((v,i)=><i key={i} style={{height:`${v}%`,'--n':i} as CSSProperties} />)}</div> }
function MiniDashboard() {return <div className="mini-dash"><div><small>WORKSPACE OVERVIEW</small><strong>Make room for clarity.</strong></div><div className="mini-dash__body"><nav>Overview<br />Projects<br />Team</nav><div><span>Weekly activity</span><MiniChart /><p>Design review <b>Ready</b></p></div></div></div>}

const tools = [
  ['Figma','F','design'],['Claude','✳','AI'],['ChatGPT','◎','AI'],['Midjourney','⛵','imagery'],
  ['Framer','F','web'],['Webflow','W','web'],['WordPress','W','web'],['Wix','Wix','web'],
  ['Unity','◇','build'],['Godot','G','build'],['Photoshop','Ps','design'],['Illustrator','Ai','design'],
]
const iconFiles: Record<string,string> = {Figma:'figma',Claude:'claude',Framer:'framer',Webflow:'webflow',WordPress:'wordpress',Wix:'wix',Unity:'unity',Godot:'godotengine',ChatGPT:'openai',Midjourney:'midjourney'}
export function ToolConstellation() {
  return <div className="tool-constellation" aria-label="Design and development tools">
    <div className="tool-constellation__rail" aria-hidden="true" />
    {tools.map(([name,mark,category],i)=><span key={name} className="tool-token" style={{'--n':i} as CSSProperties}><span className="tool-token__mark" aria-hidden="true">{iconFiles[name] ? <img src={`/tools/${iconFiles[name]}.svg`} alt="" width="20" height="20" /> : mark}</span><span>{name}<small>{category}</small></span></span>)}
  </div>
}

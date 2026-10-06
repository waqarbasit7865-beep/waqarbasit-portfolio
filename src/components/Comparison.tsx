import { useState } from 'react'
import type { Visual } from '../content/types'
import { Media } from './Media'

/**
 * Wireframe → final comparison slider.
 * Renders ONLY when both assets are real images — never with placeholders, not even in drafts.
 */
export function Comparison({ wireframe, final, caption }: { wireframe: Visual; final: Visual; caption?: string }) {
  const [pos, setPos] = useState(50)
  if (wireframe.kind !== 'image' || final.kind !== 'image') return null
  return (
    <section className="compare container" aria-labelledby="compare-title">
      <h2 id="compare-title" className="cs-h2 reveal">
        Wireframe <span className="serif">→ final</span>
      </h2>
      <figure className="compare__frame" style={{ ['--pos' as string]: `${pos}%`, aspectRatio: `${final.width} / ${final.height}` }}>
        <Media visual={final} className="compare__final" />
        <div className="compare__wire">
          <Media visual={wireframe} />
        </div>
        <span className="compare__handle" aria-hidden="true" />
        <span className="compare__tag compare__tag--l">Wireframe</span>
        <span className="compare__tag compare__tag--r">Final</span>
        <input
          className="compare__range"
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Drag to compare wireframe and final design"
        />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </section>
  )
}

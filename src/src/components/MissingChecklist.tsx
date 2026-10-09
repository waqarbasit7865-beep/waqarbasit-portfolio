import type { Project, Visual } from '../content/types'
import { SHOW_DRAFTS, isTodo } from '../lib/content'

const ph = (v?: Visual) => !!v && v.kind === 'placeholder'

/** Drafts only: a per-project list of what still needs real material before this page can be published. */
export function MissingChecklist({ project: p }: { project: Project }) {
  if (!SHOW_DRAFTS) return null
  const items: string[] = []
  if (p.status === 'draft') items.push("Status is 'draft' — hidden from the production site")
  if (p.brand.provisional) items.push('Real brand colours (accent, surface)')
  if (ph(p.cover)) items.push('Cover image')
  const hs = (p.heroScreens ?? []).filter(ph).length
  if (hs) items.push(`${hs} supporting hero screen(s)`)
  if (!p.role || isTodo(p.role)) items.push('Role / team context')
  const anyTodo = (c: Project['intro']) => !c || (Array.isArray(c) ? c.some(isTodo) : isTodo(c))
  if (anyTodo(p.intro)) items.push('Introduction')
  if (anyTodo(p.problem)) items.push('Problem statement')
  if ((p.constraints ?? []).some(isTodo)) items.push('Constraints')
  if ((p.decisions ?? []).some((d) => isTodo(d.title) || isTodo(d.body))) items.push('Key design decisions')
  const sc = (p.screens ?? []).filter(ph).length
  if (sc) items.push(`${sc} final screen(s)`)
  if (!p.links?.length) items.push('Live site / prototype link (optional)')
  const bh = [p.cover, ...(p.heroScreens ?? []), ...(p.screens ?? [])].filter((v) => v.kind === 'image' && v.source === 'behance').length
  if (bh) items.push(`${bh} image(s) hotlinked from Behance — self-host before launch`)
  if (!p.outcomes?.length) items.push('Outcomes — only if you have evidence (optional)')
  if (!items.length) return null
  return (
    <details className="missing">
      <summary>
        <span className="missing__tag">Draft</span> {items.length} item(s) needed before launch
      </summary>
      <ul>
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
      <p>This panel and all placeholders are removed automatically from the production build.</p>
    </details>
  )
}

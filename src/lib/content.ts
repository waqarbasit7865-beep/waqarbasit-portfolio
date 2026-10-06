import { projects } from '../content/projects'
import type { Copy, Project, TodoCopy, Visual } from '../content/types'

/** true in `npm run dev` and preview builds (VITE_SHOW_DRAFTS=true); false in production */
export const SHOW_DRAFTS = import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === 'true'

export const isTodo = (c: Copy | undefined | null): c is TodoCopy => !!c && typeof c === 'object' && 'todo' in c

/** Copy that should render at all (real text always; todo only in drafts) */
export const hasCopy = (c: Copy | undefined | null): c is Copy => !!c && (!isTodo(c) || SHOW_DRAFTS)

/** Visual that should render at all (real image always; placeholder only in drafts) */
export const showVisual = (v: Visual | undefined | null): v is Visual => !!v && (v.kind === 'image' || SHOW_DRAFTS)

export const visibleProjects: Project[] = projects.filter((p) => p.status === 'published' || SHOW_DRAFTS)

export const getProject = (slug: string | undefined) => visibleProjects.find((p) => p.slug === slug)

export const neighbours = (slug: string) => {
  const i = visibleProjects.findIndex((p) => p.slug === slug)
  const n = visibleProjects.length
  return {
    index: i,
    prev: visibleProjects[(i - 1 + n) % n],
    next: visibleProjects[(i + 1) % n],
  }
}

export const pad = (n: number) => String(n).padStart(2, '0')

/** Shared view-transition name used by the card cover and the case-study hero */
export const coverVT = (slug: string) => `cover-${slug}`

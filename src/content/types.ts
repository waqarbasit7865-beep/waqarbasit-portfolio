/**
 * Content model for the whole site.
 *
 * Rule of thumb:
 *  - Anything wrapped in `todo()` or `placeholder()` is DEVELOPMENT ONLY.
 *    It is shown (clearly labelled) when VITE_SHOW_DRAFTS=true and is
 *    automatically removed from the production build.
 *  - A section with no real content left disappears on its own — you never
 *    need to edit page components to hide something.
 */

/** A real, optimised image you supplied. Width/height are the intrinsic pixel size (prevents layout shift). */
export interface ImageAsset {
  kind: 'image'
  /** Path under /public, e.g. "/projects/nova-flare-connect/cover.webp" */
  src: string
  width: number
  height: number
  alt: string
  /** Optional responsive set, e.g. "/projects/x/cover-800.webp 800w, /projects/x/cover-1600.webp 1600w" */
  srcSet?: string
  /**
   * Show only part of the image, in the image's own pixels. The image is never stretched —
   * the frame takes the crop's aspect ratio and the image is positioned inside it.
   */
  crop?: { x: number; y: number; w: number; h: number }
  /** Short visible caption used in the case-study screens grid and the enlarged viewer */
  caption?: string
  /** Where the file lives. 'behance' = hotlinked from your published Behance project (self-host before launch if possible). */
  source?: 'local' | 'behance'
}

/** A clearly labelled development placeholder. Never rendered in production. */
export interface PlaceholderAsset {
  kind: 'placeholder'
  /** What the real asset should be, e.g. "Dashboard overview screen" */
  label: string
  width: number
  height: number
}

export type Visual = ImageAsset | PlaceholderAsset

/** Copy that has not been written yet. Shown as a labelled note in drafts, removed in production. */
export interface TodoCopy {
  todo: string
}
export type Copy = string | TodoCopy

export interface Decision {
  title: Copy
  body: Copy
}

export interface Outcome {
  label: string
  value: string
  /**
   * 'evidence'           – business/product result you can back up (client confirmation, analytics you are allowed to share)
   * 'platform-engagement' – Behance/Dribbble/LinkedIn likes, views, appreciations. Labelled as platform engagement, never as business impact.
   */
  type: 'evidence' | 'platform-engagement'
  /** Where the number comes from, e.g. "Behance, as of Oct 2026" */
  source: string
}

export interface ProjectLink {
  label: string
  href: string
  kind: 'live' | 'prototype' | 'case-study'
}

export interface BrandTheme {
  /** Main brand colour — used for accents, progress bars, focus rings on the project page */
  accent: string
  /** Text colour that is readable ON the accent colour */
  onAccent: string
  /** Deep background tone for the project's atmosphere */
  surface: string
  /** true until you replace with the project's real brand hex values */
  provisional?: boolean
}

/** How the gallery composes the project's visuals */
export type Composition = 'dashboard' | 'mobile' | 'website'

export interface Project {
  /** URL slug → /work/<slug>. Lowercase, hyphens only. */
  slug: string
  title: string
  /** Short category line, e.g. "AI-powered POS & Payments" */
  category: string
  /** One or two sentences used for the page description and case-study header */
  summary: string
  /** One concise factual line shown in Selected Work (falls back to summary) */
  tagline?: string
  /** 'draft' projects only appear when VITE_SHOW_DRAFTS=true */
  status: 'draft' | 'published'
  brand: BrandTheme
  year?: string
  /** Gallery composition — chosen from the real content type, never forced */
  composition: Composition
  /** Main image — used on the homepage card and as the hero of the detail page (shared-element transition) */
  cover: Visual
  /** 1–3 supporting screens that stagger in on the homepage card and hero */
  heroScreens?: Visual[]
  role?: Copy
  scope?: string[]
  sectors?: string[]
  platforms?: string[]
  tools?: string[]
  /** Overview paragraphs */
  intro?: Copy | Copy[]
  problem?: Copy | Copy[]
  constraints?: Copy[]
  /** Goals defined for the project (from the published case study) */
  goals?: string[]
  /** Key features / deliverables listed for the project */
  features?: string[]
  /** User flow steps, in order */
  flow?: string[]
  /** Information architecture — top-level pages / sections */
  ia?: string[]
  /** Image held beside the key decisions on desktop (sticky within that subsection only) */
  decisionVisual?: Visual
  decisions?: Decision[]
  /** Only rendered when BOTH real images are supplied */
  comparison?: { wireframe: Visual; final: Visual; caption?: string }
  screens?: Visual[]
  outcomes?: Outcome[]
  /** Qualitative outcome statement, with where it comes from */
  outcomeSummary?: { text: string; source: string }
  links?: ProjectLink[]
}

export const todo = (text: string): TodoCopy => ({ todo: text })
export const placeholder = (label: string, width = 1600, height = 1000): PlaceholderAsset => ({
  kind: 'placeholder',
  label,
  width,
  height,
})

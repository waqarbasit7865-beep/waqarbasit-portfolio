/**
 * More Client Work — typed access to src/content/more-work.json (the one file to edit).
 * See the "_readme" in that file for the rules: published, verified projects only.
 */
import data from './more-work.json'

export interface MoreImage {
  /** self-hosted copy under /public (created by `npm run thumbs`) */
  local: string
  /** the image as published on Behance / Contra (used until the local copy exists) */
  remote: string
  alt: string
  /** set to true by `npm run thumbs` once the local copy exists; until then the published image is shown */
  hosted?: boolean
}
export interface MoreProject {
  id: string
  title: string
  type: string
  description: string
  client?: string
  role?: string
  tools?: string[]
  accent?: string
  source: 'Behance' | 'Contra'
  href: string
  alsoOn?: { label: string; href: string }
  live?: string
  /** slug of a case-study page on this site */
  caseStudy?: string
  thumb: MoreImage
  images?: MoreImage[]
}

export const moreWork = (data.projects as MoreProject[]).slice(0, 10)

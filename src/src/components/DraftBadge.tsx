import { SHOW_DRAFTS } from '../lib/content'

/** Visible only in development / preview builds so placeholders are never mistaken for final content. */
export function DraftBadge() {
  if (!SHOW_DRAFTS) return null
  return (
    <div className="draft-badge" role="note">
      <span className="draft-badge__dot" aria-hidden="true" />
      Development preview · placeholders visible
    </div>
  )
}

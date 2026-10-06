import type { Copy as CopyT } from '../content/types'
import { isTodo } from '../lib/content'

/** Renders real copy as-is, or a labelled "to write" note (drafts only — callers gate with hasCopy). */
export function Copy({ value }: { value: CopyT }) {
  if (isTodo(value)) {
    return (
      <span className="todo">
        <span className="todo__tag">To write</span> {value.todo}
      </span>
    )
  }
  return <>{value}</>
}

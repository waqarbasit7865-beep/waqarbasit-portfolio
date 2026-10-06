import { Fragment } from 'react'

/**
 * Splits text into masked words for choreographed reveals.
 * Words wrapped in *asterisks* are set in the serif italic accent face.
 * Screen readers get the plain sentence via aria-label.
 */
export function SplitWords({ text, className = '' }: { text: string; className?: string }) {
  const tokens = text.split(/(\*[^*]+\*)/g).filter(Boolean)
  const plain = text.replace(/\*/g, '')
  return (
    <span className={`split ${className}`} aria-label={plain} role="text">
      {tokens.map((tok, ti) => {
        const accent = tok.startsWith('*') && tok.endsWith('*')
        const words = (accent ? tok.slice(1, -1) : tok).split(/(\s+)/)
        return (
          <Fragment key={ti}>
            {words.map((w, wi) =>
              /^\s+$/.test(w) ? (
                ' '
              ) : w ? (
                <span className="w" key={wi} aria-hidden="true">
                  <span className={`wi${accent ? ' serif' : ''}`}>{w}</span>
                </span>
              ) : null,
            )}
          </Fragment>
        )
      })}
    </span>
  )
}

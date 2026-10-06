import { useEffect, useRef } from 'react'
import type { Visual } from '../content/types'
import { Media } from './Media'

/**
 * Accessible enlarged viewer for one image (no carousel).
 * Uses the native <dialog> for focus containment; Escape and the close button close it,
 * and focus returns to the element that opened it.
 */
export function Lightbox({ visual, onClose, returnFocus }: { visual: Visual | null; onClose: () => void; returnFocus: HTMLElement | null }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (visual && !d.open) {
      d.showModal()
      document.documentElement.classList.add('lightbox-open')
    }
    if (!visual && d.open) d.close()
  }, [visual])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onDialogClose = () => {
      document.documentElement.classList.remove('lightbox-open')
      onClose()
      returnFocus?.focus({ preventScroll: true })
    }
    d.addEventListener('close', onDialogClose)
    return () => d.removeEventListener('close', onDialogClose)
  }, [onClose, returnFocus])

  useEffect(() => () => document.documentElement.classList.remove('lightbox-open'), [])

  const caption = visual?.kind === 'image' ? visual.caption ?? visual.alt : undefined
  const tall = visual ? visual.kind === 'image' && !visual.crop && visual.height > visual.width * 2 : false

  return (
    <dialog
      ref={ref}
      className="lightbox"
      aria-label={caption ? `Enlarged image: ${caption}` : 'Enlarged image'}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close()
      }}
    >
      {visual && (
        <div className="lightbox__inner">
          <div className="lightbox__bar">
            <p className="lightbox__caption">{caption}</p>
            <button type="button" className="lightbox__close" onClick={() => ref.current?.close()} autoFocus>
              Close <span aria-hidden="true">✕</span>
            </button>
          </div>
          <div className={`lightbox__stage${tall ? ' is-tall' : ''}`} tabIndex={tall ? 0 : -1} aria-label={tall ? 'Scrollable image' : undefined}>
            <Media visual={visual} priority sizes="100vw" />
          </div>
        </div>
      )}
    </dialog>
  )
}

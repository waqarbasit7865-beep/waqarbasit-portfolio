import { useEffect, useLayoutEffect, useState } from 'react'
import { site } from '../content/site'

export const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

/** Sets <title> and meta description for client-side navigations (build also pre-renders them per route). */
export function useDocumentMeta(title: string, description: string, shareImage?: string) {
  useEffect(() => {
    document.title = title
    const set = (sel: string, attr: string, val: string) => {
      const el = document.head.querySelector(sel)
      if (el) el.setAttribute(attr, val)
    }
    set('meta[name="description"]', 'content', description)
    set('meta[property="og:title"]', 'content', title)
    set('meta[property="og:description"]', 'content', description)
    if (!shareImage) return
    const changed: { element: Element; previous: string | null; created: boolean }[] = []
    for (const [attr, key] of [['property', 'og:image'], ['name', 'twitter:image']]) {
      let element = document.head.querySelector(`meta[${attr}="${key}"]`)
      const created = !element
      if (!element) { element = document.createElement('meta'); element.setAttribute(attr, key); document.head.appendChild(element) }
      changed.push({ element, previous: element.getAttribute('content'), created })
      element.setAttribute('content', new URL(shareImage, window.location.origin).href)
    }
    return () => changed.forEach(({ element, previous, created }) => { if (created) element.remove(); else if (previous !== null) element.setAttribute('content', previous) })
  }, [title, description, shareImage])
}

export const homeMeta = site.seo

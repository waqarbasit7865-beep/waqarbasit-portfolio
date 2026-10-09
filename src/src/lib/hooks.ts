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
export function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title
    const set = (sel: string, attr: string, val: string) => {
      const el = document.head.querySelector(sel)
      if (el) el.setAttribute(attr, val)
    }
    set('meta[name="description"]', 'content', description)
    set('meta[property="og:title"]', 'content', title)
    set('meta[property="og:description"]', 'content', description)
  }, [title, description])
}

export const homeMeta = site.seo

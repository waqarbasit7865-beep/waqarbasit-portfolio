import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function scrollToId(id: string, smooth = true) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'auto', block: 'start' })
  el.focus({ preventScroll: true })
}

/** Navigate to a homepage section from anywhere (works with both browser and hash routing). */
export function useSectionNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return useCallback(
    (id: string) => {
      if (pathname === '/') scrollToId(id)
      else navigate('/', { state: { scrollTo: id } })
    },
    [navigate, pathname],
  )
}

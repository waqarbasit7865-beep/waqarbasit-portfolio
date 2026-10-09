import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Hero } from '../sections/Hero'
import { Work, useRefreshOnFonts } from '../sections/Work'
import { Approach } from '../sections/Approach'
import { About } from '../sections/About'
import { Contact } from '../sections/Contact'
import { site } from '../content/site'
import { useDocumentMeta } from '../lib/hooks'
import { scrollToId } from '../lib/nav'

export default function Home() {
  useDocumentMeta(site.seo.title, site.seo.description)
  useRefreshOnFonts()
  const location = useLocation()

  // Arriving from a project page via "All work" / nav, or a /#section link
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null
    const target = state?.scrollTo ?? (location.hash ? location.hash.slice(1) : undefined)
    if (target) requestAnimationFrame(() => scrollToId(target, false))
  }, [location])

  return (
    <>
      <Hero />
      <Work />
      <Approach />
      <About />
      <Contact />
    </>
  )
}

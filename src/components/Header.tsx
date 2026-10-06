import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { site } from '../content/site'
import { useSectionNav } from '../lib/nav'
import { Download } from './Icons'
import { visibleProjects } from '../lib/content'

const NAV = [
  ...(visibleProjects.length ? [{ id: 'work', label: 'Work' }] : []),
  { id: 'approach', label: 'Approach' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

export function Header() {
  const go = useSectionNav()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const onNav = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setOpen(false)
    go(id)
  }

  return (
    <header className={`header${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        Skip to content
      </a>
      <div className="header__inner">
        <Link to="/" className="brand" aria-label={`${site.name} — home`}>
          <span className="brand__mark" aria-hidden="true">
            <img className="brand__logo" src="/wb-logo.png" alt="" width="1280" height="1280" fetchPriority="high" />
          </span>
          <span className="brand__name">{site.name}</span>
        </Link>

        <nav className="nav" aria-label="Primary">
          <ul>
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`/#${n.id}`} onClick={(e) => onNav(e, n.id)} className="nav__link">
                  <span data-text={n.label}>{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a className="btn btn--ghost btn--sm header__cv" href={site.resume} download>
          Resume <Download />
        </a>

        <button
          className="menu-btn"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span className="menu-btn__bars" aria-hidden="true" />
        </button>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <ul>
          {NAV.map((n, i) => (
            <li key={n.id} style={{ ['--i' as string]: i }}>
              <a href={`/#${n.id}`} onClick={(e) => onNav(e, n.id)}>
                <span className="mobile-menu__num">0{i + 1}</span>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <a className="btn btn--light" href={site.resume} download>
          Download resume <Download />
        </a>
      </div>
    </header>
  )
}

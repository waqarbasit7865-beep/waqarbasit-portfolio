import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './styles/global.css'
import './styles/hero.css'
import './styles/sections.css'
import './styles/approach.css'
import './styles/work.css'
import './styles/project.css'
import './styles/upgrade.css'
import './styles/three.css'
import './styles/showcase.css'
import './lib/gsap'
import { router } from './App'
import { hasWebGL } from './three/support'

// Decide once, before first paint, whether the 3D layer replaces the HTML illustrations
document.documentElement.classList.add(hasWebGL() ? 'has-3d' : 'no-3d')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

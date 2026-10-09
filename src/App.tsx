import { Outlet, ScrollRestoration, createBrowserRouter, createHashRouter } from 'react-router-dom'
import { Header } from './components/Header'
import { DraftBadge } from './components/DraftBadge'
import { WaveCursor } from './components/WaveCursor'
import { ContactAssistant } from './components/ContactAssistant'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

function Layout() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <DraftBadge />
      <ContactAssistant />
      <WaveCursor />
      <ScrollRestoration />
    </>
  )
}

const routes = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      {
        path: '/work/:slug',
        HydrateFallback: () => null,
        // Code-split: the case-study template only loads when a project is opened
        lazy: () => import('./pages/ProjectPage').then((m) => ({ Component: m.default })),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]

// Hash routing is only used for the single-file hosted preview; the real site uses clean URLs.
export const router = import.meta.env.VITE_ROUTER === 'hash' ? createHashRouter(routes) : createBrowserRouter(routes)

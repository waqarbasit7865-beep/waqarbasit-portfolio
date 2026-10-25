import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import fs from 'node:fs'
import path from 'node:path'
import { projects } from './src/content/projects'
import { site } from './src/content/site'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/**
 * After the build, writes dist/work/<slug>/index.html for every visible project with its own
 * <title>, description and Open Graph tags — so direct links and link previews are correct on any
 * static host — plus sitemap.xml when VITE_SITE_URL is set.
 */
function prerenderRoutes(env: Record<string, string>): Plugin {
  return {
    name: 'prerender-project-routes',
    apply: 'build',
    closeBundle() {
      const out = path.resolve('dist')
      const indexFile = path.join(out, 'index.html')
      if (!fs.existsSync(indexFile)) return
      const base = fs.readFileSync(indexFile, 'utf8')
      const siteUrl = (env.VITE_SITE_URL || 'https://waqarbasit-portfolio.pages.dev').replace(/\/$/, '')
      const showDrafts = env.VITE_SHOW_DRAFTS === 'true'
      const visible = projects.filter((p) => p.status === 'published' || showDrafts)

      const render = (title: string, description: string, urlPath: string, shareImage?: string) => {
        let html = base
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
          .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
          .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
        if (siteUrl) {
          html = html.replace('</head>', `  <link rel="canonical" href="${siteUrl}${urlPath}" />\n    <meta property="og:url" content="${siteUrl}${urlPath}" />\n  </head>`)
        }
        if (shareImage && siteUrl) {
          html = html.replace('</head>', `  <meta property="og:image" content="${siteUrl}${shareImage}" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:alt" content="Blend Music: music app UI/UX case study by Waqar Basit" />\n    <meta name="twitter:title" content="${esc(title)}" />\n    <meta name="twitter:description" content="${esc(description)}" />\n    <meta name="twitter:image" content="${siteUrl}${shareImage}" />\n  </head>`)
        }
        return html
      }

      fs.writeFileSync(indexFile, render(site.seo.title, site.seo.description, '/'))
      for (const p of visible) {
        const dir = path.join(out, 'work', p.slug)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(
          path.join(dir, 'index.html'),
          render(`${p.title} — ${p.category} · ${site.name}`, p.summary, `/work/${p.slug}`, p.slug === 'blend-music' ? '/projects/blend-music/share.jpg' : undefined),
        )
      }
      if (siteUrl) {
        const urls = ['/', ...visible.map((p) => `/work/${p.slug}`)]
        fs.writeFileSync(
          path.join(out, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
            .map((u) => `  <url><loc>${siteUrl}${u}</loc></url>`)
            .join('\n')}\n</urlset>\n`,
        )
        fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`)
      }
      console.log(`✓ pre-rendered ${visible.length} project route(s)${showDrafts ? ' (drafts included)' : ''}`)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // `--mode artifact` = single self-contained HTML file for a hosted preview (hash routing, drafts on)
  if (mode === 'artifact') {
    return {
      plugins: [react(), viteSingleFile()],
      build: { outDir: 'dist-preview', assetsInlineLimit: 100_000_000 },
    }
  }
  return {
    plugins: [react(), prerenderRoutes(env)],
    build: { outDir: 'dist', sourcemap: false },
  }
})

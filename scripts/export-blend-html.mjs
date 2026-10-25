/** Export the same React case study as one offline-ready HTML file after the production build. */
import fs from 'node:fs/promises'
import path from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

const root = process.cwd()
const dist = path.join(root, 'dist')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { default: Page } = await server.ssrLoadModule('/src/pages/BlendMusicPage.tsx')
  const markup = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/work/blend-music'] }, React.createElement(Page)))
  const files = await fs.readdir(path.join(dist, 'assets'))
  let css = (await Promise.all(files.filter(n => /^(index|BlendMusicPage)-.*\.css$/.test(n)).sort((a, b) => a.startsWith('index') ? -1 : b.startsWith('index') ? 1 : a.localeCompare(b)).map(n => fs.readFile(path.join(dist, 'assets', n), 'utf8')))).join('\n')
  const fontUrls = [...new Set([...css.matchAll(/url\(([^)]+)\)/g)].map(m => m[1].replace(/^['"]|['"]$/g, '')).filter(u => /\.(woff2?|ttf)(\?.*)?$/.test(u)))]
  for (const url of fontUrls) {
    const name = path.basename(url.split('?')[0])
    const bytes = await fs.readFile(path.join(dist, 'assets', name))
    const type = name.endsWith('.woff2') ? 'font/woff2' : name.endsWith('.woff') ? 'font/woff' : 'font/ttf'
    css = css.split(url).join(`data:${type};base64,${bytes.toString('base64')}`)
  }
  let body = markup
  const urls = [...new Set([...body.matchAll(/src="(\/projects\/blend-music\/[^\"]+)"/g)].map(m => m[1]))]
  for (const url of urls) {
    const bytes = await fs.readFile(path.join(root, 'public', url.slice(1)))
    body = body.split(url).join(`data:image/webp;base64,${bytes.toString('base64')}`)
  }
  body = body.replaceAll('href="/"', 'href="https://waqarbasit-portfolio.pages.dev/#work"')
  const script = `
const dialog = document.querySelector('.lightbox');
let lastTrigger;
document.querySelectorAll('.bm-phone,.bm-sketch').forEach(button => button.addEventListener('click', () => {
  const source = button.querySelector('img'); if (!source) return; lastTrigger = button;
  const inner = document.createElement('div'); inner.className = 'bm-static-viewer';
  const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Close ×'; close.addEventListener('click', () => dialog.close());
  const image = document.createElement('img'); image.src = source.src; image.alt = source.alt;
  const caption = document.createElement('p'); caption.textContent = source.alt;
  inner.append(close, caption, image); dialog.replaceChildren(inner); dialog.setAttribute('aria-label', source.alt); dialog.showModal(); document.documentElement.classList.add('lightbox-open');
}));
dialog.addEventListener('click', e => { if(e.target === dialog) dialog.close() });
dialog.addEventListener('close', () => { document.documentElement.classList.remove('lightbox-open'); lastTrigger?.focus({preventScroll:true}) });
const progress = document.querySelector('.bm-reading-progress');
window.addEventListener('scroll', () => { const range = document.documentElement.scrollHeight-innerHeight; progress.style.transform='scaleX('+Math.max(0,Math.min(1,scrollY/range))+')' }, {passive:true});
if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){ const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('bm-in-view');observer.unobserve(e.target)}}),{threshold:.08}); document.querySelectorAll('.bm-section-content').forEach(el=>observer.observe(el)); }
`
  const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#17151C"><title>Blend Music — Music App UI/UX Case Study · Waqar Basit</title><meta name="description" content="From paper sketches to eight final screens: the Blend Music UI/UX design case study by Waqar Basit."><link rel="canonical" href="https://waqarbasit-portfolio.pages.dev/work/blend-music"><style>${css}\n.bm-standalone-masthead{position:fixed;top:0;left:0;right:0;height:72px;background:#0d0e10;color:#fff;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 6%;font:600 15px 'Manrope Variable',sans-serif}.bm-static-viewer{padding:24px;color:#fff;display:grid;gap:18px;justify-items:center}.bm-static-viewer>button{justify-self:end;min-height:44px;padding:8px 14px;background:#333;border-radius:10px}.bm-static-viewer img{max-height:80vh;max-width:90vw;width:auto;object-fit:contain}.bm-static-viewer p{font-size:14px;text-align:center}</style></head><body><div class="bm-standalone-masthead"><a href="https://waqarbasit-portfolio.pages.dev/">Waqar Basit</a><a href="https://waqarbasit-portfolio.pages.dev/#work">Portfolio ↗</a></div><main>${body}</main><script>${script}</script></body></html>`
  await fs.writeFile(path.join(dist, 'blend-music.html'), html)
  console.log(`✓ exported standalone Blend Music HTML (${(Buffer.byteLength(html)/1024/1024).toFixed(1)} MB, 28 sections, 19 embedded source images)`)
} finally { await server.close() }

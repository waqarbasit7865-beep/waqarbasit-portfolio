/**
 * Optimise project images → WebP at 2 widths, and print ready-to-paste entries for projects.ts.
 *
 *   1. Put original PNG/JPG exports in:   assets-src/projects/<slug>/
 *   2. Run:                               npm run images
 *   3. Output goes to:                    public/projects/<slug>/<name>-1600.webp (+ -800.webp)
 *   4. Copy the printed snippet into src/content/projects.ts and write real alt text.
 *
 * Re-running is safe: existing outputs are overwritten. Originals are never modified.
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const SRC = path.resolve('assets-src/projects')
const OUT = path.resolve('public/projects')
const WIDTHS = [800, 1600]
const exts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif'])

if (!fs.existsSync(SRC)) {
  console.log(`No ${SRC} folder yet. Create assets-src/projects/<slug>/ and add images.`)
  process.exit(0)
}

for (const slug of fs.readdirSync(SRC)) {
  const dir = path.join(SRC, slug)
  if (!fs.statSync(dir).isDirectory()) continue
  const outDir = path.join(OUT, slug)
  fs.mkdirSync(outDir, { recursive: true })
  console.log(`\n── ${slug}`)
  for (const file of fs.readdirSync(dir).sort()) {
    if (!exts.has(path.extname(file).toLowerCase())) continue
    const name = path.parse(file).name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const input = sharp(path.join(dir, file))
    const meta = await input.metadata()
    const srcset = []
    let main = null
    for (const w of WIDTHS) {
      const width = Math.min(w, meta.width)
      const height = Math.round((meta.height / meta.width) * width)
      const outName = `${name}-${w}.webp`
      await sharp(path.join(dir, file)).resize({ width }).webp({ quality: 82 }).toFile(path.join(outDir, outName))
      srcset.push(`/projects/${slug}/${outName} ${width}w`)
      main = { src: `/projects/${slug}/${outName}`, width, height }
    }
    console.log(
      `{ kind: 'image', src: '${main.src}', width: ${main.width}, height: ${main.height}, srcSet: '${srcset.join(', ')}', alt: 'TODO describe ${name}' },`,
    )
  }
}

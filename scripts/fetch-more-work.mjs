/**
 * Self-host the More Client Work images.
 *
 *   npm run thumbs
 *
 * Reads src/content/more-work.json, downloads every `thumb.remote` / `images[].remote` (the images as published
 * on Behance / Contra), and writes optimised WebP copies to the matching `local` path under /public
 * (thumbnails 1200 px wide, gallery images 1600 px wide; aspect ratio preserved, never cropped or stretched).
 * Existing files are skipped unless you pass --force. For Behance covers it first tries the larger 808 px rendition.
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const force = process.argv.includes('--force')
const data = JSON.parse(fs.readFileSync(path.resolve('src/content/more-work.json'), 'utf8'))
const jobs = []
for (const p of data.projects) {
  jobs.push({ ref: p.thumb, width: 1200 })
  for (const im of p.images ?? []) jobs.push({ ref: im, width: 1600 })
}

const candidates = (url) => (url.includes('/projects/404/') ? [url.replace('/projects/404/', '/projects/808/'), url] : [url])

let ok = 0
let failed = 0
for (const { ref: j, width } of jobs) {
  const out = path.resolve('public', j.local.replace(/^\//, ''))
  if (!force && fs.existsSync(out)) {
    j.hosted = true
    console.log(`skip  ${j.local}`)
    continue
  }
  let buf = null
  for (const url of candidates(j.remote)) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (portfolio image self-hosting)' } })
      if (r.ok && (r.headers.get('content-type') ?? '').startsWith('image/')) {
        buf = Buffer.from(await r.arrayBuffer())
        break
      }
    } catch {
      /* try the next rendition */
    }
  }
  if (!buf) {
    console.warn(`FAIL  ${j.remote}`)
    failed++
    continue
  }
  try {
    fs.mkdirSync(path.dirname(out), { recursive: true })
    const meta = await sharp(buf).metadata()
    await sharp(buf)
      .resize({ width: Math.min(width, meta.width ?? width), withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(out)
  } catch (e) {
    console.warn(`FAIL  ${j.remote} (${e.message})`)
    failed++
    continue
  }
  j.hosted = true
  console.log(`ok    ${j.local}`)
  ok++
}
// mark the self-hosted images in the content file so the page uses them
fs.writeFileSync(path.resolve('src/content/more-work.json'), JSON.stringify(data, null, 2) + '\n')
console.log(`\n${ok} saved, ${failed} failed. Commit public/work/more and src/content/more-work.json.`)

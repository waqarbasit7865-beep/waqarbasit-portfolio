# Blend Music — website update

## What is ready

- A dedicated responsive case study at `/work/blend-music`.
- 28 sections matching the Figma presentation's sequence and visual direction.
- Original pencil sketches, eight wireframes and eight final screens.
- A new first card in Selected Work.
- Image enlargement, section links, reading progress and reduced-motion support.
- Manrope presentation typography, a white/grey base and purple accents.
- A social preview image embedded in the built route's Open Graph metadata.
- `npm run build` also creates `dist/blend-music.html`: a single HTML file with all images and fonts embedded, plus working enlarged previews. This can be opened directly in a browser without installing Node.

## GitHub update — Roman Urdu

1. `Blend-Music-GitHub-Update.zip` extract karein.
2. Apni existing portfolio GitHub repository ka main page kholein.
3. Upload files ka option kholein.
4. Extracted folder ke ANDAR wali `src`, `public`, `scripts` folders aur root files upload karein. Outer ZIP folder ko upload na karein.
5. Existing repository ya files pehle delete na karein. Is update mein sirf changed/new files hain; baqi work preserved hai.
6. Commit message: `Add Blend Music case study and portfolio cover`.
7. Cloudflare ka connected build complete hone dein. Existing build command `npm run build` aur output folder `dist` rahega.
8. Successful deployment ke baad apni website par Selected Work → Blend Music kholein.
9. Direct route: `/work/blend-music`. Source changes upload hone se pehle yeh route live nahi hoga.
10. Agar Cloudflare mein `VITE_SITE_URL` variable set hai, usko apni actual public website origin se match karein. Code ka default `https://waqarbasit-portfolio.pages.dev` hai.

## Covers

The folder `public/projects/blend-music` includes:

- `cover.png` and `cover.webp` — 1600 × 1000 portfolio cover.
- `share.jpg` — 1200 × 630 social link preview.
- `thumbnail-4x3.jpg` — 1600 × 1200 alternate crop.

## Source and validation

`src/pages/BlendMusicPage.tsx` and `src/styles/blend-music.css` contain the responsive presentation. `src/content/projects.ts` supplies the new gallery card. Source app exports are preserved as images; they are design showcases, not a working music player.

Build and TypeScript checks pass. Browser checks cover mobile (390 px frame), tablet (768 px frame), and desktop (1440 px frame): 28 sections, no horizontal content overflow, working section navigation and enlarged images. The Selected Work card and return link were checked in the integrated site.

Research hypotheses and proposed refinements are clearly labeled. No invented usability metrics or testimonials have been added. No remote repository or public Cloudflare deployment has been changed by this local package.

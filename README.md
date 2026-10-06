# Waqar Basit — Portfolio

React + TypeScript + Vite, GSAP/ScrollTrigger for choreographed motion, CSS for simple interactions.
Deploys as static files (no backend, no paid services, no secrets).

---

## 1. Visual & motion plan (brief)

**Brand.** Deep charcoal `#0D0E10`, crisp off-white `#F4F4F1`, electric blue `#2F5BFF`.
Type: **Geist** (display + body, tight negative tracking at large sizes), **Instrument Serif italic** for one accent word per headline, **Geist Mono** for labels and data. Fonts are self-hosted (no Google request).

**Each section has its own atmosphere, one brand:**

| Section | Atmosphere | Signature motion |
|---|---|---|
| Hero | Pinned four-scene intro (desktop): charcoal with shifting light, flowing lines and floating workflow-tool marks | One scrubbed ScrollTrigger timeline: 01 masked headline, 02 user flow → wireframe (process illustration), 03 craft elements drop in, 04 flowing paths organise into a grid, then release into Selected Work. 01–04 controls, Skip intro, opt-in Web Audio cues. Mobile/reduced motion: a light vertical sequence |
| Selected work | Charcoal with a soft background light that crossfades to the accent of the project in view | Vertical editorial gallery (wide feature → offset → wide → full-width closing). Signature "frame to canvas": a fine frame line extends, the image aperture opens from an inset crop, number and title settle, supporting screens drift slightly. Opening a project morphs the same cover and title into the case-study header (View Transitions, with a short fallback) |
| Approach | Charcoal, intimate, fine lines | The five steps scroll normally on the left; one sticky illustrative canvas on the right evolves with them — notes cluster into a flow, become a wireframe, link to a second screen state, gain a component system, and settle into an annotated hand-off. Mobile/reduced motion: each step with its own static visual. The token playground stays below |
| About | Editorial dark grid | Arched portrait mask opening from centre + parallax, word-staggered statement, experience rows that draw their rule then slide in |
| Contact | Charcoal → electric blue as you arrive | Oversized type, underline-draw email, copy button, magnetic pill buttons with radial fill |
| Case study | Tinted by project brand colour | Cover morphs from the card into the page hero (View Transitions API), sticky product visual with wipes per step and annotation pins revealed per stage |

**Rules followed:** navigation usable immediately (no loader), no scroll-jacking or pinning, all hidden states are set by JavaScript only for users who allow motion — `prefers-reduced-motion` users and no-JS readers see the full static content.

---

## 2. Run & build

Requires **Node 20.19+** (22 recommended).

```bash
npm install
npm run dev            # http://localhost:5173 — drafts & placeholders visible
npm run build          # production build → dist/  (drafts & placeholders removed)
npm run build:preview  # production build WITH drafts (for a preview deployment)
npm run preview        # serve the last build locally
npm run images         # optimise project images (see §4)
```

`npm run build` also writes `dist/work/<slug>/index.html` for every published project with its own `<title>`, description and Open Graph tags, so direct project URLs and link previews work on any static host. If `VITE_SITE_URL` is set it also writes `sitemap.xml`, `robots.txt` and canonical links.

---

## 3. How content works

```
src/content/
  projects.ts   ← THE file you edit to add / remove / reorder projects
  site.ts       ← name, hero text, bio, experience, education, links, portrait, signature
  types.ts      ← the typed schema (+ todo() / placeholder() helpers)
public/
  projects/<slug>/…      ← optimised project images (served as-is)
  Waqar_Basit_Resume.pdf ← the "Download resume" file
assets-src/projects/<slug>/  ← put raw PNG/JPG exports here for `npm run images`
```

**Draft vs production — automatic:**

- `status: 'draft'` → project only appears in dev / preview builds.
- `todo('…')` (copy not written yet) and `placeholder('…')` (image not supplied yet) render as **yellow-labelled** notes in drafts and are **stripped from production**. A section with nothing real left disappears by itself.
- Each draft project page shows a collapsible **"N items needed before launch"** checklist.
- Outcomes render only if you add them. Each outcome has a `type`:
  `'evidence'` (a result you can back up) or `'platform-engagement'` (likes/views/appreciations — automatically labelled **"Platform engagement — not a business metric"**).
- The wireframe → final slider renders only when **both** images are real (never with placeholders).
- The signature component renders nothing until you set `site.signature` (see `site.ts`).

---

## 4. Adding, editing or reordering a project

1. **Images.** Export screens from Figma at 2× (PNG/JPG) into `assets-src/projects/<slug>/`, e.g. `assets-src/projects/nova-flare-connect/cover.png`.
2. Run `npm run images`. It writes `-800.webp` and `-1600.webp` versions to `public/projects/<slug>/` and **prints a ready-to-paste image entry with the correct width/height** for each file.
3. **Add the entry** to the `projects` array in `src/content/projects.ts`. Minimum:

   ```ts
   {
     slug: 'my-project',                 // → /work/my-project
     title: 'My Project',
     category: 'SaaS Dashboard',
     summary: 'One or two sentences.',
     status: 'published',
     brand: { accent: '#5B5BFF', onAccent: '#FFFFFF', surface: '#0E0E1A' },
     cover: { kind: 'image', src: '/projects/my-project/cover-1600.webp', width: 1600, height: 1000,
              srcSet: '/projects/my-project/cover-800.webp 800w, /projects/my-project/cover-1600.webp 1600w',
              alt: 'Dashboard overview showing …' },
   },
   ```

   Also set `composition: 'dashboard' | 'mobile' | 'website'` (decides how the gallery frames the visuals) and an optional one-line `tagline`.
   Images can use `crop: { x, y, w, h }` (in the image's own pixels) to show part of a larger board without stretching it, and `caption` for the case-study grid and enlarged viewer.

   Optional fields (each section appears only when filled): `heroScreens`, `role`, `scope`, `sectors`, `platforms`, `year`, `intro`, `problem`, `constraints`, `story` (sticky steps with `screen` + `annotations` at x/y %), `tools`, `features`, `goals`, `ia`, `flow`, `decisionVisual`, `decisions`, `comparison`, `screens`, `outcomes`, `outcomeSummary`, `links` (`kind: 'live' | 'prototype' | 'case-study'`).

4. **Reorder:** move entries up or down in the array. Homepage order, project numbering, hero screen stack (first three covers) and "Next project" links all follow it.
5. **Remove / hide:** delete the entry, or set `status: 'draft'`.
6. **Brand colours:** replace the provisional `brand` values with the project's real hex codes and delete `provisional: true`. `onAccent` must be readable on `accent` (white or near-black).

Nothing else needs editing — the card, project page, page title, prerendered HTML and sitemap entry are generated from the entry.

> Behance, Contra and Upwork do **not** sync automatically. This file is the single source; update it when you publish new work elsewhere.

---

## 5. Deploying on Cloudflare Pages (GitHub integration)

1. Create a GitHub repository (e.g. `waqarbasit-portfolio`) and push this folder:
   ```bash
   git init && git add . && git commit -m "Portfolio v1"
   git branch -M main
   git remote add origin https://github.com/<you>/waqarbasit-portfolio.git
   git push -u origin main
   ```
2. Cloudflare dashboard → **Workers & Pages → Create application → Pages → Connect to Git** → authorise GitHub → select the repo.
3. **Project name** — this becomes your `<name>.pages.dev` address (see §6).
4. Build settings:
   - Framework preset: *None* (or *Vite* if offered)
   - Build command: `npm run build`
   - Build output directory: `dist`
5. **Environment variables** (Settings → Variables and Secrets):
   - Production: `VITE_SITE_URL = https://<name>.pages.dev` (or your custom domain later). Leave `VITE_SHOW_DRAFTS` unset.
   - Preview: `VITE_SHOW_DRAFTS = true` — so branch/PR previews show placeholders while production stays clean.
   - Add `NODE_VERSION = 22` if the build complains about Node (the repo also has `.nvmrc`).
6. **Save and Deploy.** Every push to `main` redeploys production; other branches get preview URLs.

Routing: there is deliberately **no `404.html`**, so Cloudflare Pages treats the site as a single-page app and serves `index.html` for unknown paths; the app's own 404 page handles them. Project URLs are pre-rendered files anyway. `public/_headers` sets long-term caching for hashed assets and basic security headers.

> Until at least one project is `status: 'published'`, the production homepage hides the Work section and its nav link. For a first public look while assets are pending, either publish the preview build or temporarily set `VITE_SHOW_DRAFTS=true` on production (it shows the yellow "Development preview" badge).

## 6. Choosing a name-based pages.dev subdomain

The **project name you type in step 3** sets the address: project `waqarbasit` → `https://waqarbasit.pages.dev`. Names are global across all Cloudflare users, so it's first-come-first-served. Try, in order:

`waqarbasit` → `waqar-basit` → `waqarbasit-design` → `waqar-basit-ux` → `waqarbasit-studio`

Check the hostname Cloudflare shows on the setup screen before confirming — if your exact name is already taken, the assigned address can differ from what you typed. Lowercase letters, numbers and hyphens only. You can add a custom domain (e.g. `waqarbasit.com`) later under **Custom domains** without changing anything in the code — just update `VITE_SITE_URL`.

---

## Hero scene copy, tool marks and sound

- Scene headlines and capability tags: `site.hero` in `src/content/site.ts`.
- Background tool marks: `src/content/toolMarks.ts`. Figma, Framer and Claude use Simple Icons paths (CC0 data, trademarks belong to their owners). Photoshop, Illustrator and ChatGPT are shown as plain text labels because no freely licensed mark was available — add an official SVG path there if you obtain one under the owner's guidelines.
- Sound cues are synthesised in `src/lib/heroSound.ts`; nothing is created until the visitor clicks **Enable sound**.

## 7. Accessibility & performance notes

- Skip link, landmark sections, visible focus rings on every control, keyboard browsing for the gallery (← → Home End) and project pages (← → between projects, Esc back to work).
- Reduced motion: all GSAP reveals are wrapped in `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`; view transitions are disabled; content is fully visible.
- Images: fixed `width`/`height` (no layout shift), `loading="lazy"` below the fold, `fetchpriority="high"` for the hero cover, WebP with `srcSet`.
- The case-study template is code-split and only loads when a project opens.

## Images recovered from Behance

SoundLab, X Money and UCL Energy currently use images from your own published Behance projects (exact module URLs copied from those pages, marked `source: 'behance'` in `projects.ts`). They load from Behance's CDN on the live site but are blocked inside the Claude preview, where a labelled fallback panel shows instead. Before launch, download the originals from your Behance projects into `assets-src/projects/<slug>/`, run `npm run images`, and switch each `src` to the local file (keep any `crop` values — they are in the original image's pixels).

## 8. Missing real assets before public launch

- [ ] **Final project shortlist** (4–6) and order
- [ ] Per project: cover (1600×1000+), 1–2 hero screens, story screens for each step, final screens
- [ ] Per project: role/team context, intro, problem, constraints, 2–3 key decisions, annotation text
- [ ] Real **brand colours** for each project (replace provisional values)
- [ ] Live / prototype links for each project (UCL Energy links are taken from the resume — please confirm)
- [ ] Permission/NDA check that each project can be shown publicly
- [ ] Outcomes **only** where you have evidence; any likes/views labelled as platform engagement, with source and date
- [ ] Wireframe + final pairs, only where you want the comparison slider
- [ ] **Portrait photo** (vertical, ≥1200×1500)
- [ ] Optional: your **signature** as an SVG path
- [ ] Social share image (1200×630) — add `<meta property="og:image">` in `index.html`
- [ ] Final domain → set `VITE_SITE_URL`
- [ ] Confirm the resume PDF in `public/` is the version you want downloadable (it includes your phone number)

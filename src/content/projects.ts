/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PROJECTS — the only file you edit to add, remove or reorder work.
 * ─────────────────────────────────────────────────────────────────────────────
 *  • ORDER in this array = order in Selected Work and in "next project" links.
 *    The gallery layout adapts automatically: first = wide feature, last = full-width closing,
 *    projects in between alternate between an offset and a wide composition.
 *  • Each entry automatically gets: a gallery entry, a page at /work/<slug>,
 *    its own <title>/description, and a pre-rendered HTML file at build time.
 *  • `status: 'draft'` hides the project from the production site.
 *  • `todo()` / `placeholder()` are development-only and never ship to production.
 *
 *  SOURCES
 *  • Resume (Waqar_Basit_Senior_UI_UX_Designer_Resume.pdf)
 *  • Waqar's own published Behance projects (text and image URLs copied exactly as published):
 *      SoundLab    https://www.behance.net/gallery/239867063/SoundLab-Care-Lab-Consulting-Doctor-Appointment-App
 *      X Money     https://www.behance.net/gallery/239651625/X-Money-Modern-Fintech-App-UIUX-Design
 *      UCL Energy  https://www.behance.net/gallery/253253561/Live-Project-Showcase-UCL-Energy-Website-Case-study
 *  • Nova Flare Connect was not found on Behance or Contra → placeholders remain.
 *
 *  Images marked `source: 'behance'` are hotlinked from Behance's CDN. Before launch, download them
 *  from your own Behance projects, run `npm run images`, and switch `src` to the local files.
 */
import type { ImageAsset, Project } from './types'
import { placeholder, todo } from './types'

/** Builds a Behance-hosted image entry from the exact module URL published on Behance. */
const BH = 'https://mir-s3-cdn-cf.behance.net/project_modules/'
const behance = (
  file: string,
  width: number,
  height: number,
  alt: string,
  extra: Partial<ImageAsset> = {},
): ImageAsset => ({
  kind: 'image',
  src: `${BH}1400_webp/${file}`,
  srcSet: `${BH}1400_webp/${file} 1400w, ${BH}2800_webp/${file} 2800w`,
  width,
  height,
  alt,
  source: 'behance',
  ...extra,
})

/* SoundLab — 7 published presentation images */
const SL = {
  stone: behance('640c25239867063.695c26bae4919.jpg', 1400, 1085, 'Two phones on a dark stone surface showing the SoundLab splash screen', { caption: 'Splash screen' }),
  single: behance('da9f0f239867063.695c26bae68c9.jpg', 1400, 1085, 'A phone on dark stone showing the SoundLab home screen with consulting services, reminders and doctors on duty', { caption: 'Home screen' }),
  pair: behance('ab87c7239867063.695c26bae9bb3.jpg', 1400, 933, 'Two floating phones with the SoundLab splash screen and home screen', { caption: 'Splash and home' }),
  three: behance('5b0cb3239867063.695c26badfc7c.jpg', 1400, 933, 'Three SoundLab screens: onboarding, home and sign-in', { caption: 'Onboarding, home and sign-in' }),
  trio: behance('74a6ef239867063.695c26bae8668.jpg', 1400, 933, 'Three phones showing the SoundLab home screen, a lab equipment list and a services screen', { caption: 'Home, lab equipment and services' }),
  flat: behance('48c441239867063.695c26bae211f.jpg', 1400, 933, 'A spread of SoundLab screens laid flat, including forms, notifications and an order summary', { caption: 'Forms, notifications and checkout' }),
  grid: behance('c1930b239867063.695c26baeb7b8.jpg', 1400, 1085, 'Overview grid of many SoundLab app screens', { caption: 'Screen overview' }),
}

/* X Money — 7 published presentation images (1400×933) */
const XM = {
  splash: behance('1bb312239651625.695c26b695142.jpg', 1400, 933, 'X Money splash screen with the X logo on a pastel gradient', { caption: 'Splash screen' }),
  a: behance('198877239651625.695c26b691ebb.jpg', 1400, 933, 'X Money sign-up form with account number, password, referral code and phone fields', { caption: 'Account creation' }),
  b: behance('70bf55239651625.695c26b68f2c6.jpg', 1400, 933, 'X Money login screen with username and password fields', { caption: 'Login' }),
  c: behance('70938e239651625.695c26b6900b8.jpg', 1400, 933, 'X Money dashboard showing current balance, frozen amount and security deposit', { caption: 'Dashboard' }),
  qr: behance('60ab78239651625.695c26b694110.jpg', 1400, 933, 'X Money recharge screen with a wallet QR code and exchange details', { caption: 'Wallet recharge with QR' }),
  d: behance('841e29239651625.695c26b690cb6.jpg', 1400, 933, 'X Money account menu with security deposit, withdrawal, bank card and settings', { caption: 'Account menu' }),
  qr2: behance('dd1d65239651625.695c26b692ba2.jpg', 1400, 933, 'X Money bind-account screen with a Google verification QR code', { caption: 'Google verification' }),
}

/* UCL Energy — one long published case-study board (1400×10267); crops show parts of it without stretching */
const UCL_FILE = '7bd128253253561.6a63c57c06928.jpg'
const ucl = (alt: string, crop: ImageAsset['crop'], caption?: string) =>
  behance(UCL_FILE, 1400, 10267, alt, { crop, caption })
const UCL = {
  home: ucl('UCL Energy homepage design: aerial photo of a ship with the headline "When Excellence Matters"', { x: 66, y: 6840, w: 1260, h: 700 }, 'Homepage — primary entry point'),
  pages: ucl('Four UCL Energy inner page designs side by side', { x: 66, y: 7545, w: 1260, h: 640 }, 'Inner pages'),
  title: ucl('UCL Energy case-study title board: Corporate Website Design for a Global Energy Enterprise', { x: 0, y: 0, w: 1400, h: 830 }, 'Case-study cover'),
  overview: ucl('Project overview board with the homepage shown on a laptop-style frame', { x: 0, y: 847, w: 1400, h: 680 }, 'Project overview'),
  ia: ucl('Information architecture list beside a seven-step user flow from landing to business inquiry', { x: 0, y: 3880, w: 1400, h: 860 }, 'Information architecture and user flow'),
  system: ucl('UCL Energy colour palette and typography: Playfair Display and Inter', { x: 0, y: 5600, w: 1400, h: 860 }, 'Colour system and typography'),
  board: behance(UCL_FILE, 1400, 10267, 'The complete UCL Energy case-study board', { caption: 'Full case-study board (scroll to read)' }),
}

export const projects: Project[] = [
  {
    slug: 'nova-flare-connect',
    title: 'Nova Flare Connect',
    tagline: 'Dashboard workflows for payments, inventory and business operations.',
    category: 'AI-powered POS & Payments',
    summary:
      'Dashboard workflows and data visualisations for a platform covering payments, inventory and business operations, supported by a reusable design system.',
    status: 'draft',
    composition: 'dashboard',
    brand: { accent: '#FF6B3D', onAccent: '#140803', surface: '#1A0F0B', provisional: true },
    cover: placeholder('Cover — main dashboard overview', 1600, 1000),
    heroScreens: [placeholder('Detail crop — one real panel from the dashboard', 1200, 900)],
    role: todo('Your role title on this project and team context.'),
    scope: ['Dashboard workflows', 'Data visualisations', 'Reusable design system'],
    sectors: ['Payments', 'Inventory', 'Business operations'],
    intro: todo('2–3 sentences: what the product is, who uses it, and what you were brought in to do.'),
    problem: todo('The core problem the dashboard had to solve for its users.'),
    decisions: [
      { title: todo('Key decision 1'), body: todo('What you decided, the alternatives, and why.') },
      { title: 'A reusable design system', body: todo('How the component system kept dashboards consistent.') },
    ],
    screens: [placeholder('Final screen 1', 1600, 1000), placeholder('Final screen 2', 1600, 1000)],
    links: [],
  },

  {
    slug: 'soundlab',
    title: 'SoundLab',
    tagline: 'Lab consulting, appointments, ordering and payments in one app.',
    category: 'Healthcare Application',
    summary: 'A laboratory consulting and doctor appointment app for labs, doctors and patients — booking, ordering and payments in one place.',
    status: 'published',
    composition: 'mobile',
    brand: { accent: '#F0574A', onAccent: '#1A0503', surface: '#170D0C' },
    cover: SL.trio,
    heroScreens: [SL.single, SL.three],
    role: 'UI/UX design',
    tools: ['Figma', 'Photoshop'],
    sectors: ['Healthcare', 'Laboratory consulting'],
    platforms: ['Mobile app'],
    scope: ['Laboratory consulting', 'Appointment booking', 'Service ordering', 'Payments', 'Consultant profiles', 'Reminders', 'Address management'],
    intro: [
      'SoundLab is a medical laboratory consulting application built to simplify clinical operations for labs, doctors and patients.',
      'The app brings expert lab consulting services, appointment booking, order placement, compliance support and digital payments together in one product.',
    ],
    problem: 'Clinical services involve several parties and several steps. The app needed to keep booking, ordering and payment simple while maintaining medical-grade trust and clarity.',
    features: [
      'Expert laboratory consulting services (CAP, COLA, CLIA compliance, auditing, registration)',
      'Appointment management with reminders and a doctor-on-duty panel',
      'Product and service ordering with cart and checkout',
      'Multiple payment methods, including cash on delivery and debit card',
      'Address management for scheduling',
    ],
    decisions: [
      { title: 'A clean, healthcare-centric layout', body: 'Minimal screens and intuitive navigation keep medical information calm and readable.' },
      { title: 'Reminders and consultant profiles up front', body: 'Real-time reminders and detailed consultant profiles help patients and doctors stay on schedule and choose with confidence.' },
      { title: 'Responsive UI for medical workflows', body: 'Booking, ordering and payment steps are designed around how labs and patients actually move through a visit.' },
    ],
    decisionVisual: SL.single,
    screens: [SL.trio, SL.three, SL.flat, SL.pair, SL.grid, SL.stone],
    links: [{ label: 'Behance project', href: 'https://www.behance.net/gallery/239867063/SoundLab-Care-Lab-Consulting-Doctor-Appointment-App', kind: 'case-study' }],
  },

  {
    slug: 'x-money',
    title: 'X Money',
    tagline: 'Onboarding, QR payments, wallet recharge and a financial dashboard.',
    category: 'Fintech Application',
    summary: 'A fintech app for digital payments, transfers and deposits — onboarding, QR payments, wallet recharge and a dashboard, built on one component system.',
    status: 'published',
    composition: 'mobile',
    brand: { accent: '#C59BFF', onAccent: '#1A0B2B', surface: '#130E1B' },
    cover: XM.qr,
    heroScreens: [XM.splash, XM.c],
    role: 'UI/UX design',
    tools: ['Figma', 'Framer', 'Illustrator', 'Photoshop'],
    sectors: ['Fintech'],
    platforms: ['Mobile app'],
    scope: ['Onboarding', 'Account creation', 'QR payments', 'Wallet recharge', 'Dashboard', 'UI component system'],
    intro: [
      'X Money is a fintech application designed to make digital payments, transfers, deposits and crypto transactions simple and secure.',
      'The project covers a complete UI/UX design system: onboarding, login flows, QR-based payments, wallet recharge, the user dashboard and profile management.',
    ],
    problem: 'Financial products depend on trust. The goal was a seamless experience for a global fintech audience — simple, modern, and clear enough for fast decisions.',
    features: [
      'Splash screen',
      'Login and sign-up flows',
      'Multi-step account creation',
      'Dashboard with financial stats',
      'Recharge and withdrawal screens',
      'Google verification process',
      'Complete UI component system',
    ],
    decisions: [
      { title: 'A soft pastel gradient theme', body: 'Paired with minimal typography to create a soft, user-friendly interface for a category that can feel intimidating.' },
      { title: 'Clarity for fast decisions', body: 'Every screen was designed for clarity and smooth navigation — important when people are moving money.' },
      { title: 'One component system across flows', body: 'A complete UI component system keeps onboarding, payments and the dashboard consistent.' },
    ],
    decisionVisual: XM.c,
    screens: [XM.qr, XM.splash, XM.a, XM.b, XM.c, XM.d, XM.qr2],
    links: [{ label: 'Behance project', href: 'https://www.behance.net/gallery/239651625/X-Money-Modern-Fintech-App-UIUX-Design', kind: 'case-study' }],
  },

  {
    slug: 'ucl-energy',
    title: 'UCL Energy',
    tagline: 'A corporate website redesign for an energy, shipping and offshore group.',
    category: 'Corporate Website',
    summary: 'A corporate website redesign for an international energy, shipping and offshore group — built to communicate trust and guide visitors to an inquiry.',
    status: 'published',
    composition: 'website',
    brand: { accent: '#D6A64A', onAccent: '#1A1203', surface: '#0B1828' },
    cover: UCL.home,
    heroScreens: [UCL.pages],
    role: 'Lead UI/UX Designer',
    tools: ['Figma', 'Photoshop', 'Illustrator'],
    sectors: ['Energy', 'Offshore', 'Maritime', 'Shipping'],
    platforms: ['Responsive website'],
    scope: ['Information architecture', 'User flows', 'Wireframes', 'Responsive interfaces', 'Developer-ready Figma components'],
    intro: [
      'UCL Energy Group operates internationally, providing commercial solutions across the energy, shipping, offshore and industrial sectors.',
      "The objective was to redesign the company's digital presence into a modern corporate experience that reflects professionalism, global capability and operational excellence — communicating trust instantly while helping visitors find services, company information and regional offices.",
    ],
    problem: [
      'The energy sector is highly competitive and relationship-driven. Potential clients arrive with high expectations across every part of the experience.',
      'The previous experience lacked a modern enterprise feel and did not guide users toward meaningful engagement. The challenge was to turn complex corporate information into something clean, trustworthy and effortless to navigate.',
    ],
    constraints: ['Corporate credibility', 'Global presence', 'Technical expertise', 'Easy navigation', 'Professional communication', 'High-quality visual presentation'],
    goals: [
      'Create an enterprise-grade website experience',
      'Improve content hierarchy',
      'Strengthen brand perception',
      'Increase trust with international clients',
      'Highlight global operations',
      'Simplify navigation',
      'Create responsive layouts',
      'Support future scalability',
    ],
    ia: ['Homepage', 'About', 'Services', 'Global Offices', 'Projects', 'Contact'],
    flow: ['Landing', 'Understand company', 'Explore services', 'Learn global presence', 'Build trust', 'Contact team', 'Generate business inquiry'],
    decisions: [
      { title: 'Clear navigation', body: 'Simple top navigation improves discoverability across all pages and keeps users oriented.' },
      { title: 'Enterprise hero section', body: 'Large typography communicates authority immediately, so visitors know within seconds they are dealing with a serious global operator.' },
      { title: 'Structured content blocks', body: 'Long information is broken into digestible sections; each block serves one clear purpose.' },
      { title: 'Regional office presentation', body: 'Showing the international offices strengthens credibility and makes contact information easier to find.' },
      { title: 'Simplified contact experience', body: 'Regional info, hours and a clean inquiry form reduce friction and encourage engagement.' },
    ],
    decisionVisual: UCL.home,
    screens: [UCL.home, UCL.pages, UCL.ia, UCL.system, UCL.overview, UCL.title, UCL.board],
    outcomeSummary: {
      text: "An enterprise-level digital experience aligned with UCL Energy's international presence and professional identity, with an interface that emphasises clarity, trust and usability.",
      source: 'As described in the published Behance case study — qualitative, not a measured business result.',
    },
    links: [
      { label: 'Live website', href: 'https://ucl-uk.com/', kind: 'live' },
      { label: 'Behance case study', href: 'https://www.behance.net/gallery/253253561/Live-Project-Showcase-UCL-Energy-Website-Case-study', kind: 'case-study' },
    ],
  },
]

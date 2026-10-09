/**
 * Personal + professional details. Source of truth: Waqar_Basit_Senior_UI_UX_Designer_Resume.pdf
 * Edit here; every page reads from this file.
 */
import type { Visual } from './types'
import { placeholder } from './types'

export const site = {
  name: 'Waqar Basit',
  role: 'Senior UI/UX & Product Designer',
  focus: ['SaaS', 'Web applications', 'Dashboards', 'Mobile apps', 'Design systems'],
  location: 'Lahore, Pakistan · working remotely',
  email: 'waqarbasit7865@gmail.com',
  /** WhatsApp, supplied by Waqar in international format (+92 307 298 7657). wa.me needs digits only. */
  whatsapp: { display: '+92 307 298 7657', href: 'https://wa.me/923072987657' },
  resume: '/Waqar_Basit_Resume.pdf',

  /** Shown in <title> and meta description of the homepage */
  seo: {
    title: 'Waqar Basit — UI/UX & Product Designer for SaaS and Web Applications',
    description:
      'UI/UX & Product Designer for SaaS and web applications: user flows, information architecture, wireframes, interactive prototypes, polished interfaces, design systems and developer handoff.',
  },

  /**
   * Five-scene scroll intro (order matters: it is the page order). Each headline array item is one masked line;
   * wrap a word in *asterisks* for the serif-italic accent. `tags` are short factual capability lists from the resume.
   */
  hero: {
    label: 'Waqar Basit · UI/UX & Product Designer for SaaS and Web Applications',
    scenes: [
      {
        id: 'intro',
        name: 'Introduction',
        headline: ['Complex ideas.', '*Clear* experiences.'],
        sub: 'I design SaaS and web applications — from user flows and wireframes to interactive prototypes, polished interfaces, design systems and developer handoff.',
      },
      {
        id: 'ai',
        name: 'AI-assisted, human-led',
        headline: ['AI-assisted exploration.', '*Human-led* design.'],
        sub: 'AI widens the first round of ideas. I choose the direction, refine it and decide what ships.',
        tags: ['Interface alternatives', 'UX-copy options', 'Prototype concepts'],
      },
      {
        id: 'product',
        name: 'Product thinking',
        headline: ['From user flow', 'to intuitive *interface.*'],
        tags: ['User flows', 'Information architecture', 'Wireframes', 'Prototypes'],
      },
      {
        id: 'craft',
        name: 'Visual craft',
        headline: ['Precision in every screen.', '*Character* in every detail.'],
        tags: ['Visual hierarchy', 'Design systems', 'Reusable components', 'Responsive UI'],
      },
      {
        id: 'delivery',
        name: 'Ready to build',
        headline: ['One system.', 'Every *screen.*'],
        tags: ['Responsive design', 'Component libraries', 'Developer handoff'],
      },
    ],
  },

  profile:
    'UI/UX and Product Designer with 5+ years of experience across SaaS platforms, web applications, mobile apps, and e-commerce. I translate product goals into user flows, wireframes, interactive prototypes, and developer-ready interfaces, working directly with international clients and development teams.',
  profileSecondary:
    'My focus is complex workflows, reusable design systems, and responsive experiences. My portfolio spans healthcare, fintech, analytics, and AI-powered business tools.',

  /** Portrait for the About section. Replace with { kind: 'image', src, width, height, alt } */
  portrait: placeholder('Portrait photo — vertical, at least 1200×1500', 1200, 1500) as Visual,

  /**
   * Optional handwritten signature. Leave null until you supply a real asset.
   * Best: an SVG exported from your own signature with a single stroked <path> — set `svgPath` to its `d` attribute
   * and `viewBox` to the SVG's viewBox. The component draws the stroke on scroll. Nothing renders while null.
   */
  signature: null as null | { svgPath: string; viewBox: string; strokeWidth?: number },

  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/waqar-basit-607000168/' },
    { label: 'Behance', href: 'https://www.behance.net/waqarbasit' },
    { label: 'Contra', href: 'https://contra.com/waqar_basit_tj4xj2jx' },
    { label: 'Upwork', href: 'https://www.upwork.com/freelancers/~0134cfb88d2b576ba0' },
  ],

  expertise: [
    {
      title: 'Product & UX',
      items: [
        'User flows',
        'Information architecture',
        'Wireframing',
        'Interactive prototyping',
        'Dashboard design',
        'Responsive web & mobile UI',
        'Developer handoff',
      ],
    },
    {
      title: 'Systems & Delivery',
      items: [
        'Design systems',
        'Reusable components',
        'Figma Auto Layout',
        'Visual hierarchy',
        'Stakeholder collaboration',
        'Brand consistency',
      ],
    },
    {
      title: 'Tools',
      items: ['Figma', 'Webflow', 'Framer', 'Adobe Photoshop', 'Adobe Illustrator', 'Cursor', 'Figma AI', 'Midjourney'],
    },
  ],

  experience: [
    {
      role: 'Senior UI/UX Designer',
      company: 'StarPrints Mfg.',
      place: 'Tonawanda, NY, USA · Remote',
      period: 'Mar 2025 — Present',
      summary:
        'Own visual design from concept through production for a US custom apparel brand — online storefront, branded assets and print-ready artwork — refining storefront layouts and the path to purchase.',
    },
    {
      role: 'Senior UI/UX Designer',
      company: 'Upwork · International clients',
      place: 'Remote',
      period: 'Mar 2024 — Present',
      summary:
        'Design SaaS dashboards and web applications, from user flows and wireframes to prototypes and polished interfaces, backed by reusable design systems for consistent developer handoff.',
    },
    {
      role: 'Senior UI/UX Designer',
      company: 'SHAHPER Media',
      place: 'United Kingdom · Remote',
      period: 'Nov 2024 — Dec 2025',
      summary:
        'Designed website layouts, landing pages and interface components around usability, content hierarchy and campaign goals, partnering with marketing and content teams.',
    },
    {
      role: 'Junior UI/UX Designer',
      company: 'Lucky Star Investment SICAV SA',
      place: 'UAE · Remote',
      period: 'Sep 2023 — Oct 2024',
      summary: 'Delivered branding and digital marketing design aligned with campaign objectives.',
    },
    {
      role: 'Junior UI/UX Designer',
      company: 'GetFirstDigital',
      place: 'United Arab Emirates',
      period: 'May 2022 — Jul 2023',
      summary: 'Managed design execution for branding and digital marketing projects across visual touchpoints.',
    },
    {
      role: 'Senior Graphic Designer',
      company: '360 Advertising Company',
      place: 'Dubai, UAE',
      period: 'Dec 2020 — Mar 2022',
      summary: 'Created digital and print advertising assets across campaign formats.',
    },
    {
      role: 'UI/UX Designer',
      company: 'XS4 Financial Management',
      place: 'Lahore, Pakistan',
      period: 'Aug 2017 — Dec 2019',
      summary: 'Designed marketing and corporate visual materials across digital and print channels.',
    },
  ],

  education: [
    { title: 'BS, Graphic Design — Focus in UI/UX', place: 'University of the Punjab', period: '2016 — 2020' },
    { title: 'Diploma, Graphic Design', place: 'EVS Institute, Lahore', period: '2015 — 2016' },
    { title: 'Diploma of Education, Graphic Design', place: 'Al-Syed Institute, Faqirwali', period: '2015' },
  ],

  /** Process steps for the "Approach" section — all capabilities listed on the resume */
  approach: [
    {
      title: 'Map the workflow',
      tab: 'Map the workflow',
      body: 'User flows and information architecture first, so complex products have a clear structure before any pixels.',
      tools: ['Figma', 'Claude', 'ChatGPT'],
    },
    {
      title: 'Shape it in low fidelity',
      tab: 'Shape in low fidelity',
      body: 'Wireframes to test hierarchy and layout decisions quickly with clients and development teams.',
      tools: ['Figma', 'Figma AI'],
    },
    {
      title: 'Prototype the interaction',
      tab: 'Prototype the interaction',
      body: 'Interactive prototypes that make the product tangible and surface edge cases early.',
      tools: ['Figma', 'Framer'],
    },
    {
      title: 'Systemise',
      tab: 'Systemise',
      body: 'Reusable components and Auto Layout design systems that keep every screen consistent as the product grows.',
      tools: ['Figma', 'Auto Layout', 'Variables'],
    },
    {
      title: 'Hand off cleanly',
      tab: 'Hand off cleanly',
      body: 'Developer-ready, responsive specs and components — designed to be built, not just presented.',
      tools: ['Figma Dev Mode', 'Webflow', 'Cursor'],
    },
  ],
}

export type Site = typeof site

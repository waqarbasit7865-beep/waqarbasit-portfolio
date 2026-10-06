import { useRef } from 'react'
import { site } from '../content/site'
import { SplitWords } from '../components/SplitWords'
import { Media } from '../components/Media'
import { Signature } from '../components/Signature'
import { SHOW_DRAFTS, showVisual } from '../lib/content'
import { gsap, MOTION_OK, PLAY_ONCE } from '../lib/gsap'
import { useIsoLayoutEffect } from '../lib/hooks'

export function About() {
  const root = useRef<HTMLElement>(null)

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.matchMedia().add(MOTION_OK, () => {
        // Portrait: tall mask opens from the centre, image settles with parallax
        const tl = gsap.timeline({ scrollTrigger: { trigger: '.about__portrait', start: 'top 80%', toggleActions: PLAY_ONCE } })
        tl.from('.about__portrait-mask', { clipPath: 'inset(50% 0% 50% 0% round 999px 999px 0 0)', duration: 1.5, ease: 'power4.inOut' })
          .from('.about__portrait-mask > *', { scale: 1.35, duration: 1.8, ease: 'expo.out' }, 0.1)
          .from('.about__portrait-cap', { y: 20, autoAlpha: 0, duration: 0.8 }, 0.9)
        gsap.to('.about__portrait-mask > *', {
          yPercent: -8,
          ease: 'none',
          scrollTrigger: { trigger: '.about__portrait', start: 'top bottom', end: 'bottom top', scrub: true },
        })

        gsap.from('.about__statement .wi', {
          yPercent: 110,
          stagger: 0.025,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.about__statement', start: 'top 82%', toggleActions: PLAY_ONCE },
        })
        gsap.from('.about__body p', {
          y: 30,
          autoAlpha: 0,
          stagger: 0.12,
          scrollTrigger: { trigger: '.about__body', start: 'top 85%', toggleActions: PLAY_ONCE },
        })
        gsap.utils.toArray<HTMLElement>('.xp').forEach((row) => {
          const t = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 90%', toggleActions: PLAY_ONCE } })
          t.from(row.querySelector('.xp__rule'), { scaleX: 0, transformOrigin: 'left', duration: 1, ease: 'power4.inOut' })
            .from(row.querySelectorAll('.xp__cell'), { yPercent: 60, autoAlpha: 0, stagger: 0.06, duration: 0.8, ease: 'expo.out' }, 0.15)
        })
        gsap.from('.skills__col', {
          y: 40,
          autoAlpha: 0,
          stagger: 0.12,
          scrollTrigger: { trigger: '.skills', start: 'top 85%', toggleActions: PLAY_ONCE },
        })
        gsap.from('.skills li', {
          scale: 0.85,
          autoAlpha: 0,
          stagger: 0.015,
          duration: 0.5,
          scrollTrigger: { trigger: '.skills', start: 'top 80%', toggleActions: PLAY_ONCE },
        })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const portraitVisible = showVisual(site.portrait)

  return (
    <section ref={root} id="about" tabIndex={-1} className="about section" aria-labelledby="about-title">
      <div className="container">
        <div className="about__top">
          <div className="about__label">
            <p className="eyebrow">
              <span className="tick" aria-hidden="true" /> About
            </p>
            <h2 id="about-title" className="about__name">
              {site.name}
            </h2>
            <p className="about__loc">{site.location}</p>
          </div>

          <figure className="about__portrait">
            <div className="about__portrait-mask">
              {portraitVisible ? (
                <Media visual={site.portrait} sizes="(min-width: 1024px) 30vw, 80vw" />
              ) : (
                <div className="about__monogram" aria-hidden="true">
                  WB
                </div>
              )}
            </div>
            <figcaption className="about__portrait-cap">
              {site.role}
              {SHOW_DRAFTS && site.portrait.kind === 'placeholder' && <span className="dev-note">Portrait needed</span>}
            </figcaption>
          </figure>

          <div className="about__copy">
            <p className="about__statement h-md">
              <SplitWords text={`I turn product goals into *clear*, buildable interfaces — for SaaS, dashboards, fintech, healthcare and AI-powered tools.`} />
            </p>
            <div className="about__body">
              <p>{site.profile}</p>
              <p>{site.profileSecondary}</p>
            </div>
            <Signature />
          </div>
        </div>

        <div className="about__xp">
          <h3 className="about__sub">Experience</h3>
          <ol className="xp-list">
            {site.experience.map((x) => (
              <li className="xp" key={x.company + x.period}>
                <span className="xp__rule" aria-hidden="true" />
                <span className="xp__cell xp__period">{x.period}</span>
                <span className="xp__cell xp__role">
                  <strong>{x.role}</strong>
                  <span className="xp__company">{x.company}</span>
                </span>
                <span className="xp__cell xp__place">{x.place}</span>
                <span className="xp__cell xp__summary">{x.summary}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="skills">
          {site.expertise.map((g) => (
            <div className="skills__col" key={g.title}>
              <h3 className="about__sub">{g.title}</h3>
              <ul>
                {g.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
          <div className="skills__col">
            <h3 className="about__sub">Education</h3>
            <ul className="edu">
              {site.education.map((e) => (
                <li key={e.title}>
                  <strong>{e.title}</strong>
                  <span>
                    {e.place} · {e.period}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

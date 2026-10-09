import { Link } from 'react-router-dom'
import { useDocumentMeta } from '../lib/hooks'
import { site } from '../content/site'

export default function NotFound() {
  useDocumentMeta(`Page not found · ${site.name}`, site.seo.description)
  return (
    <section className="notfound container">
      <p className="eyebrow">
        <span className="tick" aria-hidden="true" /> 404
      </p>
      <h1 className="display">
        Nothing <span className="serif">here.</span>
      </h1>
      <p className="lede">This page doesn't exist or the project isn't published yet.</p>
      <Link className="btn btn--primary" to="/" state={{ scrollTo: 'work' }}>
        See selected work
      </Link>
    </section>
  )
}

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api/index.js'

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
  const intervals = [
    { label: 'year', secs: 31536000 }, { label: 'month', secs: 2592000 },
    { label: 'week', secs: 604800 },   { label: 'day',   secs: 86400 },
    { label: 'hour', secs: 3600 },     { label: 'minute', secs: 60 },
  ]
  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs)
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`
  }
  return 'Just now'
}

function ProjectModal({ project, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey) }
  }, [])

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[300] flex items-center justify-center p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl w-full max-w-[620px] max-h-[90vh] overflow-y-auto relative shadow-[0_24px_64px_rgba(0,0,0,0.2)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/[0.07] border-none flex items-center justify-center cursor-pointer hover:bg-black/10 transition-all z-10 text-sm"
        >✕</button>
        <div className="w-full aspect-[4/3] overflow-hidden rounded-t-xl bg-[var(--bg)]">
          <img src={project.image_url} alt={project.title} className="w-full h-full object-cover"/>
        </div>
        <div className="p-7">
          <span className="text-[0.68rem] font-semibold tracking-[0.15em] uppercase text-[var(--red)] mb-2 block">{project.category_slug}</span>
          <h2 className="font-bebas text-[1.8rem] tracking-[0.03em] text-[var(--text)] mb-3">{project.title}</h2>
          {project.description && <p className="text-[0.9rem] text-[var(--muted)] leading-relaxed mb-2">{project.description}</p>}
          {project.created_at && <p className="text-[0.78rem] text-[var(--muted)] mb-5">Added {timeAgo(project.created_at)}</p>}
          <Link to="/contact" className="inline-block bg-[var(--red)] text-white text-[0.82rem] font-semibold tracking-[0.1em] uppercase px-6 py-3 rounded hover:opacity-90 hover:-translate-y-0.5 transition-all">
            Enquire About This
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Category() {
  const { slug } = useParams()
  const [state, setState]     = useState('loading')  // loading | items | empty | error
  const [category, setCategory] = useState(null)
  const [projects, setProjects] = useState([])
  const [errMsg, setErrMsg]   = useState('')
  const [selected, setSelected] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function load() {
    setState('loading')
    try {
      const data = await api('GET', `/api/category/${slug}`)
      setCategory(data.category)
      setProjects(data.projects || [])
      setState(data.projects?.length ? 'items' : 'empty')
    } catch (err) {
      setErrMsg(err.message)
      setState('error')
    }
  }

  useEffect(() => { load() }, [slug])

  return (
    <>
      {/* Minimal navbar for category page */}
      <nav className={`fixed top-0 left-0 right-0 h-16 z-[200] border-b border-[var(--border)] transition-all ${scrolled ? 'bg-[rgba(245,243,238,0.99)]' : 'bg-[rgba(245,243,238,0.9)] backdrop-blur-sm'}`}>
        <div className="max-w-[1200px] mx-auto px-8 h-full flex items-center justify-between">
          <Link to="/home" className="font-bebas text-[1.4rem] tracking-[0.06em] text-[var(--text)]">
            Nidhi <em className="not-italic text-[var(--red)]">Creation</em>
          </Link>
          <Link to="/contact" className="text-[0.85rem] font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors">Contact</Link>
        </div>
      </nav>

      <main className="pt-16">
        {/* Category header */}
        <div className="max-w-[1200px] mx-auto px-8 pt-10 pb-6">
          <Link to="/home" className="text-[0.82rem] text-[var(--muted)] hover:text-[var(--red)] transition-colors mb-4 inline-block">← All Categories</Link>
          <p className="font-bebas text-[1rem] tracking-[0.08em] text-[var(--muted)] mb-1">
            Nidhi <em className="not-italic text-[var(--red)]">Creation</em>
          </p>
          <h1 className="font-bebas text-[3rem] leading-none tracking-[0.03em] text-[var(--text)] mb-2">
            {category?.name || '…'}
          </h1>
          {category?.description && (
            <p className="text-[0.9rem] text-[var(--muted)] max-w-[600px] leading-relaxed mb-1">{category.description}</p>
          )}
          {state === 'items' && (
            <p className="text-[0.78rem] text-[var(--muted)]">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        <div className="max-w-[1200px] mx-auto px-8 pb-16">

          {/* Loading */}
          {state === 'loading' && (
            <div className="grid grid-cols-3 gap-5 max-md:grid-cols-2 max-sm:grid-cols-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-[var(--border)] rounded-lg overflow-hidden bg-white">
                  <div className="aspect-[4/3] skeleton"/>
                  <div className="p-4">
                    <div className="skeleton h-3 rounded mb-2"/>
                    <div className="skeleton h-3 rounded w-3/5 mb-1"/>
                    <div className="skeleton h-3 rounded w-2/5"/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Items */}
          {state === 'items' && (
            <div className="grid grid-cols-3 gap-5 max-md:grid-cols-2 max-sm:grid-cols-1">
              {projects.map(p => (
                <div
                  key={p.id}
                  className="border border-[var(--border)] rounded-lg overflow-hidden bg-white cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all"
                  onClick={() => setSelected(p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelected(p)}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[var(--bg)]">
                    <img src={p.image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover"/>
                  </div>
                  <div className="p-4">
                    <h3 className="text-[0.95rem] font-semibold text-[var(--text)] mb-1">{p.title}</h3>
                    {p.description && <p className="text-[0.82rem] text-[var(--muted)] mb-1 line-clamp-2">{p.description}</p>}
                    {p.created_at && <p className="text-[0.75rem] text-[var(--muted)]">{timeAgo(p.created_at)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {state === 'empty' && (
            <div className="flex flex-col items-center gap-4 py-24 text-[var(--muted)]">
              <div className="text-5xl opacity-30">◈</div>
              <h3 className="font-bebas text-[1.5rem] tracking-wide">No projects yet</h3>
              <p className="text-[0.875rem]">We're adding work to this category soon. Check back later!</p>
              <Link to="/home" className="mt-2 px-5 py-2 border border-[var(--border)] rounded text-[0.85rem] hover:bg-black/5 transition-all">Go Home</Link>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-4 py-24 text-[var(--muted)]">
              <div className="text-5xl opacity-30 text-[var(--error)]">✕</div>
              <h3 className="font-bebas text-[1.5rem] tracking-wide">Something went wrong</h3>
              <p className="text-[0.875rem]">{errMsg}</p>
              <button onClick={load} className="mt-2 px-5 py-2 border border-[var(--border)] rounded text-[0.85rem] hover:bg-black/5 transition-all">Retry</button>
            </div>
          )}
        </div>
      </main>

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
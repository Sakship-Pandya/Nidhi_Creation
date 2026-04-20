import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api/index.js'
import logo from '../assets/logo.png'

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
  const intervals = [
    { label: 'year', secs: 31536000 }, { label: 'month', secs: 2592000 },
    { label: 'week', secs: 604800 }, { label: 'day', secs: 86400 },
    { label: 'hour', secs: 3600 }, { label: 'minute', secs: 60 },
  ]
  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs)
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`
  }
  return 'Just now'
}

function ProjectModal({ project, onClose }) {
  const [images, setImages] = useState(
    project.cover_url ? [{ url: project.cover_url }] : []
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [contactPhone, setContactPhone] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrentIndex(i => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setCurrentIndex(i => (i - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose, images.length])

  useEffect(() => {
    api('GET', `/api/project/${project.id}/images`)
      .then(d => {
        if (d.images && d.images.length > 0) setImages(d.images)
      })
      .catch(console.error)

    api('GET', '/api/contact')
      .then(d => {
        if (d.contact && d.contact.phone) {
          setContactPhone(d.contact.phone.replace(/\D/g, ''))
        }
      })
      .catch(console.error)
  }, [project.id])

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[300] flex items-center justify-center p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl w-full max-w-[620px] max-h-[90vh] overflow-y-auto relative shadow-[0_24px_64px_rgba(0,0,0,0.2)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-white border-none flex items-center justify-center cursor-pointer hover:bg-[var(--red)] transition-all z-20 text-lg"
        >
          ✕
        </button>

        {images.length > 0 ? (
          <div className="w-full aspect-[4/3] relative overflow-hidden rounded-t-xl bg-[var(--bg)] group">
            <img src={images[currentIndex].url} alt={project.title} className="w-full h-full object-cover" />

            {images.length > 1 && (
              <>
                <button onClick={() => setCurrentIndex(i => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--red)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button onClick={() => setCurrentIndex(i => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--red)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, idx) => (
                    <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-[var(--red)] scale-125' : 'bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full aspect-[4/3] rounded-t-xl bg-[var(--bg)] flex items-center justify-center text-5xl text-[var(--muted)] opacity-30">◈</div>
        )}

        <div className="p-7">
          <span className="text-[0.68rem] font-semibold tracking-[0.15em] uppercase text-[var(--red)] mb-2 block">
            {(project.categories || []).join(' / ')}
          </span>
          <h2 className="font-bebas text-[1.8rem] tracking-[0.03em] text-[var(--text)] mb-3">{project.title}</h2>
          {project.description && <p className="text-[0.9rem] text-[var(--muted)] leading-relaxed mb-2">{project.description}</p>}
          {project.created_at && <p className="text-[0.78rem] text-[var(--muted)] mb-5">Added {timeAgo(project.created_at)}</p>}
          <a
            href={`https://wa.me/${contactPhone || '919876543210'}?text=${encodeURIComponent(`Hello! I am interested in your project: "${project.title}" and would like to know more.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[var(--red)] text-white text-[0.82rem] font-semibold tracking-[0.1em] uppercase px-6 py-3 rounded hover:opacity-90 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Enquire About This
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Category() {
  const { slug } = useParams()
  const [state, setState] = useState('loading')  // loading | items | empty | error
  const [category, setCategory] = useState(null)
  const [projects, setProjects] = useState([])
  const [errMsg, setErrMsg] = useState('')
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
      <nav className={`fixed top-0 left-0 right-0 h-16 z-[200] border-b transition-all ${scrolled ? 'bg-[var(--brand-green)] border-white/10' : 'bg-[var(--brand-green)] backdrop-blur-sm border-white/5'}`}>
        <div className="max-w-[1200px] mx-auto px-8 h-full flex items-center justify-between">
          <Link to="/home" className="flex items-center">
            <img
              src={logo}
              alt="Niddhi Creation"
              className="h-16 w-32 object-contain" 
              style={{ transform: 'scaleX(1.15)', transformOrigin: 'left' }}
            />
          </Link>
        </div>
      </nav>

      <main className="pt-16">
        {/* Category header */}
        <div className="max-w-[1200px] mx-auto px-8 pt-10 pb-6">
          <Link to="/home" className="text-[0.82rem] text-[var(--muted)] hover:text-[var(--red)] transition-colors mb-4 inline-block">← All Categories</Link>
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
            <div className="grid grid-cols-3 gap-5 max-md:grid-cols-2 max-sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-[var(--border)] rounded-lg overflow-hidden bg-white">
                  <div className="aspect-[4/3] skeleton" />
                  <div className="p-4">
                    <div className="skeleton h-3 rounded mb-2" />
                    <div className="skeleton h-3 rounded w-3/5 mb-1" />
                    <div className="skeleton h-3 rounded w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Items */}
          {state === 'items' && (
            <div className="grid grid-cols-3 gap-5 max-md:grid-cols-2 max-sm:grid-cols-2">
              {projects.map(p => (
                <div
                  key={p.id}
                  className="border border-[var(--border)] rounded-lg overflow-hidden bg-white cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all group"
                  onClick={() => setSelected(p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setSelected(p)}
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-[var(--bg)]">
                    <img src={p.cover_url} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
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
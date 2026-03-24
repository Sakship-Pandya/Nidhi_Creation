import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../api/index.js'

function ProjectModal({ project, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[300] flex items-center justify-center p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl w-full max-w-[620px] max-h-[90vh] overflow-y-auto relative shadow-[0_24px_64px_rgba(0,0,0,0.2)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/[0.07] border-none flex items-center justify-center cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all z-10 text-sm"
        >
          
        </button>

        {project.image_url ? (
          <div className="w-full aspect-[4/3] overflow-hidden rounded-t-xl bg-[var(--bg)]">
            <img src={project.image_url} alt={project.title} className="w-full h-full object-cover"/>
          </div>
        ) : (
          <div className="w-full aspect-[4/3] rounded-t-xl bg-[var(--bg)] flex items-center justify-center text-5xl text-[var(--muted)] opacity-30">◈</div>
        )}

        <div className="p-7">
          <span className="text-[0.68rem] font-semibold tracking-[0.15em] uppercase text-[var(--red)] mb-2 block">
            {project.category_slug}
          </span>
          <h2 className="font-bebas text-[1.8rem] tracking-[0.03em] text-[var(--text)] mb-3">
            {project.title}
          </h2>
          {project.description && (
            <p className="text-[0.9rem] text-[var(--muted)] leading-relaxed mb-5">{project.description}</p>
          )}
          <Link
            to="/contact"
            className="inline-block bg-[var(--red)] text-white text-[0.82rem] font-semibold tracking-[0.1em] uppercase px-6 py-3 rounded hover:opacity-90 hover:-translate-y-0.5 transition-all"
            onClick={onClose}
          >
            Enquire About This
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api('GET', '/api/recent-projects')
      .then(d => setProjects(d.projects || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />

      {/* Page content pushed below fixed navbar */}
      <div style={{ paddingTop: 64 }}>

        {/* Past Works section */}
        <section className="max-w-[1200px] mx-auto px-6 py-16" id="works">

          <div className="flex items-center justify-between mb-10">
            <h2 className="font-bebas text-[2.5rem] tracking-[0.04em] text-[var(--text)]">
              Past Works
            </h2> 
          </div>

          <div className="grid grid-cols-3 gap-5 md:grid-cols-3 sm:grid-cols-2 grid-cols-1">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-[var(--border)] rounded-md overflow-hidden bg-white">
                    <div className="aspect-[4/3] animate-pulse bg-[#e8e4de]"/>
                    <div className="p-4 flex flex-col gap-2">
                      <div className="h-3 rounded bg-[#e8e4de] animate-pulse"/>
                      <div className="h-3 rounded bg-[#e8e4de] animate-pulse w-3/5"/>
                    </div>
                  </div>
                ))
              : projects.length === 0
                ? (
                  <p className="col-span-3 text-center text-[var(--muted)] py-20 text-[0.9rem]">
                    No projects yet — check back soon!
                  </p>
                )
                : projects.map(p => (
                    <div
                      key={p.id}
                      id={`card-${p.id}`}
                      className="border border-[var(--border)] rounded-md overflow-hidden bg-white cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)] transition-all"
                      onClick={() => setSelected(p)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setSelected(p)}
                      aria-label={`View details for ${p.title}`}
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-[var(--bg)] flex items-center justify-center">
                        {p.image_url
                          ? <img src={p.image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"/>
                          : <span className="text-4xl text-[var(--muted)] opacity-30">◈</span>
                        }
                      </div>
                      <div className="p-4 border-t border-[var(--border)]">
                        <h4 className="text-[0.9rem] font-semibold text-[var(--text)] mb-1">{p.title}</h4>
                        <span className="text-[0.72rem] text-[var(--red)] tracking-[0.08em] uppercase">{p.category_slug}</span>
                      </div>
                    </div>
                  ))
            }
          </div>

        </section>

        <footer className="text-center py-6 border-t border-[var(--border)] text-[0.78rem] text-[var(--muted)] bg-white">
          © 2025 Nidhi Creation, Ahmedabad.
        </footer>

      </div>

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../api/index.js'

const SLIDES = [
  { tag: 'Neon Signs',        title: 'Glow in Every\nDirection',       slug: 'neon',   bg: '#fef9f0', demo: 'OPEN',   demoClass: 'font-bebas text-[clamp(4rem,10vw,9rem)] tracking-[0.2em] text-[var(--red)] [text-shadow:0_0_16px_rgba(192,57,43,0.25)] animate-[neonPulse_2.5s_ease-in-out_infinite]' },
  { tag: '3D Letter Signs',   title: 'Bold. Raised.\nUnforgettable.',   slug: '3d',     bg: '#f0f4fe', demo: '3D',    demoClass: 'font-bebas text-[clamp(5rem,12vw,11rem)] tracking-[0.15em] text-[var(--blue)] [text-shadow:4px_4px_0_rgba(41,128,185,0.3)]' },
  { tag: 'LED Display Boards',title: 'Dynamic Signs\nThat Move',        slug: 'led',    bg: '#f0faf4', demo: '◈ LED ◈', demoClass: 'font-mono text-[clamp(1.2rem,3vw,2.2rem)] tracking-[0.3em] text-[var(--green)] animate-[neonPulse_3s_ease-in-out_infinite]' },
  { tag: 'Metal Signs',       title: 'Steel. Brass.\nPrecision Cut.',   slug: 'metal',  bg: '#f4f4f4', demo: '⬟',     demoClass: 'text-[clamp(5rem,12vw,11rem)] text-[#888]' },
]

function Carousel() {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)
  const total = SLIDES.length

  const goTo = (idx) => {
    setCurrent((idx + total) % total)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % total), 4000)
  }

  useEffect(() => {
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % total), 4000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Swipe
  const startX = useRef(0)
  const onPointerDown = (e) => { startX.current = e.clientX }
  const onPointerUp   = (e) => {
    const diff = startX.current - e.clientX
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1)
  }

  return (
    <section className="relative overflow-hidden" style={{ marginTop: 64, height: 'calc(100vh - 64px)' }}>
      <div
        className="flex h-full transition-transform duration-[550ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-full h-full grid grid-cols-2 items-center px-[6vw] gap-12"
            style={{ background: s.bg }}
          >
            <div>
              <p className="text-[0.72rem] font-medium tracking-[0.25em] uppercase text-[var(--red)] mb-4">{s.tag}</p>
              <h2 className="font-bebas text-[clamp(3rem,6vw,6rem)] leading-none tracking-[0.02em] text-[var(--text)] mb-8 whitespace-pre-line">{s.title}</h2>
              <Link to={`/category/${s.slug}`} className="inline-block bg-[var(--red)] text-white text-[0.8rem] font-semibold tracking-[0.15em] uppercase px-8 py-3 rounded-sm hover:opacity-90 hover:-translate-y-0.5 transition-all">
                Explore
              </Link>
            </div>
            <div className="flex items-center justify-center">
              <div className={demoClass(s)}>{s.demo}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => goTo(current - 1)} className="carousel-btn absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/[0.06] border border-[var(--border)] text-[var(--text)] hover:bg-black/10 transition-all z-10">←</button>
      <button onClick={() => goTo(current + 1)} className="carousel-btn absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/[0.06] border border-[var(--border)] text-[var(--text)] hover:bg-black/10 transition-all z-10">→</button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full border-none transition-all cursor-pointer ${i === current ? 'bg-[var(--red)] scale-125' : 'bg-black/20'}`}
          />
        ))}
      </div>
    </section>
  )
}

// Helper outside render to avoid JSX issues
function demoClass(s) { return s.demoClass }

function ProjectModal({ project, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[300] flex items-center justify-center p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl w-full max-w-[620px] max-h-[90vh] overflow-y-auto relative shadow-[0_24px_64px_rgba(0,0,0,0.2)]">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/[0.07] border-none flex items-center justify-center cursor-pointer hover:bg-black/10 transition-all z-10 text-sm">✕</button>
        <div className="w-full aspect-[4/3] overflow-hidden rounded-t-xl bg-[var(--bg)]">
          <img src={project.image_url} alt={project.title} className="w-full h-full object-cover"/>
        </div>
        <div className="p-7">
          <span className="text-[0.68rem] font-semibold tracking-[0.15em] uppercase text-[var(--red)] mb-2 block">{project.category_slug}</span>
          <h2 className="font-bebas text-[1.8rem] tracking-[0.03em] text-[var(--text)] mb-3">{project.title}</h2>
          {project.description && <p className="text-[0.9rem] text-[var(--muted)] leading-relaxed mb-5">{project.description}</p>}
          <Link to="/contact" className="inline-block bg-[var(--red)] text-white text-[0.82rem] font-semibold tracking-[0.1em] uppercase px-6 py-3 rounded hover:opacity-90 hover:-translate-y-0.5 transition-all">
            Enquire About This
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [projects, setProjects]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState(null)

  useEffect(() => {
    api('GET', '/api/recent-projects')
      .then(d => setProjects(d.projects || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <Carousel />

      {/* Past Works */}
      <section className="max-w-[1200px] mx-auto px-8 py-20" id="works">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-bebas text-[2.5rem] tracking-[0.04em] text-[var(--text)]">Past Works</h2>
        </div>

        <div className="grid grid-cols-3 gap-5 max-md:grid-cols-2 max-sm:grid-cols-1">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-[var(--border)] rounded-md overflow-hidden bg-white">
                  <div className="aspect-[4/3] skeleton"/>
                  <div className="p-4">
                    <div className="skeleton h-3 rounded mb-2"/>
                    <div className="skeleton h-3 rounded w-3/5"/>
                  </div>
                </div>
              ))
            : projects.length === 0
              ? <p className="col-span-3 text-center text-[var(--muted)] py-16">No projects yet.</p>
              : projects.map(p => (
                  <div
                    key={p.id}
                    className="border border-[var(--border)] rounded-md overflow-hidden bg-white cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all"
                    onClick={() => setSelected(p)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelected(p)}
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-[var(--bg)]">
                      <img src={p.image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover"/>
                    </div>
                    <div className="p-4 border-t border-[var(--border)]">
                      <h4 className="text-[0.9rem] font-semibold text-[var(--text)] mb-1">{p.title}</h4>
                      <span className="text-[0.72rem] text-[var(--red)] tracking-[0.08em]">{p.category_slug}</span>
                    </div>
                  </div>
                ))
          }
        </div>
      </section>

      <footer className="text-center py-6 border-t border-[var(--border)] text-[0.78rem] text-[var(--muted)] bg-white">
        © 2025 Nidhi Creation, Ahmedabad.
      </footer>

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
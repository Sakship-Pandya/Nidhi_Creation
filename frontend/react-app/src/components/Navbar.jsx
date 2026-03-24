import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const dropRef = useRef(null)
  const hoverTimer = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await api('GET', '/api/categories')
        setCategories(data.categories || [])
      } catch (err) {
        console.error('Failed to fetch categories', err)
      }
    }

    fetchCategories()
  }, [])

  // Close desktop dropdown on outside click
  useEffect(() => {
    const close = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  // Close on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) { setMenuOpen(false); setDropOpen(false) } }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const closeAll = () => { setMenuOpen(false); setDropOpen(false) }

  return (
    <>
      <nav className={`
        fixed top-0 left-0 right-0 h-16 z-[200]
        border-b border-[var(--border)] transition-all duration-300
        ${scrolled ? 'bg-[rgba(245,243,238,0.99)] shadow-sm' : 'bg-[rgba(245,243,238,0.90)] backdrop-blur-[14px]'}
      `}>
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">

          {/* Brand */}
          <Link to="/" className="font-bebas text-[1.4rem] tracking-[0.06em] text-[var(--text)]" onClick={closeAll}>
            Nidhi <em className="not-italic text-[var(--red)]">Creation</em>
          </Link>

          {/* Desktop — categories dropdown only */}
          <div className="hidden md:block relative" ref={dropRef}
            onMouseEnter={() => { clearTimeout(hoverTimer.current); setDropOpen(true) }}
            onMouseLeave={() => { hoverTimer.current = setTimeout(() => setDropOpen(false), 150) }}
          >
            <button
              className="flex items-center gap-1 text-[0.85rem] font-medium text-[var(--muted)] px-3 py-2 rounded hover:text-[var(--text)] hover:bg-black/5 transition-all bg-transparent border-none cursor-pointer"
              onClick={() => setDropOpen(d => !d)}
              aria-expanded={dropOpen}
              aria-haspopup="true"
            >
              Categories
              <span className={`text-base leading-none transition-transform duration-200 inline-block ${dropOpen ? 'rotate-180' : ''}`}>⌄</span>
            </button>

            {dropOpen && (
              <ul className="absolute top-[calc(100%+6px)] right-0 min-w-[200px] bg-white border border-[var(--border)] rounded-lg list-none py-2 shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50">
                {categories.map(c => (
                  <li key={c.slug}>
                    <Link
                      to={`/category/${c.slug}`}
                      className="block text-[0.84rem] text-[var(--muted)] px-4 py-2 hover:text-[var(--red)] hover:bg-black/[0.03] transition-all"
                      onClick={() => setDropOpen(false)}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mobile — hamburger only */}
          <button
            className="md:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-2"
            onClick={() => setMenuOpen(m => !m)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className={`block w-[22px] h-[2px] bg-[var(--text)] rounded transition-all duration-[250ms] ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block w-[22px] h-[2px] bg-[var(--text)] rounded transition-all duration-[250ms] ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block w-[22px] h-[2px] bg-[var(--text)] rounded transition-all duration-[250ms] ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>

        </div>
      </nav>

      {/* Mobile off-canvas — flat category list only */}
      {menuOpen && (
        <div className="fixed top-16 left-0 right-0 z-[199] bg-[rgba(245,243,238,0.99)] border-b border-[var(--border)] shadow-[0_8px_16px_rgba(0,0,0,0.06)] md:hidden overflow-y-auto max-h-[calc(100vh-64px)]">
          <ul className="list-none flex flex-col px-6 py-3">
            {categories.map(c => (
              <li key={c.slug}>
                <Link
                  to={`/category/${c.slug}`}
                  className="block text-[0.9rem] text-[var(--muted)] py-3 border-b border-[var(--border)] hover:text-[var(--red)] transition-colors"
                  onClick={closeAll}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
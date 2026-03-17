import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { slug: 'neon',    name: 'Neon Signs' },
  { slug: '3d',      name: '3D Letter Signs' },
  { slug: 'led',     name: 'LED Display Boards' },
  { slug: 'flex',    name: 'Flex & Vinyl Boards' },
  { slug: 'acrylic', name: 'Acrylic Signage' },
  { slug: 'metal',   name: 'Metal Signs' },
  { slug: 'wooden',  name: 'Wooden Boards' },
  { slug: 'glow',    name: 'Glow Signboards' },
]

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [dropOpen,    setDropOpen]    = useState(false)
  const dropRef   = useRef(null)
  const hoverTimer = useRef(null)
  const navigate  = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const close = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 h-16 z-[200] border-b border-[var(--border)] transition-all duration-300 ${scrolled ? 'bg-[rgba(245,243,238,0.99)]' : 'bg-[rgba(245,243,238,0.9)] backdrop-blur-[14px)]'}`}>
      <div className="max-w-[1200px] mx-auto px-8 h-full flex items-center gap-8">

        {/* Brand */}
        <Link to="/home" className="font-bebas text-[1.4rem] tracking-[0.06em] text-[var(--text)] flex-shrink-0">
          Nidhi <em className="not-italic text-[var(--red)]">Creation</em>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1 list-none ml-auto">
          <li>
            <a href="#works" className="text-[0.85rem] font-medium text-[var(--muted)] px-3 py-2 rounded hover:text-[var(--text)] hover:bg-black/5 transition-all">
              Our Work
            </a>
          </li>

          {/* Categories dropdown */}
          <li
            className="relative"
            ref={dropRef}
            onMouseEnter={() => { clearTimeout(hoverTimer.current); setDropOpen(true) }}
            onMouseLeave={() => { hoverTimer.current = setTimeout(() => setDropOpen(false), 150) }}
          >
            <button
              className="flex items-center gap-1 text-[0.85rem] font-medium text-[var(--muted)] px-3 py-2 rounded hover:text-[var(--text)] hover:bg-black/5 transition-all bg-transparent border-none cursor-pointer font-dm"
              onClick={() => setDropOpen(d => !d)}
            >
              Categories
              <span className={`text-base transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`}>⌄</span>
            </button>

            {dropOpen && (
              <ul className="absolute top-[calc(100%+6px)] right-0 min-w-[200px] bg-white border border-[var(--border)] rounded-lg list-none py-2 shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50">
                {CATEGORIES.map(c => (
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
          </li>

          <li>
            <Link to="/contact" className="text-[0.85rem] font-medium text-[var(--muted)] px-3 py-2 rounded hover:text-[var(--text)] hover:bg-black/5 transition-all">
              Contact
            </Link>
          </li>
        </ul>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-2 ml-auto"
          onClick={() => setMenuOpen(m => !m)}
          aria-label="Toggle menu"
        >
          <span className={`block w-[22px] h-[2px] bg-[var(--text)] rounded transition-all ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`}/>
          <span className={`block w-[22px] h-[2px] bg-[var(--text)] rounded transition-all ${menuOpen ? 'opacity-0' : ''}`}/>
          <span className={`block w-[22px] h-[2px] bg-[var(--text)] rounded transition-all ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`}/>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[rgba(245,243,238,0.99)] border-b border-[var(--border)] px-6 pb-4">
          <ul className="list-none flex flex-col gap-1">
            <li><a href="#works" className="block text-[0.85rem] font-medium text-[var(--muted)] py-2" onClick={() => setMenuOpen(false)}>Our Work</a></li>
            {CATEGORIES.map(c => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`} className="block text-[0.84rem] text-[var(--muted)] py-2 pl-2" onClick={() => setMenuOpen(false)}>
                  {c.name}
                </Link>
              </li>
            ))}
            <li><Link to="/contact" className="block text-[0.85rem] font-medium text-[var(--muted)] py-2" onClick={() => setMenuOpen(false)}>Contact</Link></li>
          </ul>
        </div>
      )}
    </nav>
  )
}
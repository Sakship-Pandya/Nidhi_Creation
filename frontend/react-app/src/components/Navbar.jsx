import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const dropRef = useRef(null)
  const hoverTimer = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

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

  useEffect(() => {
    const close = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false)
        setDropOpen(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const closeAll = () => {
    setMenuOpen(false)
    setDropOpen(false)
  }

  function scrollToContact(e) {
    e.preventDefault()
    closeAll()
    // If we're already on the home page, just scroll
    if (location.pathname === '/' || location.pathname === '/home') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      // Navigate home first, then scroll after render
      navigate('/')
      setTimeout(() => {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }

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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">

            {/* Categories ONLY wrapper */}
            <div
              className="relative"
              ref={dropRef}
              onMouseEnter={() => {
                clearTimeout(hoverTimer.current)
                setDropOpen(true)
              }}
              onMouseLeave={() => {
                hoverTimer.current = setTimeout(() => setDropOpen(false), 150)
              }}
            >
              {/* Categories */}
              <button
                className="flex items-center gap-1 text-[0.85rem] font-medium text-[var(--muted)] px-3 py-2 rounded hover:text-[var(--text)] hover:bg-black/5 transition-all bg-transparent border-none cursor-pointer"
                onClick={() => setDropOpen(d => !d)}
                aria-expanded={dropOpen}
              >
                Categories
                <span className={`text-base transition-transform ${dropOpen ? 'rotate-180' : ''}`}>⌄</span>
              </button>

              {/* Dropdown */}
              {dropOpen && (
                <ul className="absolute top-[calc(100%+6px)] right-0 min-w-[200px] bg-white border border-[var(--border)] rounded-lg py-2 shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50">
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

            {/* Contact — scrolls to #contact section */}
            <a
              href="#contact"
              onClick={scrollToContact}
              className="text-[0.85rem] font-medium text-[var(--muted)] px-3 py-2 rounded hover:text-[var(--text)] hover:bg-black/5 transition-all cursor-pointer"
            >
              Contact Us
            </a>

          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-2"
            onClick={() => setMenuOpen(m => !m)}
            aria-label="Toggle menu"
          >
            <span className={`block w-[22px] h-[2px] bg-[var(--text)] ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block w-[22px] h-[2px] bg-[var(--text)] ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-[22px] h-[2px] bg-[var(--text)] ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>

        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed top-16 left-0 right-0 z-[199] bg-[rgba(245,243,238,0.99)] border-b border-[var(--border)] shadow md:hidden">
          <ul className="flex flex-col px-6 py-3">
            {categories.map(c => (
              <li key={c.slug}>
                <Link
                  to={`/category/${c.slug}`}
                  className="block text-[0.9rem] text-[var(--muted)] py-3 border-b border-[var(--border)] hover:text-[var(--red)]"
                  onClick={closeAll}
                >
                  {c.name}
                </Link>
              </li>
            ))}

            {/* Contact in mobile */}
            <li>
              <a
                href="#contact"
                onClick={scrollToContact}
                className="block text-[0.9rem] text-[var(--muted)] py-3 hover:text-[var(--red)] cursor-pointer"
              >
                Contact Us
              </a>
            </li>
          </ul>
        </div>
      )}
    </>
  )
}
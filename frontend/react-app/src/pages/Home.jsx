import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../api/index.js'
import OptimizedImage from '../components/OptimizedImage'
import logo from '../assets/logo.png'
import tagline from '../assets/tagline.png'

function Lightbox({ url, onClose }) {
  const [zoom, setZoom] = useState(1)
  
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }
    window.addEventListener('keydown', handleEsc, true)
    return () => window.removeEventListener('keydown', handleEsc, true)
  }, [onClose])

  const handleZoom = (e) => {
    e.stopPropagation()
    setZoom(prev => prev === 1 ? 2.5 : 1)
  }

  return (
    <div 
      className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex items-center justify-center cursor-zoom-out select-none animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button 
        className="absolute top-6 right-6 text-white bg-white/10 hover:bg-[var(--red)] p-3 rounded-full border-none cursor-pointer z-[1001] transition-all flex items-center justify-center"
        onClick={onClose}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      
      <div 
        className={`relative transition-transform duration-300 ease-out cursor-${zoom === 1 ? 'zoom-in' : 'zoom-out'} max-w-[95vw] max-h-[95vh] flex items-center justify-center`}
        style={{ transform: `scale(${zoom})` }}
        onClick={handleZoom}
      >
        <OptimizedImage 
          baseUrl={url} 
          alt="Full size" 
          className="max-w-full max-h-[95vh] object-contain shadow-2xl rounded-sm"
          sizes="100vw"
          style={{ pointerEvents: 'none' }}
        />
      </div>
    </div>
  )
}

function ProjectModal({ project, onClose }) {
  const [images, setImages] = useState(
    project.cover_url ? [{ url: project.cover_url }] : []
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [contactPhone, setContactPhone] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') {
        // If lightbox is open, it handles its own ESC, but let's be safe
        onClose()
      }
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

    // Fetch contact info for WhatsApp number
    api('GET', '/api/contact')
      .then(d => {
        if (d.contact && d.contact.phone) {
          // Keep only digits for WhatsApp link
          setContactPhone(d.contact.phone.replace(/\D/g, ''))
        }
      })
      .catch(console.error)
  }, [project.id])

  function handleEnquire() {
    const phoneNumber = contactPhone || '919876543210' // fallback if none set
    const text = encodeURIComponent(`Hello! I am interested in your project: "${project.title}" and would like to know more.`)
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank')
  }

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
          <div 
            className="w-full aspect-[4/3] relative overflow-hidden rounded-t-xl bg-[var(--bg)] group cursor-zoom-in"
            onClick={() => setLightboxUrl(images[currentIndex].url)}
          >
            <OptimizedImage 
              baseUrl={images[currentIndex].url} 
              alt={project.title} 
              className="w-full h-full object-cover" 
              sizes="(max-width: 768px) 100vw, 620px"
            />

            {images.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => (i - 1 + images.length) % images.length); }} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-[var(--red)] z-10 border-none cursor-pointer"
                  aria-label="Previous image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => (i + 1) % images.length); }} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-[var(--red)] z-10 border-none cursor-pointer"
                  aria-label="Next image"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                      className={`w-2 h-2 rounded-full transition-all border-none p-0 cursor-pointer ${idx === currentIndex ? 'bg-[var(--red)] scale-125' : 'bg-white/60 hover:bg-white'}`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
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
          <h2 className="font-bebas text-[1.8rem] tracking-[0.03em] text-[var(--text)] mb-3">
            {project.title}
          </h2>
          
          {(project.review_rating || project.review_text) && (
            <div className="bg-[#f9f8f6] p-4 rounded-lg mb-5 border-l-4 border-[var(--red)]">
              {project.review_rating > 0 && (
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < project.review_rating ? "#f1c40f" : "#e8e4de"}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              )}
              {project.review_text && (
                <p className="text-[0.85rem] text-[var(--text)] italic leading-relaxed">
                  "{project.review_text}"
                </p>
              )}
            </div>
          )}

          {project.description && (
            <p className="text-[0.9rem] text-[var(--muted)] leading-relaxed mb-5">{project.description}</p>
          )}
          <button
            onClick={handleEnquire}
            className="inline-block bg-[var(--red)] text-white text-[0.82rem] font-semibold tracking-[0.1em] uppercase px-6 py-3 rounded hover:opacity-90 hover:-translate-y-0.5 transition-all border-none cursor-pointer"
          >
            Enquire About This
          </button>
        </div>
      </div>
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  )
}

function ReviewsSection() {
  const [reviews, setReviews] = useState([])
  const [index, setIndex] = useState(0)
  const [contactPhone, setContactPhone] = useState('')

  useEffect(() => {
    api('GET', '/api/project-reviews')
      .then(d => setReviews(d.projects || []))
      .catch(console.error)

    // Fetch contact info for WhatsApp number
    api('GET', '/api/contact')
      .then(d => {
        if (d.contact && d.contact.phone) {
          setContactPhone(d.contact.phone.replace(/\D/g, ''))
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (reviews.length <= 1) return
    const t = setInterval(() => {
      setIndex(i => (i + 1) % reviews.length)
    }, 6000)
    return () => clearInterval(t)
  }, [reviews.length])

  if (reviews.length === 0) return null

  const cur = reviews[index]

  const handleEnquire = (title) => {
    const phoneNumber = contactPhone || '919876543210'
    const text = encodeURIComponent(`Hello! I saw the review for your project: "${title}" and would like to know more.`)
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank')
  }

  const Stars = ({ count }) => (
    <div className="flex gap-1 mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < count ? "#f1c40f" : "#e8e4de"} className="transition-colors">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )

  return (
    <section id="reviews" className="bg-[var(--bg)] border-t border-[var(--border)] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="font-bebas text-[1.1rem] tracking-[0.1em] text-[var(--muted)] block mb-2 uppercase">Client Appreciation</span>
          <h2 className="font-bebas text-[2.2rem] md:text-[3rem] leading-none tracking-[0.04em] text-[var(--text)]">Customer Reviews</h2>
        </div>

        <div className="relative h-[650px] sm:h-[600px] md:h-[450px]">
          {reviews.map((rev, i) => (
            <div
              key={rev.id}
              className={`absolute inset-0 flex items-center transition-all duration-1000 ${i === index ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-12 z-0 pointer-events-none'}`}
            >
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">

                {/* Review Content */}
                <div className="bg-white p-8 md:p-12 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.06)] relative border border-[var(--border)] order-2 md:order-1">
                  <div className="absolute top-[-15px] left-8 text-[var(--red)] opacity-10 text-8xl font-serif select-none pointer-events-none">“</div>
                  <Stars count={rev.review_rating} />
                  <p className="text-[1.1rem] md:text-[1.25rem] text-[var(--text)] italic leading-relaxed mb-8 font-dm relative z-10">
                    {rev.review_text}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="h-px w-8 bg-[var(--red)]" />
                    <div>
                      <span className="font-bebas text-[1.3rem] tracking-[0.05em] text-[var(--text)] block leading-none">
                        {rev.title}
                      </span>
                      <span className="text-[0.65rem] font-bold tracking-[0.15em] uppercase text-[var(--muted)] mt-1 block">Project Completed</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEnquire(rev.title)}
                    className="mt-6 flex items-center gap-2 bg-[var(--text)] text-white text-[0.72rem] font-bold tracking-[0.15em] uppercase px-5 py-2.5 rounded-sm hover:bg-[var(--red)] transition-all cursor-pointer border-none"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z" /></svg>
                    Enquire About This
                  </button>
                </div>

                {/* Project Image View */}
                <div className="aspect-video md:aspect-square lg:aspect-[4/3] w-full max-w-[400px] mx-auto md:max-w-none rounded-2xl overflow-hidden shadow-2xl relative order-1 md:order-2">
                  <OptimizedImage 
                    baseUrl={rev.cover_url} 
                    alt={rev.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase text-white/60">Featured Project</span>
                      <span className="text-white text-[0.9rem] font-medium tracking-[0.05em]">{rev.title}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Carousel indicators */}
        {reviews.length > 1 && (
          <div className="flex justify-center gap-3 mt-12">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 transition-all rounded-full border-none cursor-pointer ${i === index ? 'w-8 bg-[var(--red)] focus:ring-0' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ContactSection() {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    api('GET', '/api/contact')
      .then(d => setInfo(d.contact || {}))
      .catch(console.error)
  }, [])

  const InfoItem = ({ icon, label, children }) => (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[rgba(192,57,43,0.08)] flex items-center justify-center text-[var(--red)]">
        {icon}
      </div>
      <div className="flex flex-col gap-1 pt-1">
        <span className="text-[0.68rem] font-semibold tracking-[0.15em] uppercase text-[var(--muted)]">{label}</span>
        {children}
      </div>
    </div>
  )

  return (
    <section id="contact" className="border-t border-[var(--border)] bg-white">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="mb-10">
          <h2 className="font-bebas text-[2.5rem] leading-none tracking-[0.04em] text-[var(--text)] mt-1 mb-2">Contact Us</h2>
          <p className="text-[0.92rem] text-[var(--muted)]">Get in touch — we'll get back to you within 24 hours.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Info card */}
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-8">
            <h3 className="font-bebas text-[1.5rem] tracking-[0.04em] text-[var(--text)] mb-6">Our Details</h3>

            <div className="flex flex-col gap-5">
              <InfoItem label="Phone" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" /></svg>}>
                <a href={`tel:${info?.phone || ''}`} className="text-[0.9rem] text-[var(--text)] hover:text-[var(--red)] transition-colors">
                  {info?.phone || '+91 98765 43210'}
                </a>
              </InfoItem>

              <InfoItem label="Email" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}>
                <a href={`mailto:${info?.email || ''}`} className="text-[0.9rem] text-[var(--text)] hover:text-[var(--red)] transition-colors">
                  {info?.email || 'info@nidhicreation.in'}
                </a>
              </InfoItem>

              <InfoItem label="Address" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>}>
                <span className="text-[0.9rem] text-[var(--text)] leading-relaxed">
                  {info?.address || '123, Signboard Market, Ahmedabad, Gujarat — 380001'}
                </span>
              </InfoItem>

              <InfoItem label="Working Hours" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}>
                <span className="text-[0.9rem] text-[var(--text)]">
                  {info?.working_hours || 'Mon – Sat: 9:00 AM – 7:00 PM'}
                </span>
              </InfoItem>
            </div>
          </div>

          {/* Map */}
          <div className="w-full min-h-[300px] rounded-xl overflow-hidden border border-[var(--border)]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d235013.68396480644!2d72.43955645!3d23.0204978!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fcedd11614f6516!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block', minHeight: 300 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Our Location"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroCarousel({ projects, onSelect }) {
  const [index, setIndex] = useState(0)

  // Pick up to 5 random projects with cover images to form the carousel
  // We compute this once so it doesn't shuffle on every render
  const [carouselItems] = useState(() => {
    const withImages = projects.filter(p => p.cover_url)
    const shuffled = [...withImages].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 5)
  })

  useEffect(() => {
    if (carouselItems.length <= 1) return
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % carouselItems.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [carouselItems.length])

  if (!carouselItems || carouselItems.length === 0) return null

  const current = carouselItems[index]

  return (
    <div className="w-full h-[50vh] min-h-[350px] max-h-[500px] relative overflow-hidden bg-[var(--bg)] group">
      {/* Images Background */}
      {carouselItems.map((p, i) => (
        <div
          key={p.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <OptimizedImage 
            baseUrl={p.cover_url} 
            alt={p.title} 
            className="w-full h-full object-cover" 
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end pb-10 px-8 max-w-[1200px] mx-auto pointer-events-none">
        <h2 className="font-bebas text-[3rem] md:text-[4rem] leading-none tracking-[0.02em] text-white mb-2 drop-shadow-lg">
          {current.title}
        </h2>
        <span className="text-[0.85rem] text-white/80 font-medium tracking-[0.05em] uppercase mb-6">
          {(current.categories || []).join(' / ')}
        </span>
        <button
          onClick={() => onSelect(current)}
          className="pointer-events-auto self-start bg-white text-[var(--text)] text-[0.82rem] font-bold tracking-[0.1em] uppercase px-8 py-3 rounded-sm hover:-translate-y-1 hover:shadow-xl transition-all"
        >
          View Details
        </button>
      </div>

      {/* Controls */}
      {carouselItems.length > 1 && (
        <>
          <button
            onClick={() => setIndex(i => (i - 1 + carouselItems.length) % carouselItems.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 backdrop-blur text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--red)] border-none cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button
            onClick={() => setIndex(i => (i + 1) % carouselItems.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 backdrop-blur text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--red)] border-none cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {carouselItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-12 h-1 rounded-full transition-all border-none p-0 cursor-pointer ${i === index ? 'bg-[var(--red)]' : 'bg-white/40 hover:bg-white/60'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function Home() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
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

        {/* Hero Carousel */}
        {!loading && projects.length > 0 && (
          <HeroCarousel projects={projects} onSelect={setSelected} />
        )}

        {/* Past Works section */}
        <section className="max-w-[1200px] mx-auto px-6 py-16" id="works">

          <div className="flex items-center justify-between mb-10">
            <h2 className="font-bebas text-[2.5rem] tracking-[0.04em] text-[var(--text)]">
              Past Works
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-[var(--border)] rounded-md overflow-hidden bg-white">
                  <div className="aspect-[4/3] animate-pulse bg-[#e8e4de]" />
                  <div className="p-4 flex flex-col gap-2">
                    <div className="h-3 rounded bg-[#e8e4de] animate-pulse" />
                    <div className="h-3 rounded bg-[#e8e4de] animate-pulse w-3/5" />
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
                    className="border border-[var(--border)] rounded-md overflow-hidden bg-white cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)] transition-all group"
                    onClick={() => setSelected(p)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelected(p)}
                    aria-label={`View details for ${p.title}`}
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-[var(--bg)] flex items-center justify-center">
                      {p.cover_url
                        ? <OptimizedImage 
                            baseUrl={p.cover_url} 
                            alt={p.title} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px"
                          />
                        : <span className="text-4xl text-[var(--muted)] opacity-30">◈</span>
                      }
                    </div>
                    <div className="p-4 border-t border-[var(--border)]">
                      <h4 className="text-[0.9rem] font-semibold text-[var(--text)] mb-1">{p.title}</h4>
                      <span className="text-[0.72rem] text-[var(--red)] tracking-[0.08em] uppercase">{(p.categories || []).join(' / ')}</span>
                    </div>
                  </div>
                ))
            }
          </div>

        </section>

        {/* Reviews Section */}
        <ReviewsSection />

        {/* Contact Section (embedded) */}
        <ContactSection />

        <footer className="text-center py-6 border-t border-[var(--border)] text-[0.78rem] text-[var(--muted)] bg-white">
          © 2025 Nidhi Creation, Ahmedabad.
        </footer>

      </div>

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { api } from '../api/index.js'

export default function Contact() {
  const [info, setInfo] = useState(null)

  useEffect(() => {
    api('GET', '/api/contact')
      .then(d => setInfo(d.contact || {}))
      .catch(console.error)
  }, [])

  const InfoItem = ({ icon, label, children }) => (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#f0f4f8] flex items-center justify-center text-[var(--blue)]">
        {icon}
      </div>
      <div className="flex flex-col gap-1 pt-1">
        <span className="text-[0.68rem] font-semibold tracking-[0.15em] uppercase text-[var(--muted)]">{label}</span>
        {children}
      </div>
    </div>
  )

  return (
    <>
      <Navbar />
      <div className="max-w-[1100px] mx-auto px-6 py-12" style={{ marginTop: 64 }}>

        {/* Header */}
        <div className="mb-10">
          <span className="font-bebas text-[1.1rem] tracking-[0.08em] text-[var(--muted)]">
            Nidhi <em className="not-italic text-[var(--red)]">Creation</em>
          </span>
          <h1 className="font-bebas text-[3rem] leading-none tracking-[0.04em] text-[var(--text)] mt-1 mb-2">Contact Us</h1>
          <p className="text-[0.92rem] text-[var(--muted)]">Get in touch — we'll get back to you within 24 hours.</p>
        </div>

        {/* Info card */}
        <div className="bg-white border border-[var(--border)] rounded-xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.05)] max-w-[520px]">
          <h2 className="font-bebas text-[1.5rem] tracking-[0.04em] text-[var(--text)] mb-6">Our Details</h2>

          <div className="flex flex-col gap-5 mb-7">
            <InfoItem label="Phone" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>}>
              <a href={`tel:${info?.phone || ''}`} className="text-[0.9rem] text-[var(--text)] hover:text-[var(--red)] transition-colors">
                {info?.phone || '+91 98765 43210'}
              </a>
            </InfoItem>

            <InfoItem label="Email" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}>
              <a href={`mailto:${info?.email || ''}`} className="text-[0.9rem] text-[var(--text)] hover:text-[var(--red)] transition-colors">
                {info?.email || 'info@nidhicreation.in'}
              </a>
            </InfoItem>

            <InfoItem label="Address" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}>
              <span className="text-[0.9rem] text-[var(--text)] leading-relaxed">
                {info?.address || '123, Signboard Market, Ahmedabad, Gujarat — 380001'}
              </span>
            </InfoItem>

            <InfoItem label="Working Hours" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}>
              <span className="text-[0.9rem] text-[var(--text)]">
                {info?.working_hours || 'Mon – Sat: 9:00 AM – 7:00 PM'}
              </span>
            </InfoItem>
          </div>

          {/* Map */}
          <div className="w-full h-[200px] rounded-lg overflow-hidden border border-[var(--border)]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d235013.68396480644!2d72.43955645!3d23.0204978!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fcedd11614f6516!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Our Location"
            />
          </div>
        </div>
      </div>
    </>
  )
}
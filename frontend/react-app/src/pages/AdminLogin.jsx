import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/index.js'
import logo from '../assets/logo.png'
import tagline from '../assets/tagline.png'

export default function AdminLogin() {
  const navigate = useNavigate()

  const [form, setForm]       = useState({ username: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [note, setNote]       = useState({ msg: '', success: false })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockout, setLockout]   = useState(0)   // seconds remaining
  const lockTimer = useRef(null)

  const MAX_ATTEMPTS = 3
  const LOCKOUT_SECS = 30

  function startLockout() {
    let remaining = LOCKOUT_SECS
    setLockout(remaining)
    lockTimer.current = setInterval(() => {
      remaining--
      setLockout(remaining)
      if (remaining <= 0) {
        clearInterval(lockTimer.current)
        setAttempts(0)
        setNote({ msg: '', success: false })
      }
    }, 1000)
  }

  function validate() {
    const e = {}
    if (!form.username.trim()) e.username = 'Username is required.'
    if (!form.password)        e.password = 'Password is required.'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (lockout > 0) return
    setNote({ msg: '', success: false })

    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    try {
      console.log('Sending:', form)
      await api('POST', '/api/admin/login', form)
      setNote({ msg: 'Access granted. Redirecting…', success: true })
      setTimeout(() => navigate('/admin/dashboard'), 800)
    } catch (err) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setForm(f => ({ ...f, password: '' }))

      if (newAttempts >= MAX_ATTEMPTS) {
        setNote({ msg: 'Too many failed attempts. Locked for 30 seconds.' })
        startLockout()
      } else {
        const left = MAX_ATTEMPTS - newAttempts
        setNote({ msg: `Incorrect credentials. ${left} attempt${left > 1 ? 's' : ''} remaining.` })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="bg-[var(--brand-green)] rounded-xl border-t-[3px] border-t-[var(--red)] border border-[rgba(0,0,0,0.1)] shadow-[0_4px_24px_rgba(0,0,0,0.07)] px-10 py-10">

          <div className="text-center mb-6">
            <div className="flex flex-col items-center gap-1">
              {/* <div className="flex items-center gap-2"> */}
                <img 
                  src={logo} 
                  alt="Niddhi Creation" 
                  className="h-28 w-48 pe-4 pt-4 center object-contain" 
                  style={{ transform: 'scaleX(1.15)', transformOrigin: 'left' }}
                />
                <img 
                  src={tagline} 
                  alt="Tagline" 
                  className="h-10 w-auto object-contain mt-[-10px] mb-4" 
                />
              {/* </div> */}
            </div>
          </div>

          <hr className="border-[var(--border)] mb-7"/>

          <form onSubmit={handleSubmit} noValidate>

            {/* Username */}
            <div className="mb-4">
              <label className="nc-label block mb-1">Username</label>
              <input
                type="text"
                className={`nc-input${errors.username ? ' invalid' : ''}`}
                placeholder="Admin username"
                autoComplete="username"
                value={form.username}
                onChange={e => { setForm(f => ({...f, username: e.target.value})); setErrors(er => ({...er, username: ''})) }}
              />
              {errors.username && <p className="nc-error mt-1">{errors.username}</p>}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="nc-label block mb-1">Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`nc-input pr-10${errors.password ? ' invalid' : ''}`}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => { setForm(f => ({...f, password: e.target.value})); setErrors(er => ({...er, password: ''})) }}
                />
                <button
                  type="button"
                  className="absolute right-3 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                  onClick={() => setShowPass(s => !s)}
                  aria-label="Toggle password"
                >
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="nc-error mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="nc-btn mt-2"
              disabled={loading || lockout > 0}
            >
              {lockout > 0 ? `Try again in ${lockout}s` : loading ? 'Verifying…' : 'Verify & Enter'}
            </button>

            {note.msg && (
              <p className={`text-center text-[0.78rem] mt-3 ${note.success ? 'text-[var(--green)]' : 'text-[var(--error)]'}`}>
                {note.msg}
              </p>
            )}
          </form>

        </div>
      </div>
    </div>
  )
}
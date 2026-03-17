import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/index.js'

export default function Login() {
  const navigate = useNavigate()

  const [form, setForm]     = useState({ name: '', phone: '', business: '' })
  const [errors, setErrors] = useState({})
  const [note, setNote]     = useState({ msg: '', success: false })
  const [loading, setLoading] = useState(false)

  function validate() {
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Please enter your full name.'
    if (!/^\+?[6-9]\d{9}$/.test(form.phone.replace(/\s+/g, '')))
      e.phone = 'Enter a valid 10-digit mobile number.'
    if (!form.business.trim() || form.business.trim().length < 2)
      e.business = 'Please enter your business name.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setNote({ msg: '', success: false })

    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    setLoading(true)
    try {
      await api('POST', '/login', form)
      setNote({ msg: 'Logged in! Redirecting…', success: true })
      setTimeout(() => navigate('/home'), 800)
    } catch (err) {
      setNote({ msg: err.message || 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const field = (key, label, type = 'text', placeholder = '', extra = {}) => (
    <div className="mb-4">
      <label className="nc-label block mb-1">{label}</label>
      <input
        type={type}
        className={`nc-input${errors[key] ? ' invalid' : ''}`}
        placeholder={placeholder}
        value={form[key]}
        onChange={e => {
          setForm(f => ({ ...f, [key]: e.target.value }))
          setErrors(er => ({ ...er, [key]: '' }))
        }}
        {...extra}
      />
      {errors[key] && <p className="nc-error mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.1)] shadow-[0_4px_24px_rgba(0,0,0,0.07)] px-10 py-10">

          {/* Brand */}
          <div className="text-center mb-6">
            <span className="font-bebas text-[2rem] tracking-[0.06em] text-[var(--text)]">
              Nidhi <em className="not-italic text-[var(--red)]">Creation</em>
            </span>
            <p className="text-[0.75rem] text-[var(--muted)] tracking-[0.08em] mt-1">
              Signboard Specialists, Ahmedabad
            </p>
          </div>

          <hr className="border-[var(--border)] mb-7"/>

          <h1 className="font-bebas text-[1.6rem] tracking-[0.04em] text-[var(--text)] mb-1">Welcome</h1>
          <p className="text-[0.82rem] text-[var(--muted)] mb-7">Enter your details to continue</p>

          <form onSubmit={handleSubmit} noValidate>
            {field('name',     'Your Name',     'text', 'enter full name',     { autoComplete: 'name' })}
            {field('phone',    'Phone Number',  'tel',  'enter mobile number', { autoComplete: 'tel', maxLength: 15 })}
            {field('business', 'Business Name', 'text', 'enter business name', { autoComplete: 'organization' })}

            <button type="submit" className="nc-btn mt-2" disabled={loading}>
              {loading ? 'Please wait…' : 'Continue'}
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
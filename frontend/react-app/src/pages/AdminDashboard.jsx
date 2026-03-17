import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/index.js'

/* ════════════════════════════
   SHARED HELPERS
════════════════════════════ */
const CATEGORY_LABELS = {
  neon: 'Neon Signs', '3d': '3D Letter Signs', led: 'LED Display Boards',
  flex: 'Flex & Vinyl', acrylic: 'Acrylic Signage', metal: 'Metal Signs',
  wooden: 'Wooden Boards', glow: 'Glow Signboards',
}

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([slug, name]) => ({ slug, name }))

function Badge({ visible }) {
  return (
    <span className={`inline-block px-2 py-[0.2rem] rounded-full text-[0.72rem] font-semibold tracking-[0.06em] ${visible ? 'bg-[rgba(39,174,96,0.12)] text-[#27ae60]' : 'bg-black/[0.07] text-[var(--muted)]'}`}>
      {visible ? 'Visible' : 'Hidden'}
    </span>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-block w-10 h-6 cursor-pointer flex-shrink-0">
      <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className={`block w-full h-full rounded-full transition-colors duration-200 ${checked ? 'bg-[#27ae60]' : 'bg-gray-300'}`}/>
      <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`}/>
    </label>
  )
}

function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[500] flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl w-full max-w-[560px] max-h-[90vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-bebas text-[1.4rem] tracking-[0.04em] text-[var(--text)]">{title}</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)] transition-colors bg-transparent border-none cursor-pointer p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

function ConfirmModal({ open, message, onConfirm, onClose, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="Confirm Delete"
      footer={<>
        <button onClick={onClose} className="px-4 py-2 rounded border border-[var(--border)] text-[var(--muted)] text-[0.84rem] font-medium hover:bg-black/[0.04] transition-all">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="px-4 py-2 rounded bg-[var(--error)] text-white text-[0.84rem] font-semibold hover:bg-[#c0392b] transition-all disabled:opacity-60">
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </>}
    >
      <p className="text-[0.9rem] text-[var(--text)]">{message}</p>
    </Modal>
  )
}

function NcInput({ label, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 mb-4 ${className}`}>
      {label && <label className="text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-[var(--muted)]">{label}</label>}
      <input className={`nc-input${error ? ' invalid' : ''}`} {...props} />
      {error && <p className="text-[0.72rem] text-[var(--error)]">{error}</p>}
    </div>
  )
}

function NcTextarea({ label, error, rows = 3, ...props }) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      {label && <label className="text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-[var(--muted)]">{label}</label>}
      <textarea
        rows={rows}
        className={`nc-input resize-y${error ? ' invalid' : ''}`}
        {...props}
      />
      {error && <p className="text-[0.72rem] text-[var(--error)]">{error}</p>}
    </div>
  )
}

/* ════════════════════════════
   IMAGE UPLOAD ZONE
════════════════════════════ */
function ImageUpload({ preview, onFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (file && file.type.startsWith('image/')) onFile(file)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg min-h-[130px] flex items-center justify-center cursor-pointer transition-all overflow-hidden ${dragging ? 'border-[var(--red)] bg-[rgba(192,57,43,0.03)]' : 'border-[var(--border)] bg-[var(--bg)]'} hover:border-[var(--red)]`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
      {preview
        ? <img src={preview} alt="Preview" className="w-full max-h-[200px] object-contain p-2"/>
        : (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <p className="text-[0.875rem] text-[var(--muted)]">Click to upload or drag & drop</p>
            <span className="text-[0.75rem] text-[#bbb5ad]">PNG, JPG up to 5MB</span>
          </div>
        )
      }
    </div>
  )
}

/* ════════════════════════════
   TABLE WRAPPER
════════════════════════════ */
function Table({ headers, children, empty }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
      <table className="w-full border-collapse text-[0.875rem]">
        <thead>
          <tr className="bg-[var(--bg)] border-b border-[var(--border)]">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-[var(--muted)] whitespace-nowrap" style={h.style}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children || (
          <tr>
            <td colSpan={headers.length} className="text-center text-[var(--muted)] py-10 text-[0.875rem]" dangerouslySetInnerHTML={{ __html: empty || 'No data.' }} />
          </tr>
        )}</tbody>
      </table>
    </div>
  )
}

function ActionBtn({ danger, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-[0.4rem] rounded border text-[0] transition-all ${danger ? 'border-[var(--border)] text-[var(--muted)] hover:bg-[rgba(231,76,60,0.08)] hover:border-[var(--error)] hover:text-[var(--error)]' : 'border-[var(--border)] text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]'}`}
    >
      {children}
    </button>
  )
}

/* ════════════════════════════
   TOAST
════════════════════════════ */
function Toast({ msg, type, onClear }) {
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(onClear, 3500)
    return () => clearTimeout(t)
  }, [msg])

  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 z-[600] px-5 py-3 rounded-lg shadow-lg text-white text-[0.875rem] font-medium transition-all ${type === 'error' ? 'bg-[var(--error)]' : 'bg-[#27ae60]'}`}>
      {msg}
    </div>
  )
}

/* ════════════════════════════
   PROJECTS SECTION
════════════════════════════ */
function ProjectsSection({ toast }) {
  const [projects, setProjects]   = useState([])
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [visFilter, setVisFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState({ title: '', category_slug: '', description: '', is_visible: true })
  const [errors, setErrors]       = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving]       = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  async function load() {
    try {
      const d = await api('GET', '/api/admin/projects')
      setProjects(d.projects || [])
    } catch (e) { toast(e.message, 'error') }
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditingId(null)
    setForm({ title: '', category_slug: '', description: '', is_visible: true })
    setErrors({})
    setImageFile(null)
    setImagePreview('')
    setModalOpen(true)
  }

  function openEdit(p) {
    setEditingId(p.id)
    setForm({ title: p.title, category_slug: p.category_slug, description: p.description || '', is_visible: p.is_visible })
    setErrors({})
    setImageFile(null)
    setImagePreview(p.image_url || '')
    setModalOpen(true)
  }

  function handleFile(file) {
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }

  function validate() {
    const e = {}
    if (!form.title.trim())        e.title = 'Title is required.'
    if (!form.category_slug)       e.category_slug = 'Please select a category.'
    return e
  }

  async function save() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title',         form.title.trim())
      fd.append('category_slug', form.category_slug)
      fd.append('description',   form.description.trim())
      fd.append('is_visible',    form.is_visible ? 'true' : 'false')
      fd.append('display_order', editingId
        ? String(projects.find(p => p.id === editingId)?.display_order ?? projects.length)
        : String(projects.length))
      if (imageFile) fd.append('image_data', imageFile)

      if (editingId) {
        await api('PUT', `/api/admin/projects/${editingId}`, fd)
        toast('Project updated')
      } else {
        await api('POST', '/api/admin/projects', fd)
        toast('Project added')
      }
      setModalOpen(false)
      load()
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await api('DELETE', `/api/admin/projects/${deleteModal.id}`)
      toast('Project deleted')
      setDeleteModal(null)
      load()
    } catch (e) { toast(e.message, 'error') }
    finally { setDeleting(false) }
  }

  const filtered = projects.filter(p => {
    const ms = !search    || p.title.toLowerCase().includes(search.toLowerCase())
    const mc = !catFilter || p.category_slug === catFilter
    const mv = !visFilter || (visFilter === 'visible' ? p.is_visible : !p.is_visible)
    return ms && mc && mv
  })

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bebas text-[2rem] tracking-[0.04em] text-[var(--text)] leading-none">Projects</h1>
          <p className="text-[0.82rem] text-[var(--muted)] mt-1">Manage all signage projects</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[var(--red)] text-white px-4 py-[0.6rem] rounded-lg text-[0.84rem] font-semibold hover:bg-[var(--red-dark)] hover:-translate-y-px transition-all flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px] max-w-[320px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-[0.6rem] bg-white border border-[var(--border)] rounded-lg text-[0.875rem] text-[var(--text)] outline-none focus:border-[var(--red)] focus:shadow-[0_0_0_3px_rgba(192,57,43,0.08)] transition-all"/>
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-[0.6rem] bg-white border border-[var(--border)] rounded-lg text-[0.875rem] text-[var(--text)] outline-none focus:border-[var(--red)] transition-all">
          <option value="">All Categories</option>
          {CATEGORY_OPTIONS.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={visFilter} onChange={e => setVisFilter(e.target.value)} className="px-3 py-[0.6rem] bg-white border border-[var(--border)] rounded-lg text-[0.875rem] text-[var(--text)] outline-none focus:border-[var(--red)] transition-all">
          <option value="">All Status</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <Table
        headers={[
          { label: 'Order', style: { width: 60 } },
          { label: 'Image', style: { width: 64 } },
          { label: 'Title' },
          { label: 'Category' },
          { label: 'Status', style: { width: 90 } },
          { label: 'Actions', style: { width: 110 } },
        ]}
        empty={projects.length === 0 ? 'No projects yet. Click <strong>Add Project</strong> to get started.' : 'No projects match your filters.'}
      >
        {filtered.length > 0 && filtered.map(p => (
          <tr key={p.id} className="border-b border-[var(--border)] hover:bg-black/[0.015] transition-colors last:border-0">
            <td className="px-4 py-3 text-[var(--muted)] text-[0.82rem]">{p.display_order + 1}</td>
            <td className="px-4 py-3">
              {p.image_url
                ? <img src={p.image_url} alt={p.title} className="w-10 h-10 rounded object-cover bg-[var(--bg)]"/>
                : <div className="w-10 h-10 rounded bg-[var(--bg)] border border-dashed border-[var(--border)] flex items-center justify-center text-[#ccc]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
              }
            </td>
            <td className="px-4 py-3">
              <strong className="text-[var(--text)]">{p.title}</strong>
              {p.description && <><br/><span className="text-[0.78rem] text-[var(--muted)]">{p.description.slice(0,60)}{p.description.length > 60 ? '…' : ''}</span></>}
            </td>
            <td className="px-4 py-3 text-[var(--muted)]">{CATEGORY_LABELS[p.category_slug] || p.category_slug}</td>
            <td className="px-4 py-3"><Badge visible={p.is_visible}/></td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <ActionBtn onClick={() => openEdit(p)} title="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </ActionBtn>
                <ActionBtn danger onClick={() => setDeleteModal(p)} title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                </ActionBtn>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Project' : 'Add Project'}
        footer={<>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded border border-[var(--border)] text-[var(--muted)] text-[0.84rem] font-medium hover:bg-black/[0.04] transition-all">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded bg-[var(--red)] text-white text-[0.84rem] font-semibold hover:bg-[var(--red-dark)] transition-all disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Project'}
          </button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <NcInput label="Project Title" placeholder="e.g. Café Lumière" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} error={errors.title}/>
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-[var(--muted)]">Category</label>
            <select value={form.category_slug} onChange={e => setForm(f => ({...f, category_slug: e.target.value}))} className={`nc-input${errors.category_slug ? ' invalid' : ''}`}>
              <option value="">Select category…</option>
              {CATEGORY_OPTIONS.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
            {errors.category_slug && <p className="text-[0.72rem] text-[var(--error)]">{errors.category_slug}</p>}
          </div>
        </div>
        <NcTextarea label="Description" placeholder="Short description of the project…" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}/>
        <div className="mb-4">
          <label className="text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-[var(--muted)] block mb-1">Project Image</label>
          <ImageUpload preview={imagePreview} onFile={handleFile}/>
        </div>
        <label className="flex items-center justify-between text-[0.875rem] text-[var(--text)] cursor-pointer">
          <span>Visible on site</span>
          <Toggle checked={form.is_visible} onChange={v => setForm(f => ({...f, is_visible: v}))}/>
        </label>
      </Modal>

      <ConfirmModal
        open={!!deleteModal}
        message={`Are you sure you want to delete "${deleteModal?.title}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteModal(null)}
        loading={deleting}
      />
    </div>
  )
}

/* ════════════════════════════
   CATEGORIES SECTION
════════════════════════════ */
function CategoriesSection({ toast }) {
  const [categories, setCategories] = useState([])
  const [modalOpen, setModalOpen]   = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [form, setForm]             = useState({ name: '', slug: '', description: '', is_visible: true })
  const [errors, setErrors]         = useState({})
  const [saving, setSaving]         = useState(false)
  const [deleteModal, setDeleteModal] = useState(null)
  const [deleting, setDeleting]     = useState(false)

  async function load() {
    try {
      const d = await api('GET', '/api/admin/categories')
      setCategories(d.categories || [])
    } catch (e) { toast(e.message, 'error') }
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditingId(null)
    setForm({ name: '', slug: '', description: '', is_visible: true })
    setErrors({})
    setModalOpen(true)
  }

  function openEdit(c) {
    setEditingId(c.id)
    setForm({ name: c.name, slug: c.slug, description: c.description || '', is_visible: c.is_visible })
    setErrors({})
    setModalOpen(true)
  }

  function autoSlug(name) {
    return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    if (!form.slug.trim()) e.slug = 'Slug is required.'
    else if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Only lowercase letters, numbers, and hyphens.'
    return e
  }

  async function save() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      const body = {
        slug: form.slug.trim(), name: form.name.trim(),
        description: form.description.trim(),
        is_visible: form.is_visible ? 'true' : 'false',
        display_order: editingId
          ? String(categories.find(c => c.id === editingId)?.display_order ?? categories.length)
          : String(categories.length),
      }
      if (editingId) {
        await api('PUT', `/api/admin/categories/${editingId}`, body)
        toast('Category updated')
      } else {
        await api('POST', '/api/admin/categories', body)
        toast('Category added')
      }
      setModalOpen(false)
      load()
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await api('DELETE', `/api/admin/categories/${deleteModal.id}`)
      toast('Category deleted')
      setDeleteModal(null)
      load()
    } catch (e) { toast(e.message, 'error') }
    finally { setDeleting(false) }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bebas text-[2rem] tracking-[0.04em] text-[var(--text)] leading-none">Categories</h1>
          <p className="text-[0.82rem] text-[var(--muted)] mt-1">Manage signage categories</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[var(--red)] text-white px-4 py-[0.6rem] rounded-lg text-[0.84rem] font-semibold hover:bg-[var(--red-dark)] hover:-translate-y-px transition-all flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Category
        </button>
      </div>

      <Table
        headers={[
          { label: 'Order', style: { width: 60 } },
          { label: 'Name' },
          { label: 'Slug' },
          { label: 'Description' },
          { label: 'Status', style: { width: 90 } },
          { label: 'Actions', style: { width: 110 } },
        ]}
        empty="No categories yet. Click <strong>Add Category</strong> to get started."
      >
        {categories.length > 0 && categories.map(c => (
          <tr key={c.id} className="border-b border-[var(--border)] hover:bg-black/[0.015] transition-colors last:border-0">
            <td className="px-4 py-3 text-[var(--muted)] text-[0.82rem]">{c.display_order + 1}</td>
            <td className="px-4 py-3"><strong>{c.name}</strong></td>
            <td className="px-4 py-3">
              <code className="text-[0.8rem] bg-[var(--bg)] border border-[var(--border)] px-2 py-[0.15rem] rounded">{c.slug}</code>
            </td>
            <td className="px-4 py-3 text-[0.85rem] text-[var(--muted)]">{c.description ? c.description.slice(0,60) + (c.description.length > 60 ? '…' : '') : '—'}</td>
            <td className="px-4 py-3"><Badge visible={c.is_visible}/></td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <ActionBtn onClick={() => openEdit(c)} title="Edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </ActionBtn>
                <ActionBtn danger onClick={() => setDeleteModal(c)} title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                </ActionBtn>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Category' : 'Add Category'}
        footer={<>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded border border-[var(--border)] text-[var(--muted)] text-[0.84rem] font-medium hover:bg-black/[0.04] transition-all">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded bg-[var(--red)] text-white text-[0.84rem] font-semibold hover:bg-[var(--red-dark)] transition-all disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Category'}
          </button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          <NcInput
            label="Category Name"
            placeholder="e.g. Neon Signs"
            value={form.name}
            onChange={e => {
              const name = e.target.value
              setForm(f => ({ ...f, name, slug: editingId ? f.slug : autoSlug(name) }))
              setErrors(er => ({...er, name: ''}))
            }}
            error={errors.name}
          />
          <NcInput
            label={<>Slug <span className="text-[0.68rem] text-[#bbb5ad] font-normal normal-case tracking-normal">(URL-safe)</span></>}
            placeholder="e.g. neon"
            value={form.slug}
            onChange={e => { setForm(f => ({...f, slug: e.target.value})); setErrors(er => ({...er, slug: ''})) }}
            error={errors.slug}
          />
        </div>
        <NcTextarea label="Description" placeholder="Brief description shown on the category page…" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}/>
        <label className="flex items-center justify-between text-[0.875rem] text-[var(--text)] cursor-pointer">
          <span>Visible on site</span>
          <Toggle checked={form.is_visible} onChange={v => setForm(f => ({...f, is_visible: v}))}/>
        </label>
      </Modal>

      <ConfirmModal
        open={!!deleteModal}
        message={`Are you sure you want to delete "${deleteModal?.name}"? This cannot be undone.`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteModal(null)}
        loading={deleting}
      />
    </div>
  )
}

/* ════════════════════════════
   CONTACT INFO SECTION
════════════════════════════ */
function ContactSection({ toast }) {
  const [form, setForm]   = useState({ phone: '', email: '', address: '', working_hours: '', maps_embed_url: '' })
  const [saving, setSaving] = useState(false)
  const mapDebounce = useRef(null)
  const [mapSrc, setMapSrc] = useState('')

  useEffect(() => {
    api('GET', '/api/admin/contact')
      .then(d => {
        const c = d.contact || {}
        setForm({ phone: c.phone||'', email: c.email||'', address: c.address||'', working_hours: c.working_hours||'', maps_embed_url: c.maps_embed_url||'' })
        if (c.maps_embed_url) setMapSrc(c.maps_embed_url)
      })
      .catch(e => toast(e.message, 'error'))
  }, [])

  function handleMapsInput(val) {
    setForm(f => ({...f, maps_embed_url: val}))
    clearTimeout(mapDebounce.current)
    mapDebounce.current = setTimeout(() => {
      if (val.startsWith('https://www.google.com/maps/embed')) setMapSrc(val)
    }, 800)
  }

  async function save() {
    setSaving(true)
    try {
      await api('POST', '/api/admin/contact', form)
      toast('Contact info saved')
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const inp = (key, label, type = 'text', placeholder = '') => (
    <div className="flex flex-col gap-1 mb-4">
      <label className="text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-[var(--muted)]">{label}</label>
      <input type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} className="nc-input"/>
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-bebas text-[2rem] tracking-[0.04em] text-[var(--text)] leading-none">Contact Info</h1>
        <p className="text-[0.82rem] text-[var(--muted)] mt-1">Update what appears on the Contact page</p>
      </div>

      <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1 items-start">
        {/* Business details */}
        <div className="bg-white border border-[var(--border)] rounded-xl p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h3 className="font-bebas text-[1.2rem] tracking-[0.04em] text-[var(--text)] mb-5">Business Details</h3>
          {inp('phone',         'Phone Number',  'tel',   '+91 98765 43210')}
          {inp('email',         'Email Address', 'email', 'info@nidhicreation.in')}
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-[var(--muted)]">Address</label>
            <textarea rows={3} placeholder="123, Signboard Market, Ahmedabad…" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} className="nc-input resize-y"/>
          </div>
          {inp('working_hours', 'Working Hours', 'text',  'Mon – Sat: 9:00 AM – 7:00 PM')}
        </div>

        {/* Maps embed */}
        <div className="bg-white border border-[var(--border)] rounded-xl p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h3 className="font-bebas text-[1.2rem] tracking-[0.04em] text-[var(--text)] mb-5">Google Maps Embed</h3>
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-[var(--muted)]">Maps Embed URL</label>
            <textarea rows={4} placeholder="Paste the src URL from Google Maps → Share → Embed a map…" value={form.maps_embed_url} onChange={e => handleMapsInput(e.target.value)} className="nc-input resize-y"/>
          </div>
          <p className="text-[0.78rem] text-[var(--muted)] mb-4 leading-relaxed">
            Go to <strong>maps.google.com</strong> → search your location → Share → Embed a map → copy only the <code className="bg-[var(--bg)] border border-[var(--border)] rounded px-1 text-[0.8em]">src="…"</code> URL.
          </p>
          {mapSrc && (
            <div className="w-full h-[180px] rounded-lg overflow-hidden border border-[var(--border)]">
              <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0, display: 'block' }} loading="lazy" title="Map Preview"/>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-[var(--red)] text-white px-5 py-[0.7rem] rounded-lg text-[0.84rem] font-semibold hover:bg-[var(--red-dark)] transition-all disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════
   VISITORS SECTION
════════════════════════════ */
function VisitorsSection({ toast }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const d = await api('GET', `/api/admin/visitors?name=${encodeURIComponent(query)}`)
      setResults(d.visitors || [])
    } catch (e) {
      toast(e.message, 'error')
      setResults([])
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-bebas text-[2rem] tracking-[0.04em] text-[var(--text)] leading-none">Visitors</h1>
        <p className="text-[0.82rem] text-[var(--muted)] mt-1">Search visitor records by name</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-[480px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Type a visitor name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="w-full pl-10 pr-3 py-[0.65rem] bg-white border border-[var(--border)] rounded-lg text-[0.875rem] text-[var(--text)] outline-none focus:border-[var(--red)] focus:shadow-[0_0_0_3px_rgba(192,57,43,0.08)] transition-all"
          />
        </div>
        <button onClick={search} disabled={loading} className="bg-[var(--red)] text-white px-5 py-[0.65rem] rounded-lg text-[0.84rem] font-semibold hover:bg-[var(--red-dark)] transition-all disabled:opacity-60">
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {results === null && (
        <div className="flex flex-col items-center gap-3 py-20 text-[var(--muted)]">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <p className="text-[0.875rem]">Search for a visitor to see their details.</p>
        </div>
      )}

      {results !== null && results.length === 0 && (
        <p className="text-[var(--muted)] text-[0.875rem] text-center py-16">No visitors found matching that name.</p>
      )}

      {results !== null && results.length > 0 && (
        <Table headers={[{ label: 'Name' }, { label: 'Phone' }, { label: 'Business' }, { label: 'Visited At' }]}>
          {results.map(v => (
            <tr key={v.id} className="border-b border-[var(--border)] hover:bg-black/[0.015] last:border-0">
              <td className="px-4 py-3 font-medium">{v.name}</td>
              <td className="px-4 py-3">{v.phone}</td>
              <td className="px-4 py-3">{v.business || '—'}</td>
              <td className="px-4 py-3 text-[0.82rem] text-[var(--muted)]">{v.visited_at || '—'}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}

/* ════════════════════════════
   MAIN DASHBOARD
════════════════════════════ */
const NAV_ITEMS = [
  { key: 'projects',   label: 'Projects',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { key: 'categories', label: 'Categories',   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { key: 'contact',    label: 'Contact Info', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg> },
  { key: 'visitors',   label: 'Visitors',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
]

export default function AdminDashboard() {
  const navigate        = useNavigate()
  const [active, setActive]   = useState('projects')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast]     = useState({ msg: '', type: 'success' })

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
  }

  async function logout() {
    await fetch('/admin/logout', { method: 'POST' })
    navigate('/admin/login')
  }

  const activeLabel = NAV_ITEMS.find(n => n.key === active)?.label || ''

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 w-[220px] bg-[var(--text)] flex flex-col z-[100] transition-transform duration-300 max-[900px]:${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ transform: sidebarOpen || window.innerWidth > 900 ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <div className="px-6 py-5 border-b border-white/[0.08] flex-shrink-0">
          <span className="font-bebas text-[1.3rem] tracking-[0.06em] text-white block">
            Nidhi <em className="not-italic text-[var(--red)]">Creation</em>
          </span>
          <span className="inline-block mt-1 text-[0.62rem] font-semibold tracking-[0.18em] uppercase text-white bg-[var(--red)] px-2 py-[0.18rem] rounded">
            Admin
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => { setActive(item.key); setSidebarOpen(false) }}
              className={`flex items-center gap-3 px-3 py-[0.65rem] rounded-lg w-full text-left text-[0.875rem] font-medium transition-all border-none cursor-pointer font-dm ${active === item.key ? 'bg-[var(--red)] text-white' : 'bg-transparent text-white/55 hover:bg-white/[0.07] hover:text-white/85'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-6 py-4 border-t border-white/[0.08] bg-transparent border-l-0 border-r-0 border-b-0 text-white/35 hover:text-white/70 text-[0.82rem] font-medium transition-colors cursor-pointer font-dm"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Logout
        </button>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-[99] md:hidden" onClick={() => setSidebarOpen(false)}/>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col" style={{ marginLeft: window.innerWidth > 900 ? 220 : 0 }}>

        {/* Topbar */}
        <header className="sticky top-0 h-14 bg-[rgba(245,243,238,0.95)] backdrop-blur-md border-b border-[var(--border)] flex items-center gap-4 px-7 z-50 flex-shrink-0">
          <button
            className="md:hidden flex flex-col gap-1 bg-transparent border-none cursor-pointer p-2"
            onClick={() => setSidebarOpen(s => !s)}
          >
            <span className="block w-5 h-[2px] bg-[var(--text)] rounded"/>
            <span className="block w-5 h-[2px] bg-[var(--text)] rounded"/>
            <span className="block w-5 h-[2px] bg-[var(--text)] rounded"/>
          </button>
          <span className="font-bebas text-[1.25rem] tracking-[0.06em] text-[var(--text)] flex-1">{activeLabel}</span>
          <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-[var(--red)] bg-[rgba(192,57,43,0.08)] px-3 py-[0.3rem] rounded-full">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Admin
          </span>
        </header>

        {/* Section content */}
        <div className="p-7 max-sm:p-4 flex-1">
          {active === 'projects'   && <ProjectsSection   toast={showToast} />}
          {active === 'categories' && <CategoriesSection toast={showToast} />}
          {active === 'contact'    && <ContactSection    toast={showToast} />}
          {active === 'visitors'   && <VisitorsSection   toast={showToast} />}
        </div>
      </main>

      <Toast msg={toast.msg} type={toast.type} onClear={() => setToast({ msg: '', type: 'success' })}/>
    </div>
  )
}
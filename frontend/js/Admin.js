/* ══════════════════════════════════════════
   NIDHI CREATION — AdminDashboard.js
   UI interactions — API calls to be wired later
   ══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ════════════════════════════
     SIDEBAR NAVIGATION
  ════════════════════════════ */
  const sidebar       = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const navItems      = document.querySelectorAll('.nav-item');
  const sections      = document.querySelectorAll('.section');
  const topbarTitle   = document.getElementById('topbarTitle');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.section;

      navItems.forEach(n => n.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(`section-${target}`).classList.add('active');
      topbarTitle.textContent = item.textContent.trim();

      // Close sidebar on mobile after nav
      if (window.innerWidth <= 900) sidebar.classList.remove('open');
    });
  });

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 900 &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    window.location.href = '/admin/login';
  });

  /* ════════════════════════════
     MODAL HELPERS
  ════════════════════════════ */
  function openModal(id) {
    document.getElementById(id).classList.add('open');
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
  }

  // Close buttons (both × and Cancel share data-modal attribute)
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });

  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
    }
  });

  /* ════════════════════════════
     IMAGE UPLOAD ZONE
  ════════════════════════════ */
  const imageZone       = document.getElementById('imageUploadZone');
  const imageInput      = document.getElementById('projectImage');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const uploadPreview   = document.getElementById('uploadPreview');

  imageZone.addEventListener('click', () => imageInput.click());

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) showImagePreview(file);
  });

  imageZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageZone.classList.add('drag-over');
  });

  imageZone.addEventListener('dragleave', () => imageZone.classList.remove('drag-over'));

  imageZone.addEventListener('drop', (e) => {
    e.preventDefault();
    imageZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      imageInput.files = e.dataTransfer.files;
      showImagePreview(file);
    }
  });

  function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadPreview.src = e.target.result;
      uploadPreview.classList.remove('hidden');
      uploadPlaceholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }

  function resetImageUpload() {
    imageInput.value = '';
    uploadPreview.src = '';
    uploadPreview.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
  }

  /* ════════════════════════════
     PROJECTS
  ════════════════════════════ */
  let projects = [];
  let editingProjectId = null;

  // Open add modal
  document.getElementById('addProjectBtn').addEventListener('click', () => {
    editingProjectId = null;
    document.getElementById('projectModalTitle').textContent = 'Add Project';
    document.getElementById('projectId').value = '';
    document.getElementById('projectTitle').value = '';
    document.getElementById('projectCategory').value = '';
    document.getElementById('projectDescription').value = '';
    document.getElementById('projectVisible').checked = true;
    clearProjectErrors();
    resetImageUpload();
    openModal('projectModal');
  });

  // Save project
  document.getElementById('saveProjectBtn').addEventListener('click', () => {
    if (!validateProjectForm()) return;

    const project = {
      id:          editingProjectId || `proj_${Date.now()}`,
      title:       document.getElementById('projectTitle').value.trim(),
      category:    document.getElementById('projectCategory').value,
      description: document.getElementById('projectDescription').value.trim(),
      visible:     document.getElementById('projectVisible').checked,
      image:       uploadPreview.src || null,
      order:       editingProjectId
                     ? projects.find(p => p.id === editingProjectId)?.order ?? projects.length
                     : projects.length,
    };

    if (editingProjectId) {
      const idx = projects.findIndex(p => p.id === editingProjectId);
      if (idx > -1) projects[idx] = project;
    } else {
      projects.push(project);
    }

    renderProjects();
    closeModal('projectModal');
  });

  function validateProjectForm() {
    let valid = true;

    const title = document.getElementById('projectTitle').value.trim();
    if (!title) {
      document.getElementById('projectTitleError').textContent = 'Title is required.';
      valid = false;
    } else {
      document.getElementById('projectTitleError').textContent = '';
    }

    const category = document.getElementById('projectCategory').value;
    if (!category) {
      document.getElementById('projectCategoryError').textContent = 'Please select a category.';
      valid = false;
    } else {
      document.getElementById('projectCategoryError').textContent = '';
    }

    return valid;
  }

  function clearProjectErrors() {
    document.getElementById('projectTitleError').textContent    = '';
    document.getElementById('projectCategoryError').textContent = '';
    document.getElementById('projectImageError').textContent    = '';
  }

  function renderProjects() {
    const search     = document.getElementById('projectSearch').value.toLowerCase();
    const catFilter  = document.getElementById('projectCategoryFilter').value;
    const visFilter  = document.getElementById('projectVisibilityFilter').value;

    let filtered = projects.filter(p => {
      const matchSearch = !search || p.title.toLowerCase().includes(search);
      const matchCat    = !catFilter || p.category === catFilter;
      const matchVis    = !visFilter ||
                          (visFilter === 'visible' && p.visible) ||
                          (visFilter === 'hidden'  && !p.visible);
      return matchSearch && matchCat && matchVis;
    });

    const tbody = document.getElementById('projectsBody');

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">${
        projects.length === 0
          ? 'No projects yet. Click <strong>Add Project</strong> to get started.'
          : 'No projects match your filters.'
      }</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map((p, i) => `
      <tr data-id="${p.id}">
        <td>
          <span class="order-handle" title="Drag to reorder">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
            ${p.order + 1}
          </span>
        </td>
        <td>
          ${p.image
            ? `<img class="thumb" src="${p.image}" alt="${p.title}"/>`
            : `<div class="thumb-placeholder">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>`
          }
        </td>
        <td><strong>${p.title}</strong>${p.description ? `<br/><span style="font-size:0.78rem;color:var(--muted)">${p.description.slice(0,60)}${p.description.length > 60 ? '…' : ''}</span>` : ''}</td>
        <td>${categoryLabel(p.category)}</td>
        <td><span class="badge ${p.visible ? 'badge-green' : 'badge-grey'}">${p.visible ? 'Visible' : 'Hidden'}</span></td>
        <td>
          <div class="action-group">
            <button class="btn-icon" title="Edit" onclick="editProject('${p.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon danger" title="Delete" onclick="deleteItem('project','${p.id}','${p.title}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.editProject = (id) => {
    const p = projects.find(p => p.id === id);
    if (!p) return;
    editingProjectId = id;
    document.getElementById('projectModalTitle').textContent = 'Edit Project';
    document.getElementById('projectId').value       = p.id;
    document.getElementById('projectTitle').value    = p.title;
    document.getElementById('projectCategory').value = p.category;
    document.getElementById('projectDescription').value = p.description || '';
    document.getElementById('projectVisible').checked   = p.visible;
    clearProjectErrors();

    if (p.image) {
      uploadPreview.src = p.image;
      uploadPreview.classList.remove('hidden');
      uploadPlaceholder.classList.add('hidden');
    } else {
      resetImageUpload();
    }

    openModal('projectModal');
  };

  // Live filter
  ['projectSearch','projectCategoryFilter','projectVisibilityFilter'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderProjects);
    document.getElementById(id).addEventListener('change', renderProjects);
  });

  /* ════════════════════════════
     CATEGORIES
  ════════════════════════════ */
  let categories = [];
  let editingCategoryId = null;

  // Auto-slug from name
  document.getElementById('categoryName').addEventListener('input', () => {
    if (!editingCategoryId) {
      document.getElementById('categorySlug').value =
        document.getElementById('categoryName').value
          .toLowerCase().trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
    }
  });

  document.getElementById('addCategoryBtn').addEventListener('click', () => {
    editingCategoryId = null;
    document.getElementById('categoryModalTitle').textContent = 'Add Category';
    document.getElementById('categoryId').value   = '';
    document.getElementById('categoryName').value = '';
    document.getElementById('categorySlug').value = '';
    document.getElementById('categoryDesc').value = '';
    document.getElementById('categoryVisible').checked = true;
    clearCategoryErrors();
    openModal('categoryModal');
  });

  document.getElementById('saveCategoryBtn').addEventListener('click', () => {
    if (!validateCategoryForm()) return;

    const cat = {
      id:          editingCategoryId || `cat_${Date.now()}`,
      name:        document.getElementById('categoryName').value.trim(),
      slug:        document.getElementById('categorySlug').value.trim(),
      description: document.getElementById('categoryDesc').value.trim(),
      visible:     document.getElementById('categoryVisible').checked,
      order:       editingCategoryId
                     ? categories.find(c => c.id === editingCategoryId)?.order ?? categories.length
                     : categories.length,
    };

    if (editingCategoryId) {
      const idx = categories.findIndex(c => c.id === editingCategoryId);
      if (idx > -1) categories[idx] = cat;
    } else {
      categories.push(cat);
    }

    renderCategories();
    closeModal('categoryModal');
  });

  function validateCategoryForm() {
    let valid = true;

    const name = document.getElementById('categoryName').value.trim();
    if (!name) {
      document.getElementById('categoryNameError').textContent = 'Name is required.';
      valid = false;
    } else {
      document.getElementById('categoryNameError').textContent = '';
    }

    const slug = document.getElementById('categorySlug').value.trim();
    if (!slug) {
      document.getElementById('categorySlugError').textContent = 'Slug is required.';
      valid = false;
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      document.getElementById('categorySlugError').textContent = 'Only lowercase letters, numbers, and hyphens.';
      valid = false;
    } else {
      document.getElementById('categorySlugError').textContent = '';
    }

    return valid;
  }

  function clearCategoryErrors() {
    document.getElementById('categoryNameError').textContent = '';
    document.getElementById('categorySlugError').textContent = '';
  }

  function renderCategories() {
    const tbody = document.getElementById('categoriesBody');

    if (categories.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No categories yet. Click <strong>Add Category</strong> to get started.</td></tr>`;
      return;
    }

    tbody.innerHTML = categories.map(c => `
      <tr data-id="${c.id}">
        <td>
          <span class="order-handle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
            ${c.order + 1}
          </span>
        </td>
        <td><strong>${c.name}</strong></td>
        <td><code style="font-size:0.8rem;background:var(--bg);padding:0.15rem 0.4rem;border-radius:3px;border:1px solid var(--border)">${c.slug}</code></td>
        <td style="color:var(--muted);font-size:0.85rem">${c.description ? c.description.slice(0,60) + (c.description.length > 60 ? '…' : '') : '—'}</td>
        <td><span class="badge ${c.visible ? 'badge-green' : 'badge-grey'}">${c.visible ? 'Visible' : 'Hidden'}</span></td>
        <td>
          <div class="action-group">
            <button class="btn-icon" title="Edit" onclick="editCategory('${c.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon danger" title="Delete" onclick="deleteItem('category','${c.id}','${c.name}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.editCategory = (id) => {
    const c = categories.find(c => c.id === id);
    if (!c) return;
    editingCategoryId = id;
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    document.getElementById('categoryId').value   = c.id;
    document.getElementById('categoryName').value = c.name;
    document.getElementById('categorySlug').value = c.slug;
    document.getElementById('categoryDesc').value = c.description || '';
    document.getElementById('categoryVisible').checked = c.visible;
    clearCategoryErrors();
    openModal('categoryModal');
  };

  /* ════════════════════════════
     DELETE (shared)
  ════════════════════════════ */
  let pendingDelete = null;

  window.deleteItem = (type, id, name) => {
    pendingDelete = { type, id };
    document.getElementById('deleteMessage').textContent =
      `Are you sure you want to delete "${name}"? This cannot be undone.`;
    openModal('deleteModal');
  };

  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (!pendingDelete) return;

    if (pendingDelete.type === 'project') {
      projects = projects.filter(p => p.id !== pendingDelete.id);
      renderProjects();
    } else if (pendingDelete.type === 'category') {
      categories = categories.filter(c => c.id !== pendingDelete.id);
      renderCategories();
    }

    pendingDelete = null;
    closeModal('deleteModal');
  });

  /* ════════════════════════════
     CONTACT INFO
  ════════════════════════════ */
  const mapsInput = document.getElementById('ci-maps');
  const mapIframe = document.getElementById('mapPreviewIframe');

  // Live map preview
  let mapDebounce;
  mapsInput.addEventListener('input', () => {
    clearTimeout(mapDebounce);
    mapDebounce = setTimeout(() => {
      const url = mapsInput.value.trim();
      if (url.startsWith('https://www.google.com/maps/embed')) {
        mapIframe.src = url;
      }
    }, 800);
  });

  document.getElementById('saveContactBtn').addEventListener('click', () => {
    const note = document.getElementById('contactSaveNote');
    // TODO: wire to POST /api/admin/contact
    note.textContent = '✓ Changes saved';
    setTimeout(() => { note.textContent = ''; }, 3000);
  });

  /* ════════════════════════════
     VISITORS SEARCH
  ════════════════════════════ */
  const visitorSearchInput = document.getElementById('visitorSearch');
  const visitorSearchBtn   = document.getElementById('visitorSearchBtn');
  const visitorEmpty       = document.getElementById('visitorEmpty');
  const visitorTableWrap   = document.getElementById('visitorTableWrap');
  const visitorBody        = document.getElementById('visitorBody');

  async function searchVisitors() {
    const query = visitorSearchInput.value.trim();
    if (!query) return;

    visitorSearchBtn.disabled = true;
    visitorSearchBtn.textContent = 'Searching…';

    try {
      // TODO: replace with real API call
      // const res = await fetch(`/api/admin/visitors?name=${encodeURIComponent(query)}`);
      // const data = await res.json();
      // renderVisitorResults(data.visitors);

      // Placeholder until API is wired:
      renderVisitorResults([]);
    } finally {
      visitorSearchBtn.disabled = false;
      visitorSearchBtn.textContent = 'Search';
    }
  }

  function renderVisitorResults(visitors) {
    if (visitors.length === 0) {
      visitorEmpty.querySelector('p').textContent = 'No visitors found matching that name.';
      visitorEmpty.classList.remove('hidden');
      visitorTableWrap.classList.add('hidden');
      return;
    }

    visitorEmpty.classList.add('hidden');
    visitorTableWrap.classList.remove('hidden');

    visitorBody.innerHTML = visitors.map(v => `
      <tr>
        <td>${v.name}</td>
        <td>${v.phone}</td>
        <td>${v.business || '—'}</td>
        <td style="color:var(--muted);font-size:0.82rem">${v.visited_at || '—'}</td>
      </tr>
    `).join('');
  }

  visitorSearchBtn.addEventListener('click', searchVisitors);
  visitorSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchVisitors();
  });

  /* ════════════════════════════
     HELPERS
  ════════════════════════════ */
  function categoryLabel(slug) {
    const map = {
      neon: 'Neon Signs', '3d': '3D Letter Signs', led: 'LED Display Boards',
      flex: 'Flex & Vinyl', acrylic: 'Acrylic Signage', metal: 'Metal Signs',
      wooden: 'Wooden Boards', glow: 'Glow Signboards',
    };
    return map[slug] || slug;
  }

});
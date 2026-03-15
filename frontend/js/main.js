/* ══════════════════════════════
   NIDHI CREATION — main.js
   ══════════════════════════════ */
 
document.addEventListener('DOMContentLoaded', () => {
 
  /* ── NAVBAR scroll shrink ── */
  const nav = document.getElementById('siteNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
 
 
  /* ── HAMBURGER (mobile) ── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
 
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    const bars = hamburger.querySelectorAll('span');
    if (open) {
      bars[0].style.cssText = 'transform: translateY(7px) rotate(45deg)';
      bars[1].style.cssText = 'opacity:0';
      bars[2].style.cssText = 'transform: translateY(-7px) rotate(-45deg)';
    } else {
      bars.forEach(b => b.style.cssText = '');
    }
  });
 
 
  /* ── CATEGORIES DROPDOWN ── */
  const catDropdown = document.getElementById('catDropdown');
  const dropTrigger = catDropdown.querySelector('.drop-trigger');
  let hoverTimer;
 
  const openDrop  = () => { catDropdown.classList.add('open');    dropTrigger.setAttribute('aria-expanded', 'true'); };
  const closeDrop = () => { catDropdown.classList.remove('open'); dropTrigger.setAttribute('aria-expanded', 'false'); };
 
  // Click toggle (works on both mobile and desktop)
  dropTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    catDropdown.classList.contains('open') ? closeDrop() : openDrop();
  });
 
  // Hover intent on desktop
  catDropdown.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); openDrop(); });
  catDropdown.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeDrop, 150); });
 
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!catDropdown.contains(e.target)) closeDrop();
  });
 
  // Close on Escape
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrop(); });
 
 
  /* ── CAROUSEL ── */
  const track   = document.getElementById('carouselTrack');
  const slides  = track.querySelectorAll('.carousel-slide');
  const dotsWrap = document.getElementById('carouselDots');
  const total   = slides.length;
  let current   = 0;
  let autoTimer;
 
  // Build dots
  slides.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'dot' + (i === 0 ? ' active' : '');
    btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
    btn.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(btn);
  });
 
  const dots = dotsWrap.querySelectorAll('.dot');
 
  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    resetAuto();
  }
 
  document.getElementById('prevBtn').addEventListener('click', () => goTo(current - 1));
  document.getElementById('nextBtn').addEventListener('click', () => goTo(current + 1));
 
  // Auto-advance every 4s
  function startAuto() { autoTimer = setInterval(() => goTo(current + 1), 4000); }
  function resetAuto()  { clearInterval(autoTimer); startAuto(); }
  startAuto();
 
  // Swipe / drag support
  let startX = 0;
  track.addEventListener('pointerdown',  e => { startX = e.clientX; });
  track.addEventListener('pointerup',    e => {
    const diff = startX - e.clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  });


  /* ══════════════════════════════
     PAST WORKS — dynamic from API
  ══════════════════════════════ */
  const worksGrid       = document.getElementById('worksGrid');
  const worksModal      = document.getElementById('worksModal');
  const worksModalClose = document.getElementById('worksModalClose');
  const worksModalImg   = document.getElementById('worksModalImg');
  const worksModalCat   = document.getElementById('worksModalCat');
  const worksModalTitle = document.getElementById('worksModalTitle');
  const worksModalDesc  = document.getElementById('worksModalDesc');

  async function loadRecentProjects() {
    try {
      const res  = await fetch('/api/recent-projects');
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      renderWorks(data.projects || []);
    } catch (err) {
      console.error('Could not load recent projects:', err);
      worksGrid.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;grid-column:1/-1;text-align:center;padding:2rem">Could not load projects.</p>';
    }
  }

  function renderWorks(projects) {
    if (!projects.length) {
      worksGrid.innerHTML = '<p style="color:var(--muted);font-size:0.9rem;grid-column:1/-1;text-align:center;padding:2rem">No projects added yet.</p>';
      return;
    }

    worksGrid.innerHTML = '';
    projects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'work-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `View ${project.title}`);

      card.innerHTML = `
        <div class="work-img" style="padding:0;overflow:hidden;">
          <img
            src="${project.image_url}"
            alt="${project.title}"
            loading="lazy"
            style="width:100%;height:100%;object-fit:cover;display:block;"
            onerror="this.parentElement.innerHTML='<span style=font-size:2rem>◈</span>'"
          />
        </div>
        <div class="work-info">
          <h4>${project.title}</h4>
          <span>${project.category_slug}</span>
        </div>
      `;

      const open = () => openWorksModal(project);
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
      worksGrid.appendChild(card);
    });
  }

  function openWorksModal(project) {
    worksModalImg.src           = project.image_url || '';
    worksModalImg.alt           = project.title;
    worksModalCat.textContent   = project.category_slug;
    worksModalTitle.textContent = project.title;
    worksModalDesc.textContent  = project.description || '';
    worksModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeWorksModal() {
    worksModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  worksModalClose.addEventListener('click', closeWorksModal);
  worksModal.addEventListener('click', e => { if (e.target === worksModal) closeWorksModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeWorksModal(); });

  loadRecentProjects();

});
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
 
});
 
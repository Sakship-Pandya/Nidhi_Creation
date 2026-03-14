/* ══════════════════════════════════════════
   NIDHI CREATION — category.js

   URL pattern:  /category/<slug>
   e.g.          /category/neon
                 /category/3d
                 /category/led

   Backend endpoint expected:
     GET /api/category/<slug>
     Response JSON:
     {
       "category": {
         "slug":        "neon",
         "name":        "Neon Signs",
         "description": "Custom LED and glass-tube neon signs..."
       },
       "projects": [
         {
           "id":          "proj_001",
           "title":       "Café Lumière",
           "category":    "neon",
           "image_url":   "/static/images/proj_001.jpg",
           "description": "Custom pink neon sign for a café interior.",
           "created_at":  "2024-11-10T10:30:00"
         },
         ...
       ]
     }
   ══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Element refs ── */
  const elNav        = document.getElementById('site-nav');
  const elHamburger  = document.getElementById('nav-hamburger');
  const elNavLinks   = document.getElementById('nav-links');

  const elPageTitle  = document.getElementById('page-title');
  const elCatTitle   = document.getElementById('cat-title');
  const elCatDesc    = document.getElementById('cat-description');
  const elCatCount   = document.getElementById('cat-item-count');

  const elLoading    = document.getElementById('state-loading');
  const elItems      = document.getElementById('state-items');
  const elEmpty      = document.getElementById('state-empty');
  const elError      = document.getElementById('state-error');
  const elErrorMsg   = document.getElementById('error-message');
  const elItemsGrid  = document.getElementById('items-grid');
  const elRetryBtn   = document.getElementById('btn-retry');

  const elModal      = document.getElementById('modal-overlay');
  const elModalClose = document.getElementById('modal-close');
  const elModalImg   = document.getElementById('modal-img');
  const elModalCat   = document.getElementById('modal-category-tag');
  const elModalTitle = document.getElementById('modal-title');
  const elModalDesc  = document.getElementById('modal-description');
  const elModalAge   = document.getElementById('modal-age');


  /* ══════════════════════════════
     NAVBAR
  ══════════════════════════════ */
  window.addEventListener('scroll', () => {
    elNav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  elHamburger.addEventListener('click', () => {
    const open = elNavLinks.classList.toggle('open');
    const bars = elHamburger.querySelectorAll('span');
    if (open) {
      bars[0].style.cssText = 'transform: translateY(7px) rotate(45deg)';
      bars[1].style.cssText = 'opacity: 0';
      bars[2].style.cssText = 'transform: translateY(-7px) rotate(-45deg)';
    } else {
      bars.forEach(b => b.style.cssText = '');
    }
  });


  /* ══════════════════════════════
     UTILITY: TIME AGO
     Input:  ISO timestamp string  e.g. "2024-11-10T10:30:00"
     Output: human string          e.g. "4 months ago"
  ══════════════════════════════ */
  function timeAgo(isoString) {
    const now     = new Date();
    const past    = new Date(isoString);
    const seconds = Math.floor((now - past) / 1000);

    const intervals = [
      { label: 'year',   secs: 31536000 },
      { label: 'month',  secs: 2592000  },
      { label: 'week',   secs: 604800   },
      { label: 'day',    secs: 86400    },
      { label: 'hour',   secs: 3600     },
      { label: 'minute', secs: 60       },
    ];

    for (const { label, secs } of intervals) {
      const count = Math.floor(seconds / secs);
      if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  }


  /* ══════════════════════════════
     UTILITY: SHOW / HIDE STATES
  ══════════════════════════════ */
  function showState(state) {
    [elLoading, elItems, elEmpty, elError].forEach(el => el.classList.add('hidden'));
    state.classList.remove('hidden');
  }


  /* ══════════════════════════════
     BUILD A PROJECT CARD
     Each element gets a cohesive id based on project.id
  ══════════════════════════════ */
  function buildCard(project) {
    const age = timeAgo(project.created_at);

    const card = document.createElement('div');
    card.className   = 'item-card';
    card.id          = `card-${project.id}`;               /* e.g. card-proj_001 */
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View details for ${project.title}`);

    card.innerHTML = `
      <div class="card-img-wrap" id="card-img-wrap-${project.id}">
        <img
          id="card-img-${project.id}"
          src="${project.image_url}"
          alt="${project.title}"
          loading="lazy"
          onerror="this.src='/static/images/placeholder.jpg'"
        />
      </div>
      <div class="card-body" id="card-body-${project.id}">
        <h3 class="card-title" id="card-title-${project.id}">${project.title}</h3>
        <p  class="card-desc"  id="card-desc-${project.id}">${project.description}</p>
        <p  class="card-age"   id="card-age-${project.id}">${age}</p>
      </div>
    `;

    /* Open modal on click or Enter key */
    const openModal = () => showModal(project);
    card.addEventListener('click',   openModal);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') openModal(); });

    return card;
  }


  /* ══════════════════════════════
     MODAL
  ══════════════════════════════ */
  function showModal(project) {
    elModalImg.src         = project.image_url;
    elModalImg.alt         = project.title;
    elModalCat.textContent = project.category;
    elModalTitle.textContent = project.title;
    elModalDesc.textContent  = project.description;
    elModalAge.textContent   = 'Added ' + timeAgo(project.created_at);

    elModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    elModalClose.focus();
  }

  function closeModal() {
    elModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  elModalClose.addEventListener('click', closeModal);

  /* Close on backdrop click */
  elModal.addEventListener('click', e => {
    if (e.target === elModal) closeModal();
  });

  /* Close on Escape */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });


  /* ══════════════════════════════
     DUMMY DATA — remove once backend is ready
     Set USE_DUMMY = false to use real API
  ══════════════════════════════ */
  const USE_DUMMY = true;

  const DUMMY_DATA = {
    neon: {
      category: {
        slug: 'neon',
        name: 'Neon Signs',
        description: 'Custom LED and glass-tube neon signs in any shape, colour, or text. Perfect for cafés, shops, events, and interiors.'
      },
      projects: [
        { id: 'proj_001', title: 'Café Lumière',       category: 'Neon Signs', image_url: 'https://placehold.co/600x450/f7e9e7/c0392b?text=Café+Lumière',       description: 'Custom pink neon sign for a café interior. Glass tube, wall-mounted with dimmer.',        created_at: '2025-01-15T10:30:00' },
        { id: 'proj_002', title: 'The Brew Bar',        category: 'Neon Signs', image_url: 'https://placehold.co/600x450/e7f0f7/2980b9?text=The+Brew+Bar',        description: 'Blue neon logo sign above the bar counter. LED flex neon with acrylic backing.',          created_at: '2024-11-20T14:00:00' },
        { id: 'proj_003', title: 'Spark Studio',        category: 'Neon Signs', image_url: 'https://placehold.co/600x450/e7f7ed/27ae60?text=Spark+Studio',        description: 'Green neon tagline sign for a creative agency office. Remote-controlled brightness.',     created_at: '2024-09-05T09:15:00' },
        { id: 'proj_004', title: 'Rani Boutique',       category: 'Neon Signs', image_url: 'https://placehold.co/600x450/f7e7f3/8e44ad?text=Rani+Boutique',       description: 'Purple cursive neon for a fashion boutique window display. UV-resistant coating.',        created_at: '2024-07-22T11:45:00' },
        { id: 'proj_005', title: 'Zest Restaurant',     category: 'Neon Signs', image_url: 'https://placehold.co/600x450/fdf3e7/e67e22?text=Zest+Restaurant',     description: 'Orange OPEN sign with custom frame. Weatherproof for outdoor use.',                      created_at: '2025-02-10T08:00:00' },
        { id: 'proj_006', title: 'Night Owl Lounge',    category: 'Neon Signs', image_url: 'https://placehold.co/600x450/0d0d0f/e8ff3c?text=Night+Owl+Lounge',    description: 'Neon yellow sign for a late-night lounge. Double-layer acrylic with halo glow.',         created_at: '2024-05-18T17:30:00' },
      ]
    },
    '3d': {
      category: {
        slug: '3d',
        name: '3D Letter Signs',
        description: 'Raised acrylic, foam, and metal 3D letters that give your brand real depth and presence on any wall or storefront.'
      },
      projects: [
        { id: 'proj_007', title: 'RetailMax Storefront', category: '3D Letter Signs', image_url: 'https://placehold.co/600x450/f0f4fe/2980b9?text=RetailMax',       description: 'Brushed gold 3D letters mounted on a dark backing panel. 150mm depth, acrylic finish.', created_at: '2025-03-01T10:00:00' },
        { id: 'proj_008', title: 'City Gym',             category: '3D Letter Signs', image_url: 'https://placehold.co/600x450/fdf3e7/e67e22?text=City+Gym',        description: 'Bold foam 3D letters spray-painted black. 200mm raised, high-impact look.',            created_at: '2024-12-14T13:00:00' },
        { id: 'proj_009', title: 'Sharma & Sons',        category: '3D Letter Signs', image_url: 'https://placehold.co/600x450/f5f3ee/2c2c2c?text=Sharma+%26+Sons', description: 'Stainless steel 3D letters for a legal office lobby. Mirror-finish, screw-mounted.',     created_at: '2024-08-30T09:30:00' },
        { id: 'proj_010', title: 'Bloom Florist',        category: '3D Letter Signs', image_url: 'https://placehold.co/600x450/e7f7ed/27ae60?text=Bloom+Florist',   description: 'Pastel green raised letters with built-in LED backlight for a flower shop.',           created_at: '2025-01-28T11:00:00' },
      ]
    },
    led: {
      category: {
        slug: 'led',
        name: 'LED Display Boards',
        description: 'Programmable scrolling LED boards and backlit display panels for shops, offices, and roadside hoardings.'
      },
      projects: [
        { id: 'proj_011', title: 'City Mall Entrance',   category: 'LED Display', image_url: 'https://placehold.co/600x450/e7f7f7/16a085?text=City+Mall',          description: 'Large-format scrolling LED display at mall entrance. Full-colour, remote-programmable.',  created_at: '2025-02-20T09:00:00' },
        { id: 'proj_012', title: 'Metro Pharmacy',       category: 'LED Display', image_url: 'https://placehold.co/600x450/e7f0f7/2980b9?text=Metro+Pharmacy',     description: 'Single-colour red scrolling LED board above pharmacy entrance. Weather-sealed.',         created_at: '2024-10-05T10:00:00' },
        { id: 'proj_013', title: 'Petrol Station Board', category: 'LED Display', image_url: 'https://placehold.co/600x450/fdf3e7/e67e22?text=Petrol+Station',     description: 'Price display LED board with automatic brightness sensor for day/night use.',            created_at: '2024-06-15T08:00:00' },
      ]
    },
    metal: {
      category: {
        slug: 'metal',
        name: 'Metal Signs',
        description: 'Precision-cut stainless steel, brass, and aluminium signs for a premium, long-lasting look on any building or lobby.'
      },
      projects: [
        { id: 'proj_014', title: 'The Grand Hotel',      category: 'Metal Signs', image_url: 'https://placehold.co/600x450/f5f5f5/888888?text=The+Grand+Hotel',    description: 'Engraved brass entrance plate with hotel crest. Lacquered finish, wall-mounted.',       created_at: '2024-11-01T10:00:00' },
        { id: 'proj_015', title: 'Patel Law Associates', category: 'Metal Signs', image_url: 'https://placehold.co/600x450/f0f4fe/2c3e50?text=Patel+Law',          description: 'Matte black aluminium sign with laser-engraved text. Suits corporate environments.',     created_at: '2025-01-10T09:30:00' },
        { id: 'proj_016', title: 'Heritage Bank',        category: 'Metal Signs', image_url: 'https://placehold.co/600x450/fdf3e7/b7950b?text=Heritage+Bank',      description: 'Gold-brushed stainless steel wall panel with cut-out logo. Backlit from behind.',       created_at: '2024-04-20T14:00:00' },
        { id: 'proj_017', title: 'Dr. Mehta Clinic',     category: 'Metal Signs', image_url: 'https://placehold.co/600x450/e7f7f7/1abc9c?text=Dr.+Mehta+Clinic',  description: 'White powder-coated aluminium sign with raised text. Easy-clean medical-grade finish.',  created_at: '2025-03-05T11:00:00' },
      ]
    },
    acrylic: {
      category: {
        slug: 'acrylic',
        name: 'Acrylic Signage',
        description: 'Frosted, transparent, and UV-printed acrylic boards for offices, clinics, salons, and retail shops.'
      },
      projects: [
        { id: 'proj_018', title: 'MedPlus Clinic',       category: 'Acrylic Signage', image_url: 'https://placehold.co/600x450/f3f0ff/7c6fbf?text=MedPlus+Clinic',  description: 'Frosted acrylic sign with UV-printed logo. Clean medical aesthetic, wall-standoff mounted.', created_at: '2024-12-20T09:00:00' },
        { id: 'proj_019', title: 'Vogue Salon',          category: 'Acrylic Signage', image_url: 'https://placehold.co/600x450/f7e7f3/8e44ad?text=Vogue+Salon',     description: 'Rose-gold mirror acrylic with vinyl lettering. Backlit LED strip along edges.',              created_at: '2025-02-01T11:00:00' },
        { id: 'proj_020', title: 'TechPark Office',      category: 'Acrylic Signage', image_url: 'https://placehold.co/600x450/e7f0f7/2980b9?text=TechPark+Office', description: 'Transparent acrylic directory board with printed floor listings. 10mm thick.',                created_at: '2024-09-12T10:00:00' },
      ]
    },
    flex: {
      category: {
        slug: 'flex',
        name: 'Flex & Vinyl Boards',
        description: 'Large-format flex printing for shop fronts, banners, hoardings, and events. Fast turnaround, vivid colours.'
      },
      projects: [
        { id: 'proj_021', title: 'Diwali Sale Banner',   category: 'Flex & Vinyl', image_url: 'https://placehold.co/600x450/fdf3e7/c0392b?text=Diwali+Banner',     description: 'Festival sale hoarding for a clothing store. 10×4 ft backlit flex, double-sided.',         created_at: '2024-10-20T08:00:00' },
        { id: 'proj_022', title: 'New Shop Opening',     category: 'Flex & Vinyl', image_url: 'https://placehold.co/600x450/e7f7ed/27ae60?text=New+Shop+Opening',  description: 'Grand opening vinyl wrap for a grocery store shutter. Full-colour print, UV laminated.',    created_at: '2025-01-05T09:00:00' },
      ]
    },
    wooden: {
      category: {
        slug: 'wooden',
        name: 'Wooden Boards',
        description: 'Carved, routed, and hand-painted wood signage for restaurants, resorts, homes, and boutique shops.'
      },
      projects: [
        { id: 'proj_023', title: 'The Rustic Kitchen',   category: 'Wooden Boards', image_url: 'https://placehold.co/600x450/f5ede0/8B4513?text=Rustic+Kitchen',   description: 'Hand-carved teak wood sign for a heritage restaurant. Linseed oil finish.',               created_at: '2024-07-10T10:00:00' },
        { id: 'proj_024', title: 'Forest Resort',        category: 'Wooden Boards', image_url: 'https://placehold.co/600x450/eaf5e9/2d6a4f?text=Forest+Resort',    description: 'Directional wooden signage set for a hill resort. CNC routed, weather-treated pine.',     created_at: '2024-03-15T09:00:00' },
        { id: 'proj_025', title: 'Home Nameplate',       category: 'Wooden Boards', image_url: 'https://placehold.co/600x450/fdf3e7/c07c3a?text=Home+Nameplate',   description: 'Personalised teak nameplate with house number and family name. Brass screw inserts.',      created_at: '2025-02-14T11:30:00' },
      ]
    },
    glow: {
      category: {
        slug: 'glow',
        name: 'Glow Signboards',
        description: 'Backlit, edge-lit, and halo-effect illuminated sign boards that stay visible day and night.'
      },
      projects: [
        { id: 'proj_026', title: 'Spark Creative Studio', category: 'Glow Signboards', image_url: 'https://placehold.co/600x450/e7f7f7/3cf0e8?text=Spark+Studio',  description: 'Edge-lit acrylic glow sign for a design studio. Colour-shifting RGB LEDs.',               created_at: '2024-11-30T10:00:00' },
        { id: 'proj_027', title: 'Highway Dhaba',         category: 'Glow Signboards', image_url: 'https://placehold.co/600x450/fdf3e7/e67e22?text=Highway+Dhaba', description: 'Large backlit flex box sign for a highway restaurant. Visible from 200 metres.',           created_at: '2024-08-08T07:30:00' },
        { id: 'proj_028', title: 'Diamond Jewellers',     category: 'Glow Signboards', image_url: 'https://placehold.co/600x450/fffbe7/b7950b?text=Diamond+Jewellers', description: 'Halo-effect gold glow sign above jewellery shop entrance. 24/7 illumination.',          created_at: '2025-01-20T09:00:00' },
        { id: 'proj_029', title: 'Blue Star Hotel',       category: 'Glow Signboards', image_url: 'https://placehold.co/600x450/e7f0f7/2980b9?text=Blue+Star+Hotel', description: 'Backlit channel letter hotel sign mounted on rooftop. Waterproof IP65 rated.',           created_at: '2024-06-25T08:00:00' },
      ]
    }
  };

  /* Mock fetch — mirrors real API response shape */
  async function mockFetch(slug) {
    /* Simulate network delay */
    await new Promise(r => setTimeout(r, 700));
    const data = DUMMY_DATA[slug];
    if (!data) throw new Error(`No dummy data for category "${slug}"`);
    return data;
  }


  /* ══════════════════════════════
     FETCH & RENDER
  ══════════════════════════════ */
  async function loadCategory(slug) {
    showState(elLoading);

    try {
      let data;

      if (USE_DUMMY) {
        /* ── DUMMY MODE: uses local data above ── */
        data = await mockFetch(slug);
      } else {
        /* ── LIVE MODE: calls your Python backend ── */
        const res = await fetch(`/api/category/${slug}`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        data = await res.json();
      }

      const { category, projects } = data;
      /* ── Fill header ── */
      document.title                = `${category.name} — Nidhi Creation`;
      elPageTitle.textContent       = `${category.name} — Nidhi Creation`;
      elCatTitle.textContent        = category.name;
      elCatDesc.textContent         = category.description;
      elCatCount.textContent        = `${projects.length} project${projects.length !== 1 ? 's' : ''}`;

      if (!projects.length) {
        showState(elEmpty);
        return;
      }

      /* ── Render cards ── */
      elItemsGrid.innerHTML = '';
      projects.forEach(project => {
        elItemsGrid.appendChild(buildCard(project));
      });

      showState(elItems);

    } catch (err) {
      console.error('Category load error:', err);
      elErrorMsg.textContent = `Could not load this category. (${err.message})`;
      showState(elError);
    }
  }


  /* ══════════════════════════════
     INIT — read slug from URL
     Supports:
       /category/neon          → slug = "neon"
       /category/3d            → slug = "3d"
       /category.html?cat=neon → slug = "neon"  (fallback for static file serving)
  ══════════════════════════════ */
  function getSlug() {
    /* Try URL path first: /category/neon */
    const parts = window.location.pathname.split('/').filter(Boolean);
    const catIndex = parts.indexOf('category');
    if (catIndex !== -1 && parts[catIndex + 1]) {
      return parts[catIndex + 1];
    }

    /* Fallback: ?cat=neon query param */
    const params = new URLSearchParams(window.location.search);
    return params.get('cat') || null;
  }

  const slug = getSlug();

  if (!slug) {
    elCatTitle.textContent = 'Category not found';
    elErrorMsg.textContent = 'No category was specified in the URL.';
    showState(elError);
  } else {
    loadCategory(slug);
  }

  /* Retry button */
  elRetryBtn.addEventListener('click', () => {
    const s = getSlug();
    if (s) loadCategory(s);
  });

});
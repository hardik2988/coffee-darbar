// Coffee Darbar — Coffee Collection: rendering, filters, quick view, Build Your Own + Darbar AI engine
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];
const { PRODUCTS, FILTERS, BARISTA_NOTES } = window;
let activeFilter = 'all';
let activeSearch = '';
let favorites = JSON.parse(localStorage.getItem('hardiFavorites') || '[]');
const toppingSelection = new Set();
const activeDietary = new Set();

document.addEventListener('DOMContentLoaded', () => {
  if (!$('#tier1Grid')) return;
  renderBaristaNote();
  renderFilters();
  renderDietaryFilters();
  renderProducts();
  initSearch();
  initQuickView();
  initBuilder();
});

// ---------------- Barista note ----------------
function renderBaristaNote() {
  const el = $('#baristaNoteText');
  if (!el) return;
  const dayIndex = new Date().getDay() % BARISTA_NOTES.length;
  el.textContent = BARISTA_NOTES[dayIndex];
}

// ---------------- Filters ----------------
function renderFilters() {
  const row = $('#filterRow');
  if (!row) return;
  row.innerHTML = FILTERS.map(f => `<button class="menu-pill${f.tag === 'all' ? ' active' : ''}" data-tag="${f.tag}" data-testid="filter-${f.tag}"><span>${f.icon}</span> ${f.label}</button>`).join('');
  $$('.menu-pill', row).forEach(pill => pill.addEventListener('click', () => {
    $$('.menu-pill', row).forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeFilter = pill.dataset.tag;
    renderProducts();
  }));
}

function renderDietaryFilters() {
  const row = $('#dietaryChipRow');
  if (!row || !window.DIETARY_FILTERS) return;
  row.innerHTML = window.DIETARY_FILTERS.map(d => 
    `<button class="dietary-chip" data-diet="${d.key}" data-testid="dietary-${d.key}" title="${d.tip}">
      <span class="chip-icon">${d.icon}</span>
      <span class="chip-label">${d.label}</span>
      <i class="fa-solid fa-check chip-check"></i>
    </button>`
  ).join('');

  $$('.dietary-chip', row).forEach(chip => chip.addEventListener('click', () => {
    const key = chip.dataset.diet;
    if (activeDietary.has(key)) {
      activeDietary.delete(key);
      chip.classList.remove('active');
    } else {
      activeDietary.add(key);
      chip.classList.add('active');
    }
    const clearBtn = $('#clearDietaryBtn');
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', activeDietary.size === 0);
    }
    renderProducts();
  }));

  $('#clearDietaryBtn')?.addEventListener('click', () => {
    activeDietary.clear();
    $$('.dietary-chip', row).forEach(c => c.classList.remove('active'));
    $('#clearDietaryBtn')?.classList.add('hidden');
    renderProducts();
  });
}

function initSearch() {
  $('#menuSearch')?.addEventListener('input', e => { activeSearch = e.target.value.trim().toLowerCase(); renderProducts(); });
}

// ---------------- Render products ----------------
function matchesProduct(p) {
  let tagOk = false;
  if (activeFilter === 'all') {
    tagOk = true;
  } else if (activeFilter === 'high-caff') {
    tagOk = (p.caffeineMg || 0) >= 140;
  } else if (activeFilter === 'med-caff') {
    tagOk = (p.caffeineMg || 0) >= 75 && (p.caffeineMg || 0) < 140;
  } else if (activeFilter === 'low-caff') {
    tagOk = (p.caffeineMg || 0) < 75 || p.tags.includes('decaf') || (p.dietary && p.dietary.lowCaffeine);
  } else if (activeFilter === 'vegan') {
    tagOk = p.tags.includes('vegan') || (p.dietary && p.dietary.vegan);
  } else if (activeFilter === 'meals') {
    tagOk = p.tags.includes('meals') || p.tags.includes('bakery') || p.tags.includes('healthy') || p.tier === 3;
  } else if (activeFilter === 'sugar-free') {
    tagOk = p.dietary && p.dietary.sugarFree;
  } else if (activeFilter === 'bestseller') {
    tagOk = p.tags.includes('bestseller') || p.rating >= 4.8;
  } else if (activeFilter === 'signature') {
    tagOk = p.tier === 1 || p.tags.includes('signature');
  } else {
    tagOk = p.tags.includes(activeFilter);
  }

  const searchOk = !activeSearch || p.name.toLowerCase().includes(activeSearch) || (p.notes || '').toLowerCase().includes(activeSearch);
  
  let dietaryOk = true;
  if (activeDietary.size > 0) {
    for (const key of activeDietary) {
      if (!p.dietary || !p.dietary[key]) {
        dietaryOk = false;
        break;
      }
    }
  }

  return tagOk && searchOk && dietaryOk;
}

function starRow(rating) {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => `<i class="fa-solid fa-star${i < full ? '' : ' dim'}"></i>`).join('');
}

function cardMeta(p) {
  const bits = [];
  if (p.roast) bits.push(p.roast);
  if (p.cal) bits.push(`${p.cal} kcal`);
  if (p.caffeine) bits.push(p.caffeine);
  return bits.join(' · ');
}

function dietaryBadges(p) {
  if (!p.dietary) return '';
  const badges = [];
  if (p.dietary.vegan) badges.push('<span class="micro-badge badge-vegan" title="Estimated from listed ingredients — confirm with staff">🌱 Vegan*</span>');
  if (p.dietary.lowCaffeine) badges.push('<span class="micro-badge badge-decaf" title="Low Caffeine / Decaf">🌿 Low-Caf</span>');
  if (p.dietary.sugarFree) badges.push('<span class="micro-badge badge-sugarfree" title="Refined Sugar Free">🍯 Sugar-Free</span>');
  if (p.dietary.nutFree) badges.push('<span class="micro-badge badge-nutfree" title="Estimated — not allergy-safe. Confirm allergies with staff">🥜 No nuts listed*</span>');
  return badges.length ? `<div class="card-dietary-badges">${badges.slice(0, 3).join('')}</div>` : '';
}

function getSensoryData(p) {
  let sw = 2.2, ac = 2.4, bo = 3.2, ca = 2.5, ar = 3.8;
  const n = (p.notes || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  const tags = p.tags || [];

  if (n.includes('honey') || n.includes('caramel') || n.includes('sugar') || n.includes('vanilla') || n.includes('cream') || tags.includes('sweet') || p.category === 'dessert' || p.category === 'bakery') sw += 1.8;
  if (n.includes('chocolate') || n.includes('cocoa') || n.includes('molasses') || n.includes('nut') || tags.includes('chocolate') || tags.includes('bold')) bo += 1.3;
  if (n.includes('orange') || n.includes('citrus') || n.includes('cherry') || n.includes('acidity') || n.includes('jasmine') || name.includes('cortado') || name.includes('matcha') || tags.includes('bright')) ac += 1.7;
  
  if (p.roast) {
    const r = p.roast.toLowerCase();
    if (r.includes('light')) { ac += 0.8; bo -= 0.3; }
    if (r.includes('dark')) { bo += 1.3; ac -= 0.6; }
  }

  if (p.caffeineMg) {
    ca = Math.min(5, Math.max(1, p.caffeineMg / 36));
  } else if (p.caffeine === 'Very High') ca = 4.9;
  else if (p.caffeine === 'High') ca = 4.2;
  else if (p.caffeine === 'Low') ca = 1.4;
  else ca = 2.8;

  if (tags.includes('signature') || p.tier === 1) ar += 0.8;

  sw = Math.min(5, Math.max(1.2, sw));
  ac = Math.min(5, Math.max(1.2, ac));
  bo = Math.min(5, Math.max(1.2, bo));
  ca = Math.min(5, Math.max(1.0, ca));
  ar = Math.min(5, Math.max(1.8, ar));

  return {
    sweetness: Number(sw.toFixed(1)),
    acidity: Number(ac.toFixed(1)),
    body: Number(bo.toFixed(1)),
    caffeine: Number(ca.toFixed(1)),
    aroma: Number(ar.toFixed(1))
  };
}

function generateSensorySvg(sensory) {
  const cx = 95, cy = 95, R = 54;
  const axes = [
    { label: 'SWEET', val: sensory.sweetness, angle: -Math.PI / 2, icon: '🍯' },
    { label: 'AROMA', val: sensory.aroma, angle: -Math.PI / 2 + (2 * Math.PI / 5), icon: '🌸' },
    { label: 'ACIDITY', val: sensory.acidity, angle: -Math.PI / 2 + (4 * Math.PI / 5), icon: '🍋' },
    { label: 'BODY', val: sensory.body, angle: -Math.PI / 2 + (6 * Math.PI / 5), icon: '☕' },
    { label: 'CAFFEINE', val: sensory.caffeine, angle: -Math.PI / 2 + (8 * Math.PI / 5), icon: '⚡' }
  ];

  const polyPoints = axes.map(a => {
    const r = (a.val / 5) * R;
    const x = (cx + r * Math.cos(a.angle)).toFixed(1);
    const y = (cy + r * Math.sin(a.angle)).toFixed(1);
    return `${x},${y}`;
  }).join(' ');

  const gridRings = [0.35, 0.68, 1.0].map(ratio => {
    const pts = axes.map(a => {
      const r = ratio * R;
      return `${(cx + r * Math.cos(a.angle)).toFixed(1)},${(cy + r * Math.sin(a.angle)).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" class="radar-grid-pentagon" />`;
  }).join('');

  const axisLines = axes.map(a => {
    const x2 = (cx + R * Math.cos(a.angle)).toFixed(1);
    const y2 = (cy + R * Math.sin(a.angle)).toFixed(1);
    return `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" class="radar-axis-line" />`;
  }).join('');

  const nodes = axes.map(a => {
    const r = (a.val / 5) * R;
    const x = (cx + r * Math.cos(a.angle)).toFixed(1);
    const y = (cy + r * Math.sin(a.angle)).toFixed(1);
    return `<circle cx="${x}" cy="${y}" r="2.8" class="radar-polygon-node" />
            <circle cx="${x}" cy="${y}" r="5" class="radar-node-pulse" />`;
  }).join('');

  const labels = axes.map(a => {
    const labelR = R + 16;
    const lx = (cx + labelR * Math.cos(a.angle)).toFixed(1);
    const ly = (cy + labelR * Math.sin(a.angle) + 3).toFixed(1);
    return `<text x="${lx}" y="${ly}" class="radar-axis-label" text-anchor="middle">${a.label} ${a.val}</text>`;
  }).join('');

  return `
    <svg class="sensory-3d-svg" viewBox="0 0 190 190">
      <defs>
        <radialGradient id="sensoryWebGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffd572" stop-opacity="0.65"/>
          <stop offset="60%" stop-color="#c89550" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#8c5828" stop-opacity="0.08"/>
        </radialGradient>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="78" class="radar-orbit-ring" />
      <circle cx="${cx}" cy="${cy}" r="68" class="radar-orbit-dashed" />
      <circle cx="${cx}" cy="${cy - 78}" r="3" class="radar-orbit-bead" />
      ${gridRings}
      ${axisLines}
      <polygon points="${polyPoints}" class="radar-polygon-fill" />
      ${nodes}
      ${labels}
    </svg>
  `;
}

function makeRadarOverlay(p) {
  const sensory = getSensoryData(p);

  const cx = 32, cy = 32, r = 18;
  const pTop = `${cx},${(cy - (r * sensory.sweetness / 5)).toFixed(1)}`;
  const pRight = `${(cx + (r * sensory.acidity / 5)).toFixed(1)},${cy}`;
  const pBottom = `${cx},${(cy + (r * sensory.body / 5)).toFixed(1)}`;
  const pLeft = `${(cx - (r * sensory.caffeine / 5)).toFixed(1)},${cy}`;

  return `
    <button type="button" class="card-radar-widget" data-radar-target="${p.id}" aria-label="Explore 3D Sensory Radar">
      <svg class="radar-mini-svg" viewBox="0 0 64 64" width="26" height="26">
        <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(212,175,55,0.4)" stroke-width="1.2" stroke-dasharray="3 3"/>
        <circle cx="32" cy="32" r="12" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.8"/>
        <polygon points="${pTop} ${pRight} ${pBottom} ${pLeft}" fill="rgba(212, 175, 55, 0.55)" stroke="#f5d061" stroke-width="1.5"/>
      </svg>
      <span class="radar-mini-tag"><i class="fa-solid fa-atom"></i> 3D RADAR</span>
    </button>

    <!-- 3D Holographic Sensory Matrix Popover Overlay -->
    <div class="card-sensory-overlay" id="sensoryOverlay-${p.id}" data-overlay-id="${p.id}">
      <div class="border-beam"></div>
      <div class="sensory-hud-header">
        <div class="sensory-hud-title">
          <span class="live-ping-dot"></span>
          <span>3D SENSORY MATRIX</span>
        </div>
        <button type="button" class="sensory-hud-close" data-close-radar="${p.id}" aria-label="Close 3D Matrix">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="sensory-hud-wheel-stage">
        ${generateSensorySvg(sensory)}
      </div>

      <div class="sensory-hud-metrics">
        <div class="sensory-metric-item">
          <span>Sweetness</span>
          <div class="sensory-bar-track"><div class="sensory-bar-fill" style="width: ${sensory.sweetness * 20}%"></div></div>
          <strong>${sensory.sweetness}</strong>
        </div>
        <div class="sensory-metric-item">
          <span>Acidity</span>
          <div class="sensory-bar-track"><div class="sensory-bar-fill" style="width: ${sensory.acidity * 20}%"></div></div>
          <strong>${sensory.acidity}</strong>
        </div>
        <div class="sensory-metric-item">
          <span>Body</span>
          <div class="sensory-bar-track"><div class="sensory-bar-fill" style="width: ${sensory.body * 20}%"></div></div>
          <strong>${sensory.body}</strong>
        </div>
      </div>

      <div class="sensory-hud-footer">
        <span><i class="fa-solid fa-mug-saucer"></i> ${p.roast || 'Medium Roast'}</span>
        <span><i class="fa-solid fa-bolt"></i> ${p.caffeineMg ? p.caffeineMg + 'mg caf' : (p.caffeine || 'Medium')}</span>
      </div>
    </div>
  `;
}

// Coffee Darbar menu card — the same build as the homepage lineup: a live 3D cup
// (drawn by darbar-3d.js into .cup-view), Anton name, round add button.
// Bakery items have no cup, so they sit in a gold-framed arch photo instead.
const CUP_STYLE = { 1: 'espresso', 2: 'latte', 4: 'frappe', 5: 'matcha', 6: 'midnight', 8: 'focus', 12: 'sage', 13: 'cappuccino', 14: 'mocha', 26: 'coldbrew', 29: 'pourover', 34: 'caramel' };

function cardBadge(p) {
  if (p.tier === 3) return { label: p.tags.includes('vegan') ? 'Vegan' : p.tags.includes('dessert') ? 'Dessert' : p.tags.includes('healthy') ? 'Fresh Kitchen' : 'Fresh Bake', dark: false };
  if (p.caffeine === 'Very High') return { label: 'Strong', dark: true };
  if (p.tags.includes('cold')) return { label: 'Iced', dark: true };
  if (p.tags.includes('bestseller')) return { label: 'Best Seller', dark: false };
  if (p.tags.includes('top-rated')) return { label: 'Top Rated', dark: false };
  return { label: p.tier === 1 ? 'Signature' : 'House', dark: false };
}
// "Salted Caramel Latte" → "Salted Caramel<br>Latte": two stacked lines like the lineup
function stackedName(name) {
  const i = name.lastIndexOf(' ');
  return i > 0 ? name.slice(0, i) + '<br>' + name.slice(i + 1) : name;
}

function createCardHTML(p) {
  const isFav = favorites.includes(p.id);
  const cup = CUP_STYLE[p.id];
  const badge = cardBadge(p);
  const notes = (p.notes || p.ingredients || p.desc || '').split(/,\s*/).slice(0, 3).join(' · ');
  const origin = p.origin || (p.tier === 3 ? (p.tags.includes('bakery') || p.tags.includes('dessert') ? 'Baked in-house' : 'Made to order') : '');
  const stage = cup
    ? `<div class="cup-view mx-cup" data-view="cup" data-style="${cup}"></div>`
    : `<figure class="mx-arch"><img src="${p.img}" alt="" loading="lazy"></figure>`;
  return `<article class="dx-card mx ${cup ? 'has-cup' : 'is-bake'} tier-${p.tier}" data-id="${p.id}" data-testid="coffee-card-${p.id}" tabindex="0" aria-label="${p.name}, ₹${p.price}">
    <span class="mx-light" aria-hidden="true"></span>
    <div class="mx-top">
      <span class="mx-badge${badge.dark ? ' is-dark' : ''}">${badge.label}</span>
      <span class="mx-price"><small>₹</small>${p.price}</span>
    </div>
    <div class="mx-stage" aria-hidden="true"><span class="mx-floor"></span>${stage}</div>
    <div class="mx-bottom">
      <h3 class="mx-name">${stackedName(p.name)}</h3>
      <button class="mx-add dx-add" data-name="${p.name}" data-price="${p.price}" data-caffeine="${p.caffeineMg || 0}" data-testid="add-to-cart-${p.id}" aria-label="Add ${p.name} to order"><i class="fa-solid fa-plus"></i></button>
    </div>
    <p class="mx-notes">${notes}</p>
    <div class="mx-meta">
      <span class="mx-origin">${origin}</span>
      <span class="mx-stars">${starRow(p.rating)}<b>${p.rating}</b></span>
    </div>
    <div class="mx-tools">
      <button class="heart-btn card-heart mx-heart${isFav ? ' is-favorite' : ''}" data-fav-id="${p.id}" data-testid="favorite-btn-${p.id}" aria-label="Save ${p.name} to favorites"><i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i></button>
      <button class="mx-quick dx-quick" data-quickview-id="${p.id}" data-testid="quickview-btn-${p.id}" aria-label="View ${p.name} details" title="Details"><i class="fa-solid fa-expand"></i></button>
    </div>
  </article>`;
}

// Tall editorial photo that leads the Signature and House grids (same as the homepage lineup)
const LEAD = {
  1: { img: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=80', kicker: 'Signature', line: 'Six cups.<br>One court.' },
  2: { img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', kicker: 'House', line: 'The everyday,<br>done royally.' },
};
function leadPhoto(tier, count) {
  const l = LEAD[tier];
  if (!l || count < 3) return '';
  return `<figure class="mx-photo" aria-hidden="true"><img src="${l.img}" alt="" loading="lazy"><figcaption><span>${l.kicker}</span>${l.line}</figcaption></figure>`;
}

function renderProducts() {
  const filtered = PRODUCTS.filter(matchesProduct);
  const grid1 = $('#tier1Grid'), grid2 = $('#tier2Grid'), grid3 = $('#tier3Grid');
  const t1 = filtered.filter(p => p.tier === 1), t2 = filtered.filter(p => p.tier === 2), t3 = filtered.filter(p => p.tier === 3);
  if (grid1) { grid1.innerHTML = leadPhoto(1, t1.length) + t1.map(createCardHTML).join(''); grid1.classList.toggle('mx-with-photo', t1.length >= 3); $('#tier1Section').style.display = t1.length ? '' : 'none'; }
  if (grid2) { grid2.innerHTML = leadPhoto(2, t2.length) + t2.map(createCardHTML).join(''); grid2.classList.toggle('mx-with-photo', t2.length >= 3); $('#tier2Section').style.display = t2.length ? '' : 'none'; }
  if (grid3) { grid3.innerHTML = t3.map(createCardHTML).join(''); $('#tier3Section').style.display = t3.length ? '' : 'none'; }
  const empty = $('#menuEmpty');
  if (empty) empty.style.display = filtered.length ? 'none' : 'block';
  wireCardInteractions();
}

function wireCardInteractions() {
  // Tilt, parallax and reveal are handled by darbar-motion.js.
  // Clicking anywhere on a card (outside its buttons) opens the quick view.
  $$('.dx-card').forEach(card => {
    const open = () => openQuickView(Number(card.dataset.id));
    card.addEventListener('click', e => { if (!e.target.closest('button, a, .card-sensory-overlay')) open(); });
    card.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === card) { e.preventDefault(); open(); } });
  });

  // Add button: brief "added" confirmation (the cart itself is handled by script.js)
  $$('.dx-add').forEach(btn => btn.addEventListener('click', () => {
    btn.classList.remove('is-added'); void btn.offsetWidth; btn.classList.add('is-added');
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.classList.remove('is-added'); btn.innerHTML = '<i class="fa-solid fa-plus"></i>'; }, 1600);
  }));

  // Wire 3D Sensory Radar Widget & Overlay
  $$('.card-radar-widget').forEach(btn => {
    const card = btn.closest('.dx-card');
    const overlay = card ? card.querySelector('.card-sensory-overlay') : null;

    if (overlay) {
      // Hover activation
      btn.addEventListener('mouseenter', () => {
        $$('.card-sensory-overlay.is-active').forEach(o => { if (o !== overlay) o.classList.remove('is-active'); });
        overlay.classList.add('is-active');
        if (window.HardiAudio && typeof window.HardiAudio.playBrassClick === 'function') {
          window.HardiAudio.playBrassClick();
        }
      });

      // Click toggle
      btn.addEventListener('click', e => {
        e.stopPropagation();
        overlay.classList.toggle('is-active');
        if (window.HardiAudio && typeof window.HardiAudio.playBrassClick === 'function') {
          window.HardiAudio.playBrassClick();
        }
      });
    }
  });

  // Interactive 3D Perspective Tilt on the Sensory HUD (Cached Bounds & rAF Throttled)
  $$('.card-sensory-overlay').forEach(overlay => {
    let cachedRect = null;
    let hudRaf = null;

    overlay.addEventListener('mouseenter', () => {
      cachedRect = overlay.getBoundingClientRect();
    }, { passive: true });

    overlay.addEventListener('mousemove', e => {
      if (!cachedRect) cachedRect = overlay.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (hudRaf) return;
      hudRaf = requestAnimationFrame(() => {
        if (!cachedRect) return;
        const px = (clientX - cachedRect.left) / cachedRect.width - .5;
        const py = (clientY - cachedRect.top) / cachedRect.height - .5;
        const stage = overlay.querySelector('.sensory-hud-wheel-stage');
        if (stage) {
          stage.style.transform = `perspective(500px) rotateX(${(-py * 12).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg) translateZ(12px)`;
        }
        hudRaf = null;
      });
    }, { passive: true });

    overlay.addEventListener('mouseleave', () => {
      if (hudRaf) {
        cancelAnimationFrame(hudRaf);
        hudRaf = null;
      }
      cachedRect = null;
      const stage = overlay.querySelector('.sensory-hud-wheel-stage');
      if (stage) stage.style.transform = '';
    }, { passive: true });
  });

  // Close HUD on close button or leaving media card
  $$('.sensory-hud-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      const overlay = closeBtn.closest('.card-sensory-overlay');
      if (overlay) overlay.classList.remove('is-active');
    });
  });

  $$('.dx-card').forEach(media => {
    media.addEventListener('mouseleave', () => {
      const overlay = media.querySelector('.card-sensory-overlay');
      if (overlay) overlay.classList.remove('is-active');
    });
  });

  $$('.card-heart').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    const id = Number(btn.dataset.favId);
    favorites = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    localStorage.setItem('hardiFavorites', JSON.stringify(favorites));
    btn.classList.toggle('is-favorite');
    btn.innerHTML = `<i class="fa-${favorites.includes(id) ? 'solid' : 'regular'} fa-heart"></i>`;
  }));
  $$('.dx-quick').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); openQuickView(Number(btn.dataset.quickviewId)); }));
}

const REVIEWERS = ['Aditi R.', 'Kabir S.', 'Meera P.', 'Rohan V.', 'Zara K.', 'Ishaan M.', 'Naina D.', 'Vivek T.'];
const REVIEW_PHRASES = ['exactly what I needed today', 'became my new usual order', 'tastes even better than it looks', 'perfect with a window seat', 'my go-to before deadlines', 'worth the walk across campus'];
function mockReviews(p) {
  const shuffled = [...REVIEWERS].sort(() => Math.random() - .5).slice(0, 2);
  return shuffled.map(name => ({ name, rating: Math.max(3.5, Math.min(5, p.rating + (Math.random() - .5) * .4)).toFixed(1), text: `${REVIEW_PHRASES[Math.floor(Math.random() * REVIEW_PHRASES.length)]} — the ${p.name} is worth it.` }));
}

function row(label, value) { return value ? `<div class="qv-row"><span>${label}</span><b>${value}</b></div>` : ''; }

function openQuickView(id) {
  const p = PRODUCTS.find(x => x.id === id);
  const modal = $('#quickViewModal');
  if (!p || !modal) return;
  const sensory = getSensoryData(p);
  $('#qvImg').src = p.img;
  $('#qvImg').alt = p.name;
  $('#qvName').textContent = p.name;
  $('#qvStars').innerHTML = starRow(p.rating) + ` <span>${p.rating}</span>`;
  $('#qvStory').innerHTML = p.story ? p.story.join('<br>') : p.desc;

  const sensoryBox = `
    <div class="qv-sensory-box">
      <div class="qv-sensory-head"><span class="live-ping-dot"></span> 3D SENSORY PROFILE & ELEMENTS</div>
      <div class="qv-sensory-body">
        <div class="qv-sensory-dial">${generateSensorySvg(sensory)}</div>
        <div class="qv-sensory-pills">
          <div class="qv-pill-item" style="--v:${sensory.sweetness / 5}"><span>Sweetness</span><strong>${sensory.sweetness} / 5</strong></div>
          <div class="qv-pill-item" style="--v:${sensory.aroma / 5}"><span>Aroma Bloom</span><strong>${sensory.aroma} / 5</strong></div>
          <div class="qv-pill-item" style="--v:${sensory.acidity / 5}"><span>Acidity Level</span><strong>${sensory.acidity} / 5</strong></div>
          <div class="qv-pill-item" style="--v:${sensory.body / 5}"><span>Body & Texture</span><strong>${sensory.body} / 5</strong></div>
          <div class="qv-pill-item" style="--v:${sensory.caffeine / 5}"><span>Active Caffeine</span><strong>${sensory.caffeine} / 5</strong></div>
        </div>
      </div>
    </div>
  `;

  $('#qvMeta').innerHTML = [
    row('Origin', p.origin),
    row('Roast level', p.roast),
    row('Bean', p.bean),
    row('Milk', p.milk),
    row('Flavor notes', p.notes),
    row('Ingredients', p.ingredients),
    row('Calories', p.cal ? `${p.cal} kcal` : ''),
    row('Caffeine', p.caffeine),
    row('Brewing method', p.brew),
    row('Mood', p.mood)
  ].join('');
  $('#qvSensory').innerHTML = sensoryBox;
  $('#qvKicker').textContent = p.tier === 1 ? 'Signature Collection' : p.tier === 2 ? 'House Favourite' : 'Bakery & Bites';
  $('#qvPrice').innerHTML = `<small>₹</small>${p.price}`;

  $('#qvPairing').innerHTML = p.pairing ? `<i class="fa-solid fa-utensils"></i> Pairs perfectly with <b>${p.pairing}</b>` : '';
  $('#qvReviews').innerHTML = mockReviews(p).map(r => `<div class="qv-review"><b>${r.name}</b> <span>${'★'.repeat(Math.round(r.rating))}</span><p>${r.text}</p></div>`).join('');
  $('#qvAddBtn').dataset.name = p.name;
  $('#qvAddBtn').dataset.price = p.price;
  $('#qvAddBtn').textContent = `Add to cart · ₹${p.price}`;
  modal.classList.add('open');
  document.body.classList.add('modal-lock');
}
function initQuickView() {
  const modal = $('#quickViewModal');
  if (!modal) return;
  $('#qvClose')?.addEventListener('click', () => { modal.classList.remove('open'); document.body.classList.remove('modal-lock'); });
  modal.addEventListener('click', e => { if (e.target === modal) { modal.classList.remove('open'); document.body.classList.remove('modal-lock'); } });
  $('#qvAddBtn')?.addEventListener('click', () => window.addToCart($('#qvAddBtn').dataset.name, Number($('#qvAddBtn').dataset.price)));
}

// ---------------- Build Your Own Coffee — Darbar AI engine ----------------
const BUILDER = {
  base: { Espresso: { traits: { energy: 3, focus: 2 }, cal: 5, price: 220, caffeine: 65 }, 'Double Espresso': { traits: { energy: 4, focus: 2 }, cal: 10, price: 250, caffeine: 130 }, 'Cold Brew': { traits: { energy: 2, freshness: 2 }, cal: 5, price: 230, caffeine: 100 }, 'Filter Coffee': { traits: { focus: 2, comfort: 1 }, cal: 5, price: 210, caffeine: 95 }, Matcha: { traits: { focus: 1, freshness: 2, comfort: 1 }, cal: 25, price: 260, caffeine: 30 } },
  milk: { 'Whole Milk': { traits: { comfort: 2 }, cal: 60, price: 0 }, 'Oat Milk': { traits: { comfort: 1, freshness: 1 }, cal: 45, price: 20 }, 'Almond Milk': { traits: { freshness: 1 }, cal: 30, price: 25 }, 'Skimmed Milk': { traits: { focus: 1 }, cal: 35, price: 0 }, 'No Milk': { traits: { energy: 1, focus: 1 }, cal: 0, price: 0 } },
  sweetener: { None: { traits: { focus: 1 }, cal: 0, price: 0 }, 'Brown Sugar': { traits: { comfort: 1 }, cal: 20, price: 0 }, Honey: { traits: { comfort: 1, freshness: 1 }, cal: 25, price: 10 }, 'Vanilla Syrup': { traits: { indulgence: 1 }, cal: 30, price: 0 }, Stevia: { traits: { focus: 1 }, cal: 0, price: 0 } },
  flavor: { None: { traits: {}, cal: 0, price: 0 }, Caramel: { traits: { indulgence: 2 }, cal: 35, price: 25 }, Hazelnut: { traits: { comfort: 1, indulgence: 1 }, cal: 30, price: 25 }, Vanilla: { traits: { comfort: 1 }, cal: 25, price: 25 }, 'Irish Syrup': { traits: { indulgence: 1, comfort: 1 }, cal: 35, price: 25 }, 'Pumpkin Spice': { traits: { comfort: 2, indulgence: 1 }, cal: 30, price: 25 }, Cinnamon: { traits: { comfort: 1, freshness: 1 }, cal: 10, price: 25 }, Chocolate: { traits: { indulgence: 2 }, cal: 40, price: 25 } },
  strength: { Mild: { traits: { comfort: 1 }, mult: .7 }, Classic: { traits: {}, mult: 1 }, Bold: { traits: { energy: 2 }, mult: 1.3 }, 'Extra Bold': { traits: { energy: 3, focus: 1 }, mult: 1.6 } },
  temperature: { Hot: { traits: { comfort: 1 } }, Iced: { traits: { freshness: 2 } }, 'Frappe (Blended)': { traits: { indulgence: 2 } } },
  roast: { Light: { traits: { freshness: 1 }, desc: 'Bright, floral aroma' }, Medium: { traits: { comfort: 1 }, desc: 'Balanced, nutty aroma' }, Dark: { traits: { energy: 1, focus: 1 }, desc: 'Deep, smoky aroma' } },
  cupSize: { Regular: { price: 0, calMult: 1 }, Large: { price: 40, calMult: 1.3 } },
  toppings: { 'Whipped Cream': { traits: { indulgence: 2 }, cal: 50, price: 15 }, 'Chocolate Drizzle': { traits: { indulgence: 2 }, cal: 30, price: 15 }, 'Hazelnut Crumble': { traits: { indulgence: 1, comfort: 1 }, cal: 35, price: 15 }, 'Caramel Drizzle': { traits: { indulgence: 2 }, cal: 30, price: 15 }, 'Cinnamon Dust': { traits: { comfort: 1 }, cal: 5, price: 15 }, 'Cookie Crumble': { traits: { indulgence: 2 }, cal: 40, price: 15 } }
};
const ADJ_BANK = { energy: ['Bold', 'Electric', 'Wide-Awake', 'Charged', 'Live-Wire'], comfort: ['Velvet', 'Cozy', 'Gentle', 'Soft-Hour', 'Hearth'], freshness: ['Bright', 'Crisp', 'Clear-Sky', 'Citrus-Lit', 'Dew-Fresh'], indulgence: ['Golden', 'Rich', 'Decadent', 'Silken', 'Velour'], focus: ['Clean-Line', 'Steady', 'Quiet-Mind', 'Precision', 'Sharp-Focus'] };
const SUFFIX_BANK = ['Reverie', 'Hour', 'Ritual', 'Voyage', 'Bloom', 'Sonata', 'Note', 'Verse'];
const BASE_NOUN = { Espresso: 'Shot', 'Double Espresso': 'Double', 'Cold Brew': 'Brew', 'Filter Coffee': 'Drip', Matcha: 'Bloom' };
const SENTENCE1_BANK = { energy: ['Built to wake up the room, not just you.', 'Every sip pushes the morning forward.'], comfort: ['Made for slow mornings and no particular rush.', 'Wrapped in warmth from the first sip.'], freshness: ['Clean, bright, and wide awake.', 'Tastes like a window thrown open.'], indulgence: ['Unapologetically rich, one slow sip at a time.', 'A little indulgence, fully intended.'], focus: ['Built for the task in front of you.', 'Clarity, in a cup.'] };
const MUSIC_BANK = { energy: ['Upbeat indie playlist', 'High-tempo running mix'], comfort: ['Acoustic Sunday morning', 'Soft piano instrumentals'], freshness: ['Bossa nova mornings', 'Light indie-folk'], indulgence: ['Smooth jazz evenings', 'Velvet soul classics'], focus: ['Lo-fi study beats', 'Ambient focus tracks'] };
const BOOK_BANK = { energy: ['A fast-paced thriller', 'An adventure novel'], comfort: ['A slow, comforting novel', 'A collection of gentle essays'], freshness: ['A travel memoir', 'A collection of short stories'], indulgence: ['A decadent food memoir', 'A love story with no rush'], focus: ['A page of deep-work non-fiction', 'A structured how-to book'] };
const PAIRING_BANK = { energy: 'Protein Oat Cookie', comfort: 'Cinnamon Roll', freshness: 'Citrus Tart', indulgence: 'Fudge Brownie', focus: 'Almond Biscotti' };
const MOOD_BANK = { energy: 'Energised & Ready', comfort: 'Calm & Cozy', freshness: 'Light & Refreshed', indulgence: 'Indulgent & Relaxed', focus: 'Sharp & Focused' };
const NOTE_BANK = { energy: ["Drink this before anything that matters today."], comfort: ["Take this one slow — no refills needed."], freshness: ["Best sipped near an open window."], indulgence: ["We won't tell if you have dessert first."], focus: ["Quiet corner, this cup, and nothing else."] };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function generateCoffee(sel) {
  const traitTotals = { energy: 0, comfort: 0, freshness: 0, indulgence: 0, focus: 0 };
  const addTraits = t => { if (!t) return; Object.keys(t).forEach(k => { traitTotals[k] += t[k]; }); };
  addTraits(BUILDER.base[sel.base].traits);
  addTraits(BUILDER.milk[sel.milk].traits);
  addTraits(BUILDER.sweetener[sel.sweetener].traits);
  addTraits(BUILDER.flavor[sel.flavor].traits);
  addTraits(BUILDER.strength[sel.strength].traits);
  addTraits(BUILDER.temperature[sel.temperature].traits);
  addTraits(BUILDER.roast[sel.roast].traits);
  sel.toppings.forEach(t => addTraits(BUILDER.toppings[t].traits));
  const dominant = Object.keys(traitTotals).sort((a, b) => traitTotals[b] - traitTotals[a])[0];

  const cal = Math.round((BUILDER.base[sel.base].cal + BUILDER.milk[sel.milk].cal + BUILDER.sweetener[sel.sweetener].cal + BUILDER.flavor[sel.flavor].cal + sel.toppings.reduce((s, t) => s + BUILDER.toppings[t].cal, 0)) * BUILDER.cupSize[sel.cupSize].calMult);
  const price = BUILDER.base[sel.base].price + BUILDER.milk[sel.milk].price + BUILDER.sweetener[sel.sweetener].price + BUILDER.flavor[sel.flavor].price + sel.toppings.reduce((s, t) => s + BUILDER.toppings[t].price, 0) + BUILDER.cupSize[sel.cupSize].price;
  const caffeineMg = Math.round(BUILDER.base[sel.base].caffeine * BUILDER.strength[sel.strength].mult);
  const caffeineLevel = caffeineMg < 60 ? 'Low' : caffeineMg < 100 ? 'Medium' : caffeineMg < 150 ? 'High' : 'Very High';

  const adj = pick(ADJ_BANK[dominant]);
  const noun = BASE_NOUN[sel.base];
  const flavorWord = sel.flavor !== 'None' ? sel.flavor.split(' ')[0] : '';
  const suffix = Math.random() < .5 ? ` ${pick(SUFFIX_BANK)}` : '';
  const name = flavorWord ? `${adj} ${flavorWord} ${noun}${suffix}` : `${adj} ${noun}${suffix}`;

  const brew = sel.temperature === 'Frappe (Blended)' ? 'Blended cold with ice, crowned with toppings' : sel.temperature === 'Iced' ? `${sel.base} brewed, then poured over ice` : sel.base === 'Matcha' ? 'Whisked stone-ground matcha with hot water' : sel.base === 'Filter Coffee' ? 'Poured over by hand, filtered slow' : sel.base === 'Cold Brew' ? 'Steeped cold for 18 hours, served warm' : 'Pulled fresh from the espresso machine';
  const aroma = `${BUILDER.roast[sel.roast].desc}${sel.flavor !== 'None' ? `, laced with ${sel.flavor.toLowerCase()}` : ''}`;
  const story = `${pick(SENTENCE1_BANK[dominant])} ${BUILDER.roast[sel.roast] ? sel.roast.toLowerCase() : ''} roast, ${sel.milk === 'No Milk' ? 'no milk' : sel.milk.toLowerCase()}, finished with ${sel.flavor === 'None' ? 'nothing but the coffee itself' : sel.flavor.toLowerCase()}.`;

  return {
    name, story, cal, price, caffeineLevel,
    aroma, roastDescription: BUILDER.roast[sel.roast].desc,
    dessertPairing: PAIRING_BANK[dominant], music: pick(MUSIC_BANK[dominant]), book: pick(BOOK_BANK[dominant]),
    productivity: Math.max(1, Math.min(10, Math.round(5 + traitTotals.energy * 1.2 + traitTotals.focus * 1.5 - traitTotals.comfort * .8 - traitTotals.indulgence * .6))),
    mood: MOOD_BANK[dominant], brew, baristaNote: pick(NOTE_BANK[dominant])
  };
}

function optionButtons(name, options) {
  return Object.keys(options).map(key => `<button class="builder-opt" data-group="${name}" data-value="${key}" data-testid="builder-${name.toLowerCase()}-${key.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}">${key}</button>`).join('');
}

function initBuilder() {
  const root = $('#builderSection');
  if (!root) return;
  const groups = ['base', 'milk', 'sweetener', 'flavor', 'strength', 'temperature', 'roast', 'cupSize'];
  groups.forEach(g => { const el = $(`#opt-${g}`); if (el) el.innerHTML = optionButtons(g, BUILDER[g]); });
  $('#opt-toppings').innerHTML = optionButtons('toppings', BUILDER.toppings);

  const selections = { base: 'Espresso', milk: 'Whole Milk', sweetener: 'None', flavor: 'None', strength: 'Classic', temperature: 'Hot', roast: 'Medium', cupSize: 'Regular', toppings: [] };
  function setDefaultActive() {
    groups.forEach(g => $(`.builder-opt[data-group="${g}"][data-value="${selections[g]}"]`)?.classList.add('active'));
  }
  setDefaultActive();

  root.addEventListener('click', e => {
    const btn = e.target.closest('.builder-opt');
    if (!btn) return;
    const group = btn.dataset.group, value = btn.dataset.value;
    if (group === 'toppings') {
      btn.classList.toggle('active');
      toppingSelection.has(value) ? toppingSelection.delete(value) : toppingSelection.add(value);
      selections.toppings = [...toppingSelection];
    } else {
      $$(`.builder-opt[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selections[group] = value;
    }
  });

  $('#generateCoffeeBtn')?.addEventListener('click', () => {
    const result = generateCoffee(selections);
    const card = $('#recipeCard');
    card.innerHTML = `
      <span class="recipe-eyebrow">Darbar AI recommends</span>
      <h3 data-testid="recipe-name">${result.name}</h3>
      <p class="recipe-story">${result.story}</p>
      <div class="recipe-grid">
        <div><span>Aroma</span><b>${result.aroma}</b></div>
        <div><span>Roast notes</span><b>${result.roastDescription}</b></div>
        <div><span>Caffeine</span><b>${result.caffeineLevel}</b></div>
        <div><span>Calories</span><b>${result.cal} kcal</b></div>
        <div><span>Brewing method</span><b>${result.brew}</b></div>
        <div><span>Mood match</span><b>${result.mood}</b></div>
        <div><span>Dessert pairing</span><b>${result.dessertPairing}</b></div>
        <div><span>Productivity score</span><b>${result.productivity}/10</b></div>
        <div><span>Music</span><b>${result.music}</b></div>
        <div><span>Book</span><b>${result.book}</b></div>
      </div>
      <p class="recipe-note">"${result.baristaNote}" <span>— your barista</span></p>
      <div class="recipe-actions"><b>₹${result.price}</b><button class="btn btn-brass" id="recipeAddBtn" data-testid="recipe-add-to-cart">Add to cart</button></div>`;
    card.classList.add('revealed');
    $('#recipeAddBtn').addEventListener('click', () => window.addToCart(result.name, result.price));
  });
}

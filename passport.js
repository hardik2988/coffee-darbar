// Coffee Darbar — Coffee Passport interactions
(function () {
  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];
  const GSAP = window.gsap;
  const ORIGINS = window.ORIGINS || [];
  const VISITED_KEY = 'hardiPassportVisited';
  let currentOrigin = null;

  const ORIGIN_ALTITUDES = {
    brazil: 1050,
    colombia: 1800,
    ethiopia: 2050,
    india: 1150,
    vietnam: 1500
  };

  function getVisited() {
    try { return JSON.parse(localStorage.getItem(VISITED_KEY)) || []; } catch (e) { return []; }
  }
  function markVisited(id) {
    const visited = getVisited();
    if (!visited.includes(id)) { visited.push(id); localStorage.setItem(VISITED_KEY, JSON.stringify(visited)); }
    return visited;
  }

  function renderTabs(activeId) {
    const wrap = $('#originTabs');
    if (!wrap) return;
    const visited = getVisited();
    wrap.innerHTML = ORIGINS.map(o => `
      <button class="origin-tab${o.id === activeId ? ' active' : ''}${visited.includes(o.id) ? ' is-visited' : ''}" data-id="${o.id}" data-testid="origin-tab-${o.id}">
        <i class="fa-solid fa-location-dot"></i><span>${o.country}</span><i class="fa-solid fa-circle-check stamped-badge"></i>
      </button>`).join('');
    $$('.origin-tab', wrap).forEach(btn => btn.addEventListener('click', () => selectOrigin(btn.dataset.id)));
  }

  function renderPage(origin, animateStamp = false) {
    currentOrigin = origin;
    $('#pOriginTag').textContent = origin.roastLevel + ' roast';
    $('#pCountryName').textContent = origin.country;
    $('#pRegion').textContent = origin.region + ' · ' + origin.farm;
    $('#pFarmerStory').textContent = origin.farmerStory;
    $('#originPhoto').src = origin.image;
    $('#originPhoto').alt = origin.farm + ', ' + origin.country;
    $('#pDataGrid').innerHTML = `
      <div class="passport-data-item"><span>Altitude</span><strong>${origin.altitude}</strong></div>
      <div class="passport-data-item"><span>Roast level</span><strong>${origin.roastLevel}</strong></div>
      <div class="passport-data-item"><span>Harvest method</span><strong>${origin.harvestMethod}</strong></div>
      <div class="passport-data-item"><span>Processing method</span><strong>${origin.processingMethod}</strong></div>
      <div class="passport-flavor-chips">${origin.flavorNotes.map(n => `<span>${n}</span>`).join('')}</div>
    `;
    drawFlavorWheel(origin.profile);

    // Altitude sync
    const defaultAlt = ORIGIN_ALTITUDES[origin.id] || 1500;
    updateAltitudeIntel(defaultAlt);

    // Stamp state sync
    const stamp = $('#passportStamp');
    const stampBtn = $('#stampOriginBtn');
    const isStamped = getVisited().includes(origin.id);

    if (stamp) {
      stamp.classList.toggle('is-shown', isStamped);
      if (animateStamp && GSAP) {
        GSAP.fromTo(stamp, { scale: 2.8, opacity: 0, rotate: -40 }, { scale: 1, opacity: .92, rotate: -12, duration: .5, ease: 'back.out(2.4)' });
      }
    }

    if (stampBtn) {
      if (isStamped) {
        stampBtn.innerHTML = '<i class="fa-solid fa-check"></i> Origin Stamped';
        stampBtn.classList.add('btn-stamped');
      } else {
        stampBtn.innerHTML = '<i class="fa-solid fa-stamp"></i> Stamp this Origin';
        stampBtn.classList.remove('btn-stamped');
      }
    }
  }

  function updateAltitudeIntel(val) {
    const altGauge = $('#altGaugeVal');
    const altIntel = $('#altIntelText');
    const range = $('#altRange');
    if (altGauge) altGauge.textContent = `${Number(val).toLocaleString()} masl`;
    if (range) range.value = val;
    if (!altIntel) return;

    if (val < 1150) {
      altIntel.innerHTML = '<b>Lowland Density (800–1,150m):</b> Warm canopy air and dense oxygen promote rich dark chocolate, roasted hazelnut, heavy molasses, and mellow acidity.';
    } else if (val < 1650) {
      altIntel.innerHTML = '<b>Mid-Highland Equilibrium (1,150–1,650m):</b> Ideal balance between sugars and soft malic acids. Delivers crisp red apple, panela sugar, and silky medium body.';
    } else {
      altIntel.innerHTML = '<b>Extreme Alpine Maturation (1,650–2,300m):</b> Frigid mountain nights slow cherry development, concentrating rare floral aromatics: wild jasmine, peach nectar, and sparkling bergamot.';
    }
  }

  function createInkParticles() {
    const wrap = $('.passport-photo-wrap');
    if (!wrap) return;
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('span');
      p.className = 'ink-particle';
      const angle = Math.random() * Math.PI * 2;
      const dist = 24 + Math.random() * 45;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      wrap.appendChild(p);
      setTimeout(() => p.remove(), 600);
    }
  }

  function triggerStampAction() {
    if (!currentOrigin) return;
    const stamp = $('#passportStamp');
    const stampBtn = $('#stampOriginBtn');
    if (stamp) {
      stamp.classList.add('is-shown');
      if (GSAP) {
        GSAP.fromTo(stamp, { scale: 3, opacity: 0, rotate: -45 }, { scale: 1, opacity: .94, rotate: -12, duration: .45, ease: 'back.out(2.5)' });
      }
    }
    createInkParticles();
    markVisited(currentOrigin.id);
    renderTabs(currentOrigin.id);
    updateVisitedCount();
    if (stampBtn) {
      stampBtn.innerHTML = '<i class="fa-solid fa-check"></i> Origin Stamped';
      stampBtn.classList.add('btn-stamped');
    }
    if (window.toast) {
      window.toast(`${currentOrigin.country} stamped in your Coffee Passport!`);
    }
  }

  function selectOrigin(id) {
    const origin = ORIGINS.find(o => o.id === id);
    if (!origin) return;
    const page = $('#passportPage');
    const doRender = () => { renderPage(origin, false); renderTabs(id); };
    if (GSAP) {
      GSAP.to(page, { opacity: 0, y: 8, duration: .2, ease: 'power2.in', onComplete: () => { doRender(); GSAP.fromTo(page, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: .35, ease: 'power2.out' }); } });
    } else { doRender(); }
  }

  function updateVisitedCount() {
    const el = $('#visitedCount');
    if (el) el.textContent = getVisited().length;
  }

  function drawFlavorWheel(profile) {
    const canvas = $('#flavorWheel');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width, cx = size / 2, cy = size / 2, r = size * .38;
    const axes = [{ k: 'acidity', label: 'Acidity' }, { k: 'fruity', label: 'Fruity' }, { k: 'floral', label: 'Floral' }, { k: 'sweetness', label: 'Sweetness' }, { k: 'body', label: 'Body' }];
    const n = axes.length;
    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(212,175,55,.18)'; ctx.fillStyle = 'rgba(212,175,55,.8)';
    ctx.font = '10px DM Mono, monospace'; ctx.textAlign = 'center';
    for (let ring = 1; ring <= 5; ring++) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const rr = (r * ring) / 5;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    axes.forEach((ax, i) => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x = cx + Math.cos(a) * (r + 22), y = cy + Math.sin(a) * (r + 22);
      ctx.fillText(ax.label, x, y);
    });
    ctx.beginPath();
    axes.forEach((ax, i) => {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      const val = (profile[ax.k] || 0) / 5;
      const x = cx + Math.cos(a) * r * val, y = cy + Math.sin(a) * r * val;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(212,175,55,.32)';
    ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!$('#passportPage') || !ORIGINS.length) return;
    updateVisitedCount();
    renderTabs(ORIGINS[0].id);
    renderPage(ORIGINS[0], false);
    $('#stampOriginBtn')?.addEventListener('click', triggerStampAction);
    $('#altRange')?.addEventListener('input', e => updateAltitudeIntel(e.target.value));
    $('#beginJourneyBtn')?.addEventListener('click', () => $('#passportBook')?.scrollIntoView({ behavior: 'smooth' }));
  });
})();

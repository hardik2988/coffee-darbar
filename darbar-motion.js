// Coffee Darbar — shared motion for every page:
// smooth scroll, custom cursor, cards that tilt toward the cursor and react to scroll speed,
// magnetic buttons, and soft reveals.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const gsap = window.gsap;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ================================================================ */
  /* 1 · Smooth scroll                                                */
  /* ================================================================ */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({
      lerp: 0.12, wheelMultiplier: 1, smoothWheel: true,
      // let these panels scroll on their own
      prevent: node => !!(node && node.closest && node.closest('[data-lenis-prevent], .drawer, .modal, .cart-drawer, .qv-modal, .qv-panel, .dnav-overlay, .review-track, .xai-modal, .chat-panel, .chat-messages')),
    });
    window.__darbarLenis = window.__hardiLenis = lenis;
    if (gsap) {
      if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      const href = a && a.getAttribute('href');
      if (!href || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -90, duration: 1.5 });
    });
  }

  /* ================================================================ */
  /* 2 · Premium cards                                                */
  /* ================================================================ */
  const CARD_SEL = '.dx-card, .drink, .coffee-card, .review, .stats > div, .rec-card, .zone-card, .seat-showcase-card, .passport-teaser-card, .recipe-card';
  const cards = new Set();
  const state = new WeakMap();

  const io = new IntersectionObserver(entries => {
    const now = performance.now();
    entries
      .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left))
      .forEach((e, n) => {
        const s = state.get(e.target); if (!s) return;
        s.visible = e.isIntersecting;
        if (e.isIntersecting && s.revStart == null) s.revStart = now + n * 85; // stagger cards that arrive together
      });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });

  function register(el) {
    if (state.has(el) || el.closest('.dcard')) return;
    el.classList.add('dcard');
    el.classList.remove('reveal');
    // Menu cards ("calm" cards) don't follow the cursor: no tilt, no glare, no scroll lean —
    // just a slow lift and photo zoom on hover, plus the scroll unveil.
    const deep = el.classList.contains('dx-card');
    if (fine && !deep && !el.querySelector(':scope > .dcard-glare')) {
      const g = document.createElement('span'); g.className = 'dcard-glare'; g.setAttribute('aria-hidden', 'true'); el.appendChild(g);
    }
    const s = { rx: 0, ry: 0, lift: 0, hov: 0, tx: 0, ty: 0, tl: 0, th: 0, revStart: reduce ? -1e9 : null, visible: false, img: el.querySelector('.dx-img') || el.querySelector('img'), deep, revDone: false, last: '' };
    state.set(el, s); cards.add(el);
    if (!reduce) { el.style.opacity = '0'; if (deep) el.style.setProperty('--rev', '0'); }
    io.observe(el);
    if (fine && !reduce && deep) {
      el.addEventListener('pointerenter', () => { s.tl = -6; s.th = 1; });
      el.addEventListener('pointerleave', () => { s.tl = 0; s.th = 0; });
    } else if (fine && !reduce) {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = clamp((e.clientX - r.left) / r.width, 0, 1), py = clamp((e.clientY - r.top) / r.height, 0, 1);
        s.tx = (px - 0.5) * 10 * s.amp; s.ty = (0.5 - py) * 8 * s.amp; s.tl = -8; s.th = 1;
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => { s.tx = 0; s.ty = 0; s.tl = 0; s.th = 0; });
    }
  }
  const scan = root => {
    if (!root || root.nodeType !== 1) return;
    if (root.matches(CARD_SEL)) register(root);
    root.querySelectorAll(CARD_SEL).forEach(register);
  };
  scan(document.body);
  // cards rendered later (menu filters, etc.)
  let pending = [], scheduled = false;
  new MutationObserver(list => {
    list.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1 && !n.classList.contains('dcard-glare')) pending.push(n); }));
    if (pending.length && !scheduled) {
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; const p = pending; pending = []; p.forEach(scan); });
    }
  }).observe(document.body, { childList: true, subtree: true });

  // headings on inner pages glide in
  const hio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); hio.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  if (!reduce) document.querySelectorAll('.tier-header, .page-shell h2').forEach(h => {
    if (h.closest('.dcard, .reveal, [data-mask-reveal], .modal, .qv-modal')) return;
    h.setAttribute('data-dreveal', ''); hio.observe(h);
  });

  /* ---------- per-frame card motion ---------- */
  let vel = 0, skew = 0, lastY = scrollY, lastT = performance.now();
  function tick(now) {
    const dt = clamp((now - lastT) / 1000, 0.001, 0.25); lastT = now;
    const y = scrollY;
    // capped so instant jumps (anchors, page restore) don't fling the cards
    vel = lerp(vel, clamp((y - lastY) / dt, -3500, 3500), 1 - Math.exp(-7 * dt)); lastY = y;
    skew = lerp(skew, reduce ? 0 : clamp(vel * 0.0021, -3, 3), 1 - Math.exp(-9 * dt));
    const vh = innerHeight, vw = innerWidth, k = 1 - Math.exp(-10 * dt), kCalm = 1 - Math.exp(-4.5 * dt);

    // pass 1: read every card's position (one layout for the whole frame)
    const work = [];
    for (const el of cards) {
      if (!el.isConnected) { cards.delete(el); continue; }
      const s = state.get(el);
      if (!s.visible) continue;
      work.push([el, s, el.getBoundingClientRect()]);
    }
    // pass 2: write transforms (no reads in here, so no forced re-layouts)
    for (const [el, s, r] of work) {
      let p = 0;
      if (s.revStart != null) { p = clamp((now - s.revStart) / (s.deep ? 1400 : 1150), 0, 1); p = 1 - Math.pow(1 - p, 4); }
      let tf;
      if (s.deep) {
        // calm menu card: slow lift on hover, no tilt, no scroll lean
        s.lift = lerp(s.lift, s.tl, kCalm); s.hov = lerp(s.hov, s.th, kCalm);
        tf = `translate3d(0,${((1 - p) * 70 + s.lift).toFixed(2)}px,0) scale(${(0.96 + 0.04 * p).toFixed(4)})`;
      } else {
        s.rx = lerp(s.rx, s.ty, k); s.ry = lerp(s.ry, s.tx, k); s.lift = lerp(s.lift, s.tl, k); s.hov = lerp(s.hov, s.th, k);
        // cards trail the scroll a little, more on the right → a soft wave
        const lag = reduce ? 0 : clamp(vel * 0.009 * (0.35 + (r.left + r.width / 2) / vw), -24, 24);
        const ty = (1 - p) * 96 + s.lift + lag;
        const sc = (0.93 + 0.07 * p) * (1 + s.hov * 0.015);
        tf = `perspective(1100px) translate3d(0,${ty.toFixed(2)}px,0) rotateX(${(s.rx + (1 - p) * 12).toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg) skewY(${skew.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      }
      if (tf !== s.last) { el.style.transform = tf; s.last = tf; }
      const op = p < 1 ? p.toFixed(3) : '';
      if (op !== s.op) { el.style.opacity = op; s.op = op; }
      // --rev drives the CSS unveil (photo clip + staggered text) on menu cards
      if (s.deep && !s.revDone) { el.style.setProperty('--rev', p.toFixed(3)); if (p >= 1) s.revDone = true; }
      if (s.img) {
        const prog = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
        const py = prog * (s.deep ? -10 : -18);
        const zoom = s.deep ? 1.05 + s.hov * 0.07 + (1 - p) * 0.22 : 1.12 + s.hov * 0.06;
        s.img.style.transform = `translate3d(0,${py.toFixed(2)}px,0) scale(${zoom.toFixed(4)})`;
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ================================================================ */
  /* 3 · Cursor: one smooth tapered ribbon (same feel as Raasta)       */
  /* ================================================================ */
  // A fixed canvas draws a brush-stroke tail that follows the pointer and fades to a point.
  // Gold-cream over dark areas, espresso over light ones; a small head dot that becomes a
  // soft ring over links and buttons. Hands the normal cursor back over form fields.
  // Mouse only, off for reduced motion, and the loop sleeps when the pointer is still.
  if (fine && !reduce) {
    const root = document.documentElement;
    const cv = document.createElement('canvas');
    cv.className = 'site-trail'; cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    let dpr = 1, W = 0, H = 0;
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    root.classList.add('trail-on');

    const NATIVE = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"]), textarea, select, [contenteditable="true"]';
    const ACTION = 'a, button, [role="button"], [role="tab"], label, summary, .thumb, .mood, .filter-btn, .fp-table-node, .dx-card, .drink';
    const DARK = '.rv-dark, .rv-plan, .rv-map-plate, .hero, .ai, .reviews, .footer, .dfoot, .loader, .inner-hero:not(.collection-hero), .collection-intro, .passport-cover, .not-found, .rec-card, .qv-side, .modal, .dnav-overlay, .dnav:not(.light), .card-sensory-overlay';
    const LIGHT_RGB = [74, 38, 18], DARK_RGB = [240, 212, 158];

    const N = 26;
    const pts = Array.from({ length: N }, () => ({ x: -200, y: -200 }));
    let mx = -200, my = -200, hx = -200, hy = -200, inside = false;
    let headR = 5, headRT = 5, ringA = 0, ringAT = 0, tailA = 0, tailAT = 0, tone = 1, toneT = 1;
    let raf = null, last = performance.now();

    const decide = el => {
      if (!inside || !el || !el.closest || el.closest(NATIVE)) { tailAT = 0; ringAT = 0; root.classList.remove('cursor-none'); return; }
      root.classList.add('cursor-none');
      tailAT = 1;
      const overLens = !!el.closest('.hero[data-lens="on"]');
      const isAction = !!el.closest(ACTION);
      headRT = overLens ? 0 : isAction ? 3 : 5;
      ringAT = isAction && !overLens ? 1 : 0;
      // the hero lens is light gold, so the tail turns espresso over it
      toneT = overLens ? 0 : el.closest(DARK) ? 1 : 0;
    };

    // tapered, filled ribbon: no visible joints, fades from head to tip
    const ribbon = (r, g, b, alpha) => {
      const L = [], R = [];
      let len = 0;
      for (let i = 0; i < N; i++) {
        const a = pts[Math.max(0, i - 1)], c = pts[Math.min(N - 1, i + 1)];
        let dx = c.x - a.x, dy = c.y - a.y;
        const d = Math.hypot(dx, dy);
        if (i) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        if (d < 0.001) { dx = 1; dy = 0; } else { dx /= d; dy /= d; }
        const w = 10 * 0.5 * Math.pow(1 - i / (N - 1), 1.15);
        L.push({ x: pts[i].x - dy * w, y: pts[i].y + dx * w });
        R.push({ x: pts[i].x + dy * w, y: pts[i].y - dx * w });
      }
      if (len < 1.5) return;
      const head = pts[0], tip = pts[N - 1];
      const grad = ctx.createLinearGradient(head.x, head.y, tip.x, tip.y);
      grad.addColorStop(0, `rgba(${r},${g},${b},${(alpha * 0.92).toFixed(3)})`);
      grad.addColorStop(0.55, `rgba(${r},${g},${b},${(alpha * 0.4).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      const curve = (arr, start) => {
        for (let i = start; i < arr.length - 1; i++) {
          ctx.quadraticCurveTo(arr[i].x, arr[i].y, (arr[i].x + arr[i + 1].x) / 2, (arr[i].y + arr[i + 1].y) / 2);
        }
        ctx.lineTo(arr[arr.length - 1].x, arr[arr.length - 1].y);
      };
      ctx.beginPath(); ctx.moveTo(L[0].x, L[0].y); curve(L, 1); curve(R.reverse(), 0); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
    };

    const mix = (a, b, t) => Math.round(a + (b - a) * t);

    const schedule = fn => {
      let done = false;
      const id = requestAnimationFrame(t => { done = true; fn(t); });
      setTimeout(() => { if (!done) { cancelAnimationFrame(id); fn(performance.now()); } }, 50);
      return id || 1;
    };
    const kick = () => { if (!raf) { last = performance.now(); raf = schedule(frame); } };
    const frame = now => {
      const dt = Math.max(0, Math.min(48, now - last)) / 16.667; last = now;
      const k = base => 1 - Math.pow(1 - base, dt);
      hx += (mx - hx) * k(0.42); hy += (my - hy) * k(0.42);
      pts[0].x = hx; pts[0].y = hy;
      for (let i = 1; i < N; i++) { const p = pts[i], q = pts[i - 1]; p.x += (q.x - p.x) * k(0.5); p.y += (q.y - p.y) * k(0.5); }
      if (!Number.isFinite(hx) || !Number.isFinite(hy)) { hx = mx; hy = my; }
      if (pts.some(p => !Number.isFinite(p.x) || Math.abs(p.x - hx) > 1600 || Math.abs(p.y - hy) > 1600)) pts.forEach(p => { p.x = hx; p.y = hy; });
      headR += (headRT - headR) * k(0.25); ringA += (ringAT - ringA) * k(0.2);
      tailA += (tailAT - tailA) * k(0.18); tone += (toneT - tone) * k(0.2);

      ctx.clearRect(0, 0, W, H);
      if (tailA > 0.01) {
        const r = mix(LIGHT_RGB[0], DARK_RGB[0], tone), g = mix(LIGHT_RGB[1], DARK_RGB[1], tone), b = mix(LIGHT_RGB[2], DARK_RGB[2], tone);
        ribbon(r, g, b, tailA);
        if (headR > 0.3) { ctx.fillStyle = `rgba(${r},${g},${b},${tailA.toFixed(3)})`; ctx.beginPath(); ctx.arc(hx, hy, headR, 0, Math.PI * 2); ctx.fill(); }
        if (ringA > 0.01) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${(ringA * tailA * 0.6).toFixed(3)})`; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(hx, hy, 18 + ringA * 6, 0, Math.PI * 2); ctx.stroke();
        }
      }
      const tail = pts[N - 1];
      const still = Math.abs(mx - tail.x) < 0.15 && Math.abs(my - tail.y) < 0.15 && Math.abs(headRT - headR) < 0.02 &&
        Math.abs(ringAT - ringA) < 0.005 && Math.abs(tailAT - tailA) < 0.005 && Math.abs(toneT - tone) < 0.005;
      raf = still ? null : schedule(frame);
    };
    addEventListener('resize', () => { size(); kick(); }, { passive: true });
    // the hero lens calls this when it opens/closes under a still pointer
    window.__darbarTrailKick = () => { if (inside) { decide(document.elementFromPoint(mx, my)); kick(); } };

    document.addEventListener('pointermove', e => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!inside) { inside = true; hx = mx; hy = my; pts.forEach(p => { p.x = mx; p.y = my; }); }
      decide(e.target); kick();
    }, { passive: true });
    document.addEventListener('pointerdown', () => { headRT *= 0.6; kick(); }, { passive: true });
    document.addEventListener('pointerup', e => { decide(e.target); kick(); }, { passive: true });
    root.addEventListener('mouseleave', () => { inside = false; decide(null); kick(); });
    addEventListener('blur', () => { inside = false; decide(null); kick(); });
    let scrollQ = false;
    addEventListener('scroll', () => {
      if (!inside || scrollQ) return;
      scrollQ = true;
      requestAnimationFrame(() => { scrollQ = false; if (inside) { decide(document.elementFromPoint(mx, my)); kick(); } });
    }, { passive: true });
  }

  /* ================================================================ */
  /* 4 · Magnetic buttons                                             */
  /* ================================================================ */
  if (fine && !reduce && gsap) {
    const MAG = '.dpill, .pill, .add, .arrow, .dnav-cart, .dnav-burger, .mood, .socials a';
    let current = null;
    document.addEventListener('pointermove', e => {
      const m = e.target.closest && e.target.closest(MAG);
      if (m !== current) {
        if (current) gsap.to(current, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.4)' });
        current = m;
      }
      if (!m) return;
      const r = m.getBoundingClientRect();
      const pull = r.width > 140 ? 0.16 : 0.3;
      gsap.to(m, { x: (e.clientX - (r.left + r.width / 2)) * pull, y: (e.clientY - (r.top + r.height / 2)) * pull * 1.15, duration: 0.6, ease: 'power3.out' });
    }, { passive: true });
  }
})();

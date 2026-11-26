// Coffee Darbar — hero reveal lens (same idea as the Raasta hero).
// Hovering the headline or description opens a gold lens that reveals a hidden twin of
// the hero text — different words, reversed colours — perfectly aligned underneath.
// The lens only opens over the words themselves, so nothing is ever covered while reading.
// Transform-only animation; the loop sleeps when idle. Mouse only, off for reduced motion.
(() => {
  const hero = document.getElementById('hero');
  const source = hero && hero.querySelector('.hero-left');
  if (!source) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const R = 150; // lens radius (px)
  const lens = document.createElement('div');
  lens.className = 'hero-lens';
  lens.setAttribute('aria-hidden', 'true');
  lens.style.width = lens.style.height = `${R * 2}px`;
  const lensIn = document.createElement('div');
  lensIn.className = 'hero-lens-in';
  lens.appendChild(lensIn);
  hero.appendChild(lens);

  // The twin: a copy of the hero text with its own message
  let twinReady = false;
  const buildTwin = () => {
    const twin = source.cloneNode(true);
    [twin, ...twin.querySelectorAll('*')].forEach(el => { el.removeAttribute('style'); el.removeAttribute('id'); });
    twin.querySelectorAll('a, button').forEach(el => el.setAttribute('tabindex', '-1'));
    const rating = twin.querySelector('.rating');
    if (rating) rating.innerHTML = '<span class="stars">★★★★★</span> Brewed with patience';
    const lines = twin.querySelectorAll('.hero-title .line > span');
    if (lines[0]) lines[0].textContent = 'Sip slowly,';
    if (lines[1]) lines[1].textContent = '& feel royal.';
    const desc = twin.querySelector('.hero-desc');
    if (desc) desc.textContent = 'Every cup is weighed, timed and poured by hand, then served like it matters. Because it does.';
    const btn = twin.querySelector('.hero-actions .pill');
    if (btn) btn.textContent = 'Reserve a Table';
    const price = twin.querySelector('.hero-price');
    if (price) price.textContent = '7am – 10pm';
    lensIn.replaceChildren(twin);
    twinReady = true;
  };
  const sizeTwin = () => { lensIn.style.width = `${hero.clientWidth}px`; lensIn.style.height = `${hero.clientHeight}px`; };
  sizeTwin();

  // build once the hero text has finished its entrance animation
  const afterIntro = () => setTimeout(() => { buildTwin(); boxes = null; }, 1800);
  if (document.querySelector('#loader.done')) afterIntro();
  else { addEventListener('darbar:intro', afterIntro, { once: true }); setTimeout(() => { if (!twinReady) buildTwin(); }, 9000); }

  // Where the words are (line boxes of the headline and description)
  let boxes = null;
  const measure = () => {
    const hr = hero.getBoundingClientRect();
    boxes = [];
    source.querySelectorAll('.hero-title, .hero-desc').forEach(el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      [...range.getClientRects()].forEach(r => {
        if (r.width < 2 || r.height < 2) return;
        boxes.push({ l: r.left - hr.left - 14, t: r.top - hr.top - 8, r: r.right - hr.left + 14, b: r.bottom - hr.top + 8 });
      });
    });
  };
  const overWords = () => { if (!boxes) measure(); return boxes.some(b => mx >= b.l && mx <= b.r && my >= b.t && my <= b.b); };
  // the headline changes with each drink: re-measure once it has settled
  addEventListener('darbar:herodrink', () => { lensT = 0; setTimeout(() => { boxes = null; }, 1500); });
  addEventListener('resize', () => { boxes = null; sizeTwin(); }, { passive: true });

  /* ---- state + loop ---- */
  let mx = -500, my = -500, hx = -500, hy = -500, inside = false;
  let lensS = 0, lensT = 0, raf = null, last = performance.now();
  let rect = hero.getBoundingClientRect();
  const refresh = () => { rect = hero.getBoundingClientRect(); };
  addEventListener('scroll', () => { refresh(); if (lensT) { lensT = 0; hero.dataset.lens = ''; kick(); } }, { passive: true });

  const decide = () => {
    // only while the hero text is fully visible (it fades out as you scroll)
    const textVisible = parseFloat(getComputedStyle(source).opacity) > 0.9;
    lensT = inside && twinReady && textVisible && overWords() ? 1 : 0;
    const on = lensT ? 'on' : '';
    if (hero.dataset.lens !== on) { hero.dataset.lens = on; if (window.__darbarTrailKick) window.__darbarTrailKick(); }
  };

  const schedule = fn => {
    let done = false;
    const id = requestAnimationFrame(t => { done = true; fn(t); });
    setTimeout(() => { if (!done) { cancelAnimationFrame(id); fn(performance.now()); } }, 50);
    return id || 1;
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = schedule(frame); } };
  function frame(now) {
    const dt = Math.max(0, Math.min(48, now - last)) / 16.667; last = now;
    const k = base => 1 - Math.pow(1 - base, dt);
    hx += (mx - hx) * k(0.42); hy += (my - hy) * k(0.42);
    lensS += (lensT - lensS) * k(0.16);
    if (lensS > 0.003) {
      const s = Math.max(lensS, 0.003);
      lens.style.visibility = 'visible';
      // the lens moves and scales; its content counter-moves so the twin stays aligned
      lens.style.transform = `translate3d(${(hx - R).toFixed(2)}px, ${(hy - R).toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
      lensIn.style.transform = `translate3d(${(R - hx / s).toFixed(2)}px, ${(R - hy / s).toFixed(2)}px, 0) scale(${(1 / s).toFixed(4)})`;
    } else {
      lens.style.visibility = 'hidden';
    }
    const still = Math.abs(mx - hx) < 0.15 && Math.abs(my - hy) < 0.15 && Math.abs(lensT - lensS) < 0.002;
    raf = still ? null : schedule(frame);
  }

  hero.addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mx = e.clientX - rect.left; my = e.clientY - rect.top;
    if (!inside) { inside = true; refresh(); mx = e.clientX - rect.left; my = e.clientY - rect.top; hx = mx; hy = my; }
    decide(); kick();
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { inside = false; decide(); kick(); });
})();

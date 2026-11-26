// Coffee Darbar — page interactions (loader, hero carousel, cart, AI recommender, scroll motion)
(() => {
  const qs = (s, p = document) => p.querySelector(s);
  const qsa = (s, p = document) => [...p.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!window.gsap;
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------------- data ---------------- */
  const HERO = [
    { title: ['Royal Cappuccino', '& Gold-Rim Porcelain'], desc: 'Velvet micro-foam over a double ristretto, finished with a hand-poured heart.', price: 260, caffeine: 120, word: 'Cappuccino', tint: '#2a1810', glow: '#7a4826' },
    { title: ['Iced Darbar Latte', '& Double Espresso'], desc: 'Two shots of house espresso poured over cold milk and crystal ice. Silky, balanced, gently sweet.', price: 240, caffeine: 130, word: 'Iced Latte', tint: '#1d1612', glow: '#6d5241' },
    { title: ['Kesar Latte', '& Kashmiri Saffron'], desc: 'Saffron threads steeped in warm milk, kissed with cardamom and poured over a single-origin shot.', price: 290, caffeine: 95, word: 'Kesar', tint: '#33180a', glow: '#a8601c' },
    { title: ['Mocha Maharaja', '& 70% Dark Cocoa'], desc: 'Single-origin cocoa melted into espresso, crowned with whipped cream and shaved chocolate.', price: 280, caffeine: 105, word: 'Mocha', tint: '#26100b', glow: '#76301d' },
    { title: ['Filter Kaapi', '& Brass Davara'], desc: 'Chikmagalur beans with a whisper of chicory, frothed tableside between brass tumbler and davara.', price: 180, caffeine: 110, word: 'Kaapi', tint: '#231c0d', glow: '#80642a' },
  ];
  const SLIDE_SECONDS = 6;

  const REC = {
    Focused: { name: 'The Focus Pour', desc: 'Double espresso · oat milk · orange zest', price: 260, reason: 'Because your brain deserves a clean runway.', caffeine: 150, style: 'espresso' },
    Bright: { name: 'Citrus Tonic', desc: 'Cold brew · grapefruit · tonic', price: 290, reason: 'A little sparkle for a wide-open day.', caffeine: 110, style: 'iced' },
    Slow: { name: 'Velvet Oat Latte', desc: 'Oat milk · brown sugar · cinnamon', price: 250, reason: 'Soft landing, no rush required.', caffeine: 75, style: 'sage' },
    Social: { name: 'Cascara Fizz', desc: 'Cascara · lime · soda · mint', price: 230, reason: 'The conversation starter, chilled.', caffeine: 35, style: 'cappuccino' },
  };
  const XAI = {
    Focused: { circadian: 'Optimal morning/midday curve. A double ristretto gives quick alertness while oat milk fats soften the caffeine crash.', match: 94, sourcing: '100% single-origin Ethiopia Guji, example of buying from a smallholder cooperative.', caffeine: '150 mg · optimal focus release' },
    Bright: { circadian: 'Midday balance. Slow cold steeping removes bitter acids; citrus oils add a bright lift.', match: 91, sourcing: 'Colombia Huila organic cooperative. Shade-grown cherries, no chemical run-off.', caffeine: '110 mg · smooth sustained energy' },
    Slow: { circadian: 'Late-afternoon cadence. Cinnamon steadies blood sugar and a single shot protects evening sleep.', match: 96, sourcing: 'Brazil Cerrado regenerative micro-lot — example of regenerative sourcing.', caffeine: '75 mg · gentle afternoon comfort' },
    Social: { circadian: 'Evening sipping. Very low caffeine protects sleep while offering wine-like fruit notes.', match: 98, sourcing: 'Upcycled coffee-cherry husks (cascara) from Costa Rican farms — extra income from a by-product.', caffeine: '35 mg · naturally low stimulant' },
  };

  /* smooth scroll is set up by darbar-motion.js (shared by every page) */
  const lenis = window.__darbarLenis || null;

  /* ---------------- toast ---------------- */
  const toastEl = qs('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ---------------- loader + intro ---------------- */
  const loader = qs('#loader'), bar = qs('#loaderBar');
  const heroLines = qsa('.hero-title .line > span');
  const heroFade = qsa('.hero-left .rating, .hero-desc, .hero-actions, .hero-right > *, .hero-foot');
  if (hasGsap && !reduceMotion) {
    gsap.set(heroLines, { yPercent: 110 });
    gsap.set(heroFade, { opacity: 0, y: 24 });
    gsap.to(bar, { width: '82%', duration: 2.4, ease: 'power2.out' });
  }
  let introDone = false;
  const introStart = performance.now();
  const MIN_INTRO = reduceMotion ? 0 : 3800; // let the cup land, fill, and its steam rise into the crown
  function finishLoading() {
    if (introDone) return; introDone = true;
    const reveal = () => {
      // the coffee surface grows from the cup to cover the screen…
      const coffee = loader.querySelector('.i-coffee');
      if (coffee && !reduceMotion) {
        const r = coffee.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const reach = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
        loader.style.setProperty('--ix', cx + 'px'); loader.style.setProperty('--iy', cy + 'px');
        loader.style.setProperty('--is', ((reach * 2.4) / 40).toFixed(1));
        loader.classList.add('exit');
      }
      // the 3D starts drawing now, hidden under the growing coffee iris
      window.dispatchEvent(new Event('darbar:introexit'));
      // …then the intro fades away and the hero comes in
      setTimeout(() => {
        loader.classList.add('done'); document.body.classList.remove('is-loading');
        window.dispatchEvent(new Event('darbar:intro'));
        if (hasGsap && !reduceMotion) {
          gsap.to(heroLines, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.3 });
          gsap.to(heroFade, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.07, delay: 0.55 });
        }
        startCarousel();
      }, reduceMotion ? 0 : 900);
    };
    const wait = Math.max(0, MIN_INTRO - (performance.now() - introStart));
    setTimeout(() => {
      if (hasGsap) gsap.to(bar, { width: '100%', duration: 0.4, ease: 'power2.out', onComplete: () => setTimeout(reveal, 120) });
      else reveal();
    }, wait);
  }
  if (window.__darbar3dReady) finishLoading();
  window.addEventListener('darbar:ready', finishLoading);
  setTimeout(finishLoading, 8000); // never block the page on a slow network

  /* the header is built and animated by darbar-chrome.js */
  const hero = qs('#hero');

  /* ---------------- hero carousel ---------------- */
  const thumbs = qsa('.thumb');
  const titleEl = qs('#heroTitle'), descEl = qs('#heroDesc'), priceEl = qs('#heroPrice'), orderBtn = qs('#heroOrder');
  const indexEl = qs('#heroIndex');
  let current = 0, elapsed = 0, playing = false, heroVisible = true, busy = false;

  function setThumb(i) {
    thumbs.forEach((t, k) => {
      t.classList.toggle('active', k === i); t.setAttribute('aria-selected', k === i);
      const b = t.querySelector('.thumb-bar'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    });
    hero.style.setProperty('--slide', SLIDE_SECONDS + 's');
  }

  function goTo(i) {
    if (i === current || busy) return;
    busy = true; current = i; elapsed = 0;
    const d = HERO[i];
    window.dispatchEvent(new CustomEvent('darbar:herodrink', { detail: i }));
    setThumb(i);
    indexEl.textContent = String(i + 1).padStart(2, '0');
    Object.assign(orderBtn.dataset, { name: d.title[0], price: d.price, caffeine: d.caffeine });

    if (!hasGsap || reduceMotion) {
      heroLines.forEach((s, k) => { s.textContent = d.title[k]; });
      descEl.textContent = d.desc; priceEl.textContent = '₹' + d.price;
      hero.style.setProperty('--tint', d.tint); hero.style.setProperty('--tint-glow', d.glow);
      busy = false; return;
    }
    const tl = gsap.timeline({ onComplete: () => { busy = false; } });
    tl.to(heroLines, { yPercent: -110, duration: 0.45, ease: 'power3.in', stagger: 0.05 })
      .to([descEl, priceEl], { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' }, 0)
      .add(() => {
        heroLines.forEach((s, k) => { s.textContent = d.title[k]; });
        descEl.textContent = d.desc; priceEl.textContent = '₹' + d.price;
      })
      .set(heroLines, { yPercent: 110 })
      .to(heroLines, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 })
      .fromTo([descEl, priceEl], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.05 }, '<0.1');
    gsap.to(hero, { '--tint': d.tint, '--tint-glow': d.glow, duration: 1.3, ease: 'power2.inOut' });
  }

  function startCarousel() {
    if (playing) return;
    playing = !reduceMotion;
    setThumb(current);
    if (!playing) { hero.classList.add('paused'); return; }
    let last = performance.now();
    const tick = now => {
      const dt = (now - last) / 1000; last = now;
      const paused = !heroVisible || document.hidden;
      hero.classList.toggle('paused', paused);
      if (!paused) { elapsed += dt; if (elapsed >= SLIDE_SECONDS) goTo((current + 1) % HERO.length); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  thumbs.forEach(t => t.addEventListener('click', () => goTo(Number(t.dataset.drink))));
  document.addEventListener('keydown', e => {
    if (!heroVisible || e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') goTo((current + 1) % HERO.length);
    if (e.key === 'ArrowLeft') goTo((current + HERO.length - 1) % HERO.length);
  });
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting && e.intersectionRatio > 0.35; }, { threshold: [0, 0.35, 1] }).observe(hero);

  /* ---------------- scroll motion ---------------- */
  if (hasGsap && window.ScrollTrigger && !reduceMotion) {
    gsap.to('.hero-left, .hero-right, .hero-foot', { opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '55% top', scrub: true } });

    qsa('.reveal').forEach(el => gsap.from(el, { y: 70, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));

    const st = qs('[data-words]');
    if (st) {
      st.innerHTML = st.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
      gsap.to(qsa('.w', st), { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: st, start: 'top 82%', end: 'bottom 40%', scrub: true } });
    }
    gsap.fromTo('.tilt-photo', { rotate: -12, y: 60 }, { rotate: -3, y: -30, ease: 'none', scrollTrigger: { trigger: '.statement-grid', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.lineup-photo img', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.lineup-photo', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.footer-word', { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'power3.out', duration: 1.4, scrollTrigger: { trigger: '.footer-word', start: 'top 95%' } });
  } else {
    qsa('[data-words] .w').forEach(w => { w.style.opacity = 1; });
  }

  // counters
  const counters = qsa('[data-count]');
  const countIO = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    countIO.unobserve(e.target);
    const el = e.target, to = parseFloat(el.dataset.count), dec = Number(el.dataset.decimals || 0);
    if (!hasGsap || reduceMotion) { el.textContent = to.toFixed(dec); return; }
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toFixed(dec); } });
  }), { threshold: 0.6 });
  counters.forEach(c => countIO.observe(c));

  /* ---------------- cart ---------------- */
  const CART_KEY = 'hardiCart'; // shared with the menu page
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { cart = []; }
  const drawer = qs('#drawer'), scrim = qs('#scrim'), cartBtn = qs('#cartBtn');

  function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* storage blocked */ } }
  function renderCart() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    qs('#cartCount').textContent = count;
    const list = qs('#drawerItems');
    list.innerHTML = cart.length ? cart.map((i, k) => `
      <div class="line-item"><div><b>${i.name}</b><small>₹${i.price} · ${i.caffeine || 80} mg</small></div>
      <div class="qty"><button data-q="-1" data-k="${k}" aria-label="Remove one ${i.name}">−</button><span>${i.qty}</span><button data-q="1" data-k="${k}" aria-label="Add one ${i.name}">+</button></div></div>`).join('')
      : '<div class="empty"><i class="fa-solid fa-mug-saucer"></i>Your order is empty.<br>Pick a cup fit for royalty.</div>';
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const mg = cart.reduce((s, i) => s + (i.caffeine || 80) * i.qty, 0);
    qs('#cartTotal').textContent = '₹' + total;
    qs('#caffeineTotal').textContent = mg + ' mg';
    qs('#caffeineBar').style.width = Math.min(100, (mg / 400) * 100) + '%';
    qs('#caffeineNote').textContent = mg > 400 ? 'Above the 400 mg daily guideline — consider a decaf swap.' : 'Well within the 400 mg daily guideline.';
  }
  function flyToCart(from) {
    if (!from || !hasGsap || reduceMotion) return;
    const a = from.getBoundingClientRect(), b = cartBtn.getBoundingClientRect();
    const dot = document.createElement('div'); dot.className = 'fly-dot'; document.body.appendChild(dot);
    gsap.set(dot, { x: a.left + a.width / 2 - 8, y: a.top + a.height / 2 - 8 });
    gsap.to(dot, { x: b.left + b.width / 2 - 8, duration: 0.8, ease: 'power1.inOut' });
    gsap.to(dot, { y: b.top + b.height / 2 - 8, duration: 0.8, ease: 'back.in(1.6)', onComplete: () => { dot.remove(); cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump'); } });
  }
  function addToCart(name, price, caffeine, from) {
    const found = cart.find(i => i.name === name);
    found ? found.qty++ : cart.push({ name, price: Number(price), caffeine: Number(caffeine) || 80, qty: 1 });
    saveCart(); renderCart(); flyToCart(from); toast(`${name} added to your order`);
  }
  const openDrawer = () => { drawer.classList.add('open'); scrim.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); qs('#drawerClose').focus(); };
  const closeDrawer = () => { drawer.classList.remove('open'); scrim.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); };
  cartBtn.addEventListener('click', openDrawer);
  qs('#drawerClose').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  qs('#drawerItems').addEventListener('click', e => {
    const b = e.target.closest('[data-q]'); if (!b) return;
    const item = cart[Number(b.dataset.k)]; item.qty += Number(b.dataset.q);
    if (item.qty <= 0) cart.splice(Number(b.dataset.k), 1);
    saveCart(); renderCart();
  });
  qs('#checkoutBtn').addEventListener('click', () => {
    if (!cart.length) { toast('Add a cup first ☕'); return; }
    cart = []; saveCart(); renderCart(); closeDrawer();
    toast('Order placed — your coffee is being brewed ☕');
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-name]');
    if (b) addToCart(b.dataset.name, b.dataset.price, b.dataset.caffeine, b);
  });
  renderCart();

  /* ---------------- AI recommender + XAI ---------------- */
  let mood = 'Focused';
  const recView = qs('#recView'), recAdd = qs('#recAdd');
  qsa('.mood').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.mood === mood) return;
    qsa('.mood').forEach(b => b.classList.toggle('active', b === btn));
    mood = btn.dataset.mood;
    const r = REC[mood];
    const apply = () => {
      qs('#recTitle').textContent = r.name; qs('#recDesc').textContent = r.desc;
      qs('#recPrice').textContent = '₹' + r.price; qs('#recReason').textContent = r.reason;
      Object.assign(recAdd.dataset, { name: r.name, price: r.price, caffeine: r.caffeine });
    };
    window.dispatchEvent(new CustomEvent('darbar:cupstyle', { detail: { el: recView, style: r.style } }));
    if (hasGsap && !reduceMotion) gsap.timeline().to('.rec-info > *', { opacity: 0, y: -8, duration: 0.25, stagger: 0.03 }).add(apply).to('.rec-info > *', { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' });
    else apply();
  }));

  const modal = qs('#xaiModal'); let lastFocus = null;
  function openXai() {
    const d = XAI[mood], r = REC[mood];
    qs('#xaiTitle').textContent = r.name; qs('#xaiMood').textContent = 'Mood: ' + mood;
    qs('#xaiCircadian').textContent = d.circadian; qs('#xaiSourcing').textContent = d.sourcing;
    qs('#xaiCaffeine').textContent = d.caffeine; qs('#xaiPct').textContent = d.match + '% match · illustrative score';
    qs('#xaiBar').style.width = '0';
    lastFocus = document.activeElement;
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); lenis && lenis.stop();
    requestAnimationFrame(() => { qs('#xaiBar').style.width = d.match + '%'; });
    qs('[data-close]', modal).focus();
  }
  function closeXai() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); lastFocus && lastFocus.focus(); }
  qs('#inspectAiBtn').addEventListener('click', openXai);
  modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-close]')) closeXai(); });
  document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; closeXai(); closeDrawer(); });

  /* ---------------- reviews ---------------- */
  const track = qs('#reviewTrack');
  qsa('.arrow').forEach(a => a.addEventListener('click', () => {
    const card = qs('.review', track); const step = card ? card.offsetWidth + 18 : 360;
    track.scrollBy({ left: step * Number(a.dataset.dir), behavior: 'smooth' });
  }));

  qs('#newsForm').addEventListener('submit', e => { e.preventDefault(); e.target.reset(); toast('Welcome to the Darbar Dispatch ✦'); });
})();

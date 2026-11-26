// Coffee Darbar — shared interactions, cart, chat, AI mood picks, 3D cup
const THREE = window.THREE;
let cart = JSON.parse(localStorage.getItem('hardiCart') || '[]');
const qs = (selector, parent = document) => parent.querySelector(selector);
const qsa = (selector, parent = document) => [...parent.querySelectorAll(selector)];
let lastAdded = { name: '', time: 0 };
let currentMood = 'Focused';

function toast(message) {
  let notice = qs('#hardiToast');
  if (!notice) { notice = document.createElement('div'); notice.id = 'hardiToast'; notice.style.cssText = 'position:fixed;top:85px;right:24px;background:#d4af37;color:#17110c;padding:13px 18px;border-radius:30px;font:600 11px Manrope;z-index:400;box-shadow:0 8px 30px #0008'; document.body.appendChild(notice); }
  notice.textContent = message; notice.style.display = 'block'; clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => { notice.style.display = 'none'; }, 2400);
}

function updateCart() {
  qsa('#cartCount').forEach(el => { el.textContent = cart.reduce((sum, item) => sum + item.qty, 0); });
  localStorage.setItem('hardiCart', JSON.stringify(cart));
  renderCartDrawer();
}

function addToCart(name, price, caffeine = 80) {
  const now = Date.now();
  if (lastAdded.name === name && now - lastAdded.time < 350) return;
  lastAdded = { name, time: now };
  const existing = cart.find(item => item.name === name);
  existing ? existing.qty++ : cart.push({ name, price: Number(price), caffeine: Number(caffeine) || 80, qty: 1 });
  updateCart();
  toast(`${name} added to your ritual`);
  openCartDrawer();
}
window.addToCart = addToCart;

// ---------------- Slide-Out Mini Cart Drawer (Feature 4) & Caffeine Meter (Feature 1) ----------------
function initCartDrawer() {
  if (qs('#cartDrawer')) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'cart-drawer-backdrop';
  backdrop.id = 'cartDrawerBackdrop';

  const drawer = document.createElement('aside');
  drawer.className = 'cart-drawer';
  drawer.id = 'cartDrawer';
  drawer.innerHTML = `
    <div class="cart-drawer-header">
      <div class="cd-title-wrap">
        <h3 class="m-0"><span class="pulse-dot"></span> Ritual Queue</h3>
        <span class="cd-count-badge" id="cdCountBadge">0 items</span>
      </div>
      <button class="cart-drawer-close" id="cartDrawerClose" aria-label="Close cart">&times;</button>
    </div>
    
    <div class="caffeine-meter-card" id="caffeineMeterCard">
      <div class="cm-head">
        <span><i class="fa-solid fa-heart-pulse"></i> Daily Caffeine Wellness</span>
        <b id="cmValue">0 / 400 mg</b>
      </div>
      <div class="cm-track">
        <div class="cm-fill" id="cmFill" style="width: 0%"></div>
      </div>
      <div class="cm-advice" id="cmAdvice">🟢 Safe daily zone (FDA advises &lt;400mg)</div>
    </div>

    <div class="cart-drawer-body" id="cartDrawerBody"></div>

    <div class="cart-drawer-footer" id="cartDrawerFooter">
      <div class="cd-totals">
        <div class="cd-row"><span>Subtotal</span><b id="cdSubtotal">₹0</b></div>
        <div class="cd-row"><span>GST (5%)</span><span id="cdGst">₹0</span></div>
        <div class="cd-row cd-grand-total"><span>Total</span><b id="cdTotal">₹0</b></div>
      </div>
      <div class="cd-actions">
        <a href="order.html" class="btn btn-brass w-100 cd-checkout-btn" data-testid="cd-checkout-btn">
          Proceed to Order Ahead <i class="fa-solid fa-arrow-right"></i>
        </a>
        <button class="cd-clear-btn" id="cdClearBtn">Clear Queue</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);

  backdrop.addEventListener('click', closeCartDrawer);
  qs('#cartDrawerClose')?.addEventListener('click', closeCartDrawer);
  qs('#cdClearBtn')?.addEventListener('click', () => {
    cart = [];
    updateCart();
    toast('Queue cleared');
  });

  // Intercept cart links unless already on order.html
  qsa('.nav-cart, #cartCount').forEach(el => {
    el.addEventListener('click', e => {
      if (!window.location.pathname.endsWith('order.html')) {
        e.preventDefault();
        openCartDrawer();
      }
    });
  });

  renderCartDrawer();
}

function openCartDrawer() {
  const drawer = qs('#cartDrawer'), backdrop = qs('#cartDrawerBackdrop');
  if (!drawer || !backdrop) return;
  renderCartDrawer();
  drawer.classList.add('open');
  backdrop.classList.add('open');
  document.body.classList.add('cart-open');
}

function closeCartDrawer() {
  const drawer = qs('#cartDrawer'), backdrop = qs('#cartDrawerBackdrop');
  if (!drawer || !backdrop) return;
  drawer.classList.remove('open');
  backdrop.classList.remove('open');
  document.body.classList.remove('cart-open');
}

function renderCartDrawer() {
  const body = qs('#cartDrawerBody');
  if (!body) return;

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = qs('#cdCountBadge');
  if (badge) badge.textContent = `${totalQty} item${totalQty === 1 ? '' : 's'}`;

  // Caffeine wellness calculation
  const totalCaffeine = cart.reduce((sum, item) => sum + (item.caffeine || 80) * item.qty, 0);
  const cmValue = qs('#cmValue'), cmFill = qs('#cmFill'), cmAdvice = qs('#cmAdvice');
  if (cmValue && cmFill && cmAdvice) {
    const pct = Math.min(100, Math.round((totalCaffeine / 400) * 100));
    cmValue.textContent = `${totalCaffeine} / 400 mg`;
    cmFill.style.width = `${pct}%`;
    if (totalCaffeine < 200) {
      cmFill.style.background = 'linear-gradient(90deg, #50c878, #2ecc71)';
      cmAdvice.innerHTML = '🟢 <b>Safe Energy Zone</b> · Hydrated & balanced';
    } else if (totalCaffeine <= 350) {
      cmFill.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
      cmAdvice.innerHTML = '🟡 <b>Focused Momentum Zone</b> · Optimal peak alertness';
    } else {
      cmFill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
      cmAdvice.innerHTML = '🟠 <b>High Alert Zone</b> · Nearing FDA 400mg daily limit';
    }
  }

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cd-empty">
        <div class="cd-empty-cup"><i class="fa-solid fa-mug-saucer"></i></div>
        <p class="m-0">Your ritual queue is empty</p>
        <small class="text-muted">Explore single origins and signature pours.</small>
        <a href="menu.html" class="btn btn-ghost btn-sm mt-3" onclick="closeCartDrawer()">Explore Collection</a>
      </div>
    `;
    const footer = qs('#cartDrawerFooter');
    if (footer) footer.style.display = 'none';
    return;
  }

  const footer = qs('#cartDrawerFooter');
  if (footer) footer.style.display = 'block';

  body.innerHTML = cart.map((item, i) => `
    <div class="cd-item">
      <div class="cd-item-info">
        <div class="cd-item-name">${item.name}</div>
        <div class="cd-item-meta">
          <span class="cd-item-price">₹${item.price * item.qty}</span>
          <span class="cd-item-caff">${(item.caffeine || 80) * item.qty}mg caf</span>
        </div>
      </div>
      <div class="cd-item-controls">
        <button class="cd-qty-btn" data-cd-dec="${i}" aria-label="Decrease quantity">−</button>
        <span class="cd-qty-val">${item.qty}</span>
        <button class="cd-qty-btn" data-cd-inc="${i}" aria-label="Increase quantity">+</button>
        <button class="cd-del-btn" data-cd-del="${i}" aria-label="Remove item"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>
  `).join('');

  const sub = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const gst = Math.round(sub * 0.05);
  const total = sub + gst;
  if (qs('#cdSubtotal')) qs('#cdSubtotal').textContent = `₹${sub}`;
  if (qs('#cdGst')) qs('#cdGst').textContent = `₹${gst}`;
  if (qs('#cdTotal')) qs('#cdTotal').textContent = `₹${total}`;

  qsa('[data-cd-inc]', body).forEach(b => b.addEventListener('click', () => {
    cart[Number(b.dataset.cdInc)].qty++;
    updateCart();
  }));
  qsa('[data-cd-dec]', body).forEach(b => b.addEventListener('click', () => {
    const idx = Number(b.dataset.cdDec);
    cart[idx].qty--;
    if (cart[idx].qty < 1) cart.splice(idx, 1);
    updateCart();
  }));
  qsa('[data-cd-del]', body).forEach(b => b.addEventListener('click', () => {
    cart.splice(Number(b.dataset.cdDel), 1);
    updateCart();
  }));
}

// ---------------- Ethical AI Explainability (XAI Model Card) (Feature 1) ----------------
const XAI_DATA = {
  Focused: {
    drink: 'The Focus Pour',
    desc: 'Double espresso · oat milk · orange zest',
    circadian: 'Optimal morning/midday metabolic curve. Double ristretto provides rapid alertness while oat milk healthy lipids prevent insulin and caffeine crashes.',
    match: 94,
    sourcing: '100% single-origin Ethiopia Guji. Sourced via direct smallholder cooperative paying 22% above Fair Trade base floor.',
    caffeine: '150mg (Optimal focus release)',
    dietary: 'Plant-based · Low-acid · Antioxidant-dense'
  },
  Bright: {
    drink: 'Citrus Tonic',
    desc: 'Cold brew · grapefruit · tonic',
    circadian: 'Midday refreshing balance. Slow cold-steep extraction eliminates chlorogenic acid bitterness; citrus essential oils stimulate dopamine pathways.',
    match: 91,
    sourcing: 'Colombia Huila organic cooperative. Handpicked shade-grown cherries with zero river chemical runoff.',
    caffeine: '110mg (Smooth sustained energy)',
    dietary: 'Vegan · Sparkling · Refreshing'
  },
  Slow: {
    drink: 'Velvet Oat Latte',
    desc: 'Oat milk · brown sugar · cinnamon',
    circadian: 'Late-afternoon mellow cadence. Natural cinnamon stabilizes blood glucose, and single espresso dose protects evening melatonin production.',
    match: 96,
    sourcing: 'Brazil Cerrado regenerative micro-lot with certified biodiverse soil restoration practices.',
    caffeine: '75mg (Gentle afternoon comfort)',
    dietary: 'Plant-based · Warm spices · Low-stimulation'
  },
  Social: {
    drink: 'Cascara Fizz',
    desc: 'Cascara · lime · soda · mint',
    circadian: 'Evening communal sipping. Very low caffeine ensures sleep hygiene while offering complex wine-like polyphenols.',
    match: 98,
    sourcing: 'Upcycled coffee dried fruit (cascara) from Costa Rican farms, transforming agricultural byproduct into ethical farmer revenue.',
    caffeine: '35mg (Naturally low stimulant)',
    dietary: 'Zero Waste · Fair Trade · Ultra Refreshing'
  }
};

function initXaiModal() {
  if (qs('#xaiModal')) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'xai-backdrop';
  backdrop.id = 'xaiBackdrop';

  const modal = document.createElement('div');
  modal.className = 'xai-modal';
  modal.id = 'xaiModal';
  modal.innerHTML = `
    <div class="xai-panel">
      <div class="xai-head">
        <div class="d-flex align-items-center gap-2">
          <span class="xai-chip"><i class="fa-solid fa-shield-halved"></i> Ethical AI · Explainability (XAI)</span>
        </div>
        <button class="xai-close-btn" id="xaiCloseBtn" aria-label="Close modal">&times;</button>
      </div>

      <div class="xai-banner">
        <div class="xai-banner-icon"><i class="fa-solid fa-mug-hot"></i></div>
        <div>
          <small class="xai-badge-label">Algorithmic Recommendation Audit</small>
          <h3 class="m-0" id="xaiDrinkTitle">The Focus Pour</h3>
          <span class="xai-mood-badge" id="xaiMoodBadge">Mood: Focused</span>
        </div>
      </div>

      <div class="xai-grid">
        <div class="xai-card">
          <div class="xai-card-title"><i class="fa-solid fa-clock"></i> Circadian Rhythm Matching</div>
          <p id="xaiCircadianText">Optimal morning/midday metabolic curve.</p>
          <div class="xai-bar-wrap">
            <div class="xai-bar-fill" id="xaiMatchFill" style="width:94%"></div>
            <span id="xaiMatchPct">94% Confidence</span>
          </div>
        </div>

        <div class="xai-card">
          <div class="xai-card-title"><i class="fa-solid fa-hand-holding-heart"></i> Fair Trade Sourcing Ethics</div>
          <p id="xaiSourcingText">Direct smallholder cooperative sourcing.</p>
          <div class="xai-tags">
            <span class="micro-badge badge-fairtrade">Co-op Direct</span>
            <span class="micro-badge badge-vegan">Regenerative</span>
          </div>
        </div>

        <div class="xai-card">
          <div class="xai-card-title"><i class="fa-solid fa-user-shield"></i> Zero-Biometrics Guarantee</div>
          <p>Computed <strong>100% client-side</strong> from your explicit mood button tap. No camera/facial emotion recognition, no cookies, no profiling.</p>
          <span class="xai-verified"><i class="fa-solid fa-check-double"></i> Privacy by Design</span>
        </div>

        <div class="xai-card">
          <div class="xai-card-title"><i class="fa-solid fa-user-gear"></i> Human-in-the-Loop Safeguard</div>
          <p>Professors & baristas approve: User retains final agency. Ask our baristas to adjust caffeine, milk, or temperature at no friction.</p>
          <span class="xai-verified"><i class="fa-solid fa-arrows-rotate"></i> Barista Override Always Honored</span>
        </div>
      </div>

      <div class="xai-foot">
        <span class="xai-version">Darbar Algorithmic Ethics Protocol v2.4 · UPES Capstone</span>
        <button class="btn btn-brass btn-sm" id="xaiDismissBtn">Understood</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  const close = () => {
    modal.classList.remove('open');
    backdrop.classList.remove('open');
  };

  backdrop.addEventListener('click', close);
  qs('#xaiCloseBtn')?.addEventListener('click', close);
  qs('#xaiDismissBtn')?.addEventListener('click', close);

  qs('#inspectAiBtn')?.addEventListener('click', () => {
    updateXaiContent(currentMood);
    modal.classList.add('open');
    backdrop.classList.add('open');
  });
}

function updateXaiContent(mood) {
  const d = XAI_DATA[mood] || XAI_DATA.Focused;
  if (qs('#xaiDrinkTitle')) qs('#xaiDrinkTitle').textContent = d.drink;
  if (qs('#xaiMoodBadge')) qs('#xaiMoodBadge').textContent = `Mood: ${mood}`;
  if (qs('#xaiCircadianText')) qs('#xaiCircadianText').textContent = d.circadian;
  if (qs('#xaiMatchFill')) qs('#xaiMatchFill').style.width = `${d.match}%`;
  if (qs('#xaiMatchPct')) qs('#xaiMatchPct').textContent = `${d.match}% Circadian Match`;
  if (qs('#xaiSourcingText')) qs('#xaiSourcingText').textContent = d.sourcing;
}
function sendChat(text) {
  const box = qs('.chat-messages'); if (!box) return;
  box.innerHTML += `<div class="user-message">${text}</div>`;
  const lower = text.toLowerCase();
  const reply = lower.includes('hour') ? 'We’re open daily from 7am to 10pm. Come early for the quiet tables.' : lower.includes('recommend') ? 'Try our Focus Pour — clean, bright, and built for momentum.' : lower.includes('reserve') ? 'You can save a table in under a minute on our reservations page.' : 'I can help with the menu, hours, reservations, or finding your next favorite cup.';
  box.innerHTML += `<div class="bot-message typing"><span></span><span></span><span></span></div>`;
  box.scrollTop = box.scrollHeight;
  setTimeout(() => { const typing = box.querySelector('.typing'); if (typing) typing.remove(); box.innerHTML += `<div class="bot-message">${reply}</div>`; box.scrollTop = box.scrollHeight; }, 650);
}

function initPageTransitions() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.createElement('div'); overlay.className = 'pt-overlay'; document.body.appendChild(overlay);
  if (reducedMotion) return;
  document.body.classList.add('pt-enter');
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('pt-enter')));
  document.addEventListener('mouseover', event => {
    const link = event.target.closest('a[href$=".html"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (qs(`link[rel="prefetch"][href="${href}"]`)) return;
    const prefetch = document.createElement('link'); prefetch.rel = 'prefetch'; prefetch.href = href; document.head.appendChild(prefetch);
  });
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const link = event.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || !/^[\w-]+\.html(#.*)?$/.test(href) || link.target === '_blank' || link.hasAttribute('download')) return;
    event.preventDefault();
    overlay.classList.add('active');
    document.body.classList.add('pt-leave');
    setTimeout(() => { window.location.href = href; }, 300);
  });
}

function initButtonRipple() {
  document.addEventListener('click', event => {
    const button = event.target.closest('.btn');
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
}

function initMaskHeadings() {
  qsa('[data-mask-reveal]').forEach(heading => {
    const lines = heading.innerHTML.split(/<br\s*\/?>/i).map(line => line.trim()).filter(Boolean);
    heading.innerHTML = lines.map(line => `<span class="mr-line"><span class="mr-line-inner">${line}</span></span>`).join('');
  });
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('mr-shown'); }), { threshold: .3 });
  qsa('[data-mask-reveal]').forEach(heading => observer.observe(heading));
}

function initCounters() {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const strong = entry.target;
    if (strong.dataset.counted) return;
    strong.dataset.counted = '1';
    const textNode = [...strong.childNodes].find(node => node.nodeType === 3 && node.textContent.trim());
    if (!textNode) return;
    const raw = textNode.textContent.trim();
    const target = parseInt(raw, 10);
    if (isNaN(target)) return;
    const pad = raw.length, duration = 1100, start = performance.now();
    requestAnimationFrame(function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      textNode.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3)))).padStart(pad, '0');
      if (progress < 1) requestAnimationFrame(step); else textNode.textContent = raw;
    });
  }), { threshold: .5 });
  qsa('.stat strong').forEach(element => observer.observe(element));
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.inner-hero') && !document.querySelector('link[href="pages.css"]')) {
    const pageStyles = document.createElement('link'); pageStyles.rel = 'stylesheet'; pageStyles.href = 'pages.css'; document.head.appendChild(pageStyles);
  }
  updateCart();
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('shown'); }), { threshold: .12 });
  qsa('.reveal, .reveal-mask, .reveal-scale, .reveal-slide').forEach(element => observer.observe(element));
  initPageTransitions();
  initButtonRipple();
  initMaskHeadings();
  initCounters();
  initCartDrawer();
  initXaiModal();
  qsa('.heart-btn').forEach(button => button.addEventListener('click', () => { button.classList.toggle('is-favorite'); button.innerHTML = button.classList.contains('is-favorite') ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>'; toast(button.classList.contains('is-favorite') ? 'Saved to favorites' : 'Removed from favorites'); }));
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-name]');
    if (button && !button.closest('.cd-item-controls')) {
      addToCart(button.dataset.name, Number(button.dataset.price), Number(button.dataset.caffeine) || 80);
    }
  });
  document.addEventListener('click', event => {
    const filter = event.target.closest('.filter-btn[data-filter]');
    if (!filter) return;
    setTimeout(() => qsa('.menu-item').forEach(item => { item.style.display = filter.dataset.filter === 'all' || item.dataset.category === filter.dataset.filter ? 'block' : 'none'; }), 0);
  }, true);
  qsa('[data-scroll-to]').forEach(button => button.addEventListener('click', () => { const target = qs(`#${button.dataset.scrollTo}`); if (!target) return; window.__hardiLenis ? window.__hardiLenis.scrollTo(target, { duration: 1.2 }) : target.scrollIntoView({ behavior: 'smooth' }); }));
  qsa('.ai-pill').forEach(button => button.addEventListener('click', () => {
    qsa('.ai-pill').forEach(item => item.classList.remove('active')); button.classList.add('active');
    currentMood = button.dataset.mood;
    const moodCaffeine = { Focused: 150, Bright: 110, Slow: 75, Social: 35 };
    const data = { Focused: ['The Focus Pour', 'Double espresso · oat milk · orange zest', '₹260', 'Because your brain deserves a clean runway.'], Bright: ['Citrus Tonic', 'Cold brew · grapefruit · tonic', '₹290', 'A little sparkle for a wide-open day.'], Slow: ['Velvet Oat Latte', 'Oat milk · brown sugar · cinnamon', '₹250', 'Soft landing, no rush required.'], Social: ['Cascara Fizz', 'Cascara · lime · soda · mint', '₹230', 'The conversation starter, chilled.'] }[button.dataset.mood];
    ['recommendationTitle', 'recommendationDesc', 'recommendationPrice', 'recommendationReason'].forEach((id, index) => { if (qs(`#${id}`)) qs(`#${id}`).textContent = data[index]; });
    const addBtn = qs('[data-testid="add-recommendation"]');
    if (addBtn) {
      addBtn.dataset.name = data[0];
      addBtn.dataset.price = data[2].replace('₹', '');
      addBtn.dataset.caffeine = moodCaffeine[button.dataset.mood] || 80;
    }
    updateXaiContent(currentMood);
  }));
  const chat = qs('#chatWidget'); qs('.chat-toggle')?.addEventListener('click', () => chat.classList.toggle('open')); qs('.chat-close')?.addEventListener('click', () => chat.classList.remove('open')); qsa('[data-chat]').forEach(button => button.addEventListener('click', () => sendChat(button.dataset.chat)));
  qs('.chat-form')?.addEventListener('submit', event => { event.preventDefault(); const input = qs('.chat-form input'); if (input.value.trim()) sendChat(input.value.trim()); input.value = ''; });
  qs('.newsletter-form')?.addEventListener('submit', event => { event.preventDefault(); toast('You’re on the Darbar dispatch list'); });
  let scrollRaf = null;
  const progressEl = qs('#scrollProgress');
  const backTopEl = qs('#backTop');

  window.addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      const currentScrollY = window.scrollY || window.pageYOffset;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (progressEl && height > 0) {
        const pct = Math.min(100, Math.max(0, (currentScrollY / height) * 100));
        progressEl.style.width = `${pct}%`;
      }
      if (backTopEl) {
        backTopEl.classList.toggle('visible', currentScrollY > 500);
      }
      scrollRaf = null;
    });
  }, { passive: true });

  qs('#backTop')?.addEventListener('click', () => { window.__hardiLenis ? window.__hardiLenis.scrollTo(0, { duration: 1.2 }) : scrollTo({ top: 0, behavior: 'smooth' }); });

  const glow = qs('.cursor-glow');
  if (glow) {
    let glowRaf = null;
    window.addEventListener('mousemove', event => {
      const clientX = event.clientX;
      const clientY = event.clientY;
      if (glowRaf) return;
      glowRaf = requestAnimationFrame(() => {
        glow.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;
        glowRaf = null;
      });
    }, { passive: true });
  }
  // Interactive Coffee Belt Atlas data and switcher
  const ORIGIN_DATA = {
    Colombia: {
      flag: '🇨🇴',
      country: 'Colombia · Huila',
      altitude: '1,750 masl · Shaded Canopy',
      title: 'Red Plum, Panela & Silky Cocoa',
      desc: 'Cultivated under shaded canopy in the Andean highlands. Washed fermentation creates a clean, sweet acidity with long sugarcane finish.',
      roast: 'Light-Medium',
      process: 'Washed',
      harvest: 'Oct — Feb'
    },
    Brazil: {
      flag: '🇧🇷',
      country: 'Brazil · Minas Gerais',
      altitude: '1,200 masl · Cerrado Plateaus',
      title: 'Cocoa Nib, Toasted Almond & Honey',
      desc: 'Naturally pulped on sunlit patios. Heavy body with rounded dark chocolate richness, low acidity, and toasted macadamia aroma.',
      roast: 'Medium',
      process: 'Natural Pulped',
      harvest: 'May — Sep'
    },
    Ethiopia: {
      flag: '🇪🇹',
      country: 'Ethiopia · Guji',
      altitude: '1,900 masl · Volcanic Forest',
      title: 'Wildflower, Bergamot & Stone Fruit',
      desc: 'Heirloom wild varieties hand-picked in misted highland forests. Delicate jasmine aromatics, peach sweetness, and tea-like elegance.',
      roast: 'Light',
      process: 'Washed Extended',
      harvest: 'Nov — Jan'
    },
    India: {
      flag: '🇮🇳',
      country: 'India · Coorg',
      altitude: '1,100 masl · Western Ghats Biodiversity',
      title: 'Jaggery, Cardamom & Dark Malt',
      desc: 'Inter-cropped under silver oak alongside wild pepper and cardamom. Spicy sweet profile with velvety crema and gentle malty finish.',
      roast: 'Medium',
      process: 'Monsooned / Washed',
      harvest: 'Dec — Mar'
    },
    Vietnam: {
      flag: '🇻🇳',
      country: 'Vietnam · Da Lat',
      altitude: '1,500 masl · Central Highlands',
      title: 'Dark Chocolate, Roasted Hazelnut & Warm Spice',
      desc: 'High-elevation Arabica-Robusta heirloom lots. Dense cocoa body with cedar notes and a long chocolate-praline aftertaste.',
      roast: 'Medium-Dark',
      process: 'Honey Process',
      harvest: 'Nov — Feb'
    }
  };

  function selectOrigin(name) {
    const d = ORIGIN_DATA[name];
    if (!d) return;
    qsa('.origin-pin').forEach(p => p.classList.toggle('active', p.dataset.origin === name));
    qsa('.origin-pill-btn').forEach(b => b.classList.toggle('active', b.dataset.origin === name));
    const flagEl = qs('#originFlag'); if (flagEl) flagEl.textContent = d.flag;
    const countryEl = qs('#originCountry'); if (countryEl) countryEl.textContent = d.country;
    const altEl = qs('#originAltitude'); if (altEl) altEl.innerHTML = `<i class="fa-solid fa-mountain"></i> ${d.altitude}`;
    const titleEl = qs('#originTitle'); if (titleEl) titleEl.textContent = d.title;
    const descEl = qs('#originDesc'); if (descEl) descEl.textContent = d.desc;
    const roastEl = qs('#originRoast'); if (roastEl) roastEl.textContent = d.roast;
    const procEl = qs('#originProcess'); if (procEl) procEl.textContent = d.process;
    const harvEl = qs('#originHarvest'); if (harvEl) harvEl.textContent = d.harvest;
  }

  qsa('.origin-pin, .origin-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => selectOrigin(btn.dataset.origin));
  });
});

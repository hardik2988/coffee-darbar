// Coffee Darbar — shared header (all pages) + footer (inner pages).
// Keeps the ids/classes older scripts rely on: #cartCount, #cartBtn, .nav-cart, #soundToggleBtn.
(() => {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Jharokha steam crown — the Coffee Darbar mark (same drawing as darbar-logo.svg).
  // Colours come from CSS (--jk-1/2/3) so it can sit on dark or cream backgrounds.
  let markN = 0;
  const mark = cls => {
    const id = 'jkg' + (++markN);
    return `<svg class="jk-mark ${cls}" viewBox="0 0 64 80" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="8" y1="4" x2="56" y2="76"><stop offset="0" class="jk-s1"/><stop offset=".5" class="jk-s2"/><stop offset="1" class="jk-s3"/></linearGradient></defs>
      <g stroke="url(#${id})">
        <path d="M32 .8 34 3.6 32 6.4 30 3.6Z" fill="url(#${id})" stroke-width=".8"/>
        <path class="jk-arch" pathLength="1" d="M10 66V34C10 23 18 18 24.5 14 28.5 11.5 31 9.4 32 7.6 33 9.4 35.5 11.5 39.5 14 46 18 54 23 54 34V66" stroke-width="2.2"/>
        <path d="M15 66V35C15 27 21 23 26 19.6 29 17.6 31 15.6 32 13.6 33 15.6 35 17.6 38 19.6 43 23 49 27 49 35V66" stroke-width="1" opacity=".55"/>
        <path d="M4 66H60" stroke-width="2.2"/><path d="M7 70.5H57" stroke-width="1.2"/>
        <path d="M12 70.5Q15 76.5 18 70.5M46 70.5Q49 76.5 52 70.5" stroke-width="1.2"/>
        <path d="M21 62H43" stroke-width="2"/><path d="M41 51C46 50.6 46 57 40 57.3" stroke-width="1.7"/>
        <path d="M24.5 46.8Q32 44.6 39.5 46.8" stroke-width="1.3"/>
        <path class="jk-steam" pathLength="1" d="M24.5 46.4C23 42 26.5 38.5 25 34 26.8 36 28 38.5 28.8 40.6 29.5 36 31.5 33 32 29 32.5 33 34.5 36 35.2 40.6 36 38.5 37.2 36 39 34 37.5 38.5 41 42 39.5 46.4" stroke-width="1.5"/>
        <path class="jk-wisp" d="M32 24.6C30.8 22.4 33.2 20.6 32 17.8" stroke-width="1.1" opacity=".6"/>
      </g>
      <path d="M22.5 49H41.5C41.5 55.5 38 59.5 32 59.5 26 59.5 22.5 55.5 22.5 49Z" fill="url(#${id})"/>
      <g class="jk-jewels" fill="url(#${id})"><circle cx="25" cy="32.4" r="1.5"/><circle cx="32" cy="27.2" r="1.6"/><circle cx="39" cy="32.4" r="1.5"/></g>
    </svg>`;
  };
  window.darbarMark = mark;
  // browser-tab icon on every page
  if (!document.querySelector('link[rel~="icon"]')) {
    const ic = document.createElement('link'); ic.rel = 'icon'; ic.type = 'image/svg+xml'; ic.href = 'darbar-favicon.svg';
    document.head.appendChild(ic);
  }
  const LINKS = [
    ['index.html', 'Home'], ['menu.html', 'Menu'], ['reservation.html', 'Reserve'],
    ['passport.html', 'Passport'], ['about.html', 'Our Story'], ['contact.html', 'Contact'],
  ];

  // Text that rolls letter-by-letter on hover
  const letters = text => [...text].map((c, i) => `<span class="ch" style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  const roll = text => `<span class="roll"><span class="roll-line">${letters(text)}</span><span class="roll-line" aria-hidden="true">${letters(text)}</span></span>`;

  if (!document.querySelector('script[src*="font-awesome"], link[href*="font-awesome"]')) {
    const fa = document.createElement('link'); fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
    document.head.appendChild(fa);
  }

  /* ---------------- header ---------------- */
  const hasSound = !!document.getElementById('soundToggleBtn');
  const header = document.createElement('header');
  header.className = 'dnav';
  header.id = 'nav';
  header.innerHTML = `
    <a class="dnav-logo" href="index.html" aria-label="Coffee Darbar home" data-in style="--d:0">${mark('dnav-mark')}<span class="dnav-rule" aria-hidden="true"></span><span class="dnav-word"><span class="dw-top">Coffee</span><span class="dw-main">Darbar</span></span></a>
    <nav class="dnav-links" aria-label="Main">
      <span class="dnav-indicator" aria-hidden="true"></span>
      ${LINKS.map(([href, label], i) => `<a class="dnav-link${href === page ? ' is-active' : ''}" href="${href}"${href === page ? ' aria-current="page"' : ''} data-in style="--d:${120 + i * 70}">${roll(label)}</a>`).join('')}
    </nav>
    <div class="dnav-right">
      ${hasSound ? '<button class="dpill dpill-round dpill-ghost" id="soundToggleBtn" aria-label="Toggle ambient sound" data-in style="--d:500"><i class="fa-solid fa-volume-high"></i></button>' : ''}
      <a class="dpill dpill-gold dnav-order" href="${page === 'menu.html' ? 'order.html' : 'menu.html'}" data-in style="--d:560">${roll(page === 'menu.html' ? 'Checkout' : 'Order Now')}<span class="dpill-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i><i class="fa-solid fa-arrow-right"></i></span></a>
      <button class="dnav-cart nav-cart" id="cartBtn" aria-label="Open your order" data-in style="--d:620"><i class="fa-solid fa-mug-saucer"></i><span class="dnav-count" id="cartCount">0</span></button>
      <button class="dnav-burger" id="dnavBurger" aria-label="Open menu" aria-expanded="false" aria-controls="dnavOverlay" data-in style="--d:680"><span></span><span></span></button>
    </div>`;
  const oldNav = document.querySelector('nav.hardi-nav, header.nav');
  if (oldNav) oldNav.replaceWith(header); else document.body.prepend(header);

  const overlay = document.createElement('div');
  overlay.className = 'dnav-overlay'; overlay.id = 'dnavOverlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = LINKS.map(([href, label], i) => `<a class="ov-link" href="${href}"${href === page ? ' aria-current="page"' : ''} style="--i:${i}"><span>0${i + 1}</span><b>${label}</b></a>`).join('')
    + '<div class="ov-foot"><span>UPES Campus, Dehradun · 7am – 10pm</span><span>@coffeedarbar</span></div>';
  header.after(overlay);

  /* ---------------- cart ---------------- */
  const countEl = header.querySelector('#cartCount');
  try { countEl.textContent = JSON.parse(localStorage.getItem('hardiCart') || '[]').reduce((s, i) => s + (i.qty || 0), 0); } catch (e) { /* storage blocked */ }
  // Pages without a cart drawer just go to the order page.
  header.querySelector('#cartBtn').addEventListener('click', () => {
    if (typeof window.openCartDrawer !== 'function' && !document.getElementById('drawer') && page !== 'order.html') location.href = 'order.html';
  });

  /* ---------------- sliding hover indicator ---------------- */
  const bar = header.querySelector('.dnav-links'), indicator = header.querySelector('.dnav-indicator');
  const links = [...header.querySelectorAll('.dnav-link')];
  const active = links.find(l => l.classList.contains('is-active'));
  const moveTo = (el, instant) => {
    if (!el) { indicator.style.opacity = '0'; return; }
    const b = bar.getBoundingClientRect(), r = el.getBoundingClientRect();
    indicator.style.transition = instant || reduceMotion ? 'none' : 'transform .7s cubic-bezier(.16,1,.3,1), width .7s cubic-bezier(.16,1,.3,1), opacity .4s';
    indicator.style.width = r.width + 'px';
    indicator.style.transform = `translateX(${r.left - b.left - 1}px)`; // -1 = bar border
    indicator.style.opacity = '1';
  };
  links.forEach(l => {
    l.addEventListener('pointerenter', () => { links.forEach(o => o.classList.toggle('is-hover', o === l)); moveTo(l); });
  });
  bar.addEventListener('pointerleave', () => { links.forEach(o => o.classList.remove('is-hover')); moveTo(active); });
  addEventListener('resize', () => moveTo(active, true));

  /* ---------------- mobile overlay ---------------- */
  const burger = header.querySelector('#dnavBurger');
  const setMenu = open => {
    const r = burger.getBoundingClientRect();
    overlay.style.setProperty('--ox', r.left + r.width / 2 + 'px');
    overlay.style.setProperty('--oy', r.top + r.height / 2 + 'px');
    overlay.classList.toggle('open', open); header.classList.toggle('menu-open', open);
    overlay.setAttribute('aria-hidden', String(!open)); burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    const lenis = window.__darbarLenis; if (lenis) open ? lenis.stop() : lenis.start();
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!overlay.classList.contains('open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) setMenu(false); });

  /* ---------------- scroll states: light glass + hide on scroll down ---------------- */
  // the dark band at the top of the page (checked in priority order: on the menu page
  // the whole collection sits inside .inner-hero, so .collection-intro must win)
  const hero = ['#hero', '.collection-intro', '.passport-cover', '.inner-hero', '.not-found'].map(s => document.querySelector(s)).find(Boolean);
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    const limit = hero ? hero.getBoundingClientRect().bottom + y - 80 : 10;
    header.classList.toggle('light', y > limit);
    if (!overlay.classList.contains('open')) {
      if (y > 160 && y - lastY > 4) header.classList.add('is-hidden');
      else if (y - lastY < -4 || y < 160) header.classList.remove('is-hidden');
    }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------------- entrance ---------------- */
  const enter = () => { header.classList.add('dnav-in'); setTimeout(() => moveTo(active, true), 50); };
  if (document.getElementById('loader') && !window.__darbar3dReady) {
    addEventListener('darbar:intro', enter, { once: true });
    setTimeout(enter, 7600);
  } else requestAnimationFrame(() => requestAnimationFrame(enter));
  if (document.fonts) document.fonts.ready.then(() => moveTo(active, true));

  /* ---------------- footer (inner pages; the homepage has its own) ---------------- */
  // the mark sits above the big footer wordmark (homepage footer + the shared one)
  const homeWord = document.querySelector('.footer-word');
  if (homeWord) { homeWord.insertAdjacentHTML('beforebegin', `<div class="dfoot-mark">${mark('dfoot-emblem')}</div>`); return; }
  const footer = document.createElement('footer');
  footer.className = 'dfoot';
  footer.innerHTML = `
    <div class="dfoot-cols">
      <div><h4>Visit</h4><p>UPES Campus, Bidholi<br>Dehradun, Uttarakhand</p><p>Open daily · 7am – 10pm</p></div>
      <div><h4>Explore</h4>${LINKS.slice(1).map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}</div>
      <div><h4>Darbar Dispatch</h4><p>One considered email, every Friday.</p>
        <form class="dfoot-news"><label class="dsr" for="dfootEmail">Email address</label><input id="dfootEmail" type="email" placeholder="you@example.com" required><button class="dpill dpill-gold" type="submit">Join</button></form></div>
    </div>
    <div class="dfoot-mark">${mark('dfoot-emblem')}</div>
    <div class="dfoot-word" aria-hidden="true"><span class="fw-top">Coffee</span><span class="fw-main">Darbar</span></div>
    <div class="dfoot-bottom"><span>© 2026 Coffee Darbar · A UPES capstone</span><span><a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a></span></div>`;
  const oldFooter = document.querySelector('footer.footer, body > footer:not(.dfoot)');
  if (oldFooter) oldFooter.replaceWith(footer);
  else document.body.insertBefore(footer, [...document.body.children].find(el => el.tagName === 'SCRIPT') || null);
  footer.querySelector('form').addEventListener('submit', e => {
    e.preventDefault(); e.target.reset();
    const b = e.target.querySelector('button'); b.textContent = 'Joined ✦'; setTimeout(() => { b.textContent = 'Join'; }, 2400);
  });
})();

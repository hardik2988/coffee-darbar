// Coffee Darbar — Reserve page: drawn floor plan, live seat availability, seat details,
// reservation pass and the location map.
(() => {
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const img = (id, w = 1000) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

  /* ================================================================== */
  /* Data                                                                */
  /* ================================================================== */
  const PHOTO = {
    window: '1445116572660-236099ec97a0', pods: '1527192491265-7e15c55b1ed2', booths: '1552566626-52f8b828add9',
    bar: '1453614512568-c4024d13c247', salon: '1521017432531-fbd92d768814', darbar: '1517248135467-4c7edcad34c4',
    terrace: '1600093463592-8e36ae95ef56',
  };
  const ZONES = {
    window: { name: 'Valley Window', icon: 'fa-sun', line: 'A long oak counter against six metres of glass, facing the Doon valley.' },
    pods: { name: 'Deep Work Pods', icon: 'fa-laptop', line: 'Felt-lined alcoves on the north wall. The quietest seats in the house.' },
    salon: { name: 'The Salon', icon: 'fa-crown', line: 'The centre of the room: two marble duos and the eight-seat Royal Darbar table.' },
    booths: { name: 'Velvet Booths', icon: 'fa-couch', line: 'Emerald banquettes on the east wall, built for long conversations.' },
    bar: { name: 'Espresso Bar', icon: 'fa-mug-hot', line: 'Front-row stools at the marble bar, an arm\'s length from the machine.' },
    terrace: { name: 'Garden Terrace', icon: 'fa-leaf', line: 'Open-air teak tables by the railing, through the garden door.' },
  };
  // meters: privacy / quiet / buzz, 0–100
  const SEATS = [
    { id: 'W1', zone: 'window', cap: 2, name: 'Window Counter One', photo: PHOTO.window, tag: 'The corner of the glass, first to catch the morning.',
      desc: 'The westmost pair of stools on the oak counter, tucked beside the fiddle-leaf fig. You get the valley in front and a wall at your shoulder, so nobody passes behind you. Sunlight reaches this seat first, at about 7:40.',
      stats: { Light: 'Direct morning sun', Sound: 'Soft · 48 dB', Power: '2 sockets + USB-C', View: 'Doon valley, west ridge' }, m: [72, 70, 30],
      chips: ['Oak high counter', 'Leather-top stools', 'Footrail', 'Coat hook'], best: 'Solo mornings, journalling', min: 250 },
    { id: 'W2', zone: 'window', cap: 2, name: 'Window Counter Two', photo: PHOTO.window, tag: 'Dead centre of the view.',
      desc: 'Two stools facing the widest pane of glass. On a clear day you can follow the road down to Premnagar; in the monsoon the cloud sits below you. The counter here is deep enough for a laptop and a pour-over tray side by side.',
      stats: { Light: 'Bright, even daylight', Sound: 'Soft · 50 dB', Power: '2 sockets + USB-C', View: 'Full valley panorama' }, m: [55, 64, 38],
      chips: ['Oak high counter', 'Leather-top stools', 'Deep worktop', 'Footrail'], best: 'Working with a view', min: 250 },
    { id: 'W3', zone: 'window', cap: 2, name: 'Window Counter Three', photo: PHOTO.window, tag: 'Golden hour belongs to this seat.',
      desc: 'Slightly east of centre, where the late sun comes in low across the counter from about 4:30. Regulars book it for the last hour of light. A pendant lamp takes over once the sun drops behind the ridge.',
      stats: { Light: 'Warm afternoon sun', Sound: 'Soft · 51 dB', Power: '2 sockets + USB-C', View: 'Valley and sunset ridge' }, m: [52, 60, 42],
      chips: ['Oak high counter', 'Leather-top stools', 'Brass pendant lamp', 'Footrail'], best: 'Sunset coffee for two', min: 250 },
    { id: 'W4', zone: 'window', cap: 2, name: 'Window Counter Four', photo: PHOTO.window, tag: 'The east end of the glass, nearest the salon.',
      desc: 'The last pair on the counter, where the window wall ends and the room opens toward the Royal table. You get the valley in front and the life of the café at your back. A little livelier than the other window seats.',
      stats: { Light: 'Bright, breezy', Sound: 'Gentle · 54 dB', Power: '1 socket + USB-C', View: 'Valley, east ridge' }, m: [40, 50, 55],
      chips: ['Oak high counter', 'Leather-top stools', 'Brass pendant lamp', 'Footrail'], best: 'A quick catch-up', min: 250 },

    { id: 'P1', zone: 'pods', cap: 2, name: 'Deep Work Pod One', photo: PHOTO.pods, tag: 'Beside the window wall, with a sliver of daylight.',
      desc: 'A felt-lined alcove on the north wall with a walnut desk and a task chair you can sit in for three hours. Wool panels on three sides absorb the room; what reaches you is a low murmur. A second perch stool tucks under the desk for a study partner.',
      stats: { Light: 'Task lamp + side daylight', Sound: 'Hushed · 38 dB', Power: '2 sockets + 65W USB-C', View: 'Private, glimpse of window' }, m: [92, 94, 8],
      chips: ['Acoustic felt walls', 'Ergonomic task chair', 'Dimmable task lamp', 'Monitor shelf', 'Do-not-disturb flag'], best: 'Exam prep, deep focus', min: 300 },
    { id: 'P2', zone: 'pods', cap: 2, name: 'Deep Work Pod Two', photo: PHOTO.pods, tag: 'The middle pod. Balanced and steady.',
      desc: 'Identical in build to Pod One, the middle of the three. It has the most even temperature in the café and the strongest Wi-Fi signal, sitting directly under the access point. Favoured for long video calls: the felt keeps your voice in and the room out.',
      stats: { Light: 'Warm task lamp', Sound: 'Hushed · 39 dB', Power: '2 sockets + 65W USB-C', View: 'Private' }, m: [95, 92, 8],
      chips: ['Acoustic felt walls', 'Ergonomic task chair', 'Dimmable task lamp', 'Strongest Wi-Fi', 'Do-not-disturb flag'], best: 'Calls, coding sessions', min: 300 },
    { id: 'P3', zone: 'pods', cap: 2, name: 'Deep Work Pod Three', photo: PHOTO.pods, tag: 'The corner pod, beside the velvet booths.',
      desc: 'The eastern pod, tucked into the corner where the north wall meets the booths. A little more murmur reaches you from the booth beside it, but it is the most hidden seat in the café. Still enclosed on three sides, still good for a full afternoon.',
      stats: { Light: 'Warm task lamp', Sound: 'Quiet · 43 dB', Power: '2 sockets + 65W USB-C', View: 'Private corner' }, m: [86, 82, 18],
      chips: ['Acoustic felt walls', 'Ergonomic task chair', 'Dimmable task lamp', 'Monitor shelf', 'Most hidden seat'], best: 'Long writing days', min: 300 },

    { id: 'C1', zone: 'salon', cap: 2, name: 'Salon Duo West', photo: PHOTO.salon, tag: 'A marble two-top in the middle of things.',
      desc: 'A round Makrana marble table with two cane-back chairs, set between the window counter and the Royal table. From here you see the whole room: the bar working, the window light, people coming and going. The classic café seat.',
      stats: { Light: 'Pendant glow + daylight', Sound: 'Lively · 58 dB', Power: 'Floor socket', View: 'The whole room' }, m: [30, 35, 78],
      chips: ['Makrana marble top', 'Cane-back chairs', 'Brass pendant lamp', 'Table service'], best: 'People-watching, first dates', min: 200 },
    { id: 'C2', zone: 'salon', cap: 2, name: 'Salon Duo East', photo: PHOTO.salon, tag: 'A marble two-top beside the booths.',
      desc: 'The twin of Salon West, set nearer the velvet booths and the pods. It sits a little out of the main walkway, so it is calmer than its position suggests. Good light for photographs until mid-afternoon.',
      stats: { Light: 'Pendant glow + daylight', Sound: 'Lively · 56 dB', Power: 'Floor socket', View: 'Room and terrace door' }, m: [38, 40, 70],
      chips: ['Makrana marble top', 'Cane-back chairs', 'Brass pendant lamp', 'Table service'], best: 'Coffee and a pastry for two', min: 200 },
    { id: 'D1', zone: 'salon', cap: 8, name: 'The Royal Darbar Table', photo: PHOTO.darbar, tag: 'Eight seats under the brass chandelier.',
      desc: 'The table the café is named for. A single slab of sheesham, three metres long, on a hand-knotted oxblood rug beneath the chandelier. Eight upholstered chairs, a host who looks after only your table, and a shared pour-over service brought on a brass tray.',
      stats: { Light: 'Chandelier, dimmable', Sound: 'Convivial · 60 dB', Power: '4 sockets in table', View: 'Centre of the room' }, m: [45, 30, 90],
      chips: ['Sheesham slab table', 'Dedicated host', 'Brass chandelier', 'Shared pour-over service', 'HDMI screen on request'], best: 'Team meets, birthdays', min: 1600 },

    { id: 'B1', zone: 'booths', cap: 4, name: 'Velvet Booth One', photo: PHOTO.booths, tag: 'An emerald horseshoe for four.',
      desc: 'A U-shaped banquette in emerald velvet around a low walnut table. The high back closes you off from the room on three sides, and a wall sconce keeps the light soft at any hour. Conversations stay inside the booth.',
      stats: { Light: 'Low sconce glow', Sound: 'Cosy · 52 dB', Power: '2 sockets + USB-C', View: 'Sheltered, facing the salon' }, m: [80, 62, 45],
      chips: ['Emerald velvet banquette', 'Walnut low table', 'Wall sconce', 'Cushions', 'Table service'], best: 'Friends, slow conversations', min: 700 },
    { id: 'B2', zone: 'booths', cap: 6, name: 'The Master Booth', photo: PHOTO.booths, tag: 'The largest booth, in the quiet corner.',
      desc: 'A deeper, wider banquette in the south-east corner with room for six, beside the door to the garden terrace. It is the furthest seat from the bar, so it stays calm even at peak hours. The walnut table is big enough for a board game or a shared dessert board.',
      stats: { Light: 'Low sconce glow', Sound: 'Cosy · 54 dB', Power: '3 sockets + USB-C', View: 'Corner, facing the salon' }, m: [84, 58, 52],
      chips: ['Emerald velvet banquette', 'Large walnut table', 'Pendant lamp', 'Terrace door beside it', 'Table service'], best: 'Groups, project teams', min: 1100 },

    { id: 'S1', zone: 'bar', cap: 1, name: 'Bar Stool One', photo: PHOTO.bar, tag: 'In front of the grinders.',
      desc: 'The stool at the grinder end of the marble bar. You hear every dose being ground and smell it a second later. The barista will talk you through what is in the hopper today if you ask.',
      stats: { Light: 'Bar pendants', Sound: 'Lively · 62 dB', Power: 'USB-C under bar', View: 'Grinders and dosing' }, m: [20, 18, 92],
      chips: ['Marble bar top', 'Swivel stool', 'Bag hook', 'Barista conversation'], best: 'A quick espresso', min: 150 },
    { id: 'S2', zone: 'bar', cap: 1, name: 'Bar Stool Two', photo: PHOTO.bar, tag: 'Front row at the espresso machine.',
      desc: 'Directly opposite the group heads. Every shot is pulled a metre from your cup, and latte art is poured on the bar in front of you. The most requested single seat in the café.',
      stats: { Light: 'Bar pendants', Sound: 'Lively · 63 dB', Power: 'USB-C under bar', View: 'Espresso machine, latte art' }, m: [18, 15, 96],
      chips: ['Marble bar top', 'Swivel stool', 'Bag hook', 'Front-row extraction'], best: 'Coffee lovers, solo visits', min: 150 },
    { id: 'S3', zone: 'bar', cap: 1, name: 'Bar Stool Three', photo: PHOTO.bar, tag: 'At the slow bar, by the pastry case.',
      desc: 'The stool at the pour-over end, beside the pastry case. This is where V60s and filter kaapi are brewed by hand, so the pace is slower and the barista has time to chat. Warm croissants come out of the case at 8 and 4.',
      stats: { Light: 'Bar pendants', Sound: 'Lively · 59 dB', Power: 'USB-C under bar', View: 'Pour-over station' }, m: [24, 24, 84],
      chips: ['Marble bar top', 'Swivel stool', 'Bag hook', 'Slow-bar brewing'], best: 'Pour-over and a pastry', min: 150 },

    { id: 'T1', zone: 'terrace', cap: 4, name: 'Terrace Table West', photo: PHOTO.terrace, tag: 'Open sky, by the herb planters.',
      desc: 'A round teak table for four on the stone terrace, nearest the garden door. The planters beside it grow the mint and lemongrass used at the bar. Open air, valley breeze, a lantern on the table and blankets on the chairs after dusk.',
      stats: { Light: 'Open sky', Sound: 'Open air · 50 dB', Power: 'None (power bank on loan)', View: 'Garden and valley' }, m: [50, 55, 48],
      chips: ['Teak table', 'Table lantern', 'Blankets after dusk', 'Pet friendly', 'Herb garden'], best: 'Brunch, sunny afternoons', min: 600 },
    { id: 'T2', zone: 'terrace', cap: 4, name: 'Terrace Table East', photo: PHOTO.terrace, tag: 'The far corner, at the railing.',
      desc: 'The eastern terrace table, set against the railing where the hillside falls away. It has the widest outdoor view and the best stars after eight. A patio heater stands beside it from November to February.',
      stats: { Light: 'Open sky', Sound: 'Open air · 47 dB', Power: 'None (power bank on loan)', View: 'Valley edge, night sky' }, m: [66, 62, 36],
      chips: ['Teak table', 'Table lantern', 'Patio heater in winter', 'Pet friendly', 'Railing-side view'], best: 'Evenings, small celebrations', min: 600 },
  ];
  // Three or four photos for every seat (lead photo first), and a caption for each photo
  const SHOTS = {
    W1: ['1445116572660-236099ec97a0', '1534040385115-33dcb3acba5b', '1559496417-e7f25cb247f3'],
    W2: ['1534040385115-33dcb3acba5b', '1551632436-cbf8dd35adfa', '1445116572660-236099ec97a0'],
    W3: ['1551632436-cbf8dd35adfa', '1559496417-e7f25cb247f3', '1534040385115-33dcb3acba5b'],
    W4: ['1445116572660-236099ec97a0', '1551632436-cbf8dd35adfa', '1506372023823-741c83b836fe'],
    P1: ['1524758631624-e2822e304c36', '1527192491265-7e15c55b1ed2', '1542372147193-a7aca54189cd'],
    P2: ['1527192491265-7e15c55b1ed2', '1519389950473-47ba0277781c', '1524758631624-e2822e304c36'],
    P3: ['1542372147193-a7aca54189cd', '1524758631624-e2822e304c36', '1522071820081-009f0129c71c'],
    C1: ['1521017432531-fbd92d768814', '1555396273-367ea4eb4db5', '1506372023823-741c83b836fe'],
    C2: ['1555396273-367ea4eb4db5', '1505275350441-83dcda8eeef5', '1572442388796-11668a67e53d'],
    D1: ['1517248135467-4c7edcad34c4', '1590846406792-0adc7f938f1d', '1414235077428-338989a2e8c0', '1495474472287-4d71bcdd2085'],
    B1: ['1537047902294-62a40c20a6ae', '1552566626-52f8b828add9', '1495474472287-4d71bcdd2085'],
    B2: ['1552566626-52f8b828add9', '1537047902294-62a40c20a6ae', '1525193612562-0ec53b0e5d7c'],
    S1: ['1511920170033-f8396924c348', '1453614512568-c4024d13c247', '1511537190424-bbbab87ac5eb'],
    S2: ['1453614512568-c4024d13c247', '1541167760496-1628856ab772', '1442975631115-c4f7b05b8a2c'],
    S3: ['1442512595331-e89e73853f31', '1511081692775-05d0f180a065', '1541167760496-1628856ab772'],
    T1: ['1560624052-449f5ddf0c31', '1600093463592-8e36ae95ef56', '1461023058943-07fcbe16d735'],
    T2: ['1600093463592-8e36ae95ef56', '1559925393-8be0ec4767c8', '1504753793650-d4a2b783c15e'],
  };
  const CAPTION = {
    '1445116572660-236099ec97a0': 'A table at the glass', '1534040385115-33dcb3acba5b': 'Morning light on the counter', '1551632436-cbf8dd35adfa': 'The window wall',
    '1559496417-e7f25cb247f3': 'Espresso in the afternoon sun', '1506372023823-741c83b836fe': 'Poured to order', '1524758631624-e2822e304c36': 'A quiet corner',
    '1527192491265-7e15c55b1ed2': 'The work floor', '1542372147193-a7aca54189cd': 'A book, a cup, no hurry', '1519389950473-47ba0277781c': 'Room for a study partner',
    '1522071820081-009f0129c71c': 'Heads down', '1521017432531-fbd92d768814': 'The salon floor', '1555396273-367ea4eb4db5': 'The room at midday',
    '1505275350441-83dcda8eeef5': 'The salon from above', '1572442388796-11668a67e53d': 'A rosetta, every time', '1517248135467-4c7edcad34c4': 'Set for the evening',
    '1590846406792-0adc7f938f1d': 'Under the brass lamps', '1414235077428-338989a2e8c0': 'Laid for a celebration', '1495474472287-4d71bcdd2085': 'To good company',
    '1537047902294-62a40c20a6ae': 'Tufted velvet, low light', '1552566626-52f8b828add9': 'The booth row', '1525193612562-0ec53b0e5d7c': 'The long table nearby',
    '1511920170033-f8396924c348': 'Dosed by hand', '1453614512568-c4024d13c247': 'Behind the bar', '1511537190424-bbbab87ac5eb': 'Roasted in-house',
    '1541167760496-1628856ab772': 'Latte art at arm\'s length', '1442975631115-c4f7b05b8a2c': 'The counter at work', '1442512595331-e89e73853f31': 'The slow bar',
    '1511081692775-05d0f180a065': 'Shelves and the pastry case', '1560624052-449f5ddf0c31': 'The garden terrace', '1600093463592-8e36ae95ef56': 'The garden side',
    '1559925393-8be0ec4767c8': 'Tables in the open air', '1461023058943-07fcbe16d735': 'Iced, for warm afternoons', '1504753793650-d4a2b783c15e': 'Cold brew, slowly',
  };
  SEATS.forEach(s => { s.photos = SHOTS[s.id] || [s.photo]; });
  const seatById = Object.fromEntries(SEATS.map(s => [s.id, s]));

  /* ---------- small animation helpers ---------- */
  // change text with a quick roll, only when it really changed
  function swap(el, text) {
    if (!el || el.dataset.v === text) return;
    const first = el.dataset.v === undefined; el.dataset.v = text; el.textContent = text;
    if (first || reduce) return;
    el.classList.remove('rv-flip'); void el.offsetWidth; el.classList.add('rv-flip');
  }
  // count a number up or down to its new value
  function countTo(el, to, fmt = n => String(n)) {
    const from = +(el.dataset.n || 0); el.dataset.n = to;
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 700;
    const tick = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1 && +el.dataset.n === to) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  const SLOTS = [
    ['Morning', ['07:30', '08:30', '09:30', '10:30', '11:30']],
    ['Afternoon', ['12:30', '13:30', '14:30', '15:30', '16:30']],
    ['Evening', ['17:30', '18:30', '19:30', '20:30']],
  ];
  const OCCASIONS = [['Just coffee', 'fa-mug-saucer'], ['Deep work', 'fa-laptop'], ['A date', 'fa-heart'], ['Team meet', 'fa-people-group'], ['Celebration', 'fa-champagne-glasses']];
  const ADDONS = [
    { id: 'nameplate', name: 'Engraved brass nameplate', line: 'Your name set on the table before you arrive.', price: 0, on: true, icon: 'fa-signature' },
    { id: 'v60', name: 'Tableside V60 by the head barista', line: 'Single-origin pour-over brewed at your seat.', price: 150, icon: 'fa-filter' },
    { id: 'flight', name: 'Three-origin tasting flight', line: 'Ethiopia, Chikmagalur and Colombia, side by side.', price: 220, icon: 'fa-flask' },
    { id: 'plate', name: 'Celebration dessert plate', line: 'Basque cheesecake, a candle and a handwritten card.', price: 260, icon: 'fa-cake-candles' },
    { id: 'quiet', name: 'Do-not-disturb card', line: 'Service only when you raise the flag.', price: 0, icon: 'fa-bell-slash' },
  ];

  /* ================================================================== */
  /* State + availability                                                */
  /* ================================================================== */
  const pad = n => String(n).padStart(2, '0');
  const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const now = new Date();
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i); return d; });
  const allSlots = SLOTS.flatMap(g => g[1]);
  const slotPassed = (d, s) => dayKey(d) === dayKey(now) && (+s.slice(0, 2) * 60 + +s.slice(3)) <= now.getHours() * 60 + now.getMinutes() + 20;
  const fmt12 = s => { let h = +s.slice(0, 2); const m = s.slice(3), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${m} ${ap}`; };

  const state = { day: days[0], slot: null, guests: 2, seat: null, occasion: OCCASIONS[0][0], addons: new Set(ADDONS.filter(a => a.on).map(a => a.id)), confirmed: null };
  // first slot still ahead of us; if today is over, start tomorrow
  state.slot = allSlots.find(s => !slotPassed(state.day, s));
  if (!state.slot) { state.day = days[1]; state.slot = '08:30'; }

  let mine = [];
  try { mine = JSON.parse(localStorage.getItem('darbarReservations') || '[]'); } catch (e) { mine = []; }
  const hash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); };
  // Demo availability: stable for a given seat + date + time, busier in the evening.
  function isTaken(id, day = state.day, slot = state.slot) {
    const k = dayKey(day);
    if (mine.some(r => r.seat === id && r.date === k && r.slot === slot)) return true;
    const hour = +slot.slice(0, 2), busy = hour >= 17 ? 44 : hour >= 12 ? 32 : 22;
    return hash(id + k + slot) % 100 < busy;
  }
  const isMine = id => mine.some(r => r.seat === id && r.date === dayKey(state.day) && r.slot === state.slot);
  const fits = s => s.cap >= state.guests;
  const freeSeats = () => SEATS.filter(s => !isTaken(s.id) && fits(s));

  /* ================================================================== */
  /* Floor plan (SVG, drawn to a 1200 × 800 grid; 1 unit ≈ 1.5 cm)       */
  /* ================================================================== */
  const chair = (x, y, deg, c = '#b98a55', b = '#8a6238') =>
    `<g transform="translate(${x} ${y}) rotate(${deg})"><rect x="-13" y="-10" width="26" height="23" rx="7" fill="${c}"/><rect x="-14.5" y="-15" width="29" height="9" rx="4.5" fill="${b}"/></g>`;
  const stool = (x, y, c = '#6b4423') => `<circle cx="${x}" cy="${y}" r="13" fill="${c}"/><circle cx="${x}" cy="${y}" r="9" fill="#8d5f34"/><circle cx="${x}" cy="${y}" r="13" fill="none" stroke="#c9a15f" stroke-width="1.2" opacity=".7"/>`;
  const cup = (x, y) => `<circle cx="${x}" cy="${y}" r="6.5" fill="#f4ecdc"/><circle cx="${x}" cy="${y}" r="4" fill="#5a2f15"/>`;
  const plant = (x, y, r = 22) => {
    let leaves = '';
    for (let i = 0; i < 9; i++) { const a = i * 40 + (r % 7) * 9; leaves += `<ellipse cx="${x}" cy="${y - r * 0.55}" rx="${r * 0.3}" ry="${r * 0.62}" fill="${i % 2 ? '#4f7a48' : '#3d6639'}" transform="rotate(${a} ${x} ${y})"/>`; }
    return `<g filter="url(#fpShadow)"><circle cx="${x}" cy="${y}" r="${r * 0.52}" fill="#8a5a3a"/>${leaves}<circle cx="${x}" cy="${y}" r="${r * 0.16}" fill="#2f5230"/></g>`;
  };
  const light = (x, y, r, o = 0.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#fpLight)" opacity="${o}" style="mix-blend-mode:screen" pointer-events="none"/>`;
  const label = (x, y, text, anchor = 'middle') => `<text class="fp-label" x="${x}" y="${y}" text-anchor="${anchor}">${text}</text>`;

  // every seat: hit box [x, y, w, h], tag position, furniture
  const FURNITURE = {};
  [170, 300, 430, 560].forEach((cx, i) => {
    FURNITURE['W' + (i + 1)] = { box: [cx - 58, 170, 116, 84], tag: [cx, 262],
      art: stool(cx - 22, 228) + stool(cx + 22, 228) + cup(cx - 22, 192) + cup(cx + 24, 190) };
  });
  [270, 388, 506].forEach((y0, i) => {
    FURNITURE['P' + (i + 1)] = { box: [50, y0 - 4, 162, 108], tag: [228, y0 + 50],
      art: `<path d="M204 ${y0} H56 V${y0 + 100} H204" fill="#4a5a47" fill-opacity=".28" stroke="#41503e" stroke-width="9" stroke-linejoin="round"/>
        <rect x="64" y="${y0 + 12}" width="50" height="76" rx="5" fill="url(#fpWalnut)"/>
        <rect x="70" y="${y0 + 30}" width="30" height="40" rx="3" fill="#2a2a2e"/><rect x="73" y="${y0 + 33}" width="24" height="34" rx="2" fill="#5d6f86"/>
        <circle cx="76" cy="${y0 + 20}" r="6" fill="#e7cb8f"/>${chair(140, y0 + 50, 90, '#3f4b57', '#2c353e')}<circle cx="182" cy="${y0 + 80}" r="9" fill="#6b4423"/>` };
  });
  FURNITURE.C1 = { box: [300, 292, 110, 110], tag: [355, 414], art: chair(355, 310, 0) + chair(355, 384, 180) + `<circle cx="355" cy="347" r="27" fill="url(#fpMarble)" stroke="#d8cdb8" stroke-width="1.5"/>` + cup(347, 342) + cup(364, 353) };
  FURNITURE.C2 = { box: [770, 292, 110, 110], tag: [825, 414], art: chair(825, 310, 0) + chair(825, 384, 180) + `<circle cx="825" cy="347" r="27" fill="url(#fpMarble)" stroke="#d8cdb8" stroke-width="1.5"/>` + cup(817, 342) + cup(834, 353) };
  FURNITURE.D1 = { box: [416, 420, 348, 124], tag: [590, 556],
    art: [478, 552, 628, 702].map(x => chair(x, 440, 0, '#7a2a25', '#561c19') + chair(x, 524, 180, '#7a2a25', '#561c19')).join('') +
      `<rect x="440" y="454" width="300" height="56" rx="28" fill="url(#fpSheesham)" stroke="#3a1f10" stroke-width="1.5"/>
       <rect x="560" y="469" width="60" height="26" rx="13" fill="#c9a15f" opacity=".9"/><circle cx="578" cy="482" r="6" fill="#f4ecdc"/><circle cx="602" cy="482" r="6" fill="#f4ecdc"/>` +
      cup(480, 474) + cup(520, 490) + cup(662, 474) + cup(702, 490) };
  FURNITURE.B1 = { box: [952, 246, 196, 152], tag: [934, 322],
    art: `<path d="M962 256 H1140 V388 H962 V352 H1100 V292 H962 Z" fill="url(#fpVelvet)" stroke="#1f3d2e" stroke-width="2"/>
      <path d="M962 262 H1134 M962 382 H1134 M1134 262 V382" stroke="#17301f" stroke-width="5" opacity=".55" fill="none"/>
      <rect x="978" y="302" width="104" height="40" rx="10" fill="url(#fpWalnut)"/>` + cup(1000, 322) + cup(1058, 318) };
  FURNITURE.B2 = { box: [940, 420, 208, 196], tag: [922, 518],
    art: `<path d="M952 430 H1140 V606 H952 V566 H1096 V470 H952 Z" fill="url(#fpVelvet)" stroke="#1f3d2e" stroke-width="2"/>
      <path d="M952 436 H1134 M952 600 H1134 M1134 436 V600" stroke="#17301f" stroke-width="5" opacity=".55" fill="none"/>
      <rect x="966" y="484" width="112" height="68" rx="12" fill="url(#fpWalnut)"/>` + cup(990, 505) + cup(1052, 530) + cup(1020, 518) };
  [450, 560, 670].forEach((x, i) => { FURNITURE['S' + (i + 1)] = { box: [x - 38, 596, 76, 92], tag: [x, 672], art: stool(x, 620, '#3a2416') + cup(x + 34, 664) }; });
  [860, 1040].forEach((x, i) => {
    FURNITURE['T' + (i + 1)] = { box: [x - 72, 22, 144, 132], tag: [x, 158],
      art: chair(x, 46, 0, '#c8a877', '#9a7b4d') + chair(x, 132, 180, '#c8a877', '#9a7b4d') + chair(x - 44, 89, -90, '#c8a877', '#9a7b4d') + chair(x + 44, 89, 90, '#c8a877', '#9a7b4d') +
        `<circle cx="${x}" cy="89" r="27" fill="url(#fpTeak)"/>` + cup(x - 8, 84) + cup(x + 9, 95) +
        `<circle cx="${x}" cy="89" r="64" fill="#f6ecd6" opacity=".16" stroke="#f6ecd6" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="3 5"/>` };
  });

  function planSVG() {
    const seats = SEATS.map((s, i) => {
      const f = FURNITURE[s.id], [x, y, w, h] = f.box, [tx, ty] = f.tag;
      return `<g class="fp-seat" data-seat="${s.id}" data-zone="${s.zone}" style="--i:${i}" tabindex="0" role="button" aria-label="${s.name}, seats ${s.cap}">
        <rect class="fp-ring" x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/>
        <g class="fp-art" filter="url(#fpShadow)">${f.art}</g>
        <g class="fp-tag" transform="translate(${tx} ${ty})"><rect x="-23" y="-13" width="46" height="26" rx="13"/><text y="5">${s.id}</text></g>
        <rect class="fp-hit" x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/>
      </g>`;
    }).join('');
    return `<svg viewBox="0 0 1200 800" role="group" aria-label="Coffee Darbar floor plan">
      <defs>
        <pattern id="fpWood" width="160" height="56" patternUnits="userSpaceOnUse">
          <rect width="160" height="56" fill="#a9794a"/>
          <rect width="160" height="27" fill="#b08052"/><rect x="0" y="28" width="80" height="27" fill="#a47445"/><rect x="80" y="28" width="80" height="27" fill="#b4855a"/>
          <path d="M0 27.5H160M0 55.5H160M80 28V56M40 0V27M130 0V27" stroke="#6f4a28" stroke-width="1" opacity=".55"/>
          <path d="M6 9c30-4 60 4 96 0M20 19c40 3 70-3 120 1M10 40c20-3 40 3 62 0M92 46c20 3 40-3 60 0" stroke="#7d552f" stroke-width=".7" fill="none" opacity=".45"/>
        </pattern>
        <pattern id="fpStone" width="84" height="84" patternUnits="userSpaceOnUse">
          <rect width="84" height="84" fill="#9c9484"/><rect x="2" y="2" width="38" height="38" fill="#a8a090"/><rect x="44" y="2" width="38" height="38" fill="#958d7d"/><rect x="2" y="44" width="38" height="38" fill="#91897a"/><rect x="44" y="44" width="38" height="38" fill="#a39b8b"/>
        </pattern>
        <pattern id="fpTile" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="36" fill="#6f675e"/><path d="M0 .5H36M.5 0V36" stroke="#58514a" stroke-width="1"/></pattern>
        <pattern id="fpGrass" width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="#2f3a26"/><path d="M4 20l2-7M13 9l2-6M21 22l1-8" stroke="#3d4b30" stroke-width="1.4" stroke-linecap="round"/></pattern>
        <linearGradient id="fpWalnut" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6e4526"/><stop offset=".5" stop-color="#553218"/><stop offset="1" stop-color="#3f2411"/></linearGradient>
        <linearGradient id="fpSheesham" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5c2f16"/><stop offset=".3" stop-color="#7a4321"/><stop offset=".6" stop-color="#5a2d15"/><stop offset="1" stop-color="#6d3a1c"/></linearGradient>
        <radialGradient id="fpTeak"><stop offset="0" stop-color="#c79a62"/><stop offset="1" stop-color="#9a6f3e"/></radialGradient>
        <radialGradient id="fpMarble" cx=".35" cy=".3"><stop offset="0" stop-color="#fffdf8"/><stop offset=".7" stop-color="#ece4d4"/><stop offset="1" stop-color="#d2c7b2"/></radialGradient>
        <linearGradient id="fpVelvet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6a4b"/><stop offset=".5" stop-color="#235238"/><stop offset="1" stop-color="#1a3f2b"/></linearGradient>
        <linearGradient id="fpBar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3ede0"/><stop offset=".4" stop-color="#fffdf7"/><stop offset=".7" stop-color="#e6dcc9"/><stop offset="1" stop-color="#f5efe3"/></linearGradient>
        <radialGradient id="fpLight"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".85"/><stop offset=".5" stop-color="#ffc67a" stop-opacity=".28"/><stop offset="1" stop-color="#ffc67a" stop-opacity="0"/></radialGradient>
        <radialGradient id="fpRug"><stop offset="0" stop-color="#7c2622"/><stop offset=".62" stop-color="#6b1f1c"/><stop offset=".64" stop-color="#c9a15f"/><stop offset=".67" stop-color="#5a1815"/><stop offset=".9" stop-color="#641c19"/><stop offset=".92" stop-color="#c9a15f"/><stop offset=".95" stop-color="#4d1412"/><stop offset="1" stop-color="#4d1412"/></radialGradient>
        <linearGradient id="fpSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3d6" stop-opacity=".55"/><stop offset="1" stop-color="#fff3d6" stop-opacity="0"/></linearGradient>
        <filter id="fpShadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#1a0c05" flood-opacity=".45"/></filter>
        <filter id="fpSoft" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".4"/></filter>
      </defs>

      <!-- outside: hillside and terrace -->
      <rect width="1200" height="800" fill="url(#fpGrass)"/>
      <rect x="640" y="18" width="528" height="150" rx="6" fill="url(#fpStone)"/>
      <path d="M640 18H1168V168" fill="none" stroke="#2a1a10" stroke-width="5"/><path d="M640 18H1168V168" fill="none" stroke="#c9a15f" stroke-width="1.2" stroke-dasharray="2 12"/>
      ${[690, 742].map(x => `<rect x="${x}" y="30" width="40" height="22" rx="5" fill="#6b4a2e"/><ellipse cx="${x + 12}" cy="41" rx="9" ry="7" fill="#4f7a48"/><ellipse cx="${x + 28}" cy="41" rx="9" ry="7" fill="#5d8a52"/>`).join('')}
      ${plant(1140, 46, 20)}${plant(952, 150, 15)}

      <!-- building -->
      <rect x="40" y="160" width="1120" height="600" fill="url(#fpWood)"/>
      <rect x="880" y="640" width="280" height="120" fill="url(#fpTile)"/>
      <rect x="48" y="168" width="640" height="190" fill="url(#fpSun)" opacity=".55" pointer-events="none"/>
      <ellipse cx="590" cy="482" rx="222" ry="98" fill="url(#fpRug)" opacity=".96"/>
      <rect x="118" y="700" width="104" height="52" rx="6" fill="#3a2416"/><text x="170" y="731" text-anchor="middle" font-size="11" letter-spacing="3" fill="#c9a15f" font-family="Manrope, sans-serif" font-weight="800">DARBAR</text>

      <!-- walls, glazing, doors -->
      <path d="M40 160H1160V760H222M118 760H40V160" fill="none" stroke="#1d110a" stroke-width="16" stroke-linejoin="miter"/>
      <path d="M880 640V760M880 640H960M1010 640H1160" fill="none" stroke="#1d110a" stroke-width="10"/>
      <path d="M96 160H654" stroke="#bfe3ea" stroke-width="7"/><path d="M96 160H654" stroke="#fff" stroke-width="1.5" opacity=".7"/>
      ${[96, 189, 282, 375, 468, 561, 654].map(x => `<rect x="${x - 3}" y="152" width="6" height="16" fill="#1d110a"/>`).join('')}
      <path d="M700 160H790" stroke="#a9794a" stroke-width="17"/><path d="M700 160H790" stroke="#bfe3ea" stroke-width="4" stroke-dasharray="40 10"/>
      <path d="M700 168A90 90 0 0 0 790 168" fill="none" stroke="#f7f0e1" stroke-width="1" stroke-dasharray="3 5" opacity=".6" transform="translate(0 -8)"/>
      <path d="M118 760A104 104 0 0 1 222 656" fill="none" stroke="#f7f0e1" stroke-width="1.2" stroke-dasharray="3 5" opacity=".7"/><path d="M222 760V656" stroke="#6e4526" stroke-width="5"/>

      <!-- window counter -->
      <g filter="url(#fpShadow)"><rect x="104" y="176" width="538" height="30" rx="5" fill="url(#fpWalnut)"/><path d="M110 180H636" stroke="#8a5c36" stroke-width="1" opacity=".6"/></g>

      <!-- espresso bar: marble front counter + back bar -->
      <g filter="url(#fpSoft)">
        <path d="M330 646H820V690H330Z" fill="url(#fpBar)" stroke="#cfc4ae" stroke-width="1.5"/>
        <path d="M350 655c60 8 110-6 170 2s120 12 280 0M380 680c80-8 160 6 250-2" stroke="#b9ad97" stroke-width="1" fill="none" opacity=".7"/>
        <rect x="330" y="726" width="520" height="26" rx="3" fill="url(#fpWalnut)"/>
        <rect x="500" y="716" width="124" height="34" rx="6" fill="#c4c8cc"/><rect x="506" y="722" width="112" height="14" rx="3" fill="#8e949b"/>
        ${[524, 562, 600].map(x => `<circle cx="${x}" cy="742" r="5" fill="#2a2a2e"/>`).join('')}
        <rect x="426" y="722" width="26" height="26" rx="5" fill="#2e2e33"/><circle cx="439" cy="735" r="8" fill="#55402c"/>
        <rect x="462" y="722" width="26" height="26" rx="5" fill="#2e2e33"/><circle cx="475" cy="735" r="8" fill="#6a4a2c"/>
        <rect x="704" y="652" width="96" height="32" rx="5" fill="#dfeef0" opacity=".85" stroke="#9fb8bc"/>
        ${[720, 744, 768, 788].map((x, i) => `<circle cx="${x}" cy="668" r="7" fill="${['#d9a45a', '#c98f48', '#e2b56a', '#b97a3a'][i]}"/>`).join('')}
        <path d="M660 700l10 14h-20z" fill="#f4ecdc"/><rect x="652" y="714" width="16" height="12" rx="3" fill="#b9c4c7" opacity=".8"/>
        <rect x="350" y="654" width="30" height="24" rx="3" fill="#24201e"/><rect x="354" y="658" width="22" height="13" rx="2" fill="#5d6f86"/>
      </g>
      <!-- roastery -->
      <g filter="url(#fpShadow)"><circle cx="1050" cy="704" r="34" fill="#3a3a3f"/><circle cx="1050" cy="704" r="24" fill="#5a5a61"/><circle cx="1050" cy="704" r="8" fill="#c9a15f"/><rect x="1094" y="690" width="40" height="28" rx="4" fill="#4a4a50"/>
        <rect x="900" y="660" width="44" height="30" rx="4" fill="#b08a55"/><rect x="900" y="700" width="44" height="30" rx="4" fill="#a17c49"/></g>
      <!-- chandelier over the Darbar table -->
      <g pointer-events="none" opacity=".9"><circle cx="590" cy="482" r="42" fill="none" stroke="#e7cb8f" stroke-width="2"/><circle cx="590" cy="482" r="27" fill="none" stroke="#e7cb8f" stroke-width="1" stroke-dasharray="2 6"/>
        ${[0, 60, 120, 180, 240, 300].map(a => `<circle cx="${590 + 42 * Math.cos(a * Math.PI / 180)}" cy="${482 + 42 * Math.sin(a * Math.PI / 180)}" r="4" fill="#fff2cf"/>`).join('')}</g>

      ${plant(78, 198, 24)}${plant(250, 716, 22)}${plant(1128, 208, 20)}${plant(676, 196, 16)}${plant(850, 716, 16)}

      ${seats}

      <!-- warm pools of light -->
      ${light(590, 482, 210, .55)}${light(355, 347, 90, .28)}${light(825, 347, 90, .28)}${light(560, 668, 170, .45)}${light(1045, 322, 110, .4)}${light(1045, 518, 120, .4)}${[320, 438, 556].map(y => light(100, y, 70, .5)).join('')}

      <!-- labels -->
      ${label(373, 150, 'VALLEY WINDOW · DOON VIEW ↑')}${label(132, 634, 'DEEP WORK PODS')}${label(590, 400, 'THE SALON · ROYAL DARBAR TABLE')}
      ${label(1046, 236, 'VELVET BOOTHS')}${label(560, 714, 'ESPRESSO BAR')}${label(950, 12, 'GARDEN TERRACE')}${label(1020, 656, 'ROASTERY')}${label(170, 786, 'ENTRANCE · FROM CAMPUS PLAZA')}

      <!-- compass + scale -->
      <g transform="translate(92 86)" class="fp-compass"><circle r="34" fill="#140b07" fill-opacity=".72" stroke="#c9a15f"/><path d="M0-25L7 0 0 6-7 0Z" fill="#e7cb8f"/><path d="M0 25L7 0 0-6-7 0Z" fill="#6f5a3c"/><text y="-37" text-anchor="middle">N</text></g>
      <g transform="translate(380 778)" class="fp-scale"><path d="M0 0H200M0-5V5M100-5V5M200-5V5" stroke="#e7cb8f" stroke-width="1.5"/><text x="0" y="-9" text-anchor="middle">0</text><text x="100" y="-9" text-anchor="middle">1.5 m</text><text x="200" y="-9" text-anchor="middle">3 m</text></g>
    </svg>`;
  }

  /* ================================================================== */
  /* Rendering                                                           */
  /* ================================================================== */
  const stage = $('#rvPlanStage');
  stage.innerHTML = '<p class="rv-plan-loading">Setting the room…</p>';
  let seatEls = {};
  const seatStatus = id => (isMine(id) ? 'mine' : isTaken(id) ? 'taken' : !fits(seatById[id]) ? 'small' : 'free');
  // Flat drawing, used only if the 3D model cannot start (no WebGL, or the library is blocked)
  function fallback() {
    if (window.__rvPlan3d || stage.querySelector('svg')) return;
    stage.innerHTML = planSVG(); stage.classList.add('is-flat', 'is-in');
    seatEls = Object.fromEntries($$('.fp-seat', stage).map(el => [el.dataset.seat, el]));
    paintPlan();
  }
  setTimeout(fallback, 9000);

  function paintPlan() {
    if (window.__rvPlan3d) window.__rvPlan3d.sync();
    SEATS.forEach(s => {
      const el = seatEls[s.id], taken = isTaken(s.id), own = isMine(s.id);
      if (!el) return;
      el.classList.toggle('is-taken', taken && !own);
      el.classList.toggle('is-mine', own);
      el.classList.toggle('is-small', !taken && !fits(s));
      el.classList.toggle('is-selected', state.seat === s.id);
      el.setAttribute('aria-disabled', taken || !fits(s) ? 'true' : 'false');
    });
    const free = freeSeats().length;
    swap($('#rvFreeCount'), `${free} of ${SEATS.length}`);
    swap($('#rvSlotHint'), `${free} seat${free === 1 ? '' : 's'} free`);
  }

  const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function paintDays() {
    $('#rvDays').innerHTML = days.map((d, i) => `<button type="button" role="option" class="rv-day${dayKey(d) === dayKey(state.day) ? ' on' : ''}" data-i="${i}" style="--i:${i}" aria-selected="${dayKey(d) === dayKey(state.day)}">
      <span>${i === 0 ? 'Today' : i === 1 ? 'Tmrw' : WEEK[d.getDay()]}</span><b>${d.getDate()}</b><em>${MONTH[d.getMonth()]}</em></button>`).join('');
  }
  function paintSlots() {
    $('#rvSlots').innerHTML = SLOTS.map(([name, list]) => `<div class="rv-slot-group"><span>${name}</span><div>${list.map(s => {
      const gone = slotPassed(state.day, s);
      const free = SEATS.filter(x => !isTaken(x.id, state.day, s) && fits(x)).length;
      return `<button type="button" role="option" class="rv-slot${s === state.slot ? ' on' : ''}${free <= 4 ? ' low' : ''}" data-slot="${s}" ${gone || !free ? 'disabled' : ''} aria-selected="${s === state.slot}" title="${gone ? 'Already passed' : free + ' seats free'}">${fmt12(s).replace(' ', '<small>') + '</small>'}</button>`;
    }).join('')}</div></div>`).join('');
  }

  const statIcon = { Light: 'fa-sun', Sound: 'fa-volume-low', Power: 'fa-plug', View: 'fa-mountain-sun' };
  function paintSeat(animate = true) {
    const s = seatById[state.seat]; if (!s) return;
    const z = ZONES[s.zone], panel = $('#rvSeat');
    const fill = () => {
      gallery.set(s.photos, `${s.name}, ${z.name} at Coffee Darbar`);
      $('#rvSeatPlate').textContent = `${z.name} · ${s.id}`;
      const taken = isTaken(s.id) && !isMine(s.id);
      const st = $('#rvSeatStatus'); st.textContent = isMine(s.id) ? 'Reserved by you' : taken ? 'Reserved at this time' : !fits(s) ? `Seats ${s.cap} only` : 'Available'; st.dataset.s = isMine(s.id) ? 'mine' : taken ? 'taken' : !fits(s) ? 'small' : 'free';
      $('#rvSeatCode').textContent = s.id;
      $('#rvSeatZone').innerHTML = `<i class="fa-solid ${z.icon}"></i> ${z.name}`;
      $('#rvSeatName').textContent = s.name; $('#rvSeatTag').textContent = s.tag; $('#rvSeatDesc').textContent = s.desc;
      $('#rvSeatStats').innerHTML = `<div><i class="fa-solid fa-user-group"></i><span>Seats</span><b>${s.cap === 1 ? '1 guest' : 'Up to ' + s.cap}</b></div>` +
        Object.entries(s.stats).map(([k, v], i) => `<div style="--i:${i + 1}"><i class="fa-solid ${statIcon[k]}"></i><span>${k}</span><b>${v}</b></div>`).join('');
      $('#rvSeatMeters').innerHTML = ['Privacy', 'Quiet', 'Buzz'].map((n, i) => `<div class="rv-meter" style="--i:${i}"><span>${n}</span><i><b style="--v:${s.m[i]}%"></b></i><em data-to="${s.m[i]}">0</em></div>`).join('');
      $$('#rvSeatMeters em').forEach(e => countTo(e, +e.dataset.to));
      $('#rvSeatChips').innerHTML = s.chips.map((c, i) => `<span style="--i:${i}">${c}</span>`).join('');
      $('#rvSeatBest').textContent = s.best; $('#rvSeatMin').textContent = `₹${s.min.toLocaleString('en-IN')} per table`;
      const cta = $('#rvSeatCta'); cta.classList.toggle('is-off', taken || !fits(s));
      cta.querySelector('span').textContent = taken ? 'Reserved at this time' : !fits(s) ? `Too small for ${state.guests}` : 'Reserve this seat';
    };
    if (!animate || reduce) { fill(); return; }
    panel.classList.add('is-swapping');
    setTimeout(() => { fill(); panel.classList.remove('is-swapping'); requestAnimationFrame(() => $$('.rv-meter b', panel).forEach(b => { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; })); }, 220);
  }

  function paintPass() {
    const s = seatById[state.seat], z = s && ZONES[s.zone];
    swap($('#rvPassCode'), s ? s.id : '—');
    swap($('#rvPassZone'), z ? z.name : 'Choose a seat on the plan');
    swap($('#rvPassName'), s ? s.name : '');
    const d = state.day;
    swap($('#rvPassDate'), `${WEEK[d.getDay()]}, ${d.getDate()} ${MONTH[d.getMonth()]}`);
    swap($('#rvPassTime'), fmt12(state.slot));
    swap($('#rvPassGuests'), `${state.guests} guest${state.guests > 1 ? 's' : ''}`);
    swap($('#rvPassOcc'), state.occasion);
    const picked = ADDONS.filter(a => state.addons.has(a.id));
    $('#rvPassLines').innerHTML = picked.length ? picked.map(a => `<li><span>${a.name}</span><b>${a.price ? '₹' + a.price : 'Included'}</b></li>`).join('') : '<li class="none"><span>No concierge touches added</span></li>';
    const total = picked.reduce((t, a) => t + a.price, 0);
    countTo($('#rvPassTotal'), total, n => '₹' + n.toLocaleString('en-IN'));
    // decorative code strip, stable for this seat + date + time
    let h = hash((s ? s.id : 'x') + dayKey(d) + state.slot), bars = '';
    for (let i = 0; i < 34; i++) { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; bars += `<i style="width:${1 + (h % 4)}px;--i:${i}"></i>`; }
    $('#rvPassBars').innerHTML = bars;
  }

  // Seat photos: two stacked layers crossfade; a thin bar times each photo and moves on.
  const gallery = (() => {
    const box = $('#rvSeatPhoto'), layers = $$('.rv-ph', box), cap = $('#rvSeatCap'), thumbs = $('#rvThumbs'), bar = $('#rvPhBar');
    let list = [], idx = 0, top = 0, token = 0, key = '';
    function show(i) {
      idx = (i + list.length) % list.length;
      const my = ++token, next = layers[1 - top], cur = layers[top], url = img(list[idx], 1100);
      const done = () => { if (my !== token) return; next.onload = null; next.classList.add('on'); cur.classList.remove('on'); top = 1 - top; };
      next.onload = done; next.src = url;
      if (next.complete && next.naturalWidth) done();
      swap(cap, CAPTION[list[idx]] || '');
      $$('button', thumbs).forEach((b, k) => b.classList.toggle('on', k === idx));
      bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    }
    thumbs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(+b.dataset.k); });
    bar.addEventListener('animationend', () => { if (list.length > 1) show(idx + 1); });
    return {
      set(photos, alt) {
        if (photos.join() === key) return; key = photos.join(); list = photos;
        layers.forEach(l => { l.alt = alt; });
        thumbs.innerHTML = photos.map((id, k) => `<button type="button" data-k="${k}" style="--i:${k}" aria-label="Photo ${k + 1} of ${photos.length}"><img src="${img(id, 160)}" alt=""></button>`).join('');
        show(0);
      },
    };
  })();

  function selectSeat(id, { scroll = false, animate = true } = {}) {
    state.seat = id;
    paintPlan(); paintSeat(animate); paintPass();
    if (scroll) $('#rvPlan').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }
  // keep the chosen seat valid when the date, time or party changes
  function refresh() {
    const s = seatById[state.seat];
    if (!s || (isTaken(s.id) && !isMine(s.id)) || !fits(s)) {
      const next = freeSeats()[0];
      if (next) state.seat = next.id;
    }
    resetConfirmed();
    paintDays(); paintSlots(); paintPlan(); paintSeat(); paintPass();
  }

  /* ---------- zone chips + rooms gallery ---------- */
  $('#rvZones').innerHTML = `<button type="button" class="on" data-zone="">All</button>` + Object.entries(ZONES).map(([k, z]) => `<button type="button" data-zone="${k}">${z.name}</button>`).join('');
  function setZone(k) {
    stage.dataset.zone = k || '';
    if (window.__rvPlan3d) window.__rvPlan3d.focus(k || '');
    $$('#rvZones button').forEach(b => b.classList.toggle('on', (b.dataset.zone || '') === (k || '')));
  }
  $('#rvZones').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setZone(b.dataset.zone); });

  const ROOM_PHOTO = { window: '1534040385115-33dcb3acba5b', pods: PHOTO.pods, salon: '1555396273-367ea4eb4db5', booths: '1537047902294-62a40c20a6ae', bar: PHOTO.bar, terrace: '1560624052-449f5ddf0c31' };
  $('#rvRooms').innerHTML = Object.entries(ZONES).map(([k, z], i) => {
    const list = SEATS.filter(s => s.zone === k), caps = list.reduce((t, s) => t + s.cap, 0);
    return `<button type="button" class="rv-room" data-zone="${k}" style="--i:${i}">
      <img src="${img(ROOM_PHOTO[k], 900)}" alt="${z.name} at Coffee Darbar" loading="lazy">
      <span class="rv-room-no">0${i + 1}</span>
      <span class="rv-room-plate"><em>Coffee Darbar</em><b>${z.name}</b><small>${z.line}</small><i>${list.length} table${list.length > 1 ? 's' : ''} · ${caps} seats <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></i></span>
    </button>`;
  }).join('');
  $('#rvRooms').addEventListener('click', e => {
    const b = e.target.closest('.rv-room'); if (!b) return;
    setZone(b.dataset.zone);
    const first = SEATS.find(s => s.zone === b.dataset.zone && !isTaken(s.id) && fits(s)) || SEATS.find(s => s.zone === b.dataset.zone);
    selectSeat(first.id, { scroll: true });
  });

  /* ---------- plan interactions ---------- */
  function seatFromEvent(e) { const g = e.target.closest('.fp-seat'); return g && g.dataset.seat; }
  stage.addEventListener('click', e => { const id = seatFromEvent(e); if (id) { selectSeat(id); resetConfirmed(); } });
  stage.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const id = seatFromEvent(e); if (id) { e.preventDefault(); selectSeat(id); resetConfirmed(); } } });
  // floating name tag that follows the pointer over the plan
  const tip = document.createElement('div'); tip.className = 'rv-tip'; $('#rvPlan').appendChild(tip);
  function showTip(id, cx, cy) {
    if (!id) { tip.classList.remove('on'); return; }
    const s = seatById[id], r = $('#rvPlan').getBoundingClientRect(), taken = isTaken(id) && !isMine(id);
    tip.innerHTML = `<b>${s.name}</b><span>${isMine(id) ? 'Reserved by you' : taken ? 'Reserved at this time' : !fits(s) ? `Seats ${s.cap} · too small for ${state.guests}` : `Seats ${s.cap} · ${ZONES[s.zone].name}`}</span>`;
    tip.style.transform = `translate(${Math.min(r.width - 220, Math.max(8, cx - r.left + 16))}px, ${cy - r.top + 18}px)`;
    tip.classList.add('on');
  }
  stage.addEventListener('pointermove', e => { if (stage.classList.contains('is-flat')) showTip(seatFromEvent(e), e.clientX, e.clientY); });
  // what the 3D plan (darbar-plan3d.js) needs from this page
  window.__rv = {
    SEATS, ZONES, reduce, status: seatStatus, selected: () => state.seat, tip: showTip, fallback,
    select: id => { selectSeat(id); resetConfirmed(); },
    zone: k => setZone(k),
  };
  stage.addEventListener('pointerleave', () => tip.classList.remove('on'));

  /* ---------- when: date, time, guests ---------- */
  $('#rvDays').addEventListener('click', e => {
    const b = e.target.closest('.rv-day'); if (!b) return;
    state.day = days[+b.dataset.i];
    if (slotPassed(state.day, state.slot)) state.slot = allSlots.find(s => !slotPassed(state.day, s)) || state.slot;
    refresh();
  });
  $('#rvSlots').addEventListener('click', e => { const b = e.target.closest('.rv-slot'); if (!b || b.disabled) return; state.slot = b.dataset.slot; refresh(); });
  const setGuests = n => { state.guests = Math.min(8, Math.max(1, n)); const o = $('#rvGuests'); o.textContent = state.guests; o.classList.remove('bump'); void o.offsetWidth; o.classList.add('bump'); refresh(); };
  $('#rvMinus').addEventListener('click', () => setGuests(state.guests - 1));
  $('#rvPlus').addEventListener('click', () => setGuests(state.guests + 1));

  /* ---------- desk: occasion, add-ons, details ---------- */
  $('#rvOccasions').innerHTML = OCCASIONS.map(([n, ic]) => `<button type="button" role="radio" aria-checked="${n === state.occasion}" class="rv-occ${n === state.occasion ? ' on' : ''}" data-o="${n}"><i class="fa-solid ${ic}"></i>${n}</button>`).join('');
  $('#rvOccasions').addEventListener('click', e => {
    const b = e.target.closest('.rv-occ'); if (!b) return;
    state.occasion = b.dataset.o;
    $$('.rv-occ').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    paintPass();
  });
  $('#rvAddons').innerHTML = ADDONS.map(a => `<label class="rv-addon${state.addons.has(a.id) ? ' on' : ''}"><input type="checkbox" value="${a.id}" ${state.addons.has(a.id) ? 'checked' : ''}>
    <span class="rv-addon-ic"><i class="fa-solid ${a.icon}"></i></span><span class="rv-addon-txt"><b>${a.name}</b><small>${a.line}</small></span>
    <span class="rv-addon-price">${a.price ? '+₹' + a.price : 'Complimentary'}</span><span class="rv-switch" aria-hidden="true"></span></label>`).join('');
  $('#rvAddons').addEventListener('change', e => {
    const c = e.target; if (c.type !== 'checkbox') return;
    c.checked ? state.addons.add(c.value) : state.addons.delete(c.value);
    c.closest('.rv-addon').classList.toggle('on', c.checked);
    paintPass();
  });

  function resetConfirmed() {
    if (!state.confirmed) return;
    state.confirmed = null;
    $('#rvPass').classList.remove('is-confirmed'); $('#rvPassRef').textContent = 'Draft';
    const btn = $('#rvSubmit'); btn.disabled = false; btn.classList.remove('is-done'); btn.querySelector('span').textContent = 'Confirm reservation';
    $('#rvPassNote').textContent = 'Free to cancel up to one hour before.';
  }
  $('#rvForm').addEventListener('submit', e => {
    e.preventDefault();
    const err = $('#rvError'), s = seatById[state.seat], name = $('#rvName').value.trim(), email = $('#rvEmail').value.trim();
    const fail = (msg, el) => { err.textContent = msg; err.classList.add('on'); if (el) el.focus(); };
    err.classList.remove('on');
    if (!s || (isTaken(s.id) && !isMine(s.id))) return fail('That seat is reserved at this time. Please choose another seat on the plan.');
    if (!fits(s)) return fail(`${s.name} seats ${s.cap}. Choose a larger table or fewer guests.`);
    if (name.length < 2) return fail('Please tell us the name for the reservation.', $('#rvName'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Please enter a valid email, so we can send your pass.', $('#rvEmail'));
    const btn = $('#rvSubmit'); btn.disabled = true; btn.classList.add('is-busy'); btn.querySelector('span').textContent = 'Holding your seat…';
    setTimeout(() => {
      const ref = 'DRB-' + (hash(name + email + Date.now()) % 90000 + 10000);
      mine.push({ seat: s.id, date: dayKey(state.day), slot: state.slot, ref, name });
      try { localStorage.setItem('darbarReservations', JSON.stringify(mine)); } catch (x) { /* private mode: the pass still shows */ }
      state.confirmed = ref;
      $('#rvPassRef').textContent = ref; $('#rvPass').classList.add('is-confirmed');
      btn.classList.remove('is-busy'); btn.classList.add('is-done'); btn.querySelector('span').textContent = 'Reserved. See you soon';
      $('#rvPassNote').textContent = `Show this pass at the door. Reference ${ref}.`;
      paintPlan(); paintSeat(false); paintSlots();
      if (typeof window.toast === 'function') window.toast(`${s.name} is yours for ${fmt12(state.slot)}. Reference ${ref}.`);
      if (window.HardiAudio && window.HardiAudio.playClink) { try { window.HardiAudio.playClink(); } catch (x) {} }
    }, reduce ? 0 : 1100);
  });

  /* ---------- brand mark on the pass and map plate ---------- */
  if (window.darbarMark) { $('#rvPassMark').innerHTML = window.darbarMark('rv-mark'); $('#rvMapMark').innerHTML = window.darbarMark('rv-mark'); }

  /* ---------- first paint ---------- */
  state.seat = (freeSeats().find(s => s.id === 'W2') || freeSeats()[0] || SEATS[0]).id;
  paintDays(); paintSlots(); paintPlan(); paintSeat(false); paintPass();

  // section headers and blocks ease in as they scroll into view
  const io = new IntersectionObserver(en => en.forEach(x => {
    if (!x.isIntersecting) return;
    const el = x.target; el.classList.add('is-in'); io.unobserve(el);
    // afterwards the element goes back to its own styles (so hover moves are not delayed)
    setTimeout(() => el.classList.remove('rv-rise', 'rv-wipe', 'rv-slide', 'rv-pop', 'is-in'), 2600 + (+el.dataset.i || 0) * 90);
  }), { threshold: 0.12 });
  const rise = (sel, cls = 'rv-rise', stagger = false) => $$(sel).forEach(el => {
    if (reduce) return;
    el.classList.add(cls);
    if (stagger) { const i = [...el.parentNode.children].indexOf(el); el.dataset.i = i; el.style.setProperty('--i', i); }
    io.observe(el);
  });
  rise('.rv-head'); rise('.rv-when-grid'); rise('.rv-plan'); rise('.rv-seat'); rise('.rv-step', 'rv-rise', true); rise('.rv-pass-col');
  rise('.rv-room', 'rv-wipe', true); rise('.rv-map-card', 'rv-wipe'); rise('.rv-routes'); rise('.rv-route-list li', 'rv-slide', true);
  rise('.rv-addon', 'rv-slide', true); rise('.rv-occ', 'rv-pop', true); rise('.rv-zones button', 'rv-pop', true); rise('.rv-legend span', 'rv-pop', true); rise('.rv-input', 'rv-rise', true);
  // the first set of dates and times arrives one by one
  if (!reduce) { $('#when').classList.add('rv-first'); setTimeout(() => $('#when').classList.remove('rv-first'), 2400); }

  /* ---------- pointer + scroll motion ---------- */
  if (!reduce) {
    // the reservation pass tilts toward the pointer, with a moving sheen
    const pass = $('#rvPass'), col = $('.rv-pass-col');
    col.addEventListener('pointermove', e => {
      const r = pass.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      pass.style.setProperty('--ry', (px * 9).toFixed(2) + 'deg'); pass.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg');
      pass.style.setProperty('--sx', ((px + 0.5) * 100).toFixed(1) + '%'); pass.style.setProperty('--sy', ((py + 0.5) * 100).toFixed(1) + '%');
      pass.classList.add('is-tilt');
    });
    col.addEventListener('pointerleave', () => { pass.style.setProperty('--ry', '0deg'); pass.style.setProperty('--rx', '0deg'); pass.classList.remove('is-tilt'); });
    // hero photos drift with the pointer
    const hero = $('.rv-hero'), collage = $('#rvCollage');
    if (hero && collage) hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      collage.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); collage.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    // page progress line + photos that slide slightly inside their frames as you scroll
    const prog = $('#rvProgress'), rooms = $$('.rv-room img'), shots = $$('.rv-shot');
    let queued = false;
    const onScroll = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight, y = scrollY;
      prog.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max).toFixed(4) : 0})`;
      const vh = innerHeight;
      rooms.forEach(im => { const r = im.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; im.style.setProperty('--py', (((r.top + r.height / 2) / vh - 0.5) * -34).toFixed(1) + 'px'); });
      if (y < vh) shots.forEach((s, i) => s.style.setProperty('--sy', (y * (0.05 + i * 0.045)).toFixed(1) + 'px'));
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  /* ================================================================== */
  /* Location map (Leaflet + OpenStreetMap data, CARTO tiles)             */
  /* ================================================================== */
  const CAFE = [30.4171, 77.9687];
  const PLACES = [
    { name: 'UPES campus gate', at: [30.4150, 77.9694], km: 0.3, time: '4 min walk', icon: 'fa-person-walking' },
    { name: 'Bidholi village', at: [30.3904, 77.9675], km: 3.5, time: '9 min', icon: 'fa-house' },
    { name: 'Pondha', at: [30.3725, 77.9757], km: 6.5, time: '15 min', icon: 'fa-road' },
    { name: 'Nanda Ki Chowki', at: [30.3394, 77.9316], km: 11, time: '24 min', icon: 'fa-signs-post' },
    { name: 'Premnagar', at: [30.3352, 77.9640], km: 12, time: '26 min', icon: 'fa-shop' },
    { name: 'Forest Research Institute', at: [30.3419, 78.0044], km: 16, time: '35 min', icon: 'fa-tree' },
    { name: 'Clock Tower, Dehradun', at: [30.3243, 78.0419], km: 21, time: '50 min', icon: 'fa-clock' },
    { name: 'Dehradun Railway Station', at: [30.3125, 78.0335], km: 22, time: '55 min', icon: 'fa-train' },
    { name: 'ISBT Dehradun', at: [30.2879, 77.9980], km: 24, time: '55 min', icon: 'fa-bus' },
    { name: 'Jolly Grant Airport', at: [30.1922, 78.1900], km: 48, time: '1 h 30 min', icon: 'fa-plane' },
  ];
  $('#rvRouteList').innerHTML = PLACES.map((p, i) => `<li><button type="button" data-i="${i}"><i class="fa-solid ${p.icon}"></i><span>${p.name}</span><b>${p.km} km</b><em>${p.time}</em></button></li>`).join('');

  function initMap() {
    if (!window.L) { $('#rvMap').classList.add('no-map'); $('#rvMap').innerHTML = '<p>The map could not load. Use the Google Maps link beside it.</p>'; return; }
    const L = window.L;
    const map = L.map('rvMap', { center: CAFE, zoom: 17, zoomControl: false, scrollWheelZoom: true, wheelPxPerZoomLevel: 110, zoomSnap: 0.5, attributionControl: true });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const LAYERS = {
      map: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, className: 'rv-tiles-map',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }),
      sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, className: 'rv-tiles-sat',
        attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics' }),
    };
    LAYERS.map.addTo(map);
    $('#rvMapStyle').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.classList.contains('on')) return;
      $$('#rvMapStyle button').forEach(x => x.classList.toggle('on', x === b));
      Object.entries(LAYERS).forEach(([k, l]) => (k === b.dataset.style ? l.addTo(map) : map.removeLayer(l)));
      $('#rvMap').classList.toggle('is-sat', b.dataset.style === 'sat');
    });
    // five-minute walking radius around the café
    L.circle(CAFE, { radius: 400, color: '#a87e3e', weight: 1.2, dashArray: '4 6', fillColor: '#c9a15f', fillOpacity: 0.08, interactive: false }).addTo(map);
    const cafeIcon = L.divIcon({ className: 'rv-pin-wrap', iconSize: [64, 72], iconAnchor: [32, 68],
      html: `<span class="rv-pin-pulse"></span><span class="rv-pin">${window.darbarMark ? window.darbarMark('rv-pin-mark') : ''}</span>` });
    L.marker(CAFE, { icon: cafeIcon, zIndexOffset: 1000, title: 'Coffee Darbar' }).addTo(map)
      .bindTooltip('<b>Coffee Darbar</b><span>You are booking here</span>', { permanent: true, direction: 'top', offset: [0, -72], className: 'rv-map-label rv-map-label-main' });
    const marks = PLACES.map(p => L.marker(p.at, { icon: L.divIcon({ className: 'rv-dot-wrap', iconSize: [16, 16], iconAnchor: [8, 8], html: '<span class="rv-dot"></span>' }), title: p.name }).addTo(map)
      .bindTooltip(`<b>${p.name}</b><span>${p.km} km · ${p.time}</span>`, { permanent: true, direction: 'right', offset: [10, 0], className: 'rv-map-label' }));
    const fly = (fn) => (reduce ? fn({ animate: false }) : fn({ duration: 1.6, easeLinearity: 0.2 }));
    const VIEWS = {
      campus: o => map.flyTo(CAFE, 17, o),
      area: o => map.flyToBounds([[30.4250, 77.9200], [30.3280, 78.0150]], { padding: [30, 30], ...o }),
      city: o => map.flyToBounds([[30.4300, 77.9150], [30.2800, 78.0700]], { padding: [30, 30], ...o }),
    };
    $('#rvMapViews').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('#rvMapViews button').forEach(x => x.classList.toggle('on', x === b));
      fly(VIEWS[b.dataset.view]);
    });
    $('#rvRouteList').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const p = PLACES[+b.dataset.i];
      $$('#rvMapViews button').forEach(x => x.classList.remove('on'));
      $$('#rvRouteList button').forEach(x => x.classList.toggle('on', x === b));
      fly(o => map.flyToBounds([CAFE, p.at], { padding: [70, 70], maxZoom: 16, ...o }));
      marks[+b.dataset.i].openTooltip();
    });
    // Leaflet needs the real size once the card has been laid out
    new IntersectionObserver((en, ob) => { if (en[0].isIntersecting) { map.invalidateSize(); ob.disconnect(); } }).observe($('#rvMap'));
  }
  initMap();
})();

// Coffee Darbar — the 3D floor plan on the Reserve page.
// A cut-away model of the café (two tall walls, two low ones) seen from above at an angle.
// Static scene, drawn only when something changes (camera, hover, selection), so it costs
// nothing while idle. Talks to darbar-reserve.js through window.__rv.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const RV = window.__rv;
const stage = document.getElementById('rvPlanStage');
if (RV && stage) init().catch(err => { console.warn('3D plan unavailable:', err); RV.fallback(); });

async function init() {
  const canvas = document.createElement('canvas');
  canvas.className = 'rv-gl';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // the model never moves: shadows are drawn on the first few frames only

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(26, 1.5, 1, 120);
  if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]);

  /* ------------------------------------------------------------------ */
  /* Textures (drawn on canvases, no downloads)                          */
  /* ------------------------------------------------------------------ */
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const tex = (w, h, draw, repeat) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  };
  const woodTex = (tones, rep) => tex(1024, 1024, (g, w) => {
    const rows = 12, rh = w / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rnd() * 300;
      while (x < w) {
        const len = 240 + rnd() * 320;
        g.fillStyle = tones[Math.floor(rnd() * tones.length)]; g.fillRect(x, r * rh, len, rh);
        for (let k = 0; k < 9; k++) { // grain
          g.strokeStyle = `rgba(60,34,14,${0.05 + rnd() * 0.09})`; g.lineWidth = 0.6 + rnd() * 1.4;
          const y = r * rh + rnd() * rh; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + len * 0.3, y + (rnd() - 0.5) * 8, x + len * 0.6, y + (rnd() - 0.5) * 8, x + len, y); g.stroke();
        }
        g.fillStyle = 'rgba(40,22,10,.55)'; g.fillRect(x + len - 1.5, r * rh, 3, rh);
        x += len;
      }
      g.fillStyle = 'rgba(40,22,10,.5)'; g.fillRect(0, r * rh - 1.2, w, 2.4);
    }
  }, rep);
  const marbleTex = tex(512, 512, (g, w) => {
    g.fillStyle = '#f4efe6'; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(150,138,120,${0.1 + rnd() * 0.25})`; g.lineWidth = 0.6 + rnd() * 2.2;
      let x = rnd() * w, y = rnd() * w; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += (rnd() - 0.3) * 150; y += (rnd() - 0.5) * 110; g.lineTo(x, y); } g.stroke();
    }
  }, [1, 1]);
  const stoneTex = tex(512, 512, (g, w) => {
    const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 150 + Math.floor(rnd() * 28); g.fillStyle = `rgb(${v},${v - 6},${v - 18})`; g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); }
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(60,55,45,${rnd() * 0.12})`; g.fillRect(rnd() * w, rnd() * w, 2, 2); }
  }, [3.4, 1.5]);
  const grassTex = tex(256, 256, (g, w) => {
    g.fillStyle = '#3c4a2c'; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 2600; i++) { g.strokeStyle = `rgba(${70 + rnd() * 50},${95 + rnd() * 60},${45 + rnd() * 30},.55)`; const x = rnd() * w, y = rnd() * w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 4, y - 3 - rnd() * 5); g.stroke(); }
  }, [6, 3]);
  const rugTex = tex(1024, 640, (g, w, h) => {
    g.translate(w / 2, h / 2); g.scale(1, h / w);
    const ring = (r, c) => { g.beginPath(); g.arc(0, 0, r, 0, 7); g.fillStyle = c; g.fill(); };
    ring(506, '#4a1412'); ring(492, '#c9a15f'); ring(480, '#5e1a17'); ring(420, '#c9a15f'); ring(412, '#6f211d'); ring(300, '#7c2925'); ring(180, '#6a1f1b');
    g.fillStyle = '#d9b673';
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; g.save(); g.rotate(a); g.translate(450, 0); g.rotate(Math.PI / 4); g.fillRect(-9, -9, 18, 18); g.restore(); }
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.save(); g.rotate(a); g.beginPath(); g.ellipse(350, 0, 34, 12, 0, 0, 7); g.fill(); g.restore(); }
    g.strokeStyle = '#d9b673'; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 240, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 120, 0, 7); g.stroke();
  });
  const valleyTex = tex(1024, 256, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#9fc6e6'); sky.addColorStop(0.55, '#e6eef0'); sky.addColorStop(0.7, '#f6e3c2'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    [['#8fa9b4', 0.52, 26], ['#6f8f86', 0.62, 34], ['#4f7458', 0.74, 30], ['#3a5a3c', 0.86, 22]].forEach(([c, base, amp], k) => {
      g.fillStyle = c; g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) g.lineTo(x, h * base - Math.sin(x * 0.006 + k * 2) * amp - Math.sin(x * 0.019 + k) * amp * 0.4);
      g.lineTo(w, h); g.fill();
    });
  });
  const signTex = (text, sub) => tex(1024, 220, (g, w, h) => {
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#e9c57a';
    g.font = '500 108px "Cormorant Garamond", Georgia, serif'; if ('letterSpacing' in g) g.letterSpacing = '22px'; g.fillText(text, w / 2, 92);
    g.font = '700 26px Manrope, Arial, sans-serif'; if ('letterSpacing' in g) g.letterSpacing = '14px'; g.fillText(sub, w / 2, 182);
  });
  const boardTex = tex(512, 320, (g, w, h) => {
    g.fillStyle = '#1d1a18'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a15f'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#efe6d4'; g.font = '700 30px Manrope, Arial, sans-serif'; g.fillText('TODAY', 34, 62);
    g.font = '500 22px Manrope, Arial, sans-serif';
    [['Royal Cappuccino', '260'], ['Kesar Latte', '290'], ['Filter Kaapi', '180'], ['Mocha Maharaja', '280'], ['V60 Pour-over', '240'], ['Cold Brew', '240']].forEach(([n, p], i) => { g.fillStyle = '#efe6d4'; g.fillText(n, 34, 112 + i * 34); g.fillStyle = '#e9c57a'; g.fillText('₹' + p, 400, 112 + i * 34); });
  });
  const matTex = tex(512, 256, (g, w, h) => {
    g.fillStyle = '#2c1a10'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a15f'; g.lineWidth = 8; g.strokeRect(16, 16, w - 32, h - 32);
    g.fillStyle = '#c9a15f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 64px Manrope, Arial, sans-serif'; if ('letterSpacing' in g) g.letterSpacing = '20px'; g.fillText('DARBAR', w / 2, h / 2 + 4);
  });

  /* ------------------------------------------------------------------ */
  /* Materials                                                           */
  /* ------------------------------------------------------------------ */
  const std = o => new THREE.MeshStandardMaterial(o);
  const M = {
    floor: std({ map: woodTex(['#99693d', '#8d5f35', '#a37245', '#85572e', '#946439'], [5, 3.2]), roughness: 0.5, envMapIntensity: 0.18 }),
    walnut: std({ color: 0x4d2e18, roughness: 0.5, envMapIntensity: 0.5 }),
    walnutTop: std({ map: woodTex(['#5a3519', '#4d2c14', '#63401f'], [1, 0.5]), roughness: 0.4, envMapIntensity: 0.6 }),
    sheesham: std({ map: woodTex(['#6a3a1c', '#5a2e14', '#74431f'], [0.8, 0.3]), roughness: 0.32, envMapIntensity: 0.7 }),
    teak: std({ color: 0xb88a56, roughness: 0.6 }),
    cane: std({ color: 0xc09a68, roughness: 0.7 }),
    marble: std({ map: marbleTex, roughness: 0.18, envMapIntensity: 0.9 }),
    plaster: std({ color: 0xe2d5bd, roughness: 0.95, envMapIntensity: 0.12 }),
    wallDark: std({ color: 0x2b1b12, roughness: 0.85, envMapIntensity: 0.15 }),
    wainscot: std({ color: 0x3b2415, roughness: 0.6, envMapIntensity: 0.4 }),
    cut: std({ color: 0xd9c9a8, roughness: 0.9 }),
    brass: std({ color: 0xd3a552, metalness: 1, roughness: 0.28 }),
    steel: std({ color: 0xc2c7cc, metalness: 1, roughness: 0.32 }),
    black: std({ color: 0x1d1b1a, roughness: 0.5, metalness: 0.4 }),
    velvet: std({ color: 0x1f5c40, roughness: 0.95, envMapIntensity: 0.2 }),
    velvetDark: std({ color: 0x184a33, roughness: 0.95, envMapIntensity: 0.2 }),
    oxblood: std({ color: 0x7a2823, roughness: 0.85, envMapIntensity: 0.25 }),
    leather: std({ color: 0x9a6238, roughness: 0.6 }),
    slate: std({ color: 0x3c4853, roughness: 0.8 }),
    felt: std({ color: 0x5b6a55, roughness: 1, envMapIntensity: 0.1 }),
    white: std({ color: 0xf6f0e4, roughness: 0.35 }),
    coffee: std({ color: 0x4a2612, roughness: 0.3 }),
    pot: std({ color: 0x8a5a3c, roughness: 0.85 }),
    leaf: std({ color: 0x3f6e3c, roughness: 0.8 }), leaf2: std({ color: 0x5a8a4a, roughness: 0.8 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xdff1f5, roughness: 0.05, transmission: 0, transparent: true, opacity: 0.22, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false }),
    stone: std({ map: stoneTex, roughness: 0.9 }),
    grass: std({ map: grassTex, roughness: 1 }),
    plinth: std({ color: 0x1b110b, roughness: 0.7 }),
    bulb: new THREE.MeshBasicMaterial({ color: 0xffe9bf }),
    screen: new THREE.MeshBasicMaterial({ color: 0x9fc4e8 }),
    burlap: std({ color: 0xb59868, roughness: 1 }),
  };

  /* ------------------------------------------------------------------ */
  /* Build helpers (y is the height of the object's base)                */
  /* ------------------------------------------------------------------ */
  const root = new THREE.Group(); scene.add(root);
  const put = (mesh, x, y, z, parent = root, shadow = true) => { mesh.position.set(x, y, z); mesh.castShadow = shadow; mesh.receiveShadow = true; parent.add(mesh); return mesh; };
  const box = (w, h, d, mat, x, y, z, parent, r = 0) => put(new THREE.Mesh(r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), mat), x, y + h / 2, z, parent);
  const cyl = (rt, rb, h, mat, x, y, z, parent, seg = 28) => put(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat), x, y + h / 2, z, parent);
  const grp = (x, z, rot = 0, parent = root) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; parent.add(g); return g; };
  const plane = (w, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; root.add(m); return m; };

  // a chair facing +z (rotate the group to face its table)
  function chair(x, z, rot, seat = M.leather, frame = M.walnut) {
    const g = grp(x, z, rot);
    box(0.46, 0.07, 0.44, seat, 0, 0.43, 0, g, 0.03);
    box(0.46, 0.4, 0.06, seat, 0, 0.52, -0.21, g, 0.025);
    [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].forEach(([a, b]) => cyl(0.018, 0.014, 0.44, frame, a, 0, b, g, 8));
    return g;
  }
  function stool(x, z, h = 0.72, seat = M.leather) {
    const g = grp(x, z);
    cyl(0.19, 0.19, 0.06, seat, 0, h, 0, g); cyl(0.028, 0.028, h, M.brass, 0, 0, 0, g, 12); cyl(0.21, 0.23, 0.025, M.brass, 0, 0, 0, g);
    const ring = put(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 8, 28), M.brass), 0, 0.28, 0, g); ring.rotation.x = Math.PI / 2;
    return g;
  }
  function cup(x, y, z, parent = root) { cyl(0.075, 0.07, 0.012, M.white, x, y, z, parent, 18); cyl(0.045, 0.036, 0.06, M.white, x, y + 0.012, z, parent, 18); cyl(0.038, 0.038, 0.004, M.coffee, x, y + 0.068, z, parent, 14); }
  function plant(x, z, s = 1, tall = false) {
    const g = grp(x, z); cyl(0.22 * s, 0.16 * s, 0.36 * s, M.pot, 0, 0, 0, g, 18);
    const base = tall ? 1.15 * s : 0.5 * s;
    if (tall) cyl(0.025, 0.035, 0.9 * s, M.walnut, 0, 0.3 * s, 0, g, 8);
    for (let i = 0; i < (tall ? 9 : 7); i++) {
      const a = rnd() * 6.28, r = (0.1 + rnd() * 0.22) * s, m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2 * s, 1), i % 2 ? M.leaf : M.leaf2);
      m.scale.set(1, 0.55 + rnd() * 0.5, 0.55); m.rotation.set(rnd(), a, rnd() * 0.8);
      put(m, Math.cos(a) * r, base + rnd() * 0.35 * s, Math.sin(a) * r, g);
    }
  }
  function pendant(x, y, z, shade = M.brass) {
    cyl(0.006, 0.006, 3.05 - y, M.black, x, y, z, root, 6).castShadow = false;
    const c = put(new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.18, 24, 1, true), shade), x, y - 0.02, z); c.material.side = THREE.DoubleSide;
    put(new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), M.bulb), x, y - 0.1, z, root, false);
  }
  function roundTable(x, z, r, h, top) { cyl(r, r, 0.04, top, x, h - 0.04, z); cyl(0.035, 0.035, h - 0.06, M.black, x, 0.02, z, root, 12); cyl(r * 0.55, r * 0.6, 0.03, M.black, x, 0, z); }

  /* ------------------------------------------------------------------ */
  /* The building. x: west −7 … east 7 · z: north −4.5 … south 4.5       */
  /* ------------------------------------------------------------------ */
  const W = 7, N = 4.5, TALL = 3.05, LOW = 0.42, T = 0.2;
  box(15.6, 0.4, 13.6, M.plinth, 0, -0.42, 1.6, root, 0.06);              // model base
  plane(14, 9, M.floor, 0, 0.002, 0);                                      // café floor
  plane(7.1, 3.2, M.stone, 3.75, 0.002, 6.25);                             // terrace
  plane(7.2, 3.2, M.grass, -3.6, 0.001, 6.25);                             // garden by the entrance
  [[-2.4, 5.0], [-2.5, 5.75], [-2.3, 6.5], [-2.45, 7.25]].forEach(([x, z]) => cyl(0.36, 0.36, 0.03, M.stone, x, 0, z, root, 9));

  // west wall (tall): wainscot below, plaster above
  box(T, 1.0, 9.4, M.wainscot, -W - T / 2, 0, 0); box(T, TALL - 1.0, 9.4, M.wallDark, -W - T / 2, 1.0, 0);
  box(0.03, 0.04, 9.0, M.brass, -W + 0.015, 1.0, 0);
  // north wall (tall): four big windows on the left, solid on the right (behind the pods)
  const winL = -6.5, winR = 1.5, sill = 0.95, head = 2.65;
  box(winR - winL, sill, T, M.wainscot, (winL + winR) / 2, 0, -N - T / 2);
  box(winR - winL, TALL - head, T, M.plaster, (winL + winR) / 2, head, -N - T / 2);
  box(W - winR, 1.0, T, M.wainscot, (W + winR) / 2, 0, -N - T / 2); box(W - winR, TALL - 1.0, T, M.plaster, (W + winR) / 2, 1.0, -N - T / 2);
  box(-W - winL + 0.7, TALL, T, M.plaster, (-W + winL) / 2 - 0.1, 0, -N - T / 2);
  for (let i = 0; i <= 4; i++) box(0.09, head - sill, 0.12, M.black, winL + i * 2, sill, -N - T / 2);               // mullions
  box(winR - winL, 0.06, 0.14, M.black, (winL + winR) / 2, sill, -N - T / 2); box(winR - winL, 0.06, 0.14, M.black, (winL + winR) / 2, head - 0.06, -N - T / 2);
  put(new THREE.Mesh(new THREE.PlaneGeometry(winR - winL, head - sill), M.glass), (winL + winR) / 2, (sill + head) / 2, -N - T / 2, root, false);
  put(new THREE.Mesh(new THREE.PlaneGeometry(winR - winL + 0.4, head - sill + 0.3), new THREE.MeshBasicMaterial({ map: valleyTex })), (winL + winR) / 2, (sill + head) / 2, -N - T - 0.25, root, false); // the view
  // east + south walls are cut low so you can look in; gaps are the doors
  box(T, LOW, 9.4, M.cut, W + T / 2, 0, 0);
  [[-7.2, -3.1], [-1.7, 3.0], [4.2, 7.2]].forEach(([a, b]) => box(b - a, LOW, T, M.cut, (a + b) / 2, 0, N + T / 2));
  // entrance: brass posts, door mat
  [-3.1, -1.7].forEach(x => box(0.07, 2.2, 0.07, M.brass, x, 0, N + T / 2)); box(1.47, 0.07, 0.07, M.brass, -2.4, 2.2, N + T / 2);
  plane(1.2, 0.7, std({ map: matTex, roughness: 1 }), -2.4, 0.006, 3.9);
  [3.0, 4.2].forEach(x => box(0.06, 2.1, 0.06, M.black, x, 0, N + T / 2)); box(1.26, 0.06, 0.06, M.black, 3.6, 2.1, N + T / 2);

  /* ---------- Valley Window: oak counter along the glass ---------- */
  box(7.5, 0.06, 0.48, M.walnutTop, -2.55, 1.02, -4.2, root, 0.02);
  for (let x = -6; x <= 1.1; x += 1.42) box(0.05, 1.02, 0.05, M.black, x, 0, -4.02);
  const WX = [-5.3, -3.5, -1.7, 0.1];
  WX.forEach(x => { stool(x - 0.34, -3.62); stool(x + 0.34, -3.62); cup(x - 0.3, 1.08, -4.18); cup(x + 0.36, 1.08, -4.24); });
  [-4.4, -0.8].forEach(x => pendant(x, 2.2, -4.0));
  plant(-6.55, -3.9, 1.1, true);

  /* ---------- Deep Work Pods: felt alcoves on the north wall ---------- */
  const PX = [2.75, 4.5, 6.2];
  [1.9, 3.62, 5.36, 6.96].forEach(x => box(0.09, 1.55, 1.55, M.felt, x, 0, -3.72, root, 0.03));
  PX.forEach(x => {
    box(1.5, 1.2, 0.05, M.felt, x + (x > 6 ? -0.04 : 0), 1.0, -4.46);                // felt back panel
    box(1.36, 0.05, 0.62, M.walnutTop, x, 0.73, -4.12, root, 0.02); [-0.6, 0.6].forEach(o => box(0.04, 0.73, 0.5, M.black, x + o, 0, -4.12));
    box(0.36, 0.02, 0.25, M.steel, x - 0.1, 0.78, -4.08); const s = box(0.36, 0.24, 0.015, M.black, x - 0.1, 0.8, -4.22); s.rotation.x = -0.2;
    put(new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.2), M.screen), x - 0.1, 0.92, -4.2, root, false).rotation.x = -0.2;
    cyl(0.012, 0.012, 0.34, M.brass, x + 0.48, 0.78, -4.28, root, 8); put(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), M.bulb), x + 0.42, 1.14, -4.2, root, false);
    cup(x + 0.36, 0.78, -3.98);
    chair(x - 0.05, -3.45, Math.PI, M.slate, M.black);
  });

  /* ---------- Espresso Bar: back bar on the west wall, marble counter in front ---------- */
  box(0.6, 0.9, 5.0, M.walnut, -6.68, 0, 0.4); box(0.66, 0.05, 5.06, M.marble, -6.66, 0.9, 0.4);
  [1.45, 1.95, 2.45].forEach(y => { box(0.3, 0.04, 4.7, M.walnutTop, -6.84, y, 0.4); });
  for (let i = 0; i < 46; i++) { // bottles, jars and cups on the shelves
    const y = [1.49, 1.99, 2.49][i % 3], z = -1.85 + rnd() * 4.5, k = rnd();
    if (k < 0.4) cyl(0.04, 0.045, 0.2 + rnd() * 0.12, [M.brass, M.walnut, M.velvetDark, M.oxblood][Math.floor(rnd() * 4)], -6.84, y, z, root, 10);
    else if (k < 0.75) cyl(0.05, 0.04, 0.07, M.white, -6.84, y, z, root, 10);
    else box(0.12, 0.16, 0.12, M.burlap, -6.84, y, z);
  }
  box(0.52, 0.42, 0.95, M.steel, -6.66, 0.95, 0.4, root, 0.04); box(0.56, 0.06, 0.99, M.black, -6.66, 1.37, 0.4);
  [0.1, 0.4, 0.7].forEach(z => cyl(0.045, 0.035, 0.08, M.black, -6.42, 1.06, z, root, 12));
  [-0.5, -0.85].forEach(z => { box(0.2, 0.3, 0.2, M.black, -6.66, 0.95, z, root, 0.03); const h = put(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 18, 1, true), M.glass), -6.66, 1.35, z, root, false); h.rotation.x = Math.PI; });
  box(0.62, 1.04, 5.0, M.walnut, -5.3, 0, 0.4, root, 0.02); box(0.78, 0.06, 5.14, M.marble, -5.26, 1.04, 0.4, root, 0.02);
  for (let z = -2.0; z <= 2.8; z += 0.16) box(0.025, 0.96, 0.07, M.walnutTop, -4.98, 0.04, z);                  // fluted front
  box(0.5, 0.36, 0.9, M.glass, -5.28, 1.1, 2.25).castShadow = false; box(0.52, 0.03, 0.92, M.brass, -5.28, 1.46, 2.25);
  [1.95, 2.25, 2.55].forEach((z, i) => cyl(0.1, 0.1, 0.05, [M.teak, M.cane, M.burlap][i], -5.28, 1.12, z, root, 14)); // pastries
  box(0.22, 0.02, 0.3, M.black, -5.3, 1.1, -1.75); const pos = box(0.02, 0.2, 0.28, M.black, -5.38, 1.12, -1.75); pos.rotation.z = -0.25;
  const SZ = [-1.0, 0.4, 1.6];
  SZ.forEach(z => { stool(-4.55, z, 0.74, M.oxblood); cup(-5.1, 1.1, z + 0.1); pendant(-5.2, 2.15, z); });
  // sign + menu board on the west wall
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 0.84), new THREE.MeshBasicMaterial({ map: signTex('COFFEE DARBAR', 'EST. 2025 · UPES BIDHOLI'), transparent: true }));
  sign.rotation.y = Math.PI / 2; sign.position.set(-W + 0.012, 2.62, 3.2); sign.scale.setScalar(0.62); root.add(sign);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.94), new THREE.MeshBasicMaterial({ map: boardTex })); board.rotation.y = Math.PI / 2; board.position.set(-W + 0.014, 1.75, 3.2); root.add(board);
  // roaster in the south-west corner
  box(0.8, 0.55, 0.8, M.black, -6.35, 0, 3.85, root, 0.04); const drum = cyl(0.36, 0.36, 0.7, M.steel, -6.35, 0.55, 3.85); drum.rotation.z = Math.PI / 2; drum.position.y = 0.95;
  cyl(0.2, 0.06, 0.34, M.brass, -6.35, 1.3, 3.85, root, 18); box(0.5, 0.34, 0.36, M.burlap, -5.55, 0, 4.1, root, 0.08); box(0.46, 0.3, 0.34, M.burlap, -5.6, 0.32, 4.08, root, 0.08);

  /* ---------- The Salon: Royal Darbar table on its rug, two marble duos ---------- */
  const DC = [0.4, 0.75];
  const rug = plane(5.6, 3.5, new THREE.MeshStandardMaterial({ map: rugTex, transparent: true, roughness: 1 }), DC[0], 0.008, DC[1]);
  rug.renderOrder = 1;
  box(3.1, 0.07, 1.05, M.sheesham, DC[0], 0.72, DC[1], root, 0.035);
  [-1.0, 1.0].forEach(o => { box(0.14, 0.72, 0.6, M.walnut, DC[0] + o, 0, DC[1], root, 0.03); box(0.5, 0.05, 0.78, M.walnut, DC[0] + o, 0, DC[1]); });
  [-1.05, 0, 1.05].forEach(o => { chair(DC[0] + o, DC[1] - 0.86, 0, M.oxblood); chair(DC[0] + o, DC[1] + 0.86, Math.PI, M.oxblood); });
  chair(DC[0] - 1.9, DC[1], Math.PI / 2, M.oxblood); chair(DC[0] + 1.9, DC[1], -Math.PI / 2, M.oxblood);
  box(0.9, 0.025, 0.34, M.brass, DC[0], 0.79, DC[1], root, 0.012); cyl(0.08, 0.06, 0.2, M.white, DC[0] - 0.2, 0.815, DC[1]); cyl(0.05, 0.07, 0.12, M.glass, DC[0] + 0.18, 0.815, DC[1]).castShadow = false;
  [[-1.1, -0.3], [-0.5, 0.28], [0.55, -0.3], [1.1, 0.26]].forEach(([a, b]) => cup(DC[0] + a, 0.79, DC[1] + b));
  // chandelier
  const ch = put(new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.022, 10, 60), M.brass), DC[0], 2.25, DC[1]); ch.rotation.x = Math.PI / 2;
  const ch2 = put(new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.018, 10, 48), M.brass), DC[0], 2.45, DC[1]); ch2.rotation.x = Math.PI / 2;
  for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283; put(new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), M.bulb), DC[0] + Math.cos(a) * 0.78, 2.2, DC[1] + Math.sin(a) * 0.78, root, false); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; put(new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), M.bulb), DC[0] + Math.cos(a) * 0.46, 2.41, DC[1] + Math.sin(a) * 0.46, root, false); }
  cyl(0.008, 0.008, 0.6, M.brass, DC[0], 2.45, DC[1], root, 6);
  const DUO = [[-2.5, -1.75], [3.2, -1.3]];
  DUO.forEach(([x, z]) => { roundTable(x, z, 0.4, 0.74, M.marble); chair(x - 0.66, z, Math.PI / 2, M.cane, M.cane); chair(x + 0.66, z, -Math.PI / 2, M.cane, M.cane); cup(x - 0.16, 0.74, z + 0.05); cup(x + 0.17, 0.74, z - 0.08); pendant(x, 2.0, z); });

  /* ---------- Velvet Booths on the east wall ---------- */
  function booth(z0, z1, depth, tw, td) {
    const len = z1 - z0, cz = (z0 + z1) / 2, xb = W - 0.34;
    box(0.62, 0.42, len, M.velvet, xb, 0, cz, root, 0.06); box(0.2, 0.7, len, M.velvetDark, W - 0.1, 0.4, cz, root, 0.06);            // back bench
    [z0 + 0.31, z1 - 0.31].forEach((z, i) => { box(depth, 0.42, 0.62, M.velvet, W - 0.65 - depth / 2, 0, z, root, 0.06); box(depth + 0.6, 0.7, 0.2, M.velvetDark, W - 0.35 - depth / 2, 0.4, z + (i ? 0.21 : -0.21), root, 0.06); });
    for (let z = z0 + 0.5; z < z1 - 0.3; z += 0.5) put(new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M.brass), W - 0.21, 0.82, z, root, false); // tufting
    const tx = W - 0.75 - depth / 2; box(tw, 0.05, td, M.walnutTop, tx, 0.5, cz, root, 0.02); box(tw * 0.5, 0.5, td * 0.5, M.walnut, tx, 0, cz, root, 0.03);
    cup(tx - 0.2, 0.55, cz - 0.15); cup(tx + 0.15, 0.55, cz + 0.18); pendant(tx, 1.75, cz);
    return [tx, cz];
  }
  const B1 = booth(-2.35, -0.25, 1.1, 0.8, 0.75), B2 = booth(0.75, 3.85, 1.5, 1.05, 1.5);
  plant(6.6, 0.25, 0.9);

  /* ---------- Garden Terrace (south, open air) ---------- */
  const TX = [2.1, 5.5];
  TX.forEach(x => { roundTable(x, 6.3, 0.52, 0.74, M.teak); [[0, -0.82, 0], [0, 0.82, Math.PI], [-0.82, 0, Math.PI / 2], [0.82, 0, -Math.PI / 2]].forEach(([a, b, r]) => chair(x + a, 6.3 + b, r, M.teak, M.teak)); cup(x - 0.15, 0.74, 6.2); cup(x + 0.18, 0.74, 6.42); cyl(0.06, 0.07, 0.16, M.brass, x, 0.74, 6.3, root, 10); put(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), M.bulb), x, 0.86, 6.3, root, false); });
  for (let x = 0.3; x <= 7.25; x += 0.99) box(0.05, 0.9, 0.05, M.black, x, 0, 7.82);
  for (let z = 4.9; z <= 7.82; z += 0.97) box(0.05, 0.9, 0.05, M.black, 7.25, 0, z);
  box(7.0, 0.05, 0.07, M.walnut, 3.77, 0.9, 7.82); box(0.07, 0.05, 2.95, M.walnut, 7.25, 0.9, 6.36);
  [[0.75, 5.2], [0.75, 7.3], [6.8, 5.05]].forEach(([x, z]) => { box(0.9, 0.38, 0.36, M.walnut, x, 0, z, root, 0.03); for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1), i % 2 ? M.leaf : M.leaf2); m.scale.y = 0.8 + rnd() * 0.5; put(m, x - 0.33 + i * 0.13, 0.42 + rnd() * 0.08, z + (rnd() - 0.5) * 0.12); } });
  plant(-4.9, 5.4, 1.3, true); plant(-0.6, 7.2, 1.0); plant(-6.4, 6.9, 1.2);

  // a few more plants indoors
  plant(-3.6, 4.05, 0.9); plant(1.55, -2.75, 0.8); plant(-0.9, 4.05, 1.0, true);

  /* ------------------------------------------------------------------ */
  /* Light                                                               */
  /* ------------------------------------------------------------------ */
  scene.add(new THREE.HemisphereLight(0xffeedd, 0x3a2a1c, 0.34));
  const sun = new THREE.DirectionalLight(0xffdcae, 3.0);
  sun.position.set(10, 12.5, 8); sun.target.position.set(0.5, 0, 0.5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025;
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 2, far: 40 }); sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);
  [[DC[0], 2.0, DC[1], 22, 9], [-5.6, 1.9, 0.4, 16, 7], [4.5, 1.5, -3.7, 7, 4.5], [5.4, 1.5, 1.2, 10, 6], [-2.6, 1.9, -3.6, 8, 5]].forEach(([x, y, z, i, d]) => { const p = new THREE.PointLight(0xffc27a, i, d, 2); p.position.set(x, y, z); scene.add(p); });

  // Zone spotlights. Choosing a zone lowers the house lights (exposure) and raises two soft
  // spots over that zone, so its seats stand out and everything else falls back.
  const EXPOSURE = 0.92, EXPOSURE_DIM = 0.13, SPOT_POWER = 26;
  const ZONE_SPOTS = { // [x, z] of each pool of light, and its radius on the floor
    window: { at: [[-4.4, -3.75], [-0.8, -3.75]], r: 2.5 },
    pods: { at: [[3.6, -3.7], [5.5, -3.7]], r: 2.0 },
    salon: { at: [[-1.6, -0.9], [1.9, 0.1]], r: 3.3 },
    booths: { at: [[5.9, -1.3], [5.7, 2.3]], r: 2.4 },
    bar: { at: [[-5.4, -0.7], [-5.4, 1.5]], r: 2.4 },
    terrace: { at: [[2.1, 6.3], [5.5, 6.3]], r: 2.0 },
  };
  const spots = [0, 1].map(() => {
    const s = new THREE.SpotLight(0xffe3bd, 0, 0, 0.4, 0.45, 0); // decay 0: even light, no falloff
    scene.add(s, s.target); return s;
  });
  const mood = { dim: 0 };
  let moodTween = null;
  function setSpots(k) {
    const z = ZONE_SPOTS[k]; if (!z) return;
    spots.forEach((s, i) => {
      const [x, zz] = z.at[i];
      s.position.set(x + 0.8, 6.5, zz + 1.6); s.target.position.set(x, 0.4, zz);
      s.angle = Math.atan(z.r / 6.5); s.target.updateMatrixWorld();
    });
  }
  function applyMood() {
    renderer.toneMappingExposure = EXPOSURE + (EXPOSURE_DIM - EXPOSURE) * mood.dim;
    spots.forEach(s => { s.intensity = SPOT_POWER * mood.dim; });
  }

  /* ------------------------------------------------------------------ */
  /* Seats: where each one is, how big, and where its tag floats          */
  /* ------------------------------------------------------------------ */
  const SPOT = {};
  WX.forEach((x, i) => { SPOT['W' + (i + 1)] = { at: [x, -3.75], h: 1.55, size: [1.3, 1.25, 1.2], r: 0.78 }; });
  PX.forEach((x, i) => { SPOT['P' + (i + 1)] = { at: [x, -3.7], h: 1.85, size: [1.5, 1.55, 1.5], r: 0.86 }; });
  DUO.forEach(([x, z], i) => { SPOT['C' + (i + 1)] = { at: [x, z], h: 1.25, size: [1.9, 1.0, 1.0], r: 1.02 }; });
  SPOT.D1 = { at: DC, h: 1.35, size: [4.4, 1.0, 2.5], r: 2.3, oval: 0.62 };
  SPOT.B1 = { at: [B1[0] + 0.25, B1[1]], h: 1.5, size: [2.0, 1.1, 2.1], r: 1.3 };
  SPOT.B2 = { at: [B2[0] + 0.3, B2[1]], h: 1.5, size: [2.5, 1.1, 3.1], r: 1.75 };
  SZ.forEach((z, i) => { SPOT['S' + (i + 1)] = { at: [-4.62, z], h: 1.45, size: [0.9, 1.3, 0.8], r: 0.5 }; });
  TX.forEach((x, i) => { SPOT['T' + (i + 1)] = { at: [x, 6.3], h: 1.3, size: [2.3, 1.0, 2.3], r: 1.3 }; });

  const hits = [], rings = {}, tags = {};
  const tagLayer = document.createElement('div'); tagLayer.className = 'rv-tags';
  const ringGeo = new THREE.RingGeometry(0.9, 1, 72);
  RV.SEATS.forEach(s => {
    const p = SPOT[s.id]; if (!p) return;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(...p.size), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(p.at[0], p.size[1] / 2, p.at[1]); hit.userData.seat = s.id; root.add(hit); hits.push(hit);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xf3d79a, transparent: true, opacity: 0, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.scale.set(p.r, p.r * (p.oval || 1), 1); ring.position.set(p.at[0], 0.02, p.at[1]); ring.renderOrder = 3; root.add(ring); rings[s.id] = ring;
    const tag = document.createElement('button'); tag.type = 'button'; tag.className = 'rv-tag'; tag.dataset.seat = s.id; tag.dataset.zone = s.zone; tag.textContent = s.id;
    tag.setAttribute('aria-label', `${s.name}, seats ${s.cap}`); tagLayer.appendChild(tag); tags[s.id] = tag;
  });

  /* ------------------------------------------------------------------ */
  /* Camera: orbits a target; eased moves between views                   */
  /* ------------------------------------------------------------------ */
  const deg = d => d * Math.PI / 180;
  const HOME = { tx: -0.5, ty: 0.1, tz: 1.5, az: deg(30), el: deg(40), r: 31.5 };
  const VIEWS = {
    '': HOME,
    window: { tx: -2.6, ty: 0.9, tz: -3.2, az: deg(16), el: deg(30), r: 17 },
    pods: { tx: 4.4, ty: 0.8, tz: -3.2, az: deg(18), el: deg(34), r: 14 },
    salon: { tx: 0.4, ty: 0.6, tz: 0.2, az: deg(24), el: deg(36), r: 19 },
    booths: { tx: 5.4, ty: 0.6, tz: 0.8, az: deg(-24), el: deg(38), r: 16 },
    bar: { tx: -5.4, ty: 1.0, tz: 1.3, az: deg(56), el: deg(27), r: 17.5 },
    terrace: { tx: 3.7, ty: 0.5, tz: 6.0, az: deg(22), el: deg(36), r: 15 },
  };
  const cam = { ...HOME };
  let W0 = 0, H0 = 0, dirty = false, tween = null, hover = null, zone = '', shadowFrames = 4;
  const v3 = new THREE.Vector3();
  function placeCamera() {
    const fit = Math.max(1, 1.5 / (W0 / H0 || 1.5)); // step back on tall, narrow screens
    const r = cam.r * fit, ce = Math.cos(cam.el);
    camera.position.set(cam.tx + r * Math.sin(cam.az) * ce, cam.ty + r * Math.sin(cam.el), cam.tz + r * Math.cos(cam.az) * ce);
    camera.lookAt(cam.tx, cam.ty, cam.tz);
  }
  function render() {
    dirty = false;
    const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    if (w !== W0 || h !== H0) { W0 = w; H0 = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    if (tween) {
      const k = Math.min(1, (performance.now() - tween.t0) / tween.dur), e = 1 - Math.pow(1 - k, 4);
      for (const key in tween.to) cam[key] = tween.from[key] + (tween.to[key] - tween.from[key]) * e;
      if (k >= 1) tween = null; else invalidate();
    }
    if (moodTween) {
      const k = Math.min(1, (performance.now() - moodTween.t0) / moodTween.dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      mood.dim = moodTween.from + (moodTween.to - moodTween.from) * e; applyMood();
      if (k >= 1) moodTween = null; else invalidate();
    }
    placeCamera();
    if (shadowFrames > 0) { shadowFrames--; renderer.shadowMap.needsUpdate = true; }
    renderer.render(scene, camera);
    // float each seat's tag above it
    for (const id in tags) {
      const p = SPOT[id]; v3.set(p.at[0], p.h, p.at[1]).project(camera);
      tags[id].style.transform = `translate(${((v3.x + 1) / 2 * w).toFixed(1)}px, ${((1 - v3.y) / 2 * h).toFixed(1)}px) translate(-50%, -50%)`;
    }
  }
  function invalidate() { if (!dirty) { dirty = true; requestAnimationFrame(render); } }
  function flyTo(view, dur = 1500) {
    if (RV.reduce) { Object.assign(cam, view); invalidate(); return; }
    tween = { from: { ...cam }, to: { ...view }, t0: performance.now(), dur }; invalidate();
  }

  /* ------------------------------------------------------------------ */
  /* State from the reservation logic → rings + tags                      */
  /* ------------------------------------------------------------------ */
  function sync() {
    const sel = RV.selected();
    RV.SEATS.forEach(s => {
      const st = RV.status(s.id), tag = tags[s.id], ring = rings[s.id]; if (!tag) return;
      const lit = zone && s.zone === zone;
      tag.className = 'rv-tag is-' + st + (sel === s.id ? ' is-selected' : '') + (zone && !lit ? ' is-dim' : '') + (lit ? ' is-lit' : '');
      tag.setAttribute('aria-disabled', st === 'taken' || st === 'small' ? 'true' : 'false');
      const on = sel === s.id, hov = hover === s.id;
      ring.material.color.set(st === 'mine' ? 0x9fd39a : st === 'taken' ? 0xc0604a : 0xf3d79a);
      ring.material.opacity = on ? 0.95 : hov ? 0.7 : lit ? 0.5 : 0;
    });
    invalidate();
  }

  /* ------------------------------------------------------------------ */
  /* Pointer: drag to look around, hover and click seats                  */
  /* ------------------------------------------------------------------ */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function seatAt(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hits, false)[0];
    return hit ? hit.object.userData.seat : null;
  }
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, az: cam.az, el: cam.el, moved: false }; canvas.setPointerCapture(e.pointerId); tween = null; });
  canvas.addEventListener('pointermove', e => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
      if (drag.moved) {
        cam.az = Math.min(deg(72), Math.max(deg(-30), drag.az - dx * 0.006));
        cam.el = Math.min(deg(62), Math.max(deg(22), drag.el + dy * 0.004));
        stage.classList.add('is-dragging'); RV.tip(null); invalidate(); return;
      }
    }
    const id = seatAt(e);
    if (id !== hover) { hover = id; canvas.style.cursor = id ? 'pointer' : ''; sync(); }
    RV.tip(id, e.clientX, e.clientY);
  });
  const endDrag = e => {
    if (drag && !drag.moved) { const id = seatAt(e); if (id) RV.select(id); }
    drag = null; stage.classList.remove('is-dragging');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', () => { drag = null; stage.classList.remove('is-dragging'); });
  canvas.addEventListener('pointerleave', () => { if (hover) { hover = null; sync(); } RV.tip(null); });
  // mouse wheel (or trackpad pinch) zooms the model; the page does not scroll while the pointer is on it
  stage.setAttribute('data-lenis-prevent', '');
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const k = Math.exp((e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY) * 0.0011);
    if (tween) { delete tween.to.r; delete tween.from.r; }
    cam.r = Math.min(42, Math.max(9, cam.r * k)); RV.tip(null); invalidate();
  }, { passive: false });
  tagLayer.addEventListener('click', e => { const t = e.target.closest('.rv-tag'); if (t) RV.select(t.dataset.seat); });
  tagLayer.addEventListener('pointerover', e => { const t = e.target.closest('.rv-tag'); if (t && hover !== t.dataset.seat) { hover = t.dataset.seat; sync(); } });
  tagLayer.addEventListener('pointerout', () => { if (hover) { hover = null; sync(); } });

  // view controls
  const ctl = document.createElement('div'); ctl.className = 'rv-plan-ctl';
  ctl.innerHTML = `<button type="button" data-a="left" aria-label="Turn left" title="Turn left"><svg viewBox="0 0 24 24"><path d="M9 6 3 12l6 6M3 12h13a5 5 0 0 1 5 5"/></svg></button>
    <button type="button" data-a="right" aria-label="Turn right" title="Turn right"><svg viewBox="0 0 24 24"><path d="m15 6 6 6-6 6M21 12H8a5 5 0 0 0-5 5"/></svg></button>
    <button type="button" data-a="in" aria-label="Zoom in" title="Zoom in"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
    <button type="button" data-a="out" aria-label="Zoom out" title="Zoom out"><svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg></button>
    <button type="button" data-a="home" aria-label="Reset view" title="Reset view"><svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7M6 10v9h12v-9"/></svg></button>`;
  ctl.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.a, to = { ...cam };
    if (a === 'left') to.az = Math.min(deg(72), cam.az + deg(22));
    if (a === 'right') to.az = Math.max(deg(-30), cam.az - deg(22));
    if (a === 'in') to.r = Math.max(11, cam.r * 0.78);
    if (a === 'out') to.r = Math.min(40, cam.r * 1.28);
    if (a === 'home') { RV.zone(''); return; }
    flyTo(to, 800);
  });

  /* ------------------------------------------------------------------ */
  /* Mount                                                               */
  /* ------------------------------------------------------------------ */
  stage.innerHTML = ''; stage.classList.add('has-3d');
  const hint = document.createElement('span'); hint.className = 'rv-plan-hint'; hint.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 12h8M5 9l-3 3 3 3M19 9l3 3-3 3"/></svg> Drag to turn · scroll to zoom';
  stage.append(canvas, tagLayer, ctl, hint);
  new ResizeObserver(invalidate).observe(stage);

  window.__rvPlan3d = {
    sync,
    focus(k) {
      zone = k || '';
      if (zone) setSpots(zone);
      const to = zone ? 1 : 0;
      if (RV.reduce) { mood.dim = to; applyMood(); } else moodTween = { from: mood.dim, to, t0: performance.now(), dur: 1100 };
      flyTo(VIEWS[zone] || HOME); sync();
    },
  };
  sync();
  // reservation.html?zone=bar opens on that part of the café
  const startZone = new URLSearchParams(location.search).get('zone');
  if (startZone && VIEWS[startZone]) setTimeout(() => RV.zone(startZone), 400);
  // opening move: the camera settles into place the first time the plan is seen
  if (!RV.reduce) {
    Object.assign(cam, { ...HOME, az: deg(62), el: deg(56), r: 44 });
    new IntersectionObserver((en, io) => { if (en[0].isIntersecting) { io.disconnect(); stage.classList.add('is-in'); flyTo(HOME, 2600); } }, { threshold: 0.3 }).observe(stage);
  } else stage.classList.add('is-in');
  invalidate(); setTimeout(invalidate, 300); setTimeout(invalidate, 900);
}

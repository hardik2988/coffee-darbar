// Coffee Darbar — realistic 3D scenes.
// One fixed WebGL canvas draws every 3D view on the page. Each view is tied to a
// DOM element ([data-view]) and is rendered into that element's rectangle.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const HDR_URL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/brown_photostudio_02_1k.hdr';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = () => innerWidth < 768;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInCubic = t => t * t * t;
const easeOutBack = t => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeOutBounce = t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; };
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seeded = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

function signalReady() {
  if (window.__darbar3dReady) return;
  window.__darbar3dReady = true;
  window.dispatchEvent(new Event('darbar:ready'));
}

/* ================================================================== */
/* Canvas textures                                                     */
/* ================================================================== */
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const texCache = {};
const tex = (key, make) => texCache[key] || (texCache[key] = make());

function surfaceTexture(kind) {
  return tex('surf-' + kind, () => canvasTex(1024 * TEX_SCALE, 1024 * TEX_SCALE, (g) => {
    g.scale(TEX_SCALE, TEX_SCALE); // 2x on capable devices for crisp latte art; coordinates below are in a 1024 space
    const w = 1024, c = w / 2, R = w / 2, rnd = seeded(kind.length * 977 + 13);
    const pal = {
      heart: ['#c99561', '#8a4f26', '#3e1f0c'], rosetta: ['#cfa070', '#8d5329', '#40200d'],
      crema: ['#d29a5b', '#9a5523', '#3a1a08'], mocha: ['#9a6440', '#5e321a', '#2a1309'],
      saffron: ['#e2b25c', '#b97a2e', '#5a3010'], kaapi: ['#d3ab82', '#a8774c', '#5d3818'],
      milk: ['#efe3d0', '#d9c2a2', '#9c7650'],
      black: ['#4a2611', '#2a1408', '#140903'], caramel: ['#d6a068', '#94562a', '#43220d'],
      matcha: ['#c9d9a0', '#93ad62', '#4d6230'], brew: ['#5a2e14', '#36190a', '#1a0b04'],
    }[kind] || ['#c99561', '#8a4f26', '#3e1f0c'];
    const grad = g.createRadialGradient(c, c, 0, c, c, R);
    grad.addColorStop(0, pal[0]); grad.addColorStop(0.72, pal[1]); grad.addColorStop(0.94, pal[2]); grad.addColorStop(1, '#1d0d05');
    g.fillStyle = grad; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 1600; i++) {
      const r = Math.sqrt(rnd()) * R * 0.95, t = rnd() * 7;
      g.fillStyle = `rgba(${rnd() > 0.5 ? '255,235,205' : '60,25,8'},${0.04 + rnd() * 0.08})`;
      g.beginPath(); g.arc(c + Math.cos(t) * r, c + Math.sin(t) * r, 1 + rnd() * 3, 0, 7); g.fill();
    }
    g.fillStyle = '#f6ecdc'; g.shadowColor = 'rgba(246,236,220,0.7)'; g.shadowBlur = 18;
    if (kind === 'tulip') {
      // barista tulip: three stacked lobes and a heart, joined by a pull-through line
      g.save(); g.translate(c, c + 30); g.shadowBlur = 10;
      const lobe = (y, wd, ht) => { g.beginPath(); g.ellipse(0, y, wd, ht, 0, 0, Math.PI * 2); g.fill(); };
      lobe(190, 250, 95);
      g.fillStyle = 'rgba(140,82,40,0.9)'; lobe(150, 215, 62); g.fillStyle = '#f6ecdc';
      lobe(110, 205, 78);
      g.fillStyle = 'rgba(140,82,40,0.9)'; lobe(78, 170, 50); g.fillStyle = '#f6ecdc';
      lobe(40, 160, 68);
      g.beginPath(); g.moveTo(0, -40); g.bezierCurveTo(-20, -70, -150, -110, -135, -190); g.bezierCurveTo(-120, -265, -25, -255, 0, -185);
      g.bezierCurveTo(25, -255, 120, -265, 135, -190); g.bezierCurveTo(150, -110, 20, -70, 0, -40); g.fill();
      g.strokeStyle = 'rgba(150,92,48,0.75)'; g.lineWidth = 7; g.shadowBlur = 2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, -250); g.lineTo(0, 270); g.stroke();
      g.restore();
    } else if (kind === 'heart' || kind === 'caramel') {
      g.save(); g.translate(c, c + 40); g.scale(1.25, 1.25); g.beginPath();
      g.moveTo(0, 150); g.bezierCurveTo(-40, 110, -230, 10, -200, -110); g.bezierCurveTo(-170, -230, -30, -210, 0, -110);
      g.bezierCurveTo(30, -210, 170, -230, 200, -110); g.bezierCurveTo(230, 10, 40, 110, 0, 150); g.fill();
      g.strokeStyle = 'rgba(160,100,55,0.55)'; g.lineWidth = 6; g.shadowBlur = 4; g.beginPath(); g.moveTo(0, -150); g.lineTo(0, 150); g.stroke();
      g.restore();
      if (kind === 'caramel') {
        // glossy salted-caramel drizzle across the heart, with a few sea-salt flakes
        g.shadowBlur = 0; g.lineCap = 'round';
        for (let i = 0; i < 5; i++) {
          const y = c - 230 + i * 115;
          [[16, 'rgba(120,58,18,0.55)'], [9, '#c07a32'], [3, 'rgba(255,214,150,0.85)']].forEach(([lw, col]) => {
            g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(c - 330, y + 40);
            g.bezierCurveTo(c - 120, y - 40, c + 120, y + 60, c + 330, y - 20); g.stroke();
          });
        }
        for (let i = 0; i < 40; i++) { const r = rnd() * R * 0.7, t = rnd() * 7; g.fillStyle = `rgba(255,255,250,${0.6 + rnd() * 0.4})`; g.fillRect(c + Math.cos(t) * r, c + Math.sin(t) * r, 3 + rnd() * 5, 3 + rnd() * 4); }
      }
    } else if (kind === 'rosetta' || kind === 'saffron') {
      g.save(); g.translate(c, c);
      for (let i = 0; i < 9; i++) {
        const y = -260 + i * 58, s = 1 - i * 0.075;
        g.beginPath(); g.ellipse(0, y, 190 * s, 34, 0, Math.PI, 0, false); g.bezierCurveTo(140 * s, y + 30, -140 * s, y + 30, -190 * s, y); g.fill();
      }
      g.strokeStyle = 'rgba(150,90,40,0.6)'; g.lineWidth = 5; g.shadowBlur = 2; g.beginPath(); g.moveTo(0, -300); g.lineTo(0, 260); g.stroke();
      g.restore();
      if (kind === 'saffron') {
        g.shadowBlur = 0; g.lineCap = 'round';
        for (let i = 0; i < 26; i++) {
          const r = rnd() * R * 0.6, t = rnd() * 7, x = c + Math.cos(t) * r, y = c + Math.sin(t) * r, a = rnd() * 7;
          g.strokeStyle = rnd() > 0.5 ? '#c2321b' : '#e0571e'; g.lineWidth = 3 + rnd() * 2;
          g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18 + 6, x + Math.cos(a) * 36, y + Math.sin(a) * 36); g.stroke();
        }
      }
    } else if (kind === 'crema') {
      g.shadowBlur = 0;
      for (let i = 0; i < 90; i++) {
        const t = rnd() * 7, r1 = rnd() * R * 0.25, r2 = r1 + R * (0.25 + rnd() * 0.6);
        g.strokeStyle = `rgba(${rnd() > 0.5 ? '240,190,120' : '90,40,12'},${0.12 + rnd() * 0.18})`; g.lineWidth = 2 + rnd() * 6;
        g.beginPath(); g.moveTo(c + Math.cos(t) * r1, c + Math.sin(t) * r1);
        g.quadraticCurveTo(c + Math.cos(t + 0.4) * (r1 + r2) / 2, c + Math.sin(t + 0.4) * (r1 + r2) / 2, c + Math.cos(t + 0.15) * r2, c + Math.sin(t + 0.15) * r2); g.stroke();
      }
    } else if (kind === 'mocha') {
      g.beginPath(); g.arc(c, c, R * 0.55, 0, 7); g.fill(); g.shadowBlur = 0;
      for (let i = 0; i < 3500; i++) { const r = Math.sqrt(rnd()) * R * 0.56, t = rnd() * 7; g.fillStyle = `rgba(70,32,14,${0.25 + rnd() * 0.5})`; g.fillRect(c + Math.cos(t) * r, c + Math.sin(t) * r, 2 + rnd() * 3, 2 + rnd() * 3); }
    } else if (kind === 'black' || kind === 'brew') {
      // clear black coffee: no foam, just a glossy reflection and a few oil sheens
      g.shadowBlur = 0;
      const hl = g.createRadialGradient(c - 150, c - 170, 0, c - 150, c - 170, 300);
      hl.addColorStop(0, 'rgba(255,225,185,0.22)'); hl.addColorStop(1, 'rgba(255,225,185,0)');
      g.fillStyle = hl; g.fillRect(0, 0, w, w);
      for (let i = 0; i < 30; i++) {
        const r = R * (0.2 + rnd() * 0.65), a0 = rnd() * 7;
        g.strokeStyle = `rgba(190,120,60,${0.06 + rnd() * 0.08})`; g.lineWidth = 2 + rnd() * 5;
        g.beginPath(); g.arc(c, c, r, a0, a0 + 0.4 + rnd() * 1.2); g.stroke();
      }
      if (kind === 'brew') for (let i = 0; i < 60; i++) { const r = R * (0.75 + rnd() * 0.18), t = rnd() * 7; g.strokeStyle = `rgba(230,190,140,${0.2 + rnd() * 0.25})`; g.lineWidth = 1.5; g.beginPath(); g.arc(c + Math.cos(t) * r, c + Math.sin(t) * r, 3 + rnd() * 7, 0, 7); g.stroke(); }
    } else if (kind === 'kaapi' || kind === 'milk' || kind === 'matcha') {
      g.shadowBlur = 0;
      for (let i = 0; i < 900; i++) { const r = Math.sqrt(rnd()) * R * 0.9, t = rnd() * 7; g.strokeStyle = `rgba(255,245,230,${0.15 + rnd() * 0.25})`; g.lineWidth = 1.5; g.beginPath(); g.arc(c + Math.cos(t) * r, c + Math.sin(t) * r, 4 + rnd() * 16, 0, 7); g.stroke(); }
    }
    // meniscus: a fine ring of crema foam where the coffee meets the porcelain
    // (soft edge built from stacked translucent strokes — no canvas blur filter, which is slow)
    g.shadowBlur = 0;
    [[26, 0.12], [18, 0.16], [10, 0.22], [5, 0.28]].forEach(([lw, a]) => {
      g.strokeStyle = `rgba(236,200,150,${a})`; g.lineWidth = lw;
      g.beginPath(); g.arc(c, c, R * 0.955, 0, Math.PI * 2); g.stroke();
    });
    for (let i = 0; i < 260; i++) { const t = rnd() * 7, r = R * (0.9 + rnd() * 0.08); g.fillStyle = `rgba(250,228,196,${0.18 + rnd() * 0.3})`; g.beginPath(); g.arc(c + Math.cos(t) * r, c + Math.sin(t) * r, 1.5 + rnd() * 3.5, 0, 7); g.fill(); }
  }));
}

// Layered iced latte: milk on top, espresso cascading down (mapped along the liquid's height)
const ICED = {
  latte: { stops: ['#f1e6d6', '#e3cfb2', '#a8744a', '#5d3219', '#2b1408'], light: '240,222,198', dark: '90,46,20' },
  matcha: { stops: ['#eef0dc', '#d6e2b4', '#9fbb68', '#6f8f3c', '#3f5a22'], light: '238,242,220', dark: '80,110,40' },
  brew: { stops: ['#6b3a1a', '#4e260f', '#3a1a09', '#2a1206', '#1a0b04'], light: '160,90,40', dark: '20,8,3' },
  frappe: { stops: ['#e6d2b8', '#cfb08a', '#a77a52', '#7e5233', '#57351f'], light: '240,225,205', dark: '70,36,16' },
};
function icedLiquidTexture(kind = 'latte') {
  const P = ICED[kind] || ICED.latte;
  return tex('iced-liquid-' + kind, () => canvasTex(512, 1024, (g, w, h) => {
    const rnd = seeded(7);
    const grad = g.createLinearGradient(0, 0, 0, h);
    [0, 0.28, 0.5, 0.72, 1].forEach((o, i) => grad.addColorStop(o, P.stops[i]));
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    // soft clouds of espresso drifting down into the milk
    // (each cloud is a radial gradient that fades to nothing — no slow canvas blur filter)
    for (let i = 0; i < 70; i++) {
      const y = h * (0.22 + rnd() * 0.5), x = rnd() * w, len = 40 + rnd() * 120, ht = 18 + rnd() * 60;
      const col = rnd() > 0.55 ? P.light : P.dark, a = 0.25 + rnd() * 0.35;
      const rot = (rnd() - 0.5) * 0.6;
      // drawn at x - w, x and x + w so the texture tiles: no seam where the glass wraps round
      for (const ox of [-w, 0, w]) {
        g.save(); g.translate(x + ox, y); g.rotate(rot); g.scale(1, ht / len);
        const cg = g.createRadialGradient(0, 0, 0, 0, 0, len);
        cg.addColorStop(0, `rgba(${col},${a})`); cg.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = cg; g.beginPath(); g.arc(0, 0, len, 0, 7); g.fill(); g.restore();
      }
    }
    for (let i = 0; i < 40; i++) {
      const y = h * (0.3 + rnd() * 0.4), x0 = rnd() * w, ex = 10 * rnd(), ey = 130 + rnd() * 80;
      g.strokeStyle = `rgba(250,236,215,${0.08 + rnd() * 0.12})`; g.lineWidth = 3 + rnd() * 6;
      for (const x of [x0 - w, x0, x0 + w]) { g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 30, y + 40, x - 30, y + 80, x + ex, y + ey); g.stroke(); }
    }
  }));
}

// Gold decoration for the cup body: fine double hairlines with tiny diamonds all round,
// and one small crest medallion on the front (crown, "CD" monogram, laurels, wordmark).
// The band wraps a circumference ~2x wider than it is tall, so the medallion is drawn
// squeezed horizontally to look round on the cup.
function logoBandTexture() {
  return tex('band', () => canvasTex(4096, 512, (g, w, h) => {
    g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    // hairlines + diamond chain (top) and a single fine line (bottom)
    g.fillRect(0, 22, w, 2.5); g.fillRect(0, 36, w, 1.2);
    for (let x = 32; x < w; x += 64) { g.beginPath(); g.moveTo(x, 23); g.lineTo(x + 5, 29); g.lineTo(x, 35); g.lineTo(x - 5, 29); g.closePath(); g.fill(); }
    g.fillRect(0, h - 30, w, 1.6);
    // medallion
    g.save(); g.translate(w / 2, 0); g.scale(0.5, 1);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    // the Coffee Darbar mark — jharokha steam crown (same paths as darbar-logo.svg)
    g.save(); g.translate(-32 * 3.5, 62); g.scale(3.5, 3.5);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const stroke = (d, lw, a = 1) => { g.globalAlpha = a; g.lineWidth = lw; g.stroke(new Path2D(d)); g.globalAlpha = 1; };
    const fill = d => g.fill(new Path2D(d));
    fill('M32 .8 34 3.6 32 6.4 30 3.6Z');
    stroke('M10 66V34C10 23 18 18 24.5 14 28.5 11.5 31 9.4 32 7.6 33 9.4 35.5 11.5 39.5 14 46 18 54 23 54 34V66', 2.2);
    stroke('M15 66V35C15 27 21 23 26 19.6 29 17.6 31 15.6 32 13.6 33 15.6 35 17.6 38 19.6 43 23 49 27 49 35V66', 1, 0.6);
    stroke('M4 66H60', 2.2); stroke('M7 70.5H57', 1.2);
    stroke('M12 70.5Q15 76.5 18 70.5M46 70.5Q49 76.5 52 70.5', 1.2);
    stroke('M21 62H43', 2); stroke('M41 51C46 50.6 46 57 40 57.3', 1.7);
    stroke('M24.5 46.8Q32 44.6 39.5 46.8', 1.3);
    stroke('M24.5 46.4C23 42 26.5 38.5 25 34 26.8 36 28 38.5 28.8 40.6 29.5 36 31.5 33 32 29 32.5 33 34.5 36 35.2 40.6 36 38.5 37.2 36 39 34 37.5 38.5 41 42 39.5 46.4', 1.5);
    stroke('M32 24.6C30.8 22.4 33.2 20.6 32 17.8', 1.1, 0.65);
    fill('M22.5 49H41.5C41.5 55.5 38 59.5 32 59.5 26 59.5 22.5 55.5 22.5 49Z');
    [[25, 32.4, 1.5], [32, 27.2, 1.6], [39, 32.4, 1.5]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    g.restore();
    // laurel sprigs wreathing the mark
    g.lineWidth = 3;
    const LC = 205, LR = 172; // wreath centre (y) and radius
    [-1, 1].forEach(side => {
      g.beginPath(); g.arc(0, LC, LR, side < 0 ? Math.PI * 0.6 : Math.PI * 0.4, side < 0 ? Math.PI * 1.22 : -Math.PI * 0.22, side > 0); g.stroke();
      for (let i = 0; i < 7; i++) {
        const a = side < 0 ? Math.PI * (0.66 + i * 0.085) : Math.PI * (0.34 - i * 0.085);
        const x = Math.cos(a) * LR, y = LC + Math.sin(a) * LR;
        g.save(); g.translate(x, y); g.rotate(a + (side < 0 ? -0.6 : 0.6) + Math.PI / 2);
        g.beginPath(); g.ellipse(0, 0, 7, 20, 0, 0, 7); g.fill(); g.restore();
      }
    });
    // wordmark + date
    g.font = '700 38px Manrope, sans-serif';
    if ('letterSpacing' in g) g.letterSpacing = '18px';
    g.fillText('COFFEE  DARBAR', 0, 402);
    g.font = '600 24px Manrope, sans-serif';
    if ('letterSpacing' in g) g.letterSpacing = '12px';
    g.fillText('MAISON · EST. 2025', 0, 444);
    g.restore();
  }));
}

const blobTexture = (inner, outer) => tex('blob' + inner + outer, () => canvasTex(256, 256, (g, w) => {
  const grad = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  grad.addColorStop(0, inner); grad.addColorStop(1, outer); g.fillStyle = grad; g.fillRect(0, 0, w, w);
}));
const dotSprite = () => blobTexture('rgba(255,236,200,1)', 'rgba(255,210,150,0)');

/* ================================================================== */
/* Materials                                                           */
/* ================================================================== */
const phys = o => new THREE.MeshPhysicalMaterial(o);
// Fresnel opacity: surfaces seen edge-on catch more light (like real glass),
// surfaces facing the viewer stay almost clear.
function fresnel(mat, faceAlpha, edgeAlpha) {
  mat.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      float fresnelK = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.2);
      diffuseColor.a *= mix(${faceAlpha.toFixed(3)}, ${edgeAlpha.toFixed(3)}, fresnelK);`);
  };
  mat.customProgramCacheKey = () => 'fresnel' + faceAlpha + edgeAlpha;
  return mat;
}
const MAT = {
  // fine bone-china glazes: glassy clearcoat over a soft body, like real porcelain
  porcelain: phys({ color: 0xfbf8f1, roughness: 0.07, clearcoat: 1, clearcoatRoughness: 0.02, sheen: 0.25, sheenColor: new THREE.Color(0xfff1dc), envMapIntensity: 1.15, side: THREE.DoubleSide }),
  obsidian: phys({ color: 0x0c0a09, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.025, envMapIntensity: 1.5, side: THREE.DoubleSide }),
  oxblood: phys({ color: 0x4b1013, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03, sheen: 0.3, sheenColor: new THREE.Color(0x9a3a2a), envMapIntensity: 1.3, side: THREE.DoubleSide }),
  ivory: phys({ color: 0xf4ebd8, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02, sheen: 0.25, sheenColor: new THREE.Color(0xffe8c0), envMapIntensity: 1.15, side: THREE.DoubleSide }),
  cobalt: phys({ color: 0x14245c, roughness: 0.09, clearcoat: 1, clearcoatRoughness: 0.025, sheen: 0.3, sheenColor: new THREE.Color(0x5a78d0), envMapIntensity: 1.4, side: THREE.DoubleSide }),
  celadon: phys({ color: 0xa7baa4, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.25, side: THREE.DoubleSide }),
  // 24k gold leaf: warm, mirror-polished
  gold: new THREE.MeshPhysicalMaterial({ color: 0xffc967, metalness: 1, roughness: 0.12, clearcoat: 0.4, clearcoatRoughness: 0.1, envMapIntensity: 1.35 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xcf9d46, metalness: 1, roughness: 0.24, side: THREE.DoubleSide }),
  glass: fresnel(phys({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.5, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.6, side: THREE.DoubleSide, depthWrite: false }), 0.1, 1.0),
  ice: fresnel(phys({ color: 0xf4faff, emissive: 0x8fa6b8, emissiveIntensity: 0.22, roughness: 0.04, transparent: true, opacity: 0.9, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 3.2, depthWrite: false }), 0.22, 0.95),
  dew: fresnel(phys({ color: 0xffffff, roughness: 0.02, transparent: true, opacity: 0.6, clearcoat: 1, envMapIntensity: 3, depthWrite: false }), 0.15, 1),
  bean: phys({ color: 0x2c1509, vertexColors: true, roughness: 0.5, clearcoat: 0.28, clearcoatRoughness: 0.4, specularColor: new THREE.Color(0xffd2a0), specularIntensity: 0.7, envMapIntensity: 0.7 }),
  beanDark: phys({ color: 0x1e0e06, vertexColors: true, roughness: 0.46, clearcoat: 0.34, clearcoatRoughness: 0.38, specularColor: new THREE.Color(0xffcc96), specularIntensity: 0.7, envMapIntensity: 0.75 }),
  drop: phys({ color: 0x3d1c0b, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 }),
  whip: phys({ color: 0xf6efe4, roughness: 0.6, sheen: 1, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.5 }),
  chocCurl: phys({ color: 0x2e150a, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.25, side: THREE.DoubleSide }),
};
// gold decoration painted onto the glaze (crest + fine filigree lines)
const goldText = () => new THREE.MeshStandardMaterial({ color: 0xffcf75, metalness: 1, roughness: 0.16, envMapIntensity: 1.35, map: logoBandTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });

/* ================================================================== */
/* Geometry                                                            */
/* ================================================================== */
const geoCache = {};
const geo = (key, make) => geoCache[key] || (geoCache[key] = make());
const V2 = a => a.map(([x, y]) => new THREE.Vector2(x, y));

// Smooth profiles: control points are run through a spline, so silhouettes are silky,
// never faceted. Each cup has a small pedestal foot and a gently flared, thin rim.
const spline = (pts, n) => new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y))).getSpacedPoints(n).map(p => [p.x, p.y]);
const PROFILES = {
  bowl: { h: 1.16, wall: 0.026,
    foot: [[0, 0.016], [0.27, 0.016], [0.3, 0.002], [0.35, 0.002], [0.376, 0.026], [0.37, 0.064], [0.335, 0.1]],
    body: [[0.335, 0.1], [0.43, 0.15], [0.62, 0.3], [0.79, 0.52], [0.895, 0.74], [0.952, 0.94], [0.984, 1.08], [1.0, 1.16]] },
  tulip: { h: 1.4, wall: 0.024,
    foot: [[0, 0.016], [0.25, 0.016], [0.28, 0.002], [0.33, 0.002], [0.355, 0.026], [0.35, 0.064], [0.315, 0.1]],
    body: [[0.315, 0.1], [0.41, 0.16], [0.57, 0.34], [0.69, 0.6], [0.745, 0.88], [0.78, 1.12], [0.835, 1.3], [0.875, 1.4]] },
};
const profile = name => geo('profile-' + name, () => {
  const p = PROFILES[name];
  const body = spline(p.body, 80);
  const radiusAt = y => {
    if (y <= body[0][1]) return body[0][0];
    for (let i = 1; i < body.length; i++) if (body[i][1] >= y) {
      const [r0, y0] = body[i - 1], [r1, y1] = body[i];
      return r0 + (r1 - r0) * ((y - y0) / ((y1 - y0) || 1));
    }
    return body[body.length - 1][0];
  };
  return { ...p, bodyPts: body, top: body[body.length - 1][0], radiusAt };
});
const outerR = (name, y) => profile(name).radiusAt(y);

// outer glaze (foot + body + rolled lip)
const cupGeometry = name => geo('cup-' + name, () => {
  const p = profile(name);
  const pts = [...p.foot.slice(0, -1), ...p.bodyPts];
  pts.push([p.top - 0.004, p.h + 0.011], [p.top - p.wall * 0.5, p.h + 0.015]);
  return new THREE.LatheGeometry(V2(pts), 160);
});
// inside of the cup (always white porcelain, even under coloured glazes)
const cupInnerGeometry = name => geo('cupin-' + name, () => {
  const p = profile(name);
  const pts = [[p.top - p.wall * 0.5, p.h + 0.015], [p.top - p.wall, p.h]];
  for (let i = p.bodyPts.length - 1; i >= 0; i--) { const [r, y] = p.bodyPts[i]; if (y > 0.2) pts.push([r - p.wall, y]); }
  pts.push([0.22, 0.19], [0, 0.185]);
  return new THREE.LatheGeometry(V2(pts), 160);
});
// decoration band sits just above the glaze between 48% and 80% of the height
const bandGeometry = name => geo('band-' + name, () => {
  const p = profile(name), pts = [], y0 = p.h * 0.48, y1 = p.h * 0.8;
  for (let i = 0; i <= 24; i++) { const y = y0 + (y1 - y0) * (i / 24); pts.push([p.radiusAt(y) + 0.0025, y]); }
  return new THREE.LatheGeometry(V2(pts), 160);
});
// Sculpted handle: an ear-shaped loop with a little thumb rest on top, an oval
// cross-section (flattened sideways), thin at the top and fuller where the fingers sit.
const taperTube = (curve, segs, radius, radial, widthAt, flatten = [1, 1, 1]) => {
  const g = new THREE.TubeGeometry(curve, segs, radius, radial, false);
  const pos = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs; curve.getPointAt(t, c);
    const k = widthAt(t);
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j; v.fromBufferAttribute(pos, idx).sub(c);
      v.set(v.x * k * flatten[0], v.y * k * flatten[1], v.z * k * flatten[2]).add(c);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return g;
};
const handleGeometry = name => geo('handle-' + name, () => {
  const p = profile(name), yT = p.h * 0.8, yB = p.h * 0.36, rT = p.radiusAt(yT), rB = p.radiusAt(yB);
  const curve = new THREE.CatmullRomCurve3([
    [rT - 0.035, yT], [rT + 0.1, yT + 0.055], [rT + 0.27, yT + 0.075], [rT + 0.39, yT - 0.02],
    [rT + 0.37, (yT + yB) / 2 - 0.04], [rB + 0.26, yB + 0.035], [rB - 0.035, yB],
  ].map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'centripetal');
  return taperTube(curve, 120, 0.05, 24, t => (0.78 + 0.32 * t) * (1 + 0.12 * Math.sin(Math.PI * t)), [1, 1, 0.6]);
});
// Saucer: a flat centre with a raised well ring for the foot, a gentle rise and a fine rolled rim.
const saucerGeometry = () => geo('saucer', () => {
  const top = spline([[0, 0.036], [0.4, 0.037], [0.47, 0.05], [0.52, 0.062], [0.58, 0.049], [0.76, 0.052], [1.0, 0.086], [1.22, 0.13], [1.36, 0.176], [1.43, 0.206]], 60);
  const bottom = spline([[1.41, 0.214], [1.3, 0.178], [1.1, 0.128], [0.86, 0.083], [0.64, 0.047], [0.53, 0.014], [0.5, 0.001]], 40);
  const pts = [...top, [1.446, 0.216], [1.44, 0.227], ...bottom, [0.45, 0.001], [0.43, 0.016], [0, 0.019]];
  return new THREE.LatheGeometry(V2(pts), 160);
});
const SAUCER_R = 1.445;
const torusGeo = (r, t) => geo(`torus-${r}-${t}`, () => new THREE.TorusGeometry(r, t, 16, 160));

const beanGeometry = () => geo('bean', () => {
  const g = new THREE.SphereGeometry(1, 72, 48), p = g.attributes.position, v = new THREE.Vector3();
  const cols = new Float32Array(p.count * 3), rnd = seeded(21);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    // flat face on +y (where the crease is), fuller dome on -y
    let y = v.y > 0 ? v.y * 0.6 : v.y * 0.95;
    const sCurve = v.x - 0.13 * Math.sin(v.z * 2.6);          // S-shaped centre line
    const w = Math.exp(-(sCurve * sCurve) / 0.006);           // narrow groove
    const face = Math.max(0, v.y);
    y -= w * face * 0.55 * (1 - Math.pow(Math.abs(v.z), 3) * 0.6);
    // slight asymmetry, like a real bean
    const x = v.x * 0.72 * (1 + 0.05 * v.z), z = v.z * (1 - 0.04 * Math.max(0, v.x));
    p.setXYZ(i, x, y * 0.72, z);
    // colour: deep roast, lighter on the ridges, near-black in the crease, fine mottling
    const ridge = Math.exp(-Math.pow((Math.abs(sCurve) - 0.16) / 0.07, 2)) * face;
    const mott = 0.92 + 0.16 * (Math.sin(v.x * 23 + v.z * 17) * Math.sin(v.z * 31 - v.y * 13)) + (rnd() - 0.5) * 0.05;
    const k = (1 - 0.85 * w * face) * mott * (1 + 0.25 * ridge);
    cols[i * 3] = k; cols[i * 3 + 1] = k * 0.97; cols[i * 3 + 2] = k * 0.94;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  const m = mergeVertices(g); m.computeVertexNormals(); return m;
});
const cinnamonGeometry = () => geo('cinnamon', () => {
  // a rolled bark quill: an open spiral sheet
  const shape = [], turns = 2.3;
  for (let i = 0; i <= 80; i++) { const t = i / 80, a = t * Math.PI * 2 * turns, r = 0.14 - t * 0.07; shape.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)); }
  const pts = shape.map(p => new THREE.Vector3(p.x, 0, p.y));
  const curve = new THREE.CatmullRomCurve3(pts);
  const g = new THREE.TubeGeometry(curve, 120, 0.012, 4, false);
  // extrude the spiral into a stick by stacking copies along Y
  const stick = new THREE.BufferGeometry();
  const ring = curve.getPoints(160), L = 1.4, rows = 2, pos = [], idx = [];
  ring.forEach(p => { for (let r = 0; r < rows; r++) pos.push(p.x, -L / 2 + L * r, p.z); });
  for (let i = 0; i < ring.length - 1; i++) { const a = i * 2, b = a + 2; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  stick.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); stick.setIndex(idx); stick.computeVertexNormals();
  g.dispose();
  return stick;
});
const iceGeometry = () => geo('ice', () => new RoundedBoxGeometry(0.42, 0.42, 0.42, 4, 0.07));

const kaapiGeometries = () => geo('kaapi', () => {
  const tumbler = [[0, 0.02], [0.44, 0.02], [0.47, 0.06]], N = 24, h = 1.55;
  for (let i = 0; i <= N; i++) { const t = i / N; tumbler.push([0.47 + 0.15 * t + 0.015 * Math.sin(t * Math.PI), 0.06 + (h - 0.06) * t]); }
  tumbler.push([0.645, h + 0.03], [0.6, h + 0.02]);
  for (let i = N; i >= 0; i--) { const t = i / N; tumbler.push([0.44 + 0.15 * t, 0.12 + (h - 0.12) * t]); }
  tumbler.push([0, 0.12]);
  const davara = [[0, 0], [0.62, 0], [0.66, 0.04]];
  for (let i = 0; i <= 16; i++) { const t = i / 16; davara.push([0.66 + 0.6 * Math.pow(t, 0.7), 0.04 + 0.62 * t]); }
  davara.push([1.25, 0.69]);
  for (let i = 16; i >= 0; i--) { const t = i / 16; davara.push([0.62 + 0.6 * Math.pow(t, 0.7), 0.08 + 0.6 * t]); }
  davara.push([0, 0.08]);
  return { tumbler: new THREE.LatheGeometry(V2(tumbler), 96), davara: new THREE.LatheGeometry(V2(davara), 96) };
});

// Tall tumbler glass for the iced latte
const GLASS = { h: 2.1, b: 0.6, t: 0.8, wall: 0.035, base: 0.16 };
const glassR = y => GLASS.b + (GLASS.t - GLASS.b) * (y / GLASS.h);
const glassGeometry = () => geo('glass', () => {
  const pts = [[0, 0], [GLASS.b - 0.02, 0], [GLASS.b, 0.02]];
  for (let i = 1; i <= 10; i++) { const y = GLASS.h * i / 10; pts.push([glassR(y), y]); }
  pts.push([GLASS.t - 0.012, GLASS.h + 0.015], [GLASS.t - GLASS.wall, GLASS.h]);
  for (let i = 10; i >= 0; i--) { const y = GLASS.base + (GLASS.h - GLASS.base) * i / 10; pts.push([glassR(y) - GLASS.wall, y]); }
  pts.push([0, GLASS.base]);
  return new THREE.LatheGeometry(V2(pts), 128);
});
const LIQ_TOP = 1.72;
const liquidGeometry = () => geo('liquid', () => {
  const pts = [[0, GLASS.base + 0.005]];
  for (let i = 0; i <= 10; i++) { const y = GLASS.base + 0.005 + (LIQ_TOP - GLASS.base) * i / 10; pts.push([glassR(y) - GLASS.wall - 0.006, y]); }
  pts.push([0, LIQ_TOP]);
  return new THREE.LatheGeometry(V2(pts), 96);
});

// Soft-serve whipped cream: a tapering spiral
const whipGeometry = () => geo('whip', () => {
  const turns = 3.3, pts = [];
  for (let i = 0; i <= 200; i++) { const t = i / 200, a = t * Math.PI * 2 * turns; const r = 0.55 * Math.pow(1 - t, 0.85) + 0.02; pts.push(new THREE.Vector3(Math.cos(a) * r, t * 0.62, Math.sin(a) * r)); }
  const curve = new THREE.CatmullRomCurve3(pts), TS = 260, RS = 18;
  const g = new THREE.TubeGeometry(curve, TS, 0.17, RS, false);
  const p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i <= TS; i++) {
    const t = i / TS; curve.getPointAt(t, c);
    const k = 1 - 0.62 * t;
    for (let j = 0; j <= RS; j++) {
      const idx = i * (RS + 1) + j; v.fromBufferAttribute(p, idx).sub(c);
      const ridge = 1 + 0.12 * Math.cos(j / RS * Math.PI * 2 * 6); // piping ridges
      v.multiplyScalar(k * ridge).add(c); p.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return g;
});

/* ================================================================== */
/* Models                                                              */
/* ================================================================== */
// Each cup: a glaze, a white porcelain interior, 24k gold handle and hairlines, latte art.
const STYLES = {
  cappuccino: { body: 'porcelain', shape: 'bowl', surface: 'tulip', spoon: true },
  espresso: { body: 'obsidian', shape: 'bowl', surface: 'crema', scale: 0.8 },
  saffron: { body: 'ivory', shape: 'tulip', surface: 'saffron', spoon: true },
  mocha: { body: 'oxblood', shape: 'bowl', surface: 'mocha', whip: true },
  sage: { body: 'celadon', shape: 'tulip', surface: 'rosetta' },
  kaapi: { kind: 'kaapi' },
  iced: { kind: 'iced' },
  // menu page extras
  latte: { body: 'porcelain', shape: 'tulip', surface: 'heart', spoon: true },
  midnight: { body: 'cobalt', shape: 'bowl', surface: 'crema', scale: 0.8 },
  focus: { body: 'porcelain', shape: 'tulip', surface: 'black' },
  pourover: { body: 'celadon', shape: 'bowl', surface: 'black' },
  caramel: { body: 'ivory', shape: 'bowl', surface: 'caramel', spoon: true },
  frappe: { kind: 'iced', liquid: 'frappe', top: 'mocha', whip: true, ice: 3 },
  matcha: { kind: 'iced', liquid: 'matcha', top: 'matcha' },
  coldbrew: { kind: 'iced', liquid: 'brew', top: 'brew', ice: 7 },
};

function torus(r, t, y, mat) { const m = new THREE.Mesh(torusGeo(r, t), mat); m.rotation.x = Math.PI / 2; m.position.y = y; return m; }

// Gold teaspoon: a shallow bowl, a slim neck and a handle that widens into a paddle end.
function buildSpoon() {
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(geo('spoon-bowl', () => new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2)), MAT.gold);
  bowl.scale.set(0.095, 0.03, 0.15); bowl.rotation.x = Math.PI;
  const handle = new THREE.Mesh(geo('spoon-handle', () => taperTube(
    new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.004, 0.13), new THREE.Vector3(0, 0.02, 0.42), new THREE.Vector3(0, 0.05, 0.74), new THREE.Vector3(0, 0.062, 0.86)]),
    60, 0.022, 16, t => 0.55 + Math.pow(t, 2.2) * 1.15, [1, 0.32, 1])), MAT.gold);
  g.add(bowl, handle); return g;
}

function buildCup(styleName, opts = {}) {
  const st = STYLES[styleName] || STYLES.cappuccino;
  const root = new THREE.Group();

  if (st.kind === 'kaapi') {
    const k = kaapiGeometries();
    const davara = new THREE.Mesh(k.davara, MAT.brass), tumbler = new THREE.Mesh(k.tumbler, MAT.brass);
    tumbler.position.y = 0.08;
    tumbler.add(torus(0.62, 0.012, 1.15, MAT.gold), torus(0.51, 0.012, 0.35, MAT.gold), torus(0.635, 0.02, 1.565, MAT.gold));
    const foam = new THREE.Mesh(geo('circle-kaapi', () => new THREE.CircleGeometry(0.58, 64)), phys({ map: surfaceTexture('kaapi'), roughness: 0.55, clearcoat: 0.3 }));
    foam.rotation.x = -Math.PI / 2; foam.position.y = 1.47; tumbler.add(foam);
    const pool = new THREE.Mesh(geo('circle-pool', () => new THREE.CircleGeometry(1.0, 64)), phys({ map: surfaceTexture('crema'), roughness: 0.12, clearcoat: 1 }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.3;
    davara.add(torus(1.235, 0.03, 0.69, MAT.gold));
    root.add(davara, pool, tumbler);
    root.userData = { surfaceY: 1.55, rimR: 0.6, height: 1.68, radius: 1.27, hot: true };
    return root;
  }

  if (st.kind === 'iced') {
    const liquid = new THREE.Mesh(liquidGeometry(), phys({ map: icedLiquidTexture(st.liquid), roughness: 0.22, clearcoat: 0.4, transparent: true, opacity: 0.96 }));
    liquid.renderOrder = 1;
    const top = new THREE.Mesh(geo('liq-top', () => new THREE.CircleGeometry(glassR(LIQ_TOP) - GLASS.wall - 0.006, 64)), phys({ map: surfaceTexture(st.top || 'milk'), roughness: st.top === 'brew' ? 0.08 : 0.4, clearcoat: st.top === 'brew' ? 1 : 0 }));
    top.rotation.x = -Math.PI / 2; top.position.y = LIQ_TOP;
    const glass = new THREE.Mesh(glassGeometry(), MAT.glass); glass.renderOrder = 3;
    root.add(liquid, top, glass);
    // ice cubes poking above the latte
    const rnd = seeded(11);
    const ICE = st.ice || 6;
    for (let i = 0; i < ICE; i++) {
      const ice = new THREE.Mesh(iceGeometry(), MAT.ice); ice.renderOrder = 2;
      const centre = i === ICE - 1 && !st.whip;
      const a = (i / ICE) * Math.PI * 2 + rnd() * 0.5, r = centre ? 0 : (st.whip ? 0.48 : 0.36);
      ice.position.set(Math.cos(a) * r, LIQ_TOP + 0.02 + rnd() * 0.14 + (centre ? 0.12 : 0), Math.sin(a) * r);
      ice.rotation.set(rnd() * 1.2, rnd() * 3, rnd() * 1.2);
      ice.scale.setScalar(0.8 + rnd() * 0.3);
      root.add(ice);
    }
    // condensation droplets on the outside of the glass
    const DEW = 140, dew = new THREE.InstancedMesh(geo('dew', () => new THREE.SphereGeometry(1, 10, 8)), MAT.dew, DEW);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
    for (let i = 0; i < DEW; i++) {
      const y = 0.15 + rnd() * (LIQ_TOP - 0.2), a = rnd() * Math.PI * 2, r = glassR(y) + 0.004, sz = 0.008 + Math.pow(rnd(), 3) * 0.03;
      p.set(Math.sin(a) * r, y, Math.cos(a) * r); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
      m4.compose(p, q, s.set(sz, sz * 1.3, sz * 0.45)); dew.setMatrixAt(i, m4);
    }
    dew.renderOrder = 4;
    root.add(dew);
    let height = 2.15;
    if (st.whip) {
      // whipped-cream crown with chocolate curls, piped above the rim
      const whip = new THREE.Mesh(whipGeometry(), MAT.whip); whip.position.y = LIQ_TOP - 0.02; whip.scale.setScalar(1.3); root.add(whip);
      for (let i = 0; i < 8; i++) {
        const sh = new THREE.Mesh(cinnamonGeometry(), MAT.chocCurl), a = rnd() * 7, r = 0.06 + rnd() * 0.38;
        sh.scale.setScalar(0.2 + rnd() * 0.08);
        sh.position.set(Math.cos(a) * r, LIQ_TOP + 0.3 + (0.48 - r) * 0.9, Math.sin(a) * r);
        sh.rotation.set(Math.PI / 2 + (rnd() - 0.5), rnd() * 6, (rnd() - 0.5) * 0.6);
        root.add(sh);
      }
      height += 0.75;
    }
    root.userData = { surfaceY: LIQ_TOP, rimR: 0.7, height, radius: 0.82, hot: false, whip: !!st.whip };
    return root;
  }

  const body = MAT[st.body], gold = MAT.gold, p = profile(st.shape);

  // saucer in the same glaze, with gold hairlines on the rim and around the well
  const saucer = new THREE.Group();
  saucer.add(new THREE.Mesh(saucerGeometry(), body), torus(1.441, 0.0075, 0.222, gold), torus(0.525, 0.005, 0.063, gold));
  root.add(saucer);

  const cup = new THREE.Group(); cup.position.y = 0.036; // sits in the saucer's well
  cup.add(new THREE.Mesh(cupGeometry(st.shape), body));
  cup.add(new THREE.Mesh(cupInnerGeometry(st.shape), MAT.porcelain));
  cup.add(new THREE.Mesh(handleGeometry(st.shape), gold));
  // gold: rolled rim, a fine line just under it, and a line on the foot
  cup.add(torus(p.top - 0.011, 0.0085, p.h + 0.012, gold));
  cup.add(torus(p.radiusAt(p.h - 0.075) + 0.0035, 0.0038, p.h - 0.075, gold));
  cup.add(torus(0.374, 0.0055, 0.03, gold));
  const band = new THREE.Mesh(bandGeometry(st.shape), goldText()); band.rotation.y = Math.PI; cup.add(band);
  const surfY = p.h * 0.86, surfR = p.radiusAt(surfY) - p.wall + 0.003;
  const surface = new THREE.Mesh(geo('surface-' + st.shape, () => new THREE.CircleGeometry(surfR, 128)),
    phys({ map: surfaceTexture(st.surface), roughness: 0.38, clearcoat: 0.55, clearcoatRoughness: 0.25, sheen: 0.5, sheenColor: new THREE.Color(0xfff0dc), sheenRoughness: 0.6 }));
  surface.rotation.x = -Math.PI / 2; surface.rotation.z = -Math.PI / 2; surface.position.y = surfY;
  cup.add(surface);
  let height = p.h + 0.08;
  if (st.whip) {
    const whip = new THREE.Mesh(whipGeometry(), MAT.whip); whip.position.y = surfY - 0.02; whip.scale.setScalar(1.22); cup.add(whip);
    // fine chocolate curls resting on the cream
    const rnd = seeded(5);
    for (let i = 0; i < 9; i++) {
      const sh = new THREE.Mesh(cinnamonGeometry(), MAT.chocCurl), a = rnd() * 7, r = 0.08 + rnd() * 0.36;
      sh.scale.setScalar(0.2 + rnd() * 0.08);
      sh.position.set(Math.cos(a) * r, surfY + 0.32 + (0.45 - r) * 0.85, Math.sin(a) * r);
      sh.rotation.set(Math.PI / 2 + (rnd() - 0.5), rnd() * 6, (rnd() - 0.5) * 0.6);
      cup.add(sh);
    }
    height += 0.72;
  }
  root.add(cup);
  if (st.spoon && opts.spoon !== false) { const sp = buildSpoon(); sp.position.set(0.95, 0.09, 0.25); sp.rotation.y = -0.25; root.add(sp); } // rests along the saucer ring
  const sc = st.scale || 1;
  root.scale.setScalar(sc);
  root.userData = { surfaceY: (0.036 + surfY) * sc, rimR: surfR * sc, height: height * sc, radius: SAUCER_R * sc, hot: true, whip: !!st.whip, surface };
  return root;
}

/* ================================================================== */
/* Steam shader                                                        */
/* ================================================================== */
// Fine wisps of steam: each plane draws one thin, soft curl that widens and breaks up as it
// rises, then is gone well before it reaches the headline. The hash is a fract-only one —
// the old sin() hash lost precision on some GPUs and showed blocky squares.
const steamVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const steamFrag = `uniform float uTime; uniform float uSeed; uniform float uOpacity; varying vec2 vUv;
  // integer-exact permutation hash: identical on both sides of every cell edge, on any GPU
  float perm(float x){ return mod((x * 34.0 + 1.0) * x, 289.0); }
  float h(vec2 p){ p = mod(p, 289.0); return perm(perm(p.x) + p.y) / 289.0; }
  // gradient noise with a quintic fade: no grid lines or creases (value noise showed squares)
  vec2 gr(vec2 p){ float a = h(p) * 6.2831; return vec2(cos(a), sin(a)); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p), u=f*f*f*(f*(f*6.0-15.0)+10.0);
    float a=dot(gr(i),f), b=dot(gr(i+vec2(1,0)),f-vec2(1,0)), c=dot(gr(i+vec2(0,1)),f-vec2(0,1)), d=dot(gr(i+vec2(1,1)),f-vec2(1,1));
    return 0.5 + 0.75 * mix(mix(a,b,u.x), mix(c,d,u.x), u.y); }
  // three octaves, each rotated so no axis-aligned pattern can build up
  float fbm(vec2 p){ float v=0.0, a=0.55; mat2 r=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<3;i++){ v+=a*n(p); p=r*p+vec2(1.7,9.2); a*=0.5; } return v / 0.9625; }
  void main(){ vec2 uv=vUv; float y=uv.y, s=uSeed*6.2831;
    // the curl's centre line drifts and sways more the higher it gets
    float cx = 0.5 + (sin(y*4.2 - uTime*0.75 + s)*0.11 + sin(y*9.0 - uTime*1.3 + s*1.7)*0.035) * y
                   + (fbm(vec2(uSeed*7.0, y*1.6 - uTime*0.22)) - 0.5) * 0.22 * y;
    float w = mix(0.018, 0.12, y);
    float d = (uv.x - cx) / w, core = exp(-d*d);
    float breakup = smoothstep(0.32, 0.78, fbm(vec2(uv.x*3.2 + uSeed*3.0, y*3.4 - uTime*0.45)));
    // born faint just above the coffee, strongest low down, gone before the top of the plane
    float fade = smoothstep(0.02, 0.3, y) * (1.0 - smoothstep(0.28, 0.88, y));
    gl_FragColor = vec4(vec3(1.0, 0.965, 0.92), core * (0.3 + 0.7 * breakup) * fade * 0.7 * uOpacity); }`;
function buildSteam(count = 3, height = 1.1) {
  const g = new THREE.Group(), mats = [];
  for (let i = 0; i < count; i++) {
    const m = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uSeed: { value: i * 0.37 + Math.random() }, uOpacity: { value: 0 } }, vertexShader: steamVert, fragmentShader: steamFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo('steam-' + height, () => { const p = new THREE.PlaneGeometry(0.9, height, 1, 48); p.translate(0, height / 2, 0); return p; }), m);
    mesh.position.set((i - (count - 1) / 2) * 0.2, 0, (i % 2) * 0.08); mesh.renderOrder = 5;
    g.add(mesh); mats.push(m);
  }
  g.userData.mats = mats; return g;
}

/* ================================================================== */
/* Renderer + views                                                    */
/* ================================================================== */
const canvas = document.getElementById('gl');
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { document.body.classList.add('no-webgl'); signalReady(); }

// Quality tier: 'low' for integrated/weak GPUs (Intel UHD/Iris, software rendering, mobile),
// few CPU cores or little memory. Laptops with a GTX often run Chrome on the Intel chip,
// so this is decided from the GPU Chrome actually uses.
let TIER = 'high', TEX_SCALE = 2;
if (renderer) {
  const gl = renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  const weakGpu = /intel|uhd|hd graphics|iris|swiftshader|basic render|llvmpipe|mali|adreno|powervr|apple gpu/i.test(gpu);
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 8;
  if (weakGpu || cores <= 4 || mem <= 4 || isSmall()) TIER = 'low';
  TEX_SCALE = TIER === 'low' ? 1 : 2;
  window.__darbarTier = TIER;
  start();
}

function start() {
  // low tier renders at the screen's own resolution; high tier may sharpen up to 1.5x
  renderer.setPixelRatio(Math.min(devicePixelRatio, TIER === 'low' ? 1 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;

  const pmrem = new THREE.PMREMGenerator(renderer);
  let env = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const scenes = [];
  // The intro must stay smooth: anything heavy (studio lighting download + processing,
  // thumbnail renders, drawing the 3D scene) waits until the intro has handed over.
  const hasIntro = !!document.getElementById('loader');
  let introOver = !hasIntro;
  const afterIntro = fn => { if (introOver) setTimeout(fn, 0); else addEventListener('darbar:intro', () => setTimeout(fn, 700), { once: true }); };
  // swap in a real studio HDR for photographic reflections once the intro is over
  afterIntro(() => new RGBELoader().load(HDR_URL, hdr => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    env = pmrem.fromEquirectangular(hdr).texture; hdr.dispose();
    scenes.forEach(s => { s.environment = env; });
    dispatchEvent(new Event('darbar:envready'));
  }, undefined, () => {}));

  const views = [];
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

  function baseScene({ key = 2.2, rim = 3, warm = 0xffe0b5 } = {}) {
    const scene = new THREE.Scene(); scene.environment = env; scenes.push(scene);
    const k = new THREE.DirectionalLight(warm, key); k.position.set(-4, 6, 5);
    const r = new THREE.DirectionalLight(0xffa860, rim); r.position.set(5, 3, -5);
    const f = new THREE.DirectionalLight(0xffffff, 0.5); f.position.set(0, 2, 8);
    scene.add(k, r, f, new THREE.AmbientLight(0xfff1e0, 0.2));
    return scene;
  }
  const fitDistance = (ud, aspect, fov, pad = 1.25) => {
    const needH = Math.max(ud.height * pad, (ud.radius * 2.75) / aspect);
    return needH / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
  };

  /* -------------------- HERO CAROUSEL -------------------- */
  const HERO_DRINKS = [
    { style: 'cappuccino' }, { style: 'iced' }, { style: 'saffron' }, { style: 'mocha' }, { style: 'kaapi' },
  ];

  function heroView(el) {
    const scene = baseScene({ key: 2.4, rim: 4.5 });
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
    const stage = new THREE.Group(); scene.add(stage);
    const hero = document.getElementById('hero');
    const rnd = seeded(99);

    const glow = new THREE.Mesh(geo('plane', () => new THREE.PlaneGeometry(1, 1)), new THREE.MeshBasicMaterial({ map: blobTexture('rgba(255,190,120,0.5)', 'rgba(255,170,90,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.rotation.x = -Math.PI / 2; glow.scale.setScalar(5); stage.add(glow);

    const drinks = HERO_DRINKS.map((d, i) => {
      const anchor = new THREE.Group(), spinner = new THREE.Group();
      const model = buildCup(d.style); spinner.add(model); anchor.add(spinner); stage.add(anchor);
      const steam = buildSteam(3, 1.1); anchor.add(steam);
      return { anchor, spinner, model, steam, p: 0, from: 0, to: 0, t0: 0, dur: 1, spin: 0 };
    });

    // Still life: a few roasted beans resting on the table beside the saucer, each with a
    // soft contact shadow. They drop in one by one after the intro, then stay put — the only
    // motion is the light moving over them as the stage sways with the cursor.
    const BEANS = [
      // side (-1 left / 1 right), distance past the saucer rim, depth, yaw, face up?, size
      [-1, 0.32, 0.1, 0.4, true, 1], [-1, 0.72, -0.35, 2.1, false, 0.94], [-1, 0.52, 0.45, 4.2, true, 0.9], [-1, 1.05, 0.2, 1.2, true, 1.04],
      [1, 0.36, 0.3, 5.1, false, 1], [1, 0.8, -0.25, 0.9, true, 0.96], [1, 0.62, 0.5, 3.3, true, 0.9],
    ].map(([side, gap, z, yaw, up, size], i) => {
      const holder = new THREE.Group(); stage.add(holder);
      const bean = new THREE.Mesh(beanGeometry(), i % 3 === 1 ? MAT.beanDark : MAT.bean);
      const tilt = up ? 0.3 : 0.12; holder.rotation.x = tilt; // tipped toward the viewer so the crease shows
      bean.rotation.set(up ? 0 : Math.PI, yaw, (i % 2 ? 1 : -1) * 0.15); holder.add(bean);
      const sh = new THREE.Mesh(geo('plane', () => new THREE.PlaneGeometry(1, 1)), new THREE.MeshBasicMaterial({ map: blobTexture('rgba(8,4,2,0.8)', 'rgba(8,4,2,0)'), transparent: true, depthWrite: false }));
      sh.rotation.set(-Math.PI / 2 - tilt, 0, -yaw); sh.scale.set(1.25, 1.75, 1); holder.add(sh);
      return { holder, bean, sh, side, gap, z, yaw, up, size, rest: up ? 0.64 : 0.4 };
    });
    let footR = 0;

    // Presence (0 = gone, 1 = on stage) is driven by wall-clock time, so the
    // 3D swap stays in sync with the text even if the frame rate drops.
    const nowS = () => performance.now() / 1000;
    const presence = d => lerp(d.from, d.to, clamp((nowS() - d.t0) / d.dur, 0, 1));
    const setTarget = (d, to, delay) => { d.from = presence(d); d.to = to; d.t0 = nowS() + delay; d.dur = to ? 1.25 : 0.75; };

    let current = 0;
    const intro = { started: false, t0: 0, t: 0 };
    const startIntro = () => { if (intro.started) return; intro.started = true; intro.t0 = nowS() - (reduceMotion ? 5 : 0); setTarget(drinks[0], 1, reduceMotion ? -2 : 0); };
    addEventListener('darbar:intro', startIntro);
    addEventListener('darbar:herodrink', e => {
      const next = e.detail;
      if (next === current || !drinks[next]) return;
      setTarget(drinks[current], 0, 0);
      const n = drinks[next]; n.from = 0; n.to = 0; n.spin = -1.6; setTarget(n, 1, 0.32);
      current = next;
    });

    // drag to spin
    let dragging = false, lastX = 0, spinVel = 0;
    hero.addEventListener('pointerdown', e => { if (e.target.closest('a,button')) return; dragging = true; lastX = e.clientX; });
    addEventListener('pointerup', () => { dragging = false; });
    addEventListener('pointermove', e => { if (!dragging) return; spinVel += (e.clientX - lastX) * 0.004; lastX = e.clientX; });

    // golden dust
    const DUST = (isSmall() || TIER === 'low') ? 90 : 200, dGeo = new THREE.BufferGeometry(), dPos = new Float32Array(DUST * 3), dSeed = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) { dPos[i * 3] = (rnd() - 0.5) * 16; dPos[i * 3 + 1] = (rnd() - 0.5) * 9; dPos[i * 3 + 2] = (rnd() - 0.5) * 8; dSeed[i] = rnd(); }
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ size: 0.05, map: dotSprite(), color: 0xffd38a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(dust);

    const q = new THREE.Quaternion(), v = new THREE.Vector3();
    return {
      el, scene, camera,
      update(dt, t, rect) {
        const aspect = rect.width / rect.height, small = aspect < 0.9;
        const hr = hero.getBoundingClientRect();
        const prog = clamp(-hr.top / hr.height, 0, 1);
        intro.t = intro.started ? nowS() - intro.t0 : 0;

        const dist = 13;
        camera.position.set(0, 1.4, dist); camera.lookAt(0, 0.3, 0);
        const visH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(12));
        const visW = visH * aspect;

        pointer.sx = damp(pointer.sx, pointer.x, 2.5, dt); pointer.sy = damp(pointer.sy, pointer.y, 2.5, dt);
        stage.rotation.y = pointer.sx * 0.12; stage.rotation.x = pointer.sy * 0.05;
        spinVel *= Math.exp(-3 * dt);

        // cup sits low & centre, cut slightly by the bottom edge like a product stage
        const groundY = -visH * (small ? 0.2 : 0.4);
        glow.position.y = groundY + 0.02;
        dust.material.opacity = 0.6 * clamp(intro.t / 1.5, 0, 1);

        drinks.forEach((d, i) => {
          d.p = presence(d);
          const entering = d.to === 1;
          const pIn = entering ? easeOutBack(d.p) : 1 - easeInCubic(1 - d.p);
          const show = d.p > 0.001;
          d.anchor.visible = show;

          const ud = d.model.userData;
          const s = Math.min((visH * (small ? 0.34 : 0.5)) / ud.height, (visW * (small ? 0.7 : 0.34)) / (ud.radius * 2));
          d.anchor.scale.setScalar(s * lerp(0.82, 1, pIn) * (1 - prog * 0.12));
          d.anchor.position.y = groundY + lerp(-visH * 0.9, 0, pIn) + prog * 1.6; // sits still on the table, like the beans
          d.spin += dt * ((reduceMotion ? 0 : 0.18) + (i === current ? spinVel * 6 : 0));
          d.spinner.rotation.y = d.spin + (1 - pIn) * (entering ? -1.4 : 1.4) + prog * 1.4;
          d.spinner.rotation.x = 0.06;
          // the latte art slowly swirls, like a freshly poured cup settling
          if (d.model.userData.surface) d.model.userData.surface.rotation.z -= dt * 0.07;

          d.steam.visible = ud.hot && !ud.whip; // cream-topped cups don't steam
          d.steam.position.y = ud.surfaceY + 0.02;
          d.steam.quaternion.copy(camera.quaternion).premultiply(q.copy(stage.quaternion).invert());
          d.steam.userData.mats.forEach(m => { m.uniforms.uTime.value = t; m.uniforms.uOpacity.value = clamp(d.p * 1.4 - 0.4, 0, 1) * 0.5 * (1 - prog); });

        });

        // beans sit just beyond the current drink's saucer and glide aside if a wider one arrives
        const cur = drinks[current], cs = cur.anchor.scale.x || 1;
        footR = damp(footR || cur.model.userData.radius * cs, cur.model.userData.radius * cs, 3, dt);
        const unit = Math.min(visH, visW) * 0.03; // bean size relative to the view
        BEANS.forEach((b, i) => {
          const k = reduceMotion ? 1 : clamp((intro.t - 0.9 - i * 0.14) / 0.7, 0, 1);
          const fall = 1 - easeOutBounce(k);
          const sc = unit * b.size * (small ? 0.8 : 1);
          let x = b.side * (footR + b.gap * unit * 6);
          x = clamp(x, -visW * 0.5 + unit * 3, visW * 0.5 - unit * 3);
          b.holder.position.set(x, groundY + 0.005 + prog * 1.6, b.z); // rides up with the cup on scroll
          b.holder.visible = k > 0;
          b.bean.scale.setScalar(sc);
          b.bean.position.y = b.rest * sc + fall * unit * 9;
          b.sh.scale.set(1.25 * sc, 1.75 * sc, 1);
          b.sh.material.opacity = k * (1 - fall * 0.8) * (1 - prog);
        });

        const p = dGeo.attributes.position.array;
        for (let i = 0; i < DUST; i++) { p[i * 3 + 1] += dt * (0.08 + dSeed[i] * 0.15); if (p[i * 3 + 1] > 4.5) p[i * 3 + 1] = -4.5; }
        dGeo.attributes.position.needsUpdate = true;
      },
    };
  }

  /* -------------------- PRODUCT CARD / THUMB CUP -------------------- */
  function cupView(el) {
    const scene = baseScene({ key: 2.2, rim: 2.6 });
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 60);
    const holder = new THREE.Group(); scene.add(holder);
    let style = el.dataset.style || 'cappuccino', model = buildCup(style); holder.add(model);
    const onDark = !!el.closest('.hero, .ai');
    const shadow = new THREE.Mesh(geo('plane', () => new THREE.PlaneGeometry(1, 1)), new THREE.MeshBasicMaterial({
      map: onDark ? blobTexture('rgba(255,190,120,0.35)', 'rgba(255,170,90,0)') : blobTexture('rgba(40,20,8,0.45)', 'rgba(40,20,8,0)'),
      transparent: true, depthWrite: false, blending: onDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.01; scene.add(shadow);

    const card = el.closest('.drink, .dx-card, .rec-card, .thumb') || el;
    let hover = 0, hoverTarget = 0, spin = Math.random() * 6, swap = null;
    card.addEventListener('pointerenter', () => { hoverTarget = 1; });
    card.addEventListener('pointerleave', () => { hoverTarget = 0; });
    el.__setStyle = s => { if (s !== style) { swap = { t: 0, style: s, done: false }; style = s; } };

    return {
      el, scene, camera,
      update(dt, t, rect) {
        hover = damp(hover, hoverTarget, 6, dt);
        spin += dt * (reduceMotion ? 0 : 0.35 + hover * 1.8);
        let swapSpin = 0;
        if (swap) {
          if (swap.start == null) swap.start = t;
          swap.t = (t - swap.start) / 0.8; swapSpin = easeInOut(clamp(swap.t, 0, 1)) * Math.PI * 2;
          if (!swap.done && swap.t > 0.45) { holder.remove(model); model = buildCup(swap.style); holder.add(model); swap.done = true; }
          if (swap.t >= 1) { swap = null; swapSpin = 0; }
        }
        holder.rotation.y = spin + swapSpin;
        holder.rotation.x = 0.05 + hover * 0.08;
        if (model.userData.surface) model.userData.surface.rotation.z -= dt * 0.07; // slow latte swirl
        holder.position.y = hover * 0.25 + Math.sin(t * 1.3 + rect.left * 0.01) * 0.03;
        // pop in together with the card's scroll reveal (darbar-motion.js fades the card in)
        const shown = card.style.opacity === '' ? 1 : clamp(parseFloat(card.style.opacity) || 0, 0, 1);
        holder.scale.setScalar(shown < 0.01 ? 0.0001 : 0.72 + 0.28 * easeOutBack(shown));
        const ud = model.userData;
        const showK = clamp(shown * 1.25, 0, 1); // shadow grows in with the card, never before it
        shadow.scale.setScalar(Math.max(0.0001, ud.radius * 2.2 * (1 - hover * 0.12) * showK));
        shadow.material.opacity = (1 - hover * 0.4) * showK;
        const aspect = rect.width / rect.height;
        const d = fitDistance(ud, aspect, 24, 1.55);
        camera.position.set(0, d * 0.32, d); camera.lookAt(0, ud.height * 0.36, 0);
      },
    };
  }

  /* -------------------- SPLASH (bean drop) -------------------- */
  function splashView(el) {
    const scene = baseScene({ key: 2.4, rim: 3 });
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);
    const holder = new THREE.Group(); scene.add(holder);
    const model = buildCup('cappuccino', { spoon: false }); holder.add(model);
    const surfY = model.userData.surfaceY, rimR = model.userData.rimR;
    const shadow = new THREE.Mesh(geo('plane', () => new THREE.PlaneGeometry(1, 1)), new THREE.MeshBasicMaterial({ map: blobTexture('rgba(40,20,8,0.5)', 'rgba(40,20,8,0)'), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.scale.setScalar(4.6); scene.add(shadow);
    const bean = new THREE.Mesh(beanGeometry(), MAT.bean); bean.scale.setScalar(0.26); scene.add(bean);

    const D = 70, drops = new THREE.InstancedMesh(geo('drop', () => new THREE.SphereGeometry(1, 16, 12)), MAT.drop, D);
    drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const dd = Array.from({ length: D }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), s: 0, life: 0 }));
    scene.add(drops);
    const ring = new THREE.Mesh(geo('ring', () => new THREE.RingGeometry(0.9, 1, 64)), new THREE.MeshBasicMaterial({ color: 0xf6e7cf, transparent: true, opacity: 0, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = surfY + 0.012; scene.add(ring);
    const floaters = Array.from({ length: 6 }, (_, i) => { const m = new THREE.Mesh(beanGeometry(), MAT.bean); m.scale.setScalar(0.2); scene.add(m); return { m, x: (i % 2 ? 1 : -1) * (1.9 + (i % 3) * 0.6), y: 0.4 + i * 0.45, z: -1 + (i % 3), r: i * 1.3 }; });

    let cycle = 0, impacted = false, ringT = 1, bounce = 0;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1), dir = new THREE.Vector3();
    return {
      el, scene, camera,
      update(dt, t, rect) {
        dt = Math.min(dt, 1 / 30);
        const aspect = rect.width / rect.height, z = 9 * clamp(1.1 / aspect, 0.9, 1.7);
        camera.position.set(0, 3.9 * z / 9, z); camera.lookAt(0, 1.0, 0);
        holder.rotation.y = clamp(1 - rect.top / innerHeight, 0, 2) * 1.2 + t * 0.1;
        cycle += dt;
        if (cycle > 3.4) { cycle = 0; impacted = false; }
        if (cycle < 0.85) {
          const k = cycle / 0.85; bean.visible = true;
          bean.position.set(0.05, lerp(4.2, surfY, k * k), 0); bean.rotation.set(t * 3, t * 2, 0.4);
        } else {
          if (!impacted) {
            impacted = true; ringT = 0; bounce = 1;
            dd.forEach((d, i) => {
              const a = (i / D) * Math.PI * 2 + Math.random() * 0.2, sp = 0.6 + Math.random() * 1.1;
              d.p.set(Math.cos(a) * 0.18, surfY + 0.02, Math.sin(a) * 0.18);
              d.v.set(Math.cos(a) * sp, 2.6 + Math.random() * 2.2, Math.sin(a) * sp);
              d.s = 0.03 + Math.random() * 0.045; d.life = 1;
            });
          }
          bean.position.y -= dt * 0.6; bean.visible = bean.position.y > surfY - 0.2;
        }
        bounce = damp(bounce, 0, 5, dt);
        holder.position.y = -Math.sin(bounce * Math.PI) * 0.05;
        ringT = Math.min(1, ringT + dt / 1.1);
        ring.scale.setScalar(lerp(0.08, rimR * 0.95, easeOutExpo(ringT)));
        ring.material.opacity = (1 - ringT) * 0.85;
        dd.forEach((d, i) => {
          if (d.life > 0) {
            d.v.y -= 9.8 * dt; d.p.addScaledVector(d.v, dt);
            if ((d.v.y < 0 && d.p.y < surfY && Math.hypot(d.p.x, d.p.z) < rimR) || d.p.y < -0.2) d.life = 0;
          }
          const s = d.life > 0 ? d.s : 0;
          dir.copy(d.v).normalize(); q.setFromUnitVectors(Z, dir.lengthSq() ? dir : Z);
          m4.compose(d.p, q, sc.set(s, s, s * (1 + Math.min(d.v.length() * 0.35, 2))));
          drops.setMatrixAt(i, m4);
        });
        drops.instanceMatrix.needsUpdate = true;
        floaters.forEach(f => { f.m.position.set(f.x, f.y + Math.sin(t + f.r) * 0.15, f.z); f.m.rotation.set(t * 0.4 + f.r, t * 0.3 + f.r, 0); });
      },
    };
  }

  /* -------------------- build views + loop -------------------- */
  const thumbViews = [];
  const makeView = el => {
    el.__darbarView = true;
    const type = el.dataset.view;
    if (type === 'thumb') { thumbViews.push(cupView(el)); return null; }   // rendered once into a still image
    const v = type === 'hero' ? heroView(el) : type === 'splash' ? splashView(el) : cupView(el);
    views.push(v); return v;
  };
  document.querySelectorAll('[data-view]').forEach(makeView);
  // Pages that build their cards later (the menu re-renders on every filter) get their
  // views added and removed here, so the 3D always matches the DOM.
  function syncViews() {
    for (let i = views.length - 1; i >= 0; i--) {
      if (!views[i].el.isConnected) { const sc = views.splice(i, 1)[0].scene, k = scenes.indexOf(sc); if (k >= 0) scenes.splice(k, 1); }
    }
    const fresh = [];
    document.querySelectorAll('[data-view]').forEach(el => { if (!el.__darbarView) { const v = makeView(el); if (v) fresh.push(v); } });
    fresh.forEach(v => { try { renderer.compileAsync ? renderer.compileAsync(v.scene, v.camera).catch(() => {}) : 0; } catch (e) {} });
  }
  let syncQueued = false;
  new MutationObserver(() => { if (syncQueued) return; syncQueued = true; requestAnimationFrame(() => { syncQueued = false; syncViews(); }); })
    .observe(document.body, { childList: true, subtree: true });
  addEventListener('darbar:cupstyle', e => { const { el, style } = e.detail || {}; el && el.__setStyle && el.__setStyle(style); });

  // Thumbnails: render each cup once and keep it as a PNG — costs nothing per frame.
  function snapshotThumbs() {
    const pr = renderer.getPixelRatio();
    if (canvas.width !== canvas.clientWidth * pr) renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    if (!canvas.clientWidth || !canvas.clientHeight) { setTimeout(snapshotThumbs, 600); return; } // not laid out yet
    thumbViews.forEach(v => {
      const r = v.el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
      v.update(0, 1.2, { width: w, height: h, left: 0, top: 0 });
      renderer.setScissorTest(true); renderer.setViewport(0, 0, w, h); renderer.setScissor(0, 0, w, h); renderer.clear();
      v.camera.aspect = w / h; v.camera.updateProjectionMatrix();
      renderer.render(v.scene, v.camera);
      const c = document.createElement('canvas'); c.width = Math.round(w * pr); c.height = Math.round(h * pr);
      c.getContext('2d').drawImage(canvas, 0, canvas.height - c.height, c.width, c.height, 0, 0, c.width, c.height);
      v.el.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
      renderer.clear();
    });
  }
  let envLoaded = false;
  addEventListener('darbar:envready', () => { envLoaded = true; snapshotThumbs(); });
  // if the studio lighting is slow (or blocked), take the thumbnails with the built-in light
  afterIntro(() => setTimeout(() => { if (!envLoaded) snapshotThumbs(); }, 2500));

  // Adaptive quality: lower the resolution if the device can't keep up.
  let dpr = renderer.getPixelRatio(), fpsFrames = 0, fpsTime = 0;
  function adapt(dt) {
    fpsFrames++; fpsTime += dt;
    if (fpsTime < 2) return;
    const fps = fpsFrames / fpsTime; fpsFrames = 0; fpsTime = 0;
    // never render below the screen's own sharpness — dropping under 1 made cups look jagged
    const floor = Math.min(1, devicePixelRatio || 1);
    if (fps < 32 && dpr > floor) { dpr = Math.max(floor, dpr - 0.25); renderer.setPixelRatio(dpr); W = 0; }
  }

  let last = performance.now(), first = true, W = 0, H = 0;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    if (!first && !document.hidden && introOver) adapt(dt);
    const t = now / 1000, cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (cw !== W || ch !== H) { W = cw; H = ch; renderer.setSize(W, H, false); }
    renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
    for (const v of views) {
      const r = v.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > H || r.right < 0 || r.left > W || r.width < 2 || r.height < 2) continue;
      v.update(dt, t, r);
      const left = Math.floor(r.left), bottom = Math.floor(H - r.bottom), w = Math.ceil(r.width), h = Math.ceil(r.height);
      renderer.setViewport(left, bottom, w, h); renderer.setScissor(left, bottom, w, h);
      v.camera.aspect = w / h; v.camera.updateProjectionMatrix();
      renderer.render(v.scene, v.camera);
    }
    if (first) { first = false; signalReady(); }
    requestAnimationFrame(frame);
  }

  // draw the gold wordmark only once the Anton font is ready
  const fontReady = document.fonts ? Promise.race([Promise.all(['64px Anton', 'italic 500 190px "Cormorant Garamond"', '700 38px Manrope'].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 2000))]) : Promise.resolve();
  // Prepare every shader up front, one scene at a time, yielding between them so the
  // intro animation never stutters. Then tell the page we're ready — without drawing.
  const yieldFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
  async function warmUp() {
    for (const v of [...views, ...thumbViews]) {
      try { if (renderer.compileAsync) await renderer.compileAsync(v.scene, v.camera); else renderer.compile(v.scene, v.camera); } catch (e) { /* compile on first draw instead */ }
      await yieldFrame();
    }
  }
  // Drawing starts as the coffee iris covers the screen (or straight away without an intro).
  let loopStarted = false;
  const startLoop = () => { if (loopStarted) return; loopStarted = true; introOver = true; last = performance.now(); requestAnimationFrame(frame); };
  addEventListener('darbar:introexit', startLoop, { once: true });
  addEventListener('darbar:intro', startLoop, { once: true });

  fontReady.then(async () => {
    const t = texCache.band;
    if (t) { delete texCache.band; const fresh = logoBandTexture(); t.image = fresh.image; t.needsUpdate = true; texCache.band = t; }
    await warmUp();
    signalReady();
    if (!hasIntro) { startLoop(); snapshotThumbs(); }
  });
}

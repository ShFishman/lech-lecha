/* paint.js — procedural painterly primitives (no image files) */
'use strict';
(function () {
  const P = {};
  const caches = new Map();

  P.cache = function (key, w, h, fn) {
    const k = key + '|' + Math.round(w) + 'x' + Math.round(h);
    let c = caches.get(k);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    const cx = c.getContext('2d');
    fn(cx, c.width, c.height);
    caches.set(k, c);
    return c;
  };
  P.clearCache = function (prefix) {
    for (const k of Array.from(caches.keys())) if (!prefix || k.startsWith(prefix)) caches.delete(k);
  };

  // --- grain / noise tile ---
  P.noiseTile = function () {
    return P.cache('noise', 256, 256, (cx, w, h) => {
      const img = cx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 110 + Math.random() * 60;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
      cx.putImageData(img, 0, 0);
    });
  };
  // soft blotchy texture (value noise) for "paper"/paint
  P.blotch = function (seed, size) {
    return P.cache('blotch' + seed, size, size, (cx, w, h) => {
      const n = U.noise2(seed);
      const img = cx.createImageData(w, h); const d = img.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const v = n(x / 24, y / 24) * 0.6 + n(x / 7, y / 7) * 0.3 + Math.random() * 0.1;
        const i = (y * w + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = 90 + v * 100; d[i + 3] = 255;
      }
      cx.putImageData(img, 0, 0);
    });
  };
  P.texture = function (ctx, W, H, alpha, mode, which) {
    const tile = which === 'blotch' ? P.blotch(7, 256) : P.noiseTile();
    ctx.save();
    ctx.globalAlpha = alpha; ctx.globalCompositeOperation = mode || 'overlay';
    const pat = ctx.createPattern(tile, 'repeat');
    ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };

  // --- sky & light ---
  P.sky = function (ctx, W, H, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    stops.forEach(s => g.addColorStop(s[0], s[1]));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  P.glow = function (ctx, x, y, r, color, alpha, inner) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace(/[\d.]+\)$/, (alpha) + ')'));
    g.addColorStop(inner || 0.35, color.replace(/[\d.]+\)$/, (alpha * 0.45) + ')'));
    g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  // light from above (the Voice) — no figure, only light
  P.lightAbove = function (ctx, W, H, k, warm) {
    if (k <= 0) return;
    ctx.save();
    const cx = W / 2, cy = -H * 0.15, r = Math.max(W, H) * 0.95;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const col = warm ? '255,240,200' : '240,245,255';
    g.addColorStop(0, `rgba(${col},${0.55 * k})`);
    g.addColorStop(0.45, `rgba(${col},${0.18 * k})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // faint rays
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + (i - 3) * 0.16;
      const len = H * 1.3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a - 0.03) * len, cy + Math.sin(a - 0.03) * len);
      ctx.lineTo(cx + Math.cos(a + 0.03) * len, cy + Math.sin(a + 0.03) * len);
      ctx.closePath();
      ctx.fillStyle = `rgba(${col},${0.05 * k * (i % 2 ? 0.6 : 1)})`;
      ctx.fill();
    }
    ctx.restore();
  };

  P.clouds = function (key, W, H, o) {
    return P.cache('clouds' + key, W, H, (cx, w, h) => {
      const r = U.rng(o.seed || 1);
      const banks = o.banks || 4;
      for (let b = 0; b < banks; b++) {
        const bx = r() * w, by = h * (o.yMin || 0.08) + r() * h * ((o.yMax || 0.45) - (o.yMin || 0.08));
        const spread = w * (0.12 + r() * 0.22) * (o.scale || 1);
        const n = 10 + Math.floor(r() * 14);
        for (let i = 0; i < n; i++) {
          const px = bx + (r() - 0.5) * spread * 2, py = by + (r() - 0.5) * spread * 0.35;
          const rad = spread * (0.18 + r() * 0.3);
          const g = cx.createRadialGradient(px, py, 0, px, py, rad);
          const a = (o.alpha || 0.5) * (0.5 + r() * 0.5);
          g.addColorStop(0, U.col(o.color, a));
          g.addColorStop(0.6, U.col(o.color, a * 0.45));
          g.addColorStop(1, U.col(o.color, 0));
          cx.fillStyle = g; cx.beginPath(); cx.arc(px, py, rad, 0, U.TAU); cx.fill();
          if (o.shadow) {
            const g2 = cx.createRadialGradient(px, py + rad * 0.45, 0, px, py + rad * 0.45, rad * 0.8);
            g2.addColorStop(0, U.col(o.shadow, a * 0.35)); g2.addColorStop(1, U.col(o.shadow, 0));
            cx.fillStyle = g2; cx.beginPath(); cx.arc(px, py + rad * 0.45, rad * 0.8, 0, U.TAU); cx.fill();
          }
        }
      }
    });
  };

  // --- periodic painted ridge (dunes / hills) ---
  // o: {seed, baseY (px), amp (px), color [h,s,l], light [h,s,l], dark [h,s,l], haze [h,s,l], hazeK, strokes, octaves, sharp}
  P.ridge = function (key, period, H, o) {
    return P.cache('ridge' + key, period, H, (cx, w, h) => {
      const f = U.ridge(o.seed, w, o.octaves || 5);
      const r = U.rng(o.seed * 7 + 3);
      const ys = new Float32Array(w + 1);
      for (let x = 0; x <= w; x++) {
        let v = f(x);
        if (o.sharp) v = Math.sign(v) * Math.pow(Math.abs(v), 0.8);
        ys[x] = o.baseY + v * o.amp;
      }
      cx.beginPath(); cx.moveTo(0, h);
      for (let x = 0; x <= w; x++) cx.lineTo(x, ys[x]);
      cx.lineTo(w, h); cx.closePath();
      const g = cx.createLinearGradient(0, o.baseY - o.amp, 0, h);
      g.addColorStop(0, U.col(o.light || U.shade(o.color, 10)));
      g.addColorStop(0.35, U.col(o.color));
      g.addColorStop(1, U.col(o.dark || U.shade(o.color, -12)));
      cx.fillStyle = g; cx.fill();
      cx.save(); cx.clip();
      // sun-side / shadow-side modelling: shade by slope
      const strokes = o.strokes == null ? 900 : o.strokes;
      for (let i = 0; i < strokes; i++) {
        const x = Math.floor(r() * w);
        const depth = r() * r();
        const y = ys[x] + depth * (h - ys[x]) * 0.9;
        const slope = (ys[Math.min(w, x + 6)] - ys[Math.max(0, x - 6)]) / 12;
        const ang = Math.atan(slope);
        const len = 14 + r() * 50;
        const lit = slope < 0; // facing the light (left-up)
        const c = lit ? (o.light || U.shade(o.color, 10)) : (o.dark || U.shade(o.color, -12));
        cx.strokeStyle = U.col(U.shade(c, (r() - 0.5) * 8), 0.05 + r() * 0.13 * (1 - depth));
        cx.lineWidth = 1 + r() * 3;
        cx.beginPath(); cx.moveTo(x - Math.cos(ang) * len / 2, y - Math.sin(ang) * len / 2);
        cx.lineTo(x + Math.cos(ang) * len / 2, y + Math.sin(ang) * len / 2); cx.stroke();
      }
      // crest light
      cx.beginPath();
      for (let x = 0; x <= w; x++) { if (x === 0) cx.moveTo(x, ys[x]); else cx.lineTo(x, ys[x]); }
      cx.strokeStyle = U.col(o.light || U.shade(o.color, 14), 0.45); cx.lineWidth = 2.5; cx.stroke();
      // soft dark band below the crest for volume
      const g2 = cx.createLinearGradient(0, o.baseY - o.amp, 0, o.baseY + o.amp * 2);
      g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,0.0)');
      // haze (atmospheric perspective)
      if (o.hazeK) { cx.fillStyle = U.col(o.haze, o.hazeK); cx.fillRect(0, 0, w, h); }
      // paint grain
      cx.globalCompositeOperation = 'overlay'; cx.globalAlpha = 0.2;
      cx.fillStyle = cx.createPattern(P.noiseTile(), 'repeat'); cx.fillRect(0, 0, w, h);
      cx.restore();
    });
  };
  // draw a periodic layer tiled across the screen with horizontal offset
  P.tiled = function (ctx, img, offset, y, W) {
    const w = img.width;
    let ox = -(((offset % w) + w) % w);
    for (let x = ox; x < W; x += w) ctx.drawImage(img, x, y || 0);
  };
  // ridge height at screen x for a layer (needs same params); we store sampler on the canvas
  P.ridgeY = function (period, o, x, offset) {
    if (!o._f) o._f = U.ridge(o.seed, period, o.octaves || 5);
    const xx = (((x + offset) % period) + period) % period;
    let v = o._f(xx); if (o.sharp) v = Math.sign(v) * Math.pow(Math.abs(v), 0.8);
    return o.baseY + v * o.amp;
  };

  // flat ground with painted strokes (for close foreground)
  P.ground = function (key, W, H, o) {
    return P.cache('ground' + key, W, H, (cx, w, h) => {
      const r = U.rng(o.seed || 5);
      const g = cx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, U.col(U.shade(o.color, 4))); g.addColorStop(1, U.col(U.shade(o.color, -10)));
      cx.fillStyle = g; cx.fillRect(0, 0, w, h);
      for (let i = 0; i < (o.strokes || 500); i++) {
        const x = r() * w, y = r() * h, len = 10 + r() * 60 * (0.3 + y / h);
        cx.strokeStyle = U.col(U.shade(o.color, (r() - 0.5) * 16, (r() - 0.5) * 6), 0.05 + r() * 0.12);
        cx.lineWidth = 1 + r() * 2.5;
        cx.beginPath(); cx.moveTo(x - len / 2, y + (r() - 0.5) * 3); cx.lineTo(x + len / 2, y + (r() - 0.5) * 3); cx.stroke();
      }
      if (o.cracks) {
        cx.strokeStyle = U.col(U.shade(o.color, -22), 0.35); cx.lineWidth = 1;
        for (let i = 0; i < o.cracks; i++) {
          let x = r() * w, y = r() * h; cx.beginPath(); cx.moveTo(x, y);
          for (let j = 0; j < 6; j++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 14; cx.lineTo(x, y); }
          cx.stroke();
        }
      }
      cx.globalCompositeOperation = 'overlay'; cx.globalAlpha = 0.25;
      cx.fillStyle = cx.createPattern(P.noiseTile(), 'repeat'); cx.fillRect(0, 0, w, h);
    });
  };

  // --- figures ---
  // o: {x,y,h, robe:[h,s,l], cloth:[h,s,l], facing:1|-1, walk:phase|null, staff, veil, alpha, bow(0..1), arms:'down'|'up'|'hold', dark}
  P.figure = function (ctx, o) {
    const x = o.x, h = o.h, f = o.facing || 1;
    const walking = o.walk != null;
    const bob = walking ? Math.abs(Math.sin(o.walk)) * h * 0.02 : 0;
    const sway = walking ? Math.sin(o.walk) * h * 0.03 : 0;
    const y = o.y - bob;
    const bow = o.bow || 0;
    const robe = o.robe || [20, 35, 30], cloth = o.cloth || [35, 30, 70];
    const dark = o.dark || 0;
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    // ground shadow
    ctx.fillStyle = 'rgba(25,12,0,0.22)';
    ctx.beginPath(); ctx.ellipse(x + f * h * 0.03, o.y, h * 0.2, h * 0.04, 0, 0, U.TAU); ctx.fill();
    ctx.translate(x, y);
    if (bow) ctx.rotate(f * bow * 0.35);
    const hw = h * 0.2;
    // robe
    ctx.beginPath();
    ctx.moveTo(-hw + sway * 0.4, 0);
    ctx.bezierCurveTo(-hw * 0.85, -h * 0.3, -h * 0.17, -h * 0.58, -h * 0.145, -h * 0.72);
    ctx.quadraticCurveTo(0, -h * 0.81, h * 0.145, -h * 0.72);
    ctx.bezierCurveTo(h * 0.17, -h * 0.58, hw * 0.85, -h * 0.3, hw + sway * 0.4, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(-hw, 0, hw, -h * 0.8);
    const rl = U.mix(U.shade(robe, 9), [robe[0], robe[1] * 0.4, 12], dark);
    const rd = U.mix(U.shade(robe, -14), [robe[0], robe[1] * 0.3, 7], dark);
    g.addColorStop(0, U.col(rd)); g.addColorStop(0.55, U.col(U.mix(robe, [robe[0], robe[1] * 0.4, 10], dark))); g.addColorStop(1, U.col(rl));
    ctx.fillStyle = g; ctx.fill();
    // folds
    ctx.strokeStyle = U.col(rd, 0.35); ctx.lineWidth = Math.max(1, h * 0.012);
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * hw * 0.45 + sway * 0.2, -h * 0.02);
      ctx.quadraticCurveTo(i * hw * 0.35, -h * 0.35, i * h * 0.05, -h * 0.66); ctx.stroke();
    }
    // sash
    ctx.fillStyle = U.col(U.shade(robe, -8, 10), 0.6);
    ctx.fillRect(-h * 0.17, -h * 0.5, h * 0.34, h * 0.025);
    // arm / staff
    if (o.staff) {
      const lean = walking ? Math.sin(o.walk + Math.PI) * 0.1 : 0.05;
      ctx.strokeStyle = U.col([30, 35, 22]); ctx.lineWidth = Math.max(1.5, h * 0.02); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(f * h * 0.2, -h * 0.52); ctx.lineTo(f * (h * 0.25 + lean * h), h * 0.0); ctx.stroke();
      // hand & sleeve
      ctx.fillStyle = U.col(rl); ctx.beginPath(); ctx.ellipse(f * h * 0.17, -h * 0.5, h * 0.06, h * 0.05, 0, 0, U.TAU); ctx.fill();
    } else if (o.arms === 'up') {
      ctx.fillStyle = U.col(rl);
      ctx.beginPath(); ctx.moveTo(-h * 0.1, -h * 0.6); ctx.lineTo(-h * 0.26, -h * 0.98); ctx.lineTo(-h * 0.19, -h * 1.0); ctx.lineTo(-h * 0.04, -h * 0.68); ctx.fill();
      ctx.beginPath(); ctx.moveTo(h * 0.1, -h * 0.6); ctx.lineTo(h * 0.26, -h * 0.98); ctx.lineTo(h * 0.19, -h * 1.0); ctx.lineTo(h * 0.04, -h * 0.68); ctx.fill();
    }
    // head cloth (behind head) and head
    const hy = -h * 0.86, hr = h * 0.075;
    const clothD = U.mix(U.shade(cloth, -18), [cloth[0], cloth[1] * 0.3, 10], dark);
    const clothL = U.mix(cloth, [cloth[0], cloth[1] * 0.3, 14], dark);
    ctx.fillStyle = U.col(clothD);
    ctx.beginPath(); ctx.moveTo(-h * 0.14, -h * 0.7); ctx.quadraticCurveTo(-h * 0.14, hy - hr * 1.2, 0, hy - hr * 1.35);
    ctx.quadraticCurveTo(h * 0.14, hy - hr * 1.2, h * 0.14, -h * 0.7); ctx.closePath(); ctx.fill();
    // face in shadow (suggested only)
    const skin = U.mix([28, 40, 28], [25, 20, 9], dark);
    ctx.fillStyle = U.col(skin);
    ctx.beginPath(); ctx.ellipse(f * hr * 0.15, hy, hr * 0.9, hr, 0, 0, U.TAU); ctx.fill();
    // cloth over the head
    ctx.fillStyle = U.col(clothL);
    ctx.beginPath(); ctx.ellipse(0, hy - hr * 0.55, hr * 1.25, hr * 0.85, 0, Math.PI, U.TAU); ctx.fill();
    if (o.veil) { // veil hanging over the face
      ctx.fillStyle = U.col(clothL, 0.75);
      ctx.beginPath(); ctx.moveTo(-hr * 1.2, hy - hr * 0.5); ctx.quadraticCurveTo(0, hy + hr * 1.6, hr * 1.2, hy - hr * 0.5); ctx.closePath(); ctx.fill();
    }
    // highlight on facing side of head cloth
    ctx.fillStyle = 'rgba(255,240,210,0.18)';
    ctx.beginPath(); ctx.ellipse(f * hr * 0.6, hy - hr * 0.6, hr * 0.5, hr * 0.5, 0, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  P.sheep = function (ctx, x, y, s, walk, alpha, f) {
    f = f || 1;
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    const bob = walk != null ? Math.abs(Math.sin(walk)) * s * 0.08 : 0;
    ctx.fillStyle = 'rgba(25,12,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.6, s * 0.12, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = U.col([30, 20, 20]); ctx.lineWidth = Math.max(1, s * 0.08); ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const lx = x + (i < 2 ? -s * 0.3 : s * 0.3) + (i % 2 ? s * 0.12 : 0);
      const sw = walk != null ? Math.sin(walk + i * 1.6) * s * 0.08 : 0;
      ctx.beginPath(); ctx.moveTo(lx, y - s * 0.4 - bob); ctx.lineTo(lx + sw, y); ctx.stroke();
    }
    const g = ctx.createRadialGradient(x - s * 0.15, y - s * 0.75 - bob, s * 0.1, x, y - s * 0.55 - bob, s * 0.8);
    g.addColorStop(0, U.col([40, 30, 88])); g.addColorStop(1, U.col([35, 20, 62]));
    ctx.fillStyle = g;
    [[0, -0.55, 0.42], [-0.32, -0.5, 0.33], [0.3, -0.55, 0.33], [-0.1, -0.75, 0.3], [0.15, -0.72, 0.28]].forEach(c => {
      ctx.beginPath(); ctx.arc(x + c[0] * s, y + c[1] * s - bob, c[2] * s, 0, U.TAU); ctx.fill();
    });
    ctx.fillStyle = U.col([25, 25, 18]);
    ctx.beginPath(); ctx.ellipse(x + f * s * 0.55, y - s * 0.62 - bob, s * 0.2, s * 0.15, 0, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + f * s * 0.48, y - s * 0.74 - bob, s * 0.1, s * 0.05, -f * 0.5, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  P.camel = function (ctx, x, y, h, walk, alpha, f) {
    f = f || 1;
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    const c = [28, 42, 42], cd = [26, 40, 28];
    ctx.fillStyle = 'rgba(25,12,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y, h * 0.5, h * 0.06, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = U.col(cd); ctx.lineWidth = Math.max(1.5, h * 0.045); ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const lx = x + (i < 2 ? -h * 0.28 : h * 0.28) * f + (i % 2 ? h * 0.08 : -h * 0.04);
      const sw = walk != null ? Math.sin(walk + (i % 2) * Math.PI + (i < 2 ? 0 : 0.8)) * h * 0.12 : 0;
      ctx.beginPath(); ctx.moveTo(lx, y - h * 0.5); ctx.quadraticCurveTo(lx + sw * 0.5, y - h * 0.25, lx + sw, y); ctx.stroke();
    }
    const g = ctx.createLinearGradient(x, y - h * 0.9, x, y - h * 0.4);
    g.addColorStop(0, U.col(U.shade(c, 8))); g.addColorStop(1, U.col(cd));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y - h * 0.58, h * 0.42, h * 0.2, 0, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x - f * h * 0.05, y - h * 0.72, h * 0.17, 0, U.TAU); ctx.fill();
    // neck & head
    ctx.strokeStyle = U.col(c); ctx.lineWidth = h * 0.11;
    ctx.beginPath(); ctx.moveTo(x + f * h * 0.33, y - h * 0.62);
    ctx.quadraticCurveTo(x + f * h * 0.5, y - h * 0.75, x + f * h * 0.52, y - h * 0.98); ctx.stroke();
    ctx.fillStyle = U.col(c);
    ctx.beginPath(); ctx.ellipse(x + f * h * 0.57, y - h * 1.0, h * 0.11, h * 0.065, f * 0.3, 0, U.TAU); ctx.fill();
    // saddle cloth
    ctx.fillStyle = U.col([355, 45, 35], 0.9);
    ctx.beginPath(); ctx.moveTo(x - f * h * 0.2, y - h * 0.78); ctx.lineTo(x + f * h * 0.1, y - h * 0.8); ctx.lineTo(x + f * h * 0.08, y - h * 0.55); ctx.lineTo(x - f * h * 0.22, y - h * 0.52); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  P.donkey = function (ctx, x, y, h, walk, alpha, f) {
    f = f || 1;
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    const c = [30, 8, 45], cd = [30, 8, 30];
    ctx.fillStyle = 'rgba(25,12,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y, h * 0.5, h * 0.06, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = U.col(cd); ctx.lineWidth = Math.max(1.2, h * 0.05); ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const lx = x + (i < 2 ? -h * 0.3 : h * 0.3) * f + (i % 2 ? h * 0.08 : 0);
      const sw = walk != null ? Math.sin(walk + (i % 2) * Math.PI + (i < 2 ? 0 : 0.8)) * h * 0.1 : 0;
      ctx.beginPath(); ctx.moveTo(lx, y - h * 0.45); ctx.lineTo(lx + sw, y); ctx.stroke();
    }
    ctx.fillStyle = U.col(c);
    ctx.beginPath(); ctx.ellipse(x, y - h * 0.55, h * 0.42, h * 0.17, 0, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + f * h * 0.3, y - h * 0.6); ctx.lineTo(x + f * h * 0.52, y - h * 0.85); ctx.lineTo(x + f * h * 0.62, y - h * 0.8); ctx.lineTo(x + f * h * 0.42, y - h * 0.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + f * h * 0.62, y - h * 0.82, h * 0.12, h * 0.07, f * 0.35, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = U.col(cd); ctx.lineWidth = h * 0.035;
    ctx.beginPath(); ctx.moveTo(x + f * h * 0.5, y - h * 0.86); ctx.lineTo(x + f * h * 0.47, y - h * 1.02); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + f * h * 0.57, y - h * 0.88); ctx.lineTo(x + f * h * 0.57, y - h * 1.04); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - f * h * 0.4, y - h * 0.6); ctx.lineTo(x - f * h * 0.48, y - h * 0.3); ctx.stroke();
    ctx.restore();
  };

  P.ox = function (ctx, x, y, h, walk, alpha, f) {
    f = f || 1;
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    const c = [15, 25, 22], cd = [15, 25, 14];
    ctx.fillStyle = 'rgba(25,12,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y, h * 0.55, h * 0.07, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = U.col(cd); ctx.lineWidth = Math.max(1.5, h * 0.07); ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const lx = x + (i < 2 ? -h * 0.32 : h * 0.32) * f + (i % 2 ? h * 0.1 : 0);
      const sw = walk != null ? Math.sin(walk + (i % 2) * Math.PI + (i < 2 ? 0 : 0.8)) * h * 0.08 : 0;
      ctx.beginPath(); ctx.moveTo(lx, y - h * 0.45); ctx.lineTo(lx + sw, y); ctx.stroke();
    }
    const g = ctx.createLinearGradient(x, y - h * 0.85, x, y - h * 0.3);
    g.addColorStop(0, U.col(U.shade(c, 8))); g.addColorStop(1, U.col(cd));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - f * h * 0.5, y - h * 0.4); ctx.quadraticCurveTo(x - f * h * 0.5, y - h * 0.85, x - f * h * 0.1, y - h * 0.85);
    ctx.lineTo(x + f * h * 0.35, y - h * 0.8); ctx.quadraticCurveTo(x + f * h * 0.55, y - h * 0.78, x + f * h * 0.5, y - h * 0.4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + f * h * 0.58, y - h * 0.62, h * 0.14, h * 0.17, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = U.col([35, 25, 70]); ctx.lineWidth = h * 0.035;
    ctx.beginPath(); ctx.moveTo(x + f * h * 0.5, y - h * 0.78); ctx.quadraticCurveTo(x + f * h * 0.45, y - h * 0.98, x + f * h * 0.58, y - h * 0.98); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + f * h * 0.66, y - h * 0.78); ctx.quadraticCurveTo(x + f * h * 0.72, y - h * 0.98, x + f * h * 0.6, y - h * 1.0); ctx.stroke();
    ctx.restore();
  };

  // --- tent with pegs & ropes ---
  // o: {x, y, w, h, color, collapse(0..1), pegs:[{dx, dy, pull(0..1)}]}
  P.tent = function (ctx, o) {
    const { x, y, w, h } = o; const col = o.color || [25, 30, 22];
    const k = 1 - (o.collapse || 0) * 0.92;
    ctx.save();
    ctx.fillStyle = 'rgba(25,12,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 4, w * 0.6, h * 0.08, 0, 0, U.TAU); ctx.fill();
    // ropes & pegs (behind the tent body)
    (o.pegs || []).forEach(p => {
      const px = x + p.dx, py = y + p.dy;
      const tx = x + Math.sign(p.dx) * w * 0.42, ty = y - h * 0.55 * k;
      ctx.strokeStyle = U.col([35, 25, 55], 0.9); ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(tx, ty);
      if (p.pull >= 1) { ctx.quadraticCurveTo((tx + px) / 2, y + 6, px + (p.dx > 0 ? -10 : 10), y + 3); }
      else { const sag = p.pull * 18; ctx.quadraticCurveTo((tx + px) / 2, (ty + py) / 2 + sag, px, py - 8 + p.pull * 10); }
      ctx.stroke();
      // peg
      const rise = p.pull * 22, tilt = p.pull * 0.9 * (p.dx > 0 ? 1 : -1);
      ctx.save(); ctx.translate(px, py - rise); ctx.rotate(tilt);
      if (p.pull >= 1) ctx.rotate(p.dx > 0 ? 0.8 : -0.8);
      const pg = ctx.createLinearGradient(-4, 0, 4, 0);
      pg.addColorStop(0, U.col([28, 35, 42])); pg.addColorStop(1, U.col([28, 35, 22]));
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.moveTo(-4, -16); ctx.lineTo(4, -16); ctx.lineTo(2, 12); ctx.lineTo(-2, 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = U.col([30, 30, 55]); ctx.fillRect(-5, -18, 10, 4);
      ctx.restore();
    });
    // body
    const top = y - h * k;
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, U.col(U.shade(col, -8))); g.addColorStop(0.5, U.col(U.shade(col, 6))); g.addColorStop(1, U.col(U.shade(col, -12)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.quadraticCurveTo(x - w * 0.2, top + h * 0.15 * k, x, top);
    ctx.quadraticCurveTo(x + w * 0.2, top + h * 0.15 * k, x + w / 2, y);
    ctx.closePath(); ctx.fill();
    // seam & door
    ctx.strokeStyle = U.col(U.shade(col, -18), 0.7); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = U.col(U.shade(col, -22), 0.9);
    ctx.beginPath(); ctx.moveTo(x - w * 0.08, y); ctx.lineTo(x, top + h * 0.45 * k); ctx.lineTo(x + w * 0.08, y); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  // --- stones / altar ---
  P.stone = function (ctx, x, y, w, h, seed, color, alpha) {
    const r = U.rng(seed);
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    ctx.beginPath();
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * U.TAU; const rr = 0.8 + r() * 0.35;
      const px = x + Math.cos(a) * w / 2 * rr, py = y + Math.sin(a) * h / 2 * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 3, y + h / 2);
    const c = color || [32, 18, 55];
    g.addColorStop(0, U.col(U.shade(c, 12))); g.addColorStop(0.5, U.col(c)); g.addColorStop(1, U.col(U.shade(c, -16)));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = U.col(U.shade(c, -25), 0.5); ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,245,220,0.35)'; ctx.beginPath(); ctx.moveTo(x - w * 0.3, y - h * 0.3); ctx.lineTo(x + w * 0.05, y - h * 0.38); ctx.stroke();
    ctx.restore();
  };
  // altar layout: slots for n stones (bottom row 3, middle 2, top 1 ...)
  P.altarSlots = function (x, y, s) {
    return [
      { x: x - s * 1.05, y: y, w: s * 1.1, h: s * 0.7 }, { x: x, y: y - s * 0.05, w: s * 1.15, h: s * 0.75 }, { x: x + s * 1.05, y: y, w: s * 1.05, h: s * 0.7 },
      { x: x - s * 0.52, y: y - s * 0.6, w: s * 1.1, h: s * 0.7 }, { x: x + s * 0.55, y: y - s * 0.62, w: s * 1.1, h: s * 0.7 },
      { x: x, y: y - s * 1.15, w: s * 1.2, h: s * 0.7 },
    ];
  };
  P.altar = function (ctx, x, y, s, placed, flame, t) {
    const slots = P.altarSlots(x, y, s);
    ctx.save();
    ctx.fillStyle = 'rgba(25,12,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, y + s * 0.3, s * 1.9, s * 0.3, 0, 0, U.TAU); ctx.fill();
    slots.forEach((sl, i) => { if (i < placed) P.stone(ctx, sl.x, sl.y, sl.w, sl.h, 100 + i * 13); });
    if (flame && placed >= slots.length) P.flame(ctx, x, y - s * 1.5, s * 0.9, t || 0, 3, flame);
    ctx.restore();
  };

  // --- flame & smoke ---
  P.flame = function (ctx, x, y, size, t, seed, k) {
    k = k == null ? 1 : k;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    P.glow(ctx, x, y - size * 0.3, size * 3 * k, 'rgba(255,150,60,1)', 0.22 * k, 0.2);
    const layers = [[1.0, 'rgba(255,120,30,0.55)'], [0.7, 'rgba(255,190,70,0.7)'], [0.4, 'rgba(255,245,200,0.9)']];
    layers.forEach(([s, col], li) => {
      ctx.fillStyle = col;
      for (let i = 0; i < 3; i++) {
        const ph = t * (6 + i * 1.7) + seed + li;
        const w = size * s * (0.35 + 0.08 * Math.sin(ph * 1.3)), h = size * s * (1 + 0.22 * Math.sin(ph)) * k;
        const ox = Math.sin(ph * 0.7 + i) * size * 0.08;
        ctx.beginPath();
        ctx.moveTo(x - w / 2 + ox * 0.3, y);
        ctx.bezierCurveTo(x - w / 2 + ox, y - h * 0.5, x - w * 0.1 + ox, y - h * 0.8, x + ox * 1.4, y - h);
        ctx.bezierCurveTo(x + w * 0.1 + ox, y - h * 0.8, x + w / 2 + ox, y - h * 0.5, x + w / 2 + ox * 0.3, y);
        ctx.closePath(); ctx.fill();
      }
    });
    ctx.restore();
  };

  // --- trees ---
  P.oak = function (ctx, x, y, h, seed, col, alpha) {
    const r = U.rng(seed); col = col || [95, 28, 24];
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(25,12,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y + 2, h * 0.5, h * 0.06, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = U.col([25, 30, 20]); ctx.lineCap = 'round';
    ctx.lineWidth = h * 0.07; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + h * 0.03, y - h * 0.3, x - h * 0.02, y - h * 0.5); ctx.stroke();
    ctx.lineWidth = h * 0.035;
    for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.6; ctx.beginPath(); ctx.moveTo(x, y - h * 0.42); ctx.lineTo(x + Math.cos(a) * h * 0.28, y - h * 0.42 + Math.sin(a) * h * 0.28); ctx.stroke(); }
    for (let i = 0; i < 14; i++) {
      const a = r() * U.TAU, d = r() * h * 0.3;
      const px = x + Math.cos(a) * d * 1.4, py = y - h * 0.68 + Math.sin(a) * d * 0.7;
      const rad = h * (0.12 + r() * 0.14);
      const g = ctx.createRadialGradient(px - rad * 0.3, py - rad * 0.3, rad * 0.1, px, py, rad);
      g.addColorStop(0, U.col(U.shade(col, 10 + r() * 6))); g.addColorStop(1, U.col(U.shade(col, -10)));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, rad, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };
  P.palm = function (ctx, x, y, h, seed, col, sway, alpha) {
    const r = U.rng(seed); col = col || [120, 30, 26]; sway = sway || 0;
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    const lean = (r() - 0.5) * 0.4;
    const tx = x + lean * h * 0.5 + sway * h * 0.03, ty = y - h;
    ctx.strokeStyle = U.col([30, 25, 28]); ctx.lineCap = 'round'; ctx.lineWidth = h * 0.045;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * h * 0.15, y - h * 0.55, tx, ty); ctx.stroke();
    ctx.strokeStyle = U.col([30, 25, 40], 0.5); ctx.lineWidth = 1;
    for (let i = 1; i < 9; i++) { const yy = y - h * i / 9; const xx = x + lean * h * 0.5 * Math.pow(i / 9, 1.5); ctx.beginPath(); ctx.moveTo(xx - h * 0.02, yy); ctx.lineTo(xx + h * 0.02, yy); ctx.stroke(); }
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * 0.95 + (i / (n - 1)) * Math.PI * 0.9 + (r() - 0.5) * 0.2 + sway * 0.05;
      const len = h * (0.35 + r() * 0.2);
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len + len * 0.45;
      const c = U.shade(col, (r() - 0.5) * 10);
      ctx.fillStyle = U.col(c);
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.6 - len * 0.12, ex, ey);
      ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.55 + len * 0.06, ty + Math.sin(a) * len * 0.55 + len * 0.1, tx, ty + h * 0.02);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };
  P.reeds = function (ctx, x, y, w, h, n, seed, t, col, alpha) {
    const r = U.rng(seed); col = col || [85, 30, 28];
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const px = x + r() * w, hh = h * (0.6 + r() * 0.5), ph = r() * 7;
      const sw = Math.sin(t * 0.8 + ph) * hh * 0.06;
      ctx.strokeStyle = U.col(U.shade(col, (r() - 0.5) * 14), 0.9); ctx.lineWidth = 1 + r() * 1.5;
      ctx.beginPath(); ctx.moveTo(px, y); ctx.quadraticCurveTo(px + sw * 0.4, y - hh * 0.5, px + sw, y - hh); ctx.stroke();
      if (r() < 0.4) { ctx.fillStyle = U.col([30, 30, 30]); ctx.beginPath(); ctx.ellipse(px + sw, y - hh, 2.2, hh * 0.08, 0, 0, U.TAU); ctx.fill(); }
    }
    ctx.restore();
  };

  // --- water band ---
  P.water = function (ctx, x, y, w, h, t, col, seed) {
    col = col || [195, 40, 32];
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, U.col(U.shade(col, 8))); g.addColorStop(1, U.col(U.shade(col, -10)));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const r = U.rng(seed || 9);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 70; i++) {
      const yy = y + r() * h, len = 20 + r() * 120 * (yy - y) / h + 10;
      const xx = x + ((r() * w + t * (10 + 20 * (yy - y) / h)) % w);
      ctx.strokeStyle = `rgba(230,240,255,${0.04 + r() * 0.1})`; ctx.lineWidth = 1 + r() * 1.5;
      ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + len, yy); ctx.stroke();
    }
    ctx.restore();
  };

  // --- palace (gold & lapis) ---
  P.palace = function (ctx, x, y, w, h, t, alpha) {
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    const ochre = [38, 45, 55], lapis = [228, 55, 32], gold = [44, 75, 58];
    // base wall
    let g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    g.addColorStop(0, U.col(U.shade(ochre, -10))); g.addColorStop(0.5, U.col(U.shade(ochre, 6))); g.addColorStop(1, U.col(U.shade(ochre, -14)));
    ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h * 0.62, w, h * 0.62);
    // pylons
    [-1, 1].forEach(s => {
      const px = x + s * w * 0.36;
      const pg = ctx.createLinearGradient(px - w * 0.14, 0, px + w * 0.14, 0);
      pg.addColorStop(0, U.col(U.shade(ochre, s < 0 ? 4 : -16))); pg.addColorStop(1, U.col(U.shade(ochre, s < 0 ? -16 : 4)));
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.moveTo(px - w * 0.14, y); ctx.lineTo(px - w * 0.11, y - h); ctx.lineTo(px + w * 0.11, y - h); ctx.lineTo(px + w * 0.14, y); ctx.closePath(); ctx.fill();
      // cornice
      ctx.fillStyle = U.col(lapis); ctx.fillRect(px - w * 0.125, y - h * 1.02, w * 0.25, h * 0.05);
      ctx.fillStyle = U.col(gold); ctx.fillRect(px - w * 0.125, y - h * 1.02, w * 0.25, h * 0.012);
      ctx.fillRect(px - w * 0.125, y - h * 0.975, w * 0.25, h * 0.008);
      // bands
      for (let i = 0; i < 4; i++) {
        const by = y - h * (0.25 + i * 0.17);
        ctx.fillStyle = U.col(lapis, 0.85); ctx.fillRect(px - w * 0.1, by, w * 0.2, h * 0.025);
        ctx.fillStyle = U.col(gold, 0.9); ctx.fillRect(px - w * 0.1, by + h * 0.025, w * 0.2, h * 0.006);
      }
    });
    // gate
    const gx = x, gw = w * 0.2, gh = h * 0.72;
    g = ctx.createLinearGradient(0, y - gh, 0, y);
    g.addColorStop(0, U.col([228, 50, 12])); g.addColorStop(1, U.col([228, 40, 5]));
    ctx.fillStyle = g; ctx.fillRect(gx - gw / 2, y - gh, gw, gh);
    ctx.strokeStyle = U.col(gold); ctx.lineWidth = Math.max(2, w * 0.012); ctx.strokeRect(gx - gw / 2, y - gh, gw, gh);
    ctx.fillStyle = U.col(gold); ctx.fillRect(gx - gw * 0.65, y - gh - h * 0.06, gw * 1.3, h * 0.06);
    ctx.fillStyle = U.col(lapis); ctx.fillRect(gx - gw * 0.65, y - gh - h * 0.045, gw * 1.3, h * 0.03);
    // columns
    [-0.19, 0.19].forEach(s => {
      const cx = x + s * w; const cw = w * 0.035;
      const cg = ctx.createLinearGradient(cx - cw, 0, cx + cw, 0);
      cg.addColorStop(0, U.col(U.shade(ochre, -10))); cg.addColorStop(0.4, U.col(U.shade(ochre, 14))); cg.addColorStop(1, U.col(U.shade(ochre, -18)));
      ctx.fillStyle = cg; ctx.fillRect(cx - cw, y - h * 0.78, cw * 2, h * 0.78);
      ctx.fillStyle = U.col(lapis); ctx.beginPath(); ctx.ellipse(cx, y - h * 0.78, cw * 1.8, h * 0.035, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = U.col(gold); ctx.beginPath(); ctx.ellipse(cx, y - h * 0.8, cw * 1.6, h * 0.02, 0, 0, U.TAU); ctx.fill();
    });
    // painted texture
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = (alpha == null ? 1 : alpha) * 0.3;
    ctx.fillStyle = ctx.createPattern(P.noiseTile(), 'repeat'); ctx.fillRect(x - w / 2, y - h * 1.05, w, h * 1.05);
    ctx.restore();
  };

  // --- stars ---
  P.stars = function (key, W, H, o) {
    return P.cache('stars' + key, W, H, (cx, w, h) => {
      const r = U.rng(o.seed || 11);
      const n = o.count || 400;
      for (let i = 0; i < n; i++) {
        const x = r() * w, y = Math.pow(r(), o.pow || 1) * h;
        const s = (o.sizeMin || 0.4) + Math.pow(r(), 2.5) * ((o.sizeMax || 2) - (o.sizeMin || 0.4));
        const temp = r();
        const col = temp < 0.2 ? [215, 60, 85] : temp < 0.4 ? [40, 70, 85] : [45, 20, 96];
        const a = 0.35 + r() * 0.65;
        cx.fillStyle = U.col(col, a * (o.alpha || 1));
        cx.beginPath(); cx.arc(x, y, s, 0, U.TAU); cx.fill();
        if (s > 1.6 && r() < 0.5) {
          const g = cx.createRadialGradient(x, y, 0, x, y, s * 5);
          g.addColorStop(0, U.col(col, 0.25)); g.addColorStop(1, U.col(col, 0));
          cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, s * 5, 0, U.TAU); cx.fill();
        }
      }
    });
  };
  P.milky = function (key, W, H, o) {
    return P.cache('milky' + key, W, H, (cx, w, h) => {
      const r = U.rng(o.seed || 3);
      const ang = o.angle || -0.5;
      const cxp = w * 0.5, cyp = h * (o.y || 0.45);
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const n = o.count || 1200;
      cx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const along = (r() - 0.5) * Math.max(w, h) * 2.2;
        const g1 = (r() + r() + r() - 1.5) / 1.5; // gaussian-ish
        const across = g1 * h * 0.11 * (o.width || 1);
        const x = cxp + dx * along - dy * across, y = cyp + dy * along + dx * across;
        const rad = 8 + r() * 36;
        const g = cx.createRadialGradient(x, y, 0, x, y, rad);
        const col = r() < 0.3 ? '200,210,255' : '230,225,240';
        const a = 0.012 + r() * 0.03;
        g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
        cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, rad, 0, U.TAU); cx.fill();
      }
      // dust lane
      cx.globalCompositeOperation = 'multiply';
      for (let i = 0; i < n * 0.25; i++) {
        const along = (r() - 0.5) * Math.max(w, h) * 2.2;
        const across = (r() - 0.5) * h * 0.03 + Math.sin(along / 200) * h * 0.02;
        const x = cxp + dx * along - dy * across, y = cyp + dy * along + dx * across;
        const rad = 6 + r() * 20;
        const g = cx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, 'rgba(60,50,80,0.08)'); g.addColorStop(1, 'rgba(60,50,80,0)');
        cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, rad, 0, U.TAU); cx.fill();
      }
    });
  };

  P.vignette = function (ctx, W, H, k) {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${k})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };

  // a sun or moon disc with halo
  P.disc = function (ctx, x, y, r, col, haloCol, haloK) {
    P.glow(ctx, x, y, r * 6, haloCol || 'rgba(255,220,160,1)', haloK == null ? 0.35 : haloK, 0.15);
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
  };

  // city silhouette (flat roofs, a tower) — for Charan / Sodom in distance
  P.city = function (ctx, x, y, w, h, seed, col, alpha) {
    const r = U.rng(seed); col = col || [260, 15, 35];
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    ctx.fillStyle = U.col(col);
    let cx = x - w / 2;
    while (cx < x + w / 2) {
      const bw = w * (0.04 + r() * 0.08), bh = h * (0.3 + r() * 0.7);
      ctx.fillRect(cx, y - bh, bw, bh);
      if (r() < 0.3) ctx.fillRect(cx + bw * 0.3, y - bh - h * 0.15, bw * 0.4, h * 0.15);
      cx += bw * (0.8 + r() * 0.5);
    }
    // ziggurat-like tower
    const tx = x + w * (r() - 0.5) * 0.5;
    for (let i = 0; i < 4; i++) { const tw = w * (0.12 - i * 0.025), th = h * 0.3; ctx.fillRect(tx - tw / 2, y - h * 0.6 - th * (i + 1), tw, th); }
    ctx.restore();
  };

  // birds (distant) — a few strokes
  P.bird = function (ctx, x, y, s, flap, col) {
    ctx.strokeStyle = col || 'rgba(20,15,25,0.8)'; ctx.lineWidth = Math.max(1, s * 0.12); ctx.lineCap = 'round';
    const f = Math.sin(flap) * s * 0.35;
    ctx.beginPath(); ctx.moveTo(x - s, y + f * 0.3); ctx.quadraticCurveTo(x - s * 0.5, y - f, x, y); ctx.quadraticCurveTo(x + s * 0.5, y - f, x + s, y + f * 0.3); ctx.stroke();
  };
  // bird of prey (bigger, silhouette with spread wings)
  P.raptor = function (ctx, x, y, s, flap, ang, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0);
    ctx.fillStyle = col || 'rgba(18,12,20,0.92)';
    const f = Math.sin(flap) * s * 0.25;
    ctx.beginPath();
    ctx.moveTo(-s * 1.2, -f * 0.8); ctx.quadraticCurveTo(-s * 0.6, -s * 0.25 - f, -s * 0.12, -s * 0.05);
    ctx.lineTo(0, -s * 0.18); ctx.lineTo(s * 0.12, -s * 0.05);
    ctx.quadraticCurveTo(s * 0.6, -s * 0.25 - f, s * 1.2, -f * 0.8);
    ctx.quadraticCurveTo(s * 0.55, s * 0.05 - f * 0.6, s * 0.15, s * 0.12);
    ctx.lineTo(0, s * 0.32); ctx.lineTo(-s * 0.15, s * 0.12);
    ctx.quadraticCurveTo(-s * 0.55, s * 0.05 - f * 0.6, -s * 1.2, -f * 0.8);
    ctx.fill();
    ctx.restore();
  };

  P.label = function (ctx, text, x, y, size, col, align, weight) {
    ctx.save();
    ctx.font = `${weight || 500} ${size}px "Frank Ruhl Libre", serif`;
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
    ctx.fillStyle = col || 'rgba(255,245,225,0.9)';
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  window.Paint = P;
})();

/* scenes.js — shared painted landscape scene, caravan, walking, altar, the Voice */
'use strict';
(function () {
  const S = {};
  const E = () => window.Engine;

  // ---------- palettes ----------
  S.pal = {
    charan: {
      sky: [[0, '#241f38'], [0.4, '#5b4a66'], [0.68, '#b97d68'], [0.86, '#e9bb82'], [1, '#f4d6a2']],
      haze: [28, 45, 76], sun: { x: 0.64, y: 0.73, r: 0.045, col: ['#fff4d6', '#f7c67c'], halo: 'rgba(255,205,140,1)', haloK: 0.4 },
      clouds: [{ seed: 3, banks: 5, yMin: 0.1, yMax: 0.5, color: [20, 55, 78], alpha: 0.33, shadow: [285, 30, 42], depth: 0.08 }],
      ridges: [
        { seed: 11, baseY: 0.70, amp: 0.035, color: [268, 18, 40], depth: 0.12, hazeK: 0.55, octaves: 4 },
        { seed: 12, baseY: 0.76, amp: 0.03, color: [24, 30, 44], depth: 0.28, hazeK: 0.3, octaves: 5 },
        { seed: 13, baseY: 0.82, amp: 0.022, color: [27, 38, 38], depth: 0.5, hazeK: 0.12, octaves: 5 },
      ],
      ground: { color: [28, 36, 36], strokes: 1000 }, groundY: 0.85,
    },
    canaan: {
      sky: [[0, '#3a5f8a'], [0.45, '#8fb2cf'], [0.75, '#d9d4bd'], [1, '#e9dcb8']],
      haze: [40, 35, 80], sun: { x: 0.3, y: 0.18, r: 0.04, col: ['#fffbe8', '#fff0b0'], halo: 'rgba(255,245,200,1)', haloK: 0.3 },
      clouds: [{ seed: 5, banks: 5, yMin: 0.08, yMax: 0.42, color: [40, 40, 96], alpha: 0.45, shadow: [220, 25, 70], depth: 0.08 }],
      ridges: [
        { seed: 21, baseY: 0.62, amp: 0.07, color: [215, 22, 60], depth: 0.1, hazeK: 0.6, octaves: 5, sharp: true },
        { seed: 22, baseY: 0.70, amp: 0.055, color: [90, 18, 46], depth: 0.25, hazeK: 0.35, octaves: 5 },
        { seed: 23, baseY: 0.77, amp: 0.04, color: [70, 25, 42], depth: 0.45, hazeK: 0.15, octaves: 5 },
        { seed: 24, baseY: 0.83, amp: 0.025, color: [45, 32, 46], depth: 0.7, hazeK: 0.04, octaves: 6 },
      ],
      ground: { color: [38, 36, 48], strokes: 1200 }, groundY: 0.86,
    },
    negev: {
      sky: [[0, '#6f8ba8'], [0.45, '#c7c3ad'], [0.8, '#efe3c2'], [1, '#f3e6c6']],
      haze: [40, 40, 84], sun: { x: 0.5, y: 0.14, r: 0.045, col: ['#ffffff', '#fff6d6'], halo: 'rgba(255,250,230,1)', haloK: 0.5 },
      clouds: [{ seed: 7, banks: 2, yMin: 0.1, yMax: 0.3, color: [40, 30, 96], alpha: 0.25, depth: 0.08 }],
      ridges: [
        { seed: 31, baseY: 0.66, amp: 0.04, color: [36, 28, 62], depth: 0.1, hazeK: 0.6, octaves: 4 },
        { seed: 32, baseY: 0.73, amp: 0.035, color: [34, 32, 54], depth: 0.25, hazeK: 0.35, octaves: 5 },
        { seed: 33, baseY: 0.80, amp: 0.03, color: [33, 36, 50], depth: 0.5, hazeK: 0.12, octaves: 5 },
      ],
      ground: { color: [36, 34, 56], strokes: 900, cracks: 60 }, groundY: 0.86,
    },
    egypt: {
      sky: [[0, '#3f5f82'], [0.5, '#9fb8c9'], [0.8, '#e5d9ba'], [1, '#efe2c0']],
      haze: [40, 35, 82], sun: { x: 0.72, y: 0.2, r: 0.04, col: ['#fffbe8', '#fff0b0'], halo: 'rgba(255,245,200,1)', haloK: 0.25 },
      clouds: [{ seed: 9, banks: 4, yMin: 0.08, yMax: 0.35, color: [40, 40, 96], alpha: 0.4, shadow: [215, 25, 70], depth: 0.08 }],
      ridges: [
        { seed: 41, baseY: 0.68, amp: 0.012, color: [38, 30, 62], depth: 0.1, hazeK: 0.6, octaves: 3 },
      ],
      ground: { color: [36, 32, 52], strokes: 900 }, groundY: 0.86,
    },
    dawnReturn: {
      sky: [[0, '#2f3a5c'], [0.4, '#7f7c99'], [0.68, '#d9a98a'], [0.86, '#f3d6a8'], [1, '#f8e6c2']],
      haze: [30, 45, 82], sun: { x: 0.5, y: 0.7, r: 0.04, col: ['#fff6dc', '#f8cf8a'], halo: 'rgba(255,215,160,1)', haloK: 0.45 },
      clouds: [{ seed: 15, banks: 5, yMin: 0.1, yMax: 0.45, color: [30, 70, 85], alpha: 0.35, shadow: [270, 30, 55], depth: 0.08 }],
      ridges: [
        { seed: 21, baseY: 0.62, amp: 0.07, color: [250, 22, 56], depth: 0.1, hazeK: 0.62, octaves: 5, sharp: true },
        { seed: 22, baseY: 0.70, amp: 0.055, color: [60, 22, 46], depth: 0.25, hazeK: 0.38, octaves: 5 },
        { seed: 23, baseY: 0.77, amp: 0.04, color: [55, 28, 42], depth: 0.45, hazeK: 0.18, octaves: 5 },
        { seed: 24, baseY: 0.83, amp: 0.025, color: [40, 35, 44], depth: 0.7, hazeK: 0.05, octaves: 6 },
      ],
      ground: { color: [36, 38, 46], strokes: 1200 }, groundY: 0.86,
    },
    jordan: {
      sky: [[0, '#3b6b9a'], [0.45, '#9ec4dd'], [0.78, '#dfe6c8'], [1, '#e8e9c6']],
      haze: [90, 25, 82], sun: { x: 0.25, y: 0.16, r: 0.04, col: ['#fffbe8', '#fff0b0'], halo: 'rgba(255,245,200,1)', haloK: 0.3 },
      clouds: [{ seed: 17, banks: 5, yMin: 0.08, yMax: 0.4, color: [40, 40, 97], alpha: 0.45, shadow: [210, 25, 70], depth: 0.08 }],
      ridges: [
        { seed: 51, baseY: 0.6, amp: 0.06, color: [210, 25, 62], depth: 0.1, hazeK: 0.6, octaves: 5, sharp: true },
        { seed: 52, baseY: 0.69, amp: 0.045, color: [110, 30, 40], depth: 0.25, hazeK: 0.35, octaves: 5 },
        { seed: 53, baseY: 0.76, amp: 0.035, color: [95, 38, 38], depth: 0.45, hazeK: 0.15, octaves: 5 },
        { seed: 54, baseY: 0.83, amp: 0.02, color: [85, 40, 36], depth: 0.7, hazeK: 0.04, octaves: 6 },
      ],
      ground: { color: [80, 35, 40], strokes: 1200 }, groundY: 0.86,
    },
    mamre: {
      sky: [[0, '#2a2f4e'], [0.4, '#6a5a78'], [0.7, '#c98a6a'], [0.88, '#efc48c'], [1, '#f6dcae']],
      haze: [28, 45, 74], sun: { x: 0.2, y: 0.74, r: 0.045, col: ['#fff1d0', '#f6b86a'], halo: 'rgba(255,190,120,1)', haloK: 0.45 },
      clouds: [{ seed: 19, banks: 5, yMin: 0.1, yMax: 0.45, color: [25, 60, 78], alpha: 0.35, shadow: [280, 30, 42], depth: 0.08 }],
      ridges: [
        { seed: 61, baseY: 0.64, amp: 0.06, color: [262, 20, 42], depth: 0.1, hazeK: 0.55, octaves: 5, sharp: true },
        { seed: 62, baseY: 0.71, amp: 0.05, color: [40, 25, 38], depth: 0.25, hazeK: 0.3, octaves: 5 },
        { seed: 63, baseY: 0.78, amp: 0.035, color: [35, 30, 34], depth: 0.45, hazeK: 0.12, octaves: 5 },
      ],
      ground: { color: [32, 30, 36], strokes: 1000 }, groundY: 0.86,
    },
    night: {
      sky: [[0, '#05060f'], [0.5, '#0b1024'], [0.85, '#1a1e38'], [1, '#262640']],
      haze: [235, 30, 20], sun: null,
      clouds: [],
      ridges: [
        { seed: 71, baseY: 0.66, amp: 0.06, color: [240, 22, 17], depth: 0.1, hazeK: 0.4, octaves: 5, sharp: true, strokes: 300 },
        { seed: 72, baseY: 0.74, amp: 0.045, color: [240, 20, 13], depth: 0.25, hazeK: 0.2, octaves: 5, strokes: 300 },
        { seed: 73, baseY: 0.81, amp: 0.03, color: [235, 18, 10], depth: 0.45, hazeK: 0.05, octaves: 5, strokes: 300 },
      ],
      ground: { color: [235, 15, 9], strokes: 500 }, groundY: 0.86, stars: true,
    },
  };

  // ---------- landscape scene ----------
  S.landscape = function (pal, o) {
    o = o || {};
    const sc = {
      pal, scroll: 0, drain: 0, heat: 0, dark: 0, light: 0, lightTarget: 0, lightWarm: true,
      actors: [], props: [], walkPhase: 0, speed: 0, targetSpeed: 0, hooks: {}, W: 0, H: 0, t: 0,
      sunK: 1, blend: null, blendK: 0, cloudDrift: 0, tint: null, tintK: 0,
      init(W, H) { this.W = W; this.H = H; this.period = Math.max(1600, Math.ceil(W * 1.6)); if (this.onInit) this.onInit(W, H); },
      update(dt, t) {
        this.t = t;
        this.speed += (this.targetSpeed - this.speed) * Math.min(1, dt * 3);
        if (this.speed > 0.02) this.walkPhase += dt * 7 * this.speed;
        this.light += (this.lightTarget - this.light) * Math.min(1, dt * 0.8);
        this.cloudDrift += dt * 2;
        if (this.onUpdate) this.onUpdate(dt, t);
      },
      draw(ctx, W, H, t) { S.drawLandscape(ctx, this, W, H, t); },
    };
    Object.assign(sc, o);
    return sc;
  };

  S.drawLandscape = function (ctx, sc, W, H, t) {
    const E_ = E(), P = Paint;
    const pal = sc.pal, px = E_.par.x, py = E_.par.y;
    // sky
    P.sky(ctx, W, H, pal.sky);
    if (pal.stars) { ctx.drawImage(P.stars('land', W, H, { seed: 5, count: 900, pow: 1.6, sizeMax: 1.8 }), -px * 6, -py * 4); }
    if (pal.sun && sc.sunK > 0) {
      const s = pal.sun; ctx.save(); ctx.globalAlpha = sc.sunK;
      P.disc(ctx, s.x * W - px * 6, s.y * H - py * 4, s.r * Math.min(W, H) * 1.4, s.col, s.halo, s.haloK);
      ctx.restore();
    }
    if (sc.hooks.sky) sc.hooks.sky(ctx, W, H, t);
    if (sc.light > 0.005) P.lightAbove(ctx, W, H, sc.light, sc.lightWarm);
    // clouds
    (pal.clouds || []).forEach((c, i) => {
      const img = P.clouds('L' + i + c.seed, W + 240, H, c);
      const ox = -120 + Math.sin(sc.cloudDrift * 0.01 + i) * 30 - px * c.depth * 60 - (sc.scroll * c.depth * 0.3) % 240;
      ctx.drawImage(img, ox, -py * c.depth * 20);
    });
    if (sc.hooks.far) sc.hooks.far(ctx, W, H, t);
    // ridges
    pal.ridges.forEach((r, i) => {
      const spec = Object.assign({}, r, { baseY: r.baseY * H, amp: r.amp * H, haze: pal.haze });
      const img = P.ridge('L' + i + r.seed + pal.ridges.length, sc.period, H, spec);
      const offset = -sc.scroll * r.depth - px * r.depth * 40;
      P.tiled(ctx, img, offset, -py * r.depth * 12, W);
      if (sc.hooks['ridge' + i]) sc.hooks['ridge' + i](ctx, W, H, t, offset);
    });
    // ground
    const g = pal.ground;
    const gy = pal.groundY * H;
    const gimg = P.ridge('G' + g.color.join(''), sc.period, H, { seed: 99, baseY: gy, amp: H * 0.004, color: g.color, haze: pal.haze, hazeK: 0, strokes: g.strokes, octaves: 3 });
    P.tiled(ctx, gimg, -sc.scroll - px * 40, -py * 12, W);
    if (g.cracks) {
      const cimg = P.ground('C', sc.period, H - gy, { seed: 77, color: g.color, strokes: 0, cracks: g.cracks });
      ctx.save(); ctx.globalAlpha = sc.drain; P.tiled(ctx, cimg, -sc.scroll - px * 40, gy - py * 12, W); ctx.restore();
    }
    if (sc.hooks.mid) sc.hooks.mid(ctx, W, H, t);
    // props & actors, sorted by foot y
    const items = [];
    sc.props.forEach(p => { if (p.hidden) return; const sx = p.x + sc.scroll * (p.depth == null ? 1 : p.depth); if (sx > -400 && sx < W + 400) items.push({ y: p.y, draw: () => p.draw(ctx, sx - px * 40 * (p.depth == null ? 1 : p.depth), p.y - py * 12, t, sc) }); });
    sc.actors.forEach(a => {
      if (a.hidden || (a.alpha != null && a.alpha <= 0)) return;
      const sx = a.fixed ? a.x : a.x + sc.scroll;
      items.push({ y: a.y, draw: () => S.drawActor(ctx, a, sx - px * 40, a.y - py * 12, sc, t) });
    });
    items.sort((a, b) => a.y - b.y).forEach(it => it.draw());
    if (sc.hooks.near) sc.hooks.near(ctx, W, H, t);
    // overlays: drain (desaturate), heat, dark, tint
    if (sc.drain > 0.005) {
      ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${Math.min(1, sc.drain)})`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,246,225,${sc.drain * 0.22})`; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (sc.tint && sc.tintK > 0.005) { ctx.save(); ctx.globalCompositeOperation = sc.tintMode || 'multiply'; ctx.globalAlpha = sc.tintK; ctx.fillStyle = sc.tint; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (sc.dark > 0.005) { ctx.save(); ctx.fillStyle = `rgba(4,5,12,${sc.dark})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (sc.hooks.over) sc.hooks.over(ctx, W, H, t);
    if (sc.blend && sc.blendK > 0.002) { ctx.save(); ctx.globalAlpha = Math.min(1, sc.blendK); sc.blend.draw(ctx, W, H, t); ctx.restore(); }
  };

  S.drawActor = function (ctx, a, x, y, sc, t) {
    const walk = (sc.speed > 0.05 || a.walking) ? sc.walkPhase + (a.phase || 0) : null;
    const f = a.facing || -1;
    switch (a.kind) {
      case 'figure': Paint.figure(ctx, { x, y, h: a.h, robe: a.robe, cloth: a.cloth, facing: f, walk: a.still ? null : walk, staff: a.staff, veil: a.veil, alpha: a.alpha, bow: a.bow, arms: a.arms, dark: a.dark }); break;
      case 'sheep': Paint.sheep(ctx, x, y, a.h, a.still ? null : walk, a.alpha, f); break;
      case 'camel': Paint.camel(ctx, x, y, a.h, a.still ? null : walk, a.alpha, f); break;
      case 'donkey': Paint.donkey(ctx, x, y, a.h, a.still ? null : walk, a.alpha, f); break;
      case 'ox': Paint.ox(ctx, x, y, a.h, a.still ? null : walk, a.alpha, f); break;
      default: if (a.draw) a.draw(ctx, x, y, t, sc, a);
    }
  };

  // ---------- caravan ----------
  S.ROBES = {
    abram: { robe: [18, 42, 32], cloth: [36, 35, 72] },
    sarai: { robe: [200, 35, 30], cloth: [40, 30, 82] },
    lot: { robe: [85, 20, 32], cloth: [40, 20, 62] },
    servant: { robe: [30, 20, 28], cloth: [30, 18, 50] },
    egyptian: { robe: [45, 30, 86], cloth: [40, 45, 55] },
    king: { robe: [285, 35, 28], cloth: [45, 70, 58] },
    priest: { robe: [40, 20, 90], cloth: [40, 20, 92] },
    enemy: { robe: [350, 15, 16], cloth: [0, 10, 24] },
  };
  S.caravan = function (sc, W, H, o) {
    o = o || {};
    const gy = sc.pal.groundY * H;
    const h = U.clamp(H * 0.2, 76, 160);
    const base = W * 0.5 + (o.shift || 0);
    const rand = U.rng(o.seed || 4);
    const A = [];
    const add = a => { A.push(a); return a; };
    sc.abram = add({ kind: 'figure', name: 'abram', fixed: true, x: base - h * 0.5, y: gy + h * 0.55, h, staff: true, facing: -1, phase: 0, ...S.ROBES.abram });
    if (o.sarai !== false) sc.sarai = add({ kind: 'figure', name: 'sarai', fixed: true, x: base + h * 0.3, y: gy + h * 0.5, h: h * 0.92, veil: true, facing: -1, phase: 2.1, ...S.ROBES.sarai });
    if (o.lot) sc.lot = add({ kind: 'figure', name: 'lot', fixed: true, x: base + h * 1.1, y: gy + h * 0.62, h: h * 0.95, facing: -1, phase: 4, ...S.ROBES.lot });
    const servants = o.servants == null ? 2 : o.servants;
    for (let i = 0; i < servants; i++) add({ kind: 'figure', name: 'servant', fixed: true, x: base + h * (1.7 + i * 0.7), y: gy + h * (0.35 + i * 0.2), h: h * 0.82, facing: -1, phase: 1 + i * 2.3, dark: 0.2, ...S.ROBES.servant });
    const flock = o.flock == null ? 7 : o.flock;
    sc.flock = [];
    for (let i = 0; i < flock; i++) sc.flock.push(add({ kind: 'sheep', fixed: true, x: base + h * (2.4 + (i % 4) * 0.55 + rand() * 0.3), y: gy + h * (0.15 + Math.floor(i / 4) * 0.35 + rand() * 0.25), h: h * 0.26, facing: -1, phase: rand() * 6, idx: i }));
    if (o.donkeys) for (let i = 0; i < o.donkeys; i++) add({ kind: 'donkey', fixed: true, x: base + h * (4.4 + i * 0.9), y: gy + h * 0.45, h: h * 0.62, facing: -1, phase: 3 + i });
    if (o.camels) for (let i = 0; i < o.camels; i++) add({ kind: 'camel', fixed: true, x: base + h * (5.2 + i * 1.1), y: gy + h * 0.62, h: h * 0.95, facing: -1, phase: 0.5 + i * 2 });
    if (o.oxen) for (let i = 0; i < o.oxen; i++) add({ kind: 'ox', fixed: true, x: base + h * (4.0 + i * 1.0), y: gy + h * 0.25, h: h * 0.6, facing: -1, phase: 1.5 + i });
    sc.actors.push(...A);
    sc.figH = h; sc.groundPx = gy;
    return A;
  };

  // hold-to-walk until scroll reaches target (world px). opts: {onProgress(frac), hint, minSpeed}
  S.walk = async function (sc, dist, opts) {
    opts = opts || {}; const E_ = E();
    const start = sc.scroll, id = E_.runId;
    E_.interactive = true;
    E_.hint(opts.hint || (E_.mobile ? 'געו והחזיקו כדי ללכת' : 'לחצו והחזיקו כדי ללכת'));
    const spd = (opts.speed || 1) * Math.max(120, Math.min(260, sc.W * 0.22));
    let hinted = true;
    while (sc.scroll - start < dist) {
      const holding = E_.pointer.down || E_.keys.Space || E_.keys.ArrowLeft || E_.keys.ArrowRight || E_.keys.KeyW || E_.keys.KeyA;
      sc.targetSpeed = holding ? 1 : 0;
      if (holding && hinted) { hinted = false; E_.hint(null); }
      sc.scroll += sc.speed * spd * E_.dt * (E_.speed > 1 ? E_.speed : 1);
      if (opts.onProgress) opts.onProgress(U.clamp((sc.scroll - start) / dist, 0, 1));
      await E_.nextFrame(); if (id !== E_.runId) throw E_.CANCEL;
    }
    sc.scroll = start + dist;
    sc.targetSpeed = 0;
    E_.interactive = false; E_.hint(null);
    await E_.until(() => sc.speed < 0.05, 1500);
  };

  // ---------- the Voice ----------
  S.voice = async function (sc, lines, o) {
    o = o || {}; const E_ = E(), A = Audio2;
    if (sc) { sc.lightTarget = o.light == null ? 1 : o.light; sc.lightWarm = o.warm !== false; }
    A.setShimmer(o.shimmer == null ? 0.6 : o.shimmer, 2.5); A.setChord(o.chord == null ? 0.3 : o.chord, 5);
    const ls = lines.map(l => typeof l === 'string' ? { t: l, cls: 'voice' } : Object.assign({ cls: 'voice' }, l));
    await E_.say(ls, { pos: o.pos || 'center', wait: o.wait || 'auto', rate: o.rate || 1.15, clear: o.clear, hold: o.hold });
    if (!o.keep) S.voiceOff(sc, o);
  };
  S.voiceOff = function (sc, o) {
    o = o || {};
    if (sc) sc.lightTarget = 0;
    Audio2.setShimmer(0, 4); Audio2.setChord(o.keepChord || 0, 5);
  };

  // ---------- altar building ----------
  S.buildAltar = async function (sc, o) {
    const E_ = E(), P = Paint, id = E_.runId;
    const n = o.count || 6;
    const s = o.s || U.clamp(sc.figH * 0.34, 22, 48);
    const ax = o.x, ay = o.y;
    const slots = P.altarSlots(ax, ay, s);
    const rand = U.rng(21);
    const pileX = o.pileX != null ? o.pileX : ax + s * 5.5, pileY = ay + s * 0.2;
    const stones = [];
    for (let i = 0; i < n; i++) stones.push({ x: pileX + (rand() - 0.5) * s * 2.6, y: pileY + (rand() - 0.5) * s * 1.2 + (i % 2) * s * 0.3, w: slots[i].w, h: slots[i].h, seed: 100 + i * 13, placed: false });
    const st = { placed: 0, drag: null, done: false, flame: 0 };
    const prop = { x: ax, y: ay + s * 0.5, depth: 0, fixed: true, draw(ctx, x, y, t) {
      ctx.save();
      ctx.fillStyle = 'rgba(25,12,0,0.22)'; ctx.beginPath(); ctx.ellipse(ax, ay + s * 0.3, s * 1.9, s * 0.3, 0, 0, U.TAU); ctx.fill();
      slots.forEach((sl, i) => { if (i < st.placed) P.stone(ctx, sl.x, sl.y, sl.w, sl.h, 100 + i * 13); });
      if (st.placed < n && !st.done) { // target hint
        const sl = slots[st.placed];
        ctx.strokeStyle = `rgba(255,240,200,${0.25 + 0.2 * Math.sin(t * 3)})`; ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(sl.x, sl.y, sl.w * 0.6, sl.h * 0.6, 0, 0, U.TAU); ctx.stroke(); ctx.setLineDash([]);
      }
      stones.forEach(stn => { if (!stn.placed && stn !== st.drag) P.stone(ctx, stn.x, stn.y, stn.w, stn.h, stn.seed); });
      if (st.drag) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 8; P.stone(ctx, st.drag.x, st.drag.y - 8, st.drag.w, st.drag.h, st.drag.seed); ctx.restore(); }
      if (st.flame > 0) P.flame(ctx, ax, ay - s * 1.45, s * 1.1, t, 3, st.flame);
      ctx.restore();
    } };
    sc.props.push(prop);
    sc.altarProp = prop; sc.altarState = st; sc.altarSlots = slots; sc.altarStones = stones;
    E_.interactive = true;
    E_.hint(o.hint || 'גררו את האבנים אל המזבח');
    const grab = 34 + s * 0.6;
    sc.down = p => { let best = null, bd = grab; stones.forEach(stn => { if (stn.placed) return; const d = U.dist(p.x, p.y, stn.x, stn.y); if (d < bd) { bd = d; best = stn; } }); if (best) { st.drag = best; st.ox = best.x - p.x; st.oy = best.y - p.y; } };
    sc.move = p => { if (st.drag) { st.drag.x = p.x + st.ox; st.drag.y = p.y + st.oy; } };
    sc.up = p => {
      const d = st.drag; if (!d) return; st.drag = null;
      const sl = slots[st.placed];
      if (U.dist(d.x, d.y, sl.x, sl.y) < s * 1.9) { d.placed = true; st.placed++; Audio2.drum('stone', 0.8); E_.hint(null); }
      else { d.x = pileX + (rand() - 0.5) * s * 2.4; d.y = pileY + (rand() - 0.5) * s; }
    };
    await E_.until(() => st.placed >= n);
    if (id !== E_.runId) throw E_.CANCEL;
    st.done = true; sc.down = sc.move = sc.up = null;
    E_.interactive = false; E_.hint(null);
    return st;
  };

  // helper: animate a numeric property of an object over ms (linear/eased)
  S.tween = async function (obj, key, to, ms, ease) {
    const E_ = E(), id = E_.runId; const from = obj[key]; const t0 = performance.now(); ms = ms / E_.speed;
    while (true) {
      const k = Math.min(1, (performance.now() - t0) / ms);
      obj[key] = from + (to - from) * (ease ? ease(k) : U.smooth(k));
      if (k >= 1) break;
      await E_.nextFrame(); if (id !== E_.runId) throw E_.CANCEL;
    }
  };

  window.Scenes = S;
})();

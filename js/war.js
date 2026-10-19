/* war.js — פרק ב: המלחמה להצלת לוט (מסע, חלוקה בלילה, רדיפה וחיפוש, מלכי־צדק והשבועה) */
'use strict';
(function () {
  const E = Engine, S = Scenes, P = Paint, A = Audio2;
  const st = { sc: null, kind: null };
  const spd = () => Math.max(1, E.speed);
  const V = (t, ref, hold) => ({ t, cls: 'verse', ref, hold });
  const allies = () => E.save.choices.allies !== 'alone';

  // =====================================================================
  //  the painted map (top-down): Hebron in the south, Dan in the north
  // =====================================================================
  const ROUTES = {
    common: [[0.5, 0.88], [0.52, 0.79], [0.53, 0.705], [0.56, 0.59]],
    hill: [[0.56, 0.59], [0.515, 0.5], [0.5, 0.42], [0.55, 0.33], [0.6, 0.225]],
    valley: [[0.56, 0.59], [0.64, 0.53], [0.675, 0.45], [0.665, 0.34], [0.6, 0.225]],
    enemy: [[0.56, 0.59], [0.64, 0.53], [0.675, 0.45], [0.665, 0.34], [0.6, 0.225]],
    pursuit: [[0.6, 0.225], [0.66, 0.165], [0.73, 0.1], [0.74, 0.06]],
    flee: [[0.6, 0.225], [0.67, 0.16], [0.75, 0.1], [0.8, 0.045]],
  };
  const LABELS = [['חברון', 0.5, 0.88, 1], ['שָׁלֵם', 0.52, 0.79, 1], ['בית־אל', 0.53, 0.705, 1], ['שכם', 0.56, 0.59, 1], ['דן', 0.6, 0.225, 1], ['דמשק', 0.76, 0.12, 0], ['חובה', 0.74, 0.06, 0], ['סדום', 0.615, 0.86, 0], ['ים המלח', 0.645, 0.78, 0], ['הירדן', 0.675, 0.6, 0], ['הים הגדול', 0.04, 0.5, 0]];

  function geo(W, H) {
    const mh = H, mw = Math.min(W, H * 1.15);
    return { ox: (W - mw) / 2, mw, mh, m: Math.min(W, H) };
  }
  function mapImage(W, H) {
    const g = geo(W, H);
    return P.cache('warmap', W, H, (cx, w, h) => {
      const X = u => g.ox + u * g.mw, Y = v => v * g.mh;
      const r = U.rng(44);
      // parchment ground
      let grd = cx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, U.col([38, 28, 58])); grd.addColorStop(1, U.col([35, 30, 50]));
      cx.fillStyle = grd; cx.fillRect(0, 0, w, h);
      cx.save(); cx.globalAlpha = 0.5; cx.globalCompositeOperation = 'overlay'; cx.fillStyle = cx.createPattern(P.blotch(7, 256), 'repeat'); cx.fillRect(0, 0, w, h); cx.restore();
      // sea to the west
      cx.beginPath(); cx.moveTo(0, 0);
      for (let v = 0; v <= 1.001; v += 0.02) { const u = 0.16 + 0.025 * Math.sin(v * 6 + 1) - v * 0.09; cx.lineTo(X(u), Y(v)); }
      cx.lineTo(0, h); cx.closePath();
      grd = cx.createLinearGradient(0, 0, X(0.16), 0); grd.addColorStop(0, U.col([203, 30, 34])); grd.addColorStop(1, U.col([200, 30, 44]));
      cx.fillStyle = grd; cx.fill();
      cx.save(); cx.clip(); cx.strokeStyle = 'rgba(230,240,255,0.08)'; cx.lineWidth = 1;
      for (let i = 0; i < 160; i++) { const y = r() * h, x = r() * X(0.22); cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + 20 + r() * 60, y); cx.stroke(); }
      cx.restore();
      // highlands: soft dark blobs along the spine, rift valley, Hermon
      const blob = (u, v, ru, rv, col, a) => { const gg = cx.createRadialGradient(X(u), Y(v), 0, X(u), Y(v), Math.max(ru * g.mw, rv * g.mh)); gg.addColorStop(0, U.col(col, a)); gg.addColorStop(1, U.col(col, 0)); cx.save(); cx.translate(X(u), Y(v)); cx.scale(ru * g.mw / Math.max(ru * g.mw, rv * g.mh), rv * g.mh / Math.max(ru * g.mw, rv * g.mh)); cx.translate(-X(u), -Y(v)); cx.fillStyle = gg; cx.beginPath(); cx.arc(X(u), Y(v), Math.max(ru * g.mw, rv * g.mh), 0, U.TAU); cx.fill(); cx.restore(); };
      for (let i = 0; i < 90; i++) { const v = 0.28 + r() * 0.66, u = 0.47 + (r() - 0.5) * 0.22 + (v < 0.4 ? 0.06 : 0); blob(u, v, 0.05 + r() * 0.06, 0.03 + r() * 0.03, [30, 26, 36], 0.3); }
      for (let i = 0; i < 40; i++) { const v = 0.28 + r() * 0.66, u = 0.45 + (r() - 0.5) * 0.12; blob(u, v, 0.03 + r() * 0.03, 0.015 + r() * 0.02, [36, 30, 62], 0.3); }
      for (let i = 0; i < 30; i++) { const v = 0.36 + r() * 0.4; blob(0.66 + (r() - 0.5) * 0.04, v, 0.03, 0.03, [90, 22, 40], 0.3); }
      blob(0.655, 0.17, 0.09, 0.06, [220, 12, 82], 0.55); blob(0.655, 0.165, 0.05, 0.035, [220, 10, 92], 0.5);
      for (let i = 0; i < 25; i++) blob(0.74 + r() * 0.22, 0.05 + r() * 0.2, 0.05, 0.03, [45, 30, 66], 0.3);
      for (let i = 0; i < 25; i++) blob(0.12 + r() * 0.3, 0.6 + r() * 0.35, 0.05, 0.03, [42, 34, 66], 0.3);
      // hatch strokes for hills
      cx.strokeStyle = 'rgba(20,15,10,0.14)'; cx.lineWidth = 1;
      for (let i = 0; i < 700; i++) { const v = 0.26 + r() * 0.68, u = 0.47 + (r() - 0.5) * 0.24; const x = X(u), y = Y(v); cx.beginPath(); cx.moveTo(x - 4 - r() * 6, y + 3); cx.lineTo(x + 4 + r() * 6, y - 3); cx.stroke(); }
      // waters
      const water = [205, 42, 30];
      cx.fillStyle = U.col(water);
      cx.beginPath(); cx.ellipse(X(0.615), Y(0.8), g.mw * 0.028, g.mh * 0.075, 0.08, 0, U.TAU); cx.fill();
      cx.beginPath(); cx.ellipse(X(0.675), Y(0.36), g.mw * 0.022, g.mh * 0.03, 0, 0, U.TAU); cx.fill();
      cx.strokeStyle = U.col(water); cx.lineWidth = Math.max(2, g.mw * 0.006); cx.lineCap = 'round';
      cx.beginPath(); cx.moveTo(X(0.675), Y(0.39)); for (let v = 0.39; v <= 0.73; v += 0.02) cx.lineTo(X(0.665 + 0.012 * Math.sin(v * 40) - (v - 0.39) * 0.12), Y(v)); cx.stroke();
      cx.beginPath(); cx.moveTo(X(0.6), Y(0.225)); cx.quadraticCurveTo(X(0.64), Y(0.28), X(0.672), Y(0.335)); cx.stroke();
      // routes, faint
      cx.setLineDash([3, 7]); cx.strokeStyle = 'rgba(60,40,20,0.35)'; cx.lineWidth = 1.2;
      ['common', 'hill', 'valley', 'pursuit'].forEach(k => { const pts = ROUTES[k]; cx.beginPath(); pts.forEach((p, i) => i ? cx.lineTo(X(p[0]), Y(p[1])) : cx.moveTo(X(p[0]), Y(p[1]))); cx.stroke(); });
      cx.setLineDash([]);
      // places
      LABELS.forEach(([name, u, v, dot]) => {
        if (dot) { cx.fillStyle = 'rgba(40,25,10,0.8)'; cx.beginPath(); cx.arc(X(u), Y(v), 3, 0, U.TAU); cx.fill(); }
        P.label(cx, name, X(u) + (dot ? -10 : 0), Y(v) + (dot ? -2 : 0), Math.max(12, Math.min(17, g.mw * 0.028)), 'rgba(45,28,12,0.85)', dot ? 'right' : 'center', 500);
      });
      // parchment edge
      P.vignette(cx, w, h, 0.55);
      cx.save(); cx.globalAlpha = 0.18; cx.globalCompositeOperation = 'overlay'; cx.fillStyle = cx.createPattern(P.noiseTile(), 'repeat'); cx.fillRect(0, 0, w, h); cx.restore();
    });
  }
  function polyline(pts, g) {
    const px = pts.map(p => ({ x: g.ox + p[0] * g.mw, y: p[1] * g.mh }));
    const cum = [0]; for (let i = 1; i < px.length; i++) cum.push(cum[i - 1] + U.dist(px[i - 1].x, px[i - 1].y, px[i].x, px[i].y));
    return { px, cum, L: cum[cum.length - 1] };
  }
  function along(pl, d) {
    d = U.clamp(d, 0, pl.L); let i = 1; while (i < pl.cum.length - 1 && pl.cum[i] < d) i++;
    const a = pl.px[i - 1], b = pl.px[i], seg = pl.cum[i] - pl.cum[i - 1]; const k = seg > 0 ? (d - pl.cum[i - 1]) / seg : 0;
    return { x: U.lerp(a.x, b.x, k), y: U.lerp(a.y, b.y, k), ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }
  function drawColumn(ctx, x, y, ang, n, col, s, torch, t, seed) {
    const r = U.rng(seed || 3);
    const dx = Math.cos(ang), dy = Math.sin(ang);
    if (torch > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; P.glow(ctx, x, y, s * 9, 'rgba(255,170,80,1)', 0.25 * torch, 0.3); ctx.restore(); }
    for (let i = 0; i < n; i++) {
      const back = -(i % 5) * s * 1.6 - r() * s * 0.6, side = (Math.floor(i / 5) - (Math.ceil(n / 5) - 1) / 2) * s * 1.5 + (r() - 0.5) * s;
      const px = x + dx * back - dy * side, py = y + dy * back + dx * side;
      ctx.fillStyle = U.col(col, 0.9); ctx.beginPath(); ctx.arc(px, py, s * 0.55, 0, U.TAU); ctx.fill();
      if (torch > 0 && i % 4 === 0) { ctx.fillStyle = `rgba(255,210,120,${0.7 * torch})`; ctx.beginPath(); ctx.arc(px + s * 0.3, py - s * 0.4, s * 0.25 + 0.2 * Math.sin(t * 9 + i), 0, U.TAU); ctx.fill(); }
    }
  }
  function nightOverlay(ctx, W, H, k) {
    if (k <= 0.002) return;
    ctx.save(); ctx.fillStyle = `rgba(8,10,30,${0.72 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  // ---------- phase 1: the march ----------
  function marchScene() {
    const sc = {
      kind: 'map', t: 0, time: 0, day: 64, pos: 0, pace: 'slow', stamina: 1, resting: false, running: false, paused: false,
      result: null, needFork: false, forkDone: false, terrainK: 1, night: 0, enemyU: 0, trail: [],
      init(W, H) { this.W = W; this.H = H; this.g = geo(W, H); this.setRoute(); },
      setRoute() {
        const pts = ROUTES.common.concat(this.branch ? ROUTES[this.branch].slice(1) : []);
        this.pl = polyline(pts, this.g); this.forkAt = polyline(ROUTES.common, this.g).L; this.enemyPl = polyline(ROUTES.enemy, this.g);
        this.Lref = polyline(ROUTES.common.concat(ROUTES.valley.slice(1)), this.g).L;
      },
      update(dt) {
        this.t += dt;
        if (!this.running || this.paused) return;
        dt *= spd();
        this.time += dt;
        const rates = { slow: 1 / 78, fast: 1 / 52, sprint: 1 / 36, rest: 0 };
        const drains = { slow: 0.02, fast: -0.03, sprint: -0.075, rest: 0.085 * (allies() ? 1.6 : 1) };
        let pace = this.pace;
        if (this.resting) { pace = 'rest'; if (this.stamina >= 0.5) { this.resting = false; this.pace = 'slow'; pace = 'slow'; if (this.onPace) this.onPace(); } }
        const d = drains[pace]; this.stamina = U.clamp(this.stamina + (d < 0 ? d * this.terrainK : d) * dt, 0, 1);
        if (this.stamina <= 0 && !this.resting) { this.resting = true; A.drum('deep', 0.5); if (this.onPace) this.onPace(); }
        this.pos += rates[pace] * this.Lref * dt;
        this.night = U.smooth(U.clamp((this.time / this.day - 0.5) / 0.4, 0, 1));
        if (this.night > 0.35 && this.pace === 'sprint') { this.pace = 'fast'; if (this.onPace) this.onPace(); }
        this.enemyU = Math.min(1, this.time / (this.day * 0.55));
        if (!this.forkDone) { if (this.pos >= this.forkAt) { this.pos = this.forkAt; this.paused = true; this.needFork = true; } }
        else if (this.pos >= this.pl.L) { this.pos = this.pl.L; this.result = 'win'; this.running = false; }
        if (!this.result && this.time >= this.day) { this.result = 'lose'; this.running = false; }
        if (this.onTick) this.onTick();
      },
      draw(ctx, W, H, t) {
        const g = this.g, px = E.par.x * 6, py = E.par.y * 4;
        ctx.drawImage(mapImage(W, H), -px, -py);
        const s = Math.max(2.2, g.m * 0.006);
        // the enemy column with its captives, then its camp at Dan
        const e = along(this.enemyPl, this.enemyU * this.enemyPl.L);
        if (this.enemyU < 1) { drawColumn(ctx, e.x - px, e.y - py, e.ang, 18, [355, 40, 38], s, 0, t, 5); drawColumn(ctx, e.x - px - Math.cos(e.ang) * s * 7, e.y - py - Math.sin(e.ang) * s * 7, e.ang, 10, [40, 20, 70], s * 0.8, 0, t, 6); }
        // the player's column
        const p = along(this.pl, this.pos);
        drawColumn(ctx, p.x - px, p.y - py, p.ang, allies() ? 18 : 14, [36, 55, 80], s, this.night, t, 3);
        nightOverlay(ctx, W, H, this.night);
        if (this.enemyU >= 1) { // camp fires at Dan, seen from afar
          const d = along(this.enemyPl, this.enemyPl.L); ctx.save(); ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 5; i++) { const a = i * 1.3, rr = s * (2 + (i % 3)); P.glow(ctx, d.x - px + Math.cos(a) * rr, d.y - py + Math.sin(a) * rr * 0.7, s * 6, 'rgba(255,160,70,1)', 0.35 + 0.1 * Math.sin(t * 5 + i), 0.3); }
          ctx.restore();
        }
        if (this.night > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; P.glow(ctx, p.x - px, p.y - py, s * 14, 'rgba(255,170,80,1)', 0.3 * this.night, 0.25); ctx.restore(); }
        // the sun / moon of the day
        const dk = U.clamp(this.time / this.day, 0, 1);
        const sx = W * 0.5 + Math.cos(Math.PI * (1 - dk)) * Math.min(W * 0.42, H * 0.5), sy = H * 0.1 - Math.sin(Math.PI * (1 - dk)) * H * 0.06 + H * 0.03;
        ctx.save(); ctx.globalAlpha = 0.9 - this.night * 0.5; P.disc(ctx, sx, sy, Math.max(6, g.m * 0.012), this.night > 0.5 ? ['#f4f0e0', '#c8c6c0'] : ['#fff4d0', '#f2c070'], this.night > 0.5 ? 'rgba(220,225,255,1)' : 'rgba(255,200,120,1)', 0.25); ctx.restore();
      },
      test() { return { kind: 'march', stamina: this.stamina, resting: this.resting, time: this.time, pos: this.pos / this.Lref, night: this.night, fork: this.forkDone }; },
    };
    return sc;
  }
  function paceHud(sc) {
    E.hud('<div class="k"><span>כוח האנשים</span><div class="bar" id="w-sb"><i id="w-stam" style="width:100%"></i></div></div>' +
      '<div class="k"><span>היום</span><div class="bar"><i id="w-day" style="width:100%"></i></div></div>' +
      '<div class="k"><span>קצב</span><div class="pace"><button data-p="slow" class="on">מתון</button><button data-p="fast">מהיר</button><button data-p="sprint">דהירה</button></div></div>');
    const stam = E.el('w-stam'), day = E.el('w-day'), sb = E.el('w-sb');
    const btns = Array.from(document.querySelectorAll('#hud .pace button'));
    btns.forEach(b => b.addEventListener('click', () => { if (b.disabled || sc.resting) return; sc.pace = b.dataset.p; sc.onPace(); A.pluck(A.scale[b.dataset.p === 'sprint' ? 9 : b.dataset.p === 'fast' ? 7 : 4], 0.25); }));
    sc.onPace = () => { btns.forEach(b => { b.classList.toggle('on', b.dataset.p === sc.pace && !sc.resting); b.disabled = sc.resting || (b.dataset.p === 'sprint' && sc.night > 0.35); }); };
    sc.onTick = () => { stam.style.width = (sc.stamina * 100) + '%'; day.style.width = Math.max(0, 100 - sc.time / sc.day * 100) + '%'; sb.classList.toggle('red', sc.stamina < 0.25); };
    sc.onPace();
  }

  // ---------- phase 2: the night, dividing the force ----------
  function nightScene(N) {
    const sc = {
      kind: 'night', N, t: 0, units: [], fires: [], sentries: [], tents: [], zones: [], alarm: 0, running: false, result: null, drag: null, struck: 0,
      init(W, H) {
        this.W = W; this.H = H; const m = this.m = Math.min(W, H * 0.8);
        const C = this.C = { x: W / 2, y: H * 0.43 }; const rc = this.rc = m * 0.2;
        const r = U.rng(91);
        this.tents = []; for (let i = 0; i < 9; i++) { const a = r() * U.TAU, d = rc * (0.25 + r() * 0.65); this.tents.push({ x: C.x + Math.cos(a) * d, y: C.y + Math.sin(a) * d * 0.85, s: m * (0.035 + r() * 0.015), a: r() * U.TAU }); }
        this.fires = [0, 1, 2, 3].map(i => { const a = i * U.TAU / 4 + 0.6; const d = rc * 0.55; return { x: C.x + Math.cos(a) * d, y: C.y + Math.sin(a) * d * 0.85, R: m * 0.21, ph: i * 0.35, b: 1 }; });
        this.sentries = [0, 1, 2].map(i => { const a0 = i * U.TAU / 3, a1 = a0 + 1.2; return { a0, a1, rad: rc * 1.12, R: m * 0.085, ph: i * 2.1, x: 0, y: 0 }; });
        const zr = rc * 1.75;
        this.zones = []; for (let i = 0; i < N; i++) { const a = -Math.PI / 2 + i * U.TAU / N; this.zones.push({ x: C.x + Math.cos(a) * zr, y: C.y + Math.sin(a) * zr * 0.9, R: m * 0.075 }); }
        if (!this.units.length) for (let i = 0; i < N; i++) this.units.push({ x: W * (0.5 + (i - (N - 1) / 2) * 0.2), y: H * 0.88, R: m * 0.03, home: i, zone: -1, exposure: 0 });
        this.units.forEach((u, i) => { if (u.zone < 0 && !this.running) { u.x = W * (0.5 + (i - (N - 1) / 2) * 0.2); u.y = H * 0.88; } });
      },
      avgB() { return this.fires.reduce((a, f) => a + f.b, 0) / this.fires.length; },
      placedCount() { const z = new Set(); this.units.forEach(u => { if (u.zone >= 0) z.add(u.zone); }); return z.size; },
      update(dt) {
        this.t += dt; const T = this.t * Math.min(spd(), 3);
        this.fires.forEach(f => { f.b = 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(T * 0.27 + f.ph), 1.4); if (this.out) f.b = Math.max(0, f.b - this.outK); });
        this.sentries.forEach(s => { const k = 0.5 + 0.5 * Math.sin(T * 0.45 + s.ph); const a = U.lerp(s.a0, s.a1, k); s.x = this.C.x + Math.cos(a) * s.rad; s.y = this.C.y + Math.sin(a) * s.rad * 0.85; });
        if (!this.running) return;
        let exp = 0;
        this.units.forEach(u => {
          let e = 0;
          this.fires.forEach(f => { const rr = f.R * f.b; const d = U.dist(u.x, u.y, f.x, f.y); if (d < rr) e = Math.max(e, 1 - d / rr); });
          this.sentries.forEach(s => { const d = U.dist(u.x, u.y, s.x, s.y); if (d < s.R + u.R) e = Math.max(e, 1 - d / (s.R + u.R)); });
          u.exposure = e; exp = Math.max(exp, e);
          u.zone = -1; this.zones.forEach((z, i) => { if (U.dist(u.x, u.y, z.x, z.y) < z.R + u.R * 0.5) u.zone = i; });
        });
        if (exp > 0) this.alarm = Math.min(1, this.alarm + dt * spd() * exp * 0.55); else this.alarm = Math.max(0, this.alarm - dt * spd() * 0.07);
        if (this.alarm >= 1 && !this.result) { this.result = 'detected'; this.running = false; }
        if (this.onTick) this.onTick();
      },
      draw(ctx, W, H, t) {
        const m = this.m, C = this.C;
        ctx.fillStyle = '#0a0b16'; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.globalAlpha = 0.4; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(P.blotch(9, 256), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
        // ground around the camp, trampled
        let g = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, this.rc * 2.2); g.addColorStop(0, 'rgba(60,48,40,0.35)'); g.addColorStop(1, 'rgba(60,48,40,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        // fire light on the ground
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        this.fires.forEach((f, i) => { const rr = f.R * f.b; if (rr > 1) P.glow(ctx, f.x, f.y, rr, 'rgba(255,150,60,1)', 0.22 + 0.05 * Math.sin(t * 7 + i), 0.15); });
        ctx.restore();
        // tents (top-down: dark rounded shapes)
        this.tents.forEach(tn => { ctx.save(); ctx.translate(tn.x, tn.y); ctx.rotate(tn.a); const gg = ctx.createLinearGradient(-tn.s, 0, tn.s, 0); gg.addColorStop(0, U.col([25, 22, 18])); gg.addColorStop(0.5, U.col([25, 24, 30])); gg.addColorStop(1, U.col([25, 22, 14])); ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(0, 0, tn.s, tn.s * 0.7, 0, 0, U.TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.moveTo(-tn.s, 0); ctx.lineTo(tn.s, 0); ctx.stroke(); ctx.restore(); });
        // fires themselves
        this.fires.forEach((f, i) => { if (f.b > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; P.glow(ctx, f.x, f.y, m * 0.03, 'rgba(255,200,110,1)', 0.9 * f.b, 0.3); ctx.restore(); } });
        // sentries with their small torches
        this.sentries.forEach(s => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; P.glow(ctx, s.x, s.y, s.R, 'rgba(255,170,80,1)', 0.3, 0.2); ctx.restore(); ctx.fillStyle = U.col([355, 30, 30]); ctx.beginPath(); ctx.arc(s.x, s.y, m * 0.011, 0, U.TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,220,150,0.9)'; ctx.beginPath(); ctx.arc(s.x + m * 0.008, s.y - m * 0.01, m * 0.005, 0, U.TAU); ctx.fill(); });
        // zones
        this.zones.forEach((z, i) => { const taken = this.units.some(u => u.zone === i); ctx.save(); ctx.setLineDash([5, 7]); ctx.strokeStyle = taken ? 'rgba(241,217,154,0.7)' : `rgba(239,227,204,${0.25 + 0.12 * Math.sin(t * 2 + i)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(z.x, z.y, z.R, 0, U.TAU); ctx.stroke(); ctx.restore(); });
        // our units
        this.units.forEach((u, i) => {
          const hot = u.exposure > 0.01;
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; P.glow(ctx, u.x, u.y, u.R * 2.4, hot ? 'rgba(255,120,90,1)' : 'rgba(150,180,255,1)', hot ? 0.35 : 0.18, 0.3); ctx.restore();
          const r = U.rng(21 + i); for (let k = 0; k < 9; k++) { const a = r() * U.TAU, d = r() * u.R * 0.8; ctx.fillStyle = U.col([215, 25, 78], 0.95); ctx.beginPath(); ctx.arc(u.x + Math.cos(a) * d, u.y + Math.sin(a) * d * 0.8, Math.max(1.5, m * 0.006), 0, U.TAU); ctx.fill(); }
          ctx.strokeStyle = `rgba(239,227,204,${this.drag && this.drag.u === u ? 0.9 : 0.45})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(u.x, u.y, u.R, 0, U.TAU); ctx.stroke();
          P.label(ctx, ['א', 'ב', 'ג', 'ד'][i], u.x, u.y - u.R - 10, Math.max(12, m * 0.028), 'rgba(239,227,204,0.85)');
        });
        // the alarm, if any
        if (this.alarm > 0.02) { ctx.save(); ctx.fillStyle = `rgba(120,20,20,${this.alarm * 0.25})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
        P.vignette(ctx, W, H, 0.6);
      },
      down(p) { let best = null, bd = this.m * 0.07; this.units.forEach(u => { const d = U.dist(p.x, p.y, u.x, u.y); if (d < bd) { bd = d; best = u; } }); if (best && this.running) { this.drag = { u: best, ox: best.x - p.x, oy: best.y - p.y }; } },
      move(p) { if (this.drag) { this.drag.u.x = U.clamp(p.x + this.drag.ox, 20, this.W - 20); this.drag.u.y = U.clamp(p.y + this.drag.oy, 20, this.H - 20); } },
      up() { if (this.drag) { A.drum('stone', 0.3); this.drag = null; } },
      test() {
        const free = this.units.find(u => u.zone < 0 && !this.drag);
        const freeZones = this.zones.map((z, i) => i).filter(i => !this.units.some(u => u.zone === i));
        let unit = null;
        if (free && freeZones.length && this.running) { const z = this.zones[freeZones[0]]; const side = z.x < this.C.x ? -1 : 1; unit = { x: free.x, y: free.y, tx: z.x + side * this.m * 0.01, ty: z.y }; }
        const f = this.fires[0];
        return { kind: 'night', unit, placed: this.units.filter(u => u.zone >= 0).map(u => ({ x: u.x, y: u.y })), fire: { x: f.x, y: f.y }, dim: this.avgB() < 0.5, alarm: this.alarm, avg: this.avgB() };
      },
    };
    return sc;
  }

  // ---------- phase 2b: the skirmish ----------
  function skirmishScene(total) {
    const sc = {
      kind: 'skirmish', total, kills: 0, morale: 3, t: 0, enemies: [], flashes: [], spawnT: 1.2, spawned: 0, running: false, result: null, ringFlash: 0,
      init(W, H) { this.W = W; this.H = H; this.m = Math.min(W, H); this.C = { x: W / 2, y: H * 0.47 }; this.Rr = this.m * 0.24; },
      spawn() {
        const a = Math.random() * U.TAU; const far = Math.hypot(this.W, this.H) * 0.55;
        const charger = Math.random() < 0.3 && this.spawned > 2;
        this.enemies.push({ x: this.C.x + Math.cos(a) * far, y: this.C.y + Math.sin(a) * far, v: this.m * (charger ? 0.19 : 0.11) * (0.9 + Math.random() * 0.3), charger, alive: true, k: 0, swing: -1, hit: 0 });
        this.spawned++;
      },
      update(dt) {
        this.t += dt; if (!this.running) return;
        this.ringFlash = Math.max(0, this.ringFlash - dt * 3);
        this.spawnT -= dt;
        const alive = this.enemies.filter(e => e.alive).length;
        if (this.spawnT <= 0 && this.spawned < this.total && alive < 3) { this.spawn(); this.spawnT = Math.max(0.55, 1.5 - this.spawned * 0.04); }
        this.enemies.forEach(e => {
          if (!e.alive) { e.k += dt * 2.2; return; }
          const d = U.dist(e.x, e.y, this.C.x, this.C.y);
          if (e.charger && d < this.Rr && e.swing < 0) { e.swing = 0.75; A.drum('hit', 0.5); }
          if (e.swing >= 0) { e.swing -= dt; if (e.swing <= 0) { this.breach(e); } return; }
          const sp = e.v * dt; e.x += (this.C.x - e.x) / d * sp; e.y += (this.C.y - e.y) / d * sp;
          if (d < this.m * 0.05) this.breach(e);
        });
        this.enemies = this.enemies.filter(e => e.alive || e.k < 1);
        this.flashes = this.flashes.filter(f => (f.k += dt * 3) < 1);
        if (this.kills >= this.total) { this.result = 'win'; this.running = false; }
        if (this.onTick) this.onTick();
      },
      breach(e) { e.alive = false; e.k = 0; this.morale--; A.drum('deep', 0.9); this.flashes.push({ x: this.C.x, y: this.C.y, k: 0, red: true }); if (this.morale <= 0) { this.result = 'lose'; this.running = false; } },
      strike(p) {
        if (!this.running) return;
        let best = null, bd = E.mobile ? this.m * 0.085 : this.m * 0.07;
        this.enemies.forEach(e => { if (!e.alive) return; const d = U.dist(p.x, p.y, e.x, e.y); if (d < bd) { bd = d; best = e; } });
        if (!best) { A.drum('whoosh', 0.3); return; }
        if (U.dist(best.x, best.y, this.C.x, this.C.y) > this.Rr) { this.ringFlash = 1; A.drum('whoosh', 0.35); return; }
        best.alive = false; best.k = 0; this.kills++; A.drum('clash', 0.9); this.flashes.push({ x: best.x, y: best.y, k: 0 });
      },
      tap(p) { if (!E.mobile) this.strike(p); },
      down(p) { if (E.mobile) this.strike(p); },
      draw(ctx, W, H, t) {
        const m = this.m, C = this.C;
        ctx.fillStyle = '#0a0b16'; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.globalAlpha = 0.4; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(P.blotch(9, 256), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; P.glow(ctx, C.x, C.y, this.Rr * 1.5, 'rgba(255,160,70,1)', 0.28, 0.2); ctx.restore();
        // the ring
        ctx.save(); ctx.strokeStyle = `rgba(241,217,154,${0.25 + this.ringFlash * 0.6})`; ctx.lineWidth = 1.5 + this.ringFlash * 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.arc(C.x, C.y, this.Rr, 0, U.TAU); ctx.stroke(); ctx.restore();
        // our men
        const r = U.rng(5); for (let k = 0; k < 24; k++) { const a = r() * U.TAU, d = r() * m * 0.05; ctx.fillStyle = U.col([215, 25, 78]); ctx.beginPath(); ctx.arc(C.x + Math.cos(a) * d, C.y + Math.sin(a) * d * 0.8, Math.max(1.8, m * 0.007), 0, U.TAU); ctx.fill(); }
        // enemies
        this.enemies.forEach(e => {
          ctx.save();
          if (!e.alive) ctx.globalAlpha = 1 - e.k;
          const s = m * 0.023;
          if (e.charger && e.alive) { ctx.globalCompositeOperation = 'lighter'; P.glow(ctx, e.x, e.y, s * 4, 'rgba(255,80,60,1)', e.swing >= 0 ? 0.6 + 0.3 * Math.sin(t * 30) : 0.3, 0.3); ctx.globalCompositeOperation = 'source-over'; }
          ctx.fillStyle = U.col([355, 28, e.alive ? 34 : 14]); ctx.beginPath(); ctx.ellipse(e.x, e.y, s * 1.1, s * 0.75, Math.atan2(C.y - e.y, C.x - e.x), 0, U.TAU); ctx.fill();
          ctx.fillStyle = U.col([30, 25, 40]); ctx.beginPath(); ctx.arc(e.x, e.y, s * 0.42, 0, U.TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,200,120,0.9)'; ctx.beginPath(); ctx.arc(e.x + s * 0.8, e.y - s * 0.6, s * 0.22, 0, U.TAU); ctx.fill();
          if (e.swing >= 0) { ctx.strokeStyle = `rgba(255,120,90,${0.5 + 0.5 * Math.sin(t * 25)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, s * 2.2, 0, U.TAU * (e.swing / 0.75)); ctx.stroke(); }
          ctx.restore();
        });
        this.flashes.forEach(f => { ctx.save(); ctx.globalAlpha = 1 - f.k; ctx.strokeStyle = f.red ? 'rgba(255,90,70,0.9)' : 'rgba(255,245,220,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, m * 0.03 + f.k * m * (f.red ? 0.3 : 0.06), -0.6, 1.2); ctx.stroke(); ctx.restore(); });
        if (this.morale < 3) { ctx.fillStyle = `rgba(110,20,20,${(3 - this.morale) * 0.08})`; ctx.fillRect(0, 0, W, H); }
        P.vignette(ctx, W, H, 0.6);
      },
      test() {
        let best = null, bd = 1e9; this.enemies.forEach(e => { if (!e.alive) return; const d = U.dist(e.x, e.y, this.C.x, this.C.y); if (d < this.Rr * 0.95 && d < bd) { bd = d; best = e; } });
        return { kind: 'skirmish', target: best ? { x: best.x, y: best.y } : null, kills: this.kills, morale: this.morale };
      },
    };
    return sc;
  }

  // ---------- phase 3b: the search by torchlight ----------
  function searchScene() {
    const sc = S.landscape(S.pal.night);
    sc.kind = 'search'; sc.torch = { x: 0, y: 0, tx: 0, ty: 0, oil: 1, on: true }; sc.items = []; sc.running = false; sc.result = null; sc.foundN = 0;
    sc.onInit = (W, H) => {
      const h = sc.figH = U.clamp(H * 0.2, 76, 160), gy = sc.groundPx = sc.pal.groundY * H;
      sc.R = Math.max(110, Math.min(W, H) * 0.24);
      if (!sc.items.length) {
        const r = U.rng(123);
        const cols = W < 700 ? 3 : 6, rows = 2;
        const cells = []; for (let i = 0; i < cols * rows; i++) cells.push(i);
        U.shuffle(cells, r);
        const kinds = ['lot', 'women', 'goods', 'goods', 'captive', 'captive', 'captive', 'captive', 'sheep', 'tent', 'captive', 'sheep'];
        kinds.slice(0, cols * rows).forEach((kind, i) => {
          const c = cells[i]; const cx = W * (0.08 + ((c % cols) + 0.5) / cols * 0.84) + (r() - 0.5) * W * 0.04, row = Math.floor(c / cols);
          const y = gy + h * (0.15 + row * 0.42) + (r() - 0.5) * h * 0.1;
          sc.items.push({ kind, x: cx, y, found: false, seed: 300 + i, tried: false });
        });
        sc.items.forEach(it => {
          if (it.kind === 'tent') sc.props.push({ x: it.x, y: it.y, depth: 0, draw(ctx, x, y) { P.tent(ctx, { x, y, w: h * 1.3, h: h * 0.7, color: [350, 12, 16] }); } });
          else if (it.kind === 'goods') sc.props.push({ x: it.x, y: it.y, depth: 0, draw(ctx, x, y) { const rr = U.rng(it.seed); for (let k = 0; k < 5; k++) P.stone(ctx, x + (rr() - 0.5) * h * 0.6, y - k * h * 0.07 - rr() * h * 0.08, h * (0.22 + rr() * 0.12), h * 0.16, it.seed + k, [32, 38, 42]); ctx.fillStyle = U.col([25, 35, 30]); ctx.beginPath(); ctx.ellipse(x + h * 0.32, y - h * 0.12, h * 0.07, h * 0.13, 0, 0, U.TAU); ctx.fill(); } });
          else if (it.kind === 'sheep') sc.actors.push({ kind: 'sheep', fixed: true, still: true, x: it.x, y: it.y, h: h * 0.26, facing: it.seed % 2 ? 1 : -1 });
          else if (it.kind === 'women') [0, 1, 2].forEach(k => sc.actors.push({ kind: 'figure', fixed: true, still: true, x: it.x + (k - 1) * h * 0.3, y: it.y + (k % 2) * h * 0.08, h: h * 0.78, veil: true, facing: k % 2 ? 1 : -1, bow: 0.25, dark: 0.35, robe: [200 + k * 30, 20, 30], cloth: [40, 20, 70] }));
          else if (it.kind === 'lot') sc.actors.push({ kind: 'figure', fixed: true, still: true, x: it.x, y: it.y, h: h * 0.9, facing: -1, bow: 0.45, dark: 0.3, ...S.ROBES.lot });
          else sc.actors.push({ kind: 'figure', fixed: true, still: true, x: it.x, y: it.y, h: h * 0.85, facing: it.seed % 2 ? 1 : -1, bow: 0.4, dark: 0.45, robe: [20 + (it.seed * 37) % 40, 18, 30], cloth: [30, 15, 50] });
        });
      }
      if (!sc.torch.x) { sc.torch.x = sc.torch.tx = W * 0.5; sc.torch.y = sc.torch.ty = H * 0.6; }
    };
    sc.onUpdate = dt => {
      const T = sc.torch; T.x += (T.tx - T.x) * Math.min(1, dt * 7); T.y += (T.ty - T.y) * Math.min(1, dt * 7);
      if (sc.running) { T.oil = Math.max(0, T.oil - dt * spd() / 75); if (T.oil <= 0 && !sc.result) { sc.result = 'dark'; sc.running = false; } }
      if (sc.onTick) sc.onTick();
    };
    sc.hooks.over = (ctx, W, H, t) => {
      const T = sc.torch; const R = sc.R * (0.35 + 0.65 * Math.pow(T.oil, 0.4)) * (sc.result === 'dark' ? 0 : 1) * (1 + 0.03 * Math.sin(t * 11));
      const g = ctx.createRadialGradient(T.x, T.y, 0, T.x, T.y, Math.max(1, R));
      g.addColorStop(0, 'rgba(6,5,12,0.02)'); g.addColorStop(0.5, 'rgba(6,5,12,0.45)'); g.addColorStop(1, 'rgba(6,5,12,0.96)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // found things keep a small lamp
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      sc.items.forEach(it => { if (it.found) P.glow(ctx, it.x, it.y - sc.figH * 0.3, sc.figH * 0.9, 'rgba(255,190,110,1)', 0.12, 0.3); });
      if (R > 1) { P.glow(ctx, T.x, T.y, R * 0.9, 'rgba(255,160,70,1)', 0.16, 0.2); P.flame(ctx, T.x, T.y + 6, Math.max(14, sc.figH * 0.16), t, 7, 0.9); }
      ctx.restore();
      // the torch handle
      if (R > 1) { ctx.strokeStyle = U.col([28, 30, 22]); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(T.x, T.y + 8); ctx.lineTo(T.x - 6, T.y + 42); ctx.stroke(); }
    };
    const aim = p => { sc.torch.tx = p.x; sc.torch.ty = p.y; };
    sc.hover = p => { if (!E.mobile) aim(p); };
    sc.down = aim; sc.move = aim;
    sc.tap = p => {
      if (!sc.running) return;
      const T = sc.torch; const R = sc.R * (0.35 + 0.65 * Math.pow(T.oil, 0.4));
      let best = null, bd = Math.max(60, sc.figH * 0.7);
      sc.items.forEach(it => { if (it.found || it.kind === 'tent') return; const d = U.dist(p.x, p.y, it.x, it.y - sc.figH * 0.35); if (d < bd && U.dist(T.x, T.y, it.x, it.y - sc.figH * 0.35) < R * 0.95) { bd = d; best = it; } });
      if (best && sc.onPick) sc.onPick(best);
    };
    sc.test = () => {
      const next = sc.items.find(it => !it.found && ['lot', 'women', 'goods'].includes(it.kind));
      return { kind: 'search', next: next ? { x: next.x, y: next.y - sc.figH * 0.35 } : null, oil: sc.torch.oil, found: sc.foundN };
    };
    return sc;
  }

  // =====================================================================
  //  chapter scenes
  // =====================================================================
  function buildMamre() {
    const sc = S.landscape(S.pal.mamre);
    sc.kind = 'mamre';
    sc.onInit = (W, H) => {
      const h = sc.figH = U.clamp(H * 0.2, 76, 160), gy = sc.groundPx = sc.pal.groundY * H;
      if (!sc.abram) {
        sc.abram = { kind: 'figure', name: 'abram', fixed: true, still: true, x: W * 0.55, y: gy + h * 0.55, h, staff: true, facing: -1, ...S.ROBES.abram };
        sc.actors.push(sc.abram);
        sc.props.push({ x: W * 0.72, y: gy + h * 0.1, depth: 0, draw(ctx, x, y) { P.oak(ctx, x, y, h * 2.4, 11, [90, 26, 24]); } });
        sc.props.push({ x: W * 0.9, y: gy + h * 0.02, depth: 0, draw(ctx, x, y) { P.oak(ctx, x, y, h * 1.9, 12, [85, 24, 22]); } });
        sc.props.push({ x: W * 0.22, y: gy - h * 0.05, depth: 0, draw(ctx, x, y) { P.tent(ctx, { x, y, w: h * 1.6, h: h * 0.85, color: [26, 28, 26] }); } });
      }
    };
    st.sc = sc; st.kind = 'mamre'; E.setScene(sc); return sc;
  }
  async function tidings() {
    await E.fade(1, 10);
    await E.title('<small>פרק שני</small>הַמִּלְחָמָה', '', { ms: 3400 });
    const sc = buildMamre();
    A.setWind(0.3, 4); A.setDrone(0.2, 5); A.setDroneTone(110, 4);
    await E.fade(0, 2800);
    await E.say(['אלוני ממרא. ערב.'], { pos: 'top' });
    await E.clearText();
    await E.say([
      V('וַיְהִי בִּימֵי אַמְרָפֶל מֶלֶךְ־שִׁנְעָר אַרְיוֹךְ מֶלֶךְ אֶלָּסָר כְּדָרְלָעֹמֶר מֶלֶךְ עֵילָם וְתִדְעָל מֶלֶךְ גּוֹיִם', 'בראשית י״ד, א'),
      'ארבעה מלכים מן הצפון. חמישה מלכי הככר.',
      { t: 'שתים עשרה שנה עבדו. בשלוש עשרה — מרדו.', hold: 3000 },
    ], { pos: 'top' });
    await E.clearText();
    A.drums(true, 72, 0.35);
    await E.say([
      V('וַיִּקְחוּ אֶת־כָּל־רְכֻשׁ סְדֹם וַעֲמֹרָה וְאֶת־כָּל־אָכְלָם וַיֵּלֵכוּ'),
      V('וַיִּקְחוּ אֶת־לוֹט וְאֶת־רְכֻשׁוֹ בֶּן־אֲחִי אַבְרָם וַיֵּלֵכוּ וְהוּא יֹשֵׁב בִּסְדֹם', 'בראשית י״ד, יא–יב', 4600),
    ], { pos: 'top' });
    A.drums(false);
    await E.clearText();
    // the fugitive
    const h = sc.figH, gy = sc.groundPx;
    const fug = { kind: 'figure', fixed: true, x: -h, y: gy + h * 0.5, h: h * 1.15, facing: 1, walking: true, dark: 0.4, robe: [30, 15, 22], cloth: [30, 12, 40] };
    sc.actors.push(fug);
    sc.walkPhase = 0; const runner = (async () => { while (fug.walking) { sc.walkPhase += E.dt * 11; await E.nextFrame(); } })().catch(() => { });
    await S.tween(fug, 'x', sc.abram.x - h * 1.1, 3600, k => k);
    fug.walking = false; fug.still = true; fug.bow = 0.3; void runner;
    await E.say([V('וַיָּבֹא הַפָּלִיט וַיַּגֵּד לְאַבְרָם הָעִבְרִי', 'בראשית י״ד, יג', 3400)], { pos: 'top' });
    await E.clearText();
    await E.say([{ t: 'מדרש: הפליט הוא עוג, שנמלט מן המבול. הוא בא לבשר — וקיווה בלבו שאברם ייפול בקרב.', cls: 'whisper', hold: 5200 }], { pos: 'top', narrow: true });
    await E.clearText();
    await E.say([V('וַיִּשְׁמַע אַבְרָם כִּי נִשְׁבָּה אָחִיו', 'בראשית י״ד, יד', 2800)], { pos: 'top' });
    await E.clearText();
    await E.say(['לא "בן אחיו". אחיו.', { t: 'לוט בחר את הככר. אברם לא בחר לשכוח.', hold: 3400 }], { pos: 'top' });
    await E.clearText();
    A.drums(true, 84, 0.5);
    await E.say([
      V('וַיָּרֶק אֶת־חֲנִיכָיו יְלִידֵי בֵיתוֹ'),
      { t: 'שְׁמֹנָה עָשָׂר וּשְׁלֹשׁ מֵאוֹת', cls: 'verse big', hold: 3200 },
      V('וַיִּרְדֹּף עַד־דָּן', 'בראשית י״ד, יד', 3200),
    ], { pos: 'top' });
    await E.clearText();
    await E.say([{ t: 'מדרש: אליעזר לבדו — "שמונה עשר ושלוש מאות" בגימטריה.', cls: 'whisper', hold: 3800 }], { pos: 'top', narrow: true });
    await E.clearText();
    await E.say(['ענר, אשכול וממרא — בעלי בריתו — עומדים בפתח האוהל.', { t: 'אנשיהם מכירים את הדרכים צפונה.', hold: 2600 }], { pos: 'top' });
    const v = await E.choice([
      { label: 'לצאת איתם', value: 'with', note: 'בעלי ברית. כוחם יחזור מהר יותר' },
      { label: 'לצאת לבד, עכשיו', value: 'alone', note: 'שלוש מאות ושמונה עשר. בלילה, פחות קבוצות' },
    ]);
    E.remember('allies', v);
    await E.clearText();
    await E.say([v === 'with' ? 'שלושה בעלי ברית, וכל אנשיהם. יוצאים.' : 'שלוש מאות ושמונה עשר. יוצאים.'], { pos: 'top', hold: 2400 });
    await E.clearText();
    A.drums(false);
    await E.fade(1, 1800);
  }

  async function march() {
    while (true) {
      const sc = marchScene(); st.sc = sc; st.kind = 'map'; E.setScene(sc);
      A.setWind(0.25, 3); A.setDrone(0.2, 3); A.setDroneTone(120, 3); A.drums(true, 96, 0.45);
      await E.fade(0, 2200);
      await E.say(['מחברון עד דן — ארבעה ימי הליכה.', { t: 'יש לכם יום אחד.', hold: 2600 }], { pos: 'low' });
      await E.clearText();
      paceHud(sc);
      E.hint('בחרו קצב. דהירה שוחקת את האנשים; מי שנשחק עד הסוף — עוצר לנוח');
      E.interactive = true; sc.running = true;
      const hintOff = E.wait(7000, false).then(() => E.hint(null)).catch(() => { });
      await E.until(() => sc.needFork || sc.result);
      if (sc.needFork) {
        await hintOff;
        E.hint(null);
        await E.say(['שכם. הדרך מתפצלת.'], { pos: 'low', hold: 1600 });
        const b = await E.choice([
          { label: 'דרך ההר', value: 'hill', note: 'קצרה ותלולה. שוחקת יותר' },
          { label: 'דרך הבקעה', value: 'valley', note: 'ארוכה ונוחה, לאורך הירדן' },
        ]);
        await E.clearText();
        sc.branch = b; sc.terrainK = b === 'hill' ? 1.5 : 1; sc.setRoute(); sc.forkDone = true; sc.needFork = false; sc.paused = false;
        await E.until(() => sc.result);
      }
      E.interactive = false; E.hint(null); A.drums(false);
      if (sc.result === 'win') {
        E.hud('');
        A.setDrone(0.35, 3); A.setDroneTone(80, 3);
        await E.say(['דן. לילה.', { t: 'המדורות שלהם — מעבר לגבעה.', hold: 3000 }], { pos: 'low' });
        await E.clearText();
        await E.fade(1, 2000);
        return;
      }
      E.hud('');
      await E.say(['השחר עלה.', 'מחנה דן — אפר קר. השיירה המשיכה צפונה.', { t: 'ולוט איתה.', hold: 3000 }], { pos: 'low' });
      await E.choice([{ label: 'לרדוף שוב', value: 'again', note: 'מחברון, עם שחר' }]);
      await E.clearText();
      await E.fade(1, 1200);
    }
  }

  async function night() {
    const N = allies() ? 4 : 3;
    while (true) {
      const sc = nightScene(N); st.sc = sc; st.kind = 'night'; E.setScene(sc);
      A.setWind(0.15, 3); A.setDrone(0.3, 3); A.setDroneTone(76, 3); A.drums(false);
      await E.fade(0, 2400);
      await E.say([V('וַיֵּחָלֵק עֲלֵיהֶם לַיְלָה הוּא וַעֲבָדָיו', 'בראשית י״ד, טו', 3400)], { pos: 'low' });
      await E.clearText();
      await E.say([`חלקו את האנשים ל${N === 4 ? 'ארבע' : 'שלוש'} קבוצות, והקיפו את המחנה.`, { t: 'הרחק מאור המדורות ומן השומרים. וחכו שהלפידים ידעכו.', hold: 3800 }], { pos: 'low' });
      await E.clearText();
      E.hud('<div class="k wide"><span>סכנת גילוי</span><div class="bar red"><i id="n-alarm" style="width:0%"></i></div></div><div class="k"><span>הלפידים</span><span class="v" id="n-fire">בוערים</span></div><div class="k"><span>&nbsp;</span><button class="strike" id="n-strike" style="display:none">הכו!</button></div>');
      const alarm = E.el('n-alarm'), fire = E.el('n-fire'), strikeBtn = E.el('n-strike');
      let strike = false;
      strikeBtn.addEventListener('click', () => { if (sc.running) { strike = true; } });
      sc.onTick = () => {
        alarm.style.width = (sc.alarm * 100) + '%';
        const b = sc.avgB(); fire.textContent = b > 0.72 ? 'בוערים' : b > 0.5 ? 'מהבהבים' : 'דועכים';
        fire.style.color = b <= 0.5 ? 'var(--gold)' : '';
        strikeBtn.style.display = sc.placedCount() >= 2 ? '' : 'none';
      };
      E.hint(E.mobile ? 'גררו כל קבוצה אל אחד המעגלים המקווקווים' : 'גררו כל קבוצה אל אחד המעגלים המקווקווים');
      E.interactive = true; sc.running = true;
      await E.until(() => strike || sc.result);
      E.interactive = false; E.hint(null); sc.running = false; sc.drag = null;
      let enemies = 0, outcome;
      if (sc.result === 'detected') {
        outcome = 'detected'; enemies = 26;
        A.drum('clash', 1); A.drums(true, 150, 0.9);
        await E.say(['קול. לפיד מתרומם.', { t: 'נתגליתם.', cls: 'verse', hold: 2200 }], { pos: 'low' });
      } else {
        const placed = sc.placedCount(), b = sc.avgB();
        if (placed >= N && b < 0.55) { outcome = 'clean'; }
        else { outcome = 'fight'; enemies = 10 + 6 * (N - placed) + (b >= 0.55 ? 8 : 0); }
        A.drum('deep', 1); A.drums(true, 140, 0.85);
        await E.say([outcome === 'clean' ? 'מכל הצדדים בבת אחת. בחשכה גמורה.' : placed < N ? 'לא מכל הצדדים. חלק מהם נמלטים אל החושך — וחוזרים.' : 'הלפידים עוד בוערים. הם רואים אתכם באים.', { t: 'הכו!', cls: 'verse', hold: 1800 }], { pos: 'low' });
      }
      E.hud(''); await E.clearText();
      let won = outcome === 'clean';
      if (!won) won = await skirmish(enemies);
      if (won) {
        A.drums(false);
        sc.out = true; sc.outK = 0; S.tween(sc, 'outK', 1, 4000).catch(() => { });
        sc.units.forEach(u => { S.tween(u, 'x', sc.C.x + (u.x - sc.C.x) * 0.2, 3500).catch(() => { }); S.tween(u, 'y', sc.C.y + (u.y - sc.C.y) * 0.2, 3500).catch(() => { }); });
        E.setScene(sc);
        await E.say([{ t: 'וַיַּכֵּם', cls: 'verse big', ref: 'בראשית י״ד, טו', hold: 3600 }], { pos: 'low' });
        await E.clearText();
        await E.fade(1, 2000);
        return;
      }
      A.drums(false);
      await E.say(['נסוגים אל החשכה.', { t: 'הלילה עוד ארוך. מחלקים מחדש.', hold: 2600 }], { pos: 'low' });
      await E.choice([{ label: 'לנסות שוב', value: 'again', note: 'לחלק את האנשים מחדש' }]);
      await E.clearText();
      await E.fade(1, 1000);
    }
  }

  async function skirmish(total) {
    const sc = skirmishScene(total); st.sc = sc; st.kind = 'skirmish'; E.setScene(sc);
    E.hud('<div class="k"><span>עֹז</span><span class="v" id="k-mor">●●●</span></div><div class="k"><span>נותרו</span><span class="v" id="k-left">' + total + '</span></div>');
    const mor = E.el('k-mor'), left = E.el('k-left');
    sc.onTick = () => { mor.textContent = '●'.repeat(Math.max(0, sc.morale)) + '○'.repeat(3 - Math.max(0, sc.morale)); left.textContent = String(Math.max(0, total - sc.kills)); };
    E.hint(E.mobile ? 'הכו באויב כשהוא בתוך המעגל. האדומים — מסתערים: הדפו אותם מיד' : 'לחצו על אויב כשהוא בתוך המעגל. האדומים — מסתערים: הדפו אותם מיד');
    E.interactive = true; sc.running = true;
    const hintOff = E.wait(6000, false).then(() => E.hint(null)).catch(() => { });
    await E.until(() => sc.result);
    await hintOff;
    E.interactive = false; E.hint(null); E.hud('');
    await E.wait(900);
    return sc.result === 'win';
  }

  async function pursuit() {
    const sc = marchScene(); st.sc = sc; st.kind = 'map'; E.setScene(sc);
    sc.night = 1; sc.time = sc.day * 0.9; sc.enemyU = 1;
    sc.pl = polyline(ROUTES.pursuit, sc.g); sc.enemyPl = polyline(ROUTES.flee, sc.g); sc.pos = 0;
    sc.update = function (dt) { this.t += dt; if (!this.running) return; dt *= spd(); this.pos = Math.min(this.pl.L, this.pos + this.pl.L * dt / 9); this.fleeU = Math.min(1, (this.fleeU || 0) + dt / 8); };
    const drawBase = sc.draw;
    sc.draw = function (ctx, W, H, t) { this.enemyU = 2; drawBase.call(this, ctx, W, H, t); const s = Math.max(2.2, this.g.m * 0.006); const e = along(this.enemyPl, (this.fleeU || 0) * this.enemyPl.L); drawColumn(ctx, e.x, e.y, e.ang, 8, [355, 40, 38], s, 0, t, 8); };
    A.drums(true, 120, 0.5); A.setWind(0.3, 2);
    await E.fade(0, 1800);
    sc.running = true;
    await E.say([V('וַיִּרְדְּפֵם עַד־חוֹבָה אֲשֶׁר מִשְּׂמֹאל לְדַמָּשֶׂק', 'בראשית י״ד, טו', 4200)], { pos: 'low' });
    await E.until(() => sc.pos >= sc.pl.L, 12000 / spd());
    A.drums(false);
    await E.say(['חובה. מחנה נטוש, חושך.', { t: 'השבויים כאן — אי שם.', hold: 2600 }], { pos: 'low' });
    await E.clearText();
    await E.fade(1, 1600);
  }

  async function search() {
    const lines = { lot: 'וְגַם אֶת־לוֹט אָחִיו', women: 'וְגַם אֶת־הַנָּשִׁים וְאֶת־הָעָם', goods: 'וְאֶת־כָּל־הָרְכֻשׁ' };
    const decoys = ['איש מסדום, קשור. לא הוא.', 'איש מעמורה. הוא מצביע בידו הקשורה — "שם, הלאה".', 'נער. הוא לא מרים את הראש.', 'איש זקן. "לוט? בן אחיו של העברי? ראיתי אותו ליד הסחורה."', 'רועה. לא הוא.'];
    while (true) {
      const sc = searchScene(); st.sc = sc; st.kind = 'search'; E.setScene(sc);
      A.setWind(0.2, 3); A.setDrone(0.25, 3); A.setDroneTone(90, 3);
      await E.fade(0, 2200);
      await E.say(['לפיד אחד. שמן למעט זמן.', { t: 'מצאו את לוט, את הנשים והעם, ואת הרכוש.', hold: 3000 }], { pos: 'top' });
      await E.clearText();
      E.hud('<div class="k wide"><span>הלפיד</span><div class="bar"><i id="s-oil" style="width:100%"></i></div></div><div class="k"><span>נמצאו</span><span class="v" id="s-found">0 מתוך 4</span></div>');
      const oil = E.el('s-oil'), found = E.el('s-found');
      sc.onTick = () => { oil.style.width = (sc.torch.oil * 100) + '%'; oil.parentElement.classList.toggle('red', sc.torch.oil < 0.25); found.textContent = sc.foundN + ' מתוך 4'; };
      let decoyI = 0;
      sc.onPick = it => {
        if (['lot', 'women', 'goods'].includes(it.kind)) {
          it.found = true; sc.foundN++; A.pluck(A.scale[4 + sc.foundN], 0.5); A.drum('stone', 0.4);
          E.say([{ t: lines[it.kind], cls: 'verse', hold: 2600 }], { pos: 'top', wait: false }).catch(() => { });
          if (sc.foundN >= 4) { sc.result = 'found'; sc.running = false; }
        } else if (!it.tried) {
          it.tried = true; A.ney(A.scale[2], 1.2, 0.1);
          E.say([{ t: decoys[decoyI++ % decoys.length], cls: 'whisper', hold: 2600 }], { pos: 'top', wait: false }).catch(() => { });
        }
      };
      E.hint(E.mobile ? 'גררו את הלפיד בחשכה. געו במי שאתם מזהים' : 'הזיזו את הלפיד בחשכה. לחצו על מי שאתם מזהים');
      E.interactive = true; sc.running = true;
      await E.until(() => sc.result);
      E.interactive = false; E.hint(null); E.hud('');
      sc.tap = null;
      if (sc.result === 'found') {
        sc.running = false;
        await E.wait(2200);
        await E.clearText();
        sc.torch.oil = 1;
        await E.say([V('וַיָּשֶׁב אֵת כָּל־הָרְכֻשׁ וְגַם אֶת־לוֹט אָחִיו וּרְכֻשׁוֹ הֵשִׁיב וְגַם אֶת־הַנָּשִׁים וְאֶת־הָעָם', 'בראשית י״ד, טז', 5200)], { pos: 'top' });
        await E.clearText();
        await E.say(['לוט לא אמר תודה. לא נאמר שאמר.', { t: 'אברם לא חיכה שיאמר.', hold: 3400 }], { pos: 'top' });
        await E.clearText();
        await E.fade(1, 2400);
        return;
      }
      await E.clearText();
      await E.say(['הלפיד כבה.', { t: 'חושך גמור. ממתינים ללפיד חדש.', hold: 2600 }], { pos: 'top' });
      await E.choice([{ label: 'להדליק לפיד חדש', value: 'again' }]);
      await E.clearText();
      await E.fade(1, 1000);
    }
  }

  async function shaveh() {
    const sc = S.landscape(S.pal.dawnReturn); sc.kind = 'shaveh'; st.sc = sc; st.kind = 'shaveh'; E.setScene(sc);
    const W = sc.W, H = sc.H, h = sc.figH = U.clamp(H * 0.2, 76, 160), gy = sc.groundPx = sc.pal.groundY * H;
    const narrow = W < 700;
    const abram = { kind: 'figure', name: 'abram', fixed: true, still: true, x: narrow ? W * 0.72 : W * 0.62, y: gy + h * 0.55, h, staff: true, facing: -1, ...S.ROBES.abram };
    const lot = { kind: 'figure', fixed: true, still: true, x: abram.x + h * 0.7, y: gy + h * 0.4, h: h * 0.92, facing: -1, ...S.ROBES.lot };
    const malki = { kind: 'figure', fixed: true, x: -h, y: gy + h * 0.5, h: h * 1.02, facing: 1, walking: true, alpha: 0, ...S.ROBES.priest };
    const king = { kind: 'figure', fixed: true, x: -h * 2, y: gy + h * 0.62, h: h * 0.98, facing: 1, walking: true, alpha: 0, ...S.ROBES.king };
    sc.actors.push(abram, lot, malki, king);
    for (let i = 0; i < 4; i++) sc.actors.push({ kind: 'figure', fixed: true, still: true, x: abram.x + h * (1.3 + i * 0.5), y: gy + h * (0.25 + (i % 2) * 0.3), h: h * 0.8, facing: -1, dark: 0.25, ...S.ROBES.servant });
    const pile = { x: narrow ? W * 0.42 : W * 0.44, y: gy + h * 0.45, depth: 0, alpha: 1, held: 0, draw(ctx, x, y) {
      ctx.save(); ctx.globalAlpha = pile.alpha; const rr = U.rng(77); const lift = pile.held * 6;
      for (let k = 0; k < 7; k++) P.stone(ctx, x + (rr() - 0.5) * h * 0.9, y - lift - Math.floor(k / 3) * h * 0.14 - rr() * h * 0.06, h * (0.24 + rr() * 0.12), h * 0.17, 500 + k, [34, 42, 46]);
      ctx.fillStyle = U.col([42, 60, 52]); ctx.fillRect(x - h * 0.2, y - lift - h * 0.42, h * 0.4, h * 0.14); ctx.fillStyle = U.col([44, 70, 60]); ctx.fillRect(x - h * 0.2, y - lift - h * 0.44, h * 0.4, h * 0.03);
      ctx.fillStyle = U.col([25, 35, 32]); ctx.beginPath(); ctx.ellipse(x + h * 0.42, y - lift - h * 0.14, h * 0.08, h * 0.15, 0, 0, U.TAU); ctx.fill();
      ctx.restore();
    } };
    sc.props.push(pile);
    sc.walkPhase = 0; let walking = true; (async () => { while (walking) { sc.walkPhase += E.dt * 7; await E.nextFrame(); } })().catch(() => { });
    A.setWind(0.3, 4); A.setDrone(0.1, 4); A.setDroneTone(170, 4); A.motif(true, 0.6);
    await E.fade(0, 2800);
    await E.say([V('וַיֵּצֵא מֶלֶךְ־סְדֹם לִקְרָאתוֹ אַחֲרֵי שׁוּבוֹ מֵהַכּוֹת אֶת־כְּדָרְלָעֹמֶר וְאֶת־הַמְּלָכִים אֲשֶׁר אִתּוֹ אֶל־עֵמֶק שָׁוֵה', 'בראשית י״ד, יז', 4000)], { pos: 'top' });
    S.tween(malki, 'alpha', 1, 1500).catch(() => { }); S.tween(king, 'alpha', 1, 1500).catch(() => { });
    await Promise.all([S.tween(malki, 'x', narrow ? W * 0.2 : W * 0.3, 5500, k => k), S.tween(king, 'x', narrow ? W * 0.08 : W * 0.16, 5500, k => k)]);
    walking = false; malki.walking = false; malki.still = true; king.walking = false; king.still = true;
    await E.clearText();
    sc.lightTarget = 0.35; sc.lightWarm = true; A.setChord(0.2, 5);
    await E.say([
      V('וּמַלְכִּי־צֶדֶק מֶלֶךְ שָׁלֵם הוֹצִיא לֶחֶם וָיָיִן וְהוּא כֹהֵן לְאֵל עֶלְיוֹן', 'בראשית י״ד, יח'),
      { t: 'בָּרוּךְ אַבְרָם לְאֵל עֶלְיוֹן קֹנֵה שָׁמַיִם וָאָרֶץ', cls: 'verse', who: 'מלכי־צדק' },
      { t: 'וּבָרוּךְ אֵל עֶלְיוֹן אֲשֶׁר־מִגֵּן צָרֶיךָ בְּיָדֶךָ', cls: 'verse', ref: 'בראשית י״ד, יט–כ', hold: 4000 },
    ], { pos: 'top' });
    await E.clearText();
    await E.say([{ t: 'מדרש: מלכי־צדק הוא שם בן נח, שראה את המבול וראה את העולם שאחריו.', cls: 'whisper', hold: 4200 }], { pos: 'top', narrow: true });
    await E.clearText();
    await E.say([V('וַיִּתֶּן־לוֹ מַעֲשֵׂר מִכֹּל', 'בראשית י״ד, כ', 3000)], { pos: 'top' });
    await E.clearText();
    sc.lightTarget = 0; A.setChord(0, 4);
    await E.say([{ t: 'תֶּן־לִי הַנֶּפֶשׁ וְהָרְכֻשׁ קַח־לָךְ', cls: 'verse', who: 'מלך סדום', ref: 'בראשית י״ד, כא', hold: 3800 }], { pos: 'top' });
    await E.clearText();
    await E.say(['כל רכוש סדום. שלל מלחמה — כדין.', { t: 'רק צריך לסגור את היד.', hold: 2800 }], { pos: 'top' });
    await E.clearText();
    // the letting go
    let holding = false, t0 = 0, released = false;
    const thr = 1300 / spd();
    E.interactive = true;
    E.hint(E.mobile ? 'אחזו ברכוש' : 'לחצו על הרכוש והחזיקו');
    sc.test = () => ({ kind: 'letgo', x: pile.x, y: pile.y - h * 0.2 });
    sc.down = p => { if (U.dist(p.x, p.y, pile.x, pile.y - h * 0.2) < h * 0.8) { holding = true; t0 = performance.now(); pile.held = 1; E.hint('...'); A.drum('stone', 0.3); } };
    sc.up = () => { if (!holding) return; holding = false; pile.held = 0; if (performance.now() - t0 >= thr) released = true; else E.hint('החזיקו עוד רגע. ואז — הרפו'); };
    const prompt = (async () => { while (!released) { if (holding && performance.now() - t0 >= thr) E.hint('ועכשיו — הרפו'); await E.wait(120, false); } })().catch(() => { });
    await E.until(() => released);
    await prompt;
    sc.down = sc.up = null; sc.test = null; E.interactive = false; E.hint(null);
    A.drum('whoosh', 0.5);
    S.tween(pile, 'x', king.x + h * 0.5, 3000).catch(() => { });
    await E.say([
      { t: 'הֲרִמֹתִי יָדִי אֶל־ה\' אֵל עֶלְיוֹן קֹנֵה שָׁמַיִם וָאָרֶץ', cls: 'verse', who: 'אברם' },
      { t: 'אִם־מִחוּט וְעַד שְׂרוֹךְ־נַעַל וְאִם־אֶקַּח מִכָּל־אֲשֶׁר־לָךְ', cls: 'verse' },
      { t: 'וְלֹא תֹאמַר אֲנִי הֶעֱשַׁרְתִּי אֶת־אַבְרָם', cls: 'verse', ref: 'בראשית י״ד, כב–כג', hold: 4400 },
    ], { pos: 'top' });
    await E.clearText();
    await E.say([V('בִּלְעָדַי רַק אֲשֶׁר אָכְלוּ הַנְּעָרִים וְחֵלֶק הָאֲנָשִׁים אֲשֶׁר הָלְכוּ אִתִּי עָנֵר אֶשְׁכֹּל וּמַמְרֵא הֵם יִקְחוּ חֶלְקָם', 'בראשית י״ד, כד', 4600)], { pos: 'top' });
    await E.clearText();
    await E.say(['הוא ניצח — ושב הביתה בלי דבר.', { t: 'מלבד אחיו.', hold: 3600 }], { pos: 'top' });
    await E.clearText();
    A.motif(false);
    await E.fade(1, 2800);
  }

  E.chapters.ch2 = {
    run(scene, id) {
      return E.runScenes('ch2', [
        ['tidings', tidings], ['march', march], ['night', night], ['pursuit', pursuit], ['search', search], ['shaveh', shaveh],
      ], scene, id);
    },
  };
})();

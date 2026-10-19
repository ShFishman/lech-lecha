/* ch3.js — פרק ג: ברית בין הבתרים (הכוכבים, הבתרים והעיט, האימה, הלפיד), ואפילוג */
'use strict';
(function () {
  const E = Engine, S = Scenes, P = Paint, A = Audio2;
  const st = { sc: null, kind: null };
  const spd = () => Math.max(1, E.speed);
  const V = (t, ref, hold) => ({ t, cls: 'verse', ref, hold });

  // ---------- Mamre at night ----------
  function buildNight() {
    const sc = S.landscape(S.pal.night);
    sc.kind = 'night'; sc.fire = 1;
    sc.onInit = (W, H) => {
      const h = sc.figH = U.clamp(H * 0.2, 76, 160), gy = sc.groundPx = sc.pal.groundY * H;
      if (!sc.abram) {
        sc.abram = { kind: 'figure', name: 'abram', fixed: true, still: true, x: W * 0.56, y: gy + h * 0.55, h, staff: false, facing: -1, dark: 0.35, ...S.ROBES.abram };
        sc.actors.push(sc.abram);
        sc.props.push({ x: W * 0.78, y: gy - h * 0.02, depth: 0, draw(ctx, x, y) { P.tent(ctx, { x, y, w: h * 1.7, h: h * 0.9, color: [26, 20, 14] }); } });
        sc.props.push({ x: W * 0.9, y: gy + h * 0.05, depth: 0, draw(ctx, x, y) { P.oak(ctx, x, y, h * 2.2, 11, [90, 18, 12]); } });
        sc.props.push({ x: W * 0.36, y: gy + h * 0.5, depth: 0, draw(ctx, x, y, t) { if (sc.fire > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; P.glow(ctx, x, y - h * 0.1, h * 1.6, 'rgba(255,150,60,1)', 0.18 * sc.fire, 0.2); ctx.restore(); P.flame(ctx, x, y, h * 0.22, t, 2, sc.fire); } } });
      }
    };
    st.sc = sc; st.kind = 'night'; E.setScene(sc); return sc;
  }
  async function fear() {
    await E.fade(1, 10);
    await E.title('<small>פרק שלישי</small><span style="font-size:.7em">בְּרִית בֵּין הַבְּתָרִים</span>', '', { ms: 3600 });
    const sc = buildNight();
    A.setWind(0.25, 4); A.setDrone(0.25, 5); A.setDroneTone(100, 4);
    await E.fade(0, 3000);
    await E.say(['אחרי המלחמה.', 'הלילה שקט. הוא לא.'], { pos: 'top' });
    await E.clearText();
    await E.say([V('אַחַר הַדְּבָרִים הָאֵלֶּה הָיָה דְבַר־ה\' אֶל־אַבְרָם בַּמַּחֲזֶה לֵאמֹר', 'בראשית ט״ו, א', 3200)], { pos: 'top' });
    await E.clearText();
    await S.voice(sc, [{ t: 'אַל־תִּירָא אַבְרָם', hold: 2600 }, { t: 'אָנֹכִי מָגֵן לָךְ שְׂכָרְךָ הַרְבֵּה מְאֹד', ref: 'בראשית ט״ו, א', hold: 4000 }], { warm: false, keep: true });
    await E.clearText();
    await E.say(['הוא היה יכול להודות ולשתוק.', { t: 'הוא ענה.', hold: 2400 }], { pos: 'top' });
    await E.clearText();
    await E.say([
      { t: 'אֲדֹנָי ה\' מַה־תִּתֶּן־לִי וְאָנֹכִי הוֹלֵךְ עֲרִירִי', cls: 'verse', who: 'אברם' },
      { t: 'וּבֶן־מֶשֶׁק בֵּיתִי הוּא דַּמֶּשֶׂק אֱלִיעֶזֶר', cls: 'verse' },
      { t: 'הֵן לִי לֹא נָתַתָּה זָרַע וְהִנֵּה בֶן־בֵּיתִי יוֹרֵשׁ אֹתִי', cls: 'verse', ref: 'בראשית ט״ו, ב–ג', hold: 4600 },
    ], { pos: 'top' });
    await E.clearText();
    await S.voice(sc, [{ t: 'לֹא יִירָשְׁךָ זֶה', hold: 2400 }, { t: 'כִּי־אִם אֲשֶׁר יֵצֵא מִמֵּעֶיךָ הוּא יִירָשֶׁךָ', ref: 'בראשית ט״ו, ד', hold: 4000 }], { warm: false, keep: true });
    await E.clearText();
    await E.say([V('וַיּוֹצֵא אֹתוֹ הַחוּצָה', 'בראשית ט״ו, ה', 3000)], { pos: 'top' });
    await E.clearText();
    S.voiceOff(sc);
    S.tween(sc, 'fire', 0, 2500).catch(() => { });
    await E.fade(1, 2200);
  }

  // ---------- the stars ----------
  function starScene() {
    const mobile = E.mobile;
    const sc = {
      kind: 'stars', look: 0, phase: 'look', count: 0, mult: 0, bloom: [], t: 0, bright: [], auto: false, shown: '',
      init(W, H) {
        this.W = W; this.H = H; this.SH = H * 2.1;
        const r = U.rng(77); this.bright = [];
        const n = mobile ? 26 : 40;
        for (let i = 0; i < n; i++) this.bright.push({ x: W * (0.06 + r() * 0.88), y: this.SH - H + H * (0.08 + r() * 0.8), s: 2.2 + r() * 2.2, ph: r() * 7, marked: false, mk: 0 });
      },
      layerY(d) { return -(this.SH - this.H) * this.look * d; },
      update(dt) {
        this.t += dt;
        if (this.auto) { this.count = Math.min(9999999, this.count + Math.max(40, this.count) * dt * 1.6 * spd()); this.mult = Math.min(1, this.mult + dt * 0.25 * spd()); }
        this.bright.forEach(b => { if (b.marked && b.mk < 1) b.mk = Math.min(1, b.mk + dt * 3); });
        if (this.phase === 'look' && !E.pointer.down && !E.reduceMotion) this.look = U.clamp(this.look - E.par.y * dt * 0.25, 0, 1);
        if (this.onTick) this.onTick();
      },
      draw(ctx, W, H, t) {
        const SH = this.SH, px = E.par.x;
        const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#03040c'); g.addColorStop(0.6, '#070a1c'); g.addColorStop(1, U.lerp(0, 1, this.look) > 0.5 ? '#0a0e26' : '#161a36');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const cnt = mobile ? 0.55 : 1;
        ctx.drawImage(P.milky('mw', W + 200, SH, { seed: 3, angle: -1.05, y: 0.42, count: Math.round(1300 * cnt), width: 1.2 }), -100 - px * 10, this.layerY(0.7));
        ctx.drawImage(P.stars('far', W + 200, SH, { seed: 21, count: Math.round(2200 * cnt), pow: 1, sizeMax: 1.3, alpha: 0.75 }), -100 - px * 14, this.layerY(0.65));
        ctx.drawImage(P.stars('mid', W + 200, SH, { seed: 22, count: Math.round(900 * cnt), pow: 1, sizeMax: 2.0 }), -100 - px * 22, this.layerY(0.85));
        ctx.drawImage(P.stars('near', W + 200, SH, { seed: 23, count: Math.round(260 * cnt), pow: 1, sizeMax: 2.8 }), -100 - px * 32, this.layerY(1));
        if (this.mult > 0) {
          ctx.save(); ctx.globalAlpha = this.mult;
          ctx.drawImage(P.stars('x1', W + 200, SH, { seed: 31, count: Math.round(3500 * cnt), pow: 1, sizeMax: 1.6, alpha: 0.9 }), -100 - px * 18, this.layerY(0.75));
          ctx.drawImage(P.stars('x2', W + 200, SH, { seed: 32, count: Math.round(2500 * cnt), pow: 1, sizeMax: 2.2, alpha: 0.85 }), -100 - px * 26, this.layerY(0.92));
          ctx.globalAlpha = this.mult * 0.5; ctx.drawImage(P.milky('mw2', W + 200, SH, { seed: 5, angle: -1.05, y: 0.42, count: Math.round(1500 * cnt), width: 1.6 }), -100 - px * 10, this.layerY(0.7));
          ctx.restore();
        }
        // the countable stars
        const oy = this.layerY(1), ox = -px * 32;
        this.bright.forEach(b => {
          const x = b.x + ox, y = b.y + oy; if (y < -10 || y > H + 10) return;
          const tw = 0.75 + 0.25 * Math.sin(t * 1.7 + b.ph);
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          P.glow(ctx, x, y, b.s * 6, 'rgba(255,245,225,1)', 0.22 * tw, 0.2);
          ctx.fillStyle = `rgba(255,250,235,${0.85 * tw})`; ctx.beginPath(); ctx.arc(x, y, b.s * 0.55, 0, U.TAU); ctx.fill();
          if (b.marked) { ctx.strokeStyle = `rgba(241,217,154,${0.7 * (1 - b.mk * 0.5)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, b.s * 2 + b.mk * b.s * 2.5, 0, U.TAU); ctx.stroke(); }
          ctx.restore();
          b.sx = x; b.sy = y;
        });
        // blooms from the player's taps
        if (this.bloom.length) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          this.bloom.forEach(s => { const a = Math.min(1, (t - s.born) * 1.5); ctx.fillStyle = `rgba(255,248,230,${0.9 * a * s.a})`; ctx.beginPath(); ctx.arc(s.x + ox * s.d, s.y + oy * s.d, s.s, 0, U.TAU); ctx.fill(); });
          ctx.restore();
        }
        // the horizon and the man looking up, sliding away as we look up
        const hy = H * 0.72 + this.look * H * 1.25;
        if (hy < H + 60) {
          const r0 = S.pal.night.ridges[0];
          const img = P.ridge('starsR', Math.max(1600, Math.ceil(W * 1.6)), H, Object.assign({}, r0, { baseY: 0, amp: H * 0.05, haze: S.pal.night.haze, hazeK: 0 }));
          P.tiled(ctx, img, -px * 20, hy, W);
          ctx.fillStyle = '#07070f'; ctx.fillRect(0, hy + H * 0.05, W, H);
          const h = U.clamp(H * 0.2, 76, 160);
          P.figure(ctx, { x: W * 0.5, y: hy + h * 0.5, h, facing: 1, walk: null, dark: 0.7, robe: [18, 42, 32], cloth: [36, 35, 72], alpha: 0.9 });
          ctx.fillStyle = 'rgba(7,7,15,0.6)'; ctx.fillRect(0, hy - H * 0.05, W, H);
        }
        if (this.phase === 'look') { ctx.save(); ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 2); ctx.strokeStyle = 'rgba(239,227,204,0.7)'; ctx.lineWidth = 1.5; const cx = W / 2, cy = H * 0.5 - this.look * H * 0.2; ctx.beginPath(); ctx.moveTo(cx, cy + 22); ctx.lineTo(cx, cy - 22); ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx, cy - 22); ctx.lineTo(cx + 10, cy - 10); ctx.stroke(); ctx.restore(); }
        P.vignette(ctx, W, H, 0.5);
      },
      move(p) { if (this.phase === 'look' && E.pointer.down) this.look = U.clamp(this.look - E.pointer.dy / this.H * 1.6, 0, 1); },
      key(code) { if (this.phase === 'look' && code === 'ArrowUp') this.look = U.clamp(this.look + 0.12, 0, 1); },
      tap(p) {
        if (this.phase === 'count') {
          let best = null, bd = mobile ? 44 : 34;
          this.bright.forEach(b => { if (b.marked || b.sx == null) return; const d = U.dist(p.x, p.y, b.sx, b.sy); if (d < bd) { bd = d; best = b; } });
          if (best) { best.marked = true; this.count++; A.pluck(A.scale[Math.min(11, this.count % 12)] * (this.count > 6 ? 2 : 1), 0.4, (p.x / this.W - 0.5)); if (this.onCount) this.onCount(); }
        } else if (this.phase === 'bloom') {
          const r = U.rng(this.count * 7 + 1); const n = 18 + Math.floor(this.count / 4);
          for (let i = 0; i < n; i++) { const a = r() * U.TAU, d = Math.pow(r(), 0.6) * this.W * 0.18; this.bloom.push({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d - this.layerY(1), s: 0.5 + r() * 1.6, a: 0.5 + r() * 0.5, d: 1, born: this.t }); }
          this.count += n; A.pluck(A.scale[7 + (this.count % 5)] * 2, 0.35); A.drum('wings', 0.15);
          if (this.bloom.length > 1400) this.bloom.splice(0, this.bloom.length - 1400);
          if (this.onCount) this.onCount();
        }
      },
      test() {
        const b = this.bright.find(x => !x.marked && x.sy > 20 && x.sy < this.H - 20);
        return { kind: 'stars', phase: this.phase, look: this.look, count: Math.round(this.count), star: this.phase === 'count' && b ? { x: b.sx, y: b.sy } : (this.phase === 'bloom' ? { x: this.W * (0.3 + Math.random() * 0.4), y: this.H * (0.2 + Math.random() * 0.5) } : null) };
      },
    };
    return sc;
  }
  const fmt = n => n >= 1000000 ? 'אֵין מִסְפָּר' : Math.round(n).toLocaleString('he-IL');
  async function stars() {
    const sc = starScene(); st.sc = sc; st.kind = 'stars'; E.setScene(sc);
    A.setWind(0.12, 4); A.setDrone(0.2, 4); A.setDroneTone(110, 4); A.setShimmer(0.15, 4);
    await E.fade(0, 3200);
    E.interactive = true;
    E.hint(E.mobile ? 'גררו כלפי מעלה — הביטו השמיימה' : 'גררו כלפי מעלה (או חץ למעלה) — הביטו השמיימה');
    await E.until(() => sc.look >= 0.92);
    sc.look = 1; sc.phase = 'voice'; E.interactive = false; E.hint(null);
    await E.wait(1200);
    await S.voice(null, [
      { t: 'הַבֶּט־נָא הַשָּׁמַיְמָה', hold: 2800 },
      { t: 'וּסְפֹר הַכּוֹכָבִים אִם־תּוּכַל לִסְפֹּר אֹתָם', ref: 'בראשית ט״ו, ה', hold: 3800 },
    ], { pos: 'top', chord: 0.2, keep: true, shimmer: 0.5 });
    await E.clearText();
    E.hud('<div class="k"><span>כוכבים</span><span class="stars" id="st-n">0</span></div>');
    const n = E.el('st-n');
    sc.onCount = () => { n.textContent = fmt(sc.count); };
    sc.onTick = () => { if (sc.auto) n.textContent = fmt(sc.count); };
    sc.phase = 'count'; E.interactive = true;
    E.hint(E.mobile ? 'געו בכוכבים כדי לספור אותם' : 'לחצו על הכוכבים כדי לספור אותם');
    const target = E.mobile ? 10 : 14;
    await E.until(() => sc.count >= target);
    E.hint(null);
    sc.phase = 'bloom';
    A.setChord(0.5, 6);
    E.say([{ t: 'ככל שסופרים — יש יותר.', cls: 'whisper', hold: 2800 }], { pos: 'center', wait: false }).catch(() => { });
    await E.until(() => sc.count >= target + 90, 20000 / spd());
    sc.auto = true; A.setChord(0.95, 8); A.setShimmer(0.8, 6);
    E.hint(null);
    await E.until(() => sc.count >= 1000000, 30000 / spd());
    sc.phase = 'done'; E.interactive = false;
    await E.wait(2600);
    await S.voice(null, [{ t: 'כֹּה יִהְיֶה זַרְעֶךָ', ref: 'בראשית ט״ו, ה', hold: 4600 }], { pos: 'center', chord: 0.95, keep: true, shimmer: 0.8 });
    await E.clearText();
    E.hud('');
    await E.wait(1500);
    await E.say([{ t: 'וְהֶאֱמִן בַּה\' וַיַּחְשְׁבֶהָ לּוֹ צְדָקָה', cls: 'verse big', ref: 'בראשית ט״ו, ו', hold: 6500 }], { pos: 'center' });
    await E.clearText();
    A.setChord(0.25, 8); A.setShimmer(0.1, 6);
    await E.say(['הוא לא שאל איך.', { t: 'זה נחשב לו.', hold: 3400 }], { pos: 'center' });
    await E.clearText();
    A.setChord(0, 6); A.setShimmer(0, 4);
    await E.fade(1, 3200);
  }

  // ---------- the pieces, the birds of prey ----------
  const ANIMALS = { heifer: { name: 'עֶגְלָה', col: [24, 34, 40], w: 1.0, h: 0.44 }, goat: { name: 'עֵז', col: [22, 14, 20], w: 0.78, h: 0.36 }, ram: { name: 'אַיִל', col: [38, 22, 68], w: 0.88, h: 0.42 } };
  function drawPiece(ctx, pc, x, y, h, alpha) {
    const a = ANIMALS[pc.kind]; ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    if (pc.kind === 'bird') {
      const s = h * 0.22; ctx.fillStyle = 'rgba(25,12,0,0.2)'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.9, s * 0.2, 0, 0, U.TAU); ctx.fill();
      const col = pc.half === 'dove' ? [40, 18, 78] : [30, 12, 52];
      const g = ctx.createLinearGradient(x, y - s, x, y); g.addColorStop(0, U.col(U.shade(col, 8))); g.addColorStop(1, U.col(U.shade(col, -10))); ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.35, s * 0.8, s * 0.38, 0, 0, U.TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x - s * 0.7, y - s * 0.55, s * 0.24, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = U.col(U.shade(col, -18)); ctx.lineWidth = Math.max(1, s * 0.1); ctx.beginPath(); ctx.moveTo(x + s * 0.7, y - s * 0.35); ctx.lineTo(x + s * 1.2, y - s * 0.2); ctx.stroke();
      ctx.restore(); return;
    }
    const w = h * a.w * 0.5, hh = h * a.h * 0.5; const f = pc.half === 'L' ? -1 : 1; // the cut faces the path
    ctx.fillStyle = 'rgba(25,12,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, y + 2, w * 0.95, hh * 0.28, 0, 0, U.TAU); ctx.fill();
    const g = ctx.createLinearGradient(x, y - hh, x, y); g.addColorStop(0, U.col(U.shade(a.col, 10))); g.addColorStop(1, U.col(U.shade(a.col, -12)));
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(x - f * w * 0.05, y); ctx.lineTo(x - f * w * 0.05, y - hh);
    ctx.bezierCurveTo(x - f * w * 0.5, y - hh * 1.15, x - f * w * 0.95, y - hh * 0.9, x - f * w, y - hh * 0.35);
    ctx.quadraticCurveTo(x - f * w * 0.9, y, x - f * w * 0.6, y); ctx.closePath(); ctx.fill();
    if (pc.kind === 'ram') { const r = U.rng(9); ctx.fillStyle = U.col(U.shade(a.col, 6), 0.7); for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(x - f * w * (0.2 + r() * 0.7), y - hh * (0.3 + r() * 0.6), hh * 0.18, 0, U.TAU); ctx.fill(); } }
    ctx.fillStyle = U.col(U.shade(a.col, -22, -8)); ctx.fillRect(x - f * w * 0.05 - (f > 0 ? 0 : hh * 0.08), y - hh, hh * 0.08, hh);
    ctx.strokeStyle = U.col(U.shade(a.col, -16)); ctx.lineWidth = Math.max(1, h * 0.012);
    [0.25, 0.5].forEach(k => { ctx.beginPath(); ctx.moveTo(x - f * w * k, y); ctx.lineTo(x - f * w * (k + 0.06), y + hh * 0.22); ctx.stroke(); });
    ctx.restore();
  }
  function buildSunset() {
    const sc = S.landscape(Object.assign({}, S.pal.mamre, { sun: Object.assign({}, S.pal.mamre.sun) }));
    sc.kind = 'sunset'; sc.pieces = []; sc.slots = []; sc.raptors = []; sc.lamp = 0; sc.torchK = null;
    sc.onInit = (W, H) => {
      const h = sc.figH = U.clamp(H * 0.2, 76, 160), gy = sc.groundPx = sc.pal.groundY * H;
      const narrow = W < 700;
      const cx = narrow ? W * 0.42 : W * 0.42, gap = narrow ? W * 0.2 : Math.min(W * 0.17, h * 1.6);
      sc.pathX = cx;
      const rows = [0.08, 0.4, 0.72];
      sc.slots = [];
      ['heifer', 'goat', 'ram'].forEach((k, i) => { sc.slots.push({ kind: k, half: 'L', x: cx - gap, y: gy + h * rows[i] }); sc.slots.push({ kind: k, half: 'R', x: cx + gap, y: gy + h * rows[i] }); });
      sc.slots.push({ kind: 'bird', half: 'dove', x: cx, y: gy - h * 0.18 }); sc.slots.push({ kind: 'bird', half: 'young', x: cx, y: gy + h * 0.98 });
      if (!sc.pieces.length) {
        const r = U.rng(5);
        sc.slots.forEach((s, i) => sc.pieces.push({ kind: s.kind, half: s.half, x: (narrow ? W * 0.72 : W * 0.78) + (r() - 0.5) * W * (narrow ? 0.08 : 0.12), y: gy + h * (0.05 + (i / sc.slots.length) * 0.85), placed: false, slot: null }));
      } else sc.pieces.forEach(p => { if (p.placed) { p.x = p.slot.x; p.y = p.slot.y; } });
      if (!sc.abram) {
        sc.abram = { kind: 'figure', name: 'abram', fixed: true, still: true, x: narrow ? W * 0.9 : W * 0.72, y: gy + h * 0.55, h: narrow ? h * 0.85 : h, staff: true, facing: -1, ...S.ROBES.abram };
        sc.actors.push(sc.abram);
        if (!narrow) sc.props.push({ x: W * 0.95, y: gy + h * 0.02, depth: 0, draw(ctx, x, y) { P.oak(ctx, x, y, h * 2.0, 12, [85, 24, 22]); } });
        sc.piecesProp = { x: 0, y: gy + h * 0.5, depth: 0, draw(ctx) {
          const T = sc.torchK;
          sc.slots.forEach((s, i) => { if (sc.showSlots && !sc.pieces.some(p => p.placed && p.slot === s)) { ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = `rgba(255,240,200,${0.3 + 0.15 * Math.sin(sc.t * 3 + i)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(s.x, s.y - h * 0.08, h * 0.26, h * 0.14, 0, 0, U.TAU); ctx.stroke(); ctx.restore(); } });
          sc.pieces.forEach(p => { if (p === sc.drag) return; drawPiece(ctx, p, p.x, p.y, h, T ? 0 : 1); });
          if (sc.drag) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 8; drawPiece(ctx, sc.drag, sc.drag.x, sc.drag.y - 8, h); ctx.restore(); }
        } };
        sc.props.push(sc.piecesProp);
      }
    };
    sc.hooks.near = (ctx, W, H, t) => {
      const h = sc.figH;
      sc.raptors.forEach(r => { if (r.state === 'gone') return; ctx.save(); ctx.globalAlpha = 0.95; const ang = Math.atan2(r.vy, r.vx) * 0.25; P.raptor(ctx, r.x, r.y, h * (r.state === 'land' ? 0.26 : 0.3) * r.scale, r.flap, ang, r.state === 'land' ? 'rgba(22,14,18,0.95)' : undefined); ctx.restore(); });
    };
    // the torch of fire passing between the pieces, after the dark
    sc.hooks.over = (ctx, W, H, t) => {
      const T = sc.torchK; if (!T) return;
      const h = sc.figH;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      // smoking furnace at the head of the path
      if (T.furnace > 0) { P.glow(ctx, T.fx, T.fy, h * 0.7, 'rgba(255,120,40,1)', 0.35 * T.furnace, 0.1); const r = U.rng(3); for (let i = 0; i < 14; i++) { const k = (t * 0.12 + i / 14) % 1; const x = T.fx + Math.sin(k * 9 + i) * h * 0.25 * k, y = T.fy - k * h * 2.2; ctx.fillStyle = `rgba(90,70,60,${0.1 * T.furnace * (1 - k)})`; ctx.beginPath(); ctx.arc(x, y, h * (0.1 + k * 0.3), 0, U.TAU); ctx.fill(); } }
      if (T.k > 0) {
        const R = h * 2.1;
        P.glow(ctx, T.x, T.y, R * 1.5, 'rgba(255,150,60,1)', 0.5, 0.2);
        ctx.globalCompositeOperation = 'source-over';
        sc.pieces.forEach(p => { const d = U.dist(p.x, p.y, T.x, T.y); const a = U.clamp(1 - d / R, 0, 1); if (a > 0) drawPiece(ctx, p, p.x, p.y, h, Math.pow(a, 0.7) * 0.95); });
        ctx.globalCompositeOperation = 'lighter';
        P.flame(ctx, T.x, T.y, h * 0.3, t, 4, 1);
      }
      ctx.restore();
    };
    sc.onUpdate = dt => {
      sc.pieces.forEach(p => { if (!p.placed && p !== sc.drag && p.home) { p.x += (p.home.x - p.x) * Math.min(1, dt * 6); p.y += (p.home.y - p.y) * Math.min(1, dt * 6); if (U.dist(p.x, p.y, p.home.x, p.home.y) < 1) p.home = null; } });
      if (sc.birdsOn) updateRaptors(sc, dt * Math.min(spd(), 2.5));
    };
    st.sc = sc; st.kind = 'sunset'; E.setScene(sc); return sc;
  }
  function updateRaptors(sc, dt) {
    const W = sc.W, H = sc.H, h = sc.figH;
    sc.spawnT = (sc.spawnT || 0) - dt;
    if (sc.spawnT <= 0 && sc.raptors.filter(r => r.state !== 'gone').length < 3) {
      const side = Math.random() < 0.5 ? -1 : 1;
      sc.raptors.push({ x: side < 0 ? -h : W + h, y: H * (0.08 + Math.random() * 0.25), vx: -side * h * 0.9, vy: 0, state: 'circle', flap: Math.random() * 6, scale: 0.9 + Math.random() * 0.3, target: sc.slots[Math.floor(Math.random() * sc.slots.length)], ct: 1.5 + Math.random() * 2.5, peck: 0 });
      sc.spawnT = 3.2 + Math.random() * 3;
    }
    sc.raptors.forEach(r => {
      r.flap += dt * (r.state === 'flee' ? 14 : r.state === 'land' ? 2 : 6);
      if (r.state === 'circle') {
        r.ct -= dt; r.vy = Math.sin(r.flap * 0.5) * h * 0.2;
        if (r.x < -h * 1.5 && r.vx < 0) r.vx = Math.abs(r.vx); if (r.x > W + h * 1.5 && r.vx > 0) r.vx = -Math.abs(r.vx);
        if (r.ct <= 0) r.state = 'dive';
      } else if (r.state === 'dive') {
        const tx = r.target.x, ty = r.target.y - h * 0.15; const d = U.dist(r.x, r.y, tx, ty);
        const sp = h * 1.6; r.vx = (tx - r.x) / d * sp; r.vy = (ty - r.y) / d * sp;
        if (d < sp * dt * 1.2) { r.state = 'land'; r.x = tx; r.y = ty; r.vx = r.vy = 0; A.drum('wings', 0.4); sc.landed = (sc.landed || 0) + 1; }
      } else if (r.state === 'land') {
        r.peck += dt;
        r.y = r.target.y - h * 0.15 + Math.abs(Math.sin(r.peck * 6)) * h * 0.03;
      } else if (r.state === 'flee') {
        r.vy -= h * 2.2 * dt; r.vx *= 0.995;
        if (r.y < -h * 2) r.state = 'gone';
      }
      r.x += r.vx * dt; r.y += r.vy * dt;
    });
    sc.raptors = sc.raptors.filter(r => r.state !== 'gone');
  }
  function scare(sc, p, radius) {
    let hit = false;
    sc.raptors.forEach(r => { if (r.state === 'gone' || r.state === 'flee') return; if (U.dist(p.x, p.y, r.x, r.y) < radius) { r.state = 'flee'; r.vx = (r.x < sc.W / 2 ? -1 : 1) * sc.figH * 1.2; r.vy = -sc.figH * 1.8; hit = true; sc.driven = (sc.driven || 0) + 1; } });
    if (hit) { A.drum('wings', 0.8); A.drum('whoosh', 0.3); }
    return hit;
  }
  async function pieces() {
    const sc = buildSunset();
    A.setWind(0.3, 4); A.setDrone(0.12, 4); A.setDroneTone(150, 4); A.motif(true, 0.5);
    await E.fade(0, 2800);
    await S.voice(sc, [{ t: 'אֲנִי ה\' אֲשֶׁר הוֹצֵאתִיךָ מֵאוּר כַּשְׂדִּים לָתֶת לְךָ אֶת־הָאָרֶץ הַזֹּאת לְרִשְׁתָּהּ', ref: 'בראשית ט״ו, ז', hold: 4600 }], { pos: 'top' });
    await E.clearText();
    await E.say([{ t: 'אֲדֹנָי ה\' בַּמָּה אֵדַע כִּי אִירָשֶׁנָּה', cls: 'verse', who: 'אברם', ref: 'בראשית ט״ו, ח', hold: 3800 }], { pos: 'top' });
    await E.clearText();
    await S.voice(sc, [{ t: 'קְחָה לִי עֶגְלָה מְשֻׁלֶּשֶׁת וְעֵז מְשֻׁלֶּשֶׁת וְאַיִל מְשֻׁלָּשׁ וְתֹר וְגוֹזָל', ref: 'בראשית ט״ו, ט', hold: 5000 }], { pos: 'top' });
    await E.clearText();
    A.motif(false);
    // laying out the pieces
    const h = sc.figH;
    sc.showSlots = true; E.interactive = true;
    E.hint('הניחו את הבתרים זה מול זה, לאורך השביל. את הציפורים — שלמות, בקצותיו');
    sc.test = () => { const p = sc.pieces.find(x => !x.placed); const s = p && sc.slots.find(s => s.kind === p.kind && s.half === p.half); return { kind: 'pieces', piece: p && s ? { x: p.x, y: p.y - h * 0.1, tx: s.x, ty: s.y - h * 0.1 } : null }; };
    sc.down = p => { let best = null, bd = h * 0.5; sc.pieces.forEach(pc => { if (pc.placed) return; const d = U.dist(p.x, p.y, pc.x, pc.y - h * 0.12); if (d < bd) { bd = d; best = pc; } }); if (best) { sc.drag = best; best.home = null; sc.ox = best.x - p.x; sc.oy = best.y - p.y; E.hint(null); } };
    sc.move = p => { if (sc.drag) { sc.drag.x = p.x + sc.ox; sc.drag.y = p.y + sc.oy; } };
    sc.up = () => {
      const d = sc.drag; if (!d) return; sc.drag = null;
      let best = null, bd = h * 0.45;
      sc.slots.forEach(s => { if (sc.pieces.some(p => p.placed && p.slot === s)) return; const dd = U.dist(d.x, d.y, s.x, s.y); if (dd < bd) { bd = dd; best = s; } });
      if (best && best.kind === d.kind && best.half === d.half) { d.placed = true; d.slot = best; d.x = best.x; d.y = best.y; A.drum('stone', 0.5); A.pluck(A.scale[3], 0.3); }
      else {
        if (best) E.say([{ t: best.kind !== d.kind ? 'לא הבתר הזה. כל חיה — מול חציה.' : 'הצד הלא נכון. הבתרים פונים זה אל זה.', cls: 'whisper', hold: 2200 }], { pos: 'top', wait: false }).catch(() => { });
        d.home = { x: sc.W * (sc.W < 700 ? 0.72 : 0.78), y: d.y };
      }
    };
    await E.until(() => sc.pieces.every(p => p.placed));
    sc.down = sc.move = sc.up = null; sc.test = null; sc.showSlots = false; E.interactive = false; E.hint(null);
    await E.wait(800);
    await E.say([V('וַיְבַתֵּר אֹתָם בַּתָּוֶךְ וַיִּתֵּן אִישׁ־בִּתְרוֹ לִקְרַאת רֵעֵהוּ'), V('וְאֶת־הַצִּפֹּר לֹא בָתָר', 'בראשית ט״ו, י', 3600)], { pos: 'top' });
    await E.clearText();
    // the birds of prey, as the sun goes down
    await E.say(['השמש נוטה. ובשמיים — צללים חגים.'], { pos: 'top', hold: 2600 });
    await E.clearText();
    const dur = 48000;
    const sun = sc.pal.sun; const y0 = sun.y;
    sc.birdsOn = true; E.interactive = true;
    E.hint(E.mobile ? 'געו בעיט כדי להשיב אותו' : 'לחצו על העיט כדי להשיב אותו');
    sc.tap = p => scare(sc, p, h * 0.55);
    sc.hover = p => { if (!E.mobile) scare(sc, p, h * 0.3); };
    sc.test = () => { const r = sc.raptors.find(x => x.state === 'land') || sc.raptors.find(x => x.state === 'dive' && x.y > 0 && x.y < sc.H); return { kind: 'birds', bird: r ? { x: r.x, y: r.y } : null, landed: sc.landed || 0, driven: sc.driven || 0 }; };
    const t0 = performance.now();
    let hinted = false;
    await E.until(() => { const k = U.clamp((performance.now() - t0) / (dur / spd()), 0, 1); sun.y = y0 + k * 0.1; sc.sunK = 1 - k * 0.6; sc.dark = k * 0.45; sc.tint = 'rgb(90,80,120)'; sc.tintK = k * 0.5; if (!hinted && (sc.driven || 0) >= 2) { hinted = true; E.hint(null); } return k >= 1; });
    sc.tap = null; sc.hover = null; sc.test = null; E.interactive = false; E.hint(null);
    sc.raptors.forEach(r => { r.state = 'flee'; r.vy = -h * 2; r.vx = (r.x < sc.W / 2 ? -1 : 1) * h; });
    await E.say([V('וַיֵּרֶד הָעַיִט עַל־הַפְּגָרִים וַיַּשֵּׁב אֹתָם אַבְרָם', 'בראשית ט״ו, יא', 4200)], { pos: 'top' });
    await E.clearText();
    sc.birdsOn = false;
  }

  // ---------- the dread ----------
  async function dread() {
    const sc = (E.scene === st.sc && st.kind === 'sunset') ? st.sc : buildSunset();
    if (E.scene !== sc) E.setScene(sc);
    sc.pieces.forEach((p, i) => { p.placed = true; p.slot = sc.slots[i]; p.x = p.slot.x; p.y = p.slot.y; });
    sc.sunK = 0.4; sc.dark = Math.max(sc.dark, 0.45); sc.tint = 'rgb(90,80,120)'; sc.tintK = 0.5;
    await E.fade(0, 1500);
    A.setWind(0.1, 5); A.setDrone(0.45, 6); A.setDroneTone(76, 6);
    await E.say([V('וַיְהִי הַשֶּׁמֶשׁ לָבוֹא וְתַרְדֵּמָה נָפְלָה עַל־אַבְרָם', 'בראשית ט״ו, יב', 3600)], { pos: 'center' });
    S.tween(sc, 'dark', 1, 7000).catch(() => { });
    A.drum('rumble', 1);
    await E.say([{ t: 'וְהִנֵּה אֵימָה חֲשֵׁכָה גְדֹלָה נֹפֶלֶת עָלָיו', cls: 'verse big', ref: 'בראשית ט״ו, יב', hold: 5600 }], { pos: 'center' });
    await E.clearText();
    await E.wait(2200);
    A.drum('deep', 0.8);
    await E.say([{ t: 'יָדֹעַ תֵּדַע', cls: 'voice', hold: 3200 }, { t: 'כִּי־גֵר יִהְיֶה זַרְעֲךָ בְּאֶרֶץ לֹא לָהֶם', cls: 'voice', hold: 4200 }, { t: 'וַעֲבָדוּם וְעִנּוּ אֹתָם', cls: 'voice', hold: 3600 }, { t: 'אַרְבַּע מֵאוֹת שָׁנָה', cls: 'voice big', ref: 'בראשית ט״ו, יג', hold: 5000 }], { pos: 'center', rate: 1.2 });
    await E.hold({ label: 'לשאת', ms: 4200 });
    await E.clearText();
    await E.wait(1500);
    A.drum('deep', 0.6);
    await E.say([{ t: 'וְגַם אֶת־הַגּוֹי אֲשֶׁר יַעֲבֹדוּ דָּן אָנֹכִי', cls: 'voice', hold: 4000 }, { t: 'וְאַחֲרֵי־כֵן יֵצְאוּ בִּרְכֻשׁ גָּדוֹל', cls: 'voice', ref: 'בראשית ט״ו, יד', hold: 4400 }], { pos: 'center', rate: 1.2 });
    await E.clearText();
    await E.wait(1200);
    await E.say([{ t: 'וְאַתָּה תָּבוֹא אֶל־אֲבֹתֶיךָ בְּשָׁלוֹם תִּקָּבֵר בְּשֵׂיבָה טוֹבָה', cls: 'voice', ref: 'בראשית ט״ו, טו', hold: 4600 }], { pos: 'center', rate: 1.2 });
    await E.clearText();
    await E.wait(1000);
    await E.say([{ t: 'וְדוֹר רְבִיעִי יָשׁוּבוּ הֵנָּה', cls: 'voice', hold: 3800 }, { t: 'כִּי לֹא־שָׁלֵם עֲוֺן הָאֱמֹרִי עַד־הֵנָּה', cls: 'voice', ref: 'בראשית ט״ו, טז', hold: 4600 }], { pos: 'center', rate: 1.2 });
    await E.clearText();
    await E.wait(2000);
    await E.say(['ארבע מאות שנה — בתוך ההבטחה.', { t: 'הוא לא יראה אותן. הוא נושא אותן.', hold: 4200 }], { pos: 'center' });
    await E.clearText();
    await E.wait(1500);
  }

  // ---------- the torch between the pieces ----------
  async function torch() {
    const sc = (E.scene === st.sc && st.kind === 'sunset') ? st.sc : buildSunset();
    if (E.scene !== sc) E.setScene(sc);
    sc.pieces.forEach((p, i) => { p.placed = true; p.slot = sc.slots[i]; p.x = p.slot.x; p.y = p.slot.y; });
    sc.dark = 1; sc.sunK = 0;
    await E.fade(0, 1000);
    A.setWind(0.05, 4); A.setDrone(0.3, 4); A.setDroneTone(76, 4);
    const h = sc.figH, gy = sc.groundPx;
    const T = sc.torchK = { x: sc.pathX, y: gy - h * 0.3, fx: sc.pathX, fy: gy - h * 0.25, furnace: 0, k: 0 };
    await E.say([V('וַיְהִי הַשֶּׁמֶשׁ בָּאָה וַעֲלָטָה הָיָה', 'בראשית ט״ו, יז', 3400)], { pos: 'top' });
    await E.clearText();
    await S.tween(T, 'furnace', 1, 4000);
    A.drum('rumble', 0.5);
    await E.say([V('וְהִנֵּה תַנּוּר עָשָׁן', 'בראשית ט״ו, יז', 3000)], { pos: 'top' });
    T.k = 1; A.setChord(0.35, 8);
    E.say([V('וְלַפִּיד אֵשׁ אֲשֶׁר עָבַר בֵּין הַגְּזָרִים הָאֵלֶּה', 'בראשית ט״ו, יז', 6000)], { pos: 'top', wait: false }).catch(() => { });
    await S.tween(T, 'y', gy + h * 1.05, 14000, U.easeInOut);
    await E.wait(600);
    await S.tween(T, 'y', gy - h * 0.3, 9000, U.easeInOut);
    await E.clearText();
    A.setChord(0.95, 10); A.setShimmer(0.6, 8);
    await E.say([
      { t: 'בַּיּוֹם הַהוּא כָּרַת ה\' אֶת־אַבְרָם בְּרִית לֵאמֹר', cls: 'voice', hold: 4200 },
      { t: 'לְזַרְעֲךָ נָתַתִּי אֶת־הָאָרֶץ הַזֹּאת', cls: 'voice', hold: 4400 },
      { t: 'מִנְּהַר מִצְרַיִם עַד־הַנָּהָר הַגָּדֹל נְהַר־פְּרָת', cls: 'voice', ref: 'בראשית ט״ו, יח', hold: 6000 },
    ], { pos: 'center', rate: 1.15 });
    await E.clearText();
    await E.wait(1500);
    await E.say(['לא "אתן". נתתי.', { t: 'הברית נכרתה בחושך, בין בתרים, עם אדם ישן.', hold: 4200 }], { pos: 'center' });
    await E.clearText();
    S.tween(T, 'k', 0, 5000).catch(() => { }); S.tween(T, 'furnace', 0, 5000).catch(() => { });
    A.setChord(0.3, 8); A.setShimmer(0, 6);
    await E.fade(1, 4000);
  }

  // ---------- epilogue ----------
  async function epilogue() {
    E.setScene({ kind: 'black', draw(ctx, W, H) { ctx.fillStyle = '#060508'; ctx.fillRect(0, 0, W, H); } });
    st.sc = E.scene; st.kind = 'black';
    await E.fade(0, 1500);
    A.setWind(0.05, 3); A.setDrone(0.12, 4); A.setDroneTone(120, 4); A.setChord(0.2, 6);
    await E.say([{ t: 'ואחר כך', cls: 'whisper', hold: 2600 }], { pos: 'center' });
    await E.clearText();
    await E.say([V('וַיְהִי אַבְרָם בֶּן־תִּשְׁעִים שָׁנָה וְתֵשַׁע שָׁנִים', 'בראשית י״ז, א'), { t: 'אֲנִי־אֵל שַׁדַּי הִתְהַלֵּךְ לְפָנַי וֶהְיֵה תָמִים', cls: 'voice', ref: 'בראשית י״ז, א', hold: 4200 }], { pos: 'center' });
    await E.clearText();
    await E.say([
      { t: 'וְלֹא־יִקָּרֵא עוֹד אֶת־שִׁמְךָ <span class="em">אַבְרָם</span>', cls: 'voice', hold: 3400 },
      { t: 'וְהָיָה שִׁמְךָ <span class="em">אַבְרָהָם</span> כִּי אַב־הֲמוֹן גּוֹיִם נְתַתִּיךָ', cls: 'voice', ref: 'בראשית י״ז, ה', hold: 4600 },
    ], { pos: 'center' });
    await E.clearText();
    await E.say([{ t: 'שָׂרַי אִשְׁתְּךָ לֹא־תִקְרָא אֶת־שְׁמָהּ <span class="em">שָׂרָי</span> כִּי <span class="em">שָׂרָה</span> שְׁמָהּ', cls: 'voice', ref: 'בראשית י״ז, טו', hold: 4600 }], { pos: 'center' });
    await E.clearText();
    await E.say([
      { t: 'זֹאת בְּרִיתִי אֲשֶׁר תִּשְׁמְרוּ בֵּינִי וּבֵינֵיכֶם וּבֵין זַרְעֲךָ אַחֲרֶיךָ הִמּוֹל לָכֶם כָּל־זָכָר', cls: 'voice', hold: 4600 },
      { t: 'וְהָיָה לְאוֹת בְּרִית בֵּינִי וּבֵינֵיכֶם', cls: 'voice', ref: 'בראשית י״ז, י–יא', hold: 4200 },
    ], { pos: 'center' });
    await E.clearText();
    await E.say([{ t: 'וַהֲקִמֹתִי אֶת־בְּרִיתִי בֵּינִי וּבֵינֶךָ וּבֵין זַרְעֲךָ אַחֲרֶיךָ לְדֹרֹתָם לִבְרִית עוֹלָם', cls: 'voice', ref: 'בראשית י״ז, ז', hold: 5000 }], { pos: 'center' });
    await E.clearText();
    await E.wait(2000);
    A.setChord(0.5, 8);
    // the landing
    const sky = starScene(); sky.look = 1; sky.mult = 1; sky.phase = 'done';
    E.setScene(sky); st.sc = sky; st.kind = 'stars';
    await E.wait(2500);
    await E.say(['אברם לא הספיק לספור את כולם.', { t: 'אחד מהם קורא עכשיו את השורה הזאת.', hold: 6500 }], { pos: 'center' });
    await E.clearText();
    await E.wait(1500);
    A.setChord(0, 8);
    await E.fade(1, 4000);
    await E.title('לֶךְ־לְךָ', 'סוף הפרשה · בראשית י״ב–י״ז', { ms: 3600, label: 'אל התפריט' });
    E.setScene(null);
    await E.wait(2200, false);
    if (window.LL && window.LL.openMenu) window.LL.openMenu();
  }

  E.chapters.ch3 = {
    run(scene, id) {
      return E.runScenes('ch3', [['fear', fear], ['stars', stars], ['pieces', pieces], ['dread', dread], ['torch', torch], ['epilogue', epilogue]], scene, id);
    },
  };
})();

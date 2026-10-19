/* prologue.js — לך לך: חרן עם שחר, עקירת היתדות, כותרת */
'use strict';
(function () {
  const E = Engine, S = Scenes, P = Paint, A = Audio2;
  const st = { sc: null };

  // ---------- the scene: Charan at dawn, a tent with four pegs ----------
  function build() {
    const sc = S.landscape(S.pal.charan);
    sc.kind = 'charan';
    sc.collapse = 0;
    sc.pegs = [
      { dx: -0.62, dy: 0.07, pull: 0, out: false, line: 'בית אביו. הדלת שידע לפתוח גם בחושך.' },
      { dx: 0.62, dy: 0.07, pull: 0, out: false, line: 'אלוהי חרן. האבנים שכל העיר כרעה להן — וגם הוא, פעם.' },
      { dx: -0.46, dy: 0.13, pull: 0, out: false, line: 'קבר תרח. מעכשיו לא יישב איש לידו.' },
      { dx: 0.46, dy: 0.13, pull: 0, out: false, line: 'השפה שבה חלם מילדות. מעבר לנהר מדברים אחרת.' },
    ];
    sc.onInit = (W, H) => {
      const gy = sc.pal.groundY * H;
      const h = U.clamp(H * 0.2, 76, 160);
      const narrow = W < 700;
      const tw = Math.min(h * 2.7, W * 0.56), th = tw * 0.5;
      sc.figH = h; sc.groundPx = gy;
      sc.tentSpec = { w: tw, h: th };
      sc.tentProp.x = narrow ? W * 0.66 : W * 0.5 + h * 2.1;
      sc.tentProp.y = gy + h * 0.28;
      if (sc.abramStand) { sc.abramStand.x = narrow ? W * 0.2 : W * 0.5 - h * 0.5; sc.abramStand.y = gy + h * 0.55; sc.abramStand.h = h; }
    };
    // Charan in the distance, on the far ridge
    sc.hooks.ridge0 = (ctx, W, H, t, offset) => {
      const r = sc.pal.ridges[0];
      const x = W * 0.2 + offset;
      P.city(ctx, x, r.baseY * H + H * 0.012, W * 0.34, H * 0.07, 5, [268, 16, 36], 0.9);
      // a few lit windows before dawn
      const rr = U.rng(8);
      for (let i = 0; i < 9; i++) {
        const wx = x + (rr() - 0.5) * W * 0.3, wy = r.baseY * H - rr() * H * 0.035;
        ctx.fillStyle = `rgba(255,200,120,${0.25 + 0.2 * Math.sin(t * 2 + i)})`; ctx.fillRect(wx, wy, 2, 2);
      }
    };
    sc.tentProp = { x: 0, y: 0, depth: 1, draw(ctx, x, y) {
      const T = sc.tentSpec; if (!T) return;
      P.tent(ctx, { x, y, w: T.w, h: T.h, collapse: sc.collapse, color: [24, 26, 23], pegs: sc.pegs.map(p => ({ dx: p.dx * T.w, dy: p.dy * T.h, pull: Math.min(1, p.pull) })) });
      sc.pegs.forEach(p => { p.sx = x + p.dx * T.w; p.sy = y + p.dy * T.h - Math.min(1, p.pull) * 22; });
    } };
    sc.props.push(sc.tentProp);
    sc.abramStand = { kind: 'figure', name: 'abram', fixed: true, still: true, x: 0, y: 0, h: 100, staff: true, facing: -1, ...S.ROBES.abram };
    sc.actors.push(sc.abramStand);
    // pegs that were released drift back into the ground
    sc.onUpdate = dt => {
      sc.pegs.forEach(p => { if (!p.out && p !== (sc.drag && sc.drag.peg)) p.pull = Math.max(0, p.pull - dt * 1.6); });
    };
    st.sc = sc;
    E.setScene(sc);
    return sc;
  }
  function ensure() { if (E.scene !== st.sc || !st.sc) build(); return st.sc; }

  // ---------- scenes ----------
  async function dawn() {
    const sc = build();
    A.setWind(0.55, 4); A.setDrone(0.25, 6); A.setDroneTone(140, 4);
    await E.fade(0, 3200);
    await E.wait(900);
    await E.say([
      'חרן. השעה שלפני הזריחה.',
      'העיר עוד ישנה. רק הרוח ערה.',
      { t: 'אברם בן שבעים וחמש. כל מה שיש לו — כאן.', hold: 3200 },
    ], { pos: 'low' });
    await E.clearText();
    await E.wait(1200);
    A.motif(false);
    await S.voice(sc, [
      'לֶךְ־לְךָ',
      'מֵאַרְצְךָ וּמִמּוֹלַדְתְּךָ וּמִבֵּית אָבִיךָ',
      { t: 'אֶל־הָאָרֶץ אֲשֶׁר אַרְאֶךָּ', ref: 'בראשית י״ב, א', hold: 3600 },
    ], { keep: true });
    await S.voice(sc, [
      { t: 'וְאֶעֶשְׂךָ לְגוֹי גָּדוֹל וַאֲבָרֶכְךָ וַאֲגַדְּלָה שְׁמֶךָ', hold: 3400 },
      { t: 'וֶהְיֵה בְּרָכָה', ref: 'בראשית י״ב, ב', hold: 3400 },
    ]);
    await E.clearText();
    await E.wait(1600);
    await E.say([
      'הארץ לא נקראה בשם.',
      'לא נאמר כמה רחוק. לא נאמר כמה זמן.',
      { t: 'נאמר רק: לך.', hold: 2600 },
    ], { pos: 'low' });
    await E.clearText();
    await E.wait(600);
  }

  async function pegs() {
    const sc = ensure();
    A.setWind(0.5, 3);
    await E.fade(0, 1600);
    await E.say(['כדי ללכת, צריך קודם לעקור.'], { pos: 'low', hold: 2200 });
    await E.clearText();
    E.interactive = true;
    E.hint(E.mobile ? 'געו ביתד ומשכו אותה כלפי מעלה' : 'לחצו על יתד ומשכו אותה כלפי מעלה');
    let outCount = sc.pegs.filter(p => p.out).length;
    sc.test = () => ({ kind: 'pegs', pegs: sc.pegs.map(p => ({ x: p.sx, y: p.sy, out: p.out })) });
    const grab = () => Math.max(46, sc.figH * 0.45);
    sc.down = p => {
      let best = null, bd = grab();
      sc.pegs.forEach(pg => { if (pg.out || pg.sx == null) return; const d = U.dist(p.x, p.y, pg.sx, pg.sy); if (d < bd) { bd = d; best = pg; } });
      if (best) { sc.drag = { peg: best, y0: p.y, p0: best.pull }; E.hint(null); A.drum('stone', 0.25); }
    };
    sc.move = p => {
      const d = sc.drag; if (!d || d.peg.out) return;
      const span = Math.max(70, sc.figH * 0.75);
      const was = d.peg.pull;
      d.peg.pull = U.clamp(d.p0 + (d.y0 - p.y) / span, 0, 1.05);
      if (was < 0.5 && d.peg.pull >= 0.5) A.drum('stone', 0.4);
      if (d.peg.pull >= 1) {
        d.peg.out = true; outCount++;
        A.drum('whoosh', 0.7); A.pluck(A.scale[outCount % A.scale.length], 0.45);
        sc.collapse = Math.min(0.9, outCount * 0.22);
        E.say([{ t: d.peg.line, cls: 'narr', hold: 3800 }], { pos: 'top', narrow: true }).catch(() => { });
        sc.drag = null;
      }
    };
    sc.up = () => { if (sc.drag) { sc.drag = null; } };
    await E.until(() => outCount >= 4);
    sc.down = sc.move = sc.up = null; sc.test = null; E.interactive = false; E.hint(null);
    await E.wait(1400);
    A.drum('thud', 0.5);
    await S.tween(sc, 'collapse', 1, 1600);
    await E.wait(1200);
    await E.clearText();
    await E.say([
      'אוהל מקופל הוא רק בד.',
      { t: 'מקום הוא מה שמשאירים מאחור.', hold: 3000 },
    ], { pos: 'low' });
    await E.clearText();
    await E.wait(500);
  }

  async function go() {
    const sc = ensure();
    sc.collapse = 1; sc.pegs.forEach(p => { p.out = true; p.pull = 1; });
    await E.fade(0, 1400);
    // the caravan gathers around Abram
    sc.abramStand.hidden = true;
    const narrow = sc.W < 700;
    const all = S.caravan(sc, sc.W, sc.H, { lot: true, servants: 2, flock: 6, donkeys: 1, camels: 1, shift: narrow ? -sc.W * 0.28 : 0 });
    all.forEach(a => { if (a.name !== 'abram') a.alpha = 0; });
    const fadeIn = async () => { for (const a of all) { if (a.name === 'abram') continue; S.tween(a, 'alpha', 1, 1800).catch(() => { }); await E.wait(260, false); } };
    fadeIn().catch(() => { });
    A.setWind(0.4, 4); A.motif(true, 0.8);
    await E.wait(1800);
    sc.targetSpeed = 1;
    await E.say([
      { t: 'וַיֵּלֶךְ אַבְרָם כַּאֲשֶׁר דִּבֶּר אֵלָיו ה\' וַיֵּלֶךְ אִתּוֹ לוֹט', cls: 'verse', hold: 4200 },
      { t: 'וְאַבְרָם בֶּן־חָמֵשׁ שָׁנִים וְשִׁבְעִים שָׁנָה בְּצֵאתוֹ מֵחָרָן', cls: 'verse', ref: 'בראשית י״ב, ד', hold: 4200 },
    ], { pos: 'low' });
    await E.say([
      { t: 'וַיִּקַּח אַבְרָם אֶת־שָׂרַי אִשְׁתּוֹ וְאֶת־לוֹט בֶּן־אָחִיו וְאֶת־כָּל־רְכוּשָׁם אֲשֶׁר רָכָשׁוּ', cls: 'verse', hold: 4000 },
      { t: 'וַיֵּצְאוּ לָלֶכֶת אַרְצָה כְּנַעַן', cls: 'verse', ref: 'בראשית י״ב, ה', hold: 3600 },
    ], { pos: 'low' });
    // keep walking as the scene drifts into darkness
    const walker = (async () => { while (true) { sc.scroll += sc.speed * Math.min(220, sc.W * 0.2) * E.dt; await E.nextFrame(); } })().catch(() => { });
    await E.clearText();
    await E.fade(1, 3000);
    sc.targetSpeed = 0;
    A.setWind(0.2, 4); A.motif(false);
    A.setChord(0.25, 4);
    await E.title('לֶךְ־לְךָ', 'פרשת לך לך · בראשית י״ב–י״ז', { ms: 4200, label: 'אל הפרק הראשון' });
    A.setChord(0, 3);
    void walker;
  }

  E.chapters.prologue = {
    run(scene, id) {
      return E.runScenes('prologue', [['dawn', dawn], ['pegs', pegs], ['go', go]], scene, id);
    },
  };
})();

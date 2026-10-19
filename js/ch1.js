/* ch1.js — פרק א: המסע, הרעב, ומצרים; הפרידה מלוט */
'use strict';
(function () {
  const E = Engine, S = Scenes, P = Paint, A = Audio2;
  const st = { sc: null, kind: null };

  // ---------- builders ----------
  function land(kind, palKey, carav, setup) {
    const sc = S.landscape(S.pal[palKey]);
    sc.kind = kind;
    sc.onInit = (W, H) => {
      if (!sc.caravanBuilt && carav) {
        sc.caravanBuilt = true;
        S.caravan(sc, W, H, Object.assign({ shift: W < 700 ? -W * 0.2 : 0 }, carav));
      } else if (!sc.figH) { sc.figH = U.clamp(H * 0.2, 76, 160); sc.groundPx = sc.pal.groundY * H; }
      if (setup) setup(sc, W, H);
    };
    st.sc = sc; st.kind = kind;
    E.setScene(sc);
    return sc;
  }
  function ensure(kind, builder) { if (E.scene !== st.sc || st.kind !== kind || !st.sc) builder(); return st.sc; }
  function altarProp(sc, worldX, s, flame) {
    const prop = { x: worldX, y: sc.groundPx + sc.figH * 0.3 + s * 0.5, depth: 1, flame: flame || 0, s,
      draw(ctx, x, y, t) { P.altar(ctx, x, y - s * 0.5, s, 6, prop.flame, t); } };
    sc.props.push(prop);
    return prop;
  }
  async function walk(sc, dist, opts) {
    sc.test = () => ({ kind: 'walk' });
    try { await S.walk(sc, dist, opts); } finally { sc.test = null; }
  }
  async function buildAltar(sc, o) {
    sc.test = () => {
      const a = sc.altarState, stones = sc.altarStones || [], slots = sc.altarSlots || [];
      const stone = stones.find(x => !x.placed), slot = slots[a ? a.placed : 0];
      return { kind: 'altar', stone: stone ? { x: stone.x, y: stone.y } : null, slot: slot ? { x: slot.x, y: slot.y } : null };
    };
    try { return await S.buildAltar(sc, o); } finally { sc.test = null; }
  }
  // a choice where history is fixed: alternatives are tried, gently refused, and dimmed
  async function fixedChoice(opts, trueValue, refuse) {
    const tried = new Set();
    while (true) {
      const v = await E.choice(opts.map(o => Object.assign({}, o, { dim: tried.has(o.value) })));
      if (v === trueValue) return v;
      tried.add(v);
      await refuse(v);
    }
  }
  function oakProp(sc, worldX, scale, seed) {
    const prop = { x: worldX, y: sc.groundPx + sc.figH * 0.1, depth: 1, draw(ctx, x, y) { P.oak(ctx, x, y, sc.figH * (scale || 1.9), seed || 3); } };
    sc.props.push(prop); return prop;
  }
  const V = (t, ref, hold) => ({ t, cls: 'verse', ref, hold });

  // ---------- scene 1: Shechem, Elon Moreh ----------
  function buildCanaan() {
    return land('canaan', 'canaan', { lot: true, servants: 2, flock: 7, donkeys: 1, camels: 1 });
  }
  async function shechem() {
    await E.fade(1, 10);
    await E.title('<small>פרק ראשון</small><span style="font-size:.62em">הַמַּסָּע, הָרָעָב, וּמִצְרַיִם</span>', '', { ms: 3600 });
    const sc = buildCanaan();
    A.setWind(0.35, 4); A.setDrone(0.15, 6); A.motif(true, 0.7);
    await E.fade(0, 2800);
    await E.say(['ארץ כנען.', 'ההרים כאן ירוקים יותר. הדרך — ארוכה יותר.'], { pos: 'top' });
    await E.clearText();
    const d1 = sc.W * 1.25;
    oakProp(sc, sc.W * 0.22 - d1, 2.1, 3);
    oakProp(sc, sc.W * 0.1 - d1 * 0.55, 1.4, 4);
    await walk(sc, d1);
    await E.say([
      V('וַיַּעֲבֹר אַבְרָם בָּאָרֶץ עַד מְקוֹם שְׁכֶם עַד אֵלוֹן מוֹרֶה'),
      V('וְהַכְּנַעֲנִי אָז בָּאָרֶץ', 'בראשית י״ב, ו', 3000),
    ], { pos: 'top' });
    await E.clearText();
    await S.voice(sc, [{ t: 'לְזַרְעֲךָ אֶתֵּן אֶת־הָאָרֶץ הַזֹּאת', ref: 'בראשית י״ב, ז', hold: 4200 }]);
    await E.clearText();
    await E.say(['הארץ הראשונה שהובטחה לו.', 'ואין לו בה עדיין אפילו באר.'], { pos: 'top' });
    await E.clearText();
    const s = U.clamp(sc.figH * 0.34, 22, 48);
    const ax = sc.W * 0.3, ay = sc.groundPx + sc.figH * 0.3;
    const a = await buildAltar(sc, { x: ax, y: ay, s, count: 6, pileX: Math.min(ax + s * 5.5, sc.W - s * 2.2), hint: 'גררו את האבנים, אבן אחר אבן, אל המזבח' });
    await E.wait(400);
    S.tween(a, 'flame', 1, 2500).catch(() => { });
    A.phrase([[0, 420, 0.4], [3, 420, 0.35], [4, 900, 0.45]]);
    await E.say([V('וַיִּבֶן שָׁם מִזְבֵּחַ לַה\' הַנִּרְאֶה אֵלָיו', 'בראשית י״ב, ז', 4000)], { pos: 'top' });
    // the built altar stays behind when he walks on
    sc.altarProp.hidden = true;
    altarProp(sc, ax - sc.scroll, s, 1);
    await E.clearText();
  }

  // ---------- scene 2: Bethel ----------
  async function bethel() {
    const sc = ensure('canaan', buildCanaan);
    await E.fade(0, 1600);
    await E.say([V('וַיַּעְתֵּק מִשָּׁם הָהָרָה מִקֶּדֶם לְבֵית־אֵל', 'בראשית י״ב, ח')], { pos: 'top' });
    await E.clearText();
    const d = sc.W * 1.1;
    oakProp(sc, sc.W * 0.08 - d * 0.7, 1.3, 7);
    await walk(sc, d);
    await E.say([V('וַיֵּט אָהֳלֹה בֵּית־אֵל מִיָּם וְהָעַי מִקֶּדֶם', 'בראשית י״ב, ח', 3200)], { pos: 'top' });
    await E.clearText();
    const s = U.clamp(sc.figH * 0.34, 22, 48);
    const ax = sc.W * 0.3, ay = sc.groundPx + sc.figH * 0.3;
    const a = await buildAltar(sc, { x: ax, y: ay, s, count: 6, pileX: Math.min(ax + s * 5.5, sc.W - s * 2.2), hint: 'מזבח שני. גררו את האבנים' });
    S.tween(a, 'flame', 1, 2500).catch(() => { });
    sc.abram.still = true; sc.abram.staff = false; sc.abram.arms = 'up';
    A.setChord(0.18, 5);
    await E.say([V('וַיִּבֶן־שָׁם מִזְבֵּחַ לַה\' וַיִּקְרָא בְּשֵׁם ה\'', 'בראשית י״ב, ח', 4200)], { pos: 'top' });
    await E.clearText();
    await E.say(['בין בית־אל ובין העי.', { t: 'הוא עוד יחזור לכאן. אבל לא כך.', hold: 3000 }], { pos: 'top' });
    sc.abram.still = false; sc.abram.staff = true; sc.abram.arms = null;
    sc.altarProp.hidden = true;
    sc.bethelAltar = altarProp(sc, ax - sc.scroll, s, 1);
    A.setChord(0, 4);
    await E.clearText();
    await E.say([V('וַיִּסַּע אַבְרָם הָלוֹךְ וְנָסוֹעַ הַנֶּגְבָּה', 'בראשית י״ב, ט', 3400)], { pos: 'top' });
    await E.clearText();
    await E.fade(1, 2200);
  }

  // ---------- scene 3: famine ----------
  async function famine() {
    const sc = land('negev', 'negev', { lot: true, servants: 2, flock: 7, donkeys: 1, camels: 1 });
    A.setWind(0.6, 4); A.setDrone(0.3, 5); A.setDroneTone(120, 5); A.motif(false);
    await E.fade(0, 2600);
    await E.say([V('וַיְהִי רָעָב בָּאָרֶץ', 'בראשית י״ב, י', 3400)], { pos: 'center' });
    await E.clearText();
    E.hud('<div class="k"><span>מים</span><div class="bar"><i id="h-water" style="width:100%"></i></div></div><div class="k"><span>לחם</span><div class="bar"><i id="h-bread" style="width:100%"></i></div></div>');
    const water = E.el('h-water'), bread = E.el('h-bread');
    let prog = 0;
    const beats = (async () => {
      await E.until(() => prog > 0.22);
      await E.say(['הגשם לא בא.'], { pos: 'top', wait: false });
      await E.until(() => prog > 0.42);
      await E.say(['הרועים הפסיקו לספור את הצאן.'], { pos: 'top', wait: false });
      await E.until(() => prog > 0.62);
      await E.say(['הנאד האחרון. הלחם — ממחר כבר לא.'], { pos: 'top', wait: false });
      await E.until(() => prog > 0.84);
      await E.say(['דרומה, אל קצה הארץ שהובטחה.', 'ומעבר לקצה — מצרים.'], { pos: 'top', wait: false });
    })().catch(() => { });
    const flock = sc.flock.slice();
    await walk(sc, sc.W * 3.2, { hint: 'החזיקו כדי להמשיך ללכת. אין לאן לחזור.', speed: 0.85, onProgress: k => {
      prog = k;
      sc.drain = Math.min(0.95, k * 1.1);
      sc.tint = 'rgb(214,196,160)'; sc.tintK = k * 0.3; sc.tintMode = 'multiply';
      sc.heat = k;
      water.style.width = Math.max(0, 100 - k * 108) + '%';
      bread.style.width = Math.max(0, 100 - k * 100) + '%';
      const alive = Math.max(2, Math.round(flock.length * (1 - k * 0.8)));
      flock.forEach((f, i) => { f.hidden = i >= alive; });
      if (k > 0.6) { water.parentElement.classList.add('red'); }
    } });
    await beats;
    await E.clearText();
    await E.say(['אין עוד דרך דרומה.', { t: 'מעבר לגבול יש נהר, ויש לחם.', hold: 2600 }], { pos: 'top' });
    await fixedChoice([
      { label: 'לחכות לגשם', value: 'wait' },
      { label: 'לשוב צפונה', value: 'back' },
      { label: 'לרדת מצרימה', value: 'egypt', note: 'לגור שם' },
    ], 'egypt', async v => {
      if (v === 'wait') await E.say(['חיכו. יום. ועוד יום.', { t: 'השמיים נשארו ריקים.', hold: 2400 }], { pos: 'top' });
      else await E.say(['צפונה — אל אותו הרעב.', { t: 'הצאן לא יחזיק מעמד עד בית־אל.', hold: 2400 }], { pos: 'top' });
      await E.clearText();
    });
    E.hud('');
    await E.clearText();
    await E.say([V('וַיֵּרֶד אַבְרָם מִצְרַיְמָה לָגוּר שָׁם', 'בראשית י״ב, י'), V('כִּי־כָבֵד הָרָעָב בָּאָרֶץ', 'בראשית י״ב, י', 3400)], { pos: 'center' });
    await E.clearText();
    await E.fade(1, 2400);
  }

  // ---------- scene 4: the border of Egypt ----------
  function nileSetup(sc, W, H) {
    sc.hooks.ridge0 = (ctx, W, H, t, offset) => {
      const px = E.par.x;
      // palace, far on the other bank
      P.palace(ctx, W * 0.18 + offset * 1.5, H * 0.728, Math.min(W * 0.3, H * 0.5), H * 0.19, t, 0.72);
      // far palms
      const r = U.rng(31);
      for (let i = 0; i < 7; i++) { const x = W * 0.4 + r() * W * 0.7 + offset * 1.6 - px * 4; P.palm(ctx, ((x % (W * 1.3)) + W * 1.3) % (W * 1.3) - W * 0.15, H * 0.735, H * (0.08 + r() * 0.05), 40 + i, [110, 25, 30], Math.sin(t * 0.7 + i), 0.85); }
      // the Nile
      P.water(ctx, 0, H * 0.74, W, H * 0.085, t, [196, 38, 34], 9);
      ctx.fillStyle = 'rgba(255,245,220,0.06)'; ctx.fillRect(0, H * 0.74, W, 2);
      // near bank reeds
      P.reeds(ctx, -40 + ((-sc.scroll * 0.8) % 160), H * 0.835, W + 80, H * 0.09, 70, 12, t, [80, 28, 30]);
    };
  }
  function buildBorder() {
    return land('border', 'egypt', { lot: false, servants: 1, flock: 2, camels: 1, donkeys: 1 }, nileSetup);
  }
  async function border() {
    const sc = buildBorder();
    A.setWind(0.25, 4); A.setDrone(0.12, 5); A.setDroneTone(200, 5); A.motif(true, 0.5);
    await E.fade(0, 2800);
    await E.say(['גבול מצרים.', 'הנהר רחב וירוק, ומעבר לו — לחם.'], { pos: 'top' });
    await E.clearText();
    await E.say([V('וַיְהִי כַּאֲשֶׁר הִקְרִיב לָבוֹא מִצְרָיְמָה וַיֹּאמֶר אֶל־שָׂרַי אִשְׁתּוֹ', 'בראשית י״ב, יא')], { pos: 'top' });
    await E.say([
      { t: 'הִנֵּה־נָא יָדַעְתִּי כִּי אִשָּׁה יְפַת־מַרְאֶה אָתְּ', cls: 'verse', who: 'אברם' },
      { t: 'וְהָיָה כִּי־יִרְאוּ אֹתָךְ הַמִּצְרִים וְאָמְרוּ אִשְׁתּוֹ זֹאת וְהָרְגוּ אֹתִי וְאֹתָךְ יְחַיּוּ', cls: 'verse', hold: 4600 },
    ], { pos: 'top' });
    await E.clearText();
    await E.say(['הוא יודע מה הוא עומד לבקש.', { t: 'מה אומרים לה?', hold: 2200 }], { pos: 'top' });
    const sarai = sc.sarai;
    await fixedChoice([
      { label: 'לומר את האמת: אשתי היא', value: 'truth' },
      { label: 'לשוב אל הרעב', value: 'back' },
      { label: 'אִמְרִי־נָא אֲחֹתִי אָתְּ', value: 'sister', note: 'לְמַעַן יִיטַב־לִי בַעֲבוּרֵךְ' },
    ], 'sister', async v => {
      await E.clearText();
      if (v === 'truth') await E.say(['הוא חשב על זה.', '"והרגו אותי — ואותך יחיו."', { t: 'אבל כך לא היה.', cls: 'whisper', hold: 2600 }], { pos: 'top' });
      else await E.say(['מאחור — רק יובש.', '"כי כבד הרעב בארץ."', { t: 'אבל כך לא היה.', cls: 'whisper', hold: 2600 }], { pos: 'top' });
      await E.clearText();
    });
    await E.clearText();
    await E.say([
      { t: 'אִמְרִי־נָא אֲחֹתִי אָתְּ לְמַעַן יִיטַב־לִי בַעֲבוּרֵךְ וְחָיְתָה נַפְשִׁי בִּגְלָלֵךְ', cls: 'verse', who: 'אברם', ref: 'בראשית י״ב, יג', hold: 5200 },
    ], { pos: 'top' });
    await E.clearText();
    sarai.facing = 1;
    await E.say(['שרי לא ענתה.', { t: 'היא הסתכלה על הנהר.', hold: 3000 }], { pos: 'top' });
    await E.clearText();
    await E.say([{ t: 'מדרש: הוא הצפין אותה בתיבה. במכס שאלו — מה בפנים? שעורים, אמר. חיטים, אמרו. אשלם על חיטים. פתחו — ומצרים כולה האירה.', cls: 'whisper', hold: 7000 }], { pos: 'top', narrow: true });
    await E.clearText();
    sarai.facing = -1;
    await E.say([V('וַיְהִי כְּבוֹא אַבְרָם מִצְרָיְמָה וַיִּרְאוּ הַמִּצְרִים אֶת־הָאִשָּׁה כִּי־יָפָה הִוא מְאֹד', 'בראשית י״ב, יד', 4200)], { pos: 'top' });
    await E.clearText();
    await E.fade(1, 2000);
  }

  // ---------- scene 5: Sarai taken ----------
  function buildPalace() {
    const sc = land('palace', 'egypt', { lot: false, servants: 1, flock: 0, camels: 0, shift: 0 }, (sc, W, H) => {
      const narrow = W < 700;
      sc.palace = { x: narrow ? W * 0.8 : W * 0.68, w: Math.min(W * 0.5, H * 0.95), h: H * 0.46 };
      // place Abram & Sarai on the left, facing the palace
      sc.actors.forEach(a => { a.facing = 1; });
      const h = sc.figH, gy = sc.groundPx;
      sc.abram.x = narrow ? W * 0.12 : W * 0.26; sc.abram.y = gy + h * 0.55; sc.abram.still = true;
      sc.sarai.x = sc.abram.x + h * 0.55; sc.sarai.y = gy + h * 0.5; sc.sarai.still = true;
      sc.actors.filter(a => a.name === 'servant').forEach((a, i) => { a.x = sc.abram.x - h * (0.7 + i * 0.5); a.y = gy + h * 0.4; a.still = true; });
      sc.gate = { x: sc.palace.x, y: gy + h * 0.1 };
    });
    sc.hooks.mid = (ctx, W, H, t) => {
      const p = sc.palace; if (!p) return;
      P.palace(ctx, p.x - E.par.x * 10, sc.groundPx + sc.figH * 0.12, p.w, p.h, t, 1);
      if (sc.plague > 0) {
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = sc.plague * (0.8 + 0.12 * Math.sin(t * 9) + 0.08 * Math.sin(t * 23));
        const cy = sc.groundPx - p.h * 0.45, rr = Math.max(p.w, p.h) * 1.15;
        const g = ctx.createRadialGradient(p.x, cy, 0, p.x, cy, rr); g.addColorStop(0, 'rgba(150,40,50,1)'); g.addColorStop(0.55, 'rgba(170,80,80,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      }
    };
    sc.plague = 0;
    return sc;
  }
  async function moveActor(a, x, ms) { a.walking = true; a.facing = x > a.x ? 1 : -1; await S.tween(a, 'x', x, ms, k => k); a.walking = false; }
  async function taken() {
    const sc = buildPalace();
    A.setWind(0.15, 4); A.setDrone(0.2, 5); A.setDroneTone(90, 6); A.motif(false);
    await E.fade(0, 2600);
    E.letterbox(0.14, 2600);
    await E.say([V('וַיִּרְאוּ אֹתָהּ שָׂרֵי פַרְעֹה וַיְהַלְלוּ אֹתָהּ אֶל־פַּרְעֹה', 'בראשית י״ב, טו', 3600)], { pos: 'center' });
    await E.clearText();
    // two officials come out of the gate
    const h = sc.figH, gy = sc.groundPx;
    const offs = [0, 1].map(i => ({ kind: 'figure', name: 'egyptian', fixed: true, x: sc.gate.x, y: gy + h * (0.45 + i * 0.12), h: h * 0.95, facing: -1, phase: i * 2, alpha: 0, ...S.ROBES.egyptian }));
    sc.actors.push(...offs);
    offs.forEach(o => S.tween(o, 'alpha', 1, 1200).catch(() => { }));
    await Promise.all(offs.map((o, i) => moveActor(o, sc.sarai.x + h * (0.5 + i * 0.4), 5200)));
    await E.wait(1800);
    A.duck(0.12, 4);
    await E.say([V('וַתֻּקַּח הָאִשָּׁה בֵּית פַּרְעֹה', 'בראשית י״ב, טו', 4000)], { pos: 'center' });
    // Sarai walks away with them; she does not look back
    const gone = async () => {
      await E.wait(600, false);
      const p1 = moveActor(sc.sarai, sc.gate.x, 7000);
      offs.forEach(o => moveActor(o, sc.gate.x + h * 0.2, 7000).catch(() => { }));
      await E.wait(4600, false);
      S.tween(sc.sarai, 'alpha', 0, 2200).catch(() => { }); offs.forEach(o => S.tween(o, 'alpha', 0, 2200).catch(() => { }));
      await p1;
    };
    await gone();
    await E.clearText();
    await E.wait(2600);
    // the gifts, each one a blow
    await E.say([V('וּלְאַבְרָם הֵיטִיב בַּעֲבוּרָהּ', 'בראשית י״ב, טז', 2800)], { pos: 'center' });
    await E.clearText();
    const narrow = sc.W < 700, gs = narrow ? 0.36 : 1, ah = narrow ? h * 0.72 : h, ax = sc.abram.x;
    const gifts = [
      ['צֹאן', () => [0, 1, 2].map(i => ({ kind: 'sheep', fixed: true, x: ax + h * (1.3 + i * 0.45) * gs, y: gy + h * (0.2 + (i % 2) * 0.25), h: ah * 0.26, facing: -1, still: true, alpha: 0 }))],
      ['וּבָקָר', () => [0].map(i => ({ kind: 'ox', fixed: true, x: ax + h * 2.6 * gs, y: gy + h * 0.5, h: ah * 0.6, facing: -1, still: true, alpha: 0 }))],
      ['וַחֲמֹרִים', () => [0, 1].map(i => ({ kind: 'donkey', fixed: true, x: ax + h * (3.3 + i * 0.8) * gs, y: gy + h * (0.35 + i * 0.2), h: ah * 0.6, facing: -1, still: true, alpha: 0 }))],
      ['וַעֲבָדִים וּשְׁפָחֹת', () => [0, 1].map(i => ({ kind: 'figure', fixed: true, x: ax + h * (4.6 + i * 0.5) * gs, y: gy + h * (0.5 + i * 0.1), h: ah * 0.85, facing: -1, still: true, alpha: 0, dark: 0.3, ...S.ROBES.servant }))],
      ['וַאֲתֹנֹת', () => [0].map(i => ({ kind: 'donkey', fixed: true, x: ax + h * 5.6 * gs, y: gy + h * 0.28, h: ah * 0.55, facing: -1, still: true, alpha: 0 }))],
      ['וּגְמַלִּים', () => [0].map(i => ({ kind: 'camel', fixed: true, x: ax + h * 6.4 * gs, y: gy + h * 0.55, h: ah * 0.95, facing: -1, still: true, alpha: 0 }))],
    ];
    for (const [word, make] of gifts) {
      const as = make(); sc.actors.push(...as);
      A.drum('thud', 0.9); sc.dark = 0.35; S.tween(sc, 'dark', 0, 900).catch(() => { });
      as.forEach(a => S.tween(a, 'alpha', 1, 700).catch(() => { }));
      await E.say([{ t: word, cls: 'verse', hold: 2300 }], { pos: 'center', clearMs: 300 });
    }
    await E.clearText();
    await E.say(['כל מתנה — תשלום.', { t: 'והוא בחוץ.', hold: 3000 }], { pos: 'center' });
    await E.clearText();
    await E.wait(800);
    // prayer: silence first
    await E.hold({ label: 'להתפלל', ms: 3200 });
    await E.wait(2200);
    await E.say([{ t: 'שתיקה.', cls: 'whisper', hold: 3600 }], { pos: 'center' });
    await E.clearText();
    await E.say(['הוא לא ידע מה קורה בבית הזה.', { t: 'הוא ידע רק שהוא בחוץ.', hold: 3200 }], { pos: 'center' });
    await E.clearText();
    await E.hold({ label: 'להתפלל שוב', ms: 3600 });
    await E.wait(1600);
    sc.lightWarm = false; sc.lightTarget = 0.5;
    A.setShimmer(0.35, 4);
    await E.say([V('וַיְנַגַּע ה\' אֶת־פַּרְעֹה נְגָעִים גְּדֹלִים וְאֶת־בֵּיתוֹ', 'בראשית י״ב, יז'), V('עַל־דְּבַר שָׂרַי אֵשֶׁת אַבְרָם', 'בראשית י״ב, יז', 4000)], { pos: 'center' });
    await E.clearText();
  }

  // ---------- scene 6: plagues, "קח ולך" ----------
  async function plagues() {
    const sc = ensure('palace', buildPalace);
    sc.lightTarget = 0; A.setShimmer(0, 3);
    await E.fade(0, 1400);
    E.letterbox(0.14, 1000);
    A.drum('rumble', 0.8); A.setDrone(0.5, 2); A.setDroneTone(76, 2);
    await S.tween(sc, 'plague', 1, 2500);
    await E.wait(1200);
    const h = sc.figH, gy = sc.groundPx;
    const pharaoh = { kind: 'figure', name: 'pharaoh', fixed: true, x: sc.gate.x, y: gy + h * 0.55, h: h * 1.05, facing: -1, still: true, alpha: 0, ...S.ROBES.king };
    sc.actors.push(pharaoh);
    await S.tween(pharaoh, 'alpha', 1, 1500);
    await moveActor(pharaoh, sc.abram.x + h * 1.6, 3600);
    await E.say([
      { t: 'מַה־זֹּאת עָשִׂיתָ לִּי', cls: 'verse', who: 'פרעה' },
      { t: 'לָמָּה לֹא־הִגַּדְתָּ לִּי כִּי אִשְׁתְּךָ הִוא', cls: 'verse' },
      { t: 'לָמָה אָמַרְתָּ אֲחֹתִי הִוא וָאֶקַּח אֹתָהּ לִי לְאִשָּׁה', cls: 'verse', ref: 'בראשית י״ב, יח–יט', hold: 4200 },
    ], { pos: 'center' });
    await E.clearText();
    await E.say([{ t: 'וְעַתָּה הִנֵּה אִשְׁתְּךָ', cls: 'verse' }, { t: 'קַח וָלֵךְ', cls: 'verse big', ref: 'בראשית י״ב, יט', hold: 4200 }], { pos: 'center' });
    await E.clearText();
    // Sarai comes back
    sc.sarai.x = sc.gate.x; sc.sarai.alpha = 0; sc.sarai.facing = -1;
    S.tween(sc.sarai, 'alpha', 1, 1600).catch(() => { });
    S.tween(sc, 'plague', 0, 4000).catch(() => { });
    A.setDrone(0.15, 5); A.setDroneTone(160, 5);
    E.letterbox(0, 4000);
    moveActor(pharaoh, sc.gate.x, 5000).then(() => S.tween(pharaoh, 'alpha', 0, 1500)).catch(() => { });
    await moveActor(sc.sarai, sc.abram.x + h * 0.55, 6500);
    A.unduck(4);
    await E.wait(1200);
    await E.say(['לא נאמר מה היא אמרה לו.', 'לא נאמר מה הוא אמר לה.', { t: 'הם עלו.', hold: 3200 }], { pos: 'center' });
    await E.clearText();
    await E.say([V('וַיְצַו עָלָיו פַּרְעֹה אֲנָשִׁים וַיְשַׁלְּחוּ אֹתוֹ וְאֶת־אִשְׁתּוֹ וְאֶת־כָּל־אֲשֶׁר־לוֹ', 'בראשית י״ב, כ', 3800)], { pos: 'center' });
    await E.clearText();
    await E.fade(1, 2600);
  }

  // ---------- scene 7: the return, the altar, dawn ----------
  function buildReturn() {
    return land('return', 'dawnReturn', { lot: true, servants: 3, flock: 10, donkeys: 2, camels: 2, oxen: 1 });
  }
  async function returnScene() {
    const sc = buildReturn();
    A.setWind(0.3, 5); A.setDrone(0.1, 5); A.setDroneTone(180, 4); A.motif(true, 0.9);
    await E.fade(0, 3200);
    await E.say([V('וַיַּעַל אַבְרָם מִמִּצְרַיִם הוּא וְאִשְׁתּוֹ וְכָל־אֲשֶׁר־לוֹ וְלוֹט עִמּוֹ הַנֶּגְבָּה', 'בראשית י״ג, א', 4000)], { pos: 'top' });
    await E.clearText();
    const d = sc.W * 1.4;
    const s = U.clamp(sc.figH * 0.34, 22, 48);
    const altar = altarProp(sc, sc.W * 0.3 - d, s, 0);
    oakProp(sc, sc.W * 0.1 - d * 0.6, 1.4, 7);
    await walk(sc, d, { hint: 'החזיקו כדי לעלות חזרה' });
    await E.say([V('וַיֵּלֶךְ לְמַסָּעָיו מִנֶּגֶב וְעַד־בֵּית־אֵל'), V('אֶל־מְקוֹם הַמִּזְבֵּחַ אֲשֶׁר־עָשָׂה שָׁם בָּרִאשֹׁנָה', 'בראשית י״ג, ג–ד', 3600)], { pos: 'top' });
    await E.clearText();
    await E.say(['אותו מזבח. אותן אבנים.', { t: 'ושרי לצידו.', hold: 3000 }], { pos: 'top' });
    await E.clearText();
    sc.abram.still = true; sc.abram.staff = false; sc.abram.arms = 'up';
    S.tween(altar, 'flame', 1, 3000).catch(() => { });
    sc.lightTarget = 0.5; sc.lightWarm = true;
    A.setChord(0.3, 6); A.phrase([[0, 500, 0.4], [4, 500, 0.4], [7, 1200, 0.5]]);
    await E.say([V('וַיִּקְרָא שָׁם אַבְרָם בְּשֵׁם ה\'', 'בראשית י״ג, ד', 4600)], { pos: 'top' });
    await E.clearText();
    await E.say(['הארץ לא נתנה לו לחם.', { t: 'היא נתנה לו מקום לחזור אליו.', hold: 3600 }], { pos: 'top' });
    await E.clearText();
    sc.lightTarget = 0; A.setChord(0, 5);
    sc.abram.still = false; sc.abram.staff = true; sc.abram.arms = null;
    await E.wait(600);
  }

  // ---------- scene 8: parting from Lot ----------
  function buildJordan() {
    return land('jordan', 'jordan', null, (sc, W, H) => {
      const h = sc.figH, gy = sc.groundPx;
      if (!sc.lotActor) {
        sc.lotActor = { kind: 'figure', name: 'lot', fixed: true, still: true, x: W < 700 ? W * 0.22 : W * 0.3, y: gy + h * 0.6, h: h * 0.95, facing: 1, ...S.ROBES.lot };
        sc.actors.push(sc.lotActor);
      }
      sc.hooks.ridge1 = (ctx, W, H, t, offset) => {
        // the Jordan plain: river, greenery, and far away — Sodom
        const r1 = sc.pal.ridges[1];
        const y = r1.baseY * H + H * 0.035;
        P.water(ctx, 0, y, W, H * 0.03, t, [200, 35, 40], 4);
        ctx.fillStyle = 'rgba(80,110,50,0.35)'; ctx.fillRect(0, y + H * 0.03, W, H * 0.03);
        const r = U.rng(17);
        for (let i = 0; i < 12; i++) P.palm(ctx, (W * 0.5 + (r() - 0.5) * W * 1.1 + offset * 1.2), y + H * 0.03 + r() * H * 0.015, H * (0.035 + r() * 0.03), 60 + i, [115, 30, 30], Math.sin(t * 0.6 + i), 0.9);
        P.city(ctx, W * 0.72 + offset, y - H * 0.004, W * 0.2, H * 0.045, 23, [40, 22, 56], 0.85);
      };
    });
  }
  async function lot() {
    const sc = ensure('return', buildReturn);
    await E.fade(0, 1600);
    await E.say([V('וְלֹא־נָשָׂא אֹתָם הָאָרֶץ לָשֶׁבֶת יַחְדָּו כִּי־הָיָה רְכוּשָׁם רָב', 'בראשית י״ג, ו')], { pos: 'top' });
    // shepherds square off
    const h = sc.figH, gy = sc.groundPx;
    const sv = sc.actors.filter(a => a.name === 'servant');
    sv.forEach((a, i) => { a.still = true; a.facing = i % 2 ? 1 : -1; });
    await E.say([V('וַיְהִי־רִיב בֵּין רֹעֵי מִקְנֵה־אַבְרָם וּבֵין רֹעֵי מִקְנֵה־לוֹט', 'בראשית י״ג, ז', 3600)], { pos: 'top' });
    await E.clearText();
    sc.lot.still = true; sc.lot.facing = 1; sc.abram.still = true; sc.abram.facing = -1;
    sc.lot.x = sc.abram.x - h * 0.9;
    await E.say([
      { t: 'אַל־נָא תְהִי מְרִיבָה בֵּינִי וּבֵינֶיךָ וּבֵין רֹעַי וּבֵין רֹעֶיךָ כִּי־אֲנָשִׁים אַחִים אֲנָחְנוּ', cls: 'verse', who: 'אברם' },
      { t: 'הֲלֹא כָל־הָאָרֶץ לְפָנֶיךָ הִפָּרֶד נָא מֵעָלָי', cls: 'verse' },
      { t: 'אִם־הַשְּׂמֹאל וְאֵימִנָה וְאִם־הַיָּמִין וְאַשְׂמְאִילָה', cls: 'verse', ref: 'בראשית י״ג, ח–ט', hold: 4200 },
    ], { pos: 'top' });
    await E.clearText();
    await E.fade(1, 1800);
    // through Lot's eyes
    const j = buildJordan();
    A.setWind(0.2, 3); A.motif(true, 0.6);
    await E.fade(0, 2600);
    await E.say(['לוט נשא את עיניו.', { t: 'כל ככר הירדן — ירוקה. מים בכל מקום.', hold: 3200 }], { pos: 'top' });
    await E.clearText();
    await E.say([{ t: 'מה בוחר לוט?', hold: 1800 }], { pos: 'top' });
    await fixedChoice([
      { label: 'ההר, עם אברם', value: 'hill', note: 'אדמה קשה, ומזבח' },
      { label: 'כִּכַּר הַיַּרְדֵּן', value: 'plain', note: 'כֻּלָּהּ מַשְׁקֶה' },
    ], 'plain', async () => {
      await E.clearText();
      await E.say(['לוט הביט עוד רגע בירוק.', { t: 'אבל כך לא היה.', cls: 'whisper', hold: 2600 }], { pos: 'top' });
      await E.clearText();
    });
    await E.clearText();
    await E.say([
      V('וַיִּשָּׂא־לוֹט אֶת־עֵינָיו וַיַּרְא אֶת־כָּל־כִּכַּר הַיַּרְדֵּן כִּי כֻלָּהּ מַשְׁקֶה'),
      V('כְּגַן־ה\' כְּאֶרֶץ מִצְרַיִם', 'בראשית י״ג, י'),
      V('וַיִּבְחַר־לוֹ לוֹט אֵת כָּל־כִּכַּר הַיַּרְדֵּן וַיִּסַּע לוֹט מִקֶּדֶם וַיִּפָּרְדוּ אִישׁ מֵעַל אָחִיו', 'בראשית י״ג, יא', 4200),
    ], { pos: 'top' });
    await E.clearText();
    j.lotActor.still = false; j.lotActor.walking = true;
    moveActor(j.lotActor, j.W + 100, 7000).catch(() => { });
    A.setDrone(0.4, 4); A.setDroneTone(80, 4); A.motif(false);
    j.tint = 'rgb(120,90,70)'; S.tween(j, 'tintK', 0.45, 5000).catch(() => { });
    await E.say([V('וְלוֹט יָשַׁב בְּעָרֵי הַכִּכָּר וַיֶּאֱהַל עַד־סְדֹם', 'בראשית י״ג, יב')], { pos: 'top' });
    await E.say([V('וְאַנְשֵׁי סְדֹם רָעִים וְחַטָּאִים לַה\' מְאֹד', 'בראשית י״ג, יג', 4600)], { pos: 'top' });
    await E.clearText();
    await E.fade(1, 2400);
    // back on the hill: the promise
    const sc2 = buildReturn();
    sc2.lot.hidden = true;
    sc2.actors.forEach(a => { a.still = true; });
    sc2.abram.facing = -1;
    A.setDrone(0.1, 4); A.setDroneTone(180, 4);
    await E.fade(0, 2600);
    await E.say([V('וַה\' אָמַר אֶל־אַבְרָם אַחֲרֵי הִפָּרֶד־לוֹט מֵעִמּוֹ', 'בראשית י״ג, יד', 3000)], { pos: 'top' });
    await E.clearText();
    await S.voice(sc2, [
      'שָׂא נָא עֵינֶיךָ וּרְאֵה מִן־הַמָּקוֹם אֲשֶׁר־אַתָּה שָׁם',
      'צָפֹנָה וָנֶגְבָּה וָקֵדְמָה וָיָמָּה',
      { t: 'כִּי אֶת־כָּל־הָאָרֶץ אֲשֶׁר־אַתָּה רֹאֶה לְךָ אֶתְּנֶנָּה וּלְזַרְעֲךָ עַד־עוֹלָם', hold: 4600 },
      { t: 'וְשַׂמְתִּי אֶת־זַרְעֲךָ כַּעֲפַר הָאָרֶץ', ref: 'בראשית י״ג, יד–טז', hold: 4400 },
    ], { chord: 0.45 });
    await E.clearText();
    await E.say(['אחיו הלך למזרח, אל הירוק.', { t: 'והוא נשאר עם העפר — ועם ההבטחה.', hold: 3600 }], { pos: 'top' });
    await E.clearText();
    await E.say([V('וַיֶּאֱהַל אַבְרָם וַיָּבֹא וַיֵּשֶׁב בְּאֵלֹנֵי מַמְרֵא אֲשֶׁר בְּחֶבְרוֹן וַיִּבֶן־שָׁם מִזְבֵּחַ לַה\'', 'בראשית י״ג, יח', 4600)], { pos: 'top' });
    await E.clearText();
    A.setChord(0, 4);
    await E.fade(1, 2800);
  }

  E.chapters.ch1 = {
    run(scene, id) {
      return E.runScenes('ch1', [
        ['shechem', shechem], ['bethel', bethel], ['famine', famine], ['border', border],
        ['taken', taken], ['plagues', plagues], ['return', returnScene], ['lot', lot],
      ], scene, id);
    },
  };
})();

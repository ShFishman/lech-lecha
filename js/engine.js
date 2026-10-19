/* engine.js — stage, loop, parallax, text & UI helpers, save, run control */
'use strict';
(function () {
  const CANCEL = { cancelled: true };
  const E = {
    W: 0, H: 0, dpr: 1, t: 0, dt: 0, frame: 0,
    scene: null, runId: 0, interactive: false, speed: 1,
    par: { x: 0, y: 0 }, parT: { x: 0, y: 0 }, parK: 1,
    pointer: { x: 0, y: 0, down: false, sx: 0, sy: 0, dx: 0, dy: 0, t0: 0 },
    keys: {},
    mobile: U.isMobile(), reduceMotion: U.reduceMotion(),
    save: null, CANCEL,
    chapters: {}, order: ['prologue', 'ch1', 'ch2', 'ch3'],
    waiters: [], hidden: false, started: false,
  };
  const $ = id => document.getElementById(id);
  let canvas, ctx, textEl, hintEl, contEl, choicesEl, holdWrap, holdBtn, holdRing, holdLabel, fadeEl, titleEl, hudEl, lbTop, lbBot, stageEl;

  // ---------- save ----------
  const SAVE_KEY = 'lechlecha.save.v1';
  E.loadSave = function () {
    try { E.save = JSON.parse(localStorage.getItem(SAVE_KEY)) || null; } catch (e) { E.save = null; }
    if (!E.save) E.save = { chapter: null, scene: null, reached: [], choices: {}, muted: false, done: false };
    if (!E.save.reached) E.save.reached = [];
    if (!E.save.choices) E.save.choices = {};
    return E.save;
  };
  E.persist = function () { try { localStorage.setItem(SAVE_KEY, JSON.stringify(E.save)); } catch (e) { } };
  E.checkpoint = function (chapter, scene) {
    E.save.chapter = chapter; E.save.scene = scene;
    if (!E.save.reached.includes(chapter)) E.save.reached.push(chapter);
    E.persist();
  };
  E.remember = function (key, val) { E.save.choices[key] = val; E.persist(); };
  E.resetSave = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } E.loadSave(); };

  // ---------- canvas & loop ----------
  E.init = function () {
    stageEl = $('stage'); canvas = $('c'); ctx = canvas.getContext('2d');
    textEl = $('text'); hintEl = $('hint'); contEl = $('continue'); choicesEl = $('choices');
    holdWrap = $('holdwrap'); holdBtn = $('hold'); holdRing = $('holdring'); holdLabel = $('holdlabel');
    fadeEl = $('fade'); titleEl = $('title'); hudEl = $('hud'); lbTop = $('lb-top'); lbBot = $('lb-bot');
    E.ctx = ctx; E.canvas = canvas;
    E.resize();
    let rt = null;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(E.resize, 150); });
    window.addEventListener('orientationchange', () => { clearTimeout(rt); rt = setTimeout(E.resize, 300); });
    // pointer
    stageEl.addEventListener('pointerdown', onDown);
    stageEl.addEventListener('pointermove', onMove);
    stageEl.addEventListener('pointerup', onUp);
    stageEl.addEventListener('pointercancel', onUp);
    stageEl.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', e => {
      E.keys[e.code] = true;
      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
        if (contEl.classList.contains('show')) { contEl.click(); e.preventDefault(); }
        else if (!E.interactive) { E.tapSkip(); }
        else if (E.scene && E.scene.key) E.scene.key(e.code);
      }
    });
    window.addEventListener('keyup', e => { E.keys[e.code] = false; });
    document.addEventListener('visibilitychange', () => { E.hidden = document.hidden; if (!E.hidden) { last = performance.now(); requestAnimationFrame(loop); } });
    // gyro parallax (if available)
    window.addEventListener('deviceorientation', e => {
      if (e.gamma == null || E.reduceMotion) return;
      E.parT.x = U.clamp(e.gamma / 25, -1, 1);
      E.parT.y = U.clamp((e.beta - 45) / 30, -1, 1);
    }, true);
    contEl.addEventListener('click', () => { if (contResolve) { const r = contResolve; contResolve = null; E.showContinue(false); r(); } });
    last = performance.now();
    requestAnimationFrame(loop);
  };
  E.resize = function () {
    E.W = window.innerWidth; E.H = window.innerHeight;
    E.dpr = Math.min(window.devicePixelRatio || 1, E.mobile ? 1.5 : 1.75);
    canvas.width = Math.round(E.W * E.dpr); canvas.height = Math.round(E.H * E.dpr);
    canvas.style.width = E.W + 'px'; canvas.style.height = E.H + 'px';
    Paint.clearCache();
    if (E.scene && E.scene.init) E.scene.init(E.W, E.H);
  };
  let last = 0;
  function loop(now) {
    if (E.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    E.dt = dt; E.t += dt; E.frame++;
    // parallax smoothing
    const k = 1 - Math.pow(0.001, dt);
    E.par.x += (E.parT.x * E.parK - E.par.x) * k * 0.6;
    E.par.y += (E.parT.y * E.parK - E.par.y) * k * 0.6;
    ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
    if (E.scene) {
      if (E.scene.update) E.scene.update(dt, E.t);
      if (E.scene.draw) E.scene.draw(ctx, E.W, E.H, E.t);
    }
    if (holdActive) holdTick(dt);
    requestAnimationFrame(loop);
  }

  // ---------- pointer ----------
  function pos(e) { const r = stageEl.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function onDown(e) {
    if (e.target.closest('button, a, #menu, #gate, #topbar, #choices')) return;
    const p = pos(e);
    const pt = E.pointer;
    pt.down = true; pt.id = e.pointerId; pt.x = pt.sx = p.x; pt.y = pt.sy = p.y; pt.dx = pt.dy = 0; pt.t0 = performance.now(); pt.moved = false;
    try { stageEl.setPointerCapture(e.pointerId); } catch (err) { }
    if (!E.mobile || e.pointerType === 'mouse') { E.parT.x = (p.x / E.W - 0.5) * 2; E.parT.y = (p.y / E.H - 0.5) * 2; }
    if (E.scene && E.scene.down) E.scene.down(p, e);
  }
  function onMove(e) {
    const p = pos(e); const pt = E.pointer;
    if (e.pointerType === 'mouse' && !E.reduceMotion) { E.parT.x = (p.x / E.W - 0.5) * 2; E.parT.y = (p.y / E.H - 0.5) * 2; }
    if (pt.down && e.pointerId === pt.id) {
      pt.dx = p.x - pt.x; pt.dy = p.y - pt.y; pt.x = p.x; pt.y = p.y;
      if (Math.hypot(p.x - pt.sx, p.y - pt.sy) > 10) pt.moved = true;
      if (E.scene && E.scene.move) E.scene.move(p, e);
    } else if (E.scene && E.scene.hover) E.scene.hover(p, e);
  }
  function onUp(e) {
    const pt = E.pointer; if (!pt.down || e.pointerId !== pt.id) return;
    const p = pos(e); pt.down = false; pt.x = p.x; pt.y = p.y;
    const quick = performance.now() - pt.t0 < 400 && !pt.moved;
    if (E.scene && E.scene.up) E.scene.up(p, e);
    if (quick) {
      if (E.scene && E.scene.tap) E.scene.tap(p, e);
      if (!E.interactive) E.tapSkip();
    }
  }
  E.tapSkip = function () {
    if (contResolve) { contEl.click(); return; }
    const ws = E.waiters.filter(w => w.skippable); E.waiters = E.waiters.filter(w => !w.skippable);
    ws.forEach(w => { clearTimeout(w.timer); w.resolve(); });
  };

  // ---------- flow helpers ----------
  E.check = function (id) { if (id !== undefined ? id !== E.runId : false) throw CANCEL; };
  E.wait = function (ms, skippable) {
    const id = E.runId;
    if (skippable === undefined) skippable = !E.interactive;
    return new Promise((resolve) => {
      const w = { skippable, resolve: null, timer: null };
      w.resolve = () => { E.waiters = E.waiters.filter(x => x !== w); resolve(); };
      w.timer = setTimeout(w.resolve, Math.max(0, ms / E.speed));
      E.waiters.push(w);
    }).then(() => { if (id !== E.runId) throw CANCEL; });
  };
  E.nextFrame = function () { const id = E.runId; return new Promise(r => requestAnimationFrame(() => r())).then(() => { if (id !== E.runId) throw CANCEL; }); };
  E.until = async function (fn, timeout) { const id = E.runId; const t0 = performance.now(); while (!fn()) { await E.nextFrame(); if (id !== E.runId) throw CANCEL; if (timeout && performance.now() - t0 > timeout) break; } };
  let contResolve = null;
  E.showContinue = function (on, label) {
    if (label) contEl.textContent = label;
    contEl.classList.toggle('show', !!on);
  };
  E.continue = function (label) {
    const id = E.runId;
    return new Promise(resolve => {
      contResolve = resolve;
      setTimeout(() => { if (contResolve === resolve) E.showContinue(true, label || 'המשך'); }, 400 / E.speed);
    }).then(() => { E.showContinue(false); if (id !== E.runId) throw CANCEL; });
  };
  E.cancelContinue = function () { contResolve = null; E.showContinue(false); };

  // ---------- text ----------
  function lineEl(ln) {
    const o = typeof ln === 'string' ? { t: ln } : ln;
    const el = document.createElement('div');
    el.className = 'line ' + (o.cls || 'narr');
    if (o.who) { const w = document.createElement('span'); w.className = 'who'; w.textContent = o.who; el.appendChild(w); }
    const s = document.createElement('span'); s.className = 'txt'; s.innerHTML = o.t; el.appendChild(s);
    if (o.ref) { const r = document.createElement('span'); r.className = 'ref'; r.textContent = o.ref; el.appendChild(r); }
    return el;
  }
  E.say = async function (lines, o) {
    o = o || {}; const id = E.runId;
    if (!Array.isArray(lines)) lines = [lines];
    if (o.clear !== false && textEl.children.length) await E.clearText(o.clearMs);
    textEl.className = 'pos-' + (o.pos || 'center') + (o.big ? ' big' : '') + (o.narrow ? ' narrow' : '');
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i]; const ob = typeof ln === 'string' ? { t: ln } : ln;
      const el = lineEl(ob); textEl.appendChild(el);
      void el.offsetWidth; el.classList.add('in');
      E.check(id);
      const len = ob.t.replace(/<[^>]+>/g, '').length;
      const base = ob.cls === 'verse' || ob.cls === 'voice' ? 1300 + len * 55 : 800 + len * 40;
      const ms = ob.hold != null ? ob.hold : (o.hold != null ? o.hold : base);
      if (i < lines.length - 1 || o.wait === 'auto' || o.wait === undefined) await E.wait(ms * (o.rate || 1), o.skippable);
    }
    if (o.wait === 'tap') await E.continue(o.label);
    E.check(id);
  };
  E.clearText = function (ms) {
    const id = E.runId; ms = ms == null ? 700 : ms;
    const kids = Array.from(textEl.children);
    kids.forEach(k => k.classList.add('out'));
    return E.wait(ms, false).then(() => { kids.forEach(k => k.remove()); if (id !== E.runId) throw CANCEL; });
  };
  E.clearTextNow = function () { textEl.innerHTML = ''; };
  E.hint = function (text) {
    if (!text) { hintEl.classList.remove('show'); return; }
    hintEl.textContent = text; hintEl.classList.add('show');
  };
  E.hud = function (html) { hudEl.innerHTML = html || ''; hudEl.classList.toggle('show', !!html); };

  // ---------- choices ----------
  E.choice = function (opts, o) {
    const id = E.runId; o = o || {};
    choicesEl.innerHTML = '';
    return new Promise(resolve => {
      opts.forEach((op, i) => {
        const b = document.createElement('button');
        b.className = 'choice' + (op.dim ? ' dim' : '') + (op.cls ? ' ' + op.cls : '');
        b.innerHTML = op.label + (op.note ? `<span class="note">${op.note}</span>` : '');
        if (op.disabled) b.disabled = true;
        b.style.transitionDelay = (i * 0.18) + 's';
        b.addEventListener('click', () => {
          if (b.disabled) return;
          choicesEl.classList.remove('show');
          Audio2.pluck(Audio2.scale[7], 0.25);
          setTimeout(() => { choicesEl.innerHTML = ''; resolve(op.value !== undefined ? op.value : i); }, 350);
        });
        choicesEl.appendChild(b);
      });
      requestAnimationFrame(() => choicesEl.classList.add('show'));
    }).then(v => { if (id !== E.runId) throw CANCEL; return v; });
  };
  E.clearChoices = function () { choicesEl.classList.remove('show'); choicesEl.innerHTML = ''; };

  // ---------- press & hold ----------
  let holdActive = null;
  E.hold = function (o) {
    o = o || {}; const id = E.runId;
    holdLabel.textContent = o.label || '';
    holdWrap.classList.add('show');
    const dur = (o.ms || 2200) / E.speed;
    return new Promise(resolve => {
      holdActive = { p: 0, down: false, dur, resolve, o, done: false };
      setRing(0);
    }).then(v => { holdWrap.classList.remove('show'); holdActive = null; if (id !== E.runId) throw CANCEL; return v; });
  };
  function setRing(p) { const C = 2 * Math.PI * 44; holdRing.style.strokeDashoffset = C * (1 - p); }
  function holdTick(dt) {
    const h = holdActive; if (!h || h.done) return;
    const was = h.p;
    if (h.down) h.p = Math.min(1, h.p + dt * 1000 / h.dur); else h.p = Math.max(0, h.p - dt * 1000 / (h.dur * 0.6));
    if (h.p !== was) { setRing(h.p); if (h.o.onProgress) h.o.onProgress(h.p, h.down); }
    if (h.p >= 1) { h.done = true; holdBtn.classList.add('done'); Audio2.pluck(Audio2.scale[0], 0.5); setTimeout(() => { holdBtn.classList.remove('done'); h.resolve(true); }, 250); }
  }
  E.cancelHold = function () { if (holdActive) { holdActive.done = true; holdActive.resolve(false); } };
  E.holdDownState = () => holdActive && holdActive.down;
  function holdDown(e) { if (holdActive) { holdActive.down = true; holdBtn.classList.add('pressing'); e.preventDefault(); try { holdBtn.setPointerCapture(e.pointerId); } catch (err) { } } }
  function holdUp() { if (holdActive) { holdActive.down = false; } holdBtn.classList.remove('pressing'); }

  // ---------- overlays ----------
  E.letterbox = function (frac, ms) {
    const s = (ms == null ? 2500 : ms) / E.speed;
    lbTop.style.transitionDuration = lbBot.style.transitionDuration = s + 'ms';
    lbTop.style.height = lbBot.style.height = (frac * 50) + '%';
  };
  E.fade = function (to, ms, color) {
    ms = (ms == null ? 1500 : ms);
    fadeEl.style.transitionDuration = (ms / E.speed) + 'ms';
    if (color) fadeEl.style.background = color;
    fadeEl.style.opacity = to;
    return E.wait(ms + 30, false);
  };
  E.flash = function (color, ms) { fadeEl.style.transitionDuration = '0ms'; fadeEl.style.background = color || '#fff'; fadeEl.style.opacity = 1; setTimeout(() => { fadeEl.style.transitionDuration = (ms || 800) + 'ms'; fadeEl.style.opacity = 0; }, 40); };
  E.title = async function (main, sub, o) {
    o = o || {};
    titleEl.querySelector('h1').innerHTML = main; titleEl.querySelector('p').innerHTML = sub || '';
    titleEl.classList.add('show');
    await E.wait(o.ms || 3800);
    if (o.wait !== false) await E.continue(o.label);
    titleEl.classList.remove('show');
    await E.wait(1200, false);
  };
  E.hideTitle = function () { titleEl.classList.remove('show'); };

  // ---------- scenes & runs ----------
  E.setScene = function (scene) {
    E.scene = scene; E.parT.x = E.parT.y = 0; E.parK = 1;
    if (scene && scene.init) scene.init(E.W, E.H);
  };
  E.clearUI = function () {
    E.clearTextNow(); E.hint(null); E.hud(''); E.clearChoices(); E.cancelContinue(); E.cancelHold(); E.hideTitle();
    E.interactive = false;
    E.waiters.forEach(w => clearTimeout(w.timer)); E.waiters = [];
  };
  E.run = async function (chapter, scene) {
    E.runId++; const id = E.runId;
    E.clearUI();
    Audio2.stopLoops();
    const ch = E.chapters[chapter];
    if (!ch) return;
    try {
      await ch.run(scene, id);
      if (id !== E.runId) return;
      const i = E.order.indexOf(chapter);
      if (i >= 0 && i < E.order.length - 1) E.run(E.order[i + 1]);
      else if (i === E.order.length - 1) { E.save.done = true; E.persist(); if (window.showEnd) window.showEnd(); }
    } catch (err) {
      if (err !== CANCEL) { console.error(err); if (id === E.runId) { E.hint('אירעה שגיאה. ניתן לבחור פרק מהתפריט.'); } }
    }
  };
  // run scenes in order from a start scene; each scene is [name, async fn]
  E.runScenes = async function (chapter, scenes, from, id) {
    let started = !from;
    for (const [name, fn] of scenes) {
      if (!started) { if (name === from) started = true; else continue; }
      E.checkpoint(chapter, name);
      E.clearUI();
      await fn(id);
      if (id !== E.runId) throw CANCEL;
    }
  };

  // helper to render HUD counters etc.
  E.el = $;
  E.initHold = function () {
    holdBtn.addEventListener('pointerdown', holdDown);
    holdBtn.addEventListener('pointerup', holdUp);
    holdBtn.addEventListener('pointercancel', holdUp);
    holdBtn.addEventListener('pointerleave', holdUp);
    window.addEventListener('keydown', e => { if (holdActive && (e.code === 'Space' || e.code === 'Enter')) { holdActive.down = true; holdBtn.classList.add('pressing'); } });
    window.addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'Enter') holdUp(); });
  };

  window.Engine = E;
})();

/* main.js — boot, gate, menu, mute */
'use strict';
(function () {
  const E = Engine, A = Audio2;
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const debugCh = params.get('ch'), debugScene = params.get('scene');
  if (params.get('speed')) E.speed = parseFloat(params.get('speed')) || 1;
  const unlockAll = params.get('unlock') === '1';

  const fontsReady = Promise.race([
    Promise.all([
      document.fonts.load('500 24px "Frank Ruhl Libre"'),
      document.fonts.load('400 24px "Frank Ruhl Libre"'),
      document.fonts.load('400 40px "Suez One"'),
    ]).catch(() => { }),
    new Promise(r => setTimeout(r, 3500)),
  ]);

  let gyroAsked = false;
  function requestGyro() {
    if (gyroAsked) return; gyroAsked = true;
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().catch(() => { });
      }
    } catch (e) { }
  }
  function ensureAudio() {
    A.init(); A.resume();
    A.setMuted(!!E.save.muted);
    updateMute();
    requestGyro();
  }
  function updateMute() { $('mutebtn').classList.toggle('muted', !!E.save.muted); }

  function hidePanel(id) { $(id).classList.remove('show'); }
  function showPanel(id) { $(id).classList.add('show'); }

  async function startFrom(ch, scene) {
    ensureAudio();
    $('gate').classList.add('loading');
    await fontsReady;
    hidePanel('gate');
    E.started = true;
    E.run(ch || 'prologue', scene || undefined);
  }

  function renderMenu() {
    const reached = E.save.reached || [];
    document.querySelectorAll('#menu .mbtn.ch').forEach(b => {
      const ch = b.dataset.ch;
      const ok = unlockAll || reached.includes(ch) || ch === 'prologue' || E.save.done;
      b.classList.toggle('locked', !ok);
    });
    $('m-continue').style.display = E.save.chapter ? '' : 'none';
  }
  let resetArmed = false;
  function openMenu() { renderMenu(); resetArmed = false; $('menu').querySelector('[data-act="reset"]').textContent = 'התחל מחדש'; showPanel('menu'); }

  function boot() {
    E.loadSave();
    E.init(); E.initHold();
    updateMute();
    // gate
    const gs = $('g-start'), gc = $('g-continue'), gch = $('g-chapters');
    if (E.save.chapter && !debugCh) {
      gc.style.display = ''; gch.style.display = '';
      gs.textContent = 'להתחיל מההתחלה'; gs.classList.remove('primary'); gc.classList.add('primary');
    }
    gs.addEventListener('click', () => {
      if (debugCh) { startFrom(debugCh, debugScene); return; }
      if (E.save.chapter) E.resetSave();
      startFrom('prologue');
    });
    gc.addEventListener('click', () => startFrom(E.save.chapter, E.save.scene));
    gch.addEventListener('click', () => { ensureAudio(); hidePanel('gate'); E.started = true; openMenu(); });
    // menu
    $('menubtn').addEventListener('click', () => { if (!E.started) return; if ($('menu').classList.contains('show')) hidePanel('menu'); else openMenu(); });
    $('mutebtn').addEventListener('click', () => {
      E.save.muted = !E.save.muted; E.persist();
      if (!A.ready) A.init();
      A.setMuted(E.save.muted); updateMute();
    });
    $('menu').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const act = b.dataset.act, ch = b.dataset.ch;
      if (ch) {
        if (b.classList.contains('locked')) return;
        hidePanel('menu'); E.fade(1, 600).then(() => E.run(ch));
      } else if (act === 'continue') {
        hidePanel('menu'); if (E.save.chapter) E.fade(1, 600).then(() => E.run(E.save.chapter, E.save.scene));
      } else if (act === 'reset') {
        if (!resetArmed) { resetArmed = true; b.textContent = 'למחוק את כל ההתקדמות? לחצו שוב לאישור'; return; }
        const muted = E.save.muted; E.resetSave(); E.save.muted = muted; E.persist();
        hidePanel('menu'); E.fade(1, 600).then(() => E.run('prologue'));
      } else if (act === 'close') hidePanel('menu');
    });
    window.showEnd = () => { renderMenu(); };
    // expose for tests
    window.LL = { E, A, Paint, startFrom, openMenu };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

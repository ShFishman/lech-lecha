/* audio.js — procedural WebAudio: wind, drone, oud/ney tones, drums, covenant chord */
'use strict';
(function () {
  const A = {
    ctx: null, ready: false, muted: false,
    master: null, amb: null, music: null, sfx: null, reverb: null, revGain: null,
    wind: null, drone: null, chord: null, shimmer: null,
    motifTimer: null, drumTimer: null,
  };

  // D Hijaz (D Eb F# G A Bb C D) — frequencies in Hz
  const HIJAZ = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66, 311.13, 369.99, 392.0, 440.0];
  A.scale = HIJAZ;

  function makeImpulse(ctx, seconds, decay) {
    const rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  function makeNoise(ctx, seconds) {
    const rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(1, len, rate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      // pinkish noise
      b0 = 0.99765 * b0 + w * 0.0990460;
      b1 = 0.96300 * b1 + w * 0.2965164;
      b2 = 0.57000 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
    return buf;
  }

  A.init = function () {
    if (A.ready) return true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    const ctx = A.ctx = new Ctx();
    A.master = ctx.createGain(); A.master.gain.value = A.muted ? 0 : 0.9;
    A.master.connect(ctx.destination);
    A.amb = ctx.createGain(); A.amb.gain.value = 1; A.amb.connect(A.master);
    A.music = ctx.createGain(); A.music.gain.value = 1; A.music.connect(A.master);
    A.sfx = ctx.createGain(); A.sfx.gain.value = 1; A.sfx.connect(A.master);
    A.reverb = ctx.createConvolver(); A.reverb.buffer = makeImpulse(ctx, 3.2, 3.5);
    A.revGain = ctx.createGain(); A.revGain.gain.value = 0.35;
    A.reverb.connect(A.revGain); A.revGain.connect(A.master);
    A.noiseBuf = makeNoise(ctx, 4);

    // Wind: pink noise -> bandpass (slow wandering) -> gain
    {
      const src = ctx.createBufferSource(); src.buffer = A.noiseBuf; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.7;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      const g = ctx.createGain(); g.gain.value = 0;
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.07;
      const lfoG = ctx.createGain(); lfoG.gain.value = 260;
      lfo.connect(lfoG); lfoG.connect(bp.frequency);
      const lfo2 = ctx.createOscillator(); lfo2.type = 'sine'; lfo2.frequency.value = 0.11;
      const lfo2G = ctx.createGain(); lfo2G.gain.value = 0.35;
      const gustG = ctx.createGain(); gustG.gain.value = 1;
      lfo2.connect(lfo2G); lfo2G.connect(gustG.gain);
      src.connect(bp); bp.connect(lp); lp.connect(gustG); gustG.connect(g); g.connect(A.amb);
      src.start(); lfo.start(); lfo2.start();
      A.wind = { g, level: 0 };
    }
    // Drone: detuned saws through a low-pass, very low
    {
      const g = ctx.createGain(); g.gain.value = 0;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; lp.Q.value = 0.8;
      const oscs = [];
      [[36.71, 'sawtooth'], [36.9, 'sawtooth'], [73.42, 'triangle'], [110.0, 'sine']].forEach(([f, type], i) => {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
        const og = ctx.createGain(); og.gain.value = i === 3 ? 0.12 : 0.3;
        o.connect(og); og.connect(lp); o.start(); oscs.push(o);
      });
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
      const lfoG = ctx.createGain(); lfoG.gain.value = 50;
      lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
      lp.connect(g); g.connect(A.amb); g.connect(A.reverb);
      A.drone = { g, lp, oscs, level: 0 };
    }
    // Covenant chord: slow sustained voices (D A D F# A D) built on demand
    {
      const g = ctx.createGain(); g.gain.value = 0;
      const notes = [73.42, 110.0, 146.83, 185.0, 220.0, 293.66, 369.99];
      const oscs = notes.map((f, i) => {
        const o = ctx.createOscillator(); o.type = i < 2 ? 'triangle' : 'sine'; o.frequency.value = f;
        const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 1.003;
        const og = ctx.createGain(); og.gain.value = 0.16 / (1 + i * 0.25);
        o.connect(og); o2.connect(og); og.connect(g); o.start(); o2.start();
        return o;
      });
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      g.connect(lp); lp.connect(A.music); lp.connect(A.reverb);
      A.chord = { g, oscs, level: 0 };
    }
    // Shimmer: the "voice" presence — two high quiet sines with tremolo
    {
      const g = ctx.createGain(); g.gain.value = 0;
      [880, 1318.5, 1760].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const og = ctx.createGain(); og.gain.value = 0.05 / (i + 1);
        const tr = ctx.createOscillator(); tr.frequency.value = 0.9 + i * 0.37;
        const trG = ctx.createGain(); trG.gain.value = 0.03 / (i + 1);
        tr.connect(trG); trG.connect(og.gain); tr.start();
        o.connect(og); og.connect(g); o.start();
      });
      g.connect(A.reverb); g.connect(A.music);
      A.shimmer = { g, level: 0 };
    }
    A.ready = true;
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  };

  function ramp(param, value, seconds) {
    const t = A.ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(value, t + Math.max(0.02, seconds || 0.5));
  }

  A.resume = function () { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); };
  A.setMuted = function (m) {
    A.muted = m;
    if (A.master) ramp(A.master.gain, m ? 0 : 0.9, 0.3);
  };
  A.setWind = function (level, sec) { if (!A.ready) return; A.wind.level = level; ramp(A.wind.g.gain, level * 0.5, sec || 3); };
  A.setDrone = function (level, sec) { if (!A.ready) return; A.drone.level = level; ramp(A.drone.g.gain, level * 0.5, sec || 3); };
  A.setChord = function (level, sec) { if (!A.ready) return; A.chord.level = level; ramp(A.chord.g.gain, level * 0.8, sec || 4); };
  A.setShimmer = function (level, sec) { if (!A.ready) return; A.shimmer.level = level; ramp(A.shimmer.g.gain, level, sec || 2); };
  A.setDroneTone = function (freq, sec) { if (!A.ready) return; ramp(A.drone.lp.frequency, freq, sec || 2); };
  A.duck = function (level, sec) { if (!A.ready) return; ramp(A.amb.gain, level, sec || 2); ramp(A.music.gain, level, sec || 2); };
  A.unduck = function (sec) { if (!A.ready) return; ramp(A.amb.gain, 1, sec || 2); ramp(A.music.gain, 1, sec || 2); };

  // Oud-like pluck (Karplus–Strong)
  A.pluck = function (freq, vel, pan) {
    if (!A.ready || A.muted) return;
    const ctx = A.ctx, t = ctx.currentTime;
    vel = vel === undefined ? 0.5 : vel;
    const src = ctx.createBufferSource(); src.buffer = A.noiseBuf;
    const burst = ctx.createGain(); burst.gain.setValueAtTime(1, t); burst.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
    const delay = ctx.createDelay(1); delay.delayTime.value = 1 / freq;
    const fb = ctx.createGain(); fb.gain.value = 0.975;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600 + vel * 2000;
    const out = ctx.createGain(); out.gain.setValueAtTime(vel * 0.9, t); out.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 320; body.gain.value = 5; body.Q.value = 1;
    let dest = out;
    if (pan !== undefined && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; out.connect(p); dest = p; }
    src.connect(burst); burst.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay);
    delay.connect(body); body.connect(out);
    dest.connect(A.music); dest.connect(A.reverb);
    src.start(t); src.stop(t + 0.05);
    setTimeout(() => { try { out.disconnect(); dest.disconnect(); fb.disconnect(); delay.disconnect(); } catch (e) { } }, 2600);
  };

  // Ney-like breathy tone
  A.ney = function (freq, dur, vel) {
    if (!A.ready || A.muted) return;
    const ctx = A.ctx, t = ctx.currentTime; dur = dur || 1.6; vel = vel === undefined ? 0.25 : vel;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
    const vib = ctx.createOscillator(); vib.frequency.value = 5.2; const vibG = ctx.createGain(); vibG.gain.value = freq * 0.006;
    vib.connect(vibG); vibG.connect(o.frequency);
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq * 2.001; const o2g = ctx.createGain(); o2g.gain.value = 0.12;
    const n = ctx.createBufferSource(); n.buffer = A.noiseBuf; n.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 12;
    const ng = ctx.createGain(); ng.gain.value = 0.5;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + dur * 0.35);
    g.gain.setValueAtTime(vel, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(o2g); o2g.connect(g); n.connect(bp); bp.connect(ng); ng.connect(g);
    g.connect(A.music); g.connect(A.reverb);
    o.start(t); o2.start(t); vib.start(t); n.start(t);
    o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1); vib.stop(t + dur + 0.1); n.stop(t + dur + 0.1);
  };

  // Drums
  A.drum = function (kind, vel) {
    if (!A.ready || A.muted) return;
    const ctx = A.ctx, t = ctx.currentTime; vel = vel === undefined ? 1 : vel;
    if (kind === 'low' || kind === 'deep') {
      const o = ctx.createOscillator(); o.type = 'sine';
      const f0 = kind === 'deep' ? 60 : 110, f1 = kind === 'deep' ? 28 : 45, d = kind === 'deep' ? 1.4 : 0.45;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d * 0.6);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.9 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g); g.connect(A.sfx); g.connect(A.reverb); o.start(t); o.stop(t + d + 0.05);
      // skin click
      const n = ctx.createBufferSource(); n.buffer = A.noiseBuf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 1;
      const ng = ctx.createGain(); ng.gain.setValueAtTime(0.25 * vel, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      n.connect(bp); bp.connect(ng); ng.connect(A.sfx); n.start(t); n.stop(t + 0.08);
    } else if (kind === 'hit') {
      const n = ctx.createBufferSource(); n.buffer = A.noiseBuf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.8;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.5 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      n.connect(bp); bp.connect(g); g.connect(A.sfx); n.start(t); n.stop(t + 0.1);
    } else if (kind === 'clash') { // metal-ish strike
      const g = ctx.createGain(); g.gain.setValueAtTime(0.35 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      [1870, 2710, 3890, 5230].forEach(f => { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f * (0.98 + Math.random() * 0.04); const og = ctx.createGain(); og.gain.value = 0.08; o.connect(og); og.connect(g); o.start(t); o.stop(t + 0.5); });
      const n = ctx.createBufferSource(); n.buffer = A.noiseBuf; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
      const ng = ctx.createGain(); ng.gain.setValueAtTime(0.5 * vel, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      n.connect(hp); hp.connect(ng); ng.connect(g); n.start(t); n.stop(t + 0.15);
      g.connect(A.sfx); g.connect(A.reverb);
    } else if (kind === 'thud') { // soft heavy fall (gifts landing)
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.8);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.8 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      o.connect(g); g.connect(A.sfx); g.connect(A.reverb); o.start(t); o.stop(t + 1.3);
    } else if (kind === 'stone') {
      const n = ctx.createBufferSource(); n.buffer = A.noiseBuf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 2;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.6 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      n.connect(bp); bp.connect(g); g.connect(A.sfx); g.connect(A.reverb); n.start(t); n.stop(t + 0.2);
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.15);
      const og = ctx.createGain(); og.gain.setValueAtTime(0.3 * vel, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(og); og.connect(A.sfx); o.start(t); o.stop(t + 0.22);
    } else if (kind === 'whoosh') {
      const n = ctx.createBufferSource(); n.buffer = A.noiseBuf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.5;
      bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 0.25); bp.frequency.exponentialRampToValueAtTime(500, t + 0.6);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * vel, t + 0.2); g.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      n.connect(bp); bp.connect(g); g.connect(A.sfx); n.start(t); n.stop(t + 0.7);
    } else if (kind === 'wings') {
      for (let i = 0; i < 3; i++) {
        const n = ctx.createBufferSource(); n.buffer = A.noiseBuf;
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 300; bp.Q.value = 1;
        const g = ctx.createGain(); const tt = t + i * 0.16;
        g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.35 * vel, tt + 0.05); g.gain.exponentialRampToValueAtTime(0.001, tt + 0.15);
        n.connect(bp); bp.connect(g); g.connect(A.sfx); n.start(tt); n.stop(tt + 0.2);
      }
    } else if (kind === 'rumble') {
      const n = ctx.createBufferSource(); n.buffer = A.noiseBuf;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 90;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1.2 * vel, t + 0.6); g.gain.exponentialRampToValueAtTime(0.001, t + 3);
      n.connect(lp); lp.connect(g); g.connect(A.sfx); n.start(t); n.stop(t + 3.1);
    }
  };

  // Rhythm loop for war
  A.drums = function (on, tempo, intensity) {
    if (A.drumTimer) { clearInterval(A.drumTimer); A.drumTimer = null; }
    if (!on || !A.ready) return;
    let step = 0; const bpm = tempo || 100; intensity = intensity || 0.6;
    const ms = 60000 / bpm / 2;
    const pattern = [1, 0, 0.5, 0, 1, 0, 0.5, 0.3, 1, 0, 0, 0.5, 1, 0.3, 0.5, 0];
    A.drumTimer = setInterval(() => {
      if (document.hidden) return;
      const v = pattern[step % pattern.length];
      if (v) A.drum(v >= 1 ? 'low' : 'hit', v * intensity);
      if (step % 16 === 0 && intensity > 0.7) A.drum('deep', 0.6);
      step++;
    }, ms);
  };

  // Sparse modal motif
  A.motif = function (on, density) {
    if (A.motifTimer) { clearTimeout(A.motifTimer); A.motifTimer = null; }
    if (!on || !A.ready) return;
    let last = -1;
    const next = () => {
      if (!A.motifTimer) return;
      if (!document.hidden) {
        let i; do { i = Math.floor(Math.random() * A.scale.length); } while (i === last);
        last = i;
        const f = A.scale[i];
        if (Math.random() < 0.7) A.pluck(f, 0.25 + Math.random() * 0.25, (Math.random() - 0.5) * 0.6);
        else A.ney(f * 2, 1.5 + Math.random() * 1.5, 0.12);
        if (Math.random() < 0.3) setTimeout(() => A.pluck(f * (Math.random() < 0.5 ? 0.5 : 1.5), 0.2), 300 + Math.random() * 400);
      }
      A.motifTimer = setTimeout(next, (3000 + Math.random() * 6000) / (density || 1));
    };
    A.motifTimer = setTimeout(next, 800);
  };

  // A short, specific phrase for moments (notes as scale indices, timings in ms)
  A.phrase = function (seq, base) {
    if (!A.ready) return;
    let t = 0;
    seq.forEach(([idx, dur, vel]) => {
      setTimeout(() => A.pluck(A.scale[idx] * (base || 1), vel || 0.4), t);
      t += dur;
    });
  };

  A.stopLoops = function () { A.drums(false); A.motif(false); };

  document.addEventListener('visibilitychange', () => {
    if (!A.ctx) return;
    if (document.hidden) { if (A.ctx.state === 'running') A.ctx.suspend(); }
    else if (A.ctx.state === 'suspended') A.ctx.resume();
  });

  window.Audio2 = A;
})();

/* util.js — small helpers: random, noise, easing, color, hebrew numerals */
'use strict';
(function () {
  const U = {};

  // Deterministic PRNG (mulberry32)
  U.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.smooth = t => t * t * (3 - 2 * t);
  U.easeOut = t => 1 - Math.pow(1 - t, 3);
  U.easeIn = t => t * t * t;
  U.easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  U.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  U.TAU = Math.PI * 2;

  // 1D periodic "noise" from summed sines (seeded). period in px.
  U.ridge = function (seed, period, octaves) {
    const r = U.rng(seed);
    const comps = [];
    for (let i = 0; i < (octaves || 5); i++) {
      comps.push({ f: 1 + Math.floor(r() * (2 + i * 2)), p: r() * U.TAU, a: 1 / (i + 1) });
    }
    return function (x) {
      let v = 0;
      for (const c of comps) v += Math.sin((x / period) * U.TAU * c.f + c.p) * c.a;
      return v / 2.2; // ~ -1..1
    };
  };

  // 2D value noise (seeded), smooth, for textures
  U.noise2 = function (seed) {
    const r = U.rng(seed);
    const N = 256, perm = new Uint8Array(N * 2), vals = new Float32Array(N);
    for (let i = 0; i < N; i++) { perm[i] = i; vals[i] = r(); }
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    for (let i = 0; i < N; i++) perm[i + N] = perm[i];
    const v = (x, y) => vals[perm[perm[x & 255] + (y & 255)]];
    return function (x, y) {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const u = U.smooth(xf), w = U.smooth(yf);
      const a = v(xi, yi), b = v(xi + 1, yi), c = v(xi, yi + 1), d = v(xi + 1, yi + 1);
      return U.lerp(U.lerp(a, b, u), U.lerp(c, d, u), w);
    };
  };

  // Colors as [h, s, l] (0-360, 0-100, 0-100)
  U.hsl = (h, s, l, a) => a === undefined ? `hsl(${h},${s}%,${l}%)` : `hsla(${h},${s}%,${l}%,${a})`;
  U.col = (c, a) => U.hsl(c[0], c[1], c[2], a);
  U.mix = (c1, c2, t) => [U.lerp(c1[0], c2[0], t), U.lerp(c1[1], c2[1], t), U.lerp(c1[2], c2[2], t)];
  U.shade = (c, dl, ds) => [c[0], U.clamp(c[1] + (ds || 0), 0, 100), U.clamp(c[2] + dl, 0, 100)];

  // Hebrew numerals (gematria style) 1..999
  U.hebNum = function (n) {
    if (n <= 0) return '';
    const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
    const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
    const hund = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
    let s = hund[Math.floor(n / 100) % 10] + tens[Math.floor(n / 10) % 10] + ones[n % 10];
    s = s.replace('יה', 'טו').replace('יו', 'טז');
    if (s.length === 1) return s + '׳';
    return s.slice(0, -1) + '״' + s.slice(-1);
  };

  U.isMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
  U.reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  U.shuffle = function (arr, r) {
    r = r || Math.random;
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  };

  window.U = U;
})();

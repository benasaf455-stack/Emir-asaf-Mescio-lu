/* Kılıç ve Kalkan: arena çizimi ve dövüş kuralları. */
window.KK = window.KK || {};
(function (KK) {
  'use strict';

  const W = 384, H = 216, GROUND = 190, SLOTS = 10;
  const RES = 4; // tuval, ayrıntılı sprite'lar net görünsün diye 4 kat çözünürlükte çizilir
  const slotX = (i) => 40 + i * 34;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const rnd = Math.random;
  const ri = (a, b) => Math.floor(a + rnd() * (b - a + 1));
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  KK.util = { clamp, lerp, ease, rnd, ri, pick, wait, reduced };

  /* ---------- ses ---------- */
  let AC = null;
  KK.soundOn = true;
  KK.audio = () => {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
    if (AC && AC.state === 'suspended') AC.resume().catch(() => {});
    return AC;
  };
  function noise(dur, freq, q, gain, attack = 0.005) {
    const a = KK.audio(); if (!a || !KK.soundOn) return;
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = rnd() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = a.createGain(), t = a.currentTime;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(a.destination); src.start();
  }
  function tone(freq, dur, type, gain, to) {
    const a = KK.audio(); if (!a || !KK.soundOn) return;
    const o = a.createOscillator(), t = a.currentTime; o.type = type;
    o.frequency.setValueAtTime(freq, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = a.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(); o.stop(t + dur);
  }
  const SFX = {
    swing: () => noise(0.16, 1300, 0.8, 0.2),
    hit: () => { noise(0.12, 380, 1.2, 0.6); tone(110, 0.16, 'square', 0.12, 50); },
    crit: () => { noise(0.2, 300, 1, 0.8); tone(90, 0.3, 'square', 0.15, 40); },
    clang: () => { tone(1480, 0.3, 'square', 0.06, 1380); tone(2250, 0.2, 'square', 0.04, 2150); },
    miss: () => noise(0.25, 650, 0.5, 0.16, 0.05),
    step: () => noise(0.05, 260, 1, 0.12),
    bow: () => { tone(500, 0.08, 'square', 0.05, 200); noise(0.2, 2000, 0.7, 0.1); },
    cheer: () => noise(1.2, 1000, 0.35, 0.14, 0.35),
    boo: () => tone(150, 0.5, 'square', 0.04, 110),
    taunt: () => { tone(330, 0.1, 'square', 0.04, 440); setTimeout(() => tone(440, 0.12, 'square', 0.04, 300), 110); },
    potion: () => { tone(600, 0.12, 'square', 0.05, 900); setTimeout(() => tone(900, 0.15, 'square', 0.05, 1200), 120); },
    horn: () => { tone(220, 0.8, 'sawtooth', 0.04, 230); tone(330, 0.8, 'sawtooth', 0.025, 335); },
    buy: () => { tone(1200, 0.08, 'square', 0.04); setTimeout(() => tone(1600, 0.1, 'square', 0.04), 80); },
  };
  KK.sfx = (n) => { try { SFX[n](); } catch (e) { /* ses yok */ } };

  /* ---------- sahne ---------- */
  const cv = document.getElementById('arena');
  cv.width = W * RES; cv.height = H * RES;
  const ctx = cv.getContext('2d');
  const S = { fighters: [], texts: [], parts: [], excite: 0, shake: 0, top: null, dark: 0 };
  KK.scene = S;

  let BG = null, CROWD = [];
  function buildBg() {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const r = KK.seeded('arena-bg');
    const band = (y, h, col) => { x.fillStyle = col; x.fillRect(0, y, W, h); };
    band(0, 5, '#2b1a33'); band(5, 4, '#5a2a3a'); band(9, 4, '#8c3f38'); band(13, 3, '#b35f3a');
    // gölgelik
    for (let i = 0; i < W; i += 24) {
      x.fillStyle = (i / 24) % 2 ? '#cdb58a' : '#8e2620';
      for (let k = 0; k < 10; k++) x.fillRect(i + k, k, 24 - 2 * k, 1);
    }
    // tribün
    band(16, 96, '#5a4331');
    for (let row = 0; row < 6; row++) {
      const y = 22 + row * 15;
      band(y + 11, 2, '#35271c'); band(y + 13, 1, '#6e5440');
    }
    // imparator locası
    x.fillStyle = '#20140f'; x.fillRect(170, 30, 44, 30);
    x.fillStyle = '#4d2652'; x.fillRect(166, 58, 52, 8);
    x.fillStyle = '#e0b54d'; x.fillRect(166, 57, 52, 1); x.fillRect(166, 65, 52, 1);
    for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? '#3d1e42' : '#5e3064'; x.fillRect(168 + i * 8, 66, 7, 5); }
    x.fillStyle = '#4d2652'; x.fillRect(188, 44, 8, 13);
    x.fillStyle = '#d9a577'; x.fillRect(189, 38, 6, 6);
    x.fillStyle = '#56662c'; x.fillRect(188, 37, 8, 2);
    x.fillStyle = '#8a8272'; x.fillRect(176, 47, 5, 10); x.fillRect(203, 47, 5, 10);
    x.fillStyle = '#b27a4f'; x.fillRect(177, 42, 4, 4); x.fillRect(204, 42, 4, 4);
    // duvar
    band(112, 22, '#7a5c41'); band(112, 2, '#b89a73'); band(132, 2, '#4a3727');
    for (let i = 0; i < 12; i++) {
      const gx = 6 + i * 32;
      if (i === 0 || i === 11) {
        x.fillStyle = '#140d09'; x.fillRect(gx, 118, 18, 16); x.fillRect(gx + 2, 116, 14, 2);
        x.fillStyle = '#35271c'; for (let b = 2; b < 18; b += 4) x.fillRect(gx + b, 116, 1, 18);
      } else if (i % 2) {
        x.fillStyle = '#8e2620'; x.fillRect(gx + 4, 114, 12, 14); x.fillRect(gx + 6, 128, 8, 2);
        x.fillStyle = '#e0b54d'; x.fillRect(gx + 4, 114, 12, 1); x.fillRect(gx + 9, 119, 2, 2);
      } else {
        x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(gx + 2, 117, 16, 13);
      }
    }
    // kum
    band(134, 82, '#c49a62');
    band(134, 3, '#8f6a42');
    for (let i = 0; i < 900; i++) {
      x.fillStyle = r() < 0.5 ? '#a98150' : '#d8b27a';
      x.fillRect(Math.floor(r() * W), 137 + Math.floor(r() * (H - 137)), 1, 1);
    }
    for (let i = 0; i < 10; i++) {
      x.fillStyle = '#b48c58';
      x.fillRect(Math.floor(r() * 300), 150 + i * 6, 40 + Math.floor(r() * 60), 1);
    }
    BG = c;
    CROWD = [];
    const cols = ['#8e2620', '#2c4f69', '#56662c', '#a88443', '#d8cdb4', '#4d2652', '#6d4a2c'];
    for (let row = 0; row < 6; row++) {
      const y = 28 + row * 15;
      for (let cx = 2 + (row % 2) * 3; cx < W - 2; cx += 6) {
        if (cx > 164 && cx < 220 && y < 74) continue;
        if (r() < 0.12) continue;
        CROWD.push({ x: cx, y, body: cols[Math.floor(r() * cols.length)], head: KK.LOOK.skin[Math.floor(r() * 4)], ph: r() * 6.28, amp: 0.5 + r() });
      }
    }
  }

  function floatText(x, y, txt, col) { S.texts.push({ x, y, txt, col, t0: performance.now(), life: 1100 }); }
  function burst(x, y, col, n, spd = 1.6) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, v = rnd() * spd + 0.4;
      S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.8, life: 1, col });
    }
  }
  const bubbles = [];
  function bubble(f, txt) { bubbles.push({ f, txt, until: performance.now() + 1800 }); }

  function spriteKeyFor(f) {
    if (f.isPlayer) return 'oyuncu';
    if (f.matchId && KK.SPRITE_DEFS[f.matchId]) return f.matchId;
    return f.style;
  }

  function render(now) {
    const t = now / 1000;
    if (!BG) buildBg();
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (S.shake > 0.4 && !reduced) ctx.translate(Math.round((rnd() - 0.5) * S.shake), Math.round((rnd() - 0.5) * S.shake));
    S.shake *= 0.85;
    ctx.drawImage(BG, 0, 0, W, H);
    S.excite *= 0.985;
    for (const p of CROWD) {
      const b = Math.round(Math.max(0, Math.sin(now / 110 + p.ph)) * S.excite * 2 * p.amp);
      ctx.fillStyle = p.body; ctx.fillRect(p.x - 2, p.y - 3 - b, 4, 5);
      ctx.fillStyle = p.head; ctx.fillRect(p.x - 1, p.y - 6 - b, 3, 3);
      if (S.excite > 0.6 && p.amp > 1.2) { ctx.fillStyle = p.head; ctx.fillRect(p.x + 2, p.y - 7 - b, 1, 3); }
    }
    const list = S.fighters.slice().sort((a, b) => (a === S.top ? 1 : 0) - (b === S.top ? 1 : 0));
    for (const f of list) {
      f.r.hurt *= 0.9;
      KK.drawFighter(ctx, f, f.r.x, GROUND, f.facing, f.r, t, spriteKeyFor(f));
    }
    S.parts = S.parts.filter((p) => p.life > 0);
    for (const p of S.parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.03;
      if (p.y > GROUND + 1) { p.y = GROUND + 1; p.vx *= 0.4; p.vy = 0; }
      ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].until < now) bubbles.splice(i, 1);
    ctx.font = '8px "Pixelify Sans", monospace';
    ctx.textBaseline = 'middle';
    for (const b of bubbles) {
      const tw = Math.min(170, Math.ceil(ctx.measureText(b.txt).width));
      const bw = tw + 8, bh = 12;
      const bx = Math.round(clamp(b.f.r.x - bw / 2, 3, W - bw - 3)), by = GROUND - 70;
      ctx.fillStyle = '#efdcb8'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#120c0a'; ctx.fillRect(bx, by + bh, bw, 1);
      ctx.fillStyle = '#efdcb8'; ctx.fillRect(Math.round(b.f.r.x) - 1, by + bh, 3, 3);
      ctx.fillStyle = '#120c0a'; ctx.textAlign = 'left'; ctx.fillText(b.txt, bx + 4, by + 6.5, 170);
    }
    S.texts = S.texts.filter((x) => now - x.t0 < x.life);
    ctx.textAlign = 'center';
    for (const tx of S.texts) {
      const k = (now - tx.t0) / tx.life;
      const y = Math.round(tx.y - k * 16);
      ctx.fillStyle = '#120c0a';
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillText(tx.txt, Math.round(tx.x) + dx, y + dy);
      ctx.fillStyle = tx.col; ctx.fillText(tx.txt, Math.round(tx.x), y);
    }
    if (S.dark > 0) { ctx.fillStyle = `rgba(8,4,10,${S.dark})`; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
    requestAnimationFrame(render);
  }
  KK.startRender = () => { buildBg(); requestAnimationFrame(render); };

  function tween(ms, fn) {
    return new Promise((res) => {
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / ms);
        fn(k);
        if (k < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }
  const idleR = () => ({ x: 0, walk: 0, strike: 0, recover: 0, hurt: 0, fall: 0, taunt: 0, kb: 0, hop: 0 });
  KK.idleR = idleR;

  /* ---------- menü tanıtımı ---------- */
  let demoToken = 0;
  KK.showDemo = () => {
    const tok = ++demoToken;
    const mk = (style, slot, facing, lvl) => {
      const f = KK.buildFoe({ id: 'demo' + rnd(), style, lvl }, ri(1, 4));
      f.facing = facing; f.r = idleR(); f.r.x = slotX(slot);
      return f;
    };
    const a = mk(pick(['dengeli', 'savunmaci']), 4, 1, 5), b = mk(pick(['tokmakci', 'hancerci', 'dengeli']), 5, -1, 5);
    a.isPlayer = true;
    S.fighters = [b, a]; S.texts = []; S.parts = []; S.dark = 0;
    (async () => {
      await wait(900);
      while (tok === demoToken) {
        const [att, def] = rnd() < 0.5 ? [a, b] : [b, a];
        S.top = att;
        const bx = att.r.x;
        await tween(380, (k) => { att.r.strike = k; att.r.x = bx + att.facing * Math.sin(k * Math.PI / 2) * 8; });
        if (tok !== demoToken) break;
        const roll = rnd();
        if (roll < 0.4) { burst(def.r.x + def.facing * 6, GROUND - 24, '#ffe08a', 8); floatText(def.r.x, GROUND - 52, 'BLOK', '#e8b04f'); }
        else if (roll < 0.65) floatText(def.r.x, GROUND - 52, 'ISKA', '#a88f70');
        else { def.r.hurt = 1; burst(def.r.x, GROUND - 26, '#a3231d', 8); floatText(def.r.x, GROUND - 52, '-' + ri(4, 18), '#efdcb8'); S.excite = 0.8; }
        await tween(240, (k) => { att.r.recover = k; att.r.x = bx + att.facing * 8 * (1 - k); });
        att.r.strike = 0; att.r.recover = 0; att.r.x = bx;
        await wait(900 + rnd() * 900);
      }
    })();
  };
  KK.stopDemo = () => { demoToken++; };

  /* ---------- dövüş ---------- */
  const ATK = {
    quick: { n: 'Hızlı saldırı', en: 6, acc: 0.15, mul: 0.6, dur: 240 },
    normal: { n: 'Normal saldırı', en: 12, acc: 0, mul: 1, dur: 340 },
    power: { n: 'Güçlü saldırı', en: 24, acc: -0.2, mul: 1.8, dur: 500 },
    cift: { n: 'Çift hançer darbesi', en: 10, acc: 0.1, mul: 0.55, dur: 200 },
    ok: { n: 'Ok', en: 8, acc: -0.05, mul: 1, dur: 420, ranged: true },
  };
  const TAUNT_EN = 4;
  const TAUNTS = [
    'Kılıcını kimden ödünç aldın?',
    'Aslanlar bile sana güldü!',
    'Bu hızla kumu süpürürsün!',
    'Seyirci uyuyor, sen de öyle!',
    'Kalkanın senden cesur!',
    'Sandaletlerin bağlı mı bari?',
  ];
  KK.ATK = ATK;
  KK.TAUNT_EN = TAUNT_EN;

  let C = null;
  KK.combat = () => C;

  function prep(src, slot, facing, isPlayer) {
    const f = Object.assign({}, src, { stats: Object.assign({}, src.stats), equip: Object.assign({}, src.equip), isPlayer });
    f.d = KK.derive(f);
    f.hp = f.d.maxHp; f.en = f.d.maxEn;
    f.slot = slot; f.facing = facing;
    f.r = idleR(); f.r.x = slotX(slot);
    return f;
  }
  const dist = () => Math.abs(C.p.slot - C.e.slot);
  function atkCost(f, id) { return ATK[id].en + (id !== 'ok' ? KK.WEAPON_TYPES[f.d.wtype].extraEn : 0); }
  KK.atkCost = atkCost;

  function canDo(f, o, id) {
    const d = Math.abs(f.slot - o.slot);
    if (f.isPlayer && C.tut && C.tut.allowed && !C.tut.allowed.includes(id)) return false;
    switch (id) {
      case 'fwd': return d > 1;
      case 'back': return f.facing > 0 ? f.slot > 0 : f.slot < SLOTS - 1;
      case 'quick': case 'normal': case 'power': case 'cift': return d <= 1 && f.en >= atkCost(f, id);
      case 'ok': return !!f.bow && d >= 2 && f.en >= atkCost(f, id);
      case 'taunt': return f.en >= TAUNT_EN;
      case 'rest': return true;
      case 'pot_can': case 'pot_enerji': {
        if (!f.isPlayer || !C.potions) return false;
        const k = id.slice(4);
        return C.potUsed < KK.MAX_POTIONS_PER_FIGHT && (C.potions[k] || 0) > 0;
      }
    }
    return false;
  }
  KK.canDo = (id) => C && canDo(C.p, C.e, id);

  function hitChance(a, t, A, id) {
    const wAcc = id === 'ok' ? KK.WEAPON_TYPES.yay.acc : KK.WEAPON_TYPES[a.d.wtype].acc;
    return clamp(0.62 + (a.d.atk - t.d.agi) * 0.025 + A.acc + wAcc, 0.1, 0.95);
  }
  function dmgRange(a, t, A, id) {
    const red = 100 / (100 + t.d.armor * 1.8 + t.d.def * 2);
    const wmul = id === 'ok' ? 1 : KK.WEAPON_TYPES[a.d.wtype].mul;
    const [mn, mx] = id === 'ok' ? [a.bow.min, a.bow.max] : [a.d.wmin, a.d.wmax];
    const strF = id === 'ok' ? 0.5 : 1.1;
    const f = (w) => Math.max(1, Math.round((w + a.d.str * strF) * A.mul * wmul * red));
    return [f(mn), f(mx)];
  }
  KK.preview = (id) => {
    if (!C) return null;
    const A = ATK[id];
    if (!A) return null;
    return { hit: hitChance(C.p, C.e, A, id), dmg: dmgRange(C.p, C.e, A, id), en: atkCost(C.p, id) };
  };
  KK.tauntChance = () => (C ? clamp(0.45 + (C.p.d.cha - C.e.d.cha) * 0.04, 0.1, 0.9) : 0);

  function textAbove(f, txt, col) { floatText(f.r.x, GROUND - 52, txt, col); }
  function crowd(delta) {
    C.crowd = clamp(C.crowd + delta, 0, 10);
    if (delta > 0) S.excite = Math.min(1.2, S.excite + 0.4 * delta);
  }
  const log = (m) => { if (C.onLog) C.onLog(m); };
  const hud = () => { if (C.onHud) C.onHud(); };

  async function walk(f, to, steps) {
    const from = f.r.x;
    KK.sfx('step');
    await tween(reduced ? 120 : 200 + steps * 150, (k) => { f.r.x = lerp(from, to, ease(k)); f.r.walk = k * steps * Math.PI * 2; });
    f.r.walk = 0;
  }

  async function strike(a, t, id) {
    const A = ATK[id];
    const bx = a.r.x, dir = a.facing;
    if (A.ranged) {
      KK.sfx('bow');
      await tween(reduced ? 120 : 260, (k) => { a.r.taunt = Math.sin(k * Math.PI) * 0.5; });
      a.r.taunt = 0;
      const ar = { x: a.r.x + dir * 8, y: GROUND - 27 };
      const tx = t.r.x;
      await tween(reduced ? 100 : 260, (k) => {
        ar.x = lerp(a.r.x + dir * 8, tx, k);
        S.parts.push({ x: ar.x, y: ar.y, vx: 0, vy: 0, life: 0.15, col: '#d8c9a8' });
      });
      resolveAttack(a, t, A, id);
      return;
    }
    KK.sfx('swing');
    await tween(reduced ? 120 : A.dur, (k) => { a.r.strike = k; a.r.x = bx + dir * Math.sin(k * Math.PI / 2) * 8; });
    resolveAttack(a, t, A, id);
    await tween(reduced ? 100 : 220, (k) => { a.r.recover = k; a.r.x = bx + dir * 8 * (1 - k); });
    a.r.strike = 0; a.r.recover = 0; a.r.x = bx;
  }

  function resolveAttack(a, t, A, id) {
    const hx = t.r.x, hy = GROUND - 26;
    const name = a.isPlayer ? 'Sen' : a.name;
    if (!C.forceBlock && rnd() > hitChance(a, t, A, id)) {
      textAbove(t, 'ISKA', '#a88f70'); KK.sfx('miss');
      tween(260, (k) => { t.r.kb = Math.sin(k * Math.PI) * 4; }).then(() => { t.r.kb = 0; });
      log(a.isPlayer ? `${A.n} boşa gitti.` : `${a.name} ıskaladı.`);
      return;
    }
    if (C.forceBlock || rnd() < t.d.block) {
      textAbove(t, 'BLOK', '#e8b04f'); KK.sfx('clang');
      burst(hx + t.facing * 7, hy + 2, '#ffe08a', 8); S.shake = 2;
      log(a.isPlayer ? `${t.name} kalkanıyla savuşturdu.` : 'Kalkanın darbeyi kendiliğinden karşıladı.');
      return;
    }
    const wmul = id === 'ok' ? 1 : KK.WEAPON_TYPES[a.d.wtype].mul;
    const [mn, mx] = id === 'ok' ? [a.bow.min, a.bow.max] : [a.d.wmin, a.d.wmax];
    let raw = (ri(mn, mx) + a.d.str * (id === 'ok' ? 0.5 : 1.1)) * A.mul * wmul;
    const crit = rnd() < a.d.crit;
    if (crit) raw *= 1.6;
    if (C.kind === 'tutorial' && !a.isPlayer) raw *= 0.4;
    const red = 100 / (100 + t.d.armor * 1.8 + t.d.def * 2);
    const dmg = Math.max(1, Math.round(raw * red));
    t.hp = Math.max(C.kind === 'tutorial' && t.isPlayer ? 1 : 0, t.hp - dmg);
    t.r.hurt = 1;
    tween(240, (k) => { t.r.kb = Math.sin(k * Math.PI) * (crit ? 5 : 3); }).then(() => { t.r.kb = 0; });
    burst(hx, hy, '#a3231d', crit ? 16 : 8, crit ? 2.2 : 1.6);
    S.shake = crit ? 5 : 2.5;
    textAbove(t, crit ? `KRİTİK -${dmg}` : `-${dmg}`, crit ? '#ff6a4d' : '#efdcb8');
    KK.sfx(crit ? 'crit' : 'hit');
    if (a.isPlayer) {
      if (crit || id === 'power') { crowd(1); KK.sfx('cheer'); }
      log(`${A.n} ile ${dmg} hasar verdin${crit ? ' (kritik!)' : ''}.`);
    } else {
      if (crit) crowd(-1);
      log(`${name}: ${A.n.toLowerCase()}, ${dmg} hasar${crit ? ' (kritik!)' : ''}.`);
    }
  }

  async function perform(a, t, id) {
    S.top = a;
    const dir = a.facing;
    if (id === 'fwd') {
      const steps = Math.min(a.isPlayer ? 2 : KK.STYLES[a.style].step, Math.abs(t.slot - a.slot) - 1);
      a.slot += dir * steps;
      await walk(a, slotX(a.slot), steps);
      log(a.isPlayer ? `${steps} adım ilerledin.` : `${a.name} ${steps} adım ilerledi.`);
    } else if (id === 'back') {
      a.slot -= dir;
      await walk(a, slotX(a.slot), 1);
      log(a.isPlayer ? 'Bir adım geri çekildin.' : `${a.name} geri çekildi.`);
    } else if (ATK[id]) {
      a.en -= atkCost(a, id);
      if (id === 'cift') {
        await strike(a, t, 'cift');
        if (t.hp > 0) await strike(a, t, 'cift');
      } else await strike(a, t, id);
    } else if (id === 'taunt') {
      a.en -= TAUNT_EN;
      KK.sfx('taunt'); bubble(a, pick(TAUNTS));
      await tween(reduced ? 200 : 650, (k) => { a.r.taunt = Math.sin(k * Math.PI); a.r.hop = Math.round(Math.abs(Math.sin(k * Math.PI * 2)) * 3); });
      a.r.taunt = 0; a.r.hop = 0;
      const ch = clamp(0.45 + (a.d.cha - t.d.cha) * 0.04, 0.1, 0.9);
      if (rnd() < ch) {
        const drain = Math.min(t.en, 8 + a.d.cha);
        t.en -= drain;
        textAbove(t, `-${drain} EN`, '#d9a52b'); KK.sfx('cheer');
        if (a.isPlayer) { crowd(2); log(`Seyirci coştu! Rakip ${drain} enerji kaybetti.`); }
        else { crowd(-1); S.excite = Math.min(1.2, S.excite + 0.5); log(`${a.name} seyirciyi kışkırttı, ${drain} enerji kaybettin.`); }
      } else {
        textAbove(a, 'YUH!', '#a88f70'); KK.sfx('boo');
        log(a.isPlayer ? 'Seyirci alayını beğenmedi.' : `${a.name} alay etti ama seyirci yuhaladı.`);
        if (!a.isPlayer) crowd(1);
      }
    } else if (id === 'rest') {
      const gain = Math.min(a.d.maxEn - a.en, a.d.rest);
      a.en += gain;
      textAbove(a, `+${gain} EN`, '#d9a52b');
      await tween(reduced ? 150 : 500, (k) => { a.r.hop = -Math.round(Math.sin(k * Math.PI) * 1); });
      a.r.hop = 0;
      log(a.isPlayer ? `Soluklandın, ${gain} enerji topladın.` : `${a.name} soluklandı.`);
    } else if (id === 'pot_can' || id === 'pot_enerji') {
      const k = id.slice(4);
      C.potions[k]--; C.potUsed++;
      KK.sfx('potion');
      if (k === 'can') {
        const g = Math.min(a.d.maxHp - a.hp, Math.round(a.d.maxHp * 0.4)); a.hp += g;
        textAbove(a, `+${g} CAN`, '#7fbf5a'); log(`Can İksiri içtin, ${g} can kazandın.`);
      } else {
        const g = Math.min(a.d.maxEn - a.en, Math.round(a.d.maxEn * 0.5)); a.en += g;
        textAbove(a, `+${g} EN`, '#d9a52b'); log(`Enerji İksiri içtin, ${g} enerji kazandın.`);
      }
      burst(a.r.x, GROUND - 30, k === 'can' ? '#7fbf5a' : '#d9a52b', 10, 1);
      await wait(reduced ? 150 : 450);
    } else if (id === 'wait') {
      log(`${a.name} bekliyor.`);
      await wait(reduced ? 100 : 300);
    }
    if (id !== 'rest' && id !== 'pot_enerji') a.en = Math.min(a.d.maxEn, a.en + 4);
    hud();
  }

  /* ---------- yapay zekâ: tarzlara göre ---------- */
  function weighted(opts) {
    const tot = opts.reduce((s, o) => s + o[1], 0);
    let r = rnd() * tot;
    for (const o of opts) { r -= o[1]; if (r <= 0) return o[0]; }
    return opts[opts.length - 1][0];
  }
  function ai(me, foe) {
    const d = Math.abs(me.slot - foe.slot);
    const hpR = me.hp / me.d.maxHp, enR = me.en / me.d.maxEn, fh = foe.hp / foe.d.maxHp;
    const can = (id) => canDo(me, foe, id);
    const st = me.style;
    if (st === 'okcu') {
      if (d <= 1) {
        if (can('back') && rnd() < 0.75) return 'back';
        return can('quick') ? 'quick' : 'rest';
      }
      if (d === 2 && can('back') && rnd() < 0.4) return 'back';
      if (can('ok') && enR > 0.2) return 'ok';
      return 'rest';
    }
    if (d > 1) {
      if (enR < 0.3) return 'rest';
      if (st === 'savunmaci' && enR < 0.6 && rnd() < 0.5) return 'rest';
      if (can('taunt') && rnd() < 0.08) return 'taunt';
      return 'fwd';
    }
    if (st === 'hancerci') {
      if (can('cift') && rnd() < 0.7) return 'cift';
      if (hpR < 0.5 && can('back') && rnd() < 0.3) return 'back';
      return can('quick') ? 'quick' : 'rest';
    }
    if (st === 'tokmakci') {
      if (can('power') && rnd() < 0.6) return 'power';
      if (can('normal')) return 'normal';
      return 'rest';
    }
    if (st === 'savunmaci') {
      const o = [];
      if (enR < 0.6) o.push(['rest', 2]);
      if (can('normal')) o.push(['normal', 3]);
      if (can('quick')) o.push(['quick', 2]);
      if (can('power')) o.push(['power', fh < 0.3 ? 2 : 0.6]);
      return o.length ? weighted(o) : 'rest';
    }
    if (hpR < 0.25 && enR < 0.3 && can('back') && rnd() < 0.35) return 'back';
    if (!can('quick')) return 'rest';
    const o = [];
    if (can('power')) o.push(['power', fh < 0.3 ? 4 : 2]);
    if (can('normal')) o.push(['normal', 3]);
    o.push(['quick', enR < 0.4 ? 3 : 1.5]);
    if (enR < 0.45) o.push(['rest', 1.2]);
    return weighted(o);
  }

  /* ---------- eğitim adımları ---------- */
  const TUT_STEPS = [
    { text: 'Rakibe yaklaş. Saldırmak için ona bitişik olmalısın. İlerle’ye bas.', allowed: ['fwd'], done: () => dist() <= 1 },
    { text: 'Hızlı Saldırı: az enerji harcar, sık isabet eder.', allowed: ['quick'] },
    { text: 'Normal Saldırı: dengeli bir vuruş.', allowed: ['normal'] },
    { text: 'Güçlü Saldırı: çok vurur ama çok enerji harcar ve sık ıskalar.', allowed: ['power'], after: 'block' },
    { text: 'Rakip saldırdı ama kalkanın darbeyi kendiliğinden karşıladı. Buna otomatik savunma denir. Saldırılar enerji harcar; enerjin azaldı. Dinlen ile enerji topla.', allowed: ['rest'] },
    { text: 'Enerjin bitince saldıramazsın, onu iyi yönet. Şimdi dövüşü bitir!', allowed: null },
  ];

  async function enemyTurn() {
    if (C.tut && C.tut.pendingBlock) {
      C.tut.pendingBlock = false;
      C.forceBlock = true;
      await perform(C.e, C.p, 'normal');
      C.forceBlock = false;
      return;
    }
    if (C.tut && C.tut.step <= 3) { await perform(C.e, C.p, 'wait'); return; }
    await perform(C.e, C.p, ai(C.e, C.p));
  }

  function advanceTutorial(id) {
    const tut = C.tut;
    if (!tut) return;
    const s = TUT_STEPS[tut.step];
    if (!s.allowed) return;
    const ok = s.done ? s.done() : s.allowed.includes(id);
    if (!ok) return;
    if (s.after === 'block') tut.pendingBlock = true;
    tut.step++;
  }
  function syncTutorial() {
    if (!C.tut) return;
    const s = TUT_STEPS[C.tut.step];
    C.tut.allowed = s.allowed;
    if (C.onTutorial) C.onTutorial(s.text, s.allowed);
  }

  KK.playerAct = async (id) => {
    if (!C || C.busy || C.over) return;
    if (!canDo(C.p, C.e, id)) return;
    C.busy = true; hud();
    await perform(C.p, C.e, id);
    advanceTutorial(id);
    if (await checkEnd()) return;
    await wait(reduced ? 120 : 320);
    await enemyTurn();
    if (await checkEnd()) return;
    C.turn++;
    C.busy = false;
    syncTutorial();
    hud();
  };

  async function checkEnd() {
    const dead = C.e.hp <= 0 ? C.e : C.p.hp <= 0 ? C.p : null;
    if (!dead) return false;
    C.over = true; hud();
    const win = dead === C.e;
    if (win) {
      await tween(reduced ? 200 : 750, (k) => { dead.r.fall = ease(k); });
      S.shake = 4; burst(dead.r.x, GROUND - 3, '#c49a62', 14);
      S.excite = 1.3; KK.sfx('cheer'); KK.sfx('horn');
      textAbove(C.p, 'ZAFER!', '#e8b04f');
    } else {
      await tween(reduced ? 200 : 600, (k) => { dead.r.fall = ease(k) * 0.35; });
      textAbove(C.p, 'DUR!', '#d33a2c');
      KK.sfx('horn');
    }
    await wait(reduced ? 300 : 1300);
    const res = { win, crowd: C.crowd };
    const cb = C.onEnd;
    if (cb) cb(res);
    return true;
  }

  /* opts: { player, foe, kind: 'story'|'training'|'tutorial', potions, matchId, onEnd, onHud, onLog, onTutorial } */
  KK.startFight = (opts) => {
    KK.stopDemo();
    const p = prep(opts.player, 2, 1, true);
    const e = prep(opts.foe, opts.kind === 'tutorial' ? 6 : 7, -1, false);
    e.matchId = opts.matchId;
    C = {
      p, e, kind: opts.kind, busy: false, over: false, crowd: 2, turn: 1,
      potions: opts.potions, potUsed: 0, forceBlock: false,
      onEnd: opts.onEnd, onHud: opts.onHud, onLog: opts.onLog, onTutorial: opts.onTutorial,
      tut: opts.kind === 'tutorial' ? { step: 0, allowed: null, pendingBlock: false } : null,
    };
    S.fighters = [e, p]; S.texts = []; S.parts = []; S.top = p; S.dark = 0;
    bubbles.length = 0;
    floatText(W / 2, 80, 'DÖVÜŞ BAŞLASIN!', '#e8b04f');
    S.excite = 1; KK.sfx('horn');
    syncTutorial();
    hud();
    return C;
  };
  KK.endFight = () => { C = null; };
})(window.KK);

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

  /* arena arka planı: her arenanın kendi görseli */
  const bgCache = {};
  let BG = null;
  KK.setArenaBg = (src) => {
    if (!src) return;
    if (bgCache[src]) { BG = bgCache[src]; return; }
    const img = new Image();
    img.onload = () => { bgCache[src] = img; BG = img; };
    img.src = src;
  };

  function floatText(x, y, txt, col) { S.texts.push({ x, y, txt, col, t0: performance.now(), life: 1100 }); }
  function burst(x, y, col, n, spd = 1.6) {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, v = rnd() * spd + 0.4;
      S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.8, life: 1, col });
    }
  }
  const bubbles = [];
  function bubble(f, txt, ms) { bubbles.push({ f, txt, until: performance.now() + (ms || 1800) }); }

  const spriteKeyFor = (f) => (f.isPlayer ? 'oyuncu' : f.sprite || f.style);

  function render(now) {
    const t = now / 1000;
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    ctx.save();
    if (S.shake > 0.4 && !reduced) ctx.translate(Math.round((rnd() - 0.5) * S.shake), Math.round((rnd() - 0.5) * S.shake));
    S.shake *= 0.85;
    if (BG) {
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(BG, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#2a1c17'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c49a62'; ctx.fillRect(0, 134, W, H - 134);
    }
    ctx.imageSmoothingEnabled = false;
    const list = S.fighters.slice().sort((a, b) => (a === S.top ? 1 : 0) - (b === S.top ? 1 : 0));
    for (const f of list) {
      f.r.hurt *= 0.9;
      KK.drawFighter(ctx, f, f.r.x, GROUND, f.facing, f.r, t, spriteKeyFor(f));
    }
    S.parts = S.parts.filter((p) => p.life > 0);
    for (const p of S.parts) {
      p.x += p.vx; p.y += p.vy; p.vy += p.g == null ? 0.12 : p.g; p.life -= 0.03;
      if (p.y > GROUND + 1) { p.y = GROUND + 1; p.vx *= 0.4; p.vy = 0; }
      ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w || 1, 1);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].until < now) bubbles.splice(i, 1);
    ctx.font = '8px "Pixelify Sans", monospace';
    ctx.textBaseline = 'middle';
    for (const b of bubbles) {
      const tw = Math.min(200, Math.ceil(ctx.measureText(b.txt).width));
      const bw = tw + 8, bh = 12;
      const bx = Math.round(clamp(b.f.r.x - bw / 2, 3, W - bw - 3)), by = GROUND - 72;
      ctx.fillStyle = '#efdcb8'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#120c0a'; ctx.fillRect(bx, by + bh, bw, 1);
      ctx.fillStyle = '#efdcb8'; ctx.fillRect(Math.round(b.f.r.x) - 1, by + bh, 3, 3);
      ctx.fillStyle = '#120c0a'; ctx.textAlign = 'left'; ctx.fillText(b.txt, bx + 4, by + 6.5, 200);
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
  KK.startRender = () => { KK.setArenaBg(KK.DEFAULT_ARENA_BG); requestAnimationFrame(render); };

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
  KK.showDemo = () => {};
  KK.stopDemo = () => {};

  /* ---------- dövüş ---------- */
  const ATK = {
    quick: { n: 'Hızlı saldırı', en: 6, acc: 0.15, mul: 0.6, dur: 240 },
    normal: { n: 'Normal saldırı', en: 12, acc: 0, mul: 1, dur: 340 },
    power: { n: 'Güçlü saldırı', en: 24, acc: -0.2, mul: 1.8, dur: 500 },
    cift: { n: 'Çift hançer darbesi', en: 10, acc: 0.1, mul: 0.55, dur: 200 },
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
    f.buf = { gk: 0, dd: 0, ke: 0, dev: 0, ol: false, vahsi: false, zk: false, shield: 0, fresh: false };
    f.stunned = false;
    f.r = idleR(); f.r.x = slotX(slot);
    return f;
  }
  const dist = () => Math.abs(C.p.slot - C.e.slot);
  const wtype = (f) => KK.WEAPON_TYPES[f.d.wtype];
  function atkCost(f, id) {
    const base = ATK[id].en + wtype(f).extraEn;
    return f.buf && f.buf.vahsi ? base * 2 : base;
  }
  KK.atkCost = atkCost;

  function canDo(f, o, id) {
    const d = Math.abs(f.slot - o.slot);
    if (f.isPlayer && C.tut && C.tut.allowed && !C.tut.allowed.includes(id)) return false;
    if (id.startsWith('pot:')) {
      if (!f.isPlayer || !C.potions) return false;
      return C.potUsed < KK.MAX_POTIONS_PER_FIGHT && (C.potions[id.slice(4)] || 0) > 0;
    }
    switch (id) {
      case 'fwd': return d > 1;
      case 'back': return f.facing > 0 ? f.slot > 0 : f.slot < SLOTS - 1;
      case 'quick': case 'normal': case 'power': return d <= f.d.range && f.en >= atkCost(f, id);
      case 'cift': return d <= 1 && f.en >= atkCost(f, id);
      case 'taunt': return f.en >= TAUNT_EN;
      case 'rest': return true;
    }
    return false;
  }
  KK.canDo = (id) => C && canDo(C.p, C.e, id);

  function hitChance(a, t, A) {
    return clamp(0.62 + (a.d.atk - t.d.agi) * 0.025 + A.acc + wtype(a).acc, 0.1, 0.95);
  }
  function reduction(a, t) {
    const pierce = a.buf && a.buf.zk ? 0.25 : 1;
    const def = t.d.def + (t.buf && t.buf.dev > 0 ? 5 : 0);
    return 100 / (100 + t.d.armor * 1.8 * pierce + def * 2 * pierce);
  }
  function dmgMul(a, t, A) {
    let m = A.mul * wtype(a).mul;
    if (wtype(a).nearMul && Math.abs(a.slot - t.slot) <= 1) m *= wtype(a).nearMul;
    if (a.buf && a.buf.gk > 0) m *= 1.3;
    if (t.buf && t.buf.dd > 0) m *= 0.7;
    return m;
  }
  function dmgRange(a, t, A) {
    const red = reduction(a, t), m = dmgMul(a, t, A);
    const f = (w) => Math.max(1, Math.round((w + a.d.str * 1.1) * m * red));
    return [f(a.d.wmin), f(a.d.wmax)];
  }
  KK.preview = (id) => {
    if (!C) return null;
    const A = ATK[id];
    if (!A) return null;
    return { hit: hitChance(C.p, C.e, A), dmg: dmgRange(C.p, C.e, A), en: atkCost(C.p, id) };
  };
  KK.tauntChance = () => (C ? clamp(0.45 + (C.p.d.cha - C.e.d.cha) * 0.04, 0.1, 0.9) : 0);

  function textAbove(f, txt, col) { floatText(f.r.x, GROUND - 56, txt, col); }
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
    const bx = a.r.x, dir = a.facing, d = Math.abs(a.slot - t.slot);
    if (wtype(a).ranged && d > 1) {
      KK.sfx('bow');
      await tween(reduced ? 120 : 260, (k) => { a.r.taunt = Math.sin(k * Math.PI) * 0.5; });
      a.r.taunt = 0;
      const y = GROUND - 30, x0 = a.r.x + dir * 10, x1 = t.r.x;
      await tween(reduced ? 100 : 180 + d * 40, (k) => {
        S.parts.push({ x: lerp(x0, x1, k), y, vx: 0, vy: 0, g: 0, life: 0.12, col: '#e8dcc0', w: 3 });
      });
      resolveAttack(a, t, A, id);
      return;
    }
    const reach = d > 1 ? 8 + (d - 1) * 14 : 8;
    KK.sfx('swing');
    await tween(reduced ? 120 : A.dur, (k) => { a.r.strike = k; a.r.x = bx + dir * Math.sin(k * Math.PI / 2) * reach; });
    resolveAttack(a, t, A, id);
    await tween(reduced ? 100 : 220, (k) => { a.r.recover = k; a.r.x = bx + dir * reach * (1 - k); });
    a.r.strike = 0; a.r.recover = 0; a.r.x = bx;
  }

  function applyDamage(a, t, dmg) {
    if (t.buf.shield > 0) {
      const ab = Math.min(t.buf.shield, dmg);
      t.buf.shield -= ab; dmg -= ab;
      if (ab) floatText(t.r.x, GROUND - 66, `KALKAN -${ab}`, '#8fd0ff');
    }
    const floor = C.kind === 'tutorial' && t.isPlayer ? 1 : 0;
    if (t.hp - dmg <= 0 && t.buf.ol) {
      t.buf.ol = false; t.hp = 1;
      textAbove(t, 'ÖLÜMSÜZ!', '#ffe08a'); burst(t.r.x, GROUND - 30, '#ffe08a', 16, 2);
      log(t.isPlayer ? 'Ölümsüzlük İksiri seni ölümden döndürdü!' : `${t.name} ölümden döndü!`);
      return dmg;
    }
    t.hp = Math.max(floor, t.hp - dmg);
    return dmg;
  }

  function resolveAttack(a, t, A, id) {
    const hx = t.r.x, hy = GROUND - 26;
    const name = a.isPlayer ? 'Sen' : a.name;
    const wt = wtype(a);
    if (!C.forceBlock && rnd() > hitChance(a, t, A)) {
      textAbove(t, 'ISKA', '#a88f70'); KK.sfx('miss');
      tween(260, (k) => { t.r.kb = Math.sin(k * Math.PI) * 4; }).then(() => { t.r.kb = 0; });
      log(a.isPlayer ? `${A.n} boşa gitti.` : `${a.name} ıskaladı.`);
      return;
    }
    let pierced = false;
    if (C.forceBlock || rnd() < t.d.block) {
      if (!C.forceBlock && wt.pierce && rnd() < wt.pierce) pierced = true;
      else {
        textAbove(t, 'BLOK', '#e8b04f'); KK.sfx('clang');
        burst(hx + t.facing * 7, hy + 2, '#ffe08a', 8); S.shake = 2;
        log(a.isPlayer ? `${t.name} kalkanıyla savuşturdu.` : 'Kalkanın darbeyi kendiliğinden karşıladı.');
        return;
      }
    }
    let raw = (ri(a.d.wmin, a.d.wmax) + a.d.str * 1.1) * dmgMul(a, t, A);
    const crit = rnd() < a.d.crit;
    if (crit) raw *= 1.6;
    if (C.kind === 'tutorial' && !a.isPlayer) raw *= 0.4;
    let dmg = Math.max(1, Math.round(raw * reduction(a, t)));
    dmg = applyDamage(a, t, dmg);
    t.r.hurt = 1;
    tween(240, (k) => { t.r.kb = Math.sin(k * Math.PI) * (crit ? 5 : 3); }).then(() => { t.r.kb = 0; });
    burst(hx, hy, '#a3231d', crit ? 16 : 8, crit ? 2.2 : 1.6);
    S.shake = crit ? 5 : 2.5;
    textAbove(t, crit ? `KRİTİK -${dmg}` : `-${dmg}`, crit ? '#ff6a4d' : '#efdcb8');
    KK.sfx(crit ? 'crit' : 'hit');
    if (pierced) { floatText(t.r.x, GROUND - 66, 'KALKANI DELDİ', '#e8b04f'); }
    if (a.buf.ke > 0 && dmg > 0) {
      const heal = Math.min(a.d.maxHp - a.hp, Math.round(dmg * 0.4));
      if (heal > 0) { a.hp += heal; floatText(a.r.x, GROUND - 66, `+${heal}`, '#7fbf5a'); }
    }
    if (wt.stun && t.hp > 0 && rnd() < wt.stun) {
      t.stunned = true;
      floatText(t.r.x, GROUND - 76, 'SERSEMLEDİ', '#c9a0ff');
    }
    if (a.isPlayer) {
      if (crit || id === 'power') { crowd(1); KK.sfx('cheer'); }
      log(`${A.n} ile ${dmg} hasar verdin${crit ? ' (kritik!)' : ''}${pierced ? ', balta kalkanı deldi' : ''}${t.stunned ? ', rakip sersemledi' : ''}.`);
    } else {
      if (crit) crowd(-1);
      log(`${name}: ${A.n.toLowerCase()}, ${dmg} hasar${crit ? ' (kritik!)' : ''}${t.stunned ? ', sersemledin' : ''}.`);
    }
  }

  function drinkPotion(a, id) {
    const pt = KK.potion(id), b = a.buf;
    C.potions[id]--; C.potUsed++;
    if (C.onPotionUsed) C.onPotionUsed(id);
    KK.sfx('potion');
    let msg = `${pt.n} içtin.`;
    switch (id) {
      case 'can': { const g = Math.min(a.d.maxHp - a.hp, Math.round(a.d.maxHp * 0.35)); a.hp += g; textAbove(a, `+${g} CAN`, '#7fbf5a'); msg = `Can İksiri içtin, ${g} can kazandın.`; break; }
      case 'enerji': { const g = Math.min(a.d.maxEn - a.en, Math.round(a.d.maxEn * 0.5)); a.en += g; textAbove(a, `+${g} EN`, '#d9a52b'); msg = `Enerji İksiri içtin, ${g} enerji kazandın.`; break; }
      case 'gladyator': b.gk = 3; b.fresh = true; textAbove(a, 'GÜÇ +%30', '#ff8a5a'); break;
      case 'demirderi': b.dd = 3; b.fresh = true; textAbove(a, 'DEMİR DERİ', '#b9bec4'); break;
      case 'kanemici': b.ke = 3; b.fresh = true; textAbove(a, 'KAN EMİCİ', '#d33a2c'); break;
      case 'olumsuzluk': b.ol = true; textAbove(a, 'ÖLÜMSÜZLÜK', '#ffe08a'); break;
      case 'devkani': {
        if (b.dev <= 0) { const add = Math.round(a.d.maxHp * 0.25); a.d.maxHp += add; a.hp += add; a.devAdd = add; }
        b.dev = 4; b.fresh = true; textAbove(a, 'DEV KANI', '#ff8a5a'); break;
      }
      case 'vahsikan': b.vahsi = true; textAbove(a, 'VAHŞİ KAN', '#d33a2c'); break;
      case 'zirhkiran': b.zk = true; textAbove(a, 'ZIRH KIRAN', '#c9a0ff'); break;
      case 'muhafiz': { const s2 = 25 + a.lvl * 3; b.shield += s2; textAbove(a, `KALKAN +${s2}`, '#8fd0ff'); break; }
    }
    burst(a.r.x, GROUND - 30, '#e8dcc0', 10, 1);
    log(msg);
  }

  function tickBuffs(f) {
    const b = f.buf;
    if (b.fresh) { b.fresh = false; return; }
    ['gk', 'dd', 'ke'].forEach((k) => { if (b[k] > 0) b[k]--; });
    if (b.dev > 0) {
      b.dev--;
      if (b.dev === 0 && f.devAdd) { f.d.maxHp -= f.devAdd; f.hp = Math.min(f.hp, f.d.maxHp); f.devAdd = 0; }
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
      const twice = id === 'cift' || a.buf.vahsi;
      if (a.buf.vahsi) { a.buf.vahsi = false; textAbove(a, 'VAHŞİ KAN!', '#d33a2c'); }
      await strike(a, t, id);
      if (twice && t.hp > 0) await strike(a, t, id);
      a.buf.zk = false;
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
    } else if (id.startsWith('pot:')) {
      drinkPotion(a, id.slice(4));
      await wait(reduced ? 150 : 450);
    } else if (id === 'wait') {
      log(`${a.name} bekliyor.`);
      await wait(reduced ? 100 : 300);
    }
    if (id !== 'rest' && id !== 'pot:enerji') a.en = Math.min(a.d.maxEn, a.en + 4);
    tickBuffs(a);
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
      if (d === 2 && can('back') && rnd() < 0.35) return 'back';
      if (d > me.d.range) return 'fwd';
      if (enR < 0.25) return 'rest';
      const o = [];
      if (can('normal')) o.push(['normal', 3]);
      if (can('power')) o.push(['power', fh < 0.3 ? 3 : 1]);
      if (can('quick')) o.push(['quick', 1.5]);
      return o.length ? weighted(o) : 'rest';
    }
    if (d > me.d.range) {
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
    { text: 'Rakibe yaklaş. Kılıçla saldırmak için ona bitişik olmalısın. İlerle’ye bas.', allowed: ['fwd'], done: () => dist() <= 1 },
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
    if (C.e.stunned) {
      C.e.stunned = false;
      textAbove(C.e, 'SERSEM', '#c9a0ff');
      log(`${C.e.name} sersemledi, bu turu kaçırdı.`);
      await wait(reduced ? 150 : 500);
      tickBuffs(C.e); hud();
      return;
    }
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
    while (C.p.stunned) {
      C.p.stunned = false;
      textAbove(C.p, 'SERSEM', '#c9a0ff');
      log('Sersemledin, bu turu kaçırdın.');
      await wait(reduced ? 150 : 600);
      tickBuffs(C.p);
      await enemyTurn();
      if (await checkEnd()) return;
    }
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

  /* opts: { player, foe, kind: 'story'|'training'|'tutorial', potions, bg, onEnd, onHud, onLog, onTutorial, onPotionUsed } */
  KK.startFight = (opts) => {
    const p = prep(opts.player, 2, 1, true);
    const e = prep(opts.foe, opts.kind === 'tutorial' ? 6 : 7, -1, false);
    KK.setArenaBg(opts.bg || KK.DEFAULT_ARENA_BG);
    C = {
      p, e, kind: opts.kind, busy: false, over: false, crowd: 2, turn: 1,
      potions: opts.potions, potUsed: 0, forceBlock: false,
      onEnd: opts.onEnd, onHud: opts.onHud, onLog: opts.onLog, onTutorial: opts.onTutorial, onPotionUsed: opts.onPotionUsed,
      tut: opts.kind === 'tutorial' ? { step: 0, allowed: null, pendingBlock: false } : null,
    };
    S.fighters = [e, p]; S.texts = []; S.parts = []; S.top = p; S.dark = 0;
    bubbles.length = 0;
    floatText(W / 2, 80, 'DÖVÜŞ BAŞLASIN!', '#e8b04f');
    if (e.intro) bubble(e, e.intro, 3600);
    S.excite = 1; KK.sfx('horn');
    syncTutorial();
    hud();
    return C;
  };
  KK.endFight = () => { C = null; };
})(window.KK);

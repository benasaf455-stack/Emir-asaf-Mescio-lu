/* Kılıç ve Kalkan: görseller.
   PixelLab'den gelen sprite sayfaları SPRITE_DEFS'e eklenir.
   Dosya yoksa ya da yüklenemezse karakterler basit piksel yer tutucularla çizilir. */
window.KK = window.KK || {};
(function (KK) {
  'use strict';

  /* Her animasyon ayrı bir PNG dosyasıdır; kareler soldan sağa yan yana dizilir.
     Karakter sağa bakar. Örnek (dosyalar eklenince yorumu kaldır):
     oyuncu: {
       fw: 64, fh: 64, foot: 4,
       anims: {
         idle:   { src: 'assets/sprites/oyuncu/idle.png',   frames: 4, fps: 6 },
         walk:   { src: 'assets/sprites/oyuncu/walk.png',   frames: 6, fps: 10 },
         attack: { src: 'assets/sprites/oyuncu/attack.png', frames: 6, fps: 14 },
         hurt:   { src: 'assets/sprites/oyuncu/hurt.png',   frames: 2, fps: 8 },
         death:  { src: 'assets/sprites/oyuncu/death.png',  frames: 4, fps: 8 },
       },
     },
     fw/fh: bir karenin genişliği ve yüksekliği. foot: karenin altından ayaklara kadar boş piksel.
     scale: kaynak pikselin arenada kaç birim çizileceği (arena 384×216 birimdir; karakter ~48 birim boyunda olmalı).
     smooth: küçültürken yumuşatma (ayrıntılı, büyük kaynak görseller için).
     Tek kareli bir sprite'a nefes alma, saldırıda öne eğilme, darbe alınca yanıp sönme ve düşme hareketleri kodla verilir.
     Anahtarlar: 'oyuncu', tarz adları (dengeli, savunmaci, hancerci, tokmakci, okcu)
     ve özel rakipler için maç kimliği (ör. 'a1m7'). Yalnızca idle zorunludur. */
  const one = (key, w, h) => ({
    fw: w, fh: h, foot: 4, scale: 0.22, smooth: true,
    anims: { idle: { src: `assets/sprites/${key}/idle.png`, frames: 1, fps: 1 } },
  });
  KK.SPRITE_DEFS = {
    oyuncu: one('oyuncu', 136, 228),
    rakip1: one('rakip1', 103, 200),
    rakip2: one('rakip2', 139, 228),
    rakip3: one('rakip3', 129, 191),
    rakip4: one('rakip4', 115, 223),
    rakip5: one('rakip5', 131, 204),
    varro: one('varro', 147, 230),
    tiberius: one('tiberius', 187, 246),
    tullus: one('tullus', 137, 230),
    livia: one('livia', 147, 212),
    livia_maske: one('livia_maske', 149, 211),
  };

  const images = {};
  KK.loadSprites = () => {
    Object.entries(KK.SPRITE_DEFS).forEach(([key, def]) => {
      Object.entries(def.anims).forEach(([anim, a]) => {
        const img = new Image();
        img.onload = () => { images[key + '/' + anim] = img; if (KK.onSpriteLoad) KK.onSpriteLoad(key); };
        img.src = a.src;
      });
    });
  };

  KK.spriteImage = (key) => images[key + '/idle'] || null;

  /* Sprite varsa çizer ve true döner. anim: idle | walk | attack | hurt | death
     r: dövüşçünün poz bilgisi (tek kareli sprite'lara hareket vermek için) */
  KK.drawSprite = (ctx, key, anim, time, x, y, facing, r) => {
    const def = KK.SPRITE_DEFS[key];
    if (!def) return false;
    if (!images[key + '/' + anim]) anim = 'idle';
    const img = images[key + '/' + anim], a = def.anims[anim];
    if (!img || !a) return false;
    r = r || {};
    let fr = Math.floor(time * a.fps);
    fr = anim === 'death' ? Math.min(a.frames - 1, fr) : fr % a.frames;
    const sc = def.scale || 1, dw = def.fw * sc, dh = def.fh * sc, foot = (def.foot || 0) * sc;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,20,8,.45)';
    ctx.beginPath(); ctx.ellipse(0, 0.5, dw * 0.34 + (r.fall || 0) * dw * 0.4, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    if (r.fall > 0) { ctx.translate(-facing * r.fall * 6, 0); ctx.rotate(-facing * r.fall * 1.45); }
    if (a.frames === 1) {
      let lean = 0;
      if (r.strike > 0) {
        lean = r.strike < 0.4 ? -0.1 * (r.strike / 0.4) : -0.1 + 0.26 * ((r.strike - 0.4) / 0.6);
        if (r.recover > 0) lean *= 1 - r.recover;
      }
      if (r.taunt > 0) lean = -0.08 * r.taunt;
      ctx.rotate(facing * lean);
      if (r.walk > 0) ctx.translate(0, -Math.abs(Math.sin(r.walk)) * 1.5);
      if (!r.fall) ctx.scale(1, 1 + Math.sin(time * 2.2 + (r.x || 0)) * 0.012);
    }
    if (!def.noFlip) ctx.scale(facing, 1);
    if (r.hurt > 0.3 && Math.floor(time * 20) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.imageSmoothingEnabled = !!def.smooth;
    if (def.smooth) ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, fr * def.fw, 0, def.fw, def.fh, -dw / 2, -dh + foot, dw, dh);
    ctx.restore();
    return true;
  };

  /* ---------- sahne görselleri ---------- */
  const sceneImgs = {};
  KK.sceneImage = (key, onReady) => {
    if (key in sceneImgs) return sceneImgs[key];
    sceneImgs[key] = null;
    const img = new Image();
    img.onload = () => { sceneImgs[key] = img; if (onReady) onReady(); };
    img.src = `assets/sahneler/${key}.png`;
    return null;
  };

  /* ---------- piksel yer tutucu karakter ---------- */
  const METAL = ['#8a6a44', '#b88a3e', '#b9bec4', '#c98b3c', '#9aa3ad', '#e0b54d'];
  const SERIES_COL = {
    hafif: ['#6d4a2c', '#7b5331', '#5b3d25', '#3f2c20', '#2c2430'],
    dengeli: ['#9b7c4c', '#a48a52', '#8d949b', '#c98b3c', '#b3302e'],
    agir: ['#6f747a', '#8d949b', '#b9bec4', '#9aa3ad', '#d4d8dc'],
  };
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
    return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  function px(ctx, x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function pline(ctx, x0, y0, x1, y1, col, th) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    ctx.fillStyle = col;
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * (i / n), y = y0 + (y1 - y0) * (i / n);
      ctx.fillRect(Math.round(x - th / 2), Math.round(y - th / 2), th, th);
    }
  }
  KK.pline = pline;

  /* f: { look, equip, isPlayer }  r: poz bilgisi (walk, strike, hurt, fall, taunt, kb, hop) */
  KK.drawFighter = (ctx, f, x, y, facing, r, time, spriteKey) => {
    if (spriteKey) {
      let anim = 'idle';
      if (r.fall > 0) anim = 'death';
      else if (r.hurt > 0.4) anim = 'hurt';
      else if (r.strike > 0) anim = 'attack';
      else if (r.walk > 0) anim = 'walk';
      if (KK.drawSprite(ctx, spriteKey, anim, time, x - facing * r.kb, y - r.hop, facing, r)) return;
    }
    const L = f.look, e = f.equip;
    const skin = r.hurt > 0.3 ? '#e0584a' : L.skin;
    const tunic = L.tunic || KK.PLAYER_TUNIC;
    const armor = KK.item(e.zirh), helm = KK.item(e.migfer), shield = KK.item(e.kalkan), weapon = KK.item(e.silah) || KK.item('kilic_1');

    ctx.save();
    ctx.translate(Math.round(x - facing * r.kb), Math.round(y - r.hop));
    px(ctx, -8, 0, 16, 2, 'rgba(40,20,8,.45)');
    if (r.fall > 0) { ctx.translate(-facing * r.fall * 4, 0); ctx.rotate(-facing * r.fall * 1.5); }
    ctx.scale(facing, 1);

    // bacaklar
    const sw = Math.round(Math.sin(r.walk) * 2);
    px(ctx, -4 + sw, -12, 3, 11, shade(skin, -0.2));
    px(ctx, 1 - sw, -12, 3, 11, skin);
    px(ctx, -5 + sw, -1, 5, 1, '#3a2414');
    px(ctx, 0 - sw, -1, 5, 1, '#3a2414');
    if (armor && armor.series !== 'hafif' && armor.tier >= 3) {
      const gc = SERIES_COL[armor.series][armor.tier - 1];
      px(ctx, -4 + sw, -7, 3, 4, shade(gc, -0.2)); px(ctx, 1 - sw, -7, 3, 4, gc);
    }

    const breath = Math.round(Math.sin(time * 2.2 + (f.isPlayer ? 0 : 1.7)) * 0.6);
    ctx.translate(0, breath - Math.round(r.taunt * 2));
    // etek ve gövde
    px(ctx, -6, -17, 12, 6, shade(tunic, -0.25));
    px(ctx, -5, -29, 10, 12, tunic);
    if (armor) {
      const ac = SERIES_COL[armor.series][armor.tier - 1];
      px(ctx, -5, -29, 10, 10, ac);
      px(ctx, -5, -29, 10, 1, shade(ac, 0.25));
      if (armor.series === 'agir') for (let yy = -26; yy < -19; yy += 2) px(ctx, -5, yy, 10, 1, shade(ac, -0.3));
      if (armor.series === 'dengeli' && armor.tier >= 2) for (let yy = -27; yy < -19; yy += 2) for (let xx = -4 + (yy & 1); xx < 5; xx += 2) px(ctx, xx, yy, 1, 1, shade(ac, -0.25));
      px(ctx, -7, -29, 3, 3, shade(ac, -0.1));
    }
    px(ctx, -5, -18, 10, 1, '#3a2414');
    px(ctx, 2, -18, 2, 1, '#c98b3c');

    // kafa
    px(ctx, -1, -31, 3, 2, skin);
    px(ctx, -3, -38, 7, 7, skin);
    px(ctx, 2, -36, 1, 1, '#1b120b');
    px(ctx, 4, -35, 1, 2, shade(skin, -0.15));
    if (L.beard === 'kisa') { px(ctx, -2, -32, 6, 1, L.hair); px(ctx, 1, -33, 3, 1, L.hair); }
    if (L.beard === 'uzun') { px(ctx, -2, -33, 6, 3, L.hair); px(ctx, 0, -30, 3, 1, L.hair); }
    if (L.scar === 'yanak') { px(ctx, 1, -34, 1, 1, '#8c2a22'); px(ctx, 2, -33, 1, 1, '#8c2a22'); }
    if (L.scar === 'goz') { px(ctx, 2, -38, 1, 1, '#8c2a22'); px(ctx, 2, -35, 1, 1, '#8c2a22'); }
    if (!helm) {
      px(ctx, -3, -39, 7, 2, L.hair); px(ctx, -4, -38, 2, 5, L.hair);
    } else {
      const hc = SERIES_COL[helm.series][helm.tier - 1];
      if (helm.series === 'hafif') { px(ctx, -3, -40, 7, 3, hc); px(ctx, -4, -38, 2, 4, hc); }
      else if (helm.series === 'dengeli') {
        px(ctx, -4, -41, 8, 4, hc); px(ctx, -4, -37, 2, 5, hc); px(ctx, 3, -37, 2, 3, hc);
        px(ctx, -4, -41, 8, 1, shade(hc, 0.3));
        if (helm.tier >= 3) { px(ctx, -3, -43, 6, 2, '#a3231d'); px(ctx, -2, -44, 4, 1, '#d33a2c'); }
      } else {
        px(ctx, -4, -41, 9, 10, hc); px(ctx, 1, -37, 4, 1, '#120c0a'); px(ctx, 1, -35, 4, 1, '#120c0a');
        px(ctx, -4, -41, 9, 1, shade(hc, 0.3));
        if (helm.tier >= 4) { px(ctx, -2, -44, 5, 3, hc); }
      }
    }

    // silah kolu
    let a = -0.5, w = -1.3;
    if (r.taunt > 0) { a += (-2.9 - a) * r.taunt; w += (-1.75 - w) * r.taunt; }
    if (r.strike > 0) {
      const s = r.strike, ez = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      if (s < 0.4) { const t = ez(s / 0.4); a = -0.5 + (-2.4 + 0.5) * t; w = -1.3 + (-2.6 + 1.3) * t; }
      else { const t = ez((s - 0.4) / 0.6); a = -2.4 + (1.5 - Math.PI * 2 + 2.4) * t; w = -2.6 + (0.15 + 2.6) * t; }
      if (r.recover > 0) { const t = r.recover; a += (-0.5 - Math.PI * 2 - a) * t; w += (-1.3 - w) * t; }
    }
    const shx = -2, shy = -27, hx = shx + Math.sin(a) * 9, hy = shy + Math.cos(a) * 9;
    pline(ctx, shx, shy, hx, hy, skin, 2);
    const wl = { kilic: 12, hancer: 7, tokmak: 11, balta: 11, mizrak: 16, yay: 8 }[weapon.type] || 10;
    const wc = weapon.tier === 0 && weapon.type !== 'hancer' ? METAL[0] : METAL[Math.min(5, weapon.tier + 2)];
    const ex = hx + Math.cos(w) * wl, ey = hy + Math.sin(w) * wl;
    pline(ctx, hx - Math.cos(w) * 2, hy - Math.sin(w) * 2, hx, hy, '#4a2e1a', 1);
    pline(ctx, hx, hy, ex, ey, wc, weapon.type === 'tokmak' ? 2 : 1);
    if (weapon.type === 'tokmak') px(ctx, ex - 2, ey - 2, 4, 4, shade(wc, -0.1));
    if (weapon.type === 'kilic') px(ctx, hx - 1, hy - 1, 2, 2, '#6b4a2a');
    if (f.bow) {
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1;
      pline(ctx, 7, -34, 9, -27, '#8a5a2a', 1); pline(ctx, 9, -27, 7, -20, '#8a5a2a', 1);
      pline(ctx, 7, -34, 7, -20, '#d8c9a8', 1);
    }

    // kalkan kolu
    pline(ctx, 2, -27, 6, -22, shade(skin, -0.05), 2);
    if (shield) {
      const sc = SERIES_COL[shield.series][shield.tier - 1];
      if (shield.series === 'hafif') { px(ctx, 5, -26, 5, 5, sc); px(ctx, 7, -24, 1, 1, '#c98b3c'); }
      else if (shield.series === 'dengeli') { px(ctx, 5, -28, 6, 9, sc); px(ctx, 5, -28, 6, 1, shade(sc, 0.3)); px(ctx, 7, -25, 2, 2, '#e0b54d'); }
      else { px(ctx, 5, -31, 7, 15, sc); px(ctx, 5, -31, 7, 1, shade(sc, 0.3)); px(ctx, 5, -31, 1, 15, shade(sc, -0.3)); px(ctx, 8, -25, 2, 2, '#e0b54d'); }
    } else if (!f.bow) {
      px(ctx, 5, -23, 2, 2, skin);
    }
    ctx.restore();
  };
})(window.KK);

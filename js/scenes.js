/* Kılıç ve Kalkan: hikâye sahneleri (resimli paneller). */
window.KK = window.KK || {};
(function (KK) {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const PW = 320, PH = 180;

  /* sahne resmi yoksa: arka plan + karakter görselleriyle kurulan sahne */
  const bgs = {};
  const loadBg = (key, src, cb) => {
    if (bgs[key]) return bgs[key];
    bgs[key] = null;
    const img = new Image(); img.onload = () => { bgs[key] = img; if (cb) cb(); }; img.src = src;
    return null;
  };
  function drawBg(ctx, kind, redraw) {
    const city = loadBg('sehir', 'assets/arayuz/sehir.webp', redraw);
    const arena = loadBg('arena', KK.DEFAULT_ARENA_BG, redraw);
    ctx.fillStyle = '#120c0a'; ctx.fillRect(0, 0, PW, PH);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (kind === 'sehir' && city) ctx.drawImage(city, 400, 120, 1156, 650, 0, 0, PW, PH);
    else if (kind !== 'sehir' && arena) ctx.drawImage(arena, 0, 0, 1672, 941, 0, 0, PW, PH);
    if (kind === 'karanlik') { ctx.fillStyle = 'rgba(8,4,10,.72)'; ctx.fillRect(0, 0, PW, PH); }
    if (kind === 'ani') { ctx.fillStyle = 'rgba(90,20,15,.55)'; ctx.fillRect(0, 0, PW, PH); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, PW, PH); }
  }
  function drawChar(ctx, key, xFrac, facing, shadow) {
    const img = KK.spriteImage(key);
    if (!img) return;
    const hgt = 120, s = hgt / img.height, w = img.width * s, x = xFrac * PW, y = PH - 8;
    const off = document.createElement('canvas'); off.width = Math.ceil(w); off.height = hgt;
    const o = off.getContext('2d'); o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'high';
    if (facing < 0) { o.translate(w, 0); o.scale(-1, 1); }
    o.drawImage(img, 0, 0, w, hgt);
    if (shadow) { o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-atop'; o.fillStyle = 'rgba(10,6,8,.92)'; o.fillRect(0, 0, off.width, hgt); }
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.32, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(off, x - w / 2, y - hgt + 2);
  }
  function composed(ctx, panel, redraw) {
    drawBg(ctx, panel.bg || 'arena', redraw);
    (panel.chars || []).forEach(([key, x, facing, shadow]) => drawChar(ctx, key, x, facing || 1, shadow));
    const g = ctx.createRadialGradient(PW / 2, PH / 2, PH * 0.35, PW / 2, PH / 2, PW * 0.65);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, PW, PH);
  }

  let active = null;
  KK.playScene = (id, name) => new Promise((resolve) => {
    const scene = KK.SCENES[id];
    if (!scene) { resolve(); return; }
    const el = $('#scene'), cv = $('#sceneCanvas'), ctx = cv.getContext('2d');
    let i = 0;
    const fill = (s) => (s || '').replace(/\{ad\}/g, name || '');
    const draw = () => {
      const p = scene.panels[i];
      const again = () => { if (active && scene.panels[i] === p) draw(); };
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      const img = KK.sceneImage(p.img, again);
      if (img) ctx.drawImage(img, 0, 0, PW, PH); else composed(ctx, p, again);
      $('#sceneTitle').textContent = scene.title;
      $('#sceneCount').textContent = `${i + 1} / ${scene.panels.length}`;
      $('#sceneSpeaker').textContent = fill(p.speaker);
      $('#sceneSpeaker').hidden = !p.speaker;
      $('#sceneText').textContent = fill(p.text);
      $('#sceneNext').textContent = i === scene.panels.length - 1 ? 'Devam' : 'İleri';
    };
    const finish = () => {
      el.hidden = true;
      document.removeEventListener('keydown', onKey);
      active = null;
      resolve();
    };
    const next = () => { i++; if (i >= scene.panels.length) finish(); else draw(); };
    const onKey = (e) => {
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.code === 'Escape') { e.preventDefault(); finish(); }
    };
    $('#sceneNext').onclick = next;
    $('#sceneSkip').onclick = finish;
    cv.onclick = next;
    document.addEventListener('keydown', onKey);
    active = scene;
    el.hidden = false;
    draw();
    $('#sceneNext').focus();
  });
  KK.sceneActive = () => !!active;
})(window.KK);

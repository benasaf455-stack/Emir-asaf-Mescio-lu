/* Kılıç ve Kalkan: hikâye sahneleri (resimli paneller). */
window.KK = window.KK || {};
(function (KK) {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const PW = 320, PH = 180;

  function placeholder(ctx, panel, scene) {
    const bands = ['#0d0908', '#171010', '#1f1512', '#2a1c17'];
    bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * (PH / 4), PW, PH / 4); });
    const r = KK.seeded(panel.img || 'x');
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = r() < 0.5 ? '#2e1f19' : '#130c0a';
      ctx.fillRect(Math.floor(r() * PW), Math.floor(r() * PH), 2, 2);
    }
    ctx.fillStyle = '#c8842f'; ctx.fillRect(PW / 2 - 30, PH / 2 - 14, 60, 2);
    ctx.fillRect(PW / 2 - 30, PH / 2 + 12, 60, 2);
    ctx.font = '12px "Pixelify Sans", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8b04f'; ctx.fillText(scene.title.toLocaleUpperCase('tr'), PW / 2, PH / 2);
    ctx.font = '8px "Pixelify Sans", monospace';
    ctx.textAlign = 'left'; ctx.fillStyle = '#6f5a47';
    ctx.fillText(`Görsel yeri: assets/sahneler/${panel.img}.png`, 6, PH - 8);
  }

  let active = null;
  KK.playScene = (id, name) => new Promise((resolve) => {
    const scene = KK.SCENES[id];
    if (!scene) { resolve(); return; }
    const el = $('#scene'), cv = $('#sceneCanvas'), ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let i = 0;
    const fill = (s) => (s || '').replace(/\{ad\}/g, name || '');
    const draw = () => {
      const p = scene.panels[i];
      const img = KK.sceneImage(p.img, () => { if (active && scene.panels[i] === p) draw(); });
      if (img) ctx.drawImage(img, 0, 0, PW, PH); else placeholder(ctx, p, scene);
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

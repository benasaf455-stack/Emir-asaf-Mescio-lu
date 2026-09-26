/* Kılıç ve Kalkan: ekranlar, oyuncu kaydı ve oyun akışı. */
window.KK = window.KK || {};
(function (KK) {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const { clamp } = KK.util;
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el[k] = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : String(c)); });
    return el;
  };

  /* ---------- kayıt ---------- */
  let P = null;
  const save = () => { try { localStorage.setItem(KK.SAVE_KEY, JSON.stringify(P)); } catch (e) { /* kayıt yapılamadı */ } };
  const load = () => { try { const s = localStorage.getItem(KK.SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } };

  function newPlayer(name, look, stats, pts) {
    P = {
      v: 1, name, look, lvl: 1, xp: 0, pts, gold: KK.START_GOLD,
      stats: Object.assign({}, stats),
      owned: KK.START_OWNED.slice(), equip: Object.assign({}, KK.START_EQUIP),
      potions: { can: 1, enerji: 0 },
      prog: { tutorial: false, arena: 0, match: 0 },
      wins: 0, losses: 0, rescues: 0, trainCount: 0,
    };
    save();
  }
  const playerFighter = () => ({
    name: P.name, lvl: P.lvl, stats: P.stats, equip: P.equip,
    look: Object.assign({ tunic: KK.PLAYER_TUNIC }, P.look), isPlayer: true,
  });

  /* ---------- ekranlar ---------- */
  let screen = 'menu';
  function show(name) {
    screen = name;
    ['menu', 'create', 'city', 'fight'].forEach((s) => { $('#' + s).hidden = s !== name; });
    $('#stage').hidden = name !== 'fight';
    $('#hud').hidden = name !== 'fight';
    $('#chips').hidden = !(name === 'city' || name === 'fight');
    document.querySelector('.topbar').hidden = name === 'menu';
    chips();
    window.scrollTo(0, 0);
  }
  function chips() {
    if (!P) return;
    $('#cName').textContent = P.name;
    $('#cLvl').textContent = P.lvl;
    $('#cXp').textContent = `${P.xp}/${KK.xpNeed(P.lvl)}`;
    $('#cGold').textContent = P.gold;
  }

  function drawPortrait(canvas, f, facing, spriteKey) {
    const c = canvas.getContext('2d');
    c.setTransform(4, 0, 0, 4, 0, 0);
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#1a110d'; c.fillRect(0, 0, 80, 80);
    c.fillStyle = '#2a1c17'; c.fillRect(0, 60, 80, 20);
    c.fillStyle = '#c49a62'; c.fillRect(0, 68, 80, 12);
    c.fillStyle = '#8f6a42'; c.fillRect(0, 68, 80, 1);
    c.translate(40 - facing * 2, 75); c.scale(1.35, 1.35);
    KK.drawFighter(c, f, 0, 0, facing, KK.idleR(), 0, spriteKey);
  }

  /* ---------- menü ---------- */
  function goMenu() {
    KK.endFight();
    KK.stopDemo();
    show('menu');
    const s = load();
    $('#contBtn').disabled = !s;
    $('#contInfo').textContent = s ? `Kayıtlı oyun: ${s.name}, seviye ${s.lvl}` : '';
  }

  /* ---------- bilgi ve onay penceresi ---------- */
  function dialog(title, body, buttons) {
    $('#dTitle').textContent = title;
    const b = $('#dBody'); b.innerHTML = '';
    b.append(...body);
    const row = $('#dBtns'); row.innerHTML = '';
    const close = () => { $('#dialog').hidden = true; };
    buttons.forEach((o) => row.append(h('button', { class: 'btn' + (o.cls ? ' ' + o.cls : ''), type: 'button', onclick: () => { close(); if (o.onclick) o.onclick(); } }, o.label)));
    $('#dialog').hidden = false;
    row.lastChild.focus();
  }
  const HOW = [
    ['Amaç', 'Arenalarda dövüş, altın ve tecrübe kazan. Her arenanın şampiyonunu yenince sonraki arena açılır.'],
    ['Hareket', 'Saldırmak için rakibe bitişik olmalısın. İlerle (D) ve Geri Çekil (A) ile mesafeyi ayarla.'],
    ['Saldırılar', 'Hızlı (Q) az enerji harcar ve sık isabet eder. Normal (W) dengelidir. Güçlü (E) çok vurur ama sık ıskalar.'],
    ['Savunma ve enerji', 'Kalkanın ve zırhın darbeleri kendiliğinden karşılar. Her saldırı enerji harcar; Dinlen (S) ile enerji toplarsın.'],
    ['Seyirci', 'Alay Et (R), güçlü ve kritik vuruşlar seyirciyi coşturur. Coşkulu seyirci daha çok altın getirir.'],
    ['İksirler', 'Can (1) ve Enerji (2) iksiri bir tur harcar. Bir dövüşte en fazla 2 iksir içebilirsin.'],
    ['Şehir', 'Maçlar arasında Mağaza’dan eşya al, Ekipman’dan kuşan, Karakter’den puan dağıt. Eğitim Alanı’nda isteğe bağlı dövüşler yapabilirsin.'],
  ];
  function howTo() {
    dialog('Nasıl Oynanır', HOW.map(([t, d]) => h('div', null, h('h3', null, t), h('p', null, d))), [{ label: 'Tamam' }]);
  }
  function settings() {
    const btn = h('button', { class: 'btn ghost', type: 'button', 'aria-pressed': String(KK.soundOn) }, KK.soundOn ? 'Ses: Açık' : 'Ses: Kapalı');
    btn.onclick = () => { toggleSound(); btn.textContent = KK.soundOn ? 'Ses: Açık' : 'Ses: Kapalı'; btn.setAttribute('aria-pressed', String(KK.soundOn)); };
    dialog('Ayarlar', [h('div', { class: 'row' }, btn)], [{ label: 'Kapat' }]);
  }
  function toggleSound() {
    KK.soundOn = !KK.soundOn;
    try { localStorage.setItem('kilic-ve-kalkan-ses', KK.soundOn ? '1' : '0'); } catch (e) { /* yok */ }
    $('#soundBtn').textContent = KK.soundOn ? 'Ses: Açık' : 'Ses: Kapalı';
    $('#soundBtn').setAttribute('aria-pressed', String(KK.soundOn));
    if (KK.soundOn) KK.audio();
  }

  /* ---------- karakter oluşturma ---------- */
  const CR = { stats: {}, pts: 0, look: {} };
  function resetCreate() {
    KK.STATS.forEach((s) => { CR.stats[s.k] = 3; });
    CR.pts = KK.START_POINTS;
    CR.look = { skin: KK.LOOK.skin[1], hair: KK.LOOK.hair[0], beard: 'kisa', scar: 'yok' };
  }
  function statRows(el, stats, o) {
    el.innerHTML = '';
    KK.STATS.forEach((s) => {
      const ctl = h('div', { class: 'ctl' });
      if (o.minus) ctl.append(h('button', { class: 'pm', type: 'button', 'aria-label': s.n + ' azalt', disabled: !o.canMinus(s.k), onclick: () => o.minus(s.k) }, '−'));
      ctl.append(h('span', { class: 'val' }, stats[s.k]));
      if (o.bonus && o.bonus[s.k]) ctl.append(h('span', { class: 'bonus' }, `+${o.bonus[s.k]}`));
      if (o.plus) ctl.append(h('button', { class: 'pm', type: 'button', 'aria-label': s.n + ' artır', disabled: !o.canPlus(s.k), onclick: () => o.plus(s.k) }, '+'));
      el.append(h('div', { class: 'stat' }, h('div', { class: 'nm' }, s.n), ctl, h('div', { class: 'ds' }, s.d)));
    });
  }
  function renderCreate() {
    const sw = (el, list, key) => {
      el.innerHTML = '';
      list.forEach((c) => el.append(h('button', {
        class: 'sw', type: 'button', style: `background:${c}`, 'aria-label': c,
        'aria-pressed': String(CR.look[key] === c), onclick: () => { CR.look[key] = c; renderCreate(); },
      })));
    };
    const seg = (el, list, key) => {
      el.innerHTML = '';
      list.forEach((o) => el.append(h('button', {
        type: 'button', 'aria-pressed': String(CR.look[key] === o.k), onclick: () => { CR.look[key] = o.k; renderCreate(); },
      }, o.n)));
    };
    sw($('#swSkin'), KK.LOOK.skin, 'skin');
    sw($('#swHair'), KK.LOOK.hair, 'hair');
    seg($('#segBeard'), KK.LOOK.beard, 'beard');
    seg($('#segScar'), KK.LOOK.scar, 'scar');
    $('#createPts').textContent = CR.pts;
    statRows($('#createStats'), CR.stats, {
      minus: (k) => { CR.stats[k]--; CR.pts++; renderCreate(); },
      canMinus: (k) => CR.stats[k] > 3,
      plus: (k) => { CR.stats[k]++; CR.pts--; renderCreate(); },
      canPlus: () => CR.pts > 0,
    });
    $('#createNote').textContent = CR.pts > 0 ? `${CR.pts} puanın kaldı. İstersen sonra Karakter ekranında dağıtabilirsin.` : 'Hazırsın.';
    drawPortrait($('#createPortrait'), {
      look: Object.assign({ tunic: KK.PLAYER_TUNIC }, CR.look), equip: KK.START_EQUIP, isPlayer: true,
    }, 1, 'oyuncu');
  }

  /* ---------- şehir menüsü ---------- */
  let tab = 'arena', shopTab = 'silah';
  function goCity(t) {
    if (t) tab = t;
    KK.endFight();
    KK.stopDemo();
    show('city');
    renderCity();
  }
  function renderCity() {
    chips();
    $$('#cityTabs .tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    $('#ptsBadge').hidden = !P.pts;
    $('#ptsBadge').textContent = P.pts;
    const body = $('#cityBody');
    body.innerHTML = '';
    ({ arena: renderArena, magaza: renderShop, ekipman: renderEquip, karakter: renderHero, egitim: renderTraining })[tab](body);
  }

  function foeCard(foe, opts) {
    const cv = h('canvas', { class: 'portrait', width: 320, height: 320, 'aria-label': foe.name });
    const st = KK.STYLES[foe.style];
    const d = KK.derive(foe);
    const kv = h('div', { class: 'kv' });
    const add = (k, v) => kv.append(h('div', null, h('span', null, k), h('b', null, v)));
    add('Seviye', foe.lvl); add('Can', d.maxHp); add('Zırh', d.armor);
    KK.STATS.forEach((s) => add(s.n, foe.stats[s.k]));
    const gear = ['silah', 'zirh', 'migfer', 'kalkan'].map((k) => KK.item(foe.equip[k])).filter(Boolean).map((i) => i.n);
    if (foe.bow) gear.push('Yay');
    const info = h('div', { class: 'panel' },
      h('div', { class: 'row between' }, h('span', { class: 'label' }, opts.where || ''), foe.tag ? h('span', { class: 'tag' + (foe.champion ? '' : ' story') }, foe.tag) : null),
      h('h3', { class: 'foe-name' }, foe.name),
      h('p', { class: 'note' }, `${st.n}: ${st.d}`),
      h('p', { class: 'tip' }, `İpucu: ${st.tip}`),
      kv,
      h('p', { class: 'note' }, 'Ekipman: ' + (gear.join(' · ') || 'yok')),
      opts.actions || null);
    setTimeout(() => drawPortrait(cv, foe, -1, (opts.matchId && KK.SPRITE_DEFS[opts.matchId]) ? opts.matchId : foe.style), 0);
    return h('div', { class: 'two' }, cv, info);
  }

  function renderArena(body) {
    const pr = P.prog;
    const grid = h('div', { class: 'arenas' });
    KK.ARENAS.forEach((a, i) => {
      const cls = i < pr.arena ? 'done' : i === pr.arena ? 'now' : 'locked';
      const count = a.matches ? a.matches.length : a.count;
      grid.append(h('div', { class: 'ar ' + cls }, h('b', null, a.n), `${count} maç`));
    });
    body.append(grid);

    const arena = KK.ARENAS[pr.arena];
    if (!arena || !arena.open) {
      body.append(h('div', { class: 'panel' },
        h('h3', null, arena ? `${arena.n} yapım aşamasında` : 'Hikâye tamamlandı'),
        h('p', { class: 'note' }, arena ? `Şampiyon: ${arena.champion}. Bu arena sonraki parçada eklenecek. Şimdilik Eğitim Alanı’nda dövüşebilir, mağazadan alışveriş yapabilirsin.` : ''),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => { tab = 'egitim'; renderCity(); } }, 'Eğitim Alanı’na git'))));
      return;
    }
    const list = h('div', { class: 'matches' });
    arena.matches.forEach((m, i) => {
      const cls = i < pr.match ? 'done' : i === pr.match ? 'now' : 'locked';
      const foe = i <= pr.match ? KK.foeForMatch(pr.arena, i) : null;
      const label = foe ? foe.name : (m.champion ? 'Arena Şampiyonu' : '???');
      const extra = m.champion ? 'Şampiyon' : m.tag || (foe ? KK.STYLES[foe.style].n : '');
      list.append(h('div', { class: 'match ' + cls },
        h('span', { class: 'no' }, ROMAN[i]),
        h('span', null, h('span', { class: 'nm' }, label), ' ', h('span', { class: 'st' }, extra)),
        h('span', { class: 'st' }, cls === 'done' ? 'Kazanıldı' : cls === 'now' ? 'Sıradaki' : 'Kilitli')));
    });
    body.append(h('div', { class: 'panel' }, h('div', { class: 'row between' }, h('h3', null, arena.n), h('span', { class: 'note' }, `Maç ${pr.match + 1} / ${arena.matches.length}`)), list));

    const foe = KK.foeForMatch(pr.arena, pr.match);
    const def = arena.matches[pr.match];
    body.append(foeCard(foe, {
      where: `${arena.n} · Maç ${pr.match + 1}`,
      matchId: def.id,
      actions: h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: () => startStory() }, 'Dövüşe Çık'),
        P.pts ? h('span', { class: 'note' }, `Dağıtılmamış ${P.pts} puanın var.`) : null),
    }));
  }

  function itemLine(it) {
    if (it.kind === 'silah') {
      const t = KK.WEAPON_TYPES[it.type];
      return `${t.n} · Hasar ${it.min}–${it.max} · ${t.d}`;
    }
    const parts = [`${KK.SERIES[it.series].n}`, `Zırh +${it.arm}`];
    if (it.blk) parts.push(`Blok %${Math.round(it.blk * 100)}`);
    if (it.agi) parts.push(`Çeviklik +${it.agi}`);
    if (it.enPen) parts.push(`Enerji −${it.enPen}`);
    return parts.join(' · ');
  }
  function equipItem(it) {
    P.equip[it.kind] = it.id;
    save(); KK.sfx('clang'); renderCity();
  }
  function itemRow(it) {
    const owned = P.owned.includes(it.id);
    const equipped = P.equip[it.kind] === it.id;
    const buy = h('div', { class: 'buy' });
    if (equipped) buy.append(h('span', { class: 'note' }, 'Kuşanıldı'));
    else if (owned) buy.append(h('button', { class: 'btn small', type: 'button', onclick: () => equipItem(it) }, 'Kuşan'));
    else {
      buy.append(h('span', { class: 'price' }, `${it.p} altın`));
      const b = h('button', { class: 'btn small', type: 'button' });
      if (P.lvl < it.lv) { b.textContent = `Seviye ${it.lv}`; b.disabled = true; }
      else if (P.gold < it.p) { b.textContent = 'Altın yetmiyor'; b.disabled = true; }
      else {
        b.textContent = 'Satın al';
        b.onclick = () => { P.gold -= it.p; P.owned.push(it.id); save(); KK.sfx('buy'); renderCity(); };
      }
      buy.append(b);
    }
    return h('div', { class: 'item' + (equipped ? ' eq' : '') },
      h('div', { class: 'nm' }, it.n), buy,
      h('div', { class: 'st' }, `${itemLine(it)} · Sv. ${it.lv}`));
  }
  function renderShop(body) {
    const tabs = h('div', { class: 'tabs subtabs', role: 'tablist' });
    [['silah', 'Silah'], ['zirh', 'Zırh'], ['migfer', 'Miğfer'], ['kalkan', 'Kalkan'], ['iksir', 'İksir']].forEach(([k, n]) => {
      tabs.append(h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': String(shopTab === k), onclick: () => { shopTab = k; renderCity(); } }, n));
    });
    const list = h('div', { class: 'items' });
    if (shopTab === 'silah') {
      Object.keys(KK.WEAPON_TYPES).filter((t) => t !== 'yay').forEach((t) => {
        list.append(h('div', { class: 'group' }, KK.WEAPON_TYPES[t].n));
        KK.WEAPONS.filter((w) => w.type === t).forEach((w) => list.append(itemRow(w)));
      });
    } else if (shopTab === 'iksir') {
      Object.entries(KK.POTIONS).forEach(([k, pot]) => {
        const b = h('button', { class: 'btn small', type: 'button', disabled: P.gold < pot.p || P.potions[k] >= 5 });
        b.textContent = P.potions[k] >= 5 ? 'En fazla 5' : P.gold < pot.p ? 'Altın yetmiyor' : 'Satın al';
        b.onclick = () => { P.gold -= pot.p; P.potions[k]++; save(); KK.sfx('buy'); renderCity(); };
        list.append(h('div', { class: 'item' },
          h('div', { class: 'nm' }, `${pot.n} (${P.potions[k]} adet)`),
          h('div', { class: 'buy' }, h('span', { class: 'price' }, `${pot.p} altın`), b),
          h('div', { class: 'st' }, `${pot.d} Dövüşte bir tur harcar, dövüş başına en fazla ${KK.MAX_POTIONS_PER_FIGHT}.`)));
      });
    } else {
      Object.keys(KK.SERIES).forEach((s) => {
        list.append(h('div', { class: 'group' }, `${KK.SERIES[s].n} seri · ${KK.SERIES[s].d}`));
        KK.ARMOR.filter((a) => a.kind === shopTab && a.series === s).forEach((a) => list.append(itemRow(a)));
      });
    }
    body.append(h('div', { class: 'panel' }, tabs, list));
  }

  function renderEquip(body) {
    const cv = h('canvas', { class: 'portrait', width: 320, height: 320, 'aria-label': 'Gladyatörün' });
    setTimeout(() => drawPortrait(cv, playerFighter(), 1, 'oyuncu'), 0);
    const d = KK.derive(playerFighter());
    const slots = h('div', null);
    KK.SLOTS.forEach(({ k, n }) => {
      const cur = KK.item(P.equip[k]);
      const others = P.owned.map(KK.item).filter((it) => it && it.kind === k && it.id !== P.equip[k]);
      const row = h('div', { class: 'slot' },
        h('div', { class: 'row between' }, h('span', { class: 'label' }, n),
          cur && k !== 'silah' ? h('button', { class: 'btn ghost small', type: 'button', onclick: () => { P.equip[k] = null; save(); renderCity(); } }, 'Çıkar') : null),
        h('div', null, h('b', null, cur ? cur.n : 'Yok'), cur ? h('div', { class: 'note' }, itemLine(cur)) : null));
      others.forEach((it) => row.append(h('div', { class: 'row between' },
        h('span', { class: 'note' }, `${it.n} · ${itemLine(it)}`),
        h('button', { class: 'btn small', type: 'button', onclick: () => equipItem(it) }, 'Kuşan'))));
      slots.append(row);
    });
    const dv = h('div', { class: 'derived' });
    [['Can', d.maxHp], ['Enerji', d.maxEn], ['Zırh', d.armor], ['Blok', `%${Math.round(d.block * 100)}`], ['Hasar', `${d.wmin}–${d.wmax}`], ['Kritik', `%${Math.round(d.crit * 100)}`]]
      .forEach(([k, v]) => dv.append(h('div', null, h('b', null, v), h('span', null, k))));
    body.append(h('div', { class: 'two' }, h('div', { class: 'panel' }, cv, dv), h('div', { class: 'panel' }, h('p', { class: 'note' }, 'Sahip olduğun eşyaları buradan kuşanırsın. Yeni eşyaları Mağaza’dan alırsın.'), slots)));
  }

  function renderHero(body) {
    const cv = h('canvas', { class: 'portrait', width: 320, height: 320, 'aria-label': 'Gladyatörün' });
    setTimeout(() => drawPortrait(cv, playerFighter(), 1, 'oyuncu'), 0);
    const d = KK.derive(playerFighter());
    const stats = h('div', { class: 'stats' });
    statRows(stats, P.stats, {
      plus: (k) => { if (P.pts <= 0) return; P.stats[k]++; P.pts--; save(); renderCity(); },
      canPlus: () => P.pts > 0,
      bonus: { agi: d.agiBonus },
    });
    const need = KK.xpNeed(P.lvl);
    const xpBar = h('div', { class: 'bar en' }, h('i', { style: `width:${(P.xp / need) * 100}%;background:var(--good)` }), h('span', null, `${P.xp} / ${need} TP`));
    const dv = h('div', { class: 'derived' });
    [['Can', d.maxHp], ['Enerji', d.maxEn], ['Dinlenme', `+${d.rest}`], ['Kritik', `%${Math.round(d.crit * 100)}`]]
      .forEach(([k, v]) => dv.append(h('div', null, h('b', null, v), h('span', null, k))));
    body.append(h('div', { class: 'two' },
      h('div', { class: 'panel' }, cv,
        h('div', { class: 'field' }, h('span', { class: 'label' }, `Seviye ${P.lvl}`), xpBar),
        h('p', { class: 'note' }, `${P.wins} zafer · ${P.losses} yenilgi`),
        h('button', { class: 'btn ghost small', type: 'button', onclick: goMenu }, 'Ana Menü')),
      h('div', { class: 'panel' },
        h('div', { class: 'row between' }, h('span', { class: 'label' }, 'Özellikler'), h('span', null, h('b', { class: 'pts' }, P.pts), ' ', h('span', { class: 'note' }, 'puan dağıtılabilir'))),
        stats, dv)));
  }

  function renderTraining(body) {
    const foe = KK.trainingFoe(P.lvl, P.trainCount);
    body.append(h('div', { class: 'panel' },
      h('h3', null, 'Eğitim Alanı'),
      h('p', { class: 'note' }, `İsteğe bağlı dövüşler. Hikâyeyi ilerletmez; ödülleri arena maçlarının %${Math.round(KK.TRAINING_REWARD_MUL * 100)}’i kadardır. Her seferinde farklı bir savaş tarzıyla karşılaşırsın.`),
      h('div', { class: 'row' }, h('button', { class: 'btn ghost small', type: 'button', onclick: () => startTutorial(true) }, 'Eğitim dövüşünü tekrar oyna'))));
    body.append(foeCard(foe, {
      where: 'Antrenman dövüşü',
      actions: h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => startTraining(foe) }, 'Antrenmana Başla')),
    }));
  }

  /* ---------- dövüş ekranı ---------- */
  function setupHud() {
    const m = $('#crowdMeter'); m.innerHTML = '';
    for (let i = 0; i < 10; i++) m.append(document.createElement('i'));
  }
  function hud() {
    const C = KK.combat();
    if (!C) return;
    const p = C.p, e = C.e;
    const w = (id, v) => { $(id).style.width = (clamp(v, 0, 1) * 100).toFixed(1) + '%'; };
    $('#pWho').textContent = '';
    $('#pWho').append(p.name + ' ', h('small', null, `Sv. ${p.lvl}`));
    $('#eWho').textContent = '';
    $('#eWho').append(h('small', null, `Sv. ${e.lvl} `), e.name);
    w('#pHp', p.hp / p.d.maxHp); $('#pHpT').textContent = `${p.hp}/${p.d.maxHp}`;
    w('#pEn', p.en / p.d.maxEn); $('#pEnT').textContent = `${p.en}`;
    w('#eHp', e.hp / e.d.maxHp); $('#eHpT').textContent = `${e.hp}/${e.d.maxHp}`;
    w('#eEn', e.en / e.d.maxEn); $('#eEnT').textContent = `${e.en}`;
    $$('#crowdMeter i').forEach((el, i) => el.classList.toggle('on', i < C.crowd));
    const d = Math.abs(p.slot - e.slot);
    $('#distT').textContent = d <= 1 ? 'Kılıç mesafesi' : `Mesafe: ${d - 1} adım`;
    $$('#actions .act').forEach((b) => {
      const id = b.dataset.act;
      b.disabled = C.busy || C.over || !KK.canDo(id);
      b.classList.toggle('hint', !!(C.tut && C.tut.allowed && C.tut.allowed.includes(id)));
      const info = b.querySelector('[data-info]');
      if (!info) return;
      if (KK.ATK[id]) {
        const pv = KK.preview(id);
        info.textContent = `${pv.en} en · %${Math.round(pv.hit * 100)} · ${pv.dmg[0]}–${pv.dmg[1]}`;
      } else if (id === 'taunt') info.textContent = `${KK.TAUNT_EN} en · %${Math.round(KK.tauntChance() * 100)}`;
      else if (id === 'rest') info.textContent = `+${p.d.rest} enerji`;
      else if (id.startsWith('pot_')) {
        const k = id.slice(4);
        info.textContent = C.potions ? `${C.potions[k] || 0} adet · ${C.potUsed}/${KK.MAX_POTIONS_PER_FIGHT}` : '';
      }
    });
    $('#turnT').textContent = C.over ? 'Dövüş bitti' : C.busy ? `${e.name} hamlesini yapıyor…` : `Tur ${C.turn} · Senin sıran`;
  }
  function logLine(msg) {
    const ul = $('#log');
    ul.prepend(h('li', null, msg));
    while (ul.children.length > 4) ul.lastChild.remove();
  }
  function tutorial(text) {
    $('#tutBox').hidden = !text;
    $('#tutBox').textContent = text || '';
  }

  function beginFight(foe, kind, onEnd, matchId) {
    $('#log').innerHTML = '';
    tutorial('');
    show('fight');
    setupHud();
    KK.startFight({
      player: playerFighter(), foe, kind, matchId,
      potions: kind === 'tutorial' ? null : P.potions,
      onEnd, onHud: hud, onLog: logLine, onTutorial: tutorial,
    });
    logLine(kind === 'tutorial' ? 'Eğitim dövüşü başladı.' : `${foe.name} ile karşı karşıyasın.`);
    hud();
  }

  function applyXp(xp, lines) {
    P.xp += xp;
    let ups = 0;
    while (P.xp >= KK.xpNeed(P.lvl)) { P.xp -= KK.xpNeed(P.lvl); P.lvl++; P.pts += KK.POINTS_PER_LEVEL; ups++; }
    if (ups) lines.push(`<b>Seviye atladın!</b> Artık seviye ${P.lvl}. Karakter ekranında <b>${ups * KK.POINTS_PER_LEVEL} puan</b> dağıt.`);
  }
  function resultModal(win, title, lines) {
    return new Promise((res) => {
      $('#mTitle').textContent = title;
      $('#mTitle').className = win ? '' : 'lose';
      $('#mBody').innerHTML = '<ul>' + lines.map((l) => `<li>${l}</li>`).join('') + '</ul>';
      $('#modal').hidden = false;
      $('#mBtn').onclick = () => { $('#modal').hidden = true; res(); };
      $('#mBtn').focus();
    });
  }

  /* ---------- oyun akışı ---------- */
  function startTutorial(replay) {
    beginFight(KK.buildFoe(KK.TUTORIAL_FOE, 0, 'egitim'), 'tutorial', async () => {
      const lines = [];
      if (!replay && !P.prog.tutorial) {
        const r = KK.TUTORIAL_REWARD;
        P.gold += r.gold; lines.push(`Ödül: <b>${r.gold} altın</b>`, `Tecrübe: <b>+${r.xp} TP</b>`);
        applyXp(r.xp, lines);
        P.prog.tutorial = true; save();
      } else lines.push('Eğitim tekrarlandı.');
      await resultModal(true, 'Eğitim tamamlandı', lines);
      if (!replay) await KK.playScene('egitim_son', P.name);
      goCity(replay ? 'egitim' : 'arena');
    });
  }

  function startStory() {
    const pr = P.prog, arena = KK.ARENAS[pr.arena], def = arena.matches[pr.match];
    const foe = KK.foeForMatch(pr.arena, pr.match);
    KK.audio();
    beginFight(foe, 'story', async (res) => {
      const r = KK.reward(foe.lvl, res.win, res.crowd);
      const lines = [];
      let scene = null;
      P.gold += r.gold;
      if (res.win) {
        P.wins++;
        lines.push(`Ödül: <b>${r.gold - r.bonus} altın</b>`);
        if (r.bonus) lines.push(`Seyirci coşkusu: <b>+${r.bonus} altın</b>`);
        scene = def.sceneAfter || null;
        pr.match++;
        if (pr.match >= arena.matches.length) {
          pr.arena++; pr.match = 0;
          const nx = KK.ARENAS[pr.arena];
          lines.push(`<b>${arena.n}</b> şampiyonunu yendin!`);
          if (nx) lines.push(nx.open ? `<b>${nx.n}</b> açıldı.` : `<b>${nx.n}</b> henüz yapım aşamasında.`);
        }
      } else {
        P.losses++; P.rescues++;
        lines.push(KK.RESCUE_LINES[Math.min(P.rescues, KK.RESCUE_LINES.length) - 1]);
        lines.push(`Teselli: <b>${r.gold} altın</b>. İlerlemen kaybolmadı, hazırlanıp tekrar dene.`);
      }
      lines.push(`Tecrübe: <b>+${r.xp} TP</b>`);
      applyXp(r.xp, lines);
      save();
      await resultModal(res.win, res.win ? 'Zafer!' : 'Yenildin', lines);
      if (scene) await KK.playScene(scene, P.name);
      goCity('arena');
    }, def.id);
  }

  function startTraining(foe) {
    KK.audio();
    beginFight(foe, 'training', async (res) => {
      const base = KK.reward(foe.lvl, res.win, res.crowd);
      const gold = Math.round(base.gold * KK.TRAINING_REWARD_MUL), xp = Math.round(base.xp * KK.TRAINING_REWARD_MUL);
      const lines = [];
      P.gold += gold; P.trainCount++;
      if (res.win) P.wins++; else P.losses++;
      lines.push(`Antrenman ödülü: <b>${gold} altın</b>`, `Tecrübe: <b>+${xp} TP</b>`);
      applyXp(xp, lines);
      save();
      await resultModal(res.win, res.win ? 'Antrenman kazanıldı' : 'Antrenman kaybedildi', lines);
      goCity('egitim');
    });
  }

  /* ---------- olaylar ---------- */
  const startNew = () => { resetCreate(); show('create'); renderCreate(); };
  $('#newBtn').onclick = () => {
    KK.audio();
    if (load()) {
      dialog('Yeni oyun', [h('p', null, 'Kayıtlı oyunun silinecek. Emin misin?')],
        [{ label: 'Vazgeç', cls: 'ghost' }, { label: 'Yeni oyuna başla', cls: 'danger', onclick: startNew }]);
      return;
    }
    startNew();
  };
  $('#howBtn').onclick = howTo;
  $('#setBtn').onclick = settings;
  $('#contBtn').onclick = () => {
    KK.audio();
    const s = load(); if (!s) return;
    P = s;
    if (!P.prog.tutorial) startTutorial(false); else goCity('arena');
  };
  $('#backMenuBtn').onclick = goMenu;
  $('#startBtn').onclick = async () => {
    const name = $('#nameIn').value.trim() || 'Adsız';
    newPlayer(name, Object.assign({}, CR.look), CR.stats, CR.pts);
    await KK.playScene('ihanet', P.name);
    startTutorial(false);
  };
  $$('#cityTabs .tab').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; renderCity(); }; });
  $$('#actions .act').forEach((b) => { b.onclick = () => { KK.audio(); KK.playerAct(b.dataset.act); }; });
  $('#soundBtn').onclick = toggleSound;
  const KEYS = { KeyA: 'back', ArrowLeft: 'back', KeyD: 'fwd', ArrowRight: 'fwd', KeyQ: 'quick', KeyW: 'normal', KeyE: 'power', KeyR: 'taunt', KeyS: 'rest', Digit1: 'pot_can', Digit2: 'pot_enerji' };
  document.addEventListener('keydown', (ev) => {
    if (ev.code === 'Escape' && !$('#dialog').hidden) { $('#dialog').hidden = true; return; }
    if (screen !== 'fight' || !$('#modal').hidden || KK.sceneActive()) return;
    if (ev.target && ev.target.tagName === 'INPUT') return;
    const id = KEYS[ev.code];
    if (id) { ev.preventDefault(); KK.audio(); KK.playerAct(id); }
  });

  /* ---------- başlangıç ---------- */
  try { if (localStorage.getItem('kilic-ve-kalkan-ses') === '0') toggleSound(); } catch (e) { /* yok */ }
  KK.onSpriteLoad = () => {
    if (screen === 'create') renderCreate();
    if (screen === 'city') renderCity();
  };
  KK.loadSprites();
  KK.startRender();
  goMenu();
})(window.KK);

/* Kılıç ve Kalkan: ekranlar, oyuncu kaydı ve oyun akışı. */
window.KK = window.KK || {};
(function (KK) {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const { clamp } = KK.util;
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : String(c)); });
    return el;
  };
  const icon = (src, alt) => h('img', { class: 'ico', src, alt: alt || '', loading: 'lazy' });

  /* ---------- kayıt ---------- */
  let P = null;
  const save = () => { try { localStorage.setItem(KK.SAVE_KEY, JSON.stringify(P)); } catch (e) { /* kayıt yapılamadı */ } };
  const load = () => {
    try {
      const s = localStorage.getItem(KK.SAVE_KEY);
      if (!s) return null;
      const d = JSON.parse(s);
      d.potions = d.potions || {};
      return d;
    } catch (e) { return null; }
  };

  function newPlayer(name, stats, pts) {
    P = {
      v: 2, name, lvl: 1, xp: 0, pts, gold: KK.START_GOLD,
      stats: Object.assign({}, stats),
      owned: KK.START_OWNED.slice(), equip: Object.assign({}, KK.START_EQUIP),
      potions: Object.assign({}, KK.START_POTIONS),
      prog: { tutorial: false, arena: 0, match: 0 },
      wins: 0, losses: 0, rescues: 0, trainCount: 0,
    };
    save();
  }
  const playerFighter = () => ({
    name: P.name, lvl: P.lvl, stats: P.stats, equip: P.equip,
    look: { skin: '#d9a577', hair: '#24160e', beard: 'kisa', scar: 'yok', tunic: KK.PLAYER_TUNIC }, isPlayer: true,
  });
  const unlocked = (it) => P.prog.arena >= (it.arena || 0);
  const arenaName = (i) => (KK.ARENAS[i] ? KK.ARENAS[i].n : 'Final');

  /* ---------- ekranlar ---------- */
  let screen = 'menu';
  function show(name) {
    screen = name;
    ['menu', 'create', 'city', 'fight'].forEach((s) => { $('#' + s).hidden = s !== name; });
    $('#stage').hidden = name !== 'fight';
    $('#hud').hidden = name !== 'fight';
    $('#chips').hidden = name !== 'fight';
    document.querySelector('.topbar').hidden = name === 'menu' || name === 'city';
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
    closeWin();
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
    ['Amaç', 'Arenalarda dövüş, altın ve tecrübe kazan. Her arenanın şampiyonunu yenince sonraki arena ve yeni eşyalar açılır.'],
    ['Hareket', 'Rakibe yaklaşmak için İlerle (D), uzaklaşmak için Geri Çekil (A). Kılıç, hançer, tokmak ve balta bitişikken; mızrak 2 adımdan; yay uzaktan vurur.'],
    ['Saldırılar', 'Hızlı (Q) az enerji harcar ve sık isabet eder. Normal (W) dengelidir. Güçlü (E) çok vurur ama sık ıskalar.'],
    ['Savunma ve enerji', 'Kalkanın ve zırhın darbeleri kendiliğinden karşılar. Her saldırı enerji harcar; Dinlen (S) ile enerji toplarsın.'],
    ['Seyirci', 'Alay Et (R), güçlü ve kritik vuruşlar seyirciyi coşturur. Coşkulu seyirci daha çok altın getirir.'],
    ['İksirler', 'İksir (1) ile yanındaki iksirlerden birini içersin. İçmek bir tur harcar; bir dövüşte en fazla 2 iksir içebilirsin.'],
    ['Şehir', 'Demirciden silah, zırhçıdan zırh, miğfer ve kalkan, iksirciden iksir alırsın. Sol üstteki madalyondan puan dağıtır ve eşya kuşanırsın.'],
  ];
  function howTo() { dialog('Nasıl Oynanır', HOW.map(([t, d]) => h('div', null, h('h3', null, t), h('p', null, d))), [{ label: 'Tamam' }]); }
  function settings() {
    const btn = h('button', { class: 'btn ghost', type: 'button', 'aria-pressed': String(KK.soundOn) }, KK.soundOn ? 'Ses: Açık' : 'Ses: Kapalı');
    btn.onclick = () => { toggleSound(); btn.textContent = KK.soundOn ? 'Ses: Açık' : 'Ses: Kapalı'; btn.setAttribute('aria-pressed', String(KK.soundOn)); };
    dialog('Ayarlar', [h('div', { class: 'row' }, btn)], [{ label: 'Kapat' }]);
  }
  function toggleSound() {
    KK.soundOn = !KK.soundOn;
    try { localStorage.setItem('kilic-ve-kalkan-ses', KK.soundOn ? '1' : '0'); } catch (e) { /* yok */ }
    const t = KK.soundOn ? 'Ses: Açık' : 'Ses: Kapalı';
    $('#soundBtn').textContent = t; $('#citySound').textContent = t;
    $('#soundBtn').setAttribute('aria-pressed', String(KK.soundOn));
    if (KK.soundOn) KK.audio();
  }

  /* ---------- karakter oluşturma ---------- */
  const CR = { stats: {}, pts: 0 };
  function resetCreate() {
    KK.STATS.forEach((s) => { CR.stats[s.k] = 3; });
    CR.pts = KK.START_POINTS;
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
    $('#createPts').textContent = CR.pts;
    statRows($('#createStats'), CR.stats, {
      minus: (k) => { CR.stats[k]--; CR.pts++; renderCreate(); },
      canMinus: (k) => CR.stats[k] > 3,
      plus: (k) => { CR.stats[k]++; CR.pts--; renderCreate(); },
      canPlus: () => CR.pts > 0,
    });
    $('#createNote').textContent = CR.pts > 0 ? `${CR.pts} puanın kaldı. İstersen sonra karakter ekranında dağıtabilirsin.` : 'Hazırsın.';
    drawPortrait($('#createPortrait'), { look: { skin: '#d9a577', hair: '#24160e', tunic: KK.PLAYER_TUNIC }, equip: KK.START_EQUIP, isPlayer: true }, 1, 'oyuncu');
  }

  /* ---------- şehir menüsü ---------- */
  function goCity() {
    KK.endFight();
    show('city');
    renderCityHud();
  }
  function renderCityHud() {
    if (!P) return;
    $('#hbName').textContent = `Sv.${P.lvl} ${P.name}`;
    const need = KK.xpNeed(P.lvl);
    $('#hbXpFill').style.width = (clamp(P.xp / need, 0, 1) * 100) + '%';
    $('#hbXp').textContent = `TP ${P.xp}/${need}`;
    $('#hbGold').textContent = `${P.gold} altın`;
    $('#ptsDot').hidden = !P.pts;
    $('#ptsDot').textContent = P.pts;
    const cv = $('#medalCanvas'), c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#2a1c17'; c.fillRect(0, 0, 160, 160);
    const img = KK.spriteImage('oyuncu');
    if (img) { c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(img, 30, 4, 76, 76, 0, 0, 160, 160); }
  }

  /* ---------- şehir pencereleri ---------- */
  const WINS = {
    arena: ['Arena', renderArena],
    demirci: ['Demirci', renderDemirci],
    zirhci: ['Zırhçı', renderZirhci],
    iksirci: ['İksirci', renderIksirci],
    egitim: ['Eğitim Alanı', renderEgitim],
    karakter: ['Karakter', renderKarakter],
  };
  let winKey = null, smithTab = 'kilic', armorTab = 'zirh';
  function openWin(key) {
    winKey = key;
    $('#win').hidden = false;
    renderWin();
    $('#winClose').focus();
  }
  function closeWin() { winKey = null; $('#win').hidden = true; }
  function renderWin() {
    if (!winKey || !P) return;
    const [title, fn] = WINS[winKey];
    $('#winTitle').textContent = title;
    $('#winGold').textContent = `${P.gold} altın`;
    const body = $('#winBody'), top = body.scrollTop;
    body.innerHTML = '';
    fn(body);
    body.scrollTop = top;
    renderCityHud();
  }

  function foeCard(foe, opts) {
    const cv = h('canvas', { class: 'portrait', width: 320, height: 320, 'aria-label': foe.name });
    const st = KK.STYLES[foe.style];
    const d = KK.derive(foe);
    const w = KK.item(foe.equip.silah);
    const kv = h('div', { class: 'kv' });
    const add = (k, v) => kv.append(h('div', null, h('span', null, k), h('b', null, v)));
    add('Seviye', foe.lvl); add('Can', d.maxHp); add('Zırh', d.armor);
    KK.STATS.forEach((s) => add(s.n, foe.stats[s.k]));
    const gear = ['silah', 'zirh', 'migfer', 'kalkan'].map((k) => KK.item(foe.equip[k])).filter(Boolean).map((i) => i.n);
    const info = h('div', { class: 'panel' },
      h('div', { class: 'row between' }, h('span', { class: 'label' }, opts.where || ''), foe.tag ? h('span', { class: 'tag' + (foe.champion ? '' : ' story') }, foe.tag) : null),
      h('h3', { class: 'foe-name' }, foe.name),
      h('p', { class: 'note' }, `${st.n}: ${st.d} Silahı: ${KK.WEAPON_TYPES[w.type].n}.`),
      h('p', { class: 'tip' }, `İpucu: ${st.tip}`),
      kv,
      h('p', { class: 'note' }, 'Ekipman: ' + (gear.join(' · ') || 'yok')),
      opts.actions || null);
    const draw = () => drawPortrait(cv, foe, -1, foe.sprite);
    setTimeout(draw, 0); setTimeout(draw, 400);
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
        h('p', { class: 'note' }, arena ? `Şampiyon: ${arena.champion}. Bu arena sonraki parçada eklenecek. Yeni silah ve zırhlar demirci ile zırhçıda açıldı; Eğitim Alanı’nda dövüşebilirsin.` : '')));
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
    body.append(foeCard(foe, {
      where: `${arena.n} · Maç ${pr.match + 1}`,
      actions: h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: () => { closeWin(); startStory(); } }, 'Dövüşe Çık'),
        P.pts ? h('span', { class: 'note' }, `Dağıtılmamış ${P.pts} puanın var (sol üstteki madalyon).`) : null),
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
  function equipItem(it) { P.equip[it.kind] = it.id; save(); KK.sfx('clang'); renderWin(); }
  function itemRow(it) {
    const owned = P.owned.includes(it.id), equipped = P.equip[it.kind] === it.id, open = unlocked(it);
    const buy = h('div', { class: 'buy' });
    if (equipped) buy.append(h('span', { class: 'note' }, 'Kuşanıldı'));
    else if (owned) buy.append(h('button', { class: 'btn small', type: 'button', onclick: () => equipItem(it) }, 'Kuşan'));
    else {
      buy.append(h('span', { class: 'price' }, `${it.p} altın`));
      const b = h('button', { class: 'btn small', type: 'button' });
      if (!open) { b.textContent = `${arenaName(it.arena)}da açılır`; b.disabled = true; }
      else if (P.gold < it.p) { b.textContent = 'Altın yetmiyor'; b.disabled = true; }
      else {
        b.textContent = 'Satın al';
        b.onclick = () => { P.gold -= it.p; P.owned.push(it.id); P.equip[it.kind] = it.id; save(); KK.sfx('buy'); renderWin(); };
      }
      buy.append(b);
    }
    return h('div', { class: 'item ico-row' + (equipped ? ' eq' : '') + (open || owned ? '' : ' locked') },
      icon(it.icon, it.n), h('div', { class: 'nm' }, `${ROMAN[it.tier - 1]}. ${it.n}`), buy,
      h('div', { class: 'st' }, itemLine(it)));
  }
  function tabs(list, cur, onPick) {
    const t = h('div', { class: 'tabs subtabs', role: 'tablist' });
    list.forEach(([k, n]) => t.append(h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': String(cur === k), onclick: () => onPick(k) }, n)));
    return t;
  }
  function renderDemirci(body) {
    body.append(tabs(Object.keys(KK.WEAPON_TYPES).map((k) => [k, KK.WEAPON_TYPES[k].n]), smithTab, (k) => { smithTab = k; renderWin(); }));
    body.append(h('p', { class: 'tip' }, `${KK.WEAPON_TYPES[smithTab].n}: ${KK.WEAPON_TYPES[smithTab].d} Her arenada her türden 2 yeni silah açılır. Aldığın silah hemen kuşanılır.`));
    const list = h('div', { class: 'items' });
    KK.WEAPONS.filter((w) => w.type === smithTab).forEach((w) => list.append(itemRow(w)));
    body.append(list);
  }
  function renderZirhci(body) {
    body.append(tabs([['zirh', 'Zırh'], ['migfer', 'Miğfer'], ['kalkan', 'Kalkan']], armorTab, (k) => { armorTab = k; renderWin(); }));
    const list = h('div', { class: 'items' });
    Object.keys(KK.SERIES).forEach((s) => {
      list.append(h('div', { class: 'group' }, `${KK.SERIES[s].n} seri · ${KK.SERIES[s].d}`));
      KK.ARMOR.filter((a) => a.kind === armorTab && a.series === s).forEach((a) => list.append(itemRow(a)));
    });
    body.append(list);
  }
  function renderIksirci(body) {
    body.append(h('p', { class: 'tip' }, `İksir içmek dövüşte bir tur harcar. Bir dövüşte en fazla ${KK.MAX_POTIONS_PER_FIGHT} iksir içebilirsin; her iksirden en fazla ${KK.MAX_POTION_STACK} tane taşıyabilirsin.`));
    const list = h('div', { class: 'items' });
    KK.POTIONS.forEach((pt) => {
      const have = P.potions[pt.id] || 0, open = unlocked(pt);
      const b = h('button', { class: 'btn small', type: 'button' });
      if (!open) { b.textContent = `${arenaName(pt.arena)}da açılır`; b.disabled = true; }
      else if (have >= KK.MAX_POTION_STACK) { b.textContent = `En fazla ${KK.MAX_POTION_STACK}`; b.disabled = true; }
      else if (P.gold < pt.p) { b.textContent = 'Altın yetmiyor'; b.disabled = true; }
      else { b.textContent = 'Satın al'; b.onclick = () => { P.gold -= pt.p; P.potions[pt.id] = have + 1; save(); KK.sfx('buy'); renderWin(); }; }
      list.append(h('div', { class: 'item ico-row' + (open ? '' : ' locked') },
        icon(pt.icon, pt.n), h('div', { class: 'nm' }, `${pt.n} (${have} adet)`),
        h('div', { class: 'buy' }, h('span', { class: 'price' }, `${pt.p} altın`), b),
        h('div', { class: 'st' }, pt.d)));
    });
    body.append(list);
  }
  function renderEgitim(body) {
    const foe = KK.trainingFoe(P.lvl, Math.min(P.prog.arena, 4), P.trainCount);
    body.append(h('div', { class: 'panel' },
      h('p', { class: 'note' }, `İsteğe bağlı dövüşler. Hikâyeyi ilerletmez; ödülleri arena maçlarının %${Math.round(KK.TRAINING_REWARD_MUL * 100)}’i kadardır. Her seferinde farklı bir savaş tarzıyla karşılaşırsın.`),
      h('div', { class: 'row' }, h('button', { class: 'btn ghost small', type: 'button', onclick: () => { closeWin(); startTutorial(true); } }, 'Eğitim dövüşünü tekrar oyna'))));
    body.append(foeCard(foe, {
      where: 'Antrenman dövüşü',
      actions: h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => { closeWin(); startTraining(foe); } }, 'Antrenmana Başla')),
    }));
  }
  function renderKarakter(body) {
    const cv = h('canvas', { class: 'portrait', width: 320, height: 320, 'aria-label': 'Gladyatörün' });
    setTimeout(() => drawPortrait(cv, playerFighter(), 1, 'oyuncu'), 0);
    const d = KK.derive(playerFighter());
    const stats = h('div', { class: 'stats' });
    statRows(stats, P.stats, {
      plus: (k) => { if (P.pts <= 0) return; P.stats[k]++; P.pts--; save(); renderWin(); },
      canPlus: () => P.pts > 0,
      bonus: { agi: d.agiBonus },
    });
    const need = KK.xpNeed(P.lvl);
    const xpBar = h('div', { class: 'bar en' }, h('i', { style: `width:${(P.xp / need) * 100}%;background:var(--good)` }), h('span', null, `${P.xp} / ${need} TP`));
    const dv = h('div', { class: 'derived' });
    [['Can', d.maxHp], ['Enerji', d.maxEn], ['Zırh', d.armor], ['Blok', `%${Math.round(d.block * 100)}`], ['Hasar', `${d.wmin}–${d.wmax}`], ['Kritik', `%${Math.round(d.crit * 100)}`]]
      .forEach(([k, v]) => dv.append(h('div', null, h('b', null, v), h('span', null, k))));
    const slots = h('div', { class: 'stats' });
    KK.SLOTS.forEach(({ k, n }) => {
      const cur = KK.item(P.equip[k]);
      const others = P.owned.map(KK.item).filter((it) => it && it.kind === k && it.id !== P.equip[k]);
      const picks = h('div', { class: 'equip-list' });
      others.forEach((it) => picks.append(h('button', { class: 'equip-pick', type: 'button', title: itemLine(it), onclick: () => equipItem(it) }, icon(it.icon, it.n), it.n)));
      if (cur && k !== 'silah') picks.append(h('button', { class: 'btn ghost small', type: 'button', onclick: () => { P.equip[k] = null; save(); renderWin(); } }, 'Çıkar'));
      slots.append(h('div', { class: 'stat' },
        h('div', { class: 'slot-row' }, cur ? icon(cur.icon, cur.n) : h('span', { class: 'ico' }),
          h('div', null, h('div', { class: 'label' }, n), h('b', null, cur ? cur.n : 'Yok'), cur ? h('div', { class: 'note' }, itemLine(cur)) : null)),
        h('div', { class: 'ds' }, picks)));
    });
    body.append(h('div', { class: 'two' },
      h('div', { class: 'panel' }, cv,
        h('div', { class: 'field' }, h('span', { class: 'label' }, `${P.name} · Seviye ${P.lvl}`), xpBar),
        h('p', { class: 'note' }, `${P.wins} zafer · ${P.losses} yenilgi`), dv),
      h('div', { class: 'panel' },
        h('div', { class: 'row between' }, h('span', { class: 'label' }, 'Özellikler'), h('span', null, h('b', { class: 'pts' }, P.pts), ' ', h('span', { class: 'note' }, 'puan dağıtılabilir'))),
        stats,
        h('span', { class: 'label' }, 'Ekipman (sahip olduklarından seç)'),
        slots)));
  }

  /* ---------- dövüş ekranı ---------- */
  function setupHud() {
    const m = $('#crowdMeter'); m.innerHTML = '';
    for (let i = 0; i < 10; i++) m.append(document.createElement('i'));
    $('#potTray').hidden = true;
  }
  function renderPotTray() {
    const tray = $('#potTray'), C = KK.combat();
    tray.innerHTML = '';
    if (!C || !C.potions) return;
    const owned = KK.POTIONS.filter((pt) => (C.potions[pt.id] || 0) > 0);
    if (!owned.length) { tray.append(h('span', { class: 'note' }, 'Yanında iksir yok. İksirciden alabilirsin.')); return; }
    owned.forEach((pt) => tray.append(h('button', {
      class: 'pot-btn', type: 'button', title: pt.d, disabled: !KK.canDo('pot:' + pt.id) || C.busy || C.over,
      onclick: () => { tray.hidden = true; KK.audio(); KK.playerAct('pot:' + pt.id); },
    }, icon(pt.icon, pt.n), `${pt.n} ×${C.potions[pt.id]}`)));
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
    const b = p.buf, chipsEl = $('#pBuffs'); chipsEl.innerHTML = '';
    const add = (t) => chipsEl.append(h('span', null, t));
    if (b.gk > 0) add(`Güç ${b.gk}`); if (b.dd > 0) add(`Demir Deri ${b.dd}`); if (b.ke > 0) add(`Kan Emici ${b.ke}`);
    if (b.dev > 0) add(`Dev Kanı ${b.dev}`); if (b.ol) add('Ölümsüz'); if (b.vahsi) add('Vahşi Kan'); if (b.zk) add('Zırh Kıran');
    if (b.shield > 0) add(`Kalkan ${b.shield}`);
    const d = Math.abs(p.slot - e.slot);
    $('#distT').textContent = d <= 1 ? 'Bitişik' : `Mesafe: ${d - 1} adım` + (d <= p.d.range ? ' · menzilde' : '');
    $$('#actions .act').forEach((btn) => {
      const id = btn.dataset.act;
      if (id === 'potions') {
        const anyPot = C.potions && KK.POTIONS.some((pt) => KK.canDo('pot:' + pt.id));
        btn.disabled = C.busy || C.over || !anyPot;
        btn.classList.toggle('hint', false);
        const left = C.potions ? KK.POTIONS.reduce((s, pt) => s + (C.potions[pt.id] || 0), 0) : 0;
        btn.querySelector('[data-info]').textContent = C.potions ? `${left} adet · ${C.potUsed}/${KK.MAX_POTIONS_PER_FIGHT}` : '';
        return;
      }
      btn.disabled = C.busy || C.over || !KK.canDo(id);
      btn.classList.toggle('hint', !!(C.tut && C.tut.allowed && C.tut.allowed.includes(id)));
      const info = btn.querySelector('[data-info]');
      if (!info) return;
      if (KK.ATK[id]) {
        const pv = KK.preview(id);
        info.textContent = `${pv.en} en · %${Math.round(pv.hit * 100)} · ${pv.dmg[0]}–${pv.dmg[1]}`;
      } else if (id === 'taunt') info.textContent = `${KK.TAUNT_EN} en · %${Math.round(KK.tauntChance() * 100)}`;
      else if (id === 'rest') info.textContent = `+${p.d.rest} enerji`;
    });
    if (!$('#potTray').hidden) renderPotTray();
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

  function beginFight(foe, kind, onEnd, bg) {
    $('#log').innerHTML = '';
    tutorial('');
    show('fight');
    setupHud();
    KK.startFight({
      player: playerFighter(), foe, kind, bg,
      potions: kind === 'tutorial' ? null : P.potions,
      onEnd, onHud: hud, onLog: logLine, onTutorial: tutorial,
      onPotionUsed: () => save(),
    });
    logLine(kind === 'tutorial' ? 'Eğitim dövüşü başladı.' : `${foe.name} ile karşı karşıyasın.`);
    if (foe.intro) logLine(`${foe.name}: “${foe.intro}”`);
    hud();
  }

  function applyXp(xp, lines) {
    P.xp += xp;
    let ups = 0;
    while (P.xp >= KK.xpNeed(P.lvl)) { P.xp -= KK.xpNeed(P.lvl); P.lvl++; P.pts += KK.POINTS_PER_LEVEL; ups++; }
    if (ups) lines.push(`<b>Seviye atladın!</b> Artık seviye ${P.lvl}. Sol üstteki madalyondan <b>${ups * KK.POINTS_PER_LEVEL} puan</b> dağıt.`);
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
    beginFight(KK.buildFoe(KK.TUTORIAL_FOE, 1, 0, 'egitim'), 'tutorial', async () => {
      const lines = [];
      if (!replay && !P.prog.tutorial) {
        const r = KK.TUTORIAL_REWARD;
        P.gold += r.gold; lines.push(`Ödül: <b>${r.gold} altın</b>`, `Tecrübe: <b>+${r.xp} TP</b>`);
        applyXp(r.xp, lines);
        P.prog.tutorial = true; save();
      } else lines.push('Eğitim tekrarlandı.');
      await resultModal(true, 'Eğitim tamamlandı', lines);
      if (!replay) await KK.playScene('egitim_son', P.name);
      goCity();
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
          lines.push('Demirci, zırhçı ve iksircide <b>yeni eşyalar açıldı</b>.');
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
      goCity();
    }, arena.bg);
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
      goCity();
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
    if (!P.prog.tutorial) startTutorial(false); else goCity();
  };
  $('#backMenuBtn').onclick = goMenu;
  $('#startBtn').onclick = async () => {
    const name = $('#nameIn').value.trim() || 'Adsız';
    newPlayer(name, CR.stats, CR.pts);
    await KK.playScene('ihanet', P.name);
    startTutorial(false);
  };
  $$('#cityScreen [data-go]').forEach((b) => { b.onclick = () => { KK.audio(); KK.sfx('step'); openWin(b.dataset.go); }; });
  $('#winClose').onclick = closeWin;
  $('#win').addEventListener('click', (e) => { if (e.target.id === 'win') closeWin(); });
  $('#cityMenu').onclick = goMenu;
  $('#citySound').onclick = toggleSound;
  $$('#actions .act').forEach((b) => {
    b.onclick = () => {
      KK.audio();
      if (b.dataset.act === 'potions') { $('#potTray').hidden = !$('#potTray').hidden; renderPotTray(); return; }
      $('#potTray').hidden = true;
      KK.playerAct(b.dataset.act);
    };
  });
  $('#soundBtn').onclick = toggleSound;
  const KEYS = { KeyA: 'back', ArrowLeft: 'back', KeyD: 'fwd', ArrowRight: 'fwd', KeyQ: 'quick', KeyW: 'normal', KeyE: 'power', KeyR: 'taunt', KeyS: 'rest' };
  document.addEventListener('keydown', (ev) => {
    if (ev.code === 'Escape' && !$('#dialog').hidden) { $('#dialog').hidden = true; return; }
    if (ev.code === 'Escape' && !$('#win').hidden) { closeWin(); return; }
    if (screen !== 'fight' || !$('#modal').hidden || KK.sceneActive()) return;
    if (ev.target && ev.target.tagName === 'INPUT') return;
    if (ev.code === 'Digit1') { ev.preventDefault(); $('#potTray').hidden = !$('#potTray').hidden; renderPotTray(); return; }
    const id = KEYS[ev.code];
    if (id) { ev.preventDefault(); KK.audio(); $('#potTray').hidden = true; KK.playerAct(id); }
  });

  /* ---------- başlangıç ---------- */
  try { if (localStorage.getItem('kilic-ve-kalkan-ses') === '0') toggleSound(); } catch (e) { /* yok */ }
  KK.onSpriteLoad = (key) => {
    if (screen === 'create') renderCreate();
    if (screen === 'city' && key === 'oyuncu') renderCityHud();
  };
  KK.loadSprites();
  KK.startRender();
  goMenu();
})(window.KK);

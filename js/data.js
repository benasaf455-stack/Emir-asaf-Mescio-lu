/* Kılıç ve Kalkan: oyun verisi.
   Rakipler, eşyalar, arenalar ve sahne metinleri buradadır.
   Oyunu değiştirmek için çoğu zaman yalnızca bu dosyayı düzenlemek yeterlidir. */
window.KK = window.KK || {};
(function (KK) {
  'use strict';

  KK.SAVE_KEY = 'kilic-ve-kalkan-v2';

  /* ---------- özellikler ---------- */
  KK.STATS = [
    { k: 'str', n: 'Güç', d: 'Vuruşlarının hasarını artırır.' },
    { k: 'atk', n: 'Saldırı', d: 'İsabet şansını artırır.' },
    { k: 'def', n: 'Savunma', d: 'Aldığın hasarı azaltır.' },
    { k: 'agi', n: 'Çeviklik', d: 'Kaçınma ve kritik vuruş şansı.' },
    { k: 'vit', n: 'Canlılık', d: 'Can puanını artırır.' },
    { k: 'sta', n: 'Dayanıklılık', d: 'Enerjini ve dinlenince kazandığını artırır.' },
    { k: 'cha', n: 'Karizma', d: 'Alay etme ve seyirciyi coşturma.' },
  ];
  KK.START_POINTS = 20;
  KK.POINTS_PER_LEVEL = 5;
  KK.xpNeed = (lvl) => 60 + lvl * 30;

  /* yer tutucu çizimler için renkler (görseli olmayan karakterler) */
  KK.LOOK = {
    skin: ['#f0c8a0', '#d9a577', '#b27a4f', '#7f4f33'],
    hair: ['#24160e', '#5a381b', '#9a5b28', '#cdb27a'],
    beard: [{ k: 'yok' }, { k: 'kisa' }, { k: 'uzun' }],
    scar: [{ k: 'yok' }, { k: 'yanak' }, { k: 'goz' }],
  };
  KK.PLAYER_TUNIC = '#6e3a24';

  /* ---------- silahlar: 6 tür × 10 kademe ----------
     range: vurabildiği en uzak mesafe (1 = bitişik).
     stun: vuruşta rakibi bir tur sersemletme şansı. pierce: kalkan bloğunu delme şansı.
     nearMul: bitişikken hasar çarpanı (yay yakında zayıftır). */
  KK.WEAPON_TYPES = {
    kilic: { n: 'Kılıç', d: 'Dengeli.', acc: 0, mul: 1, crit: 0, extraEn: 0, range: 1 },
    hancer: { n: 'Hançer', d: 'Hızlı ve isabetli, hasarı düşük.', acc: 0.12, mul: 0.85, crit: 0.05, extraEn: 0, range: 1 },
    tokmak: { n: 'Tokmak', d: 'Ağır vurur, %15 sersemletme şansı.', acc: -0.08, mul: 1.2, crit: 0, extraEn: 2, range: 1, stun: 0.15 },
    balta: { n: 'Balta', d: 'Ağır vurur, %30 kalkanı delme şansı.', acc: -0.05, mul: 1.15, crit: 0, extraEn: 2, range: 1, pierce: 0.3 },
    mizrak: { n: 'Mızrak', d: '2 adım uzaktan vurabilir.', acc: 0, mul: 0.95, crit: 0, extraEn: 0, range: 2 },
    yay: { n: 'Yay', d: 'Uzaktan vurur; bitişikken hasarı yarıya iner.', acc: -0.05, mul: 0.9, crit: 0.03, extraEn: 0, range: 6, nearMul: 0.5, ranged: true },
  };
  const WEAPON_NAMES = {
    kilic: ['Paslı Gladius', 'Gladius', 'Kara Demir Kılıç', 'Altın Kabzalı Kılıç', 'Gümüş Spatha', 'Kan Damarlı Kılıç', 'Sarmaşık Kılıcı', 'Kızıl Rün Kılıcı', 'Gölge Kılıcı', 'Buz Ruhu Kılıcı'],
    hancer: ['Tırtıklı Hançerler', 'Yeşim Hançerler', 'Kemik Hançerler', 'Şiş Hançerler', 'Kanca Hançerler', 'Yaprak Hançerler', 'Oyma Hançerler', 'Kristal Hançerler', 'Kızıl Diş Hançerler', 'Zümrüt Alev Hançeri'],
    tokmak: ['Çivili Sopa', 'Demir Gürz', 'Bronz Çekiç', 'Taş Tokmak', 'Kanatlı Gürz', 'Kemik Tokmak', 'Çanlı Tokmak', 'Rünlü Savaş Çekici', 'Ruh Feneri', 'Boşluk Çekici'],
    balta: ['Paslı Balta', 'Kasap Baltası', 'Çift Ağızlı Balta', 'Oduncu Baltası', 'Çelik Çift Balta', 'Kara Hilal', 'Buz Baltası', 'Mor Kristal Balta', 'Lav Baltası', 'Fırtına Baltası'],
    mizrak: ['Av Mızrağı', 'Bronz Mızrak', 'Demir Mızrak', 'Obsidyen Mızrak', 'Üç Dişli Yaba', 'Sarmal Mızrak', 'Zümrüt Mızrak', 'Alev Çatalı', 'Kan Kristali Mızrağı', 'İmparator Mızrağı'],
    yay: ['Av Yayı', 'Kavisli Yay', 'Dal Yay', 'Kemik Yay', 'Bronz Yay', 'Sargılı Yay', 'Ayaz Yayı', 'Diken Yayı', 'Şimşek Yayı', 'Sarmaşık Ruhu Yayı'],
  };
  const W_MIN = [2, 3, 5, 7, 9, 12, 15, 18, 22, 26];
  const W_PRICE = [30, 100, 220, 380, 600, 850, 1150, 1500, 1950, 2500];
  KK.WEAPONS = [];
  Object.keys(KK.WEAPON_TYPES).forEach((type) => {
    const wt = KK.WEAPON_TYPES[type];
    for (let t = 1; t <= 10; t++) {
      const mn = Math.max(1, Math.round(W_MIN[t - 1] * wt.mul));
      KK.WEAPONS.push({
        id: `${type}_${t}`, kind: 'silah', type, tier: t, n: WEAPON_NAMES[type][t - 1],
        min: mn, max: Math.round(mn * 1.9) + 1,
        p: W_PRICE[t - 1], arena: Math.ceil(t / 2) - 1,
        icon: `assets/ikonlar/${type}/${t}.png`,
      });
    }
  });

  /* ---------- zırh, miğfer, kalkan: üç seri × 5 kademe ---------- */
  KK.SERIES = {
    hafif: { n: 'Hafif', d: 'Az koruma, Çeviklik bonusu.', row: 0 },
    dengeli: { n: 'Dengeli', d: 'Orta koruma.', row: 1 },
    agir: { n: 'Ağır', d: 'Yüksek koruma, parça başına 4 Enerji cezası.', row: 2 },
  };
  KK.SLOTS = [
    { k: 'silah', n: 'Silah' },
    { k: 'zirh', n: 'Zırh' },
    { k: 'migfer', n: 'Miğfer' },
    { k: 'kalkan', n: 'Kalkan' },
  ];
  const ARMOR_NAMES = {
    hafif: {
      zirh: ['Deri Yelek', 'Sert Deri Zırh', 'Perçinli Deri', 'Kara Deri Zırh', 'Gölge Zırhı'],
      migfer: ['Deri Başlık', 'Sert Deri Başlık', 'Perçinli Başlık', 'Kara Başlık', 'Gölge Başlığı'],
      kalkan: ['Tahta Tokalak', 'Deri Tokalak', 'Perçinli Tokalak', 'Kara Tokalak', 'Gölge Tokalağı'],
    },
    dengeli: {
      zirh: ['Keten Zırh', 'Pullu Zırh', 'Zincir Zırh', 'Bronz Göğüslük', 'Lejyon Zırhı'],
      migfer: ['Bronz Takke', 'Bronz Miğfer', 'Sorguçlu Miğfer', 'Yanaklıklı Miğfer', 'Lejyon Miğferi'],
      kalkan: ['Tahta Kalkan', 'Deri Kaplı Kalkan', 'Bronz Kalkan', 'Demir Kalkan', 'Lejyon Kalkanı'],
    },
    agir: {
      zirh: ['Kalın Pullu Zırh', 'Demir Plaka', 'Lorica', 'Ağır Lorica', 'Kale Zırhı'],
      migfer: ['Demir Miğfer', 'Siperli Miğfer', 'Kapalı Miğfer', 'Murmillo Miğferi', 'Kale Miğferi'],
      kalkan: ['Ağır Tahta Kalkan', 'Scutum', 'Demir Scutum', 'Kule Kalkanı', 'Kale Kalkanı'],
    },
  };
  const TIER_PRICE = [70, 200, 450, 850, 1400];
  const BASE_ARM = { zirh: 3, migfer: 2, kalkan: 2 };
  const SERIES_MUL = { hafif: 0.6, dengeli: 1, agir: 1.5 };
  const SERIES_BLOCK = { hafif: 0.04, dengeli: 0.06, agir: 0.08 };
  KK.ARMOR = [];
  Object.keys(ARMOR_NAMES).forEach((series) => {
    ['zirh', 'migfer', 'kalkan'].forEach((slot) => {
      for (let t = 1; t <= 5; t++) {
        KK.ARMOR.push({
          id: `${slot}_${series}_${t}`,
          kind: slot, series, tier: t,
          n: ARMOR_NAMES[series][slot][t - 1],
          arm: Math.round(BASE_ARM[slot] * SERIES_MUL[series] * t),
          blk: slot === 'kalkan' ? Math.round((SERIES_BLOCK[series] + 0.015 * t) * 1000) / 1000 : 0,
          agi: series === 'hafif' ? Math.ceil(t / 2) : 0,
          enPen: series === 'agir' ? 4 : 0,
          p: TIER_PRICE[t - 1], arena: t - 1,
          icon: `assets/ikonlar/${slot}/${KK.SERIES[series].row * 5 + t}.png`,
        });
      }
    });
  });

  /* ---------- iksirler ---------- */
  KK.POTIONS = [
    { id: 'can', n: 'Can İksiri', d: 'Canının %35’ini yeniler.', p: 40, arena: 0 },
    { id: 'enerji', n: 'Enerji İksiri', d: 'Enerjinin %50’sini yeniler.', p: 30, arena: 0 },
    { id: 'gladyator', n: 'Gladyatör Kanı', d: '3 tur hasarın +%30.', p: 90, arena: 1 },
    { id: 'demirderi', n: 'Demir Deri', d: '3 tur aldığın hasar −%30.', p: 90, arena: 1 },
    { id: 'kanemici', n: 'Kan Emici İksir', d: '3 tur verdiğin hasarın %40’ı cana döner.', p: 140, arena: 2 },
    { id: 'olumsuzluk', n: 'Ölümsüzlük İksiri', d: 'Bu dövüşte ölümcül bir darbeyi bir kez engeller, 1 canla kalırsın.', p: 400, arena: 4 },
    { id: 'devkani', n: 'Dev Kanı', d: '4 tur en yüksek canın +%25, Savunman +5.', p: 200, arena: 3 },
    { id: 'vahsikan', n: 'Vahşi Kan', d: 'Sonraki saldırın iki kez vurur ama iki kat enerji harcar.', p: 140, arena: 2 },
    { id: 'zirhkiran', n: 'Zırh Kıran İksir', d: 'Sonraki saldırın rakibin zırh ve savunmasının %75’ini yok sayar.', p: 110, arena: 1 },
    { id: 'muhafiz', n: 'Muhafız İksiri', d: '25 + seviye × 3 hasarı emen bir kalkan verir.', p: 200, arena: 3 },
  ];
  KK.POTIONS.forEach((pt, i) => { pt.icon = `assets/ikonlar/iksir/${i + 1}.png`; });
  KK.potion = (id) => KK.POTIONS.find((p) => p.id === id) || null;
  KK.MAX_POTIONS_PER_FIGHT = 2;
  KK.MAX_POTION_STACK = 5;

  const ITEM_INDEX = {};
  KK.WEAPONS.concat(KK.ARMOR).forEach((it) => { ITEM_INDEX[it.id] = it; });
  KK.item = (id) => (id ? ITEM_INDEX[id] || null : null);

  /* ---------- başlangıç ---------- */
  KK.START_GOLD = 50;
  KK.START_OWNED = ['kilic_1', 'kalkan_dengeli_1'];
  KK.START_EQUIP = { silah: 'kilic_1', zirh: null, migfer: null, kalkan: 'kalkan_dengeli_1' };
  KK.START_POTIONS = { can: 1 };

  /* ---------- savaş tarzları ----------
     sprite: bu tarzdaki sıradan rakiplerin görseli (assets/sprites/<ad>/idle.png) */
  KK.STYLES = {
    dengeli: {
      n: 'Dengeli Dövüşçü', d: 'Her şeyi biraz yapar.',
      tip: 'Belirgin bir zaafı yok. Enerjini iyi yönet.',
      w: { str: 2, atk: 2, def: 1.5, agi: 1.5, vit: 1.5, sta: 1, cha: 0.5 },
      weapon: 'kilic', series: 'dengeli', step: 2, sprite: 'rakip2',
    },
    savunmaci: {
      n: 'Kalkanlı Savunmacı', d: 'Sık bloklar, dinlenip bekler.',
      tip: 'Kalkanı sık bloklar. Balta kalkanı delebilir; blok olmayan güçlü saldırılar çok acıtır.',
      w: { def: 3, vit: 2.5, str: 1.5, atk: 1, agi: 0.4, sta: 1.2, cha: 0.3 },
      weapon: 'kilic', series: 'agir', step: 2, blockBonus: 0.15, sprite: 'rakip5',
    },
    hancerci: {
      n: 'Çevik Hançerci', d: 'Turda iki hızlı vuruş yapar, sık kaçar.',
      tip: 'Zor isabet alır. Hızlı saldırının yüksek isabetini kullan.',
      w: { agi: 3, atk: 2.5, str: 1, vit: 1, sta: 1.3, def: 0.5, cha: 0.5 },
      weapon: 'hancer', series: 'hafif', step: 2, sprite: 'rakip1',
    },
    tokmakci: {
      n: 'Tokmakçı', d: 'Yavaş ama çok ağır vurur, enerjisi çabuk biter.',
      tip: 'Enerjisi doluyken yanında durma. Enerjisi bitince saldır.',
      w: { str: 3.2, vit: 2.2, def: 1, atk: 1, agi: 0.3, sta: 1, cha: 0.3 },
      weapon: 'tokmak', series: 'agir', step: 1, sprite: 'rakip3',
    },
    okcu: {
      n: 'Okçu', d: 'Uzaktan vurur, yaklaşınca geri kaçar.',
      tip: 'Hızla yaklaş ve onu duvara sıkıştır. Bitişikken zayıftır.',
      w: { atk: 3, agi: 2, str: 1, vit: 1, sta: 1.5, def: 0.5, cha: 0.5 },
      weapon: 'yay', series: 'hafif', step: 2, sprite: 'rakip4',
    },
  };

  /* ---------- arenalar ve maçlar ----------
     sceneAfter: maç kazanılınca oynayan sahne. intro: rakibin maç öncesi sözü.
     sprite: bu maçın rakibinin görseli. open: false olan arenalar henüz yapılmadı. */
  KK.ARENAS = [
    {
      id: 'a1', n: '1. Arena', open: true, bg: 'assets/arenalar/arena-1.webp',
      champion: 'Kalkanlı şampiyon',
      matches: [
        { id: 'a1m1', style: 'dengeli', lvl: 1 },
        { id: 'a1m2', style: 'savunmaci', lvl: 1 },
        { id: 'a1m3', style: 'hancerci', lvl: 2 },
        { id: 'a1m4', style: 'tokmakci', lvl: 2 },
        { id: 'a1m5', style: 'okcu', lvl: 3, sceneAfter: 'izleniyor' },
        { id: 'a1m6', style: 'dengeli', lvl: 5, name: 'Yaşlı Kurt Varro', tag: 'Tecrübeli Savaşçı', gearBonus: 1, sprite: 'varro', intro: 'Kusura bakma evlat. Benim özgürlüğüm bu maça bağlı.', sceneAfter: 'kazanmamaliydi' },
        { id: 'a1m7', style: 'savunmaci', lvl: 4, name: 'Demir Duvar Tiberius', tag: 'Arena Şampiyonu', champion: true, bonusPts: 6, gearBonus: 1, sprite: 'tiberius' },
      ],
    },
    { id: 'a2', n: '2. Arena', open: false, count: 9, champion: 'Çift hançerli, çevik şampiyon' },
    { id: 'a3', n: '3. Arena', open: false, count: 8, champion: 'Ağır tokmaklı şampiyon' },
    { id: 'a4', n: '4. Arena', open: false, count: 7, champion: 'Yay ustası' },
    { id: 'a5', n: '5. Arena', open: false, count: 8, champion: 'İmparatorun kılıç ustası' },
    { id: 'final', n: 'Final', open: false, count: 1, champion: 'İmparator Cassian' },
  ];
  KK.DEFAULT_ARENA_BG = 'assets/arenalar/arena-1.webp';

  KK.TUTORIAL_FOE = { id: 'egitim', style: 'dengeli', lvl: 1, name: 'Acemi Çırak', tag: 'Eğitim', sprite: 'rakip1' };

  const NAMES = ['Titus', 'Rufus', 'Kassius', 'Oktavius', 'Brutus', 'Verus', 'Spiculus', 'Priscus', 'Kalamus', 'Flamma', 'Tetraites', 'Hermes', 'Batu', 'Marcus', 'Severus', 'Nerva'];
  const EPITHETS = ['Boğa', 'Tilki', 'Kemik Kıran', 'Kum Faresi', 'Çelik Bilek', 'Yaralı', 'Sessiz', 'Kızıl', 'Deli', 'Taş Yumruk', 'Kurt', 'Akrep'];
  const TUNICS = ['#7a2420', '#2c4f69', '#56662c', '#a88443', '#4d2652', '#8a8272'];

  /* ---------- ödüller ---------- */
  KK.reward = (lvl, win, crowd) => {
    const gold = 25 + lvl * 20, xp = 35 + lvl * 20;
    if (!win) return { gold: Math.round(gold * 0.2), xp: Math.round(xp * 0.35), bonus: 0 };
    const bonus = Math.round(gold * crowd * 0.05);
    return { gold: gold + bonus, xp, bonus };
  };
  KK.TRAINING_REWARD_MUL = 0.3;
  KK.TUTORIAL_REWARD = { gold: 20, xp: 30 };

  /* ---------- hesaplamalar ---------- */
  KK.derive = (f) => {
    const s = f.stats, e = f.equip;
    const w = KK.item(e.silah) || KK.item('kilic_1');
    let armor = 0, block = 0, agiB = 0, enPen = 0;
    ['zirh', 'migfer', 'kalkan'].forEach((k) => {
      const it = KK.item(e[k]);
      if (!it) return;
      armor += it.arm; block += it.blk; agiB += it.agi; enPen += it.enPen;
    });
    const style = f.style ? KK.STYLES[f.style] : null;
    const wt = KK.WEAPON_TYPES[w.type];
    const agi = s.agi + agiB;
    return {
      maxHp: 30 + s.vit * 6 + f.lvl * 3,
      maxEn: Math.max(24, 40 + s.sta * 6 - enPen),
      armor, block: Math.min(0.45, block + (style && style.blockBonus ? style.blockBonus : 0)),
      wmin: w.min, wmax: w.max, wtype: w.type, range: wt.range,
      str: s.str, atk: s.atk, def: s.def, agi, cha: s.cha,
      rest: 18 + s.sta * 2,
      crit: Math.min(0.35, 0.04 + agi * 0.006 + wt.crit),
      agiBonus: agiB, enPen,
    };
  };

  /* küçük, tekrarlanabilir rastgele sayı üreteci: aynı maç hep aynı rakibi üretir */
  KK.seeded = (str) => {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* maç tanımından rakip üretir. wTier: silah kademesi (1–10), aTier: zırh kademesi (0–5) */
  KK.buildFoe = (def, wTier, aTier, seedKey) => {
    const r = KK.seeded(seedKey || def.id);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const st = KK.STYLES[def.style];
    const stats = {};
    KK.STATS.forEach((s) => { stats[s.k] = 3; });
    let pts = 16 + KK.POINTS_PER_LEVEL * (def.lvl - 1) + (def.bonusPts || 0);
    const entries = Object.entries(st.w);
    const tot = entries.reduce((a, e) => a + e[1], 0);
    while (pts-- > 0) {
      let x = r() * tot;
      for (const [k, w] of entries) { x -= w; if (x <= 0) { stats[k]++; break; } }
    }
    const wt = Math.max(1, Math.min(10, wTier)), at = Math.max(0, Math.min(5, aTier));
    const noShield = st.weapon === 'tokmak' || st.weapon === 'yay';
    const equip = {
      silah: `${st.weapon}_${wt}`,
      zirh: at > 0 ? `zirh_${st.series}_${at}` : null,
      migfer: at > 0 ? `migfer_${st.series}_${at}` : null,
      kalkan: noShield ? null : `kalkan_${st.series}_${Math.max(1, at)}`,
    };
    const look = {
      skin: pick(KK.LOOK.skin), hair: pick(KK.LOOK.hair),
      beard: pick(KK.LOOK.beard).k, scar: pick(KK.LOOK.scar).k, tunic: pick(TUNICS),
    };
    return {
      name: def.name || `${pick(NAMES)} “${pick(EPITHETS)}”`,
      tag: def.tag || null, champion: !!def.champion, intro: def.intro || null,
      lvl: def.lvl, style: def.style, stats, equip, look,
      sprite: def.sprite || st.sprite,
    };
  };

  KK.foeForMatch = (arenaIdx, matchIdx) => {
    const def = KK.ARENAS[arenaIdx].matches[matchIdx];
    const late = matchIdx >= 3 ? 1 : 0, bonus = def.gearBonus || 0;
    return KK.buildFoe(def, arenaIdx * 2 + 1 + late + bonus, arenaIdx + late + bonus, def.id);
  };

  KK.trainingFoe = (lvl, arenaIdx, n) => {
    const styles = Object.keys(KK.STYLES);
    const style = styles[n % styles.length];
    const def = { id: 'antrenman' + n, style, lvl: Math.max(1, lvl) };
    return KK.buildFoe(def, arenaIdx * 2 + 1, arenaIdx, def.id);
  };

  /* ---------- sahneler ----------
     img: assets/sahneler/<img>.png varsa gösterilir.
     Yoksa sahne, elimizdeki arka plan ve karakter görselleriyle kurulur:
     bg: 'sehir' | 'arena' | 'karanlik', chars: [[görsel, yatay konum 0–1, yön, gölge mi]]
     {ad} yerine oyuncunun adı yazılır. */
  KK.SCENES = {
    ihanet: {
      title: 'İhanet',
      panels: [
        { img: 'ihanet_1_ani', bg: 'ani', chars: [['tullus', 0.5, 1, true]], text: 'Bir kalabalığın uğultusu. Uzakta sana bakan bir adam. Havaya kalkan bir balta.' },
        { img: 'ihanet_1_ani', bg: 'ani', text: 'Bu anı yıllardır aklının bir köşesinde. Nereden geldiğini hiç bilmedin.' },
        { img: 'ihanet_2_yol', bg: 'sehir', chars: [['tullus', 0.36, 1], ['oyuncu', 0.62, -1]], speaker: 'Tullus', text: 'Hadi {ad}. Malzeme almaya gidiyoruz, geç kalmayalım.' },
        { img: 'ihanet_3_askerler', bg: 'sehir', chars: [['tiberius', 0.8, -1, true], ['tullus', 0.34, 1], ['oyuncu', 0.55, 1]], text: 'Yolun sonunda imparatorluk askerleri bekliyordu.' },
        { img: 'ihanet_3_askerler', bg: 'sehir', chars: [['tullus', 0.36, 1], ['oyuncu', 0.62, -1]], speaker: '{ad}', text: 'Tullus… Neden?' },
        { img: 'ihanet_3_askerler', bg: 'sehir', chars: [['tullus', 0.5, 1]], text: 'Tullus cevap vermedi. Gözlerini kaçırdı.' },
        { img: 'ihanet_4_livia', bg: 'sehir', chars: [['livia', 0.35, 1], ['oyuncu', 0.68, -1]], text: 'Zincire vurulurken Livia yetişti. Son kez göz göze geldiniz.' },
        { img: 'ihanet_5_pazar', bg: 'sehir', chars: [['oyuncu', 0.5, 1]], speaker: 'Köle tüccarı', text: 'Güçlü kollar, sağlam dişler! Arena için biçilmiş kaftan!' },
        { img: 'ihanet_5_pazar', bg: 'sehir', chars: [['oyuncu', 0.5, 1]], text: 'Arena görevlileri seni pazarlık bile etmeden satın aldı.' },
        { img: 'ihanet_6_ludus', bg: 'arena', chars: [['oyuncu', 0.5, 1]], text: 'Vesperum’daki ludus. Bundan sonra evin burası.' },
        { img: 'egitmen', bg: 'arena', chars: [['oyuncu', 0.5, 1]], speaker: 'Eğitmen', text: 'Burada yaşamak için kazanırsın. Göster bakalım neler biliyorsun.' },
      ],
    },
    egitim_son: {
      title: 'Ludus',
      panels: [
        { img: 'egitmen', bg: 'arena', chars: [['oyuncu', 0.5, 1]], speaker: 'Eğitmen', text: 'Fena değil. Yarın gerçek arenaya çıkacaksın.' },
        { img: 'egitmen', bg: 'sehir', chars: [['oyuncu', 0.5, 1]], speaker: 'Eğitmen', text: 'Kazandığın altını iyi harca. Demircide silah, zırhçıda zırh, iksircide iksir bulursun.' },
      ],
    },
    izleniyor: {
      title: 'İzleniyor',
      panels: [
        { img: 'izleniyor_1', bg: 'arena', chars: [['oyuncu', 0.5, 1]], text: 'Maçtan sonra gözün tribünlere kaydı.' },
        { img: 'izleniyor_2', bg: 'karanlik', chars: [['tiberius', 0.5, -1, true]], text: 'İmparator locasının gölgesinde biri seni izliyordu.' },
        { img: 'izleniyor_2', bg: 'karanlik', chars: [['tiberius', 0.5, -1, true]], speaker: 'Gölgedeki adam', text: 'Bu o.' },
        { img: 'izleniyor_2', bg: 'arena', chars: [['oyuncu', 0.5, 1]], text: 'Göz göze geldiğinizde adam gölgeye çekildi.' },
      ],
    },
    kazanmamaliydi: {
      title: 'Kazanmaması gerekiyordu',
      panels: [
        { img: 'kazanmamaliydi_1', bg: 'karanlik', chars: [['rakip2', 0.3, 1, true], ['rakip5', 0.7, -1, true]], text: 'Hücrene dönerken iki görevlinin fısıldaştığını duydun.' },
        { img: 'kazanmamaliydi_1', bg: 'karanlik', chars: [['rakip2', 0.3, 1, true], ['rakip5', 0.7, -1, true]], speaker: 'Görevli', text: 'Bu dövüşü kazanmaması gerekiyordu.' },
        { img: 'kazanmamaliydi_1', bg: 'karanlik', chars: [['rakip2', 0.3, 1, true], ['rakip5', 0.7, -1, true]], speaker: 'Diğer görevli', text: 'Sus. Duvarların kulağı var.' },
        { img: 'kazanmamaliydi_2', bg: 'karanlik', chars: [['oyuncu', 0.5, 1]], text: 'O rakip bir acemiye çıkarılacak biri değildi. Biri seni ölü görmek istiyor.' },
      ],
    },
  };

  KK.RESCUE_LINES = [
    'Son darbe inmeden görevliler araya girdi.',
    'Görevliler yine son anda dövüşü durdurdu. Neden seni hep kurtarıyorlar?',
  ];
})(window.KK);

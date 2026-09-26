/* Kılıç ve Kalkan: oyun verisi.
   Rakipler, eşyalar, arenalar ve sahne metinleri buradadır.
   Oyunu değiştirmek için çoğu zaman yalnızca bu dosyayı düzenlemek yeterlidir. */
window.KK = window.KK || {};
(function (KK) {
  'use strict';

  KK.SAVE_KEY = 'kilic-ve-kalkan-v1';

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

  /* ---------- görünüş ---------- */
  KK.LOOK = {
    skin: ['#f0c8a0', '#d9a577', '#b27a4f', '#7f4f33'],
    hair: ['#24160e', '#5a381b', '#9a5b28', '#cdb27a'],
    beard: [{ k: 'yok', n: 'Yok' }, { k: 'kisa', n: 'Kısa' }, { k: 'uzun', n: 'Uzun' }],
    scar: [{ k: 'yok', n: 'Yok' }, { k: 'yanak', n: 'Yanakta' }, { k: 'goz', n: 'Gözde' }],
  };
  KK.PLAYER_TUNIC = '#6e3a24';

  /* ---------- silahlar ---------- */
  KK.WEAPON_TYPES = {
    kilic: { n: 'Kılıç', d: 'Dengeli.', acc: 0, mul: 1, crit: 0, extraEn: 0 },
    hancer: { n: 'Hançer', d: 'Hızlı ve isabetli, düşük hasar.', acc: 0.12, mul: 0.85, crit: 0.05, extraEn: 0 },
    tokmak: { n: 'Tokmak', d: 'Yavaş ve ağır, düşük isabet. Saldırılar 3 enerji fazla harcar.', acc: -0.1, mul: 1.25, crit: 0, extraEn: 3 },
    yay: { n: 'Yay', d: 'Yalnızca okçular kullanır.', acc: -0.05, mul: 1, crit: 0, extraEn: 0 },
  };
  const W = (id, type, tier, n, min, max, p, lv) => ({ id, kind: 'silah', type, tier, n, min, max, p, lv });
  KK.WEAPONS = [
    W('kilic_0', 'kilic', 0, 'Tahta Kılıç', 2, 4, 0, 1),
    W('kilic_1', 'kilic', 1, 'Gladius', 4, 8, 120, 2),
    W('kilic_2', 'kilic', 2, 'Demir Gladius', 6, 11, 380, 5),
    W('kilic_3', 'kilic', 3, 'Spatha', 9, 15, 800, 9),
    W('kilic_4', 'kilic', 4, 'Lejyon Kılıcı', 12, 20, 1400, 13),
    W('hancer_0', 'hancer', 0, 'Paslı Hançer', 2, 4, 40, 1),
    W('hancer_1', 'hancer', 1, 'Pugio', 3, 7, 120, 2),
    W('hancer_2', 'hancer', 2, 'Çelik Pugio', 5, 9, 380, 5),
    W('hancer_3', 'hancer', 3, 'Sica', 7, 13, 800, 9),
    W('hancer_4', 'hancer', 4, 'Gölge Hançeri', 10, 17, 1400, 13),
    W('tokmak_0', 'tokmak', 0, 'Meşe Sopa', 3, 6, 50, 1),
    W('tokmak_1', 'tokmak', 1, 'Tokmak', 5, 10, 130, 2),
    W('tokmak_2', 'tokmak', 2, 'Çivili Topuz', 7, 14, 400, 5),
    W('tokmak_3', 'tokmak', 3, 'Savaş Baltası', 10, 19, 850, 9),
    W('tokmak_4', 'tokmak', 4, 'Kale Tokmağı', 14, 25, 1450, 13),
  ];

  /* ---------- zırh, miğfer, kalkan: üç seri ---------- */
  KK.SERIES = {
    hafif: { n: 'Hafif', d: 'Az koruma, Çeviklik bonusu.' },
    dengeli: { n: 'Dengeli', d: 'Orta koruma.' },
    agir: { n: 'Ağır', d: 'Yüksek koruma, parça başına 4 Enerji cezası.' },
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
  const TIER_LVL = [1, 3, 6, 10, 14];
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
          p: TIER_PRICE[t - 1], lv: TIER_LVL[t - 1],
        });
      }
    });
  });

  KK.POTIONS = {
    can: { n: 'Can İksiri', d: 'Canının %40’ını geri verir.', p: 40 },
    enerji: { n: 'Enerji İksiri', d: 'Enerjinin %50’sini geri verir.', p: 30 },
  };
  KK.MAX_POTIONS_PER_FIGHT = 2;

  const ITEM_INDEX = {};
  KK.WEAPONS.concat(KK.ARMOR).forEach((it) => { ITEM_INDEX[it.id] = it; });
  KK.item = (id) => (id ? ITEM_INDEX[id] || null : null);

  /* ---------- başlangıç ---------- */
  KK.START_GOLD = 50;
  KK.START_OWNED = ['kilic_0', 'kalkan_dengeli_1'];
  KK.START_EQUIP = { silah: 'kilic_0', zirh: null, migfer: null, kalkan: 'kalkan_dengeli_1' };

  /* ---------- savaş tarzları ---------- */
  KK.STYLES = {
    dengeli: {
      n: 'Dengeli Dövüşçü', d: 'Her şeyi biraz yapar.',
      tip: 'Belirgin bir zaafı yok. Enerjini iyi yönet.',
      w: { str: 2, atk: 2, def: 1.5, agi: 1.5, vit: 1.5, sta: 1, cha: 0.5 },
      weapon: 'kilic', series: 'dengeli', step: 2,
    },
    savunmaci: {
      n: 'Kalkanlı Savunmacı', d: 'Sık bloklar, dinlenip bekler.',
      tip: 'Kalkanı sık bloklar. Sabırlı ol, blok olmayan güçlü saldırılar çok acıtır.',
      w: { def: 3, vit: 2.5, str: 1.5, atk: 1, agi: 0.4, sta: 1.2, cha: 0.3 },
      weapon: 'kilic', series: 'agir', step: 2, blockBonus: 0.15,
    },
    hancerci: {
      n: 'Çevik Hançerci', d: 'Turda iki hızlı vuruş yapar, sık kaçar.',
      tip: 'Zor isabet alır. Hızlı saldırının yüksek isabetini kullan.',
      w: { agi: 3, atk: 2.5, str: 1, vit: 1, sta: 1.3, def: 0.5, cha: 0.5 },
      weapon: 'hancer', series: 'hafif', step: 2,
    },
    tokmakci: {
      n: 'Tokmakçı', d: 'Yavaş ama çok ağır vurur, enerjisi çabuk biter.',
      tip: 'Enerjisi doluyken yanında durma. Enerjisi bitince saldır.',
      w: { str: 3.2, vit: 2.2, def: 1, atk: 1, agi: 0.3, sta: 1, cha: 0.3 },
      weapon: 'tokmak', series: 'agir', step: 1,
    },
    okcu: {
      n: 'Okçu', d: 'Uzaktan vurur, yaklaşınca geri kaçar.',
      tip: 'Hızla yaklaş ve onu duvara sıkıştır. Yakında zayıftır.',
      w: { atk: 3, agi: 2, str: 1, vit: 1, sta: 1.5, def: 0.5, cha: 0.5 },
      weapon: 'hancer', series: 'hafif', step: 2, ranged: true,
    },
  };

  /* ---------- arenalar ve maçlar ----------
     sceneAfter: maç kazanılınca oynayan sahne.
     open: false olan arenalar henüz yapılmadı. */
  KK.ARENAS = [
    {
      id: 'a1', n: '1. Arena', open: true,
      champion: 'Kalkanlı şampiyon',
      matches: [
        { id: 'a1m1', style: 'dengeli', lvl: 1 },
        { id: 'a1m2', style: 'savunmaci', lvl: 1 },
        { id: 'a1m3', style: 'hancerci', lvl: 2 },
        { id: 'a1m4', style: 'tokmakci', lvl: 2 },
        { id: 'a1m5', style: 'okcu', lvl: 3, sceneAfter: 'izleniyor' },
        { id: 'a1m6', style: 'dengeli', lvl: 5, name: 'Yaşlı Kurt Varro', tag: 'Tecrübeli Savaşçı', gearBonus: 1, sceneAfter: 'kazanmamaliydi' },
        { id: 'a1m7', style: 'savunmaci', lvl: 4, name: 'Demir Duvar Tiberius', tag: 'Arena Şampiyonu', champion: true, bonusPts: 6, gearBonus: 1 },
      ],
    },
    { id: 'a2', n: '2. Arena', open: false, count: 9, champion: 'Çift hançerli, çevik şampiyon' },
    { id: 'a3', n: '3. Arena', open: false, count: 8, champion: 'Ağır tokmaklı şampiyon' },
    { id: 'a4', n: '4. Arena', open: false, count: 7, champion: 'Yay ustası' },
    { id: 'a5', n: '5. Arena', open: false, count: 8, champion: 'İmparatorun kılıç ustası' },
    { id: 'final', n: 'Final', open: false, count: 1, champion: 'İmparator Cassian' },
  ];

  KK.TUTORIAL_FOE = { id: 'egitim', style: 'dengeli', lvl: 1, name: 'Tahta Kılıçlı Çırak', tag: 'Eğitim' };

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
    const w = KK.item(e.silah) || KK.item('kilic_0');
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
      wmin: w.min, wmax: w.max, wtype: w.type,
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

  /* maç tanımından rakip üretir */
  KK.buildFoe = (def, tier, seedKey) => {
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
    const t = Math.max(0, Math.min(5, tier));
    const equip = {
      silah: `${st.weapon}_${Math.min(4, t)}`,
      zirh: t > 0 ? `zirh_${st.series}_${t}` : null,
      migfer: t > 0 ? `migfer_${st.series}_${t}` : null,
      kalkan: st.weapon === 'tokmak' || st.ranged ? null : `kalkan_${st.series}_${Math.max(1, t)}`,
    };
    const look = {
      skin: pick(KK.LOOK.skin), hair: pick(KK.LOOK.hair),
      beard: pick(KK.LOOK.beard).k, scar: pick(KK.LOOK.scar).k, tunic: pick(TUNICS),
    };
    const foe = {
      name: def.name || `${pick(NAMES)} “${pick(EPITHETS)}”`,
      tag: def.tag || null, champion: !!def.champion,
      lvl: def.lvl, style: def.style, stats, equip, look,
    };
    if (st.ranged) foe.bow = { min: 2 + def.lvl, max: 5 + Math.round(def.lvl * 1.5) };
    return foe;
  };

  KK.foeForMatch = (arenaIdx, matchIdx) => {
    const def = KK.ARENAS[arenaIdx].matches[matchIdx];
    const tier = arenaIdx + (matchIdx >= 3 ? 1 : 0) + (def.gearBonus || 0);
    return KK.buildFoe(def, tier, def.id);
  };

  KK.trainingFoe = (lvl, n) => {
    const styles = Object.keys(KK.STYLES);
    const style = styles[n % styles.length];
    const def = { id: 'antrenman' + n, style, lvl: Math.max(1, lvl) };
    return KK.buildFoe(def, Math.floor((lvl - 1) / 3), def.id);
  };

  /* ---------- sahneler ----------
     img: assets/sahneler/<img>.png varsa gösterilir, yoksa yer tutucu çizilir.
     {ad} yerine oyuncunun adı yazılır. */
  KK.SCENES = {
    ihanet: {
      title: 'İhanet',
      panels: [
        { img: 'ihanet_1_ani', text: 'Bir kalabalığın uğultusu. Uzakta sana bakan bir adam. Havaya kalkan bir balta.' },
        { img: 'ihanet_1_ani', text: 'Bu anı yıllardır aklının bir köşesinde. Nereden geldiğini hiç bilmedin.' },
        { img: 'ihanet_2_yol', speaker: 'Tullus', text: 'Hadi {ad}. Malzeme almaya gidiyoruz, geç kalmayalım.' },
        { img: 'ihanet_3_askerler', text: 'Yolun sonunda imparatorluk askerleri bekliyordu.' },
        { img: 'ihanet_3_askerler', speaker: '{ad}', text: 'Tullus… Neden?' },
        { img: 'ihanet_3_askerler', text: 'Tullus cevap vermedi. Gözlerini kaçırdı.' },
        { img: 'ihanet_4_livia', text: 'Zincire vurulurken Livia yetişti. Son kez göz göze geldiniz.' },
        { img: 'ihanet_5_pazar', speaker: 'Köle tüccarı', text: 'Güçlü kollar, sağlam dişler! Arena için biçilmiş kaftan!' },
        { img: 'ihanet_5_pazar', text: 'Arena görevlileri seni pazarlık bile etmeden satın aldı.' },
        { img: 'ihanet_6_ludus', text: 'Vesperum’daki ludus. Bundan sonra evin burası.' },
        { img: 'egitmen', speaker: 'Eğitmen', text: 'Burada yaşamak için kazanırsın. Göster bakalım neler biliyorsun.' },
      ],
    },
    egitim_son: {
      title: 'Ludus',
      panels: [
        { img: 'egitmen', speaker: 'Eğitmen', text: 'Fena değil. Yarın gerçek arenaya çıkacaksın.' },
        { img: 'egitmen', speaker: 'Eğitmen', text: 'Kazandığın altını iyi harca. Mağazada silah, zırh ve iksir bulursun.' },
      ],
    },
    izleniyor: {
      title: 'İzleniyor',
      panels: [
        { img: 'izleniyor_1', text: 'Maçtan sonra gözün tribünlere kaydı.' },
        { img: 'izleniyor_2', text: 'İmparator locasının gölgesinde biri seni izliyordu.' },
        { img: 'izleniyor_2', speaker: 'Gölgedeki adam', text: 'Bu o.' },
        { img: 'izleniyor_2', text: 'Göz göze geldiğinizde adam gölgeye çekildi.' },
      ],
    },
    kazanmamaliydi: {
      title: 'Kazanmaması gerekiyordu',
      panels: [
        { img: 'kazanmamaliydi_1', text: 'Hücrene dönerken iki görevlinin fısıldaştığını duydun.' },
        { img: 'kazanmamaliydi_1', speaker: 'Görevli', text: 'Bu dövüşü kazanmaması gerekiyordu.' },
        { img: 'kazanmamaliydi_1', speaker: 'Diğer görevli', text: 'Sus. Duvarların kulağı var.' },
        { img: 'kazanmamaliydi_2', text: 'O rakip bir acemiye çıkarılacak biri değildi. Biri seni ölü görmek istiyor.' },
      ],
    },
  };

  KK.RESCUE_LINES = [
    'Son darbe inmeden görevliler araya girdi.',
    'Görevliler yine son anda dövüşü durdurdu. Neden seni hep kurtarıyorlar?',
  ];
})(window.KK);

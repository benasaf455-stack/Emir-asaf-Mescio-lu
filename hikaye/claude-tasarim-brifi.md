# Kılıç ve Kalkan: Görsel Tasarım Brifi

Bu dosya, oyunun görsellerini tasarlayacak yapay zekâ içindir. Önce bunu oku, sonra istenen görseli yap.

## Oyun ne?

- **Kılıç ve Kalkan**, tarayıcıda oynanan, Swords and Sandals 2 tarzı bir gladyatör oyunu.
- Oyuncu arenada dövüşür, altın kazanır; şehirde silah, zırh ve iksir alır, seviye atlar.
- **Hikâye:** Aurelia İmparatorluğu'nun başkenti Vesperum. Genç bir adam, onu büyüten demirci Tullus tarafından imparatorluk askerlerine teslim edilir ve arenaya köle olarak satılır. Arenada kazandıkça babası Draven'ın geçmişini, ruhları ve ona kurulan tuzağı öğrenir.
- **Ton:** Karanlık ve ağır. Neşeli ya da çizgi film gibi değil.
- **Yapı:** 1 eğitim maçı, 5 arena ve 1 final, toplam 41 maç. Önemli maçlardan sonra kısa, resimli hikâye sahneleri gelir.

## Stil kuralları (en önemlisi)

1. **Piksel sanatı.** Görseller gerçek pikselli olmalı; yumuşak boya, bulanıklık ya da degrade olmamalı.
2. **Tutarlılık.** Yeni her görsel onaylanmış görsellerle aynı dünyadan görünmeli. Referans görseller bu projeye ekli.
3. **Karakterler:**
   - Gerçek çözünürlükte yaklaşık **110 piksel boyunda** olmalı.
   - Az renkli olmalı, kenarlarında temiz ve kesintisiz koyu bir çizgi olmalı.
   - Tam boy, ayakta, **sağa bakan** duruşta çizilmeli.
   - Arka plan **şeffaf** olmalı.
4. **Renkler:** Bronz, kan kırmızısı, sıcak toprak tonları ve derin gölgeler. Gökyüzü ve ışık gün batımı turuncusu.
5. **Arayüz renkleri** (pencere, çerçeve, buton):

| Ad | Renk |
| --- | --- |
| Arka plan | `#120c0a` |
| Panel | `#1d1411`, `#291c17` |
| Çizgi | `#4b3226`, `#6b4a36` |
| Yazı | `#efdcb8` |
| Soluk yazı | `#a88f70` |
| Bronz | `#c8842f`, `#e8b04f` |
| Kan | `#a3231d`, `#d33a2c` |
| Gölge | `#070403` |

6. **Yazı:** Görselin içine yazı koyma. Oyun yazıları kendisi ekler. Şehir menüsündeki başlık çerçevesi gibi, yazının geleceği yerler boş bırakılır.
7. **Onaylanmış görseller değiştirilmez.** Bir görsel beğenilmezse yenisi yapılır, eskisinin üstünde oynanmaz.

## Onaylanmış görseller

| Görsel | Dosya |
| --- | --- |
| Giriş ekranı | `giris-ekrani.webp` |
| Şehir menüsü | `sehir-menusu-v2.webp` |
| 1. Arena | `arena-1.webp` |
| Ana karakter | `ana-karakter-v2.png` |
| Livia (maskesiz ve maskeli) | `livia-v3.webp` |
| Tullus | `tullus.webp` |
| 1. Arena'nın 5 sıradan rakibi | `arena-1-siradan-5-rakip-v2.webp` |
| Yaşlı Kurt Varro | `yasli-kurt-varro.webp` |
| Demir Duvar Tiberius | `demir-duvar-tiberius.webp` |
| Silahlar: kılıç, hançer, balta, tokmak, mızrak, yay (her birinden 10) | `silahlar/*.webp` |
| Zırh, miğfer, kalkan (her birinden 15) | `ekipman/*.webp` |
| İksirler (10) | `iksirler.webp` |

### Karakterler
- **Ana karakter:** Genç, uzun kahve saçlı, alnında bant var. Deri kayışlar ve kol sargıları takar, belinde kırmızı peştamal var. Adını oyuncu verir.
- **Tullus:** Demirci, 50'li yaşlarda, iri yapılı. Kırlaşmış saç ve sakal, suçlu bir bakış, yanık lekeli deri önlük, elinde çekiç.
- **Livia:** Tullus'un 22 yaşındaki kızı. İnce ve çevik, saçı örgülü kahve, hafif deri zırh giyer, iki elinde birer hançer tutar. Arenada yarıklı demir maske ve başlık takar.
- **Varro:** Yaşlı köle gladyatör. Kır saç ve sakal, sol gözünün üstünde yara, omzunda kurt postu. Çentikli bir kılıç ve yuvarlak kalkan taşır.
- **Tiberius:** 1. Arena şampiyonu, çok iri. Demir miğfer takar, dev kırmızı kule kalkanı ve kısa kılıç taşır, belinde kan kırmızısı peştamal var.

## Eksik görseller (öncelik sırasıyla)

1. **Eğitmen:** Ludustaki sert, yaşlı eğitmen. Eğitim maçından önce ve sonra konuşur. Ayrıntılar karakter kurallarındaki gibi.
2. **Dükkân pencereleri:** Demirci, Zırhçı, İksirci, Arena ve Eğitim. Açılan pencerenin çerçevesi ve arka planı.
   - Ortası sade ve koyu olmalı; eşya listesi oyun tarafından üstüne yazılır.
   - Üstte başlık için boş bir alan bırakılmalı.
   - Oran 16:10.
3. **Dövüş arayüzü:** Can ve enerji çubuklarının çerçeveleri, hamle butonları (boş, ikonsuz ya da tek ikonlu), seyirci göstergesi.
4. **Hikâye sahneleri:** 16:9, geniş, çizgi roman paneli gibi.
   - İhanet: bulanık idam anısı; Tullus ile yolda; yolun sonunda askerler; Livia'yla son bakış; köle pazarı; ludus.
   - İzleniyor: imparator locasının gölgesinde biri oyuncuyu işaret eder, "Bu o."
   - Kazanmaması gerekiyordu: karanlık koridorda fısıldaşan iki görevli.
   - Gece taşınan cesetler; kapalı miğferli, sessiz bir savaşçı.
   - Gizli buluşma: Livia, Ruh Hançeri'ni verir.
   - Hançer Anısı I, II ve III: Draven'ın anıları (idam; arenadaki ritüel; baskın gecesi ve kaçan ruh).
   - İlan: Cassian arenaya iner.
   - Özgürlük.
5. **Arenalar:** 2., 3., 4. ve 5. arena, gece arenası (gizli ruh maçı) ve final arenası. Hepsi `arena-1.webp` ile aynı açıdan ve düzende olmalı: yandan görünüş, altta düz kum zemin.
6. **Rakipler:**
   - 2.–5. arenaların sıradan rakipleri.
   - Şampiyonlar: çift hançerli çevik şampiyon, ağır tokmaklı şampiyon, yay ustası, imparatorun kılıç ustası.
   - Final: Cassian (insan hâli ve ruhların dönüştürdüğü yaratık hâli).

## Teslim şekli

- **Karakter ve eşya:** Şeffaf arka planlı PNG. Karakterleri ayrı ayrı, eşyaları eşit aralıklı bir ızgarada teslim et.
- **Kod ile çizim** (resim üretemiyorsan): Pikselleri **SVG** olarak ver.
  - `viewBox` gerçek piksel boyutu olmalı; örnek: karakter için `0 0 80 120`.
  - Her piksel bir kare olmalı ve `shape-rendering="crispEdges"` kullanılmalı.
  - Renk sayısı az tutulmalı.
  - Oyun tarafında PNG'ye çevrilir.
- **Tek seferde tek görsel:** Bir görsel yap, onay al, sonra sıradakine geç.

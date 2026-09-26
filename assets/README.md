# Görsel Rehberi (PixelLab)

Bütün görsellerin birbirine uyması için PixelLab'de hep aynı ayarları kullan. Bir dosya eklenmediği sürece oyun o görselin yerine basit bir piksel yer tutucu çizer, yani görselleri tek tek ekleyebilirsin.

## Ortak kurallar

- **Görünüm:** yandan (side view). Karakter **sağa** bakar; oyun gerektiğinde sola çevirir.
- **Kare boyutu:** her karakter için **64×64 piksel**. Karakter karenin içinde yaklaşık 44–48 piksel boyunda olsun, ayakları karenin altına yakın dursun.
- **Arka plan:** saydam (transparent PNG).
- **Kenar çizgisi:** 1 piksel koyu çizgi. Yumuşatma (anti-aliasing) olmasın.
- **Işık:** her görselde aynı yönden, sol üstten.
- **Tutarlılık için:** İlk olarak ana karakteri üret, sonra diğer bütün karakterlerde onu **stil referansı** olarak kullan.

## Renk paleti

Oyunun arayüzü bu renkleri kullanıyor. Görsellerde de bunlara yakın kalmak uyumu artırır.

| Renk | Kod | Nerede |
| --- | --- | --- |
| Gece | `#120c0a` | En koyu gölge, arka plan |
| Koyu kahve | `#291c17` | Paneller, gölgeler |
| Bronz | `#c8842f` | Metal, süs, vurgu |
| Açık bronz | `#e8b04f` | Parlak metal, altın |
| Kan kırmızısı | `#a3231d` | Kan, sancak, tunik |
| Parlak kırmızı | `#d33a2c` | Vurgu kırmızısı |
| Parşömen | `#efdcb8` | Açık tonlar, kumaş |
| Kum | `#c49a62` | Arena zemini |

## Karakter animasyonları

Her animasyon **ayrı bir PNG dosyasıdır**. Kareler soldan sağa, yan yana dizilir.

| Animasyon | Dosya adı | Önerilen kare sayısı |
| --- | --- | --- |
| Bekleme | `idle.png` | 4 |
| Yürüme | `walk.png` | 6 |
| Saldırı | `attack.png` | 6 |
| Darbe alma | `hurt.png` | 2 |
| Düşme | `death.png` | 4 |

Yalnızca `idle.png` zorunludur; diğerleri yoksa oyun bekleme animasyonunu kullanır.

## 1. parça için gereken karakterler

Her karakter kendi klasörüne girer: `assets/sprites/<klasör>/idle.png` gibi.

| Klasör | Karakter |
| --- | --- |
| `oyuncu` | Ana karakter. **Eklendi:** `oyuncu/idle.png` (144×240, önden görünüm, tek kare). Orijinali `oyuncu/orijinal.png`. |
| `dengeli` | Kılıçlı, orta zırhlı gladyatör |
| `savunmaci` | Büyük kalkanlı, ağır zırhlı gladyatör |
| `hancerci` | Hafif zırhlı, çevik hançerci |
| `tokmakci` | İri, ağır tokmaklı gladyatör |
| `okcu` | Hafif zırhlı okçu, yaylı |
| `a1m6` | Yaşlı Kurt Varro: yaşlı, yara izli, tecrübeli savaşçı |
| `a1m7` | Demir Duvar Tiberius: 1. Arena şampiyonu, dev kalkanlı |

## Arayüz görselleri

| Dosya | Nerede |
| --- | --- |
| `arayuz/giris.webp` | Giriş ekranı (1672×941). Üzerindeki dört buton oyunda tıklanır alanlardır; butonların yeri değişirse `css/style.css` içindeki `.hot` ayarı ve `index.html` içindeki `top` değerleri güncellenmeli. |

## Sahne görselleri

- **Boyut:** 320×180 piksel (16:9).
- **Klasör:** `assets/sahneler/`

| Dosya | Sahnede ne var |
| --- | --- |
| `ihanet_1_ani.png` | Bulanık anı: kalabalık, uzakta bakan bir adam, kalkan balta |
| `ihanet_2_yol.png` | Tullus ve ana karakter yolda |
| `ihanet_3_askerler.png` | Yolun sonunda bekleyen imparatorluk askerleri |
| `ihanet_4_livia.png` | Zincirlenen ana karakter, yetişen Livia |
| `ihanet_5_pazar.png` | Vesperum köle pazarı |
| `ihanet_6_ludus.png` | Ludus (gladyatör okulu) |
| `egitmen.png` | Ludus eğitmeni |
| `izleniyor_1.png` | Maç sonrası arena, tribünler |
| `izleniyor_2.png` | İmparator locasının gölgesinde izleyen adam |
| `kazanmamaliydi_1.png` | Karanlık koridorda fısıldaşan iki görevli |
| `kazanmamaliydi_2.png` | Hücresinde düşünen ana karakter |

## Dosyaları ekleme

Dosyaları bu klasörlere koyduktan sonra bana haber ver; `js/sprites.js` içindeki listeye ben eklerim. Sahne görselleri doğru adla konunca kendiliğinden görünür.

## Açık soru

Oyuncu mağazadan zırh, miğfer ve kalkan aldıkça görünüşü değişmeli mi? Değişecekse karakterin gövde, zırh, miğfer ve kalkan için ayrı katmanlar hâlinde çizilmesi gerekir. Bu daha fazla görsel demek. Bunu görsellere başlamadan önce konuşalım.

# Beyin Sprinti – Shorts Montaj Aracı

Beğendiğin videoyu ve yorumları verirsin; araç videoyu **Beyin Sprinti** çerçevesine
yerleştirir ve yorumları Instagram tarzı kartlar olarak istediğin saniyelerde gösterir.

Çıktı: 1080×1920, 30 fps, MP4 (YouTube Shorts formatı).

## Gerekenler

- Python 3 + Pillow (`pip install pillow`)
- FFmpeg

## Kullanım

1. Bir klasöre videoyu koy (ör. `video.mp4`).
2. Yanına bir `proje.json` yaz (örnek: [`ornek/proje.json`](ornek/proje.json)).
3. Çalıştır:

```bash
python3 shorts/montaj.py klasor/proje.json
```

## proje.json alanları

| Alan | Açıklama |
|---|---|
| `video` | Kaynak video dosyası |
| `cikti` | Oluşacak dosyanın adı (varsayılan `cikti.mp4`) |
| `yorumlar` | Gösterilecek yorumların listesi |

Her yorum için:

| Alan | Zorunlu mu | Açıklama |
|---|---|---|
| `kullanici` | evet | Kullanıcı adı |
| `yorum` | evet | Yorum metni (emoji desteklenir 💪) |
| `begeni` | hayır | Beğeni sayısı, ör. `"1.835"` |
| `zaman` | hayır | Kullanıcı adının yanındaki süre (varsayılan `8h`) |
| `onayli` | hayır | `true` ise mavi tik çıkar |
| `avatar` | hayır | Profil resmi dosyası; yoksa gri boş profil resmi kullanılır |
| `baslangic` | hayır | Kartın çıkacağı saniye. Verilmezse yorumlar videoya eşit dağıtılır |
| `sure` | hayır | Kartın ekranda kalacağı süre (varsayılan 2 sn) |

## AI seslendirme (ElevenLabs)

`ELEVENLABS_API_KEY` ortam değişkeni tanımlıysa her yorum, kartı ekrana geldiği anda
AI sesiyle okunur. Okuma sırasında videonun kendi sesi kısılır, kart da okuma bitene
kadar ekranda kalır.

- Ses seçmek için: `proje.json` içine `"ses_id": "..."` yaz (ElevenLabs'teki Voice ID).
  Tek bir yoruma farklı ses vermek için o yoruma `"ses_id"` ekle.
- Seslendirmeyi kapatmak için: `"seslendirme": false`

## Dosyalar

- `montaj.py`: montaj aracı
- `assets/logo.png`: kanal logosu (değiştirmek için aynı adla yeni bir kare PNG koy)
- `assets/fonts/`: Inter ve Noto Color Emoji yazı tipleri (SIL Open Font License)

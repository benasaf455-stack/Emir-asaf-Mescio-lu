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
| `ses` | hayır | Hazır ses dosyası (ör. CapCut'ta üretilmiş `1.mp3`). Verilirse ElevenLabs kullanılmaz |

## AI seslendirme

İki ses motoru var, `proje.json` içinde `"ses_motoru"` ile seçilir:

- `"chatterbox"` (varsayılan): Ücretsiz, açık kaynak. `assets/ses_ornegi.mp3` içindeki
  sesi (CapCut "Kalın erkek sesi") taklit eder. Başka bir örnek için `"ses_ornegi": "dosya.mp3"`.
  Kurulum ve gerekli ağ izinleri için `ses_chatterbox.py` dosyasının başına bakın
  (`huggingface.co`, `*.hf.co`, `download.pytorch.org`).
- `"elevenlabs"`: ElevenLabs API (aşağıya bakın).

### ElevenLabs

Her yorum, kartı ekrana geldiği anda AI sesiyle okunur. Varsayılan olarak video o anda
**donar**, okuma bitince kaldığı yerden devam eder (video bu kadar uzar).

- Donmayı kapatmak için: `"video_dursun": false`. Bu durumda video akmaya devam eder,
  okuma sırasında videonun kendi sesi kısılır.

- Ses seçmek için: `proje.json` içine `"ses_id": "..."` yaz (ElevenLabs'teki Voice ID).
  Tek bir yoruma farklı ses vermek için o yoruma `"ses_id"` ekle.
- Seslendirmeyi kapatmak için: `"seslendirme": false`
- Anahtar: `ELEVENLABS_API_KEY` ortam değişkeni (Claude bulut ortamında gizli anahtar olarak tanımlıysa gerekmez).

## Dosyalar

- `montaj.py`: montaj aracı
- `assets/logo.png`: kanal logosu (değiştirmek için aynı adla yeni bir kare PNG koy)
- `assets/fonts/`: Inter ve Noto Color Emoji yazı tipleri (SIL Open Font License)

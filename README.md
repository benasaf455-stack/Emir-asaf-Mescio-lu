# Kılıç ve Kalkan

Tarayıcıda oynanan, piksel görünümlü bir gladyatör oyunu. Oyun arena dövüşü, karakter gelişimi ve ekipman üzerine kurulu.

## Oynamak

`index.html` dosyasını bir tarayıcıda aç. Kurulum gerekmez.

**Şu anki durum (iskelet):** karakter oluşturma, açılış sahnesi, eğitim dövüşü, şehir menüsü (Arena, Mağaza, Ekipman, Karakter, Eğitim Alanı) ve 1. Arena'nın 7 maçı oynanabilir. 2.–5. Arena ile final sonraki parçalarda eklenecek. Görseller şimdilik yer tutucu.

## Dosyalar

| Yol | İçerik |
| --- | --- |
| `index.html` | Sayfa |
| `css/style.css` | Piksel arayüz |
| `js/data.js` | Oyun verisi: özellikler, silahlar, zırh serileri, iksirler, savaş tarzları, arenalar, sahne metinleri |
| `js/sprites.js` | Görseller: PixelLab sprite tanımları ve yer tutucu karakterler |
| `js/engine.js` | Arena çizimi, dövüş kuralları, rakip yapay zekâsı, eğitim adımları |
| `js/scenes.js` | Hikâye sahnesi oynatıcısı |
| `js/ui.js` | Ekranlar, kayıt ve oyun akışı |
| `assets/` | Görseller ve [görsel rehberi](assets/README.md) |

## Belgeler

- [Hikâye](hikaye/hikaye.md): oyunun başlangıcına kadar olan hikâye
- [Hikâye kararları](hikaye/kararlar.md): hikâyedeki açık noktalar için verilen kararlar
- [Oynanış akışı](hikaye/oynanis-akisi.md): eğitim, 5 arena ve final; 41 maçlık sıralama ve hikâye sahneleri
- [Tasarım](hikaye/tasarim.md): görünüm, sahneler, cihazlar ve ses
- [Görsel rehberi](assets/README.md): PixelLab için boyutlar, palet ve gereken görseller

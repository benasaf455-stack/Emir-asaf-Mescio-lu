# Kılıç ve Kalkan: Oynanış Akışı

Oyunun asıl işi arena dövüşü, karakter gelişimi ve ekipman almaktır. Hikâye yalnızca önemli karşılaşmalarda, kısa ve atlanabilir sahnelerle ilerler.

## Temel kurallar

- **Yapı:** 1 eğitim maçı, 5 arena ve 1 final. Toplam **41 zorunlu karşılaşma** var.
- **Şehir menüsü** oyunun merkezidir: Arena, Mağaza, Ekipman, Karakter (puan dağıtma) ve Eğitim Alanı. Oyuncu maçlar arasında buraya istediği kadar döner.
- **Kilit:** Bir arenanın şampiyonu yenilmeden sonraki arena açılmaz.
- **Ödül:** Her maç altın ve tecrübe verir. Seviye atlayınca oyuncu puanlarını kendisi dağıtır.
- **Yenilgi:** İlerleme silinmez. Oyuncu hazırlanıp aynı maçı tekrar dener. Hikâye sahnesi yalnızca kazanınca açılır.
  - Hikâyedeki sebep: Görevliler dövüşü son anda durdurur, çünkü Cassian onu canlı istiyor.
- **Ek dövüşler:** Eğitim Alanı'nda isteğe bağlı dövüşler yapılabilir, ödülleri zorunlu maçlardan azdır. Hikâyeyi bitirmek için tekrar tekrar dövüşmek gerekmez; ödüller zorunlu maçlarla yetecek şekilde ayarlanır.
- **Kayıt:** Her maçtan sonra otomatik kaydedilir.

## Karakter

- Oyuncu erkek gladyatöre isim verir.
- Görünüş seçeneği yok: ana karakterin görseli sabittir (`assets/sprites/oyuncu/idle.png`). Karakter oluşturma ekranında oyuncu yalnızca adını yazar ve puanlarını dağıtır; görsel yanında büyükçe durur.
- Özellikler:

| Özellik | Etkisi |
| --- | --- |
| Güç | Hasar |
| Saldırı | İsabet |
| Savunma | Alınan hasarı azaltır |
| Çeviklik | Kaçınma ve kritik vuruş |
| Canlılık | Can |
| Dayanıklılık | Enerji ve dinlenme |
| Karizma | Alay etme ve seyirci |

- **Seyirci göstergesi:** Karizma, alay etme ve etkileyici vuruşlarla dolar; dolu gösterge daha çok altın getirir. Finalde seyirci Cassian'ı destekler ve gösterge oyuncunun aleyhine işler.

## Dövüş

- Hamleler: İlerle, Geri Çekil, Hızlı / Normal / Güçlü Saldırı, Alay Et, Dinlen, İksir, Ruh Hançeri.
- **Otomatik savunma:** Kalkanın blok şansı, zırh ve Savunma özelliği kendiliğinden devreye girer.
- **Enerji:** Saldırılar enerji harcar, Dinlen enerji toplar.
- **İksirler:** 10 çeşit (aşağıda, Mağaza bölümünde). İçmek bir tur harcar, dövüş başına en fazla 2 iksir kullanılır.
- **Ruh Hançeri:** Silah yuvasına girmez, 3. Arena'daki gizli buluşmadan sonra özel hamle olarak açılır. Yalnızca ruh aşamalarında işe yarar; bedeni olmayan bir ruha zarar verebilen tek silahtır.
- **Rakip tarzları:** Normal rakipler aynı rakibin daha fazla canlı kopyası değildir. Her tarz farklı bir taktik ister:

| Tarz | Nasıl dövüşür | Oyuncudan ne ister |
| --- | --- | --- |
| Kalkanlı savunmacı | Sık bloklar, dinlenip bekler | Güçlü saldırı, sabır |
| Çevik hançerci | Turda iki hızlı vuruş, sık kaçar | İsabet, hızlı saldırı |
| Tokmakçı | Yavaş ama çok ağır vurur, enerjisi çabuk biter | Mesafe, geri çekilip bekleme |
| Okçu | Uzaktan vurur, yaklaşınca geri kaçar | Hızla yaklaşma |

## Mağaza

- **Silahlar:** Altı tür var, her türden 10 görsel geldi (`assets/gelen/silahlar/`). Her tür farklı oynar:

| Tür | Tarz |
| --- | --- |
| Kılıç | Dengeli |
| Hançer | Hızlı ve isabetli |
| Tokmak | Ağır vurur, sersemletme şansı var |
| Balta | Ağır vurur, kalkanı delme şansı var |
| Mızrak | 2 adım uzaktan vurabilir |
| Yay | Oyuncu da kullanabilir; uzaktan vurur ama yakında zayıftır |

- **Kademeler:** Her silah türünün **10 kademesi** var. Her arenada her türden 2 yeni silah açılır (1. Arena: 1–2. kademe, 5. Arena: 9–10. kademe). Sıradan silahlar (tahta, pas, demir) ilk arenalarda, parlayan büyülü silahlar son arenalarda açılır. Görseller her tür için soldan sağa, üst sıradan alt sıraya kademe sırasıyla kullanılır.

- **Üç ekipman serisi** (zırh, miğfer, kalkan), her biri kademe kademe gelişir:

| Seri | Özelliği |
| --- | --- |
| Hafif | Az koruma, çeviklik bonusu |
| Dengeli | Orta koruma |
| Ağır | Yüksek koruma, enerji cezası |

- **İksirler:** 10 çeşit. Görseller `assets/gelen/iksirler.webp` içinde aynı sırayla durur (üst sıra soldan sağa 1–5, alt sıra 6–10). Sayılar ilk öneridir, oynarken ayarlanabilir.

| # | İksir | Etkisi | Sayılar (öneri) | Açıldığı arena |
| --- | --- | --- | --- | --- |
| 1 | Can İksiri | Kullanıldığında can yeniler. | Canın %35'i | 1 |
| 2 | Enerji İksiri | Kullanıldığında enerji yeniler. | Enerjinin %50'si | 1 |
| 3 | Gladyatör Kanı | Birkaç tur saldırı gücünü artırır. | 3 tur, hasar +%30 | 2 |
| 4 | Demir Deri | Birkaç tur alınan hasarı azaltır. | 3 tur, alınan hasar −%30 | 2 |
| 5 | Kan Emici İksir | Birkaç tur verilen hasarın bir kısmını cana dönüştürür. | 3 tur, verilen hasarın %40'ı | 3 |
| 6 | Ölümsüzlük İksiri | Ölümcül bir darbeyi bir kez engeller. | O dövüşte bir kez, 1 canla kalırsın | 5 |
| 7 | Dev Kanı | Birkaç tur maksimum canı ve savunmayı artırır. | 4 tur, en yüksek can +%25, Savunma +5 | 4 |
| 8 | Vahşi Kan | Sonraki saldırıyı iki kez vurdurur; daha fazla enerji harcar. | Sonraki saldırı 2 kez vurur, enerjisi 2 katı | 3 |
| 9 | Zırh Kıran İksir | Sonraki saldırının düşman savunmasının büyük kısmını yok saymasını sağlar. | Zırh ve Savunmanın %75'i yok sayılır | 2 |
| 10 | Muhafız İksiri | Belirli miktarda hasarı emen geçici bir kalkan verir. | 25 + seviye × 3 hasar emer | 4 |

## Maç sıralaması

### Karakter oluşturma → Sahne 1: İhanet
- **Sahne 1:** Bulanık idam anısı, Tullus'un ihaneti ("Neden?"), Livia ile son bakış, köle pazarı, arenaya getiriliş.
- **Sonra:** Eğitim.

### Eğitim (1 maç)
- Rakip: tahta silahlı bir rakip.
- Öğretilenler: hareket, saldırı türleri, otomatik savunma, enerji ve Dinlen.
- **Sonra:** Şehir menüsü ilk kez açılır.

### 1. Arena (7 maç)
| Maç | Rakip |
| --- | --- |
| 1–5 | Normal rakipler |
| — | **Sahne 2: İzleniyor.** Locadaki biri onu işaret eder: "Bu o." |
| 6 | **Tecrübeli savaşçı (ayarlanmış maç).** Rakip beklenenden çok güçlü. Maçtan sonra **Sahne 3: "Kazanmaması gerekiyordu."** |
| 7 | **Şampiyon:** kalkanlı şampiyon |

### 2. Arena (9 maç)
| Maç | Rakip |
| --- | --- |
| 1–8 | Normal rakipler, farklı savaş tarzları |
| 9 | **Şampiyon:** çift hançerli, çevik şampiyon. Maçtan sonra **Sahne 4: Gece taşınan cesetler**; kapalı miğferli, ses çıkarmayan bir savaşçı görülür. |

### 3. Arena (8 maç)
| Maç | Rakip |
| --- | --- |
| 1–5 | Normal rakipler |
| 6 | **Livia** (maskeli). Dövüş belli bir can seviyesinde durur, maskesi düşer. Maçtan sonra **Sahne 5: Gizli buluşma.** Livia tehdidi, Draven'ı ve hainlik suçlamasının nedenini anlatır, Ruh Hançeri'ni verir. **Sahne 6: Hançer Anısı I.** İdam anısı netleşir. |
| 7 | **Gizli ruh karşılaşması.** Gece, seyircisiz bir "özel maç". Dövüşün ortasında beden çöker, ruh çıkar; ruha yalnızca Ruh Hançeri zarar verir. Görevliler sonra hiçbir şey olmamış gibi davranır. |
| 8 | **Şampiyon:** ağır tokmaklı şampiyon |

### 4. Arena (7 maç)
| Maç | Rakip |
| --- | --- |
| 1–6 | Normal rakipler |
| 7 | **Şampiyon:** yay ustası. Maçtan sonra **Sahne 7: Hançer Anısı II.** Draven arenadaki ritüeli, Valerius ile iblisin görüşmesini görür. |

### 5. Arena (8 maç)
| Maç | Rakip |
| --- | --- |
| 1–7 | Normal rakipler |
| 8 | **Şampiyon:** imparatorun kılıç ustası. Maçtan sonra **Sahne 8: Hançer Anısı III** (baskın gecesi, kaçan ruh) ve **Sahne 9: İlan** (Cassian arenaya iniyor). |

### Final (1 maç)
- **Aşama 1:** İnsan hâlindeki Cassian, kalabalık arenada. Seyirci Cassian'ı destekler.
- **Aşama 2:** Ruhların dönüştürdüğü yaratık Cassian. Seyirciler kaçar, arena kararır; Livia kalır ve kısa bir an görünür.
  - Aşama 2'nin sonunda Cassian ölür, ruh kaçmaya çalışır ve oyuncu Ruh Hançeri ile son darbeyi vurur. Bu ayrı bir aşama değil, bir bitirme hamlesidir.
- **Sahne 10: Özgürlük.** Sözleşmenin izleri ve annenin sırrı açık kalır.
- **Sonra:** Jenerik, ardından şehir menüsü. İsteyen oyuncu ek dövüşlere devam eder.

## Sayım

| Bölüm | Maç |
| --- | --- |
| Eğitim | 1 |
| 1. Arena | 7 |
| 2. Arena | 9 |
| 3. Arena | 8 |
| 4. Arena | 7 |
| 5. Arena | 8 |
| Final | 1 |
| **Toplam** | **41** |

#!/usr/bin/env python3
"""Beyin Sprinti Shorts montaj aracı.

Bir videoyu ve seçilen yorumları alır; videoyu kanal çerçevesine yerleştirip
Instagram tarzı yorum kartlarını belirlenen saniyelerde ekrana basar.

Kullanım:
    python3 shorts/montaj.py proje.json

proje.json örneği için shorts/ornek/proje.json dosyasına bakın.
"""

import json
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request

from PIL import Image, ImageDraw, ImageFont

KOK = os.path.dirname(os.path.abspath(__file__))
VARLIK = os.path.join(KOK, "assets")
FONT = os.path.join(VARLIK, "fonts")

# Şablon ölçüleri (referans videodan ölçüldü, 1080x1920)
GEN, YUK = 1080, 1920
ARKA_PLAN = (253, 253, 253)
LOGO_MERKEZ, LOGO_YARICAP = (165, 148), 101
BASLIK_XY = (298, 103)
VIDEO_KUTU = (107, 283, 866, 1540)  # x, y, genişlik, yükseklik
KART_MERKEZ_Y = 1208

KART_RENK = (27, 28, 33)
GRI = (168, 168, 172)
BEYAZ = (245, 245, 245)
MAVI_TIK = (0, 149, 246)

VARSAYILAN_SURE = 2.0

# AI seslendirme (ElevenLabs). Anahtar ELEVENLABS_API_KEY ortam değişkeninden okunur;
# Claude bulut ortamında ise anahtarı ağ katmanı (gizli anahtar) kendisi ekler, o yüzden
# değişken boş olsa da istek gönderilir.
ELEVENLABS_ANAHTAR = os.environ.get("ELEVENLABS_API_KEY", "").strip()
VARSAYILAN_SES_ID = os.environ.get("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")
ORJINAL_SES_KISIK = 0.25  # yorum okunurken videonun kendi sesi bu seviyeye iner
DURAKLAMA_PAYI = 0.4  # okuma bittikten sonra video devam etmeden önceki kısa bekleme


def font(ad, boyut):
    return ImageFont.truetype(os.path.join(FONT, ad), boyut)


def emoji_mi(ch):
    o = ord(ch)
    return (
        o >= 0x1F000
        or 0x2600 <= o <= 0x27BF
        or 0x2B00 <= o <= 0x2BFF
        or o in (0x200D, 0xFE0F)
    )


def parcala(metin):
    """Metni (emoji_mi, parça) gruplarına ayırır."""
    parcalar = []
    for ch in metin:
        e = emoji_mi(ch)
        if parcalar and parcalar[-1][0] == e:
            parcalar[-1][1] += ch
        else:
            parcalar.append([e, ch])
    return parcalar


class MetinCizici:
    """Normal yazı ile renkli emojiyi aynı satırda çizer."""

    EMOJI_BOYUT = 109  # Noto Color Emoji yalnızca bu boyutta yüklenebiliyor

    def __init__(self):
        self.emoji_font = font("NotoColorEmoji.ttf", self.EMOJI_BOYUT)

    def _emoji_resmi(self, parca, yukseklik):
        gen = round(self.emoji_font.getlength(parca)) + 10
        resim = Image.new("RGBA", (gen, self.EMOJI_BOYUT + 40), (0, 0, 0, 0))
        ImageDraw.Draw(resim).text(
            (0, 0), parca, font=self.emoji_font, embedded_color=True
        )
        resim = resim.crop(resim.getbbox() or (0, 0, 1, 1))
        oran = yukseklik / resim.height
        return resim.resize(
            (max(1, round(resim.width * oran)), yukseklik), Image.LANCZOS
        )

    def genislik(self, metin, f):
        toplam = 0
        for e, p in parcala(metin):
            if e:
                toplam += self._emoji_resmi(p, round(f.size * 1.05)).width + 4
            else:
                toplam += f.getlength(p)
        return round(toplam)

    def ciz(self, resim, xy, metin, f, renk):
        x, y = xy
        d = ImageDraw.Draw(resim)
        for e, p in parcala(metin):
            if e:
                em = self._emoji_resmi(p, round(f.size * 1.05))
                resim.alpha_composite(em, (round(x) + 2, round(y + f.size * 0.02)))
                x += em.width + 4
            else:
                d.text((x, y), p, font=f, fill=renk)
                x += f.getlength(p)
        return x


def yuvarlak(resim, cap):
    resim = resim.convert("RGBA").resize((cap * 4, cap * 4), Image.LANCZOS)
    maske = Image.new("L", resim.size, 0)
    ImageDraw.Draw(maske).ellipse((0, 0, cap * 4 - 1, cap * 4 - 1), fill=255)
    resim.putalpha(maske)
    return resim.resize((cap, cap), Image.LANCZOS)


def varsayilan_avatar(cap):
    """Instagram'ın gri boş profil resmi."""
    b = cap * 4
    r = Image.new("RGBA", (b, b), (0, 0, 0, 0))
    d = ImageDraw.Draw(r)
    d.ellipse((0, 0, b - 1, b - 1), fill=(219, 219, 219))
    d.ellipse((b * 0.33, b * 0.17, b * 0.67, b * 0.51), fill=(140, 140, 145))
    d.ellipse((b * 0.14, b * 0.58, b * 0.86, b * 1.15), fill=(140, 140, 145))
    maske = Image.new("L", (b, b), 0)
    ImageDraw.Draw(maske).ellipse((0, 0, b - 1, b - 1), fill=255)
    r.putalpha(maske)
    return r.resize((cap, cap), Image.LANCZOS)


def mavi_tik(cap):
    b = cap * 4
    r = Image.new("RGBA", (b, b), (0, 0, 0, 0))
    d = ImageDraw.Draw(r)
    # tırtıklı rozet: 8 küçük daire + merkez
    import math

    for i in range(8):
        a = i * math.pi / 4
        cx, cy = b / 2 + math.cos(a) * b * 0.2, b / 2 + math.sin(a) * b * 0.2
        d.ellipse((cx - b * 0.3, cy - b * 0.3, cx + b * 0.3, cy + b * 0.3), fill=MAVI_TIK)
    d.line(
        [(b * 0.3, b * 0.52), (b * 0.45, b * 0.66), (b * 0.71, b * 0.38)],
        fill=(255, 255, 255),
        width=round(b * 0.1),
        joint="curve",
    )
    return r.resize((cap, cap), Image.LANCZOS)


def kalp(cap, renk):
    b = cap * 4
    r = Image.new("RGBA", (b, b), (0, 0, 0, 0))
    d = ImageDraw.Draw(r)
    import math

    noktalar = []
    for i in range(200):
        t = i / 200 * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        noktalar.append((b / 2 + x * b / 37, b / 2 + y * b / 37 - b * 0.03))
    d.line(noktalar + [noktalar[0]], fill=renk, width=round(b * 0.075), joint="curve")
    return r.resize((cap, cap), Image.LANCZOS)


def yorum_karti(yorum, cizici, klasor):
    f_ad = font("Inter-Bold.otf", 25)
    f_zaman = font("Inter-Regular.otf", 25)
    f_yorum = font("Inter-Regular.otf", 25)
    f_alt = font("Inter-SemiBold.otf", 21)

    kullanici = yorum["kullanici"]
    metin = yorum["yorum"]
    zaman = yorum.get("zaman", "8h")
    begeni = str(yorum.get("begeni", "")).strip()
    onayli = yorum.get("onayli", False)

    METIN_X, SAG_BOSLUK, YUKSEKLIK, AVATAR = 105, 72, 130, 60

    ad_gen = cizici.genislik(kullanici, f_ad)
    ust_gen = ad_gen + (34 if onayli else 0) + 10 + f_zaman.getlength(zaman)
    alt_metin = (f"{begeni} beğenme" if begeni else "")
    alt_gen = f_alt.getlength(alt_metin + "      Yanıtla")
    yorum_gen = cizici.genislik(metin, f_yorum)
    genislik = round(METIN_X + max(ust_gen, yorum_gen, alt_gen) + SAG_BOSLUK)
    genislik = max(420, min(genislik, VIDEO_KUTU[2] - 20))

    olcek = 2  # kenarlar pürüzsüz olsun diye iki kat büyük çizip küçültüyoruz
    kart = Image.new("RGBA", (genislik, YUKSEKLIK), (0, 0, 0, 0))
    zemin = Image.new("RGBA", (genislik * olcek, YUKSEKLIK * olcek), (0, 0, 0, 0))
    ImageDraw.Draw(zemin).rounded_rectangle(
        (0, 0, genislik * olcek - 1, YUKSEKLIK * olcek - 1), radius=22 * olcek, fill=KART_RENK
    )
    kart.alpha_composite(zemin.resize(kart.size, Image.LANCZOS))

    avatar_yolu = yorum.get("avatar")
    if avatar_yolu:
        if not os.path.isabs(avatar_yolu):
            avatar_yolu = os.path.join(klasor, avatar_yolu)
        av = yuvarlak(Image.open(avatar_yolu), AVATAR)
    else:
        av = varsayilan_avatar(AVATAR)
    kart.alpha_composite(av, (21, (YUKSEKLIK - AVATAR) // 2 - 6))

    x = cizici.ciz(kart, (METIN_X, 18), kullanici, f_ad, BEYAZ)
    if onayli:
        kart.alpha_composite(mavi_tik(26), (round(x) + 8, 21))
        x += 34
    ImageDraw.Draw(kart).text((x + 10, 18), zaman, font=f_zaman, fill=GRI)

    cizici.ciz(kart, (METIN_X, 50), metin, f_yorum, BEYAZ)

    d = ImageDraw.Draw(kart)
    ax = METIN_X
    if alt_metin:
        d.text((ax, 89), alt_metin, font=f_alt, fill=GRI)
        ax += f_alt.getlength(alt_metin) + 22
    d.text((ax, 89), "Yanıtla", font=f_alt, fill=GRI)

    kart.alpha_composite(kalp(30, (225, 225, 228)), (genislik - 46, 40))
    return kart


def cerceve():
    arka = Image.new("RGBA", (GEN, YUK), ARKA_PLAN + (255,))
    logo = Image.open(os.path.join(VARLIK, "logo.png")).convert("RGBA")
    cap = LOGO_YARICAP * 2
    logo = logo.resize((cap, cap), Image.LANCZOS)
    arka.alpha_composite(logo, (LOGO_MERKEZ[0] - LOGO_YARICAP, LOGO_MERKEZ[1] - LOGO_YARICAP))
    ImageDraw.Draw(arka).text(
        BASLIK_XY, "Beyin Sprinti", font=font("InterDisplay-ExtraBold.otf", 68), fill=(10, 10, 10)
    )
    return arka


def sure_al(video):
    cikti = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]
    )
    return float(cikti.strip())


def ses_var_mi(video):
    cikti = subprocess.check_output(
        ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
         "-of", "csv=p=0", video]
    )
    return bool(cikti.strip())


def zamanlari_doldur(yorumlar, sure):
    """Başlangıcı verilmeyen yorumları videoya eşit aralıklarla dağıtır."""
    eksik = [y for y in yorumlar if "baslangic" not in y]
    if eksik:
        aralik = sure / len(eksik)
        for i, y in enumerate(eksik):
            y["baslangic"] = round(i * aralik, 2)
    for y in yorumlar:
        y.setdefault("sure", VARSAYILAN_SURE)
        y["bitis"] = min(sure, y["baslangic"] + y["sure"])


def duraklat(video, noktalar, sure, hedef):
    """Videoyu verilen anlarda dondurur. noktalar: [(saniye, bekleme_suresi), ...]

    Donma süresince görüntü o anki karede sabit kalır ve ses susar.
    """
    n = len(noktalar)
    ses = ses_var_mi(video)
    filtre = [f"[0:v]fps=30,setsar=1,split={2 * n + 1}" + "".join(f"[v{i}]" for i in range(2 * n + 1))]
    if ses:
        filtre.append(
            "[0:a]aformat=sample_rates=44100:channel_layouts=stereo,"
            f"asplit={n + 1}" + "".join(f"[a{i}]" for i in range(n + 1))
        )
    parcalar = []
    onceki = 0.0
    kare = 1 / 30
    for i, (t, bekle) in enumerate(noktalar):
        filtre.append(f"[v{2 * i}]trim={onceki}:{t},setpts=PTS-STARTPTS[pv{i}]")
        filtre.append(
            f"[v{2 * i + 1}]trim={t}:{t + kare},setpts=PTS-STARTPTS,"
            f"tpad=stop_mode=clone:stop_duration={bekle}[dv{i}]"
        )
        if ses:
            filtre.append(f"[a{i}]atrim={onceki}:{t},asetpts=PTS-STARTPTS[pa{i}]")
        else:
            filtre.append(f"anullsrc=r=44100:cl=stereo,atrim=0:{t - onceki}[pa{i}]")
        filtre.append(f"anullsrc=r=44100:cl=stereo,atrim=0:{bekle + kare}[da{i}]")
        parcalar += [f"[pv{i}][pa{i}]", f"[dv{i}][da{i}]"]
        onceki = t
    filtre.append(f"[v{2 * n}]trim=start={onceki},setpts=PTS-STARTPTS[pvson]")
    if ses:
        filtre.append(f"[a{n}]atrim=start={onceki},asetpts=PTS-STARTPTS[pason]")
    else:
        filtre.append(f"anullsrc=r=44100:cl=stereo,atrim=0:{sure - onceki}[pason]")
    parcalar.append("[pvson][pason]")
    filtre.append(f"{''.join(parcalar)}concat=n={len(parcalar)}:v=1:a=1[v][a]")
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", video, "-filter_complex", ";".join(filtre),
         "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "12",
         "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", "-f", "mov", hedef],
        check=True,
    )


def seslendir(metin, ses_id, hedef):
    """Metni ElevenLabs ile MP3'e çevirir."""
    istek = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{ses_id}?output_format=mp3_44100_128",
        data=json.dumps({"text": metin, "model_id": "eleven_multilingual_v2"}).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "audio/mpeg",
                 **({"xi-api-key": ELEVENLABS_ANAHTAR} if ELEVENLABS_ANAHTAR else {})},
    )
    try:
        with urllib.request.urlopen(istek, timeout=60) as yanit, open(hedef, "wb") as f:
            f.write(yanit.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Seslendirme hatası ({e.code}): {e.read().decode('utf-8', 'ignore')}")
    return sure_al(hedef)


def montajla(proje_yolu):
    with open(proje_yolu, encoding="utf-8") as f:
        proje = json.load(f)
    klasor = os.path.dirname(os.path.abspath(proje_yolu))

    def yol(p):
        return p if os.path.isabs(p) else os.path.join(klasor, p)

    video = yol(proje["video"])
    cikti = yol(proje.get("cikti", "cikti.mp4"))
    yorumlar = proje.get("yorumlar", [])

    sure = sure_al(video)
    zamanlari_doldur(yorumlar, sure)

    cizici = MetinCizici()
    gecici = tempfile.mkdtemp(prefix="montaj_")

    seslendirme = proje.get("seslendirme", True)
    durdur = proje.get("video_dursun", True)
    ses_id = proje.get("ses_id", VARSAYILAN_SES_ID)
    # "chatterbox": ücretsiz klon ses (ses_chatterbox.py), "elevenlabs": ElevenLabs API
    motor = proje.get("ses_motoru", "chatterbox")
    ornek = yol(proje["ses_ornegi"]) if proje.get("ses_ornegi") else None
    if seslendirme:
        for i, y in enumerate(yorumlar):
            if y.get("ses"):
                # hazır ses dosyası (ör. CapCut'ta üretilmiş) verildiyse onu kullan
                y["ses_dosyasi"] = yol(y["ses"])
                y["ses_suresi"] = sure_al(y["ses_dosyasi"])
            elif motor == "chatterbox":
                import ses_chatterbox

                y["ses_dosyasi"] = os.path.join(gecici, f"ses{i}.wav")
                print(f"  seslendiriliyor: {y['yorum']}")
                ses_chatterbox.seslendir(y["yorum"], y["ses_dosyasi"], ornek)
                y["ses_suresi"] = sure_al(y["ses_dosyasi"])
            else:
                y["ses_dosyasi"] = os.path.join(gecici, f"ses{i}.mp3")
                y["ses_suresi"] = seslendir(y["yorum"], y.get("ses_id", ses_id), y["ses_dosyasi"])
            if not durdur:
                # kart en az okuma bitene kadar ekranda kalsın
                y["bitis"] = min(sure, max(y["bitis"], y["baslangic"] + y["ses_suresi"] + 0.3))

    if durdur and yorumlar:
        # Yorum ekrana gelince video donar, okuma (ya da kartın süresi) bitince devam eder.
        yorumlar.sort(key=lambda y: y["baslangic"])
        kayma = 0.0
        noktalar = []
        for y in yorumlar:
            t = min(max(0.0, y["baslangic"]), max(0.0, sure - 0.05))
            bekle = y["ses_suresi"] + DURAKLAMA_PAYI if "ses_suresi" in y else y["sure"]
            noktalar.append((t, bekle))
            y["baslangic"] = round(t + kayma, 3)
            y["bitis"] = round(y["baslangic"] + bekle, 3)
            kayma += bekle
        duraklatilmis = os.path.join(gecici, "duraklatilmis.mp4")
        duraklat(video, noktalar, sure, duraklatilmis)
        video, sure = duraklatilmis, sure + kayma
    cerceve_yolu = os.path.join(gecici, "cerceve.png")
    cerceve().convert("RGB").save(cerceve_yolu)

    girdiler = ["-loop", "1", "-framerate", "30", "-i", cerceve_yolu, "-i", video]
    vx, vy, vw, vh = VIDEO_KUTU
    filtre = [
        f"[1:v]scale={vw}:{vh}:force_original_aspect_ratio=increase,"
        f"crop={vw}:{vh},setsar=1[vid]",
        f"[0:v][vid]overlay={vx}:{vy}:shortest=1[s0]",
    ]
    son = "s0"
    for i, y in enumerate(yorumlar):
        kart = yorum_karti(y, cizici, klasor)
        kart_yolu = os.path.join(gecici, f"kart{i}.png")
        kart.save(kart_yolu)
        girdiler += ["-i", kart_yolu]
        kx = (GEN - kart.width) // 2
        ky = KART_MERKEZ_Y - kart.height // 2
        filtre.append(
            f"[{son}][{i + 2}:v]overlay={kx}:{ky}:"
            f"enable='between(t,{y['baslangic']},{y['bitis']})'[s{i + 1}]"
        )
        son = f"s{i + 1}"
        print(f"  yorum {i + 1}: {y['kullanici']}  {y['baslangic']:.1f}s - {y['bitis']:.1f}s")

    ses_cikisi = None
    orjinal_ses = ses_var_mi(video)
    if seslendirme and yorumlar:
        if orjinal_ses and durdur:
            filtre.append("[1:a]anull[orj]")  # donma anlarında video zaten sessiz
        elif orjinal_ses:
            araliklar = "+".join(f"between(t,{y['baslangic']},{y['bitis']})" for y in yorumlar)
            filtre.append(f"[1:a]volume={ORJINAL_SES_KISIK}:enable='{araliklar}'[orj]")
        else:
            filtre.append(f"anullsrc=r=44100:cl=stereo,atrim=0:{sure}[orj]")
        karisim = ["[orj]"]
        for i, y in enumerate(yorumlar):
            sira = len(yorumlar) + 2 + i
            girdiler += ["-i", y["ses_dosyasi"]]
            ms = round(y["baslangic"] * 1000)
            filtre.append(f"[{sira}:a]aformat=channel_layouts=stereo,adelay={ms}|{ms}[ses{i}]")
            karisim.append(f"[ses{i}]")
        filtre.append(
            f"{''.join(karisim)}amix=inputs={len(karisim)}:normalize=0:duration=first[aout]"
        )
        ses_cikisi = "[aout]"
    elif orjinal_ses:
        ses_cikisi = "1:a"

    komut = ["ffmpeg", "-y", "-v", "error", "-stats", *girdiler,
             "-filter_complex", ";".join(filtre), "-map", f"[{son}]"]
    if ses_cikisi:
        komut += ["-map", ses_cikisi, "-c:a", "aac", "-b:a", "192k"]
    komut += ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
              "-r", "30", "-t", f"{sure}", "-movflags", "+faststart", cikti]
    subprocess.run(komut, check=True)
    print(f"Hazır: {cikti}")
    return cikti


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    montajla(sys.argv[1])

"""Ücretsiz, açık kaynak ses klonlama: Chatterbox Multilingual (MIT lisansı).

assets/ses_ornegi.mp3 içindeki sesi taklit ederek Türkçe metni okur.
Kurulum (CPU):
    pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
    pip install chatterbox-tts
İlk çalıştırmada model dosyaları Hugging Face'ten indirilir (birkaç GB).
"""

import os

KOK = os.path.dirname(os.path.abspath(__file__))
VARSAYILAN_ORNEK = os.path.join(KOK, "assets", "ses_ornegi.mp3")

_model = None


def _model_al():
    global _model
    if _model is None:
        import torch
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS

        cihaz = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"  Chatterbox modeli yükleniyor ({cihaz})...")
        _model = ChatterboxMultilingualTTS.from_pretrained(device=cihaz)
    return _model


def seslendir(metin, hedef, ornek=None):
    """Metni klonlanmış sesle okur ve WAV olarak kaydeder."""
    import torchaudio

    model = _model_al()
    wav = model.generate(metin, language_id="tr", audio_prompt_path=ornek or VARSAYILAN_ORNEK)
    torchaudio.save(hedef, wav, model.sr)
    return hedef

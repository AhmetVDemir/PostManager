# PostManager — Yol Haritası

> Sürüm planlaması ve ileride yapılacaklar. Yapıldıkça `[x]` ile işaretle, dökümantasyona taşı.

---

## ✅ Tamamlananlar — v0.2 (23 Mayıs 2026)

- [x] Wizard mimarisi (Arka plan → Boyut → Editör → Kaydet)
- [x] Görsel + Düz Renk + Gradient arka plan
- [x] Görsel kırpma & zoom
- [x] Freeform editor — çoklu yazı + emoji katmanları
- [x] 9 stil preset
- [x] Stroke + Gölge + Glow (renk, blur, offset, opacity)
- [x] 10 filter preset
- [x] Emoji picker (8 kategori, ~280 emoji)
- [x] 3×3 hızlı konum
- [x] Heuristic AI öneri (offline, anında)
- [x] Online AI öneri (Cloudflare Functions + Groq vision LLM)
- [x] AI öneri undo + retry
- [x] Kullanıcı dostu hata banner
- [x] PNG / JPG export + kalite
- [x] File System Access API
- [x] PWA + Service Worker
- [x] Mobile responsive
- [x] Custom domain (`app.postmanager.muhyi.academy`)

---

## 🚧 v0.3 — Akış Sadeleştirme & UX (sonraki sprint)

> Kullanıcı isteği: "Tek fotoğrafı ekle, efekt ver, yazıyı yaz, AI önerip uygulasın. Sana yayınlamak/indirmek kalsın."

### 🎯 Ana hedef: Sade Mod (Easy Mode)

Önerilen yeni akış:

```
1. Görsel/arka plan ekle
2. Filter / efekt seç (genişletilmiş liste, görsel önizleme)
3. Yazıyı yaz (kısa başlık VEYA paragraf)
4. 🪄 / 🤖 AI öner → otomatik uygulanır (font + renk + efekt + BG + konum)
5. ✓ İndir / Paylaş
```

**Sade mod default**: Detay panelleri gizli. Yalnızca yazı input + AI butonu + sonuç.

**🔧 "Detayları Aç" butonu**: Mevcut tam panel (font/boyut/stroke/gölge/glow/konum/...) açılır. İki mod arasında akıcı geçiş.

### 📋 v0.3 İş listesi

#### A. Yazı arka plan kutusu (Text Plate)
- [ ] `TextLayer`a yeni alanlar:
  - `bg: boolean` (toggle)
  - `bgColor: string` (örn `#7c1010`)
  - `bgOpacity: number` (0-1)
  - `bgPadding: { x: number; y: number }`
  - `bgRadius: number` (köşe yuvarlama)
- [ ] PostCanvas: Konva.Rect arkada, text önde
- [ ] UI: "🔲 Arka plan" collapsible panel (gölge/glow gibi)
- [ ] Hızlı preset'ler: "Beyaz blok", "Koyu kırmızı yarı saydam" (Geylani örneği gibi), "Sarı highlighter"

#### B. Segmentli highlight (gelişmiş)
- [ ] Yazının bir kısmına BG ver (örn `Abdulkadir-i Geylani` koyu kırmızı, gerisi normal — referans görseldeki gibi)
- [ ] Mantık: text içinde `[[highlighted text]]` syntax veya çoklu segment editörü
- [ ] Veri yapısı: `TextLayer.segments: { from: number; to: number; bgColor: string; ... }[]`

#### C. Paragraf desteği iyileştirme
- [ ] Maks genişlik (line wrap için) — `maxWidth: number`
- [ ] Satır yüksekliği — `lineHeight: number` (1.0 - 2.5)
- [ ] Multi-line shadow/glow doğru render (Konva line-by-line text shadow bazen aksıyor — test ve fix)
- [ ] Otomatik metin boyutu (text-fit-to-box opsiyonu)

#### D. AI yazı içeriği önerisi
- [ ] AI sadece stil değil, **yazı içeriğini** de önerebilsin
- [ ] "AI'ya öner" butonu: görseli analiz et + bir caption öner (Türkçe)
- [ ] Mevcut yazı varsa: "kısalt", "daha çekici yap", "alt başlık ekle" mikro-aksiyonları
- [ ] CF Function `/api/suggest-text` yeni endpoint

#### E. Daha fazla font (60+ hedefi)
- [ ] Her mood için 10 font (mevcut 5) → 60 toplam
- [ ] Yeni mood kategorileri:
  - **Tech / Cyber** (örn JetBrains Mono, Orbitron, Audiowide)
  - **Calligraphy / Hat** (örn Tangerine, Great Vibes, Allura)
  - **Decorative** (örn Bungee Shade, Black Ops One, Faster One)
- [ ] Türkçe karakter uyumlu font filtreleme (ğ, ş, ç desteği olanlar)
- [ ] Font önizlemesinde örnek "Türkçe metin" göster

#### F. Daha fazla görsel efekt (25-30 hedefi)
Mevcut: Vintage, B&W, Sıcak, Soğuk, Solgun, Canlı, Sepya, Noir, Berrak, Orijinal
- [ ] **Cinematic** — koyu gölgeler, soluk highlights, teal-orange ton
- [ ] **HDR Look** — yüksek doygunluk + lokal kontrast
- [ ] **Polaroid** — sıcak beyaz çerçeve, hafif solgun
- [ ] **Lomo** — koyu kenarlar (vignette), high-contrast
- [ ] **Lo-Fi** — gritty, düşük doygunluk, hafif blur
- [ ] **Cross-process** — yeşil-mor renkler, kontrastlı
- [ ] **Pop-Art** — yüksek saturation + posterize
- [ ] **Cyberpunk** — neon (cyan/magenta) overlay
- [ ] **Anime / Manga** — flat shading, kontrastlı çizgi efekti
- [ ] **Film Grain** — fotoğraf kumu üst overlay
- [ ] **Sunset** — turuncu/pembe tint
- [ ] **Cold Steel** — mavi-gri ton
- [ ] **Mocha** — kahverengi sıcak ton
- [ ] **Posterize** — limited color palette
- [ ] **Duotone** — sadece 2 renk (örn pembe + mavi)
- [ ] (Bonus) Filter intensity slider — preset üzerine 0-100% güç ayarı

#### G. AI otomatik tam uygulama
- [ ] AI önerisini direkt uygula (mevcut davranış kalsın)
- [ ] AI hem stili hem yazıyı hem efekti birden uygulasın (mega-suggest)
- [ ] Mevcut "Geri Al" + "Başka Öneri" butonları korunsun

---

## 🔮 v0.4 — Şablon & Gelişmiş Düzenleme

- [ ] **Şablon kütüphanesi**: kompozisyonu LocalStorage'a kaydet, sonra tek tıkla geri yükle
- [ ] **Undo/Redo** (Ctrl+Z / Ctrl+Y) — son N işlemi geri al
- [ ] **Çoklu seçim** (Shift+click) — birden çok katmanı birden taşı/sil
- [ ] **Kopyala / Yapıştır** (Ctrl+C / Ctrl+V) — katman duplicate
- [ ] **Hizalama yardımcıları** — snap to center, snap to edge, eşit aralık
- [ ] **Grid / Cetvel** opsiyonel görünüm
- [ ] **Klavye kısayolları** ([/] font size, arrow keys konum, Del sil)

---

## 📱 v0.5 — Mobile + Desktop Native

- [ ] **Capacitor** ile Android `.apk` + iOS `.ipa`
  - Native dosya sistemi (galeriye kaydet)
  - Native paylaşım (Instagram, WhatsApp intent)
  - Native kamera (direkt çek + düzenle)
- [ ] **Tauri** ile masaüstü `.exe` / `.dmg` / `.AppImage`
  - Offline tam çalışma
  - Native dosya seçici
- [ ] Build CI: GitHub Actions → otomatik artifact üretimi

---

## 🚀 v1.0 — Profesyonel Sürüm

- [ ] **Video export** (Konva animation + FFmpeg.wasm)
  - Statik post + animasyonlu çıkış (zoom-in, fade, slide)
- [ ] **Carousel desteği** (Instagram 10 slide)
- [ ] **Marka kiti** — logo + renk paleti + font seti
- [ ] **Stickers / Logo kütüphanesi** — kullanıcının yüklediği overlay'ler
- [ ] **AI Background Removal** (transformers.js veya Cloudflare AI)
- [ ] **AI Upscale** (görsel kalitesini artırma)
- [ ] **AI Caption generator** (görseli analiz et → 5 farklı caption öner)
- [ ] **Pro tema** — light mode opsiyonu

---

## 💡 İleride değerlendirilecek (priorite yok)

- Cloudflare Turnstile (bot koruması — açık kullanım için)
- Anonim analytics (Cloudflare Web Analytics — gizli kalan)
- Çoklu dil (İngilizce / Türkçe geçişi)
- Erişilebilirlik (a11y) — screen reader, keyboard nav
- Dark/Light/System tema desteği

---

## 📝 Notlar — kullanıcı talepleri arşivi

### 23 Mayıs 2026 — sade mod & paragraf
> "Tek fotoyu ekle, efekt seçeneklerinden görsele dilediğin efekti vereceksin sonra yazıyı yazacaksın, yapay zeka önerecek yazıyı değiştirecek efektini yapacak. Sana yayınlamak/indirmek kalacak."

> "Detaylı detayları değişim için ekstra buton koyup o butona tıklayınca detayları değiştir eklensin."

> "Text başlık gibi kısa olmayabilir mesela paragraf eklenebilir, ona göre text kısmını yapalım."

> "Yazının tamamı yada bir kısmına background color verilebilmeli — şeffaflık ayarı da olmalı." (Abdulkadir-i Geylani görseli referans)

> "Font ve resim efektlerinin sayısını da artıralım, ne kadar çok o kadar iyi."

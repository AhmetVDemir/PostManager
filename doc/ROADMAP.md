# PostManager — Yol Haritası

> Sürüm planlaması ve ileride yapılacaklar. Yapıldıkça `[x]` ile işaretle, dökümantasyona taşı.

---

## ✅ Tamamlananlar — v0.3 (24 Mayıs 2026)

- [x] **Sade Mod** (akış sadeleştirme + 🔧 Gelişmiş ayarları toggle)
- [x] **Yazı arka plan kutusu** (color + opacity + padding + radius)
- [x] **Paragraf desteği** (maxWidth + lineHeight)
- [x] **63 font** (6 mevcut + 3 yeni mood: Tech, Calligraphy, Decorative)
- [x] **26 filter preset** (Cinematic, HDR, Polaroid, Lomo, Cyberpunk, Lo-Fi, Sunset, Mocha, Cold Steel, Duotone Pink/Blue, Posterize, Dream, Matte, Crisp, Film Grain, Anime, ...)
- [x] **AI yazı içeriği önerisi** (✨ AI Yazı Öner — 3 Türkçe caption)
- [x] **AI mega-suggest** (🎁 Tam Paket — yazı + stil + renk birden)
- [x] 3 yeni stil preset: Sarı Highlight, Geylani Stili, Beyaz Blok
- [x] **Segmentli highlight** — `[[önemli]]` syntax'i ile yazının bir kısmına ayrı BG. Geylani örneği birebir çalışıyor.

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

## 🚧 v0.3 — Akış Sadeleştirme & UX (TAMAMLANDI — yukarıda ✅)

> Aşağıdaki detaylar v0.3 sprint planının orijinal halidir. Çoğu yapıldı, segmentli highlight v0.4'e taşındı.

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

## 🎬 Bağımsız proje fikri: **FrameToVideo**

> PostManager'a entegre edilmeyecek — ayrı bir uygulama. Burada sadece fikri arşive almak için.

**İstek**: Kullanıcı 2 görsel verir (başlangıç + bitiş frame). AI arasını akıcı animasyon olarak doldurup 3-10 saniyelik MP4 üretir.

**Mimari önerisi** — PostManager iskelet'inin neredeyse aynısı:
- React + TS + Tailwind + Vite
- Cloudflare Pages + Functions (server-side AI proxy)
- Custom domain (örn. `video.muhyi.academy` veya başka bir alt domain)

**AI yaklaşımları:**

| Yaklaşım | Maliyet | Karmaşıklık | Kalite |
|---|---|---|---|
| **Replicate API** (RIFE / FILM / SVD) | $1 free → 50+ video, sonra ~$0.01/sn | Düşük | Yüksek |
| **Luma Dream Machine API** | 30 video/ay free, sonra $9/ay | Düşük | En yüksek (kameralı motion) |
| **Pika Labs API** | 250 credit free start | Düşük | İyi |
| **Runway Gen-3** | 125 credit free | Düşük | İyi |
| **Browser-içi AI** (Transformers.js + FILM + FFmpeg.wasm) | $0 sonsuza dek | Yüksek | Orta-yüksek, ~150MB ilk indirme |

**Önerilen MVP plan**:
1. Yeni klasör `C:\Users\ahmet\Project\FrameToVideo` (veya benzeri ad)
2. PostManager iskeletini kopyala (vite + react + tailwind)
3. Backend: Cloudflare Function `/api/render-video` proxy (default Replicate)
4. Frontend: 2 görsel upload + süre slider (3-10 sn) + stil seçimi + "Üret" → MP4 indir
5. Hosting: Cloudflare Pages, custom domain

**Tahmini efor**: 4-6 saat MVP, başlangıç + bitiş frame interpolasyonu çalışır demo.

**Notlar:**
- Pollinations.ai gibi tarafından deprecate edilebileceği için ana provider olarak güvenli olanı seç (Replicate veya Luma)
- API key Cloudflare env vars'ta tutulur — bundle'a girmez
- FFmpeg.wasm browser'da MP4 encoding için kullanılabilir (Konva animation frame'lerini birleştirir)
- Geleceğe yönelik: PostManager + FrameToVideo bir "Sosyal medya araç paketi" markası altında birleştirilebilir

**Tartışma tarihi**: 24 Mayıs 2026 (kullanıcı sordu, ileride başlanacak).

---

## 📝 Notlar — kullanıcı talepleri arşivi

### 23 Mayıs 2026 — sade mod & paragraf
> "Tek fotoyu ekle, efekt seçeneklerinden görsele dilediğin efekti vereceksin sonra yazıyı yazacaksın, yapay zeka önerecek yazıyı değiştirecek efektini yapacak. Sana yayınlamak/indirmek kalacak."

> "Detaylı detayları değişim için ekstra buton koyup o butona tıklayınca detayları değiştir eklensin."

> "Text başlık gibi kısa olmayabilir mesela paragraf eklenebilir, ona göre text kısmını yapalım."

> "Yazının tamamı yada bir kısmına background color verilebilmeli — şeffaflık ayarı da olmalı." (Abdulkadir-i Geylani görseli referans)

> "Font ve resim efektlerinin sayısını da artıralım, ne kadar çok o kadar iyi."

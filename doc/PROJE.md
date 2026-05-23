# PostManager — Proje Dokümantasyonu

> Sosyal medya postları için tarayıcıda çalışan, ücretsiz, gizliliğe saygılı bir görsel + yazı editörü. Görsel, düz renk veya gradient arka plan üzerine çoklu yazı katmanı, emoji, filtreler, gölge, parlama ve stroke efektleri. Yerel offline AI önerisi + opsiyonel online AI iyileştirmesi (Pollinations.ai).

---

## 1. Amaç

Instagram, TikTok, Facebook gibi platformlara post atan kullanıcılar artık çok sayıda AI üretimi görseli kullanıyor. Bu görsellere hızlıca filtre uygulamak ve görsele uygun **fontla** yazı yerleştirmek için ağır masaüstü editörlerine (Photoshop, Canva masaüstü) gerek kalmasın istiyoruz.

PostManager bu ihtiyaca **4 adımlık bir wizard + freeform editör** ile cevap verir:

1. **Arka plan** — görsel yükle, düz renk seç veya gradient oluştur. Görsel için zoom + pan ile kırpma.
2. **Boyut** — Instagram kare (1080×1080) veya dikey 9:16 (1080×1920) Story/Reels/TikTok.
3. **Editör** — freeform katman sistemi: birden çok yazı + emoji ekle, sürükle-bırak konumlandır, filtre uygula. Tek tık "Akıllı Öner" ile yapay zekâ uygun font + renk + efekt seçer.
4. **Kaydet** — PNG veya JPG (kalite ayarlı) olarak diske kaydet. Klasör bir kere seçilir, hatırlanır.

**Tasarım ilkeleri**

- **Lokal-only**: Görseller cihazdan çıkmaz. Tüm işleme tarayıcıda yapılır. (AI önerisi de heuristic — offline. Opsiyonel online AI sadece kullanıcı tıkladığında çağrılır.)
- **Hızlı**: Wizard + preset'ler + hatırlanan klasör seçimi + AI önerisi anında.
- **Taşınabilir**: Web tabanlı — PWA olarak telefona kurulabilir, ileride Capacitor ile native sarmalanabilir.

---

## 2. Teknoloji Stack'i

| Katman | Seçim | Neden |
|---|---|---|
| Build | **Vite 6** | Hızlı HMR, ESM-first, minimal config |
| UI Framework | **React 18 + TypeScript** | Component model + tip güvenliği |
| Stillendirme | **Tailwind CSS v4** | Vite plugin ile sıfır config, dark theme-friendly |
| Canvas / 2D | **Konva.js + react-konva** | Image filter API, draggable layers, yüksek-DPI export, multi-layer |
| Fontlar | **Google Fonts (dinamik)** | İnternetten on-demand yüklenir, dağıtım yok |
| PWA | **vite-plugin-pwa** | Manifest + Service Worker, offline çalışır |
| Disk yazma | **File System Access API** | Kullanıcı klasör seçer, izin IndexedDB ile saklanır |
| Görsel analizi | Custom heuristic | RGB→HSL, piksel sampling (64×64) |
| AI öneri (online) | **Pollinations.ai** | Anonim, key'siz, ücretsiz, vision-capable |

**Bilinçli kararlar**

- **Redux/Zustand yok** — state shape `useState` ile yönetilebilir karmaşıklıkta.
- **Server yok** — gizlilik için + hosting maliyeti sıfır (Cloudflare Pages).
- **Emoji-mart yok** — kendi minimal picker'ımız var, bundle 500 KB küçük kaldı.
- **Bundle'a font gömme yok** — Google Fonts dinamik yüklenir.

---

## 3. Dosya Yapısı

```
PostManager/
├── doc/
│   ├── PROJE.md                       ← bu dosya
│   └── DEPLOY.md                      ← Cloudflare Pages deploy talimatları
├── public/
│   └── favicon.svg                    ← gradient PostManager simgesi
├── src/
│   ├── main.tsx                       ← React entry
│   ├── App.tsx                        ← Wizard step routing + merkezi state
│   ├── index.css                      ← Tailwind import + global stiller
│   ├── types.ts                       ← AppState, Layer, Background, factory'ler
│   │
│   ├── components/
│   │   ├── Stepper.tsx                ← Üst step göstergesi (1-4), mobil-uyumlu
│   │   ├── PostCanvas.tsx             ← Konva — background + layers + glow/shadow/stroke + export
│   │   ├── EmojiPicker.tsx            ← 8 kategorili modal emoji picker (~280 emoji)
│   │   ├── steps/
│   │   │   ├── BackgroundStep.tsx     ← 1: görsel + düz renk + gradient + kadrajla/zoom
│   │   │   ├── SizeStep.tsx           ← 2: kare / dikey
│   │   │   ├── EditorStep.tsx         ← 3: freeform editor (3-kolon desktop, stack mobil)
│   │   │   └── ExportStep.tsx         ← 4: önizleme + format (PNG/JPG) + klasör seç + kaydet
│   │   └── editor/
│   │       ├── LayerList.tsx          ← sol panel: katman listesi + ekle/sil/sıra
│   │       ├── FilterControl.tsx      ← filtre opt-in toggle + preset grid
│   │       ├── TextPropertiesPanel.tsx← sağ panel: yazı / stil preset / stroke / gölge / glow
│   │       ├── EmojiPropertiesPanel.tsx ← sağ panel: emoji / boyut / açı / konum
│   │       └── PositionGrid.tsx       ← 3×3 hızlı konum
│   │
│   ├── data/
│   │   ├── filters.ts                 ← 10 Konva filter preset
│   │   ├── fonts.ts                   ← Mood → Google Fonts + dinamik yükleyici
│   │   ├── textStylePresets.ts        ← 9 stil preset (Neon, Vintage Poster, vs.)
│   │   └── emojis.ts                  ← 8 kategori, ~280 emoji
│   │
│   ├── hooks/
│   │   └── useSaveDirectory.ts        ← File System Access API + IndexedDB persistence
│   │
│   └── services/
│       ├── fileStorage.ts             ← Platform-agnostic storage interface
│       ├── imageAnalysis.ts           ← Offline AI: RGB → HSL → mood + preset önerisi
│       └── pollinationsAI.ts          ← Online AI: vision-capable LLM çağrısı
│
├── .claude/
│   └── launch.json                    ← Claude Preview dev server config
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts                     ← Vite + React + Tailwind + PWA
└── .gitignore
```

---

## 4. Veri Modeli

[types.ts](../src/types.ts) tek truth-source. Refactor'dan sonra **Layer-based** mimari:

```ts
AppState = {
  step: 1 | 2 | 3 | 4
  background: Background     // 1. step
  format: 'square' | 'vertical'   // 2. step
  filter: { enabled: boolean, preset: FilterPreset }   // 3. step, opt-in
  layers: Layer[]            // 3. step — çoklu katman
  selectedLayerId: string | null
}

Background = {
  kind: 'image' | 'solid' | 'gradient'
  imageDataUrl, imageTransform: { zoom, offsetX, offsetY }
  solidColor
  gradient: { from, to, angle }
}

Layer = TextLayer | EmojiLayer

TextLayer = {
  type: 'text', id, x, y, rotation,
  text, fontFamily, fontSize, color, align,
  stroke, strokeColor, strokeWidth,           // ← kontur
  shadow, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, shadowOpacity,
  glow, glowColor, glowBlur, glowOpacity,
}

EmojiLayer = {
  type: 'emoji', id, x, y, rotation,
  emoji, size,
}
```

`createTextLayer(format)` ve `createEmojiLayer(emoji, format)` factory'leri yeni katmanları doğru ortalanmış konumla üretir.

---

## 5. Mimari Detaylar

### 5.1 Tek render pipeline

Editor ve Export step'leri **aynı `PostCanvas` component'ini** kullanır. Önizleme = çıktı, bit-perfect aynı.

### 5.2 Koordinat sistemi: natural × display scale

Stage'in dahili koordinat sistemi **her zaman 1080×1080 veya 1080×1920** (gerçek çıktı). Ekrana sığması için Stage'e `scaleX/scaleY` uygulanır.

Export: `stage.toDataURL({ pixelRatio: 1 / scale })` ile native çözünürlükte PNG/JPEG.

### 5.3 Filter pipeline (opt-in)

Filter sadece **görsel** arka plan için anlamlı. Solid/gradient seçiliyse FilterControl otomatik disable olur. Konva.Image üzerinde `.cache()` + `.filters([...])` + parametre setter'ları.

### 5.4 Çoklu katman + Glow + Shadow + Stroke trick'i

Her TextLayer için iki Konva.Text node:
1. **Alt (glow)**: solid fill = glowColor, shadowEnabled, shadowColor=glowColor, shadowOffset=0, shadowBlur=glowBlur. Yazının etrafında halo.
2. **Üst (main)**: gerçek fill = textColor, stroke (varsa) + shadow (drop shadow).

Bu CSS `text-shadow: 0 0 X gColor, X Y B sColor, X Y K strokeColor` simulasyonu.

Emoji için: tek Konva.Text, sistem emoji fontu fallback chain.

### 5.5 Görsel kırpma (zoom + pan)

`Background.imageTransform = { zoom, offsetX, offsetY }`:
- `zoom = 1` → cover-fit (default)
- `zoom > 1` → yakınlaştır
- `offsetX = +1` → sağ kenar görünür (intuitive semantic)

Hem mini preview (CSS transform) hem ana canvas (Konva imageProps) aynı matematiği kullanır.

### 5.6 AI öneri — iki katmanlı

**Heuristic (offline, anında):**
- 64×64'e küçültülmüş görselden RGB ortalaması + variance
- HSL'ye çevir → hue, saturation, lightness
- Karanlık + canlı → Neon. Parlak → Bold Headline. Sıcak + soluk → Vintage Poster. Vs.
- Maliyet: 0. Latency: <50 ms.

**Pollinations.ai (online, opsiyonel):**
- Vision-capable OpenAI-compatible endpoint (`text.pollinations.ai/openai`)
- Görseli base64 olarak gönderir + system prompt ile preset listesinden seç
- Anonim, key gerekmez. Birkaç saniye gecikme.
- Hata durumunda kullanıcıya bilgi, heuristic önerisi geçerli kalır.

### 5.7 Dosya kayıt akışı

```
ExportStep
   ├─ Format seçici (PNG / JPEG + kalite slider)
   ├─ Klasör seç (FSA showDirectoryPicker)
   │     └→ FileSystemDirectoryHandle IndexedDB'de saklanır
   ├─ writeFile: queryPermission → (gerekirse) requestPermission → createWritable → write
   └─ Fallback: <a download> + URL.createObjectURL (FSA olmayan tarayıcılar)
```

### 5.8 PWA

`vite-plugin-pwa` ile manifest + Service Worker otomatik üretilir:
- Build sırasında precache (`*.js`, `*.css`, `*.html`, `*.svg`)
- Google Fonts on-demand fetch, cache'lenmez (boyut sebepli)
- Otomatik update (`registerType: 'autoUpdate'`)
- Chrome/Edge/Safari: "Ana ekrana ekle" desteği

### 5.9 Capacitor hazırlığı

`services/fileStorage.ts` platform-agnostic `FileStorage` interface'i tanımlar. Şu an Web (FSA + indirme fallback) implementation'ı kullanılıyor. İleride:

```ts
if (Capacitor.isNativePlatform()) return new NativeFileStorage()
return new WebFileStorage()
```

Aynı API, mobile'da native dosya sistemi + Share intent kullanır. UI değişmez.

---

## 6. Akış Diyagramı

```
[1. Arka plan]
   │
   ├─ Görsel? → upload + kadrajla (zoom + pan)
   ├─ Düz renk? → renk seç
   └─ Gradient? → 2 renk + açı, hazır preset'ler
        │
        ▼
[2. Boyut]
   │   • Kare 1080×1080
   │   • Dikey 1080×1920
        │
        ▼
[3. Editör]
   ┌──────────────┬──────────────┬──────────────┐
   │ Sol panel    │ Canvas       │ Sağ panel    │
   │ • Akıllı     │ • Tüm        │ • Seçili     │
   │   Öner       │   katmanlar  │   katmanın   │
   │ • AI ile     │ • Sürüklene- │   detayları  │
   │   geliştir   │   bilir      │ • Hızlı      │
   │ • + Yazı     │ • Seçim      │   stil       │
   │ • + Emoji    │   border'ı   │ • Stroke /   │
   │ • Katman     │              │   gölge /    │
   │   listesi    │              │   glow       │
   │ • Filtre     │              │ • Konum grid │
   └──────────────┴──────────────┴──────────────┘
        │
        ▼
[4. Kaydet]
   │   • PNG / JPG + kalite
   │   • Klasör seç (kalıcı) veya Downloads
   └→ post-square-20260523-...png
```

---

## 7. Genişletme Noktaları

| Özellik | Karmaşıklık | Notlar |
|---|---|---|
| Şablon kütüphanesi | Orta | LocalStorage'da AppState snapshot'ları, kaydet/yükle |
| Capacitor mobile build | Orta | `npm install @capacitor/core @capacitor/android`, native plugin'le `fileStorage.ts` extend |
| Tauri masaüstü .exe | Düşük | `npx tauri init` + build script |
| Undo / Redo | Orta | State history stack, Ctrl+Z |
| Video export | Yüksek | Konva animation + FFmpeg.wasm |
| Sticker / SVG katmanı | Orta | EmojiLayer'a benzer yeni layer tipi + Konva.Image |

---

## 8. Geliştirme & Build

```powershell
npm install
npm run dev        # Vite — http://localhost:5173, PWA dev mode'da aktif
npm run build      # Production — tsc + vite build → dist/, PWA assets dahil
npm run preview    # Build çıktısını test et
```

Deploy talimatları için → [DEPLOY.md](DEPLOY.md)

**Tarayıcı uyumluluğu**: Tüm modern tarayıcılar (Chrome/Edge/Firefox/Safari). File System Access API sadece Chromium tabanlı tarayıcılarda — diğerleri Downloads'a iner. Tüm geri kalan özellikler her yerde çalışır.

---

## 9. Versiyon notu

| Sürüm | Tarih | Öne çıkan değişiklikler |
|---|---|---|
| 0.1 | Mayıs 2026 | İlk MVP — 5 step wizard, tek yazı katmanı, görsel-only arka plan |
| 0.2 | Mayıs 2026 | **Bu sürüm** — Freeform editor, Layer abstraction, gradient/düz renk arka plan, görsel kırpma, 9 stil preset, emoji desteği, AI öneri (heuristic + Pollinations), PWA, mobil responsive, JPG export, PNG/JPG seçici |

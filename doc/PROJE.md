# PostManager — Proje Dokümantasyonu

> Sosyal medya postları için tarayıcıda çalışan, AI-içermeyen, gizliliğe saygılı bir görsel + yazı editörü.

---

## 1. Amaç

Instagram, TikTok, Facebook ve benzeri platformlara post atan kullanıcılar artık çok sayıda AI üretimi görseli kullanıyor. Bu görsellere hızlıca filtre uygulamak ve görsele uygun **fontla** yazı yerleştirmek için ağır masaüstü editörlerine (Photoshop, Canva masaüstü) gerek kalmasın istiyoruz.

PostManager bu ihtiyaca **5 adımlık, lineer bir wizard** ile cevap verir:

1. Görseli yükle.
2. Çıktı boyutunu seç (Instagram kare / dikey 9:16).
3. Bir filtre preset'i uygula (veya atla).
4. Yazıyı yaz, mood'a göre Google Fonts'tan font seç, gölge & parlama efektleriyle stilize et, sürükleyerek konumlandır.
5. PNG olarak diske kaydet (kullanıcının seçtiği klasöre — örn. `C:\Posts`).

**Tasarım ilkeleri**

- **Lokal-only**: Görsel cihazdan çıkmaz. Tüm işleme tarayıcıda yapılır.
- **Hızlı**: Wizard akışı, preset'ler, hatırlanan klasör seçimi.
- **Taşınabilir**: Web tabanlı — yarın aynı kod tabanı ile Capacitor üzerinden mobile sarmalanabilir.

---

## 2. Teknoloji Stack'i

| Katman | Seçim | Neden |
|---|---|---|
| Build | **Vite 6** | Hızlı HMR, ESM-first, minimal config |
| UI Framework | **React 18 + TypeScript** | Component model + tip güvenliği |
| Stillendirme | **Tailwind CSS v4** | Vite plugin ile sıfır config, dark theme'e uygun utility'ler |
| Canvas / 2D | **Konva.js + react-konva** | Image filter API, draggable text, yüksek-DPI export |
| Fontlar | **Google Fonts (dinamik)** | İnternetten on-demand yüklenir, dağıtım yok |
| Disk yazma | **File System Access API** | Kullanıcı klasör seçer, izin IndexedDB ile saklanır |

**Bilinçli kararlar**

- **Redux/Zustand yok** — wizard state'i lineer ve sığ, `useState` yeterli.
- **Server-side AI yok** — gizlilik için. Font önerisi mood-kategori bazlı bir heuristic.
- **Bundle'a font gömme yok** — Google Fonts dinamik yüklenir; gereksiz network yok.

---

## 3. Dosya Yapısı

```
PostManager/
├── doc/
│   └── PROJE.md                       ← bu dosya
├── public/                            ← (varsa) statik varlıklar
├── src/
│   ├── main.tsx                       ← React entry
│   ├── App.tsx                        ← Wizard step routing + merkezi state
│   ├── index.css                      ← Tailwind import + global stiller
│   ├── types.ts                       ← AppState, TextLayer, CanvasFormat, FilterPreset, sabitler
│   │
│   ├── components/
│   │   ├── Stepper.tsx                ← Üst step göstergesi (1-5)
│   │   ├── PostCanvas.tsx             ← Konva Stage — filter + text + glow + export
│   │   └── steps/
│   │       ├── UploadStep.tsx         ← Step 1: drag-drop + file input
│   │       ├── SizeStep.tsx           ← Step 2: kare / dikey preset
│   │       ├── FilterStep.tsx         ← Step 3: 10 filtre preset (Konva.Filters)
│   │       ├── TextStep.tsx           ← Step 4: yazı + font + boyut + gölge + glow
│   │       └── ExportStep.tsx         ← Step 5: önizleme + klasör seç + kaydet
│   │
│   ├── data/
│   │   ├── filters.ts                 ← Konva.Filters preset tanımları
│   │   └── fonts.ts                   ← Mood → Google Fonts eşlemesi + on-demand yükleyici
│   │
│   └── hooks/
│       └── useSaveDirectory.ts        ← File System Access API + IndexedDB persistence
│
├── .claude/
│   └── launch.json                    ← Claude Preview dev server config (paylaşılır)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

---

## 4. Mimari

### 4.1 Genel resim

```
┌──────────────────────────────────────────────────────────────┐
│                          App.tsx                              │
│   ┌─────────────────────────────────────────────────────┐    │
│   │   AppState = { step, imageDataUrl, format,          │    │
│   │                filter, text: TextLayer }            │    │
│   └─────────────────────────────────────────────────────┘    │
│           │                                                   │
│           ▼   props down, callbacks up                        │
│   ┌───────────────────────────────────────────────────────┐  │
│   │  Step (1..5) — şu an aktif olan component            │  │
│   │  ┌────────────────────────────────────────────────┐  │  │
│   │  │  PostCanvas (ortak — 3, 4, 5'te kullanılır)   │  │  │
│   │  │   • Stage (Konva)                              │  │  │
│   │  │   • Layer: Image  (filter cached)              │  │  │
│   │  │   • Layer: Text   (glow alt katman + main)     │  │  │
│   │  └────────────────────────────────────────────────┘  │  │
│   └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Tek sahnenin merkezde tutulması

Filter, yazı ve export step'leri **aynı `PostCanvas` component'ini** kullanır. Tek bir render pipeline'ı vardır → preview'da gördüğün şey ile export edilen şey **bit-perfect aynıdır**.

### 4.3 Koordinat sistemi: natural vs. display scale

Stage'in dahili koordinat sistemi **her zaman 1080×1080 veya 1080×1920** (natural çıktı çözünürlüğü).

Ekrana sığması için Stage'e `scaleX / scaleY` uygulanır (örn. `0.481` ile 520px display).

Export sırasında bu scale ters çevrilerek native çözünürlükte PNG alınır:

```ts
stage.toDataURL({ pixelRatio: 1 / scale })
```

Bu sayede font size, x/y, blur değerleri **gerçek piksel** olarak konuşulur — preview'da 80px görüyorsan çıktıda da 80px.

### 4.4 Filter pipeline'ı

Konva.Image üzerinde filter uygulamak için node'un `.cache()` edilmesi gerekir. `FilterStep`/`PostCanvas`'ta filter değiştiğinde:

```ts
node.filters([Konva.Filters.HSL, Konva.Filters.Brighten, ...])
node.brightness(-0.05); node.saturation(-0.2); ...
node.cache()
node.getLayer().batchDraw()
```

Preset tanımları [data/filters.ts](../src/data/filters.ts) içinde. Her preset bir veya birkaç Konva.Filters birleşimidir + parametreler.

### 4.5 Yazı katmanı: glow + shadow trick'i

Konva.Text tek bir shadow destekler. **Aynı anda hem drop-shadow hem glow** istediğimizde iki Text node çiziyoruz:

```
Layer:
  [alt]  glow KText:  fill=glowColor, shadow=glowColor blurred,
                       offset=(0,0)   ← yazı etrafında halo oluşturur
  [üst]  main KText:  fill=color,     shadow=shadowColor,
                       offset=(X,Y)    ← drop-shadow

  → main, glow'un text alanını üstten örter
  → glow'un blur'lu shadow'u halo olarak dışarı taşar
  → sonuç: CSS `text-shadow: 0 0 N gColor, X Y N sColor` simulasyonu
```

`text.glow=false` ise alt katman çizilmez (boş layer overhead'i yok).

### 4.6 Dosya kayıt akışı (File System Access API)

```
ExportStep
   │
   │ 1) ilk kez "Klasör Seç" → window.showDirectoryPicker()
   │ 2) FileSystemDirectoryHandle IndexedDB'ye yazılır
   │
   │ Her kayıtta:
   ├─► useSaveDirectory.writeFile(filename, blob)
   │      ├─ handle.queryPermission({mode:'readwrite'})
   │      ├─ izin yoksa requestPermission()
   │      └─ getFileHandle(create:true).createWritable().write(blob)
   │
   └─► Fallback: <a download> + URL.createObjectURL  (Firefox vb.)
```

Kullanıcı tarayıcı kapatıp tekrar açtığında handle IDB'den okunur; tek farkı tarayıcı tek seferlik bir izin onayı isteyebilir (`requestPermission`).

---

## 5. Veri Modeli

[types.ts](../src/types.ts) tek truth-source.

```ts
AppState = {
  step: 1 | 2 | 3 | 4 | 5
  imageDataUrl: string | null      // Step 1 doldurur
  format: 'square' | 'vertical'    // Step 2: 1080×1080 / 1080×1920
  filter: FilterPreset             // Step 3
  text: TextLayer                  // Step 4 + Step 5 export
}

TextLayer = {
  text, fontFamily, fontSize, color, x, y, align, rotation,

  // Gölge
  shadow, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, shadowOpacity

  // Parlama
  glow, glowColor, glowBlur, glowOpacity
}
```

Wizard ilerlemesi `maxReached` ile takip edilir — kullanıcı geri gidip yeniden öne çıkabilir ama henüz görmediği bir step'i Stepper'dan tıklayamaz.

---

## 6. Kullanıcı Akışı (Tek Cümle Özet)

> "Görsel yükle → boyut seç → filtre uygula (veya geç) → yazı yaz + mood'a uygun font + gölge/parlama + sürükleyip yerleştir → PNG olarak `C:\Posts` (veya seçilen klasör) içine kaydet."

---

## 7. Genişletme Noktaları (Roadmap)

| Özellik | Karmaşıklık | Notlar |
|---|---|---|
| Çoklu yazı katmanı | Orta | `text: TextLayer[]` + seçili index, Z-order kontrolleri |
| Stroke / outline | Düşük | Konva.Text destekliyor: `stroke`, `strokeWidth` |
| Hızlı stil preset'leri | Düşük | "Neon", "Vintage poster" gibi font+shadow+glow toplu kombosu |
| Logo / sticker overlay | Orta | Ek Konva.Image layer, draggable + resize |
| AI font önerisi | Yüksek | Görseli Claude API'ye gönder → kategori → mevcut font listesi |
| Şablon kütüphanesi | Yüksek | Storage + UI; JSON formatında AppState snapshot'ları |
| Mobile (Capacitor) | Orta | File System Access yerine native plugin, geri kalan kod aynı |
| Görsel kırpma / zoom | Orta | Step 2 + 3 arası ayrı bir "Crop" step'i |

---

## 8. Geliştirme

```powershell
npm install
npm run dev      # Vite dev server — http://localhost:5173
npm run build    # TS check + production build → dist/
npm run preview  # Build çıktısını lokal olarak servis et
```

**Tarayıcı desteği**: File System Access API için **Chrome / Edge**. Firefox'ta görüntüleme + filtre + yazı + export çalışır, ama klasör seçimi yerine Downloads klasörüne iner.

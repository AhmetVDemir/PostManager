# PostManager — Session Handoff / Devir Notu

> **Bu doküman yeni bir session'a başlarken ilk okunması gereken dosyadır.** Nerede kaldığımızı, ne yaptığımızı, sıradaki adımları hızlıca anlamanı sağlar. Kaynak dokümanlar: [PROJE.md](PROJE.md) (mimari), [ROADMAP.md](ROADMAP.md) (yol haritası), [DEPLOY.md](DEPLOY.md) (Cloudflare), [MOBILE.md](MOBILE.md) (Android APK).

---

## 🎯 30 Saniyelik Özet

**Ne**: PostManager — sosyal medya postu editörü. React + TS + Konva + Tailwind + Vite. Cloudflare Pages'te canlı web + Android APK.

**Kim için**: Kişisel + 2-3 arkadaş kullanımı, ücretsiz hosting, ileride Google Play.

**Şu anki sürüm**:
- **Web (canlı)**: `https://app.postmanager.muhyi.academy` (Cloudflare Pages, otomatik deploy on `main` push)
- **Android APK**: v1.0.5 (versionCode 6), `android/app/build/outputs/apk/debug/app-debug.apk` — 4.79 MB
- **Son commit**: `fc0e6b1` — textarea IME lag fix (Türkçe klavye)

**Aktif kullanıcı**: Kendi telefonunda + arkadaşında test ediliyor. Google Play submission bekleyen major görev.

---

## 📍 Bugün Nerede Kaldık

**Son yapılan iş**: Kullanıcı raporu — "Türkçe klavyede yazınca karakterler kayboluyor, backspace çalışmıyor, cursor donuyor, kes-yapıştır ile yeniden yazmak gerekiyor". Debounce fix'i uyguladık, APK v1.0.5'e bump ettik. Kullanıcı yeni APK'yı henüz test etmedi.

**Bekleyen doğrulama**:
1. ⏳ Kullanıcı **v1.0.5 APK**'yı telefona kursun (eski sürümü kaldırıp yeni sürümü kur)
2. ⏳ Editor → Yazı input'unda Türkçe uzun paragraf yazma testi (backspace/silme çalışıyor mu?)
3. ⏳ **💾 Galeriye Kaydet** butonunun v1.0.3+ ile PostManager albümüne yazma testi
4. ⏳ **📤 Paylaş** butonunun Android paylaş menüsünü açma testi

**Sonuç geldiğinde**: Test raporuna göre ya son bir bug fix'i, ya Google Play submission adımına geç.

---

## 📜 Bu Session'da Neler Yapıldı (Kronolojik)

### Sürüm 1 — v0.3 Sprint (Sade Mod + AI iyileştirmeleri)

Kullanıcı istedi: "Sade mod (tek tıkla post), yazı arka plan kutusu (Geylani örneği), paragraf desteği, daha fazla font, daha fazla filter, AI yazı önerisi".

- **48d1fad**: A+C+E+F birlikte — Text BG kutusu (renk/opacity/padding/radius), paragraf modu (maxWidth/lineHeight), 63 font (9 mood: Modern/Zarif/Güçlü/Retro/Eğlenceli/El yazısı/Tech/Hat/Dekoratif), 26 filter preset (Sinematik, HDR, Polaroid, Lomo, Cyberpunk, Lo-Fi, Sunset, Duotone, Anime vs.)
- **c347818**: D+G — `/api/suggest` endpoint'i `task` field'ıyla üçe ayrıldı: `style` (mevcut stil önerisi), `text` (3 Türkçe caption), `mega` (yazı+stil birden). Frontend'e "✨ AI Yazı Öner" ve "🎁 Tam Paket AI" butonları eklendi.
- **854bd0c**: Sade Mod — default'ta minimum UI (yazı + hızlı stil + boyut + renk + 🎁 AI'ya bırak). "🔧 Gelişmiş ayarları aç" toggle ile font picker/gölge/glow/kontur/paragraf/BG paneller açılır.
- **0dc6b8c**: Buton isimleri kullanıcı dostu — "Tam Paket AI" → "✨ AI'ya bırak", "Heuristic öneri" → "Hızlı öneri".
- **f6abf53**: v0.3 kapanışı, ROADMAP güncellendi.

### Sürüm 2 — v0.4-B (Segmentli Highlight, Geylani Örneği)

Kullanıcı istedi: "Yazının bir kısmına arka plan (Abdulkadir-i Geylani örneği gibi)".

- **57ae631**: `[[önemli]]` markdown-benzeri syntax → o kısımlar farklı BG'de vurgulanır. `src/utils/textSegments.ts` (parse + measure + wordWrap), PostCanvas TextNode Konva.Group içinde multi-line multi-segment render eder. Ana BG + segment highlight + glow + shadow + stroke birlikte çalışır. UI'da "✨ Vurgulu kelimeler" paneli (renk swatch, opacity, opsiyonel yazı rengi override).

### Sürüm 3 — Auto-fit (Uzun Paragraf Sığdırma)

Kullanıcı istedi: "Yazı çok paragraflı olunca canvas dışına taşıyor, boyutlandırmam gerekmesin".

- **6c166c1**: İki katmanlı fix — `createTextLayer` default `maxWidth = canvas × 0.85` (yeni katmanlar otomatik wrap'li), `wrapLineToMaxWidth` word-wrap algoritması ([[highlight]] segment'lerini koruyarak), `fitScale = min(1, safe/content)` Konva Group scale ile ekstra fallback.

### Sürüm 4 — Tanıtım Posterleri

Kullanıcı istedi: "Uygulamayı tanıtan bir görsel lazım".

- **afc7474**: `doc/assets/promo-poster.svg` (1080×1080) + `doc/assets/promo-story.svg` (1080×1920). Uygulamanın 8 ana özelliğini gösteren gradient poster. GitHub'da render edilir, online SVG→PNG çevirici ile PNG'ye alınabilir.

### Sürüm 5 — Capacitor Mobil Entegrasyonu (Android APK)

Kullanıcı istedi: "Mobilde APK olarak da çıkarabilecek miyiz? AI key vs sorun olur mu?".

- **a07e0bd**: Capacitor 8 + Android platform eklendi. Kilit prensip: **tek codebase, iki target — web hep birinci sınıf**.
  - `src/utils/platform.ts` — `isNative()` + `getApiBase()` tek nokta
  - `src/services/cloudAI.ts` — API URL platform-aware: web'de `''` (same-origin), native'de `https://app.postmanager.muhyi.academy`
  - `src/services/nativeFileStorage.ts` — Capacitor Filesystem + Share adapter
  - `capacitor.config.ts`, `android/` klasörü Capacitor tarafından üretildi
  - `package.json` scripts: `build:mobile`, `android:open`, `android:run`
  - AndroidManifest'e storage permission eklendi (Android ≤ 32 için)
  - `doc/MOBILE.md` — JDK/Android Studio kurulum, live-reload, Play Store release kılavuzu
- **098fba4**: JDK 21 için `android/gradle.properties`'e `org.gradle.java.home` pin edildi. Kullanıcı React Native projesi için JDK 17 kullandığından JAVA_HOME'a dokunmadan proje-lokal çözüm.
- **68a857d**: Arkadaşın telefonunda "Missing parent directory" hatası — `Directory.ExternalStorage` Android 11+ scoped storage'a takıldı. Fix: `Directory.External` (app sandbox, permission gerekmez) + Share intent.
- **ec2345a**: "Failed to fetch dynamically imported module: .../nativeFileStorage-CbsYgpKW.js" — Capacitor WebView `https://localhost/` şemasında dynamic import çalışmıyor. Fix: `await import(...)` → static top-level import. Bundle 0.77 kB gzip büyüdü.
- **50b13d8**: Kullanıcı telefonunda cache kalıyordu — `versionCode 1 → 2`, versionName 1.0.1. Android upgrade olarak algılıyor, cache temizleniyor.
- **c0abd9e**: Kullanıcı geri bildirimi — "Galeriye kaydet seçeneği paylaş menüsünde çıkmıyor". Doğru: Android paylaş menüsü save target değil share target listeler. Fix: **iki ayrı buton**:
  - `saveToGallery()` — `@capacitor-community/media@9.1.0` ile MediaStore API, direkt Galeri'ye yazar
  - `shareFile()` — Directory.External + Share intent (mevcut)
  - Version 1.0.2, versionCode 3
  - AndroidManifest: `READ_MEDIA_IMAGES` (Android 13+)
- **b9d3969**: v1.0.2'de "Album identifier required" hatası — `@capacitor-community/media@9`'da `savePhoto`'nun `albumIdentifier` parametresi **zorunlu**. Fix: `ensurePostManagerAlbum()` helper — önce `Media.getAlbums()`, yoksa `Media.createAlbum({name})`, sonra identifier ile `savePhoto`. Version 1.0.3, versionCode 4.

### Sürüm 6 — Textarea IME Lag Fix (Son Bug)

Kullanıcı geri bildirimi: "Yazı girişi yapınca karakterler kayboluyor, backspace çalışmıyor, kes-yapıştır ile yeniden yazmak gerek, Türkçe klavye sorunu".

- **fc0e6b1** (v1.0.5, versionCode 6): TextPropertiesPanel textarea her tuş vuruşunda `onChange`'i tetikleyip layer.text'i güncelliyor → EditorStep re-render → PostCanvas word-wrap+segment measure+Konva Group layout → main thread 16ms'yi aşıyor → Android WebView'in IME composition'ı (Türkçe klavye için kritik) abort ediliyor. Fix: `localText` state + 150ms debounce useEffect. Textarea artık kendi state'inde, canvas'a 150ms sonra tek seferde commit ediliyor. Layer değişince (`layer.id`) local state resync.

---

## 🏗 Mevcut Mimari (Snapshot)

```
Repo:       https://github.com/AhmetVDemir/PostManager
Web:        https://app.postmanager.muhyi.academy (Cloudflare Pages + Functions)
APK Debug:  android/app/build/outputs/apk/debug/app-debug.apk (v1.0.5)

┌──────────────────────────────────────────────────────────────┐
│                        Frontend (React)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Bg Step  │→ │ Size     │→ │ Editor   │→ │ Export   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                    ↓                          │
│                          ┌──────────────────┐                │
│                          │  PostCanvas      │                │
│                          │  (Konva Stage)   │                │
│                          └──────────────────┘                │
│                                                               │
│  services/                                                    │
│  ├── cloudAI.ts       — /api/suggest çağrıları               │
│  ├── imageAnalysis    — offline heuristic öneri              │
│  ├── fileStorage.ts   — Web FSA (klasör seç + kaydet)        │
│  └── nativeFileStorage.ts — Capacitor Media + Share          │
│                                                               │
│  utils/                                                       │
│  ├── platform.ts      — isNative(), getApiBase()             │
│  └── textSegments.ts  — [[highlight]] parse + word-wrap      │
└──────────────────────────────────────────────────────────────┘
             ↓ (native only)          ↓ (all platforms)
    Capacitor Plugins:         Cloudflare Function:
    - @capacitor/filesystem    /api/suggest
    - @capacitor/share             ↓
    - @capacitor-community/    Groq API
      media                    (Llama 4 Scout Vision)
```

**Provider (AI)**: Groq — Llama 4 Scout 17B Instruct. Env vars: `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` — Cloudflare Pages Settings → Variables and Secrets.

**Deploy pipeline**:
- `git push` → GitHub → Cloudflare Pages otomatik build & deploy (`npm run build`)
- APK için: local `npm run build:mobile` + `cd android && ./gradlew assembleDebug`

---

## 🐛 Aktif / Bilinen Sorunlar

| Sorun | Durum |
|---|---|
| Textarea Türkçe klavye lag (IME cancel) | ✅ **fc0e6b1** ile fixed, v1.0.5 APK'da. Kullanıcı doğrulaması bekleniyor. |
| Galeriye Kaydet — "Album identifier required" | ✅ **b9d3969** ile fixed (v1.0.3+). Album ilk kayıtta yaratılıyor. |
| Galeriye Kaydet — paylaş menüsünde yoktu | ✅ **c0abd9e** ile iki ayrı buton ile çözüldü (v1.0.2+). |
| APK'da dynamic import fetch fail | ✅ **ec2345a** ile static import ile çözüldü. |
| Android 11+ scoped storage | ✅ **68a857d** ile Directory.External + share intent. |
| JDK 17 host'ta Capacitor 8 build hatası | ✅ **098fba4** ile `gradle.properties`'te JDK 21 pin. |
| APK cache Android'de kalıyordu | ✅ **50b13d8** ile versionCode bump'ı standart hale getirdi. |

**Test edilmesi bekleyen** (henüz kullanıcı doğrulamadı):
- v1.0.5'te IME lag fixed mi? Türkçe uzun paragraf yazımı sorunsuz mu?

---

## 🗺 Sıradaki Adımlar (Öncelik Sırası)

### 🥇 Öncelik 1: v1.0.5 Test Doğrulaması

Kullanıcı APK'yı kursun. Test:
1. Eski PostManager'ı **tamamen kaldır** (uzun bas → Kaldır — güncelleme değil, tam silme)
2. `android/app/build/outputs/apk/debug/app-debug.apk` (4.79 MB, versiyon **1.0.5**) telefona yolla (WhatsApp/Drive/Telegram)
3. Kur → Ayarlar → Uygulamalar → PostManager → **Sürüm: 1.0.5** doğrula
4. Editor → Yazı input:
   - Uzun Türkçe paragraf yaz (ğüşıöç dahil)
   - Ortadan bir kısım seçip sil
   - Backspace ile karakterler sil, yeniden yaz
   - Cursor hareket ediyor mu, karakterler kayboluyor mu?
5. Kaydet adımı → **💾 Galeriye Kaydet** + **📤 Paylaş** butonları test

Sonuç:
- ✅ Sorunsuz → **Google Play submission** adımına geç (aşağıda)
- ⚠️ Hala sorun → console log topla (`adb logcat -s Capacitor:*`), yeni fix

### 🥈 Öncelik 2: Google Play Store Submission

Kullanıcı ilk mesajında "google play de yükle" dedi. v1.0.5 test onaylandıktan sonra:

1. **Signed release AAB üret** (debug APK değil):
   ```powershell
   # Keystore yarat (bir kere, sonra sakla — kaybolursa update veremezsin!)
   & "C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot\bin\keytool.exe" -genkey -v `
     -keystore C:\Users\ahmet\postmanager-release.jks `
     -keyalg RSA -keysize 2048 -validity 10000 -alias postmanager

   # Signed AAB build
   Set-Location android
   .\gradlew.bat bundleRelease
   # Çıktı: android/app/build/outputs/bundle/release/app-release.aab
   ```
2. **Google Play Console** hesabı aç ($25 tek seferlik dev ücreti)
3. **Yeni uygulama oluştur**:
   - Adı: PostManager
   - Kategori: Photography → Photo Editors
   - Language: Turkish (primary), English (secondary)
4. **Store listing**:
   - Icon: 512×512 (mevcut favicon'dan büyütülür)
   - Feature graphic: 1024×500 (doc/assets/promo-poster.svg baz alınabilir)
   - Screenshot: min 2, 1080×1920 telefondan alınmış (editor + editor advanced + export)
   - Kısa açıklama (80 karakter): "AI'lı sosyal medya post editörü — yazı, filtre, efekt"
   - Uzun açıklama: 4000 karakter, özellikler listesi (PROJE.md'den özet)
5. **Privacy Policy** — Cloudflare Pages'ta ayrı bir sayfa lazım:
   - "Uygulama görselleri sadece cihazda saklar, yalnızca AI önerisi için sunucuya yollanır ve saklanmaz" gibi.
   - Örnek: `https://app.postmanager.muhyi.academy/privacy` — basit bir HTML sayfa yeter.
6. **Content rating** anketi (5 dk, foto/genel içerik)
7. **Data safety** — hangi veriler toplanır: none (AI istekleri saklanmıyor)
8. **Target audience** — 13+ (görsel editör)
9. **App content** — ads yok, in-app purchases yok
10. **Testing**:
    - Internal testing track (kendi email + 2-3 arkadaş) → hızlı
    - Sonra Closed → Open → Production
11. **AAB yükle** → Play tarayıcıdan içerik kontrolü (birkaç saat - 1 hafta) → yayın

### 🥉 Öncelik 3: Kod / UX İyileştirmeleri (Bekleyen v0.4/v0.5)

ROADMAP.md'de yazılı:

- **Undo/Redo** (Ctrl+Z/Y, en çok istenen power-user feature)
- **Şablon kütüphanesi** (LocalStorage'da kompozisyon snapshot'ları)
- **Çoklu seçim** (Shift+click) + kopyala/yapıştır
- **Hizalama yardımcıları** (snap to center/edge/grid)
- **iOS APK** (Capacitor iOS platform — macOS + Xcode gerek)
- **Tauri masaüstü .exe** (Windows/macOS/Linux, ~6 MB)
- **Video export** (Konva animation + FFmpeg.wasm)
- **AI Background Removal** (Transformers.js browser-içi)

### 🎬 Bağımsız Proje: FrameToVideo

Kullanıcının bahsettiği ayrı proje — ROADMAP'in altında not var. **PostManager'a entegre edilmeyecek.** Yeni klasör, ayrı repo, ayrı domain (örn `video.muhyi.academy`).

**Kısa özet**: 2 görsel al (start + end frame) → AI arasını doldur → 3-10 sn MP4.

**Yaklaşımlar** (ROADMAP.md'de detaylı):
- **Replicate API** ($1 free credit → 50+ video, sonra $0.01/sn) — Önerilen MVP
- **Luma Dream Machine** (30/ay free, sonra $9/ay) — En yüksek kalite
- **Browser-içi Transformers.js + FILM + FFmpeg.wasm** ($0 sonsuza dek, 150MB ilk indirme)

Kullanıcı "şu an başlamıyoruz" dedi. İlerde döneceğiz.

---

## 🔧 Yeni Session İçin Hızlı Başlangıç

Yeni bir session açtığında:

1. **İlk komut** — durum kontrol:
   ```powershell
   cd C:\Users\ahmet\Project\PostManager
   git log --oneline -5
   git status
   ```

2. **Bu dokümanı okut agent'a** — `doc/HANDOFF.md`.

3. **APK/Web durumu**:
   - Cloudflare: `https://app.postmanager.muhyi.academy` — son commit deploy edildi mi kontrol et (Cloudflare dashboard → Deployments)
   - APK: `android/app/build/outputs/apk/debug/app-debug.apk` — silinmiş olabilir, rebuild:
     ```powershell
     npm run build:mobile
     Set-Location android
     .\gradlew.bat assembleDebug --no-daemon
     ```

4. **AI test**: Sitede `🎁 AI'ya bırak` butonu ile Groq LLM'e istek gidiyor mu doğrula. Env vars Cloudflare'de: `LLM_API_KEY`, `LLM_BASE_URL=https://api.groq.com/openai/v1`, `LLM_MODEL=meta-llama/llama-4-scout-17b-16e-instruct`.

5. **Kullanıcının o gün ne istediğine odaklan**:
   - Bug rapor mu → önce debug (adb logcat + tarayıcı console)
   - Yeni feature mı → önce ROADMAP'te var mı bak
   - Deploy/release mi → bu dokümanda "Öncelik 2" bölümüne bak

---

## 📚 Referans Dosyalar

| Dosya | Amaç |
|---|---|
| [PROJE.md](PROJE.md) | Mimari + veri modeli + tek satır özet |
| [ROADMAP.md](ROADMAP.md) | Tamamlanan + planlanan özellikler |
| [DEPLOY.md](DEPLOY.md) | Cloudflare Pages deploy adımları |
| [MOBILE.md](MOBILE.md) | Android APK build (JDK/Studio kurulum, live-reload, release signing) |
| [HANDOFF.md](HANDOFF.md) | **Bu doküman** — session'lar arası devir |
| [assets/promo-poster.svg](assets/promo-poster.svg) | 1080×1080 tanıtım posteri |
| [assets/promo-story.svg](assets/promo-story.svg) | 1080×1920 story posteri |

---

## 🔑 Kritik Bilgiler (Aklıma Sık Sık Sor)

- **Groq API key**: Kullanıcının kişisel keyi Cloudflare Pages env vars'ta. Konuşmada asla yazma.
- **JDK 21 yolu**: `C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot` — Capacitor 8 için zorunlu. `android/gradle.properties`'te pinned.
- **JDK 17**: Kullanıcının React Native projesi için ayrı kurulu, `JAVA_HOME` oraya bakıyor. PostManager gradle'ı kendisi JDK 21'i override ediyor.
- **App ID**: `academy.muhyi.postmanager` (Play Console'da bu değişemez, yeni sürümler aynı ID'yi kullanmak zorunda).
- **Custom domain**: `app.postmanager.muhyi.academy` — Güzel Hosting cPanel'de CNAME `postmanager-7ey.pages.dev`'i gösteriyor.
- **Cloudflare Pages proje adı**: `postmanager` (subdomain `postmanager-7ey.pages.dev`).
- **GitHub repo**: `AhmetVDemir/PostManager` public.
- **Native storage sıralaması**: v1.0 (Directory.ExternalStorage) → v1.0.1 (versionCode bump) → v1.0.2 (Directory.External + iki buton) → v1.0.3 (album identifier fix) → v1.0.4 (rebuild) → v1.0.5 (IME lag fix).

---

## 📝 Kullanıcının Konuşma Tarzı ile İlgili Notlar

- Türkçe iletişim, cümleleri kısa
- Teknik detaydan çok "çalışıyor mu / çalışmıyor" pratik yaklaşım
- Yeni özellik önerdiğinde iki-üç seçenek verip AskUserQuestion ile sormak seviyor
- API key gibi sensitive değeri konuşmaya paylaştı — güvenlik uyarısı hep ver
- Web sürümünü asla bozma — mobil eklerken de bu kuralı hep tekrar hatırlatıyor

---

Bu doküman tarihli: **2026-07-12** (son commit `fc0e6b1`).
Yeni major değişiklikten sonra bu dosyayı güncelle.

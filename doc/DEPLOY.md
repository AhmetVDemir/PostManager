# Cloudflare Pages'e Deploy Etme — Adım Adım

PostManager 100% statik bir SPA — backend yok, sadece tarayıcıda çalışıyor. Cloudflare Pages **sonsuza dek ücretsiz**, sınırsız bandwidth, otomatik SSL ve global CDN sunuyor. 2-3 kullanıcı için fazlasıyla yeterli, milyonlar için de yeterli olur.

## Ön gereksinimler

- [ ] GitHub hesabı (ücretsiz)
- [ ] Cloudflare hesabı (ücretsiz — [dash.cloudflare.com](https://dash.cloudflare.com/sign-up))
- [ ] Bu proje bir GitHub repository'sinde

---

## 1. GitHub'a yükle

Proje şu an local. Git zaten initialized, sadece commit + push gerekir.

```powershell
# Bu klasördeyken (C:\Users\ahmet\Project\PostManager)

# (Sadece ilk seferde) GitHub'da yeni bir repo oluştur — https://github.com/new
# Repo adı: postmanager (private veya public, fark etmez)
# README, .gitignore, license EKLEME (zaten var)

# Local repo'yu remote'a bağla
git remote add origin https://github.com/<KULLANICI_ADIN>/postmanager.git

# Tüm dosyaları stage'le ve commit et
git add .
git commit -m "Initial PostManager"

# Push
git branch -M main
git push -u origin main
```

> Eğer remote zaten bağlıysa: `git remote -v` ile kontrol et. Tek `git push` yeter.

---

## 2. Cloudflare Pages'e bağla

1. [dash.cloudflare.com](https://dash.cloudflare.com/) → giriş yap
2. Sol menüden **Workers & Pages** → **Create application** → **Pages** sekmesi → **Connect to Git**
3. **GitHub'a yetki ver**, postmanager repo'sunu seç → **Begin setup**
4. **Build settings** ekranında şunları gir:

| Alan | Değer |
|---|---|
| Project name | `postmanager` (otomatik dolar) |
| Production branch | `main` |
| Framework preset | **None** (manuel ayarlayacağız) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (varsayılan) |
| Node version | `20` (Environment variables altında `NODE_VERSION=20` ekle — vite 6 için 18+ yeterli) |

5. **Save and Deploy** → 1-2 dakika içinde build biter, deploy edilir.
6. URL'in formatı: `https://postmanager.pages.dev` (veya `postmanager-xyz.pages.dev`)

---

## 3. Sonsuza dek otomatik deploy

İlk bağlantıdan sonra **her `git push main` otomatik deploy tetikler**. Manuel müdahale yok. Build log'larını Cloudflare dashboard'undan görebilirsin.

PR'lardan da preview deployment'lar açılır — feature branch test edilebilir.

---

## 4. (Opsiyonel) Kendi domain

`.pages.dev` URL'i gayet stabil, ama kendi domain'in varsa:

1. Cloudflare Pages projesi → **Custom domains** → **Set up a custom domain**
2. `post.example.com` veya benzeri bir alt domain gir
3. Cloudflare otomatik CNAME ekler (eğer DNS de Cloudflare'de ise tek tıkla)
4. SSL otomatik gelir, 1-2 dakikada aktif olur

---

## 5. Build/Çalışma notları

### PWA otomatik

`vite-plugin-pwa` build sırasında otomatik olarak `manifest.webmanifest` + `sw.js` üretir. Kullanıcı tarayıcıdan **Ana ekrana ekle** ile uygulamayı PWA olarak yükleyebilir.

### Tarayıcı uyumluluğu

| Özellik | Chrome / Edge | Firefox | Safari |
|---|---|---|---|
| Görüntüleme, filtre, yazı, glow/shadow, export | ✅ | ✅ | ✅ |
| File System Access API (klasör seçici) | ✅ | ❌ (Downloads'a iner) | ❌ (Downloads'a iner) |
| PWA "Ana ekrana ekle" | ✅ | ✅ | ✅ (iOS Safari) |
| Pollinations.ai (AI ile geliştir) | ✅ | ✅ | ✅ |

Firefox/Safari kullanıcıları uygulamanın tamamını kullanır, sadece "klasör seç" yerine indirme yapılır.

### Bandwidth tüketimi

- İlk yükleme: ~700 KB (gzip'li bundle)
- Sonraki ziyaretler: ~0 (service worker cache)
- Google Fonts: kullanıcının seçtiği mood'a göre dinamik (5 font / mood, ~50 KB / font)

Cloudflare Pages free tier: **sınırsız bandwidth + 500 build/ay**. 2-3 kullanıcılık trafik bu limitlerin çok altında.

---

## 6. Backup: Yerel kullanım

Cloudflare hesabı istemiyorsan, aşağıdakiler de çalışır:

### Tek HTML dosyası (USB ile paylaş)
```powershell
npm run build
```
`dist/` klasörünü zip'le, USB'ye at, herhangi bir tarayıcıyla `index.html`'i aç.
> Not: `file://` protokolünde File System Access API çalışmaz — kullanıcılar Downloads'a indirir.

### Lokal sunucu (LAN'da paylaş)
```powershell
npm run build
npm run preview
```
Aynı Wi-Fi'daki cihazlar `http://<senin-ip>:4173` üzerinden erişebilir.

### Tauri ile masaüstü .exe (ileride)
```powershell
npm install -D @tauri-apps/cli
npx tauri init
npx tauri build
```
Çıktı: `src-tauri/target/release/postmanager.exe` (~6 MB). Tüm web özellikleri + native dosya erişimi.

---

## Hatalı senaryolar — kısa kılavuz

| Sorun | Çözüm |
|---|---|
| Build "command not found: npm" hatası | Node version env var'ı eklenmemiş — Cloudflare Pages → Settings → Environment variables → `NODE_VERSION=20` |
| Tarayıcıda boş sayfa | Console aç. Genelde 404 — `Build output directory: dist` doğru ayarlanmamış |
| PWA "Ana ekrana ekle" görünmüyor | HTTPS gerek (Cloudflare otomatik halleder). Localhost dev'de Chrome zaten gösterir |
| AI butonu hep "cevap vermedi" diyor | İnternet sorunu veya Pollinations rate limit — 10-30 sn sonra tekrar dene |

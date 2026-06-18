# PostManager — Mobil (Android APK) Geliştirme

> PostManager web ve mobil için **tek codebase** kullanır. Web her zaman birinci sınıf çalışmaya devam eder. Mobil build, web bundle'ın Capacitor ile native bir WebView'e sarmalanmasıdır.

---

## 🏗 Mimari özet

```
src/                       ← React kaynak kodu — web & mobile ortak
├── utils/platform.ts      ← isNative() + getApiBase() (tek nokta)
├── services/
│   ├── cloudAI.ts         ← API URL platform-aware
│   ├── fileStorage.ts     ← Web FSA implementation
│   └── nativeFileStorage.ts ← Capacitor Filesystem + Share

capacitor.config.ts        ← appId, name, webDir
android/                   ← Capacitor üretti (Gradle / Java native shell)

functions/api/suggest.ts   ← Cloudflare Pages Function (sadece web)
```

**Önemli**: Cloudflare Pages **web build**'i barındırır. APK içinde de **fetch'ler aynı Cloudflare endpoint'ine gider** (mutlak URL ile). Yani:

- AI key sunucuda — APK'ya inmez
- Function her platformdan erişilebilir
- Tek bir backend, iki client (web + mobile)

---

## 🛠 Geliştirme akışı

### Yalnızca web değişikliği
Hiçbir mobil komut çalıştırma — web her zaman birinci sınıf.

```powershell
npm run dev       # http://localhost:5173
npm run build     # dist/ üret → Cloudflare auto deploy
```

### Mobil değişikliği veya hızlı APK
Web bundle'ı build et + Capacitor'a senkronize et + Android Studio aç:

```powershell
npm run build:mobile     # build + cap sync
npm run android:open     # üsteki + Android Studio aç
```

> **İlk seferinde Android Studio kurulu olmalı** — aşağıya bak.

---

## 📦 Tek seferlik kurulum (Android Studio)

1. **JDK 17** yükle — [Microsoft OpenJDK 17](https://learn.microsoft.com/en-us/java/openjdk/download#openjdk-17) (Windows için MSI)
2. **Android Studio** indir → [developer.android.com/studio](https://developer.android.com/studio)
3. Kurulum sırasında:
   - "Standard" preset seç
   - Android SDK + Android SDK Platform-Tools + Android Virtual Device dahil olsun
4. İlk açılışta SDK Manager → API Level 34 (Android 14) indir
5. `ANDROID_HOME` env var Windows'a otomatik eklenir, kontrol et:
   ```powershell
   echo $env:ANDROID_HOME  # genelde C:\Users\<adın>\AppData\Local\Android\Sdk
   ```

---

## 🚀 İlk APK çıktısı

```powershell
npm run android:open
```

Bu komut:
1. Web bundle'ı `dist/`'e build eder
2. Capacitor `android/app/src/main/assets/public/`'a senkronize eder
3. Android Studio'yu açar

Android Studio'da:
1. Üst menü → **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Build bittiğinde sağ alt köşede notification: "**locate**" linkine tıkla
3. `app-debug.apk` dosyasını telefonuna yolla (USB veya Google Drive)
4. Telefonda yükle (Bilinmeyen kaynaklara izin gerekiyor)

---

## 🧪 Cihazda canlı geliştirme (live reload)

USB ile bağlı bir telefonda dev server'a bağlanmak için:

1. Bilgisayar ve telefon **aynı Wi-Fi'da** olsun
2. Bilgisayarının lokal IP'sini öğren:
   ```powershell
   ipconfig | findstr IPv4    # örn 192.168.1.42
   ```
3. `capacitor.config.ts`'i geçici düzenle:
   ```ts
   server: {
     androidScheme: 'https',
     url: 'http://192.168.1.42:5173',  // bilgisayarının IP'si
     cleartext: true,
   }
   ```
4. Çalıştır:
   ```powershell
   npm run dev               # ayrı terminal, dev server açık kalsın
   npm run android:run       # USB telefonda build + install + launch
   ```

> Production build'den önce `capacitor.config.ts`'teki `url` ve `cleartext` ayarlarını geri al.

---

## 🔐 Google Play Store'a yükleme (release APK / AAB)

1. Android Studio → **Build** → **Generate Signed Bundle / APK**
2. **Android App Bundle (.aab)** seç (Play Store .aab istiyor, .apk değil)
3. İlk seferinde yeni **keystore** oluştur:
   - Konum: `C:\Users\<adın>\postmanager-keystore.jks`
   - Şifreleri **bir yerde sakla** — kaybedersen update veremezsin
   - Validity: 25+ yıl
   - Alias: `postmanager`
4. Build tamamlanır → `.aab` dosyası oluşur
5. [Google Play Console](https://play.google.com/console) → yeni uygulama oluştur (tek seferlik $25 dev ücreti)
6. `.aab` yükle + screenshot + açıklama + privacy policy

> Update etmek için: aynı keystore ile tekrar imzala, `versionCode`'u `android/app/build.gradle`'da artır.

---

## 🐛 Sık sorunlar

| Hata | Çözüm |
|---|---|
| `gradle: command not found` | Android Studio'yu aç, ilk kez kurulum sihirbazını tamamla. Gradle wrapper indirilir. |
| `Cannot find a Java installation matching languageVersion=21` veya `invalid source release: 21` | Capacitor 8 JDK 21 ister. JDK yüklü olsa bile JAVA_HOME farklı bir JDK'yı gösteriyor olabilir (örn React Native projesi için JDK 17). Çözüm: [Microsoft OpenJDK 21](https://learn.microsoft.com/en-us/java/openjdk/download#openjdk-21) yükle, sonra `android/gradle.properties`'te `org.gradle.java.home`'u kurulum yoluna ayarla (örn `C:\\Program Files\\Microsoft\\jdk-21.0.11.10-hotspot`). Bu sadece bu projeye uygulanır — diğer projelerin gradle ayarlarını etkilemez. |
| `cap sync` "missing dist directory" | Önce `npm run build` çalıştır, sonra `cap sync`. `build:mobile` script'i bunu birleştirir. |
| Telefonda "uygulama yüklenemedi" | Bilinmeyen kaynaklardan yükleme izni ver: Ayarlar → Güvenlik → Bilinmeyen kaynaklar (Android 8+ için her uygulama bazında) |
| AI butonu "network error" | `capacitor.config.ts`'te server.url unutulmuş olabilir. Production için boşalt veya kaldır. |
| Galeriye kaydedilmiyor | AndroidManifest'te storage permission var (Android ≤29 için). Android 10+ scoped storage otomatik. Telefon ayarlarından izin ver: Uygulamalar → PostManager → İzinler → Depolama. |

---

## 🔄 Web ↔ Mobil iki yönlü geliştirme

**Altın kural**: web'i bozma. Her commit web'de çalışır olmalı.

| Değişiklik | Web etkisi | Mobil etkisi |
|---|---|---|
| UI tweak (React component) | Hot reload + build | `npm run build:mobile` ile APK'ya yansır |
| Yeni Capacitor plugin ekleme | Tree-shake olur — yok sayılır | `npm run android:open` → cap sync |
| API endpoint ekleme (CF Function) | Otomatik deploy | Native fetch'ler de Cloudflare URL'e gider |
| `capacitor.config.ts` değişikliği | Etkilemez | `cap sync` zorunlu |

**Native plugin import etmenin doğru yolu** — yalnızca runtime'da yükle ki web bundle'a girmesin:

```ts
// ❌ Top-level import — web bundle büyür, Cloudflare deploy yavaşlar
import { Filesystem } from '@capacitor/filesystem'

// ✅ Dynamic import — sadece native'de yüklenir
if (isNative()) {
  const { Filesystem } = await import('@capacitor/filesystem')
  // ...
}
```

Tüm native kullanan kod `src/services/nativeFileStorage.ts` gibi ayrı dosyalarda — `ExportStep.tsx` bunu `await import(...)` ile dinamik yükler.

---

## 📊 iOS (ileride)

```powershell
npm install @capacitor/ios
npx cap add ios
```

iOS build için **macOS + Xcode** gerek. Şimdilik Android'e odaklan, iOS sonra.

---

## 🎯 Hızlı başlangıç özet

| Yapacağın | Komut |
|---|---|
| Web dev | `npm run dev` |
| Web build → Cloudflare | `git push` |
| İlk APK build | Android Studio kur → `npm run android:open` → Build APK |
| Sonraki APK build | `npm run android:open` → Build → APK |
| Cihazda canlı | `capacitor.config.ts` url set + `npm run dev` + `npm run android:run` |
| Google Play release | Android Studio → Generate Signed Bundle |

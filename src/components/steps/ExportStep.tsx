import { useEffect, useRef, useState } from 'react'
import type { AppState } from '../../types'
import { CANVAS_DIMENSIONS } from '../../types'
import { PostCanvas, type PostCanvasHandle } from '../PostCanvas'
import { useSaveDirectory } from '../../hooks/useSaveDirectory'
import { isNative } from '../../utils/platform'
// Static import — dynamic import() fails in Capacitor WebView under
// https://localhost/ scheme. Plugin code is gated by isNative() so it's
// dead code on web (Tailwind tree-shake), but it must be in the main
// bundle so Capacitor can resolve it at runtime.
import { nativeFileStorage } from '../../services/nativeFileStorage'

interface Props {
  state: AppState
  onBack: () => void
  onRestart: () => void
}

type FormatChoice = 'png' | 'jpeg'

function buildFilename(format: string, ext: FormatChoice): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  return `post-${format}-${stamp}.${ext === 'jpeg' ? 'jpg' : 'png'}`
}

export function ExportStep({ state, onBack, onRestart }: Props) {
  const canvasRef = useRef<PostCanvasHandle>(null)
  const save = useSaveDirectory()
  const [busy, setBusy] = useState(false)
  const [maxSize, setMaxSize] = useState(() => Math.min(520, window.innerHeight - 360))
  const [status, setStatus] = useState<{ kind: 'ok' | 'err' | 'info'; msg: string } | null>(null)
  const [exportFormat, setExportFormat] = useState<FormatChoice>('png')
  const [jpegQuality, setJpegQuality] = useState(92)

  useEffect(() => {
    const onResize = () => setMaxSize(Math.min(520, window.innerHeight - 360))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const downloadFallback = async (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const blob = await canvasRef.current?.exportPng({
        mimeType: exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
        quality: jpegQuality / 100,
      })
      if (!blob) {
        setStatus({ kind: 'err', msg: 'Görsel oluşturulamadı' })
        return
      }
      const filename = buildFilename(state.format, exportFormat)

      // Native (Android/iOS) — use Capacitor Filesystem + Share
      if (isNative()) {
        try {
          const res = await nativeFileStorage.save(filename, blob)
          if (res.ok) {
            setStatus({
              kind: 'ok',
              msg: res.reason ? `${filename} (${res.reason})` : `Galeriye kaydedildi: ${filename}`,
            })
          } else {
            setStatus({ kind: 'err', msg: `Kayıt başarısız: ${res.reason ?? 'bilinmeyen'}` })
          }
        } catch (e) {
          setStatus({ kind: 'err', msg: `Native kayıt hatası: ${e instanceof Error ? e.message : String(e)}` })
        }
        return
      }

      if (save.supported && save.handle) {
        const res = await save.writeFile(filename, blob)
        if (res.ok) {
          setStatus({ kind: 'ok', msg: `Kaydedildi: ${save.name}\\${filename}` })
        } else if (res.reason === 'permission-denied') {
          setStatus({ kind: 'err', msg: 'Klasör izni reddedildi. Tekrar klasör seçin.' })
        } else {
          await downloadFallback(blob, filename)
          setStatus({ kind: 'info', msg: `Klasöre yazılamadı, indirme yapıldı: ${filename}` })
        }
      } else {
        await downloadFallback(blob, filename)
        setStatus({
          kind: 'info',
          msg: save.supported
            ? `İndirildi: ${filename}. Sabit klasör için "Klasör Seç" butonunu kullan.`
            : `İndirildi: ${filename}. (Tarayıcı klasör seçimini desteklemiyor — Chrome/Edge öneriyoruz.)`,
        })
      }
    } finally {
      setBusy(false)
    }
  }

  const pickFolder = async () => {
    const h = await save.pickDirectory()
    if (h) setStatus({ kind: 'ok', msg: `Klasör seçildi: ${h.name}` })
    else if (!save.supported)
      setStatus({ kind: 'err', msg: 'Bu tarayıcı klasör seçmeyi desteklemiyor (Chrome/Edge gerekiyor).' })
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Önizleme & Kaydet</h2>
        <p className="mt-2 text-white/60">
          {CANVAS_DIMENSIONS[state.format].width} × {CANVAS_DIMENSIONS[state.format].height} px — sosyal medya için hazır
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr,320px]">
        <div className="flex justify-center">
          <PostCanvas
            ref={canvasRef}
            background={state.background}
            format={state.format}
            filter={state.filter}
            layers={state.layers}
            selectedLayerId={null}
            maxDisplaySize={maxSize}
          />
        </div>

        <div className="flex flex-col gap-4">
          {isNative() ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="text-xs font-medium uppercase tracking-wider text-emerald-300/80">Kayıt yeri</div>
              <div className="mt-1 text-sm text-emerald-100/90">
                📁 Galeri / Pictures &gt; PostManager
              </div>
              <div className="mt-1.5 text-xs text-emerald-100/60">
                Kayıttan sonra paylaşma menüsü açılır — Instagram, WhatsApp vb. direkt paylaşabilirsin.
              </div>
            </div>
          ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-white/40">Kayıt klasörü</div>
            <div className="mt-1 text-sm">
              {save.handle ? (
                <span className="text-emerald-300">📁 {save.name}</span>
              ) : (
                <span className="text-white/50">Henüz seçilmedi — Downloads klasörüne inecek</span>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={pickFolder}
                disabled={!save.supported}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {save.handle ? 'Değiştir' : 'Klasör Seç'}
              </button>
              {save.handle && (
                <button
                  type="button"
                  onClick={() => save.reset()}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
                >
                  Temizle
                </button>
              )}
            </div>
            {!save.supported && (
              <div className="mt-2 text-xs text-amber-300">
                Bu tarayıcı klasör seçimi desteklemiyor. Chrome veya Edge önerilir.
              </div>
            )}
          </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-white/40">Format</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportFormat('png')}
                className={[
                  'rounded-lg border px-3 py-2 text-sm font-medium transition',
                  exportFormat === 'png'
                    ? 'border-indigo-400 bg-indigo-500/15 text-white'
                    : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]',
                ].join(' ')}
              >
                PNG
                <div className="text-[10px] font-normal text-white/50">Kayıpsız · daha büyük</div>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('jpeg')}
                className={[
                  'rounded-lg border px-3 py-2 text-sm font-medium transition',
                  exportFormat === 'jpeg'
                    ? 'border-indigo-400 bg-indigo-500/15 text-white'
                    : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]',
                ].join(' ')}
              >
                JPG
                <div className="text-[10px] font-normal text-white/50">Küçük dosya · sosyal medya</div>
              </button>
            </div>
            {exportFormat === 'jpeg' && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>Kalite</span>
                  <span>{jpegQuality}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={jpegQuality}
                  onChange={(e) => setJpegQuality(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="rounded-xl bg-emerald-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {busy ? 'Kaydediliyor...' : isNative() ? `📲 ${exportFormat.toUpperCase()} kaydet & paylaş` : `⬇  ${exportFormat.toUpperCase()} olarak kaydet`}
          </button>

          {status && (
            <div
              className={[
                'rounded-lg border px-3 py-2 text-sm',
                status.kind === 'ok'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : status.kind === 'err'
                  ? 'border-red-500/30 bg-red-500/10 text-red-200'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-200',
              ].join(' ')}
            >
              {status.msg}
            </div>
          )}

          <button
            type="button"
            onClick={onRestart}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 hover:bg-white/[0.06]"
          >
            🔄 Yeni post oluştur
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl bg-white/5 px-5 py-3 text-sm font-medium text-white/80 hover:bg-white/10"
        >
          ← Geri
        </button>
      </div>
    </div>
  )
}

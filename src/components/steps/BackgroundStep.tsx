import { useCallback, useRef, useState } from 'react'
import type { Background, BackgroundKind, CanvasFormat } from '../../types'
import { CANVAS_DIMENSIONS, DEFAULT_IMAGE_TRANSFORM } from '../../types'

interface Props {
  background: Background
  format: CanvasFormat
  onChange: (b: Background) => void
  onNext: () => void
}

const SOLID_PRESETS = [
  '#0f172a', '#1e1b4b', '#831843', '#7c2d12', '#14532d', '#1e293b',
  '#ffffff', '#fef3c7', '#fce7f3', '#dbeafe', '#dcfce7', '#f3e8ff',
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
]

const GRADIENT_PRESETS: { from: string; to: string; label: string }[] = [
  { from: '#6366f1', to: '#d946ef', label: 'Indigo → Fuşya' },
  { from: '#f59e0b', to: '#ef4444', label: 'Gün batımı' },
  { from: '#10b981', to: '#06b6d4', label: 'Okyanus' },
  { from: '#ec4899', to: '#8b5cf6', label: 'Tatlı pembe' },
  { from: '#0f172a', to: '#7c3aed', label: 'Gece' },
  { from: '#fef3c7', to: '#fbcfe8', label: 'Pastel' },
]

export function BackgroundStep({ background, format, onChange, onNext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setKind = (kind: BackgroundKind) => onChange({ ...background, kind })

  const handleFile = useCallback(
    (file: File) => {
      setError(null)
      if (!file.type.startsWith('image/')) {
        setError('Lütfen bir görsel dosyası seçin (PNG, JPG, WebP...)')
        return
      }
      if (file.size > 25 * 1024 * 1024) {
        setError("Görsel 25 MB'tan büyük olamaz")
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Reset transform when a new image is loaded
          onChange({
            ...background,
            kind: 'image',
            imageDataUrl: reader.result,
            imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
          })
        }
      }
      reader.readAsDataURL(file)
    },
    [background, onChange],
  )

  const updateTransform = (patch: Partial<typeof background.imageTransform>) => {
    onChange({ ...background, imageTransform: { ...background.imageTransform, ...patch } })
  }

  void CANVAS_DIMENSIONS // referenced for typing
  const aspectClass = format === 'square' ? 'aspect-square' : 'aspect-[9/16]'

  const canContinue =
    background.kind === 'image' ? !!background.imageDataUrl : true

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Arka plan</h2>
        <p className="mt-2 text-white/60">Bir görsel yükle veya düz renk / gradient seç</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 rounded-xl bg-white/[0.04] p-1">
        {(['image', 'solid', 'gradient'] as BackgroundKind[]).map((k) => {
          const active = background.kind === k
          const label = k === 'image' ? 'Görsel' : k === 'solid' ? 'Düz Renk' : 'Gradient'
          const emoji = k === 'image' ? '🖼' : k === 'solid' ? '🎨' : '🌈'
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={[
                'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                active ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' : 'text-white/70 hover:bg-white/[0.06]',
              ].join(' ')}
            >
              <span>{emoji}</span>
              {label}
            </button>
          )
        })}
      </div>

      {/* IMAGE tab */}
      {background.kind === 'image' && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer.files?.[0]
              if (file) handleFile(file)
            }}
            className={[
              'group relative flex h-72 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed transition',
              dragOver
                ? 'border-indigo-400 bg-indigo-500/10'
                : 'border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.05]',
            ].join(' ')}
          >
            {background.imageDataUrl ? (
              <>
                <img
                  src={background.imageDataUrl}
                  alt="preview"
                  className="absolute inset-0 h-full w-full object-contain opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="relative z-10 mt-auto rounded-lg bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur">
                  Değiştirmek için tıkla veya sürükle
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl text-white/40 group-hover:text-white/60">↑</div>
                <div className="text-base font-medium text-white">Görseli buraya sürükle</div>
                <div className="text-sm text-white/50">veya tıkla — bilgisayarından seç (PNG, JPG, WebP)</div>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />
          </button>
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Crop & zoom panel — only when an image is loaded */}
          {background.imageDataUrl && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-white">🔍 Kadrajla & Zoom</div>
                <button
                  type="button"
                  onClick={() => onChange({ ...background, imageTransform: { ...DEFAULT_IMAGE_TRANSFORM } })}
                  className="rounded-md px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                >
                  Sıfırla
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr]">
                {/* Mini preview matching final aspect — uses the same offset semantics as PostCanvas */}
                {(() => {
                  const z = background.imageTransform.zoom
                  const ox = background.imageTransform.offsetX
                  const oy = background.imageTransform.offsetY
                  const factor = z > 1 ? (z - 1) / z : 0
                  const txPct = -factor * 50 * ox
                  const tyPct = -factor * 50 * oy
                  return (
                    <div className={`relative overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/10 ${aspectClass}`}>
                      <img
                        src={background.imageDataUrl ?? ''}
                        alt=""
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: `scale(${z}) translate(${txPct}%, ${tyPct}%)`,
                          transformOrigin: '50% 50%',
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
                    </div>
                  )
                })()}

                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>Zoom</span>
                      <span>{background.imageTransform.zoom.toFixed(2)}×</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={background.imageTransform.zoom}
                      onChange={(e) => updateTransform({ zoom: Number(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>↔ Yatay konum</span>
                      <span>{background.imageTransform.offsetX.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.01}
                      value={background.imageTransform.offsetX}
                      onChange={(e) => updateTransform({ offsetX: Number(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>↕ Dikey konum</span>
                      <span>{background.imageTransform.offsetY.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={-1}
                      max={1}
                      step={0.01}
                      value={background.imageTransform.offsetY}
                      onChange={(e) => updateTransform({ offsetY: Number(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div className="text-xs text-white/40">
                    Zoom &gt; 1 ise pan sürgüleri görselin hangi bölümünün görünür kalacağını ayarlar.
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* SOLID tab */}
      {background.kind === 'solid' && (
        <div className="flex flex-col gap-4">
          <div className="flex h-64 items-center justify-center rounded-2xl ring-1 ring-white/10" style={{ background: background.solidColor }}>
            <input
              type="color"
              value={background.solidColor}
              onChange={(e) => onChange({ ...background, solidColor: e.target.value })}
              className="h-16 w-32 cursor-pointer rounded-lg border-2 border-white/30 bg-transparent"
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Hızlı renkler</div>
            <div className="grid grid-cols-9 gap-2">
              {SOLID_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange({ ...background, solidColor: c })}
                  title={c}
                  style={{ background: c }}
                  className={[
                    'aspect-square rounded-lg border transition hover:scale-110',
                    background.solidColor === c ? 'border-indigo-400 ring-2 ring-indigo-400' : 'border-white/20',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GRADIENT tab */}
      {background.kind === 'gradient' && (
        <div className="flex flex-col gap-4">
          <div
            className="flex h-64 items-center justify-center rounded-2xl ring-1 ring-white/10"
            style={{
              background: `linear-gradient(${background.gradient.angle}deg, ${background.gradient.from}, ${background.gradient.to})`,
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">Başlangıç</label>
              <input
                type="color"
                value={background.gradient.from}
                onChange={(e) => onChange({ ...background, gradient: { ...background.gradient, from: e.target.value } })}
                className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">Bitiş</label>
              <input
                type="color"
                value={background.gradient.to}
                onChange={(e) => onChange({ ...background, gradient: { ...background.gradient, to: e.target.value } })}
                className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-white/50">
              <span>Açı</span>
              <span>{background.gradient.angle}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={360}
              value={background.gradient.angle}
              onChange={(e) => onChange({ ...background, gradient: { ...background.gradient, angle: Number(e.target.value) } })}
              className="w-full accent-indigo-500"
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Hazır gradientler</div>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...background,
                      gradient: { from: g.from, to: g.to, angle: background.gradient.angle },
                    })
                  }
                  className="h-14 rounded-lg ring-1 ring-white/10 transition hover:scale-[1.02]"
                  style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                  title={g.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!canContinue}
        onClick={onNext}
        className="w-full rounded-xl bg-indigo-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Devam →
      </button>
    </div>
  )
}

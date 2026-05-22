import { useEffect, useState } from 'react'
import type { CanvasFormat, FilterPreset, FontMood, TextLayer } from '../../types'
import { CANVAS_DIMENSIONS } from '../../types'
import { FONTS_BY_MOOD, MOOD_LABELS, loadAllMoodFonts, loadGoogleFont } from '../../data/fonts'
import { PostCanvas } from '../PostCanvas'

interface Props {
  imageDataUrl: string
  format: CanvasFormat
  filter: FilterPreset
  text: TextLayer
  onChange: (t: TextLayer) => void
  onBack: () => void
  onNext: () => void
}

export function TextStep({ imageDataUrl, format, filter, text, onChange, onBack, onNext }: Props) {
  const [mood, setMood] = useState<FontMood>('modern')
  const [maxSize, setMaxSize] = useState(() => Math.min(520, window.innerHeight - 360))
  const [fontsReady, setFontsReady] = useState(false)
  const dim = CANVAS_DIMENSIONS[format]

  useEffect(() => {
    const onResize = () => setMaxSize(Math.min(520, window.innerHeight - 360))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setFontsReady(false)
    loadAllMoodFonts(mood).then(() => setFontsReady(true))
  }, [mood])

  // If current font is not in selected mood, switch to the first one in that mood
  useEffect(() => {
    const fonts = FONTS_BY_MOOD[mood]
    if (!fonts.some((f) => f.family === text.fontFamily)) {
      const first = fonts[0]
      loadGoogleFont(first.family, first.weights).then(() =>
        onChange({ ...text, fontFamily: first.family }),
      )
    }
  }, [mood]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch: Partial<TextLayer>) => onChange({ ...text, ...patch })

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Yazı ekle</h2>
        <p className="mt-2 text-white/60">Yazıyı sürükleyerek istediğin yere yerleştir</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,360px]">
        <div className="flex flex-col items-center gap-3">
          <PostCanvas
            key={`${fontsReady}-${text.fontFamily}`}
            imageDataUrl={imageDataUrl}
            format={format}
            filter={filter}
            text={text}
            draggableText
            onTextDrag={(x, y) => update({ x, y })}
            maxDisplaySize={maxSize}
          />
          <div className="text-xs text-white/40">{dim.width} × {dim.height} px · canvas üzerinde sürükle</div>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1" style={{ maxHeight: '70vh' }}>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">
              Yazı
            </label>
            <textarea
              value={text.text}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Buraya yazını gir..."
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">
              Mood — resme uygun stil
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(MOOD_LABELS) as FontMood[]).map((m) => {
                const meta = MOOD_LABELS[m]
                const active = mood === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={[
                      'rounded-lg border px-2 py-2 text-center text-xs transition',
                      active
                        ? 'border-indigo-400 bg-indigo-500/15 text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]',
                    ].join(' ')}
                  >
                    <div className="text-base">{meta.emoji}</div>
                    <div className="font-medium">{meta.label}</div>
                  </button>
                )
              })}
            </div>
            <div className="mt-1 text-xs text-white/40">{MOOD_LABELS[mood].desc}</div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">
              Font {!fontsReady && <span className="text-indigo-300">(yükleniyor...)</span>}
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {FONTS_BY_MOOD[mood].map((f) => {
                const active = text.fontFamily === f.family
                return (
                  <button
                    key={f.family}
                    type="button"
                    onClick={() => update({ fontFamily: f.family })}
                    style={{ fontFamily: `"${f.family}", sans-serif` }}
                    className={[
                      'rounded-lg border px-3 py-2 text-left text-base transition',
                      active
                        ? 'border-indigo-400 bg-indigo-500/15 text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.06]',
                    ].join(' ')}
                  >
                    {f.family}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">
              Boyut
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => update({ fontSize: Math.max(12, text.fontSize - 10) })}
                className="h-9 w-9 shrink-0 rounded-lg border border-white/10 bg-white/[0.04] text-lg text-white/80 hover:bg-white/[0.08]"
              >
                −
              </button>
              <input
                type="range"
                min={12}
                max={400}
                value={text.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="flex-1 accent-indigo-500"
              />
              <button
                type="button"
                onClick={() => update({ fontSize: Math.min(400, text.fontSize + 10) })}
                className="h-9 w-9 shrink-0 rounded-lg border border-white/10 bg-white/[0.04] text-lg text-white/80 hover:bg-white/[0.08]"
              >
                +
              </button>
              <input
                type="number"
                min={12}
                max={400}
                value={text.fontSize}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (!Number.isNaN(n)) update({ fontSize: Math.max(12, Math.min(400, n)) })
                }}
                className="h-9 w-16 rounded-lg border border-white/10 bg-white/[0.04] px-2 text-center text-sm text-white"
              />
              <span className="text-xs text-white/50">px</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">
                Renk
              </label>
              <input
                type="color"
                value={text.color}
                onChange={(e) => update({ color: e.target.value })}
                className="h-9 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">
                Açı
              </label>
              <input
                type="range"
                min={-45}
                max={45}
                value={text.rotation}
                onChange={(e) => update({ rotation: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <div className="text-xs text-white/50">{text.rotation}°</div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">
              Hizalama
            </label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => update({ align: a })}
                  className={[
                    'flex-1 rounded-lg border px-2 py-1.5 text-xs',
                    text.align === a
                      ? 'border-indigo-400 bg-indigo-500/15 text-white'
                      : 'border-white/10 bg-white/[0.03] text-white/70',
                  ].join(' ')}
                >
                  {a === 'left' ? 'Sol' : a === 'center' ? 'Orta' : 'Sağ'}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02]">
            <label className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm text-white">
              <span className="flex items-center gap-2">
                <span className="text-base">◐</span> Gölge
              </span>
              <input
                type="checkbox"
                checked={text.shadow}
                onChange={(e) => update({ shadow: e.target.checked })}
                className="h-4 w-4 accent-indigo-500"
              />
            </label>
            {text.shadow && (
              <div className="space-y-2.5 border-t border-white/5 px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs text-white/50">Renk</span>
                  <input
                    type="color"
                    value={text.shadowColor}
                    onChange={(e) => update({ shadowColor: e.target.value })}
                    className="h-7 w-16 cursor-pointer rounded border border-white/10 bg-transparent"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>Yumuşaklık</span>
                    <span>{text.shadowBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    value={text.shadowBlur}
                    onChange={(e) => update({ shadowBlur: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between text-xs text-white/50">
                      <span>X</span>
                      <span>{text.shadowOffsetX}</span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      value={text.shadowOffsetX}
                      onChange={(e) => update({ shadowOffsetX: Number(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Y</span>
                      <span>{text.shadowOffsetY}</span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      value={text.shadowOffsetY}
                      onChange={(e) => update({ shadowOffsetY: Number(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>Opaklık</span>
                    <span>{Math.round(text.shadowOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(text.shadowOpacity * 100)}
                    onChange={(e) => update({ shadowOpacity: Number(e.target.value) / 100 })}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02]">
            <label className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm text-white">
              <span className="flex items-center gap-2">
                <span className="text-base">✦</span> Parlama (Glow)
              </span>
              <input
                type="checkbox"
                checked={text.glow}
                onChange={(e) => update({ glow: e.target.checked })}
                className="h-4 w-4 accent-indigo-500"
              />
            </label>
            {text.glow && (
              <div className="space-y-2.5 border-t border-white/5 px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs text-white/50">Renk</span>
                  <input
                    type="color"
                    value={text.glowColor}
                    onChange={(e) => update({ glowColor: e.target.value })}
                    className="h-7 w-16 cursor-pointer rounded border border-white/10 bg-transparent"
                  />
                  <div className="flex flex-1 gap-1">
                    {['#ffd166', '#f72585', '#4cc9f0', '#ffffff', '#8338ec'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update({ glowColor: c })}
                        title={c}
                        style={{ background: c }}
                        className="h-6 w-6 rounded-full border border-white/20 transition hover:scale-110"
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>Yumuşaklık</span>
                    <span>{text.glowBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={120}
                    value={text.glowBlur}
                    onChange={(e) => update({ glowBlur: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>Opaklık</span>
                    <span>{Math.round(text.glowOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(text.glowOpacity * 100)}
                    onChange={(e) => update({ glowOpacity: Number(e.target.value) / 100 })}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update({ x: dim.width / 2, y: dim.height / 2 })}
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
            >
              Ortala
            </button>
            <button
              type="button"
              onClick={() => update({ x: dim.width / 2, y: dim.height * 0.15 })}
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
            >
              Üste al
            </button>
            <button
              type="button"
              onClick={() => update({ x: dim.width / 2, y: dim.height * 0.85 })}
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
            >
              Alta al
            </button>
          </div>
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
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-xl bg-indigo-500 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-400"
        >
          Devam →
        </button>
      </div>
    </div>
  )
}

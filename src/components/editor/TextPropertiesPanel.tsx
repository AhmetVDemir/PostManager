import { useEffect, useState } from 'react'
import type { TextLayer, FontMood, CanvasFormat } from '../../types'
import { FONTS_BY_MOOD, MOOD_LABELS, loadAllMoodFonts, loadGoogleFont } from '../../data/fonts'
import { TEXT_STYLE_PRESETS, applyStylePreset } from '../../data/textStylePresets'
import { PositionGrid } from './PositionGrid'

interface Props {
  layer: TextLayer
  format: CanvasFormat
  onChange: (next: TextLayer) => void
  onDelete: () => void
}

export function TextPropertiesPanel({ layer, format, onChange, onDelete }: Props) {
  const [mood, setMood] = useState<FontMood>(() => {
    // Detect mood from current font
    for (const m of Object.keys(FONTS_BY_MOOD) as FontMood[]) {
      if (FONTS_BY_MOOD[m].some((f) => f.family === layer.fontFamily)) return m
    }
    return 'modern'
  })
  const [fontsReady, setFontsReady] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)

  useEffect(() => {
    setFontsReady(false)
    loadAllMoodFonts(mood).then(() => setFontsReady(true))
  }, [mood])

  const update = (patch: Partial<TextLayer>) => onChange({ ...layer, ...patch })

  const applyPreset = async (presetId: string) => {
    const preset = TEXT_STYLE_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    // Load the font this preset uses
    const moodFonts = FONTS_BY_MOOD[preset.mood]
    const fontDef = moodFonts.find((f) => f.family === preset.apply.fontFamily)
    if (fontDef) await loadGoogleFont(fontDef.family, fontDef.weights)
    setMood(preset.mood)
    onChange(applyStylePreset(preset, layer))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">📝 Yazı</div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md px-2 py-1 text-xs text-red-300/80 hover:bg-red-500/15 hover:text-red-200"
        >
          Sil
        </button>
      </div>

      {/* Text input */}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">
          Yazı
        </label>
        <textarea
          value={layer.text}
          onChange={(e) => update({ text: e.target.value })}
          rows={2}
          placeholder="Buraya yazını gir..."
          className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
        />
      </div>

      {/* Style presets */}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
          ✨ Hızlı stil
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {TEXT_STYLE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-center text-xs transition hover:border-indigo-400 hover:bg-indigo-500/10"
              title={p.label}
            >
              <div className="text-base">{p.emoji}</div>
              <div className="mt-0.5 truncate text-[10px] text-white/70">{p.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Font picker (collapsible) */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setShowFontPicker((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-white"
        >
          <span className="flex items-center gap-2">
            <span style={{ fontFamily: `"${layer.fontFamily}", sans-serif` }}>Aa</span>
            <span className="text-white/70">{layer.fontFamily}</span>
          </span>
          <span className="text-white/40">{showFontPicker ? '▲' : '▼'}</span>
        </button>
        {showFontPicker && (
          <div className="space-y-2 border-t border-white/5 px-3 py-3">
            <div className="text-xs uppercase tracking-wider text-white/40">Mood</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(MOOD_LABELS) as FontMood[]).map((m) => {
                const meta = MOOD_LABELS[m]
                const active = mood === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={[
                      'rounded-md px-2 py-1.5 text-center text-xs transition',
                      active
                        ? 'bg-indigo-500/20 text-white ring-1 ring-indigo-400'
                        : 'bg-white/[0.03] text-white/70 hover:bg-white/[0.06]',
                    ].join(' ')}
                  >
                    <div>{meta.emoji}</div>
                    <div className="text-[10px]">{meta.label}</div>
                  </button>
                )
              })}
            </div>

            <div className="text-xs uppercase tracking-wider text-white/40">
              Font {!fontsReady && <span className="text-indigo-300">(yükleniyor...)</span>}
            </div>
            <div className="flex flex-col gap-1">
              {FONTS_BY_MOOD[mood].map((f) => {
                const active = layer.fontFamily === f.family
                return (
                  <button
                    key={f.family}
                    type="button"
                    onClick={() => update({ fontFamily: f.family })}
                    style={{ fontFamily: `"${f.family}", sans-serif` }}
                    className={[
                      'rounded-md border px-2 py-1.5 text-left text-sm transition',
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
        )}
      </div>

      {/* Size */}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">
          Boyut
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => update({ fontSize: Math.max(12, layer.fontSize - 10) })}
            className="h-8 w-8 shrink-0 rounded-md border border-white/10 bg-white/[0.04] text-base text-white/80 hover:bg-white/[0.08]"
          >
            −
          </button>
          <input
            type="range"
            min={12}
            max={400}
            value={layer.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            className="flex-1 accent-indigo-500"
          />
          <button
            type="button"
            onClick={() => update({ fontSize: Math.min(400, layer.fontSize + 10) })}
            className="h-8 w-8 shrink-0 rounded-md border border-white/10 bg-white/[0.04] text-base text-white/80 hover:bg-white/[0.08]"
          >
            +
          </button>
          <input
            type="number"
            min={12}
            max={400}
            value={layer.fontSize}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (!Number.isNaN(n)) update({ fontSize: Math.max(12, Math.min(400, n)) })
            }}
            className="h-8 w-14 rounded-md border border-white/10 bg-white/[0.04] px-1.5 text-center text-xs text-white"
          />
        </div>
      </div>

      {/* Color + Align + Rotation */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">
            Renk
          </label>
          <input
            type="color"
            value={layer.color}
            onChange={(e) => update({ color: e.target.value })}
            className="h-8 w-full cursor-pointer rounded-md border border-white/10 bg-transparent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40">
            Açı
          </label>
          <input
            type="range"
            min={-180}
            max={180}
            value={layer.rotation}
            onChange={(e) => update({ rotation: Number(e.target.value) })}
            className="w-full accent-indigo-500"
          />
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
                'flex-1 rounded-md border px-2 py-1.5 text-xs',
                layer.align === a
                  ? 'border-indigo-400 bg-indigo-500/15 text-white'
                  : 'border-white/10 bg-white/[0.03] text-white/70',
              ].join(' ')}
            >
              {a === 'left' ? 'Sol' : a === 'center' ? 'Orta' : 'Sağ'}
            </button>
          ))}
        </div>
      </div>

      <PositionGrid format={format} onPick={(x, y) => update({ x, y })} />

      {/* Paragraph controls — only when text has more than one line / could wrap */}
      <CollapsibleSection
        label="Paragraf (çoklu satır)"
        icon="¶"
        enabled={layer.maxWidth !== null}
        onToggle={(v) => update({ maxWidth: v ? 800 : null })}
      >
        {layer.maxWidth !== null && (
          <SliderRow
            label="Max genişlik"
            min={200}
            max={1080}
            value={layer.maxWidth}
            unit="px"
            onChange={(v) => update({ maxWidth: v })}
          />
        )}
        <div>
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Satır aralığı</span>
            <span>{layer.lineHeight.toFixed(2)}×</span>
          </div>
          <input
            type="range"
            min={0.8}
            max={2.5}
            step={0.05}
            value={layer.lineHeight}
            onChange={(e) => update({ lineHeight: Number(e.target.value) })}
            className="w-full accent-indigo-500"
          />
        </div>
      </CollapsibleSection>

      {/* Background plate */}
      <CollapsibleSection
        label="Arka plan kutusu"
        icon="🔲"
        enabled={layer.bg}
        onToggle={(v) => update({ bg: v })}
      >
        <ColorRow
          label="Renk"
          value={layer.bgColor}
          onChange={(c) => update({ bgColor: c })}
          swatches={['#7c1010', '#1f2937', '#fef3c7', '#000000', '#ffffff', '#f59e0b']}
        />
        <SliderRow
          label="Opaklık"
          min={0}
          max={100}
          value={Math.round(layer.bgOpacity * 100)}
          unit="%"
          onChange={(v) => update({ bgOpacity: v / 100 })}
        />
        <div className="grid grid-cols-2 gap-2">
          <SliderRow label="Yatay boşluk" min={0} max={80} value={layer.bgPaddingX} unit="px" onChange={(v) => update({ bgPaddingX: v })} />
          <SliderRow label="Dikey boşluk" min={0} max={60} value={layer.bgPaddingY} unit="px" onChange={(v) => update({ bgPaddingY: v })} />
        </div>
        <SliderRow
          label="Köşe yuvarlama"
          min={0}
          max={40}
          value={layer.bgRadius}
          unit="px"
          onChange={(v) => update({ bgRadius: v })}
        />
      </CollapsibleSection>

      {/* Stroke */}
      <CollapsibleSection
        label="Kontur"
        icon="◯"
        enabled={layer.stroke}
        onToggle={(v) => update({ stroke: v })}
      >
        <ColorRow label="Renk" value={layer.strokeColor} onChange={(c) => update({ strokeColor: c })} />
        <SliderRow
          label="Kalınlık"
          min={1}
          max={20}
          value={layer.strokeWidth}
          unit="px"
          onChange={(v) => update({ strokeWidth: v })}
        />
      </CollapsibleSection>

      {/* Shadow */}
      <CollapsibleSection
        label="Gölge"
        icon="◐"
        enabled={layer.shadow}
        onToggle={(v) => update({ shadow: v })}
      >
        <ColorRow label="Renk" value={layer.shadowColor} onChange={(c) => update({ shadowColor: c })} />
        <SliderRow
          label="Yumuşaklık"
          min={0}
          max={60}
          value={layer.shadowBlur}
          unit="px"
          onChange={(v) => update({ shadowBlur: v })}
        />
        <div className="grid grid-cols-2 gap-2">
          <SliderRow label="X" min={-30} max={30} value={layer.shadowOffsetX} onChange={(v) => update({ shadowOffsetX: v })} />
          <SliderRow label="Y" min={-30} max={30} value={layer.shadowOffsetY} onChange={(v) => update({ shadowOffsetY: v })} />
        </div>
        <SliderRow
          label="Opaklık"
          min={0}
          max={100}
          value={Math.round(layer.shadowOpacity * 100)}
          unit="%"
          onChange={(v) => update({ shadowOpacity: v / 100 })}
        />
      </CollapsibleSection>

      {/* Glow */}
      <CollapsibleSection
        label="Parlama"
        icon="✦"
        enabled={layer.glow}
        onToggle={(v) => update({ glow: v })}
      >
        <ColorRow
          label="Renk"
          value={layer.glowColor}
          onChange={(c) => update({ glowColor: c })}
          swatches={['#ffd166', '#f72585', '#4cc9f0', '#ffffff', '#8338ec', '#10b981']}
        />
        <SliderRow
          label="Yumuşaklık"
          min={0}
          max={120}
          value={layer.glowBlur}
          unit="px"
          onChange={(v) => update({ glowBlur: v })}
        />
        <SliderRow
          label="Opaklık"
          min={0}
          max={100}
          value={Math.round(layer.glowOpacity * 100)}
          unit="%"
          onChange={(v) => update({ glowOpacity: v / 100 })}
        />
      </CollapsibleSection>
    </div>
  )
}

// ============================================================================
// Reusable sub-components
// ============================================================================

function CollapsibleSection({
  label,
  icon,
  enabled,
  onToggle,
  children,
}: {
  label: string
  icon: string
  enabled: boolean
  onToggle: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <label className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm text-white">
        <span className="flex items-center gap-2">
          <span className="text-base">{icon}</span> {label}
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 accent-indigo-500"
        />
      </label>
      {enabled && <div className="space-y-2 border-t border-white/5 px-3 py-3">{children}</div>}
    </div>
  )
}

function ColorRow({ label, value, onChange, swatches }: { label: string; value: string; onChange: (v: string) => void; swatches?: string[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs text-white/50">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
      />
      {swatches && (
        <div className="flex flex-1 gap-1">
          {swatches.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              title={c}
              style={{ background: c }}
              className="h-6 w-6 rounded-full border border-white/20 transition hover:scale-110"
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SliderRow({ label, min, max, value, unit, onChange }: { label: string; min: number; max: number; value: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>{label}</span>
        <span>
          {value}
          {unit ?? ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500"
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import type { AppState, Layer, TextLayer, EmojiLayer } from '../../types'
import { createTextLayer, createEmojiLayer } from '../../types'
import { PostCanvas } from '../PostCanvas'
import { LayerList } from '../editor/LayerList'
import { FilterControl } from '../editor/FilterControl'
import { TextPropertiesPanel } from '../editor/TextPropertiesPanel'
import { EmojiPropertiesPanel } from '../editor/EmojiPropertiesPanel'
import { EmojiPicker } from '../EmojiPicker'
import { loadGoogleFont, FONTS_BY_MOOD } from '../../data/fonts'
import { TEXT_STYLE_PRESETS, applyStylePreset } from '../../data/textStylePresets'
import { analyzeBackground, suggestStyle } from '../../services/imageAnalysis'
import { suggestStyleWithAI, CloudAIError } from '../../services/cloudAI'

interface Props {
  state: AppState
  onUpdate: (patch: Partial<AppState>) => void
  onBack: () => void
  onNext: () => void
}

export function EditorStep({ state, onUpdate, onBack, onNext }: Props) {
  const [maxSize, setMaxSize] = useState(() => Math.min(560, window.innerHeight - 240))
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [aiRefining, setAiRefining] = useState(false)
  const [lastSuggestion, setLastSuggestion] = useState<{ presetLabel: string; reasoning: string; source: 'heuristic' | 'ai' } | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    const onResize = () => {
      const isMobile = window.innerWidth < 1024
      const maxByWidth = window.innerWidth - 40
      const maxByHeight = window.innerHeight - (isMobile ? 200 : 240)
      setMaxSize(Math.min(maxByWidth, maxByHeight, 560))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Make sure the default Inter font is loaded once
  useEffect(() => {
    loadGoogleFont('Inter', '400;600;800')
  }, [])

  const selectedLayer = state.layers.find((l) => l.id === state.selectedLayerId) ?? null

  const filterDisabled = state.background.kind !== 'image' || !state.background.imageDataUrl

  const updateLayers = (next: Layer[], selectedId?: string | null) => {
    onUpdate({ layers: next, selectedLayerId: selectedId === undefined ? state.selectedLayerId : selectedId })
  }

  const addText = () => {
    const newLayer = createTextLayer(state.format)
    updateLayers([...state.layers, newLayer], newLayer.id)
  }

  const addEmoji = (emoji: string) => {
    const newLayer = createEmojiLayer(emoji, state.format)
    updateLayers([...state.layers, newLayer], newLayer.id)
  }

  const deleteLayer = (id: string) => {
    const next = state.layers.filter((l) => l.id !== id)
    updateLayers(next, state.selectedLayerId === id ? null : state.selectedLayerId)
  }

  const updateLayer = (id: string, next: Layer) => {
    updateLayers(state.layers.map((l) => (l.id === id ? next : l)))
  }

  const moveLayer = (id: string, dir: 1 | -1) => {
    const idx = state.layers.findIndex((l) => l.id === id)
    if (idx < 0) return
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= state.layers.length) return
    const copy = [...state.layers]
    ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
    updateLayers(copy)
  }

  const handleLayerMove = (id: string, x: number, y: number) => {
    const target = state.layers.find((l) => l.id === id)
    if (!target) return
    updateLayer(id, { ...target, x, y } as Layer)
  }

  const applySuggestion = async (
    presetId: string,
    textColor: string,
    reasoning: string,
    source: 'heuristic' | 'ai',
  ) => {
    const preset = TEXT_STYLE_PRESETS.find((p) => p.id === presetId) ?? TEXT_STYLE_PRESETS[0]

    const moodFonts = FONTS_BY_MOOD[preset.mood]
    const fontDef = moodFonts.find((f) => f.family === preset.apply.fontFamily)
    if (fontDef) await loadGoogleFont(fontDef.family, fontDef.weights)

    let target = selectedLayer?.type === 'text' ? selectedLayer : null
    if (!target) target = state.layers.find((l): l is TextLayer => l.type === 'text') ?? null

    if (target) {
      const updated = applyStylePreset(preset, target)
      if (!preset.apply.color) updated.color = textColor
      updateLayer(target.id, updated)
      onUpdate({ selectedLayerId: target.id })
    } else {
      const newLayer = createTextLayer(state.format)
      const styled = applyStylePreset(preset, newLayer)
      if (!preset.apply.color) styled.color = textColor
      styled.text = 'Yazınız buraya'
      updateLayers([...state.layers, styled], styled.id)
    }
    setLastSuggestion({ presetLabel: preset.label, reasoning, source })
  }

  const handleSuggest = async () => {
    setSuggesting(true)
    setAiError(null)
    try {
      const analysis = await analyzeBackground(state.background)
      const sug = suggestStyle(analysis)
      await applySuggestion(sug.presetId, sug.textColor, sug.reasoning, 'heuristic')
    } finally {
      setSuggesting(false)
    }
  }

  const handleAIRefine = async () => {
    setAiRefining(true)
    setAiError(null)
    try {
      const targetText =
        (selectedLayer?.type === 'text' ? selectedLayer.text : null) ??
        state.layers.find((l): l is TextLayer => l.type === 'text')?.text ??
        'short headline'
      const sug = await suggestStyleWithAI(state.background, targetText)
      await applySuggestion(sug.presetId, sug.textColor, sug.reasoning, 'ai')
    } catch (e) {
      if (e instanceof CloudAIError) {
        if (e.code === 'dev-no-function') {
          setAiError(
            "ℹ️ Online AI sadece Cloudflare'e deploy edildikten sonra çalışır. Yerel dev modunda heuristic 'Akıllı Öner' butonunu kullanabilirsin.",
          )
        } else if (e.code === 'not-configured') {
          setAiError(
            '⚠ Cloudflare Pages env vars\'ında LLM_API_KEY tanımlı değil. doc/DEPLOY.md\'ye bak.',
          )
        } else {
          setAiError(`AI hatası: ${e.message}`)
        }
      } else {
        setAiError(`AI hatası: ${e instanceof Error ? e.message : 'bilinmeyen'}`)
      }
    } finally {
      setAiRefining(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Editör</h2>
        <p className="mt-1 text-sm text-white/60">
          Yazı, emoji ve filtreleri ekle. Canvas üzerinde sürükleyerek konumlandır.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_340px]">
        {/* LEFT: Layer list + filter (order 2 on mobile, first on desktop) */}
        <div className="order-2 flex flex-col gap-4 lg:order-1 lg:max-h-[75vh] lg:overflow-y-auto lg:pr-2">
          {/* AI suggestion */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSuggest}
              disabled={suggesting || aiRefining}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/30 transition hover:from-fuchsia-400 hover:to-indigo-400 disabled:opacity-60"
              title="Arka plana en uygun font + renk + efekti otomatik seç (anında, offline)"
            >
              {suggesting ? '⏳ Analiz ediliyor...' : '🪄 Akıllı Öner'}
            </button>
            <button
              type="button"
              onClick={handleAIRefine}
              disabled={suggesting || aiRefining}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/80 transition hover:border-fuchsia-400 hover:bg-fuchsia-500/10 hover:text-white disabled:opacity-60"
              title="Online AI ile daha akıllı öneri al (internet gerekir, ücretsiz, key'siz)"
            >
              {aiRefining ? '⏳ AI düşünüyor...' : '🤖 AI ile geliştir'}
            </button>
          </div>
          {lastSuggestion && (
            <div
              className={[
                'rounded-lg border px-3 py-2 text-xs',
                lastSuggestion.source === 'ai'
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-fuchsia-500/30 bg-fuchsia-500/10',
              ].join(' ')}
            >
              <div
                className={[
                  'font-semibold',
                  lastSuggestion.source === 'ai' ? 'text-emerald-200' : 'text-fuchsia-200',
                ].join(' ')}
              >
                {lastSuggestion.source === 'ai' ? '🤖 AI önerisi' : '🪄 Heuristic öneri'}: {lastSuggestion.presetLabel}
              </div>
              <div
                className={[
                  'mt-0.5',
                  lastSuggestion.source === 'ai' ? 'text-emerald-100/80' : 'text-fuchsia-100/80',
                ].join(' ')}
              >
                {lastSuggestion.reasoning}
              </div>
            </div>
          )}
          {aiError && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {aiError}
            </div>
          )}

          <LayerList
            layers={state.layers}
            selectedId={state.selectedLayerId}
            onSelect={(id) => onUpdate({ selectedLayerId: id })}
            onDelete={deleteLayer}
            onMoveUp={(id) => moveLayer(id, 1)}
            onMoveDown={(id) => moveLayer(id, -1)}
            onAddText={addText}
            onAddEmoji={() => setEmojiPickerOpen(true)}
          />
          <FilterControl
            filter={state.filter}
            onChange={(f) => onUpdate({ filter: f })}
            disabled={filterDisabled}
          />
        </div>

        {/* MIDDLE: Canvas (order 1 on mobile — show first) */}
        <div className="order-1 flex flex-col items-center gap-2 lg:order-2">
          <PostCanvas
            background={state.background}
            format={state.format}
            filter={state.filter}
            layers={state.layers}
            selectedLayerId={state.selectedLayerId}
            onLayerSelect={(id) => onUpdate({ selectedLayerId: id })}
            onLayerMove={handleLayerMove}
            draggableLayers
            maxDisplaySize={maxSize}
          />
          <div className="text-xs text-white/40">
            Sürükleyerek konumlandır · Boş alana tıkla = seçimi kaldır
          </div>
        </div>

        {/* RIGHT: Selected layer properties (always order 3) */}
        <div className="order-3 lg:max-h-[75vh] lg:overflow-y-auto lg:pr-2">
          {!selectedLayer && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/50">
              <div className="mb-2 text-2xl">↖</div>
              Düzenlemek için sol taraftan bir katman seç veya yeni bir tane ekle.
            </div>
          )}
          {selectedLayer?.type === 'text' && (
            <TextPropertiesPanel
              layer={selectedLayer}
              format={state.format}
              onChange={(next) => updateLayer(selectedLayer.id, next)}
              onDelete={() => deleteLayer(selectedLayer.id)}
            />
          )}
          {selectedLayer?.type === 'emoji' && (
            <EmojiPropertiesPanel
              layer={selectedLayer as EmojiLayer}
              format={state.format}
              onChange={(next) => updateLayer(selectedLayer.id, next)}
              onDelete={() => deleteLayer(selectedLayer.id)}
            />
          )}
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

      <EmojiPicker
        open={emojiPickerOpen}
        onClose={() => setEmojiPickerOpen(false)}
        onSelect={(emoji) => addEmoji(emoji)}
      />
    </div>
  )
}

// Helper to satisfy TS that TextLayer & EmojiLayer narrow correctly
export type _ensure = TextLayer | EmojiLayer

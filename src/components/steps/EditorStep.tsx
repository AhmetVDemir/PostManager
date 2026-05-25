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
import { suggestStyleWithAI, suggestTextWithAI, suggestMegaWithAI, CloudAIError } from '../../services/cloudAI'
import { AIErrorBanner } from '../editor/AIErrorBanner'

interface Props {
  state: AppState
  onUpdate: (patch: Partial<AppState>) => void
  onBack: () => void
  onNext: () => void
}

export function EditorStep({ state, onUpdate, onBack, onNext }: Props) {
  const [maxSize, setMaxSize] = useState(() => Math.min(560, window.innerHeight - 240))
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [aiRefining, setAiRefining] = useState(false)
  const [aiTexting, setAiTexting] = useState(false)
  const [aiMegaing, setAiMegaing] = useState(false)
  const [lastSuggestion, setLastSuggestion] = useState<{
    presetLabel: string
    presetId: string
    reasoning: string
    source: 'heuristic' | 'ai' | 'mega'
    appliedToId: string
    previousLayer: TextLayer | null // null = new layer was created
  } | null>(null)
  const [textSuggestions, setTextSuggestions] = useState<{ list: string[]; reasoning: string } | null>(null)
  const [aiError, setAiError] = useState<CloudAIError | string | null>(null)

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
    source: 'heuristic' | 'ai' | 'mega',
    textOverride?: string,
  ) => {
    const preset = TEXT_STYLE_PRESETS.find((p) => p.id === presetId) ?? TEXT_STYLE_PRESETS[0]

    const moodFonts = FONTS_BY_MOOD[preset.mood]
    const fontDef = moodFonts.find((f) => f.family === preset.apply.fontFamily)
    if (fontDef) await loadGoogleFont(fontDef.family, fontDef.weights)

    let target = selectedLayer?.type === 'text' ? selectedLayer : null
    if (!target) target = state.layers.find((l): l is TextLayer => l.type === 'text') ?? null

    let appliedToId: string
    let previousLayer: TextLayer | null

    if (target) {
      previousLayer = { ...target } // snapshot before mutation
      appliedToId = target.id
      const updated = applyStylePreset(preset, target)
      if (!preset.apply.color) updated.color = textColor
      if (textOverride) updated.text = textOverride
      updateLayer(target.id, updated)
      onUpdate({ selectedLayerId: target.id })
    } else {
      previousLayer = null // no previous; undo means delete
      const newLayer = createTextLayer(state.format)
      const styled = applyStylePreset(preset, newLayer)
      if (!preset.apply.color) styled.color = textColor
      styled.text = textOverride || 'Yazınız buraya'
      appliedToId = styled.id
      updateLayers([...state.layers, styled], styled.id)
    }
    setLastSuggestion({
      presetLabel: preset.label,
      presetId,
      reasoning,
      source,
      appliedToId,
      previousLayer,
    })
  }

  const handleUndoSuggestion = () => {
    if (!lastSuggestion) return
    const { appliedToId, previousLayer } = lastSuggestion
    if (previousLayer) {
      // restore the previous layer state
      updateLayers(state.layers.map((l) => (l.id === appliedToId ? previousLayer : l)))
    } else {
      // it was a newly-created layer — remove it
      const next = state.layers.filter((l) => l.id !== appliedToId)
      updateLayers(next, state.selectedLayerId === appliedToId ? null : state.selectedLayerId)
    }
    setLastSuggestion(null)
  }

  const handleRetrySuggestion = () => {
    if (!lastSuggestion) return
    // First undo, then re-trigger the same kind of suggestion
    handleUndoSuggestion()
    if (lastSuggestion.source === 'ai') {
      void handleAIRefine()
    } else {
      void handleSuggest()
    }
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
        setAiError(e)
      } else {
        setAiError(e instanceof Error ? e.message : 'Bilinmeyen hata')
      }
    } finally {
      setAiRefining(false)
    }
  }

  /** D — AI'dan 3 yazı önerisi al, kullanıcı listeden seçecek */
  const handleSuggestText = async () => {
    setAiTexting(true)
    setAiError(null)
    setTextSuggestions(null)
    try {
      const targetText =
        (selectedLayer?.type === 'text' ? selectedLayer.text : null) ??
        state.layers.find((l): l is TextLayer => l.type === 'text')?.text ??
        ''
      const sug = await suggestTextWithAI(state.background, targetText)
      setTextSuggestions({ list: sug.suggestions, reasoning: sug.reasoning })
    } catch (e) {
      if (e instanceof CloudAIError) setAiError(e)
      else setAiError(e instanceof Error ? e.message : 'Bilinmeyen hata')
    } finally {
      setAiTexting(false)
    }
  }

  /** Kullanıcı text önerisinden birini seçince — seçili veya yeni text layer'a uygula */
  const applyTextSuggestion = (text: string) => {
    const target = selectedLayer?.type === 'text' ? selectedLayer : null
    if (target) {
      const previousLayer = { ...target }
      updateLayer(target.id, { ...target, text })
      setLastSuggestion({
        presetLabel: 'AI yazı önerisi',
        presetId: '',
        reasoning: `Yazı önerisi uygulandı: "${text.slice(0, 60)}"`,
        source: 'ai',
        appliedToId: target.id,
        previousLayer,
      })
    } else {
      const newLayer = createTextLayer(state.format)
      newLayer.text = text
      updateLayers([...state.layers, newLayer], newLayer.id)
      setLastSuggestion({
        presetLabel: 'AI yazı önerisi',
        presetId: '',
        reasoning: `Yeni yazı eklendi: "${text.slice(0, 60)}"`,
        source: 'ai',
        appliedToId: newLayer.id,
        previousLayer: null,
      })
    }
    setTextSuggestions(null)
  }

  /** G — Mega: caption + stil + renk birden uygulansın */
  const handleMegaAI = async () => {
    setAiMegaing(true)
    setAiError(null)
    try {
      const targetText =
        (selectedLayer?.type === 'text' ? selectedLayer.text : null) ??
        state.layers.find((l): l is TextLayer => l.type === 'text')?.text ??
        ''
      const sug = await suggestMegaWithAI(state.background, targetText)
      await applySuggestion(sug.presetId, sug.textColor, sug.reasoning, 'mega', sug.caption)
    } catch (e) {
      if (e instanceof CloudAIError) setAiError(e)
      else setAiError(e instanceof Error ? e.message : 'Bilinmeyen hata')
    } finally {
      setAiMegaing(false)
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
          {/* AI suggestions */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleMegaAI}
              disabled={suggesting || aiRefining || aiTexting || aiMegaing}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 via-fuchsia-500 to-indigo-500 px-3 py-3 text-sm font-bold text-white shadow-md shadow-fuchsia-500/30 transition hover:brightness-110 disabled:opacity-60"
              title="AI hem yazıyı hem stili önerip otomatik uygular"
            >
              {aiMegaing ? '⏳ AI tasarlıyor...' : '🎁 Tam Paket AI'}
            </button>

            {advancedMode && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSuggest}
                    disabled={suggesting || aiRefining || aiTexting || aiMegaing}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-fuchsia-500/80 to-indigo-500/80 px-2 py-2 text-xs font-medium text-white shadow-md shadow-fuchsia-500/20 transition hover:from-fuchsia-400 hover:to-indigo-400 disabled:opacity-60"
                    title="Arka plana en uygun stil — anında, offline"
                  >
                    {suggesting ? '⏳' : '🪄 Akıllı Stil'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAIRefine}
                    disabled={suggesting || aiRefining || aiTexting || aiMegaing}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-2 py-2 text-xs font-medium text-white/80 transition hover:border-fuchsia-400 hover:bg-fuchsia-500/10 hover:text-white disabled:opacity-60"
                    title="Online AI ile detaylı stil önerisi"
                  >
                    {aiRefining ? '⏳' : '🤖 AI Stil'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSuggestText}
                  disabled={suggesting || aiRefining || aiTexting || aiMegaing}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-2 py-2 text-xs font-medium text-white/80 transition hover:border-amber-400 hover:bg-amber-500/10 hover:text-white disabled:opacity-60"
                  title="AI'dan 3 yazı önerisi al — kısalt, güçlendir, alternatif"
                >
                  {aiTexting ? '⏳ Yazı düşünülüyor...' : '✨ AI Yazı Öner'}
                </button>
              </>
            )}
          </div>

          {/* Text suggestions panel */}
          {textSuggestions && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs">
              <div className="mb-1 flex items-center justify-between">
                <div className="font-semibold text-amber-200">✨ AI yazı önerileri</div>
                <button
                  type="button"
                  onClick={() => setTextSuggestions(null)}
                  className="rounded p-0.5 text-amber-300/60 hover:bg-amber-500/15 hover:text-amber-100"
                  title="Kapat"
                >
                  ✕
                </button>
              </div>
              <div className="mb-2 text-amber-100/70">{textSuggestions.reasoning}</div>
              <div className="flex flex-col gap-1.5">
                {textSuggestions.list.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyTextSuggestion(s)}
                    className="rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-left text-amber-100 transition hover:border-amber-400 hover:bg-amber-500/15"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {lastSuggestion && (
            <div
              className={[
                'rounded-lg border px-3 py-2.5 text-xs',
                lastSuggestion.source !== 'heuristic'
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-fuchsia-500/30 bg-fuchsia-500/10',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div
                    className={[
                      'font-semibold',
                      lastSuggestion.source === 'ai' ? 'text-emerald-200' : 'text-fuchsia-200',
                    ].join(' ')}
                  >
                    {lastSuggestion.source === 'mega'
                  ? '🎁 Tam Paket AI'
                  : lastSuggestion.source === 'ai'
                  ? '🤖 AI önerisi'
                  : '🪄 Heuristic öneri'}: {lastSuggestion.presetLabel}
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
                <button
                  type="button"
                  onClick={() => setLastSuggestion(null)}
                  className={[
                    'shrink-0 rounded p-1 text-[11px]',
                    lastSuggestion.source === 'ai'
                      ? 'text-emerald-300/60 hover:bg-emerald-500/15 hover:text-emerald-100'
                      : 'text-fuchsia-300/60 hover:bg-fuchsia-500/15 hover:text-fuchsia-100',
                  ].join(' ')}
                  title="Kapat"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2 flex gap-1.5 border-t border-white/5 pt-2">
                <button
                  type="button"
                  onClick={handleUndoSuggestion}
                  disabled={suggesting || aiRefining}
                  className="flex-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] font-medium text-white/80 transition hover:bg-white/[0.08] disabled:opacity-50"
                  title={lastSuggestion.previousLayer ? 'Öneriyi geri al — eski stile dön' : 'Eklenen yazıyı sil'}
                >
                  ↶ Geri al
                </button>
                <button
                  type="button"
                  onClick={handleRetrySuggestion}
                  disabled={suggesting || aiRefining}
                  className={[
                    'flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition disabled:opacity-50',
                    lastSuggestion.source === 'ai'
                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                      : 'border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/20',
                  ].join(' ')}
                  title="Aynı tipte (AI/heuristic) yeni bir öneri al"
                >
                  🔄 Başka öneri
                </button>
              </div>
            </div>
          )}
          {aiError && (
            <AIErrorBanner error={aiError} onDismiss={() => setAiError(null)} />
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

          {/* Advanced mode toggle */}
          <button
            type="button"
            onClick={() => setAdvancedMode((v) => !v)}
            className={[
              'mt-auto flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition',
              advancedMode
                ? 'border-indigo-400/50 bg-indigo-500/10 text-indigo-200'
                : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]',
            ].join(' ')}
            title="Detaylı ayarları aç/kapa (font, gölge, glow, kontur, BG, paragraf, açı...)"
          >
            {advancedMode ? '▼ Sade görünüme dön' : '🔧 Gelişmiş ayarları aç'}
          </button>
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
              advanced={advancedMode}
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

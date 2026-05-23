import { useState } from 'react'
import type { EmojiLayer, CanvasFormat } from '../../types'
import { EmojiPicker } from '../EmojiPicker'
import { PositionGrid } from './PositionGrid'

interface Props {
  layer: EmojiLayer
  format: CanvasFormat
  onChange: (next: EmojiLayer) => void
  onDelete: () => void
}

export function EmojiPropertiesPanel({ layer, format, onChange, onDelete }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const update = (patch: Partial<EmojiLayer>) => onChange({ ...layer, ...patch })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">😀 Emoji</div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md px-2 py-1 text-xs text-red-300/80 hover:bg-red-500/15 hover:text-red-200"
        >
          Sil
        </button>
      </div>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex h-32 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-7xl transition hover:bg-white/[0.06]"
      >
        {layer.emoji}
      </button>
      <div className="text-center text-xs text-white/50">Değiştirmek için tıkla</div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-white/50">
          <span>Boyut</span>
          <span>{layer.size}px</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => update({ size: Math.max(40, layer.size - 30) })}
            className="h-8 w-8 shrink-0 rounded-md border border-white/10 bg-white/[0.04] text-base text-white/80 hover:bg-white/[0.08]"
          >
            −
          </button>
          <input
            type="range"
            min={40}
            max={800}
            value={layer.size}
            onChange={(e) => update({ size: Number(e.target.value) })}
            className="flex-1 accent-indigo-500"
          />
          <button
            type="button"
            onClick={() => update({ size: Math.min(800, layer.size + 30) })}
            className="h-8 w-8 shrink-0 rounded-md border border-white/10 bg-white/[0.04] text-base text-white/80 hover:bg-white/[0.08]"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-white/50">
          <span>Açı</span>
          <span>{layer.rotation}°</span>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          value={layer.rotation}
          onChange={(e) => update({ rotation: Number(e.target.value) })}
          className="w-full accent-indigo-500"
        />
      </div>

      <PositionGrid format={format} onPick={(x, y) => update({ x, y })} />

      <EmojiPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(emoji) => update({ emoji })}
      />
    </div>
  )
}

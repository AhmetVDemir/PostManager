import type { Layer } from '../../types'

interface Props {
  layers: Layer[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
  onAddText: () => void
  onAddEmoji: () => void
}

export function LayerList({ layers, selectedId, onSelect, onDelete, onMoveUp, onMoveDown, onAddText, onAddEmoji }: Props) {
  // Show topmost first (reverse for UI)
  const reversed = [...layers].reverse()

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onAddText}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/30 hover:bg-indigo-400"
        >
          <span>＋</span> Yazı
        </button>
        <button
          type="button"
          onClick={onAddEmoji}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-fuchsia-500 px-3 py-2.5 text-sm font-medium text-white shadow-md shadow-fuchsia-500/30 hover:bg-fuchsia-400"
        >
          <span>＋</span> Emoji
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="px-1 text-xs font-medium uppercase tracking-wider text-white/40">
          Katmanlar ({layers.length})
        </div>
        {layers.length === 0 && (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-6 text-center text-xs text-white/40">
            Henüz katman yok. Yukarıdan yazı veya emoji ekle.
          </div>
        )}
        {reversed.map((layer) => {
          const active = layer.id === selectedId
          const preview =
            layer.type === 'text'
              ? layer.text.slice(0, 24) || '(boş yazı)'
              : layer.emoji
          const icon = layer.type === 'text' ? '📝' : '😀'
          return (
            <div
              key={layer.id}
              className={[
                'group flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm transition',
                active
                  ? 'border-indigo-400 bg-indigo-500/15'
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => onSelect(layer.id)}
                className="flex flex-1 items-center gap-2 truncate text-left"
              >
                <span className="shrink-0 text-base">{icon}</span>
                <span className={['truncate', active ? 'text-white' : 'text-white/80'].join(' ')}>
                  {preview}
                </span>
              </button>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => onMoveUp(layer.id)}
                  title="Üste taşı"
                  className="flex h-8 w-8 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => onMoveDown(layer.id)}
                  title="Alta taşı"
                  className="flex h-8 w-8 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(layer.id)}
                  title="Sil"
                  className="flex h-8 w-8 items-center justify-center rounded text-red-300/80 hover:bg-red-500/20 hover:text-red-200"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

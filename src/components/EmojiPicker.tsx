import { useEffect, useState } from 'react'
import { EMOJI_CATEGORIES } from '../data/emojis'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ open, onClose, onSelect }: Props) {
  const [activeCat, setActiveCat] = useState(EMOJI_CATEGORIES[0].id)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const category = EMOJI_CATEGORIES.find((c) => c.id === activeCat) ?? EMOJI_CATEGORIES[0]
  const visible = query.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((_) => true) // emoji search by content isn't practical; just show all
    : category.emojis

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#15161e] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-semibold text-white">Emoji ekle</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-white/60 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-white/5 px-3 py-2">
          {EMOJI_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCat(c.id)
                setQuery('')
              }}
              title={c.label}
              className={[
                'shrink-0 rounded-lg px-3 py-1.5 text-lg transition',
                activeCat === c.id ? 'bg-indigo-500/20 ring-1 ring-indigo-400' : 'hover:bg-white/5',
              ].join(' ')}
            >
              {c.icon}
            </button>
          ))}
        </div>

        <div className="px-3 py-2 text-xs text-white/50">{category.label} · {visible.length} emoji</div>

        {/* Emoji grid */}
        <div className="grid grid-cols-8 gap-1 overflow-y-auto px-3 pb-4" style={{ maxHeight: '50vh' }}>
          {visible.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              type="button"
              onClick={() => {
                onSelect(emoji)
                onClose()
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition hover:scale-110 hover:bg-white/10"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

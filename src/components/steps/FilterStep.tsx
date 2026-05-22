import { useEffect, useState } from 'react'
import type { CanvasFormat, FilterPreset } from '../../types'
import { FILTER_PRESETS } from '../../data/filters'
import { PostCanvas } from '../PostCanvas'

interface Props {
  imageDataUrl: string
  format: CanvasFormat
  filter: FilterPreset
  onChange: (f: FilterPreset) => void
  onBack: () => void
  onNext: () => void
}

export function FilterStep({ imageDataUrl, format, filter, onChange, onBack, onNext }: Props) {
  const [maxSize, setMaxSize] = useState(() => Math.min(520, window.innerHeight - 320))

  useEffect(() => {
    const onResize = () => setMaxSize(Math.min(520, window.innerHeight - 320))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Bir filtre seç</h2>
        <p className="mt-2 text-white/60">Atlamak için Orijinal'i seçili bırak</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,320px]">
        <div className="flex justify-center">
          <PostCanvas
            imageDataUrl={imageDataUrl}
            format={format}
            filter={filter}
            text={null}
            maxDisplaySize={maxSize}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium uppercase tracking-wider text-white/40">Preset</div>
          <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto pr-2">
            {FILTER_PRESETS.map((p) => {
              const active = filter === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange(p.id)}
                  className={[
                    'rounded-xl border px-3 py-3 text-sm font-medium transition',
                    active
                      ? 'border-indigo-400 bg-indigo-500/15 text-white shadow-lg shadow-indigo-500/20'
                      : 'border-white/10 bg-white/[0.03] text-white/80 hover:border-white/25 hover:bg-white/[0.06]',
                  ].join(' ')}
                >
                  {p.label}
                </button>
              )
            })}
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

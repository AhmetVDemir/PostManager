import type { Background, CanvasFormat } from '../../types'
import { CANVAS_DIMENSIONS } from '../../types'

interface Props {
  background: Background
  format: CanvasFormat
  onChange: (f: CanvasFormat) => void
  onBack: () => void
  onNext: () => void
}

function PreviewBox({ background, format }: { background: Background; format: CanvasFormat }) {
  const aspectClass = format === 'square' ? 'aspect-square' : 'aspect-[9/16]'
  const wrapper = `relative w-full overflow-hidden rounded-lg bg-black/40 ${aspectClass} ${format === 'vertical' ? 'mx-auto max-w-[55%]' : ''}`
  if (background.kind === 'image' && background.imageDataUrl) {
    return (
      <div className={wrapper}>
        <img src={background.imageDataUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    )
  }
  if (background.kind === 'solid') {
    return <div className={wrapper} style={{ background: background.solidColor }} />
  }
  if (background.kind === 'gradient') {
    return (
      <div
        className={wrapper}
        style={{
          background: `linear-gradient(${background.gradient.angle}deg, ${background.gradient.from}, ${background.gradient.to})`,
        }}
      />
    )
  }
  return <div className={wrapper} />
}

export function SizeStep({ background, format, onChange, onBack, onNext }: Props) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Hangi format?</h2>
        <p className="mt-2 text-white/60">Görselin nerede yayınlanacağını seç</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {(Object.keys(CANVAS_DIMENSIONS) as CanvasFormat[]).map((f) => {
          const dim = CANVAS_DIMENSIONS[f]
          const active = format === f
          return (
            <button
              key={f}
              type="button"
              onClick={() => onChange(f)}
              className={[
                'group flex flex-col gap-4 rounded-2xl border p-5 text-left transition',
                active
                  ? 'border-indigo-400 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]',
              ].join(' ')}
            >
              <PreviewBox background={background} format={f} />
              <div>
                <div className="flex items-center gap-2 text-lg font-semibold text-white">
                  {dim.label}
                  {active && <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-xs">Seçili</span>}
                </div>
                <div className="mt-1 text-sm text-white/60">{dim.desc}</div>
              </div>
            </button>
          )
        })}
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

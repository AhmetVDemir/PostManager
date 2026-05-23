import type { CanvasFormat } from '../../types'
import { CANVAS_DIMENSIONS } from '../../types'

interface Props {
  format: CanvasFormat
  onPick: (x: number, y: number) => void
}

const PERCENTS: Array<[number, number, string]> = [
  [0.2, 0.15, 'Üst-Sol'],
  [0.5, 0.15, 'Üst-Orta'],
  [0.8, 0.15, 'Üst-Sağ'],
  [0.2, 0.5, 'Orta-Sol'],
  [0.5, 0.5, 'Orta'],
  [0.8, 0.5, 'Orta-Sağ'],
  [0.2, 0.85, 'Alt-Sol'],
  [0.5, 0.85, 'Alt-Orta'],
  [0.8, 0.85, 'Alt-Sağ'],
]

export function PositionGrid({ format, onPick }: Props) {
  const dim = CANVAS_DIMENSIONS[format]
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
        Hızlı konum
      </label>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1">
        {PERCENTS.map(([px, py, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => onPick(dim.width * px, dim.height * py)}
            title={label}
            className="flex aspect-square items-center justify-center rounded-md bg-white/[0.04] text-base text-white/40 transition hover:bg-indigo-500/20 hover:text-white"
          >
            <span className="block h-1.5 w-1.5 rounded-full bg-current" />
          </button>
        ))}
      </div>
    </div>
  )
}

import type { FilterState } from '../../types'
import { FILTER_PRESETS } from '../../data/filters'

interface Props {
  filter: FilterState
  onChange: (f: FilterState) => void
  disabled?: boolean
}

export function FilterControl({ filter, onChange, disabled }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <label className={['flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm', disabled ? 'opacity-40' : 'text-white'].join(' ')}>
        <span className="flex items-center gap-2">
          <span className="text-base">🎨</span> Filtre
        </span>
        <input
          type="checkbox"
          checked={filter.enabled}
          disabled={disabled}
          onChange={(e) => onChange({ ...filter, enabled: e.target.checked })}
          className="h-4 w-4 accent-indigo-500"
        />
      </label>
      {filter.enabled && !disabled && (
        <div className="border-t border-white/5 p-2">
          <div className="grid grid-cols-2 gap-1.5">
            {FILTER_PRESETS.filter((p) => p.id !== 'none').map((p) => {
              const active = filter.preset === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ ...filter, preset: p.id })}
                  className={[
                    'rounded-md px-2 py-1.5 text-xs transition',
                    active
                      ? 'bg-indigo-500/20 text-white ring-1 ring-indigo-400'
                      : 'bg-white/[0.03] text-white/70 hover:bg-white/[0.07]',
                  ].join(' ')}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
          {disabled && (
            <div className="mt-2 text-xs text-amber-300/80">
              Filtre sadece görsel arka planda çalışır.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

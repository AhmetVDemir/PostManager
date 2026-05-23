import type { Step } from '../types'

interface Props {
  current: Step
  onJump?: (step: Step) => void
  maxReached: Step
}

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: 'Arka plan' },
  { id: 2, label: 'Boyut' },
  { id: 3, label: 'Editör' },
  { id: 4, label: 'Kaydet' },
]

export function Stepper({ current, onJump, maxReached }: Props) {
  return (
    <div className="flex items-center justify-center gap-1 px-4 py-4 sm:gap-2 sm:py-6">
      {STEPS.map((s, i) => {
        const done = s.id < current
        const active = s.id === current
        const reachable = s.id <= maxReached
        return (
          <div key={s.id} className="flex items-center">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onJump?.(s.id)}
              className={[
                'flex items-center gap-2 rounded-full px-2.5 py-2 text-sm font-medium transition sm:px-4',
                active
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : done
                  ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                  : reachable
                  ? 'bg-white/5 text-white/70 hover:bg-white/10'
                  : 'bg-white/[0.03] text-white/30 cursor-not-allowed',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  active ? 'bg-white/20' : done ? 'bg-emerald-500/30' : 'bg-white/10',
                ].join(' ')}
              >
                {done ? '✓' : s.id}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={['mx-0.5 h-px w-3 sm:mx-1 sm:w-6', done ? 'bg-emerald-500/40' : 'bg-white/10'].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

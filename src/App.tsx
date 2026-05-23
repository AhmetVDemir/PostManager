import { useState } from 'react'
import { Stepper } from './components/Stepper'
import { BackgroundStep } from './components/steps/BackgroundStep'
import { SizeStep } from './components/steps/SizeStep'
import { EditorStep } from './components/steps/EditorStep'
import { ExportStep } from './components/steps/ExportStep'
import { INITIAL_STATE, type AppState, type Step } from './types'

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE)
  const [maxReached, setMaxReached] = useState<Step>(1)

  const update = (patch: Partial<AppState>) => setState((s) => ({ ...s, ...patch }))

  const go = (step: Step) => {
    update({ step })
    if (step > maxReached) setMaxReached(step)
  }

  const restart = () => {
    setState(INITIAL_STATE)
    setMaxReached(1)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
              ◆
            </div>
            <div>
              <div className="text-sm font-semibold text-white">PostManager</div>
              <div className="text-xs text-white/40">Sosyal medya post editörü</div>
            </div>
          </div>
          {state.step > 1 && (
            <button
              type="button"
              onClick={restart}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.06]"
            >
              Sıfırla
            </button>
          )}
        </div>
      </header>

      <Stepper current={state.step} onJump={go} maxReached={maxReached} />

      <main className="flex-1 pb-12">
        {state.step === 1 && (
          <BackgroundStep
            background={state.background}
            format={state.format}
            onChange={(background) => update({ background })}
            onNext={() => go(2)}
          />
        )}

        {state.step === 2 && (
          <SizeStep
            background={state.background}
            format={state.format}
            onChange={(format) => update({ format })}
            onBack={() => go(1)}
            onNext={() => go(3)}
          />
        )}

        {state.step === 3 && (
          <EditorStep
            state={state}
            onUpdate={update}
            onBack={() => go(2)}
            onNext={() => go(4)}
          />
        )}

        {state.step === 4 && (
          <ExportStep state={state} onBack={() => go(3)} onRestart={restart} />
        )}
      </main>

      <footer className="border-t border-white/5 px-6 py-3 text-center text-xs text-white/30">
        PostManager · Yerel olarak çalışır, görseliniz cihazınızdan çıkmaz
      </footer>
    </div>
  )
}

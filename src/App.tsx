import { useState } from 'react'
import { Stepper } from './components/Stepper'
import { UploadStep } from './components/steps/UploadStep'
import { SizeStep } from './components/steps/SizeStep'
import { FilterStep } from './components/steps/FilterStep'
import { TextStep } from './components/steps/TextStep'
import { ExportStep } from './components/steps/ExportStep'
import { DEFAULT_TEXT, type AppState } from './types'

const INITIAL: AppState = {
  step: 1,
  imageDataUrl: null,
  format: 'square',
  filter: 'none',
  text: { ...DEFAULT_TEXT },
}

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL)
  const [maxReached, setMaxReached] = useState<1 | 2 | 3 | 4 | 5>(1)

  const go = (step: 1 | 2 | 3 | 4 | 5) => {
    setState((s) => ({ ...s, step }))
    if (step > maxReached) setMaxReached(step)
  }

  const restart = () => {
    setState(INITIAL)
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
          <UploadStep
            currentImage={state.imageDataUrl}
            onSelect={(url) => setState((s) => ({ ...s, imageDataUrl: url }))}
            onNext={() => go(2)}
          />
        )}

        {state.step === 2 && state.imageDataUrl && (
          <SizeStep
            imageDataUrl={state.imageDataUrl}
            format={state.format}
            onChange={(format) => setState((s) => ({ ...s, format }))}
            onBack={() => go(1)}
            onNext={() => go(3)}
          />
        )}

        {state.step === 3 && state.imageDataUrl && (
          <FilterStep
            imageDataUrl={state.imageDataUrl}
            format={state.format}
            filter={state.filter}
            onChange={(filter) => setState((s) => ({ ...s, filter }))}
            onBack={() => go(2)}
            onNext={() => go(4)}
          />
        )}

        {state.step === 4 && state.imageDataUrl && (
          <TextStep
            imageDataUrl={state.imageDataUrl}
            format={state.format}
            filter={state.filter}
            text={state.text}
            onChange={(text) => setState((s) => ({ ...s, text }))}
            onBack={() => go(3)}
            onNext={() => go(5)}
          />
        )}

        {state.step === 5 && state.imageDataUrl && (
          <ExportStep
            imageDataUrl={state.imageDataUrl}
            format={state.format}
            filter={state.filter}
            text={state.text}
            onBack={() => go(4)}
            onRestart={restart}
          />
        )}
      </main>

      <footer className="border-t border-white/5 px-6 py-3 text-center text-xs text-white/30">
        PostManager · Yerel olarak çalışır, görseliniz cihazınızdan çıkmaz
      </footer>
    </div>
  )
}

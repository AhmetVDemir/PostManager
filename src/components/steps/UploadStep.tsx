import { useCallback, useRef, useState } from 'react'

interface Props {
  currentImage: string | null
  onSelect: (dataUrl: string) => void
  onNext: () => void
}

export function UploadStep({ currentImage, onSelect, onNext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)
      if (!file.type.startsWith('image/')) {
        setError('Lütfen bir görsel dosyası seçin (PNG, JPG, WebP...)')
        return
      }
      if (file.size > 25 * 1024 * 1024) {
        setError('Görsel 25 MB\'tan büyük olamaz')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') onSelect(reader.result)
      }
      reader.readAsDataURL(file)
    },
    [onSelect],
  )

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Bir görsel yükle</h2>
        <p className="mt-2 text-white/60">PNG, JPG, WebP — en fazla 25 MB</p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const file = e.dataTransfer.files?.[0]
          if (file) handleFile(file)
        }}
        className={[
          'group relative flex h-72 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed transition',
          dragOver
            ? 'border-indigo-400 bg-indigo-500/10'
            : 'border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.05]',
        ].join(' ')}
      >
        {currentImage ? (
          <>
            <img
              src={currentImage}
              alt="preview"
              className="absolute inset-0 h-full w-full object-contain opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="relative z-10 mt-auto rounded-lg bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur">
              Değiştirmek için tıkla veya sürükle
            </div>
          </>
        ) : (
          <>
            <div className="text-5xl text-white/40 group-hover:text-white/60">↑</div>
            <div className="text-base font-medium text-white">Görseli buraya sürükle</div>
            <div className="text-sm text-white/50">veya tıkla — bilgisayarından seç</div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </button>

      {error && (
        <div className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={!currentImage}
        onClick={onNext}
        className="w-full rounded-xl bg-indigo-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Devam →
      </button>
    </div>
  )
}

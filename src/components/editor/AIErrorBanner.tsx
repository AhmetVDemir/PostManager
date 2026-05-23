import { useState } from 'react'
import { CloudAIError } from '../../services/cloudAI'

interface Props {
  error: CloudAIError | string
  onDismiss?: () => void
}

interface Presentation {
  emoji: string
  title: string
  explain: string
  actions: Array<string | { label: string; href: string }>
  technical: string
}

function isAction(a: unknown): a is { label: string; href: string } {
  return typeof a === 'object' && a !== null && 'href' in a
}

function getPresentation(error: CloudAIError | string): Presentation {
  if (typeof error === 'string') {
    return {
      emoji: '⚠️',
      title: 'Hata',
      explain: error,
      actions: [],
      technical: '',
    }
  }

  switch (error.code) {
    case 'dev-no-function':
      return {
        emoji: '🛠️',
        title: 'Yerel geliştirme modu — Online AI burada çalışmaz',
        explain:
          "Şu an `npm run dev` ile yerel sunucudasın. Cloudflare'in /api/suggest endpoint'i sadece üretim ortamında (Cloudflare Pages üzerinde) çalışır.",
        actions: [
          'Sol panelden 🪄 Akıllı Öner (heuristic) butonunu kullan — internetsiz, anlık çalışır.',
          'Tam AI testi için kodu git push edip Cloudflare deploy etmesini bekle.',
        ],
        technical: '/api/suggest → 404. Vite dev sunucusu Cloudflare Pages Functions çalıştırmaz.',
      }

    case 'not-configured':
      return {
        emoji: '⚙️',
        title: 'Sunucu ayarı eksik — API anahtarı bulunamadı',
        explain:
          'Cloudflare sunucusunda AI API anahtarı (LLM_API_KEY) tanımlı değil. Bunu Cloudflare Pages env vars\'a eklemen lazım.',
        actions: [
          'Cloudflare → postmanager → Settings → Variables and Secrets',
          'LLM_API_KEY adıyla bir Secret variable ekle',
          'Deployments → en son deployment ⋯ → Retry deployment',
          { label: 'Detaylı kılavuz: doc/DEPLOY.md', href: 'https://github.com/AhmetVDemir/PostManager/blob/main/doc/DEPLOY.md' },
        ],
        technical: 'Server 503. env.LLM_API_KEY undefined.',
      }

    case 'rate-limit': {
      const info = error.info
      const resetHint = info?.reset
        ? ` (${info.reset} sonra resetlenir)`
        : info?.retryAfter
        ? ` (${info.retryAfter} sn sonra)`
        : ''
      return {
        emoji: '🚦',
        title: `Günlük AI istek limitin doldu${resetHint}`,
        explain:
          'Bugünkü ücretsiz AI kullanım hakkın bitti. Groq free tier 14.400 istek/gün verir — büyük ihtimalle yarın sıfırlanacak. Bu çok cömert bir limit; muhtemelen sana özel bir trafik artışı yaşandı.',
        actions: [
          '🕒 Birkaç saat bekle veya yarın tekrar dene',
          '🔄 Farklı bir provider\'a geç (OpenRouter, Hugging Face) — kod değişmiyor, sadece Cloudflare env vars güncellenir',
          '🪄 Heuristic Akıllı Öner butonu offline çalışır, etkilenmez',
          { label: 'Provider switching kılavuzu', href: 'https://github.com/AhmetVDemir/PostManager/blob/main/doc/DEPLOY.md#alternatif-providerlar' },
        ],
        technical: `Provider 429. ${info?.provider ? `Provider: ${info.provider}.` : ''}${info?.limit ? ` Limit: ${info.limit}.` : ''}${info?.remaining ? ` Kalan: ${info.remaining}.` : ''}`,
      }
    }

    case 'auth-failed':
      return {
        emoji: '🔐',
        title: 'AI API anahtarı reddedildi',
        explain:
          'AI sağlayıcı (Groq vb.) anahtarını kabul etmedi. Anahtar silinmiş, yanlış kopyalanmış, veya hesabın askıya alınmış olabilir.',
        actions: [
          { label: 'console.groq.com → API Keys', href: 'https://console.groq.com/keys' },
          'Eski key\'i sil, yeni bir tane oluştur',
          'Cloudflare → Variables and Secrets → LLM_API_KEY değerini güncelle',
          'Deployments → ⋯ → Retry deployment',
        ],
        technical: 'Provider 401 / 403 — invalid bearer token.',
      }

    case 'network-error':
      return {
        emoji: '🌐',
        title: 'Sunucuya ulaşamıyorum',
        explain:
          'Tarayıcın AI endpoint\'ine bağlanamadı. Bu, internet, custom domain, veya tarayıcı eklentisi kaynaklı olabilir.',
        actions: [
          '🔌 İnternet bağlantını kontrol et',
          '⏳ Custom domain yeni eklendiyse 5-30 dk bekle — Cloudflare iç SSL hazırlığı sürer',
          '🛡 Tarayıcı eklentileri (Brave Shields, ad-block, sıkı gizlilik) kapat ve dene',
          '🌍 Farklı bir tarayıcı / cihaz / mobil veri ile dene',
        ],
        technical: error.message,
      }

    case 'upstream-error':
      return {
        emoji: '🤖',
        title: 'AI sağlayıcı beklenmedik cevap döndü',
        explain:
          'Cloudflare sunucum AI sağlayıcıya istek attı ama olağandışı bir cevap aldı. En sık nedeni: model adı yanlış, model şu an inaktif/yenilenmiş, ya da geçici servis kesintisi.',
        actions: [
          { label: 'console.groq.com → Models — aktif vision modelleri', href: 'https://console.groq.com/docs/models' },
          'Aktif bir vision modeli seç (örn meta-llama/llama-4-maverick-17b-128e-instruct)',
          'Cloudflare → Variables → LLM_MODEL değerini güncelle',
          'Deployments → ⋯ → Retry deployment',
          'F12 → Console\'da [CloudAI] upstream error satırında ham detay var',
        ],
        technical: error.message,
      }

    case 'bad-response':
      return {
        emoji: '🧩',
        title: 'AI cevap formatı beklediğimden farklı',
        explain:
          'AI bir cevap döndürdü ama beklediğimiz JSON yapısında değil. Genellikle model çok küçük veya görsel anlama yeteneği yetersiz.',
        actions: [
          'Daha güçlü bir vision model dene (örn meta-llama/llama-4-maverick-17b-128e-instruct)',
          'Cloudflare → Variables → LLM_MODEL değerini güncelle',
          'Deployments → ⋯ → Retry deployment',
        ],
        technical: error.message,
      }

    default:
      return {
        emoji: '⚠️',
        title: 'Beklenmedik hata',
        explain: error.message,
        actions: ['F12 → Console sekmesinden detay logları incele.'],
        technical: error.message,
      }
  }
}

export function AIErrorBanner({ error, onDismiss }: Props) {
  const p = getPresentation(error)
  const [showTech, setShowTech] = useState(false)

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-xs text-amber-100 shadow-lg shadow-amber-500/5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="text-sm font-semibold leading-snug text-amber-50">
            <span className="mr-1.5">{p.emoji}</span>
            {p.title}
          </div>
          <div className="mt-1.5 leading-relaxed text-amber-100/85">{p.explain}</div>

          {p.actions.length > 0 && (
            <div className="mt-2.5">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-amber-300/70">
                Yapabilecekleri
              </div>
              <ul className="space-y-1 text-amber-100/85">
                {p.actions.map((a, i) => (
                  <li key={i} className="flex gap-1.5 leading-relaxed">
                    <span className="shrink-0 text-amber-400/70">·</span>
                    {isAction(a) ? (
                      <a
                        href={a.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-200 underline decoration-amber-400/40 underline-offset-2 hover:text-amber-100 hover:decoration-amber-300"
                      >
                        {a.label} ↗
                      </a>
                    ) : (
                      <span>{a}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {p.technical && (
            <div className="mt-2.5 border-t border-amber-500/15 pt-2">
              <button
                type="button"
                onClick={() => setShowTech((s) => !s)}
                className="text-[10px] font-medium uppercase tracking-wider text-amber-300/60 hover:text-amber-200"
              >
                {showTech ? '▼ Teknik detayı gizle' : '▶ Teknik detay'}
              </button>
              {showTech && (
                <div className="mt-1.5 rounded bg-black/30 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-amber-100/70">
                  {p.technical}
                  <div className="mt-1 text-amber-300/50">
                    📋 Konsolda <code className="text-amber-200">[CloudAI]</code> ile başlayan loglara bak (F12 → Console)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded p-1 text-amber-300/60 transition hover:bg-amber-500/15 hover:text-amber-100"
            title="Kapat"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

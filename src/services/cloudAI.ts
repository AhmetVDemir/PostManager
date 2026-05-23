import type { Background } from '../types'
import type { StyleSuggestion } from './imageAnalysis'
import { analyzeBackground } from './imageAnalysis'

/**
 * /api/suggest endpoint'i Cloudflare Pages Functions ile sağlanır.
 * Provider (Groq / HF / OpenRouter) ve API key sadece sunucu tarafında
 * Cloudflare env vars'ta tutulur — bundle'a girmez.
 *
 * Dev modunda (vite dev sunucusu) /api/* yok, bu yüzden 404 alırız.
 * `wrangler pages dev` veya production build ile çalışır.
 */

export type AIErrorCode =
  | 'dev-no-function' // 404 — Vite dev mode'da function yok
  | 'not-configured' // 503 — server tarafında key yok
  | 'rate-limit' // 429 — provider quota / rate limit
  | 'auth-failed' // 401/403 — key geçersiz veya iptal edilmiş
  | 'upstream-error' // 502 — diğer LLM hataları
  | 'network-error' // fetch hatası
  | 'bad-response' // parse hatası

export interface RateLimitInfo {
  provider: string
  retryAfter?: string
  limit?: string
  remaining?: string
  reset?: string
}

export class CloudAIError extends Error {
  code: AIErrorCode
  info?: RateLimitInfo
  constructor(code: AIErrorCode, message: string, info?: RateLimitInfo) {
    super(message)
    this.code = code
    this.info = info
  }
}

interface ServerSuggestion {
  presetId: string
  textColor: string
  reasoning: string
}

const PRESET_IDS = [
  'neon',
  'neon-cyan',
  'vintage-poster',
  'soft-pastel',
  'bold-headline',
  'minimal',
  'elegant-serif',
  'sticker',
  'fire',
] as const

export async function suggestStyleWithAI(
  background: Background,
  headline: string,
): Promise<StyleSuggestion> {
  const endpoint = '/api/suggest'
  const startedAt = Date.now()
  const ctx = {
    endpoint,
    origin: typeof window !== 'undefined' ? window.location.origin : '(no window)',
    href: typeof window !== 'undefined' ? window.location.href : '(no window)',
  }
  console.info('[CloudAI] → POST', ctx)

  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ background, headline }),
    })
  } catch (e) {
    console.error('[CloudAI] fetch failed', { ...ctx, error: e })
    throw new CloudAIError(
      'network-error',
      `Network error (${ctx.origin}${endpoint}): ${e instanceof Error ? e.message : String(e)}. Tarayıcının F12 → Network sekmesinden detaya bak.`,
    )
  }
  console.info('[CloudAI] ← status', res.status, `(${Date.now() - startedAt}ms)`)

  if (res.status === 404) {
    throw new CloudAIError(
      'dev-no-function',
      "Dev modunda /api/suggest mevcut değil. Production'da (Cloudflare Pages'te) çalışır.",
    )
  }
  if (res.status === 503) {
    throw new CloudAIError(
      'not-configured',
      "Sunucuda LLM API key tanımlı değil. Cloudflare Pages env vars'a LLM_API_KEY ekleyin.",
    )
  }
  if (res.status === 429) {
    let info: RateLimitInfo | undefined
    try {
      const data = (await res.json()) as RateLimitInfo
      info = data
    } catch {/* ignore */}
    throw new CloudAIError(
      'rate-limit',
      "Günlük AI istek limitin doldu. Yarın resetlenecek — veya doc/DEPLOY.md'deki başka bir provider'a geç (OpenRouter / Hugging Face).",
      info,
    )
  }
  if (res.status === 401 || res.status === 403) {
    throw new CloudAIError(
      'auth-failed',
      'API key geçersiz veya iptal edilmiş. Cloudflare Pages → Settings → Variables → LLM_API_KEY değerini güncelle ve Retry deployment yap.',
    )
  }
  if (!res.ok) {
    let detail = ''
    let raw = ''
    try {
      raw = await res.text()
      const data = JSON.parse(raw) as { error?: string; detail?: string }
      detail = data.detail ? `${data.error}: ${data.detail}` : data.error ?? ''
    } catch {/* not json */}
    console.error('[CloudAI] upstream error', { status: res.status, body: raw.slice(0, 400) })
    throw new CloudAIError('upstream-error', detail || `Server returned ${res.status}: ${raw.slice(0, 200)}`)
  }

  let data: ServerSuggestion
  try {
    data = (await res.json()) as ServerSuggestion
  } catch (e) {
    console.error('[CloudAI] response parse failed', e)
    throw new CloudAIError('bad-response', 'Cannot parse server response')
  }
  console.info('[CloudAI] ✓ suggestion', data)

  if (!data.presetId || !(PRESET_IDS as readonly string[]).includes(data.presetId)) {
    throw new CloudAIError('bad-response', `Unknown presetId: ${data.presetId}`)
  }

  const analysis = await analyzeBackground(background)
  return {
    analysis,
    presetId: data.presetId,
    textColor: /^#[0-9a-fA-F]{6}$/.test(data.textColor) ? data.textColor : '#ffffff',
    reasoning: data.reasoning ?? '',
  }
}

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
  | 'upstream-error' // 502 — LLM hatası
  | 'network-error' // fetch hatası
  | 'bad-response' // parse hatası

export class CloudAIError extends Error {
  code: AIErrorCode
  constructor(code: AIErrorCode, message: string) {
    super(message)
    this.code = code
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
  let res: Response
  try {
    res = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ background, headline }),
    })
  } catch (e) {
    throw new CloudAIError('network-error', `Network error: ${e instanceof Error ? e.message : String(e)}`)
  }

  if (res.status === 404) {
    throw new CloudAIError(
      'dev-no-function',
      "Dev modunda /api/suggest mevcut değil. Production'da (Cloudflare Pages'te) çalışır.",
    )
  }
  if (res.status === 503) {
    throw new CloudAIError(
      'not-configured',
      'Sunucuda LLM API key tanımlı değil. Cloudflare Pages env vars\'a LLM_API_KEY ekleyin.',
    )
  }
  if (!res.ok) {
    let detail = ''
    try {
      const data = (await res.json()) as { error?: string; detail?: string }
      detail = data.detail ? `${data.error}: ${data.detail}` : data.error ?? ''
    } catch {/* ignore */}
    throw new CloudAIError('upstream-error', detail || `Server returned ${res.status}`)
  }

  let data: ServerSuggestion
  try {
    data = (await res.json()) as ServerSuggestion
  } catch {
    throw new CloudAIError('bad-response', 'Cannot parse server response')
  }

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

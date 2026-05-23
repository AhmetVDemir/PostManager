import type { Background } from '../types'
import type { StyleSuggestion } from './imageAnalysis'
import { analyzeBackground } from './imageAnalysis'

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

const POLLINATIONS_URL = 'https://text.pollinations.ai/openai'

/**
 * Pollinations.ai üzerinden bir vision-capable LLM'e arkaplanı göstererek
 * en uygun stil preset'ini sorar. API key gerektirmez (anonim, ücretsiz).
 * İnternet bağlantısı gerekir. Hata durumunda null döner.
 */
export async function suggestStyleWithAI(
  bg: Background,
  currentText: string,
): Promise<StyleSuggestion | null> {
  // Compose the visual content for the model
  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = []

  if (bg.kind === 'image' && bg.imageDataUrl) {
    userContent.push({ type: 'image_url', image_url: { url: bg.imageDataUrl } })
  } else if (bg.kind === 'solid') {
    userContent.push({
      type: 'text',
      text: `Background is a solid color: ${bg.solidColor}.`,
    })
  } else if (bg.kind === 'gradient') {
    userContent.push({
      type: 'text',
      text: `Background is a linear gradient from ${bg.gradient.from} to ${bg.gradient.to} at ${bg.gradient.angle} degrees.`,
    })
  }

  const headline = currentText.trim() || 'short headline'
  userContent.push({
    type: 'text',
    text: `Pick the best text style for a social-media post. The headline on top will be: "${headline}".`,
  })

  const system = `You are a graphic-design assistant.
Choose ONE style preset from: ${PRESET_IDS.join(', ')}.
Suggest a complementary text color in hex.
Reply with STRICT JSON only — no prose, no code fences:
{"presetId":"<id>","textColor":"#rrggbb","reasoning":"<short reason in Turkish>"}`

  const body = {
    model: 'openai-large',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    seed: 42,
  }

  let res: Response
  try {
    res = await fetch(POLLINATIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (e) {
    console.warn('Pollinations request failed:', e)
    return null
  }
  if (!res.ok) {
    console.warn('Pollinations responded with', res.status)
    return null
  }

  let json: { choices?: Array<{ message?: { content?: string } }> }
  try {
    json = await res.json()
  } catch {
    return null
  }
  const content = json?.choices?.[0]?.message?.content
  if (!content) return null

  // Extract JSON block (model may wrap it)
  const m = String(content).match(/\{[\s\S]*\}/)
  if (!m) return null
  let parsed: { presetId: string; textColor: string; reasoning: string }
  try {
    parsed = JSON.parse(m[0])
  } catch {
    return null
  }

  if (!(PRESET_IDS as readonly string[]).includes(parsed.presetId)) return null
  if (!/^#[0-9a-fA-F]{6}$/.test(parsed.textColor)) parsed.textColor = '#ffffff'

  // Compute analysis for completeness (callers may rely on it)
  const analysis = await analyzeBackground(bg)

  return {
    analysis,
    presetId: parsed.presetId,
    textColor: parsed.textColor,
    reasoning: parsed.reasoning,
  }
}

/**
 * PostManager — Cloudflare Pages Function
 *
 * POST /api/suggest
 *
 * Body: { background, headline }
 * Response: { presetId, textColor, reasoning }
 *
 * Provider-agnostic: env vars LLM_BASE_URL + LLM_MODEL + LLM_API_KEY ile
 * Groq, OpenRouter, Hugging Face, OpenAI vs. herhangi bir OpenAI-compatible
 * sağlayıcıya proxy yapar.
 *
 * Önerilen default: Groq
 *   LLM_BASE_URL = https://api.groq.com/openai/v1
 *   LLM_MODEL    = llama-3.2-90b-vision-preview
 *   LLM_API_KEY  = gsk_xxx
 *
 * Key SADECE Cloudflare Pages env vars'ta tutulur — bundle'a girmez.
 */

type Background = {
  kind: 'image' | 'solid' | 'gradient'
  imageDataUrl?: string | null
  solidColor?: string
  gradient?: { from: string; to: string; angle: number }
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

interface Env {
  LLM_BASE_URL?: string
  LLM_MODEL?: string
  LLM_API_KEY?: string
}

interface RequestContext {
  request: Request
  env: Env
}

// CORS: aynı domain (CF Pages), normalde gerek yok ama dev-test için izin verelim
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders() })
}

export async function onRequestPost(context: RequestContext): Promise<Response> {
  const { request, env } = context

  if (!env.LLM_API_KEY) {
    return json({ error: 'LLM_API_KEY not configured on server' }, 503)
  }

  let body: { background?: Background; headline?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Bad JSON body' }, 400)
  }

  const bg = body.background
  if (!bg) return json({ error: 'Missing background' }, 400)
  const headline = (body.headline ?? '').toString().slice(0, 200) || 'short headline'

  // Build the multimodal user content
  const userContent: Array<
    { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
  > = []

  if (bg.kind === 'image' && bg.imageDataUrl) {
    userContent.push({ type: 'image_url', image_url: { url: bg.imageDataUrl } })
  } else if (bg.kind === 'solid' && bg.solidColor) {
    userContent.push({
      type: 'text',
      text: `Background is a solid color: ${bg.solidColor}.`,
    })
  } else if (bg.kind === 'gradient' && bg.gradient) {
    userContent.push({
      type: 'text',
      text: `Background is a linear gradient from ${bg.gradient.from} to ${bg.gradient.to} at ${bg.gradient.angle} degrees.`,
    })
  } else {
    return json({ error: 'Background has no usable content' }, 400)
  }

  userContent.push({
    type: 'text',
    text: `Pick the best text style for a social-media post. The headline on top will be: "${headline}".`,
  })

  const system = `You are a graphic-design assistant.
Choose ONE style preset from this list: ${PRESET_IDS.join(', ')}.
Suggest a complementary text color in hex.
Reply with STRICT JSON only — no prose, no code fences, no explanation. Just the JSON:
{"presetId":"<id>","textColor":"#rrggbb","reasoning":"<one short Turkish sentence>"}`

  const upstreamBody = {
    model: env.LLM_MODEL ?? 'llama-3.2-90b-vision-preview',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    max_tokens: 200,
    temperature: 0.7,
  }

  const upstreamUrl = `${env.LLM_BASE_URL ?? 'https://api.groq.com/openai/v1'}/chat/completions`

  let upstream: Response
  try {
    upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.LLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(upstreamBody),
    })
  } catch (e) {
    return json({ error: `Network error: ${String(e)}` }, 502)
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '')
    return json({ error: `LLM upstream ${upstream.status}`, detail: text.slice(0, 400) }, 502)
  }

  type ChatResp = { choices?: Array<{ message?: { content?: string } }> }
  let data: ChatResp
  try {
    data = (await upstream.json()) as ChatResp
  } catch {
    return json({ error: 'Bad LLM response' }, 502)
  }

  const content = data?.choices?.[0]?.message?.content ?? ''
  const m = String(content).match(/\{[\s\S]*\}/)
  if (!m) return json({ error: 'No JSON in LLM response', raw: content.slice(0, 300) }, 502)

  let parsed: { presetId?: string; textColor?: string; reasoning?: string }
  try {
    parsed = JSON.parse(m[0])
  } catch {
    return json({ error: 'Malformed JSON from LLM', raw: m[0].slice(0, 300) }, 502)
  }

  if (!parsed.presetId || !(PRESET_IDS as readonly string[]).includes(parsed.presetId)) {
    return json({ error: 'LLM returned unknown presetId', raw: parsed.presetId }, 502)
  }
  if (!parsed.textColor || !/^#[0-9a-fA-F]{6}$/.test(parsed.textColor)) {
    parsed.textColor = '#ffffff'
  }

  return json({
    presetId: parsed.presetId,
    textColor: parsed.textColor,
    reasoning: parsed.reasoning ?? '',
  })
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

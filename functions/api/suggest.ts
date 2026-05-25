/**
 * PostManager — Cloudflare Pages Function
 *
 * POST /api/suggest
 *
 * Body: { task, background, headline?, currentText? }
 *   task = 'style'   → preset + textColor önerisi (mevcut)
 *   task = 'text'    → kısa caption / başlık önerisi
 *   task = 'mega'    → her ikisi: stil + caption birden
 *
 * Provider-agnostic: env LLM_BASE_URL + LLM_MODEL + LLM_API_KEY
 *   Default Groq:
 *     LLM_BASE_URL = https://api.groq.com/openai/v1
 *     LLM_MODEL    = meta-llama/llama-4-scout-17b-16e-instruct
 *     LLM_API_KEY  = gsk_xxx (Secret, env vars'ta)
 */

type Background = {
  kind: 'image' | 'solid' | 'gradient'
  imageDataUrl?: string | null
  solidColor?: string
  gradient?: { from: string; to: string; angle: number }
}

const PRESET_IDS = [
  'neon', 'neon-cyan', 'vintage-poster', 'soft-pastel', 'bold-headline',
  'minimal', 'elegant-serif', 'sticker', 'fire',
  'highlight-yellow', 'plate-dark', 'plate-white',
] as const

type Task = 'style' | 'text' | 'mega'

interface Env {
  LLM_BASE_URL?: string
  LLM_MODEL?: string
  LLM_API_KEY?: string
}

interface RequestContext {
  request: Request
  env: Env
}

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

  let body: { task?: Task; background?: Background; headline?: string; currentText?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Bad JSON body' }, 400)
  }

  const task: Task = body.task ?? 'style'
  const bg = body.background
  if (!bg) return json({ error: 'Missing background' }, 400)
  const headline = (body.headline ?? body.currentText ?? '').toString().slice(0, 500)

  // Build visual user content
  const userContent: Array<
    { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
  > = []

  if (bg.kind === 'image' && bg.imageDataUrl) {
    userContent.push({ type: 'image_url', image_url: { url: bg.imageDataUrl } })
  } else if (bg.kind === 'solid' && bg.solidColor) {
    userContent.push({ type: 'text', text: `Background is a solid color: ${bg.solidColor}.` })
  } else if (bg.kind === 'gradient' && bg.gradient) {
    userContent.push({
      type: 'text',
      text: `Background is a linear gradient from ${bg.gradient.from} to ${bg.gradient.to} at ${bg.gradient.angle} degrees.`,
    })
  } else {
    return json({ error: 'Background has no usable content' }, 400)
  }

  // Task-specific system prompt and user instruction
  let system: string
  let userInstruction: string

  if (task === 'style') {
    system = `You are a graphic-design assistant.
Choose ONE style preset from: ${PRESET_IDS.join(', ')}.
Suggest a complementary text color in hex.
Reply with STRICT JSON only — no prose, no code fences:
{"presetId":"<id>","textColor":"#rrggbb","reasoning":"<one short Turkish sentence>"}`
    userInstruction = `Pick the best text style for a social-media post. The headline on top will be: "${headline || 'short headline'}".`
  } else if (task === 'text') {
    system = `You are a Turkish social-media copywriter assistant.
Suggest 3 short, punchy Turkish captions for the given visual.
Each caption should be 3-12 words, evocative, and suitable as a post overlay.
Reply with STRICT JSON only — no prose, no code fences:
{"suggestions":["caption 1","caption 2","caption 3"],"reasoning":"<one short Turkish sentence on why these fit>"}`
    userInstruction = headline
      ? `Current text: "${headline}". Suggest 3 stronger/shorter Turkish alternatives that match the visual.`
      : `Suggest 3 Turkish captions that match this visual.`
  } else {
    // mega
    system = `You are a Turkish social-media post designer.
For the given visual, propose a complete post composition:
- caption: a single 3-12 word Turkish caption
- presetId: ONE of [${PRESET_IDS.join(', ')}]
- textColor: hex like #rrggbb
- reasoning: one short Turkish sentence
Reply with STRICT JSON only — no prose, no code fences:
{"caption":"...","presetId":"<id>","textColor":"#rrggbb","reasoning":"..."}`
    userInstruction = headline
      ? `Existing text: "${headline}". Improve it AND style it for the visual.`
      : `Propose a complete post (caption + style) for this visual.`
  }

  userContent.push({ type: 'text', text: userInstruction })

  const upstreamBody = {
    model: env.LLM_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    max_tokens: 400,
    temperature: task === 'text' ? 0.9 : 0.7,
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
    if (upstream.status === 429) {
      return json(
        {
          error: 'rate-limit',
          provider: hostFromUrl(upstreamUrl),
          retryAfter: upstream.headers.get('retry-after') ?? '',
          limit: upstream.headers.get('x-ratelimit-limit-requests') ?? '',
          remaining: upstream.headers.get('x-ratelimit-remaining-requests') ?? '',
          reset: upstream.headers.get('x-ratelimit-reset-requests') ?? '',
          detail: text.slice(0, 400),
        },
        429,
      )
    }
    if (upstream.status === 401 || upstream.status === 403) {
      return json({ error: 'auth-failed', detail: text.slice(0, 400) }, upstream.status)
    }
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

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(m[0]) as Record<string, unknown>
  } catch {
    return json({ error: 'Malformed JSON from LLM', raw: m[0].slice(0, 300) }, 502)
  }

  // Validation per task
  if (task === 'style' || task === 'mega') {
    const presetId = String(parsed.presetId ?? '')
    if (!(PRESET_IDS as readonly string[]).includes(presetId)) {
      return json({ error: 'LLM returned unknown presetId', raw: presetId }, 502)
    }
    const textColor = typeof parsed.textColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(parsed.textColor)
      ? parsed.textColor
      : '#ffffff'
    parsed.presetId = presetId
    parsed.textColor = textColor
  }
  if (task === 'text') {
    const arr = parsed.suggestions
    if (!Array.isArray(arr) || arr.length === 0) {
      return json({ error: 'LLM returned no suggestions' }, 502)
    }
    parsed.suggestions = arr.filter((s): s is string => typeof s === 'string').slice(0, 5)
  }

  return json(parsed)
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return ''
  }
}

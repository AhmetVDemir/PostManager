// ============================================================================
// Canvas format
// ============================================================================
export type CanvasFormat = 'square' | 'vertical'

export const CANVAS_DIMENSIONS: Record<CanvasFormat, { width: number; height: number; label: string; desc: string }> = {
  square: { width: 1080, height: 1080, label: 'Instagram Kare', desc: '1080 × 1080  ·  Feed' },
  vertical: { width: 1080, height: 1920, label: 'Dikey (Story/Reels/TikTok)', desc: '1080 × 1920  ·  9:16' },
}

// ============================================================================
// Background — görsel, düz renk veya gradient
// ============================================================================
export type BackgroundKind = 'image' | 'solid' | 'gradient'

export interface ImageTransform {
  zoom: number // 1 = cover-fit, > 1 zoom in
  offsetX: number // -1 to 1 (0 = center, +1 = right edge)
  offsetY: number // -1 to 1 (0 = center, +1 = bottom edge)
}

export const DEFAULT_IMAGE_TRANSFORM: ImageTransform = { zoom: 1, offsetX: 0, offsetY: 0 }

export interface Background {
  kind: BackgroundKind
  imageDataUrl: string | null
  imageTransform: ImageTransform
  solidColor: string
  gradient: {
    from: string
    to: string
    angle: number // 0-360
  }
}

export const DEFAULT_BACKGROUND: Background = {
  kind: 'image',
  imageDataUrl: null,
  imageTransform: { ...DEFAULT_IMAGE_TRANSFORM },
  solidColor: '#1a1a2e',
  gradient: { from: '#6366f1', to: '#d946ef', angle: 135 },
}

// ============================================================================
// Filter (opt-in)
// ============================================================================
export type FilterPreset =
  | 'none'
  | 'vintage'
  | 'bw'
  | 'warm'
  | 'cool'
  | 'fade'
  | 'vivid'
  | 'sepia'
  | 'noir'
  | 'clarity'
  | 'cinematic'
  | 'hdr'
  | 'polaroid'
  | 'lomo'
  | 'cyberpunk'
  | 'lofi'
  | 'sunset'
  | 'mocha'
  | 'coldsteel'
  | 'duotone-pink'
  | 'duotone-blue'
  | 'posterize'
  | 'dream'
  | 'matte'
  | 'crisp'
  | 'film-grain'
  | 'anime'

export interface FilterState {
  enabled: boolean
  preset: FilterPreset
}

export const DEFAULT_FILTER: FilterState = { enabled: false, preset: 'none' }

// ============================================================================
// Font mood (for font suggestion)
// ============================================================================
export type FontMood =
  | 'modern'
  | 'elegant'
  | 'bold'
  | 'vintage'
  | 'fun'
  | 'handwritten'
  | 'tech'
  | 'calligraphy'
  | 'decorative'

// ============================================================================
// Layers
// ============================================================================
export type LayerType = 'text' | 'emoji'

export interface BaseLayer {
  id: string
  type: LayerType
  x: number
  y: number
  rotation: number
}

export interface TextLayer extends BaseLayer {
  type: 'text'
  text: string
  fontFamily: string
  fontSize: number
  color: string
  align: 'left' | 'center' | 'right'

  // Stroke (kontur)
  stroke: boolean
  strokeColor: string
  strokeWidth: number

  // Shadow
  shadow: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  shadowOpacity: number

  // Glow
  glow: boolean
  glowColor: string
  glowBlur: number
  glowOpacity: number

  // Background plate (arkasına renkli kutu)
  bg: boolean
  bgColor: string
  bgOpacity: number // 0-1
  bgPaddingX: number
  bgPaddingY: number
  bgRadius: number

  // Paragraf desteği (v0.3-C)
  maxWidth: number | null // null = otomatik (içeriğe göre); pozitif sayı = piksel cinsinden wrap genişliği
  lineHeight: number // 1.0 - 2.5
}

export interface EmojiLayer extends BaseLayer {
  type: 'emoji'
  emoji: string
  size: number
}

export type Layer = TextLayer | EmojiLayer

// ============================================================================
// App state
// ============================================================================
export type Step = 1 | 2 | 3 | 4 // background, size, editor, export

export interface AppState {
  step: Step
  background: Background
  format: CanvasFormat
  filter: FilterState
  layers: Layer[]
  selectedLayerId: string | null
}

export const INITIAL_STATE: AppState = {
  step: 1,
  background: { ...DEFAULT_BACKGROUND },
  format: 'square',
  filter: { ...DEFAULT_FILTER },
  layers: [],
  selectedLayerId: null,
}

// ============================================================================
// Factory functions
// ============================================================================
function uid(): string {
  // crypto.randomUUID isn't on all targets; fallback to a short id
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch {/* ignore */}
  return 'l_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function createTextLayer(format: CanvasFormat = 'square', overrides: Partial<TextLayer> = {}): TextLayer {
  const d = CANVAS_DIMENSIONS[format]
  return {
    id: uid(),
    type: 'text',
    text: 'Yazınız buraya',
    x: d.width / 2,
    y: d.height / 2,
    rotation: 0,
    fontFamily: 'Inter',
    fontSize: 100,
    color: '#ffffff',
    align: 'center',

    stroke: false,
    strokeColor: '#000000',
    strokeWidth: 3,

    shadow: true,
    shadowColor: '#000000',
    shadowBlur: 12,
    shadowOffsetX: 2,
    shadowOffsetY: 4,
    shadowOpacity: 0.7,

    glow: false,
    glowColor: '#ffd166',
    glowBlur: 35,
    glowOpacity: 0.9,

    bg: false,
    bgColor: '#7c1010',
    bgOpacity: 0.85,
    bgPaddingX: 24,
    bgPaddingY: 10,
    bgRadius: 4,

    maxWidth: null,
    lineHeight: 1.15,

    ...overrides,
  }
}

export function createEmojiLayer(emoji: string, format: CanvasFormat = 'square', overrides: Partial<EmojiLayer> = {}): EmojiLayer {
  const d = CANVAS_DIMENSIONS[format]
  return {
    id: uid(),
    type: 'emoji',
    emoji,
    x: d.width / 2,
    y: d.height / 2,
    size: 220,
    rotation: 0,
    ...overrides,
  }
}

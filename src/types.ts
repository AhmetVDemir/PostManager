export type CanvasFormat = 'square' | 'vertical'

export const CANVAS_DIMENSIONS: Record<CanvasFormat, { width: number; height: number; label: string; desc: string }> = {
  square: { width: 1080, height: 1080, label: 'Instagram Kare', desc: '1080 × 1080  ·  Feed' },
  vertical: { width: 1080, height: 1920, label: 'Dikey (Story/Reels/TikTok)', desc: '1080 × 1920  ·  9:16' },
}

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

export type FontMood = 'modern' | 'elegant' | 'bold' | 'vintage' | 'fun' | 'handwritten'

export interface TextLayer {
  text: string
  fontFamily: string
  fontSize: number
  color: string
  x: number
  y: number
  align: 'left' | 'center' | 'right'
  rotation: number

  shadow: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  shadowOpacity: number

  glow: boolean
  glowColor: string
  glowBlur: number
  glowOpacity: number
}

export interface AppState {
  step: 1 | 2 | 3 | 4 | 5
  imageDataUrl: string | null
  format: CanvasFormat
  filter: FilterPreset
  text: TextLayer
}

export const DEFAULT_TEXT: TextLayer = {
  text: '',
  fontFamily: 'Inter',
  fontSize: 80,
  color: '#ffffff',
  x: 540,
  y: 540,
  align: 'center',
  rotation: 0,

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
}

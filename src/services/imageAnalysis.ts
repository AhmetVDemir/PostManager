import type { Background } from '../types'

// ============================================================================
// Color utilities
// ============================================================================

interface RGB {
  r: number
  g: number
  b: number
}

interface HSL {
  h: number // 0-360
  s: number // 0-1
  l: number // 0-1
}

function hexToRgb(hex: string): RGB {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  }
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60
      break
    case gn:
      h = ((bn - rn) / d + 2) * 60
      break
    case bn:
      h = ((rn - gn) / d + 4) * 60
      break
  }
  return { h, s, l }
}

// ============================================================================
// Analysis result
// ============================================================================

export interface BackgroundAnalysis {
  hue: number // 0-360
  saturation: number // 0-1
  lightness: number // 0-1
  isWarm: boolean // hue in red/orange/yellow zone
  isDark: boolean // lightness < 0.4
  isBright: boolean // lightness > 0.7
  isVivid: boolean // saturation > 0.5
  complexity: number // 0-1: 0=solid, ~0.2=gradient, 0.3-1=image variance
  dominantColor: string // hex
}

const DEFAULT_ANALYSIS: BackgroundAnalysis = {
  hue: 0,
  saturation: 0,
  lightness: 0.5,
  isWarm: false,
  isDark: false,
  isBright: false,
  isVivid: false,
  complexity: 0,
  dominantColor: '#888888',
}

function rgbToHex({ r, g, b }: RGB): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function buildAnalysis(rgb: RGB, complexity: number): BackgroundAnalysis {
  const hsl = rgbToHsl(rgb)
  return {
    hue: hsl.h,
    saturation: hsl.s,
    lightness: hsl.l,
    isWarm: hsl.h < 80 || hsl.h > 300,
    isDark: hsl.l < 0.4,
    isBright: hsl.l > 0.7,
    isVivid: hsl.s > 0.5,
    complexity,
    dominantColor: rgbToHex(rgb),
  }
}

// ============================================================================
// Per-background-kind analyzers
// ============================================================================

function analyzeSolid(color: string): BackgroundAnalysis {
  return buildAnalysis(hexToRgb(color), 0)
}

function analyzeGradient(from: string, to: string): BackgroundAnalysis {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  const mid: RGB = {
    r: (a.r + b.r) / 2,
    g: (a.g + b.g) / 2,
    b: (a.b + b.b) / 2,
  }
  return buildAnalysis(mid, 0.2)
}

async function analyzeImageDataUrl(dataUrl: string): Promise<BackgroundAnalysis> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image()
    el.onload = () => resolve(el)
    el.onerror = reject
    el.src = dataUrl
  })

  const SIZE = 64
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return DEFAULT_ANALYSIS
  ctx.drawImage(img, 0, 0, SIZE, SIZE)
  const data = ctx.getImageData(0, 0, SIZE, SIZE).data

  let rSum = 0,
    gSum = 0,
    bSum = 0
  let lumSum = 0
  let lumSumSq = 0
  const n = SIZE * SIZE
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    rSum += r
    gSum += g
    bSum += b
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    lumSum += lum
    lumSumSq += lum * lum
  }
  const avg: RGB = { r: rSum / n, g: gSum / n, b: bSum / n }
  // Variance of luminance → "complexity"
  const lumMean = lumSum / n
  const lumVar = Math.max(0, lumSumSq / n - lumMean * lumMean)
  const lumStd = Math.sqrt(lumVar) / 128 // normalize to ~0..1
  const complexity = Math.min(1, lumStd)

  return buildAnalysis(avg, Math.max(0.3, complexity))
}

export async function analyzeBackground(bg: Background): Promise<BackgroundAnalysis> {
  if (bg.kind === 'solid') return analyzeSolid(bg.solidColor)
  if (bg.kind === 'gradient') return analyzeGradient(bg.gradient.from, bg.gradient.to)
  if (bg.kind === 'image' && bg.imageDataUrl) return analyzeImageDataUrl(bg.imageDataUrl)
  return DEFAULT_ANALYSIS
}

// ============================================================================
// Style suggestion
// ============================================================================

export interface StyleSuggestion {
  analysis: BackgroundAnalysis
  presetId: string
  textColor: string
  reasoning: string
}

export function suggestStyle(a: BackgroundAnalysis): StyleSuggestion {
  let presetId = 'minimal'
  let textColor = '#ffffff'
  let reasoning = ''

  if (a.isBright) {
    // Parlak arka plan — koyu yazı + stroke
    presetId = 'bold-headline'
    textColor = '#0f172a'
    reasoning = 'Parlak arka plan. Koyu, kalın bir başlık stili önerildi — kontrast için stroke ekli.'
  } else if (a.isDark && a.isVivid) {
    // Karanlık ve canlı renk — neon
    presetId = a.isWarm ? 'neon' : 'neon-cyan'
    textColor = '#ffffff'
    reasoning = `Karanlık ve canlı ${a.isWarm ? 'sıcak' : 'soğuk'} tonlar. Neon stili glow ile öne çıkar.`
  } else if (a.isDark && !a.isVivid) {
    // Karanlık ve mat — zarif veya minimal
    if (a.complexity > 0.4) {
      presetId = 'minimal'
      reasoning = 'Karanlık ve detaylı arka plan. Sade beyaz yazı + ince gölge önerildi.'
    } else {
      presetId = 'elegant-serif'
      reasoning = 'Karanlık ve sade arka plan. Zarif bir serif font tercih edildi.'
    }
    textColor = '#ffffff'
  } else if (a.isWarm) {
    // Orta parlaklık, sıcak ton — ateş veya vintage
    if (a.isVivid) {
      presetId = 'fire'
      reasoning = 'Orta parlaklık, canlı sıcak tonlar. Ateş tarzı turuncu glow.'
    } else {
      presetId = 'vintage-poster'
      reasoning = 'Sıcak ama soluk tonlar. Vintage poster stili ile koyu kontur.'
    }
    textColor = '#ffffff'
  } else {
    // Orta + soğuk
    if (a.complexity > 0.5) {
      presetId = 'sticker'
      reasoning = 'Detaylı, soğuk tonlu arka plan. Sticker tarzı stroke ile okunabilirlik.'
    } else {
      presetId = 'soft-pastel'
      reasoning = 'Soğuk ve sade tonlar. Yumuşak pastel parlama ile uyumlu.'
    }
    textColor = '#ffffff'
  }

  return { analysis: a, presetId, textColor, reasoning }
}

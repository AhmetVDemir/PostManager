import Konva from 'konva'
import type { FilterPreset } from '../types'

export interface FilterDefinition {
  id: FilterPreset
  label: string
  filters: typeof Konva.Filters[keyof typeof Konva.Filters][]
  attrs?: {
    brightness?: number
    contrast?: number
    saturation?: number
    hue?: number
    blurRadius?: number
    enhance?: number
  }
}

export const FILTER_PRESETS: FilterDefinition[] = [
  {
    id: 'none',
    label: 'Orijinal',
    filters: [],
  },
  {
    id: 'vintage',
    label: 'Vintage',
    filters: [Konva.Filters.Brighten, Konva.Filters.HSL, Konva.Filters.Sepia],
    attrs: { brightness: -0.05, saturation: -0.2 },
  },
  {
    id: 'bw',
    label: 'Siyah-Beyaz',
    filters: [Konva.Filters.Grayscale, Konva.Filters.Contrast],
    attrs: { contrast: 15 },
  },
  {
    id: 'warm',
    label: 'Sıcak',
    filters: [Konva.Filters.HSL, Konva.Filters.Brighten],
    attrs: { hue: 12, saturation: 0.15, brightness: 0.05 },
  },
  {
    id: 'cool',
    label: 'Soğuk',
    filters: [Konva.Filters.HSL],
    attrs: { hue: -15, saturation: 0.05 },
  },
  {
    id: 'fade',
    label: 'Solgun',
    filters: [Konva.Filters.HSL, Konva.Filters.Contrast],
    attrs: { saturation: -0.35, contrast: -20 },
  },
  {
    id: 'vivid',
    label: 'Canlı',
    filters: [Konva.Filters.HSL, Konva.Filters.Contrast],
    attrs: { saturation: 0.4, contrast: 18 },
  },
  {
    id: 'sepia',
    label: 'Sepya',
    filters: [Konva.Filters.Sepia],
  },
  {
    id: 'noir',
    label: 'Noir',
    filters: [Konva.Filters.Grayscale, Konva.Filters.Contrast, Konva.Filters.Brighten],
    attrs: { contrast: 35, brightness: -0.1 },
  },
  {
    id: 'clarity',
    label: 'Berrak',
    filters: [Konva.Filters.Contrast, Konva.Filters.HSL],
    attrs: { contrast: 12, saturation: 0.1 },
  },
  {
    id: 'cinematic',
    label: 'Sinematik',
    filters: [Konva.Filters.HSL, Konva.Filters.Contrast, Konva.Filters.Brighten],
    attrs: { hue: -8, saturation: -0.15, contrast: 25, brightness: -0.05 },
  },
  {
    id: 'hdr',
    label: 'HDR',
    filters: [Konva.Filters.Contrast, Konva.Filters.HSL],
    attrs: { contrast: 30, saturation: 0.3 },
  },
  {
    id: 'polaroid',
    label: 'Polaroid',
    filters: [Konva.Filters.Brighten, Konva.Filters.HSL, Konva.Filters.Contrast],
    attrs: { brightness: 0.08, saturation: -0.15, contrast: -10, hue: 8 },
  },
  {
    id: 'lomo',
    label: 'Lomo',
    filters: [Konva.Filters.Contrast, Konva.Filters.HSL, Konva.Filters.Brighten],
    attrs: { contrast: 35, saturation: 0.25, brightness: -0.08 },
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    filters: [Konva.Filters.HSL, Konva.Filters.Contrast, Konva.Filters.Brighten],
    attrs: { hue: 25, saturation: 0.5, contrast: 28, brightness: -0.1 },
  },
  {
    id: 'lofi',
    label: 'Lo-Fi',
    filters: [Konva.Filters.HSL, Konva.Filters.Contrast],
    attrs: { saturation: -0.3, contrast: -15, hue: 5 },
  },
  {
    id: 'sunset',
    label: 'Gün Batımı',
    filters: [Konva.Filters.HSL, Konva.Filters.Brighten],
    attrs: { hue: 18, saturation: 0.2, brightness: 0.06 },
  },
  {
    id: 'mocha',
    label: 'Mocha',
    filters: [Konva.Filters.HSL, Konva.Filters.Brighten, Konva.Filters.Contrast],
    attrs: { hue: 15, saturation: -0.1, brightness: -0.02, contrast: 10 },
  },
  {
    id: 'coldsteel',
    label: 'Soğuk Çelik',
    filters: [Konva.Filters.HSL, Konva.Filters.Contrast],
    attrs: { hue: -25, saturation: -0.2, contrast: 18 },
  },
  {
    id: 'duotone-pink',
    label: 'İkili Pembe',
    filters: [Konva.Filters.Grayscale, Konva.Filters.HSL, Konva.Filters.Contrast],
    attrs: { hue: -20, saturation: 0.6, contrast: 15 },
  },
  {
    id: 'duotone-blue',
    label: 'İkili Mavi',
    filters: [Konva.Filters.Grayscale, Konva.Filters.HSL, Konva.Filters.Contrast],
    attrs: { hue: -120, saturation: 0.5, contrast: 12 },
  },
  {
    id: 'posterize',
    label: 'Poster',
    filters: [Konva.Filters.Posterize, Konva.Filters.HSL],
    attrs: { saturation: 0.2 },
  },
  {
    id: 'dream',
    label: 'Rüya',
    filters: [Konva.Filters.Blur, Konva.Filters.HSL, Konva.Filters.Brighten],
    attrs: { blurRadius: 2, saturation: -0.1, brightness: 0.1 },
  },
  {
    id: 'matte',
    label: 'Mat',
    filters: [Konva.Filters.HSL, Konva.Filters.Contrast],
    attrs: { saturation: -0.2, contrast: -8 },
  },
  {
    id: 'crisp',
    label: 'Keskin',
    filters: [Konva.Filters.Contrast, Konva.Filters.HSL, Konva.Filters.Enhance],
    attrs: { contrast: 18, saturation: 0.15, enhance: 0.4 },
  },
  {
    id: 'film-grain',
    label: 'Film Tanesi',
    filters: [Konva.Filters.Noise, Konva.Filters.HSL, Konva.Filters.Contrast],
    attrs: { saturation: -0.15, contrast: 8 },
  },
  {
    id: 'anime',
    label: 'Anime',
    filters: [Konva.Filters.Posterize, Konva.Filters.HSL, Konva.Filters.Contrast],
    attrs: { saturation: 0.3, contrast: 20 },
  },
]

export function getFilterById(id: FilterPreset): FilterDefinition {
  return FILTER_PRESETS.find((f) => f.id === id) ?? FILTER_PRESETS[0]
}

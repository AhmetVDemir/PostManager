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
]

export function getFilterById(id: FilterPreset): FilterDefinition {
  return FILTER_PRESETS.find((f) => f.id === id) ?? FILTER_PRESETS[0]
}

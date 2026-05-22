import type { FontMood } from '../types'

export interface FontOption {
  family: string
  weights: string
  category: string
}

export const FONTS_BY_MOOD: Record<FontMood, FontOption[]> = {
  modern: [
    { family: 'Inter', weights: '400;600;800', category: 'sans-serif' },
    { family: 'Poppins', weights: '400;600;800', category: 'sans-serif' },
    { family: 'Montserrat', weights: '400;700;900', category: 'sans-serif' },
    { family: 'Space Grotesk', weights: '400;700', category: 'sans-serif' },
    { family: 'DM Sans', weights: '400;700;900', category: 'sans-serif' },
  ],
  elegant: [
    { family: 'Playfair Display', weights: '400;700;900', category: 'serif' },
    { family: 'Cormorant Garamond', weights: '400;600;700', category: 'serif' },
    { family: 'Cormorant', weights: '400;700', category: 'serif' },
    { family: 'Lora', weights: '400;700', category: 'serif' },
    { family: 'Italiana', weights: '400', category: 'serif' },
  ],
  bold: [
    { family: 'Anton', weights: '400', category: 'sans-serif' },
    { family: 'Bebas Neue', weights: '400', category: 'sans-serif' },
    { family: 'Archivo Black', weights: '400', category: 'sans-serif' },
    { family: 'Oswald', weights: '400;700', category: 'sans-serif' },
    { family: 'Russo One', weights: '400', category: 'sans-serif' },
  ],
  vintage: [
    { family: 'Abril Fatface', weights: '400', category: 'display' },
    { family: 'Yeseva One', weights: '400', category: 'display' },
    { family: 'Limelight', weights: '400', category: 'display' },
    { family: 'Special Elite', weights: '400', category: 'monospace' },
    { family: 'IM Fell English', weights: '400', category: 'serif' },
  ],
  fun: [
    { family: 'Fredoka', weights: '400;600;700', category: 'sans-serif' },
    { family: 'Bungee', weights: '400', category: 'display' },
    { family: 'Lilita One', weights: '400', category: 'display' },
    { family: 'Chewy', weights: '400', category: 'display' },
    { family: 'Bowlby One', weights: '400', category: 'display' },
  ],
  handwritten: [
    { family: 'Caveat', weights: '400;700', category: 'handwriting' },
    { family: 'Pacifico', weights: '400', category: 'handwriting' },
    { family: 'Dancing Script', weights: '400;700', category: 'handwriting' },
    { family: 'Permanent Marker', weights: '400', category: 'handwriting' },
    { family: 'Shadows Into Light', weights: '400', category: 'handwriting' },
  ],
}

export const MOOD_LABELS: Record<FontMood, { label: string; desc: string; emoji: string }> = {
  modern: { label: 'Modern', desc: 'Temiz, sade, profesyonel', emoji: '◐' },
  elegant: { label: 'Zarif', desc: 'Klasik, lüks, şık', emoji: '◈' },
  bold: { label: 'Güçlü', desc: 'Kalın, dikkat çekici', emoji: '■' },
  vintage: { label: 'Retro', desc: 'Nostaljik, eski stil', emoji: '◉' },
  fun: { label: 'Eğlenceli', desc: 'Canlı, oyuncu', emoji: '◆' },
  handwritten: { label: 'El yazısı', desc: 'Sıcak, kişisel', emoji: '✎' },
}

const loadedFonts = new Set<string>()

export function loadGoogleFont(family: string, weights: string): Promise<void> {
  const key = `${family}:${weights}`
  if (loadedFonts.has(key)) return Promise.resolve()
  loadedFonts.add(key)

  const familyParam = family.replace(/\s+/g, '+')
  const href = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weights}&display=swap`

  return new Promise((resolve) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.onload = () => {
      // wait one tick so the font face is registered
      requestAnimationFrame(() => resolve())
    }
    link.onerror = () => resolve()
    document.head.appendChild(link)
  })
}

export async function loadAllMoodFonts(mood: FontMood): Promise<void> {
  const fonts = FONTS_BY_MOOD[mood]
  await Promise.all(fonts.map((f) => loadGoogleFont(f.family, f.weights)))
  if ('fonts' in document) {
    await Promise.all(
      fonts.map((f) => (document as Document).fonts.load(`16px "${f.family}"`)),
    )
  }
}

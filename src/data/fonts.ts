import type { FontMood } from '../types'

export interface FontOption {
  family: string
  weights: string
  category: string
}

/**
 * Mood → font ailesi eşlemesi.
 * Tüm fontlar Google Fonts'tan dinamik olarak yüklenir.
 * Türkçe karakter (ğ, ş, ç, ı, ö, ü) destekleyenler tercih edildi.
 */
export const FONTS_BY_MOOD: Record<FontMood, FontOption[]> = {
  modern: [
    { family: 'Inter', weights: '400;600;800', category: 'sans-serif' },
    { family: 'Poppins', weights: '400;600;800', category: 'sans-serif' },
    { family: 'Montserrat', weights: '400;700;900', category: 'sans-serif' },
    { family: 'Space Grotesk', weights: '400;700', category: 'sans-serif' },
    { family: 'DM Sans', weights: '400;700;900', category: 'sans-serif' },
    { family: 'Manrope', weights: '400;700;800', category: 'sans-serif' },
    { family: 'Plus Jakarta Sans', weights: '400;700;800', category: 'sans-serif' },
    { family: 'Lexend', weights: '400;700', category: 'sans-serif' },
  ],
  elegant: [
    { family: 'Playfair Display', weights: '400;700;900', category: 'serif' },
    { family: 'Cormorant Garamond', weights: '400;600;700', category: 'serif' },
    { family: 'Cormorant', weights: '400;700', category: 'serif' },
    { family: 'Lora', weights: '400;700', category: 'serif' },
    { family: 'Italiana', weights: '400', category: 'serif' },
    { family: 'EB Garamond', weights: '400;700', category: 'serif' },
    { family: 'Cardo', weights: '400;700', category: 'serif' },
    { family: 'Spectral', weights: '400;700;800', category: 'serif' },
  ],
  bold: [
    { family: 'Anton', weights: '400', category: 'sans-serif' },
    { family: 'Bebas Neue', weights: '400', category: 'sans-serif' },
    { family: 'Archivo Black', weights: '400', category: 'sans-serif' },
    { family: 'Oswald', weights: '400;700', category: 'sans-serif' },
    { family: 'Russo One', weights: '400', category: 'sans-serif' },
    { family: 'Squada One', weights: '400', category: 'sans-serif' },
    { family: 'Staatliches', weights: '400', category: 'sans-serif' },
    { family: 'Black Ops One', weights: '400', category: 'display' },
  ],
  vintage: [
    { family: 'Abril Fatface', weights: '400', category: 'display' },
    { family: 'Yeseva One', weights: '400', category: 'display' },
    { family: 'Limelight', weights: '400', category: 'display' },
    { family: 'Special Elite', weights: '400', category: 'monospace' },
    { family: 'IM Fell English', weights: '400', category: 'serif' },
    { family: 'Cinzel', weights: '400;700;900', category: 'serif' },
    { family: 'Ultra', weights: '400', category: 'display' },
    { family: 'Cherry Bomb One', weights: '400', category: 'display' },
  ],
  fun: [
    { family: 'Fredoka', weights: '400;600;700', category: 'sans-serif' },
    { family: 'Bungee', weights: '400', category: 'display' },
    { family: 'Lilita One', weights: '400', category: 'display' },
    { family: 'Chewy', weights: '400', category: 'display' },
    { family: 'Bowlby One', weights: '400', category: 'display' },
    { family: 'Luckiest Guy', weights: '400', category: 'display' },
    { family: 'Pangolin', weights: '400', category: 'handwriting' },
    { family: 'Mali', weights: '400;700', category: 'handwriting' },
  ],
  handwritten: [
    { family: 'Caveat', weights: '400;700', category: 'handwriting' },
    { family: 'Pacifico', weights: '400', category: 'handwriting' },
    { family: 'Dancing Script', weights: '400;700', category: 'handwriting' },
    { family: 'Permanent Marker', weights: '400', category: 'handwriting' },
    { family: 'Shadows Into Light', weights: '400', category: 'handwriting' },
    { family: 'Kalam', weights: '400;700', category: 'handwriting' },
    { family: 'Sacramento', weights: '400', category: 'handwriting' },
    { family: 'Indie Flower', weights: '400', category: 'handwriting' },
  ],
  tech: [
    { family: 'Orbitron', weights: '400;700;900', category: 'sans-serif' },
    { family: 'JetBrains Mono', weights: '400;700', category: 'monospace' },
    { family: 'Audiowide', weights: '400', category: 'display' },
    { family: 'Major Mono Display', weights: '400', category: 'monospace' },
    { family: 'Share Tech Mono', weights: '400', category: 'monospace' },
    { family: 'VT323', weights: '400', category: 'monospace' },
  ],
  calligraphy: [
    { family: 'Tangerine', weights: '400;700', category: 'handwriting' },
    { family: 'Great Vibes', weights: '400', category: 'handwriting' },
    { family: 'Allura', weights: '400', category: 'handwriting' },
    { family: 'Pinyon Script', weights: '400', category: 'handwriting' },
    { family: 'Sail', weights: '400', category: 'handwriting' },
    { family: 'Parisienne', weights: '400', category: 'handwriting' },
  ],
  decorative: [
    { family: 'Bungee Shade', weights: '400', category: 'display' },
    { family: 'Faster One', weights: '400', category: 'display' },
    { family: 'Monoton', weights: '400', category: 'display' },
    { family: 'Vast Shadow', weights: '400', category: 'display' },
    { family: 'Rubik Mono One', weights: '400', category: 'display' },
    { family: 'Bungee Outline', weights: '400', category: 'display' },
  ],
}

export const MOOD_LABELS: Record<FontMood, { label: string; desc: string; emoji: string }> = {
  modern: { label: 'Modern', desc: 'Temiz, sade, profesyonel', emoji: '◐' },
  elegant: { label: 'Zarif', desc: 'Klasik, lüks, şık', emoji: '◈' },
  bold: { label: 'Güçlü', desc: 'Kalın, dikkat çekici', emoji: '■' },
  vintage: { label: 'Retro', desc: 'Nostaljik, eski stil', emoji: '◉' },
  fun: { label: 'Eğlenceli', desc: 'Canlı, oyuncu', emoji: '◆' },
  handwritten: { label: 'El yazısı', desc: 'Sıcak, kişisel', emoji: '✎' },
  tech: { label: 'Tech', desc: 'Futuristik, mono, kod', emoji: '◇' },
  calligraphy: { label: 'Hat', desc: 'Süslü, akıcı', emoji: '✒' },
  decorative: { label: 'Dekoratif', desc: 'Gösterişli, sıra dışı', emoji: '✺' },
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

/**
 * Text içindeki [[...]] syntax'ini parse eder.
 * "Büyük [[gaflet]] içindesin" → [
 *   { text: 'Büyük ', highlighted: false },
 *   { text: 'gaflet',  highlighted: true  },
 *   { text: ' içindesin', highlighted: false },
 * ]
 */

export interface TextSegment {
  text: string
  highlighted: boolean
}

const HIGHLIGHT_RE = /\[\[([\s\S]+?)\]\]/g

export function parseLineSegments(line: string): TextSegment[] {
  const segments: TextSegment[] = []
  HIGHLIGHT_RE.lastIndex = 0
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = HIGHLIGHT_RE.exec(line)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ text: line.slice(lastIndex, m.index), highlighted: false })
    }
    segments.push({ text: m[1], highlighted: true })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex), highlighted: false })
  }
  if (segments.length === 0) {
    segments.push({ text: '', highlighted: false })
  }
  return segments
}

/** Tüm text'i \n ile satırlara böler, her satırı segment'lere ayırır. */
export function parseTextSegments(text: string): TextSegment[][] {
  return text.split('\n').map(parseLineSegments)
}

/** Bir text'in herhangi bir highlight içerip içermediğini söyler. */
export function hasHighlightSyntax(text: string): boolean {
  HIGHLIGHT_RE.lastIndex = 0
  return HIGHLIGHT_RE.test(text)
}

/**
 * Canvas measureText ile bir font/size için her segment'in piksel
 * genişliğini ölçer. Render'dan önce layout için çağrılır.
 */
export function measureSegmentWidths(
  segments: TextSegment[],
  fontFamily: string,
  fontSize: number,
): number[] {
  if (typeof document === 'undefined') return segments.map(() => 0)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return segments.map(() => 0)
  ctx.font = `${fontSize}px "${fontFamily}"`
  return segments.map((s) => ctx.measureText(s.text || ' ').width)
}

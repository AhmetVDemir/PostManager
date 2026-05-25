import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Stage, Layer as KLayer, Image as KImage, Rect, Text as KText, Group } from 'react-konva'
import type Konva from 'konva'
import type { Background, CanvasFormat, FilterState, Layer, TextLayer, EmojiLayer } from '../types'
import { CANVAS_DIMENSIONS } from '../types'
import { getFilterById } from '../data/filters'
import { parseTextSegments, measureSegmentWidths, wrapLineToMaxWidth } from '../utils/textSegments'

export interface ExportOptions {
  mimeType?: 'image/png' | 'image/jpeg'
  quality?: number // 0-1, only for jpeg
}

export interface PostCanvasHandle {
  exportPng: (opts?: ExportOptions) => Promise<Blob | null>
}

interface Props {
  background: Background
  format: CanvasFormat
  filter: FilterState
  layers: Layer[]
  selectedLayerId?: string | null
  onLayerMove?: (id: string, x: number, y: number) => void
  onLayerSelect?: (id: string | null) => void
  draggableLayers?: boolean
  maxDisplaySize?: number
}

function useHtmlImage(src: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!src) {
      setImg(null)
      return
    }
    const el = new window.Image()
    el.onload = () => setImg(el)
    el.src = src
  }, [src])
  return img
}

/** Verilen açıya göre canvas'ın iki köşesi arasında gradient noktaları üretir. */
function gradientPoints(angleDeg: number, w: number, h: number) {
  // angle: 0 = yukarıdan aşağı; 90 = soldan sağa; 180 = aşağıdan yukarı; 270 = sağdan sola
  const rad = ((angleDeg - 90) * Math.PI) / 180
  const cx = w / 2
  const cy = h / 2
  const half = Math.max(w, h) / 2
  return {
    start: { x: cx - Math.cos(rad) * half, y: cy - Math.sin(rad) * half },
    end: { x: cx + Math.cos(rad) * half, y: cy + Math.sin(rad) * half },
  }
}

export const PostCanvas = forwardRef<PostCanvasHandle, Props>(function PostCanvas(
  {
    background,
    format,
    filter,
    layers,
    selectedLayerId,
    onLayerMove,
    onLayerSelect,
    draggableLayers = false,
    maxDisplaySize = 520,
  },
  ref,
) {
  const stageRef = useRef<Konva.Stage>(null)
  const imageNodeRef = useRef<Konva.Image>(null)

  const dim = CANVAS_DIMENSIONS[format]
  const aspect = dim.width / dim.height

  const displayWidth = aspect >= 1 ? maxDisplaySize : Math.round(maxDisplaySize * aspect)
  const displayHeight = aspect >= 1 ? Math.round(maxDisplaySize / aspect) : maxDisplaySize
  const scale = displayWidth / dim.width

  const img = useHtmlImage(background.kind === 'image' ? background.imageDataUrl : null)

  // cover-fit image with zoom + pan transform
  // Semantics: offsetX = +1 → user sees the RIGHT side of the image
  //            offsetY = +1 → user sees the BOTTOM side
  const imageProps = useMemo(() => {
    if (!img) return null
    const baseS = Math.max(dim.width / img.naturalWidth, dim.height / img.naturalHeight)
    const s = baseS * (background.imageTransform?.zoom ?? 1)
    const w = img.naturalWidth * s
    const h = img.naturalHeight * s
    const extraW = w - dim.width
    const extraH = h - dim.height
    const ox = background.imageTransform?.offsetX ?? 0
    const oy = background.imageTransform?.offsetY ?? 0
    // Subtract so positive offset reveals the corresponding side of the image
    const cx = dim.width / 2 - (ox * extraW) / 2
    const cy = dim.height / 2 - (oy * extraH) / 2
    return {
      x: cx - w / 2,
      y: cy - h / 2,
      width: w,
      height: h,
    }
  }, [img, dim.width, dim.height, background.imageTransform])

  // gradient endpoints
  const gradient = useMemo(
    () => gradientPoints(background.gradient.angle, dim.width, dim.height),
    [background.gradient.angle, dim.width, dim.height],
  )

  // apply filter to image (only when image background is used)
  useEffect(() => {
    const node = imageNodeRef.current
    if (!node || !img) return
    if (!filter.enabled || filter.preset === 'none') {
      node.filters([])
      node.cache()
      node.getLayer()?.batchDraw()
      return
    }
    const def = getFilterById(filter.preset)
    node.filters(def.filters)
    node.brightness(def.attrs?.brightness ?? 0)
    node.contrast(def.attrs?.contrast ?? 0)
    node.saturation(def.attrs?.saturation ?? 0)
    node.hue(def.attrs?.hue ?? 0)
    node.cache()
    node.getLayer()?.batchDraw()
  }, [filter.enabled, filter.preset, img, imageProps])

  useImperativeHandle(
    ref,
    () => ({
      async exportPng(opts) {
        const stage = stageRef.current
        if (!stage) return null
        // Deselect briefly so selection rect doesn't appear in export
        const prevSel = selectedLayerId
        onLayerSelect?.(null)
        await new Promise((r) => setTimeout(r, 0))
        const mime = opts?.mimeType ?? 'image/png'
        const dataUrl = stage.toDataURL({
          mimeType: mime,
          quality: opts?.quality ?? 0.92,
          pixelRatio: 1 / scale,
        })
        // restore selection
        if (prevSel) onLayerSelect?.(prevSel)
        const res = await fetch(dataUrl)
        return res.blob()
      },
    }),
    [scale, selectedLayerId, onLayerSelect],
  )

  return (
    <div
      className="overflow-hidden rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/10"
      style={{ width: displayWidth, height: displayHeight, background: '#000' }}
    >
      <Stage
        ref={stageRef}
        width={displayWidth}
        height={displayHeight}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={(e) => {
          // Click on empty space → deselect
          if (e.target === e.target.getStage()) onLayerSelect?.(null)
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage()) onLayerSelect?.(null)
        }}
      >
        {/* Background layer */}
        <KLayer listening={false}>
          {background.kind === 'solid' && (
            <Rect x={0} y={0} width={dim.width} height={dim.height} fill={background.solidColor} />
          )}
          {background.kind === 'gradient' && (
            <Rect
              x={0}
              y={0}
              width={dim.width}
              height={dim.height}
              fillLinearGradientStartPoint={gradient.start}
              fillLinearGradientEndPoint={gradient.end}
              fillLinearGradientColorStops={[0, background.gradient.from, 1, background.gradient.to]}
            />
          )}
          {background.kind === 'image' && !img && (
            <Rect x={0} y={0} width={dim.width} height={dim.height} fill="#111" />
          )}
          {background.kind === 'image' && img && imageProps && (
            <KImage
              ref={imageNodeRef}
              image={img}
              x={imageProps.x}
              y={imageProps.y}
              width={imageProps.width}
              height={imageProps.height}
            />
          )}
        </KLayer>

        {/* Layers */}
        <KLayer>
          {layers.map((layer) => {
            if (layer.type === 'text') return <TextNode key={layer.id} layer={layer} canvasWidth={dim.width} canvasHeight={dim.height} selected={layer.id === selectedLayerId} draggable={draggableLayers} onMove={onLayerMove} onSelect={onLayerSelect} />
            if (layer.type === 'emoji') return <EmojiNode key={layer.id} layer={layer} selected={layer.id === selectedLayerId} draggable={draggableLayers} onMove={onLayerMove} onSelect={onLayerSelect} />
            return null
          })}
        </KLayer>
      </Stage>
    </div>
  )
})

// ============================================================================
// Text node — glow + shadow + stroke
// ============================================================================
interface NodeCallbacks {
  selected: boolean
  draggable: boolean
  onMove?: (id: string, x: number, y: number) => void
  onSelect?: (id: string | null) => void
}

function TextNode({
  layer: t,
  selected,
  draggable,
  onMove,
  onSelect,
  canvasWidth,
  canvasHeight,
}: { layer: TextLayer; canvasWidth: number; canvasHeight: number } & NodeCallbacks) {
  // Parse [[highlighted]] syntax + manual \n
  const rawLines = useMemo(() => parseTextSegments(t.text || ' '), [t.text])

  // If maxWidth is set, word-wrap each line into multiple lines that fit
  const lines = useMemo(() => {
    if (!t.maxWidth || t.maxWidth <= 0) return rawLines
    const out: typeof rawLines = []
    for (const line of rawLines) {
      const wrapped = wrapLineToMaxWidth(line, t.maxWidth, t.fontFamily, t.fontSize)
      out.push(...wrapped)
    }
    return out
  }, [rawLines, t.maxWidth, t.fontFamily, t.fontSize])

  // Measure each segment's width via canvas measureText (sync, fast)
  const widthsPerLine = useMemo(
    () => lines.map((segs) => measureSegmentWidths(segs, t.fontFamily, t.fontSize)),
    [lines, t.fontFamily, t.fontSize],
  )

  const lineWidths = useMemo(
    () => widthsPerLine.map((ws) => ws.reduce((a, b) => a + b, 0)),
    [widthsPerLine],
  )
  const maxLineWidth = Math.max(1, ...lineWidths)
  const lineHeightPx = t.fontSize * t.lineHeight
  const totalHeight = lines.length * lineHeightPx
  const halfW = maxLineWidth / 2
  const halfH = totalHeight / 2

  const padX = t.bg ? t.bgPaddingX : 0
  const padY = t.bg ? t.bgPaddingY : 0

  // Auto-fit: shrink the whole group if the text bounding box (incl.
  // padding) wouldn't fit within ~92% of the canvas. Keeps user-set
  // fontSize visually consistent without forcing wrap or manual resize.
  const safeW = canvasWidth * 0.92
  const safeH = canvasHeight * 0.92
  const contentW = maxLineWidth + padX * 2
  const contentH = totalHeight + padY * 2
  const fitScale = Math.min(1, safeW / Math.max(contentW, 1), safeH / Math.max(contentH, 1))

  // Build a flat list of segment nodes with their absolute positions inside the group
  const segmentNodes = useMemo(() => {
    const out: Array<{
      key: string
      x: number
      y: number
      w: number
      text: string
      highlighted: boolean
    }> = []
    let y = -halfH
    for (let li = 0; li < lines.length; li++) {
      const segs = lines[li]
      const widths = widthsPerLine[li]
      const lineW = lineWidths[li]
      let x: number
      if (t.align === 'left') x = -halfW
      else if (t.align === 'right') x = halfW - lineW
      else x = -lineW / 2
      for (let si = 0; si < segs.length; si++) {
        const seg = segs[si]
        const w = widths[si]
        out.push({ key: `${li}-${si}`, x, y, w, text: seg.text, highlighted: seg.highlighted })
        x += w
      }
      y += lineHeightPx
    }
    return out
  }, [lines, widthsPerLine, lineWidths, halfW, halfH, lineHeightPx, t.align])

  const highlightSegPadX = 8
  const highlightSegPadY = 2

  return (
    <Group
      x={t.x}
      y={t.y}
      rotation={t.rotation}
      scaleX={fitScale}
      scaleY={fitScale}
      draggable={draggable}
      onClick={() => onSelect?.(t.id)}
      onTap={() => onSelect?.(t.id)}
      onDragStart={() => onSelect?.(t.id)}
      onDragMove={(e) => onMove?.(t.id, e.target.x(), e.target.y())}
    >
      {/* Main background plate (entire bbox) */}
      {t.bg && (
        <Rect
          x={-halfW - padX}
          y={-halfH - padY}
          width={maxLineWidth + padX * 2}
          height={totalHeight + padY * 2}
          fill={t.bgColor}
          opacity={t.bgOpacity}
          cornerRadius={t.bgRadius}
          listening={false}
        />
      )}

      {/* Per-segment highlight backgrounds */}
      {segmentNodes
        .filter((n) => n.highlighted && n.w > 0)
        .map((n) => (
          <Rect
            key={`h-${n.key}`}
            x={n.x - highlightSegPadX}
            y={n.y + (lineHeightPx - t.fontSize) / 2 - highlightSegPadY}
            width={n.w + highlightSegPadX * 2}
            height={t.fontSize + highlightSegPadY * 2}
            fill={t.highlightBg}
            opacity={t.highlightBgOpacity}
            cornerRadius={2}
            listening={false}
          />
        ))}

      {/* Glow text per segment (under main text, transparent fill for halo) */}
      {t.glow &&
        segmentNodes.map((n) => (
          <KText
            key={`g-${n.key}`}
            text={n.text}
            x={n.x}
            y={n.y + (lineHeightPx - t.fontSize) / 2}
            fontFamily={t.fontFamily}
            fontSize={t.fontSize}
            fill={t.glowColor}
            listening={false}
            shadowEnabled
            shadowColor={t.glowColor}
            shadowBlur={t.glowBlur}
            shadowOffsetX={0}
            shadowOffsetY={0}
            shadowOpacity={t.glowOpacity}
          />
        ))}

      {/* Main text per segment */}
      {segmentNodes.map((n) => (
        <KText
          key={`m-${n.key}`}
          text={n.text}
          x={n.x}
          y={n.y + (lineHeightPx - t.fontSize) / 2}
          fontFamily={t.fontFamily}
          fontSize={t.fontSize}
          fill={
            n.highlighted && t.highlightTextColor
              ? t.highlightTextColor
              : t.color
          }
          stroke={t.stroke ? t.strokeColor : undefined}
          strokeWidth={t.stroke ? t.strokeWidth : 0}
          fillAfterStrokeEnabled
          lineJoin="round"
          shadowEnabled={t.shadow}
          shadowColor={t.shadowColor}
          shadowBlur={t.shadowBlur}
          shadowOffsetX={t.shadowOffsetX}
          shadowOffsetY={t.shadowOffsetY}
          shadowOpacity={t.shadow ? t.shadowOpacity : 0}
        />
      ))}

      {/* Selection outline */}
      {selected && (
        <Rect
          x={-halfW - padX - 4}
          y={-halfH - padY - 4}
          width={maxLineWidth + padX * 2 + 8}
          height={totalHeight + padY * 2 + 8}
          stroke="#6366f1"
          strokeWidth={3}
          dash={[12, 8]}
          listening={false}
        />
      )}
    </Group>
  )
}

// ============================================================================
// Emoji node
// ============================================================================
function EmojiNode({ layer: e, selected, draggable, onMove, onSelect }: { layer: EmojiLayer } & NodeCallbacks) {
  return (
    <>
      <KText
        text={e.emoji}
        x={e.x}
        y={e.y}
        fontFamily='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'
        fontSize={e.size}
        rotation={e.rotation}
        draggable={draggable}
        onClick={() => onSelect?.(e.id)}
        onTap={() => onSelect?.(e.id)}
        onDragStart={() => onSelect?.(e.id)}
        onDragMove={(ev) => onMove?.(e.id, ev.target.x(), ev.target.y())}
        ref={(node) => {
          if (node) {
            node.offsetX(node.width() / 2)
            node.offsetY(node.height() / 2)
          }
        }}
      />
      {selected && (
        <SelectionFrame
          x={e.x}
          y={e.y}
          rotation={e.rotation}
          getBBox={() => ({ w: e.size * 1.15, h: e.size * 1.15 })}
        />
      )}
    </>
  )
}

// ============================================================================
// Selection frame
// ============================================================================
function SelectionFrame({ x, y, rotation, getBBox }: { x: number; y: number; rotation: number; getBBox: () => { w: number; h: number } }) {
  const { w, h } = getBBox()
  return (
    <Rect
      x={x}
      y={y}
      offsetX={w / 2}
      offsetY={h / 2}
      width={w}
      height={h}
      rotation={rotation}
      stroke="#6366f1"
      strokeWidth={3}
      dash={[12, 8]}
      listening={false}
    />
  )
}

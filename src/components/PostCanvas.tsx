import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Image as KImage, Text as KText } from 'react-konva'
import type Konva from 'konva'
import type { CanvasFormat, FilterPreset, TextLayer } from '../types'
import { CANVAS_DIMENSIONS } from '../types'
import { getFilterById } from '../data/filters'

export interface PostCanvasHandle {
  exportPng: () => Promise<Blob | null>
}

interface Props {
  imageDataUrl: string
  format: CanvasFormat
  filter: FilterPreset
  text: TextLayer | null
  onTextDrag?: (x: number, y: number) => void
  draggableText?: boolean
  maxDisplaySize?: number
}

function useHtmlImage(src: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    const el = new window.Image()
    el.onload = () => setImg(el)
    el.src = src
  }, [src])
  return img
}

export const PostCanvas = forwardRef<PostCanvasHandle, Props>(function PostCanvas(
  { imageDataUrl, format, filter, text, onTextDrag, draggableText = false, maxDisplaySize = 520 },
  ref,
) {
  const stageRef = useRef<Konva.Stage>(null)
  const imageNodeRef = useRef<Konva.Image>(null)

  const dim = CANVAS_DIMENSIONS[format]
  const aspect = dim.width / dim.height

  const displayWidth = aspect >= 1 ? maxDisplaySize : Math.round(maxDisplaySize * aspect)
  const displayHeight = aspect >= 1 ? Math.round(maxDisplaySize / aspect) : maxDisplaySize
  const scale = displayWidth / dim.width

  const img = useHtmlImage(imageDataUrl)

  // cover-fit image inside canvas
  const imageProps = useMemo(() => {
    if (!img) return null
    const s = Math.max(dim.width / img.naturalWidth, dim.height / img.naturalHeight)
    const w = img.naturalWidth * s
    const h = img.naturalHeight * s
    return {
      x: (dim.width - w) / 2,
      y: (dim.height - h) / 2,
      width: w,
      height: h,
    }
  }, [img, dim.width, dim.height])

  // apply filter
  useEffect(() => {
    const node = imageNodeRef.current
    if (!node || !img) return
    const def = getFilterById(filter)
    node.filters(def.filters)
    node.brightness(def.attrs?.brightness ?? 0)
    node.contrast(def.attrs?.contrast ?? 0)
    node.saturation(def.attrs?.saturation ?? 0)
    node.hue(def.attrs?.hue ?? 0)
    node.cache()
    node.getLayer()?.batchDraw()
  }, [filter, img, imageProps])

  useImperativeHandle(
    ref,
    () => ({
      async exportPng() {
        const stage = stageRef.current
        if (!stage) return null
        // pixelRatio compensates for display scale so we always export at natural size
        const dataUrl = stage.toDataURL({
          mimeType: 'image/png',
          pixelRatio: 1 / scale,
        })
        const res = await fetch(dataUrl)
        return res.blob()
      },
    }),
    [scale],
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
      >
        <Layer>
          {img && imageProps && (
            <KImage
              ref={imageNodeRef}
              image={img}
              x={imageProps.x}
              y={imageProps.y}
              width={imageProps.width}
              height={imageProps.height}
              listening={false}
            />
          )}
        </Layer>
        <Layer>
          {text && text.text && text.glow && (
            <KText
              text={text.text}
              x={text.x}
              y={text.y}
              fontFamily={text.fontFamily}
              fontSize={text.fontSize}
              fill={text.glowColor}
              align={text.align}
              rotation={text.rotation}
              listening={false}
              shadowEnabled
              shadowColor={text.glowColor}
              shadowBlur={text.glowBlur}
              shadowOffsetX={0}
              shadowOffsetY={0}
              shadowOpacity={text.glowOpacity}
              ref={(node) => {
                if (node) {
                  node.offsetX(node.width() / 2)
                  node.offsetY(node.height() / 2)
                }
              }}
            />
          )}
          {text && text.text && (
            <KText
              text={text.text}
              x={text.x}
              y={text.y}
              fontFamily={text.fontFamily}
              fontSize={text.fontSize}
              fill={text.color}
              align={text.align}
              rotation={text.rotation}
              draggable={draggableText}
              shadowEnabled={text.shadow}
              shadowColor={text.shadowColor}
              shadowBlur={text.shadowBlur}
              shadowOffsetX={text.shadowOffsetX}
              shadowOffsetY={text.shadowOffsetY}
              shadowOpacity={text.shadow ? text.shadowOpacity : 0}
              onDragMove={(e) => {
                onTextDrag?.(e.target.x(), e.target.y())
              }}
              ref={(node) => {
                if (node) {
                  node.offsetX(node.width() / 2)
                  node.offsetY(node.height() / 2)
                }
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  )
})

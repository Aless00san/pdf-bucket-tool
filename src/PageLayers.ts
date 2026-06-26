import type { FloodFillOptions, FillColor, RGBAColor, FillResult } from './types'
import { floodFill } from './FloodFill'
import { parseFillColor } from './utils/color'

export class PageLayers {
  readonly width: number
  readonly height: number
  private baseData: ImageData
  private overlayCanvas: HTMLCanvasElement
  private overlayCtx: CanvasRenderingContext2D

  constructor(baseImageData: ImageData) {
    this.baseData = baseImageData
    this.width = baseImageData.width
    this.height = baseImageData.height

    this.overlayCanvas = document.createElement('canvas')
    this.overlayCanvas.width = this.width
    this.overlayCanvas.height = this.height
    this.overlayCtx = this.overlayCanvas.getContext('2d')!
    this.clearOverlay()
  }

  floodFill(x: number, y: number, color: FillColor, options: FloodFillOptions = {}): FillResult {
    const fillColor = parseFillColor(color)
    const overlayData = this.overlayCtx.getImageData(0, 0, this.width, this.height)

    const result = floodFill(this.baseData, overlayData, x, y, fillColor, options)

    this.overlayCtx.putImageData(overlayData, 0, 0)
    return result
  }

  clearOverlay(): void {
    this.overlayCtx.clearRect(0, 0, this.width, this.height)
  }

  getCompositeCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = this.width
    canvas.height = this.height
    const ctx = canvas.getContext('2d')!

    ctx.putImageData(this.baseData, 0, 0)
    ctx.drawImage(this.overlayCanvas, 0, 0)

    return canvas
  }

  getCompositeImageData(): ImageData {
    const canvas = this.getCompositeCanvas()
    return canvas.getContext('2d')!.getImageData(0, 0, this.width, this.height)
  }

  getOverlayCanvas(): HTMLCanvasElement {
    return this.overlayCanvas
  }
}

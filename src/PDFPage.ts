import type { PDFPageProxy } from 'pdfjs-dist'
import type { PageDimensions, TextItem } from './types'

export class PDFPage {
  private proxy: PDFPageProxy
  readonly dimensions: PageDimensions

  constructor(proxy: PDFPageProxy) {
    this.proxy = proxy
    const viewport = proxy.getViewport({ scale: 1 })
    this.dimensions = {
      width: viewport.width,
      height: viewport.height,
    }
  }

  async renderToCanvas({ scale = 2 }: { scale?: number } = {}): Promise<HTMLCanvasElement> {
    const viewport = this.proxy.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await this.proxy.render({ canvasContext: ctx, viewport }).promise

    return canvas
  }

  async getTextContent(): Promise<TextItem[]> {
    const content = await this.proxy.getTextContent()
    const viewport = this.proxy.getViewport({ scale: 1 })

    const items: TextItem[] = []

    for (const item of content.items) {
      if ('str' in item) {
        const [a, b, c, d, e, f] = item.transform
        const fontSize = Math.sqrt(a * a + b * b)
        items.push({
          str: item.str,
          x: e,
          y: viewport.height - f,
          width: item.width,
          height: item.height,
          fontSize,
          fontName: item.fontName,
        })
      }
    }

    return items
  }

  destroy(): void {
    this.proxy.cleanup()
  }
}

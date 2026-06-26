import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { PDFSource, PDFDocumentOptions } from './types'
import { PDFPage } from './PDFPage'

export class PDFDocument {
  readonly numPages: number
  readonly pages: PDFPage[]
  private proxy: PDFDocumentProxy

  private constructor(proxy: PDFDocumentProxy, pages: PDFPage[]) {
    this.proxy = proxy
    this.pages = pages
    this.numPages = pages.length
  }

  static async load(source: PDFSource, options: PDFDocumentOptions = {}): Promise<PDFDocument> {
    const doc = await pdfjsLib.getDocument(source as any).promise
    const pageCount = doc.numPages
    const pages: PDFPage[] = []

    for (let i = 1; i <= pageCount; i++) {
      const pageProxy = await doc.getPage(i)
      pages.push(new PDFPage(pageProxy))
    }

    return new PDFDocument(doc, pages)
  }

  destroy(): void {
    this.proxy.destroy()
  }
}

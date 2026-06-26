import { jsPDF } from 'jspdf'
import type { ExportOptions, TextItem, PageDimensions } from './types'
import type { PDFPage } from './PDFPage'
import type { PageLayers } from './PageLayers'

const PT_TO_MM = 25.4 / 72

export async function exportPDF(
  pages: PDFPage[],
  layers: PageLayers[],
  options: ExportOptions = {},
): Promise<Uint8Array> {
  const format = options.imageFormat ?? 'image/png'
  const quality = options.imageQuality ?? 0.92

  if (pages.length === 0) return new Uint8Array(0)

  const firstPage = pages[0]
  const dims: PageDimensions = firstPage.dimensions

  const pdf = new jsPDF({
    orientation: dims.width > dims.height ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [dims.width, dims.height],
  })

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      const pd = pages[i].dimensions
      pdf.addPage([pd.width, pd.height], pd.width > pd.height ? 'landscape' : 'portrait')
    }

    const compositeCanvas = layers[i].getCompositeCanvas()
    const imgData = compositeCanvas.toDataURL(format, quality)

    const pd = pages[i].dimensions
    pdf.addImage(imgData, format === 'image/jpeg' ? 'JPEG' : 'PNG', 0, 0, pd.width, pd.height)

    const textItems = await pages[i].getTextContent()

    pdf.setFont('Helvetica', 'normal')

    for (const item of textItems) {
      pdf.setFontSize(item.fontSize)
      pdf.text(item.str, item.x, item.y, {
        renderingMode: 'invisible',
      })
    }
  }

  return new Uint8Array(pdf.output('arraybuffer'))
}

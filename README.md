# pdf-bucket-tool

Pixel-based flood fill (paint bucket) editing for PDFs with non-destructive overlay layers and hybrid PDF export that preserves text selectability.

## Installation

```bash
npm install pdf-bucket-tool
# or
pnpm add pdf-bucket-tool
```

## Quick Start

```ts
import { PDFDocument, PageLayers, exportPDF } from 'pdf-bucket-tool'

// Load a PDF from URL, ArrayBuffer, File, or Blob
const doc = await PDFDocument.load('https://example.com/coloring-book.pdf')

// Render a page to canvas (browser only — requires HTMLCanvasElement)
const page = doc.pages[0]
const canvas = await page.renderToCanvas({ scale: 2 })

// Create layers for flood-fill editing
const layers = new PageLayers(canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height))

// Flood fill at (x, y) with a color
layers.floodFill(100, 200, '#FF0000', { tolerance: 16 })
layers.floodFill(300, 400, { r: 0, g: 0, b: 255, a: 255 }, { tolerance: 32 })

// Export a hybrid PDF with preserved text layer
const pdfBytes = await exportPDF(doc.pages, [layers])
const blob = new Blob([pdfBytes], { type: 'application/pdf' })
```

## API Overview

### `PDFDocument.load(source, options?)`

Load a PDF from a `string` (URL), `ArrayBuffer`, `Blob`, `File`, or `Uint8Array`. Returns a `PDFDocument` with its pages.

### `PDFPage.renderToCanvas({ scale? })`

Render a page to an `HTMLCanvasElement`. The scale defaults to 2 for good coloring-book quality.

### `PageLayers`

Manages a non-destructive overlay canvas on top of a rendered page.

| Method | Description |
|---|---|
| `floodFill(x, y, color, options?)` | Apply flood fill at (x, y) with tolerance |
| `clearOverlay()` | Clear all fills |
| `getCompositeCanvas()` | Get base + overlay composited as a canvas |
| `getOverlayCanvas()` | Get the overlay canvas directly |

### `floodFill(srcData, dstData, x, y, color, options?)`

Low-level scanline flood fill operating on `RGBAData` objects. Configurable tolerance (0–255, default 16) and fill alpha.

### `exportPDF(pages, layers, options?)`

Export a hybrid PDF preserving text as a selectable layer underneath the composited page image. Returns a `Uint8Array`.

## Browser Requirements

This library requires the **Canvas API** (`HTMLCanvasElement`) which is only available in browsers. Node.js usage is limited to:

- Loading PDFs and reading metadata
- Extracting text content

Flood fill and PDF export require a DOM environment or a canvas shim (e.g. `node-canvas`).

### pdf.js Worker

You must set the pdf.js worker source before loading a PDF:

```ts
import { GlobalWorkerOptions } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.mjs'
// Or point to your local copy:
// GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
```

## API

### Types

```ts
type PDFSource = string | ArrayBuffer | Blob | File | Uint8Array

interface PDFDocumentOptions {
  scale?: number    // default: 2
  password?: string
}

interface FloodFillOptions {
  tolerance?: number  // 0–255, default: 16
  fillAlpha?: number  // 0–1, default: 1
}

type FillColor = string | RGBAColor | [number, number, number, number]

interface RGBAColor { r: number; g: number; b: number; a: number }

interface ExportOptions {
  imageFormat?: 'image/png' | 'image/jpeg'
  imageQuality?: number  // 0–1, default: 0.92
}
```

## License

MIT

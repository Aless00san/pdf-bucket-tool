export type PDFSource = string | ArrayBuffer | Blob | File | Uint8Array

export interface PDFDocumentOptions {
  /** Rendering scale factor (default 2 — good for coloring book quality) */
  scale?: number
  /** PDF password */
  password?: string
}

export interface FloodFillOptions {
  /**
   * Color matching tolerance (0–255).
   * Higher values fill a wider range of similar colors.
   * Default: 16
   */
  tolerance?: number
  /** Fill opacity (0–1). Default: 1 */
  fillAlpha?: number
}

export interface RGBAColor {
  r: number
  g: number
  b: number
  a: number
}

export type FillColor = string | RGBAColor | [number, number, number, number]

export interface PageDimensions {
  /** Width in PDF points (1/72 inch) */
  width: number
  /** Height in PDF points */
  height: number
}

export interface TextItem {
  str: string
  /** X position in PDF points (from bottom-left) */
  x: number
  /** Y position in PDF points (from bottom-left) */
  y: number
  /** Width in PDF points */
  width: number
  /** Height in PDF points */
  height: number
  /** Font size in PDF points */
  fontSize: number
  /** Font name */
  fontName: string
}

export interface ExportOptions {
  /** Image format for the composited page layer */
  imageFormat?: 'image/png' | 'image/jpeg'
  /** JPEG quality (0–1), only used when format is JPEG */
  imageQuality?: number
}

export interface RGBAData {
  data: Uint8ClampedArray
  width: number
  height: number
}

export interface FillResult {
  /** Number of pixels that were filled */
  pixelsFilled: number
}

export interface MagnifierOptions {
  /** Diameter of the magnifier loupe in CSS pixels (default: 150) */
  size?: number
  /** Magnification factor (default: 3) */
  zoom?: number
}

import type { RGBAColor, FillColor } from '../types'

export function parseFillColor(color: FillColor): RGBAColor {
  if (typeof color === 'string') {
    return parseCSSColor(color)
  }
  if (Array.isArray(color)) {
    return { r: color[0], g: color[1], b: color[2], a: color[3] }
  }
  return color as RGBAColor
}

function parseCSSColor(color: string): RGBAColor {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return { r, g, b, a }
}

export function colorsMatch(a: RGBAColor, b: RGBAColor, tolerance: number): boolean {
  return (
    Math.abs(a.r - b.r) <= tolerance &&
    Math.abs(a.g - b.g) <= tolerance &&
    Math.abs(a.b - b.b) <= tolerance &&
    Math.abs(a.a - b.a) <= tolerance
  )
}

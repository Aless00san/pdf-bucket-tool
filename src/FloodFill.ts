import type { FloodFillOptions, RGBAColor, FillResult, RGBAData } from './types'
import { colorsMatch } from './utils/color'

export function floodFill(
  srcData: RGBAData,
  dstData: RGBAData,
  x: number,
  y: number,
  fillColor: RGBAColor,
  options: FloodFillOptions = {},
): FillResult {
  const tolerance = options.tolerance ?? 16
  const fillAlpha = options.fillAlpha ?? 1
  const fillWithAlpha: RGBAColor = {
    ...fillColor,
    a: Math.round((fillColor.a ?? 255) * fillAlpha),
  }

  const { data: src, width, height } = srcData
  const { data: dst } = dstData

  const idx = (y * width + x) * 4
  const sourceColor: RGBAColor = {
    r: src[idx],
    g: src[idx + 1],
    b: src[idx + 2],
    a: src[idx + 3],
  }

  if (colorsMatch(sourceColor, fillWithAlpha, tolerance)) {
    return { pixelsFilled: 0 }
  }

  const visited = new Uint8Array(width * height)
  const stack: number[] = [x, y]
  let filled = 0

  function readSrc(px: number, py: number): RGBAColor {
    const pi = (py * width + px) * 4
    return { r: src[pi], g: src[pi + 1], b: src[pi + 2], a: src[pi + 3] }
  }

  while (stack.length > 0) {
    const sy = stack.pop()!
    const sx = stack.pop()!

    if (visited[sy * width + sx]) continue
    visited[sy * width + sx] = 1

    let left = sx - 1
    while (left >= 0) {
      if (visited[sy * width + left]) break
      if (!colorsMatch(readSrc(left, sy), sourceColor, tolerance)) break
      visited[sy * width + left] = 1
      left--
    }
    left++

    let right = sx + 1
    while (right < width) {
      if (visited[sy * width + right]) break
      if (!colorsMatch(readSrc(right, sy), sourceColor, tolerance)) break
      visited[sy * width + right] = 1
      right++
    }
    right--

    for (let cx = left; cx <= right; cx++) {
      const pi = (sy * width + cx) * 4
      dst[pi] = fillWithAlpha.r
      dst[pi + 1] = fillWithAlpha.g
      dst[pi + 2] = fillWithAlpha.b
      dst[pi + 3] = fillWithAlpha.a
      filled++
    }

    if (sy > 0) {
      let inSpan = false
      for (let cx = left; cx <= right; cx++) {
        const match = !visited[(sy - 1) * width + cx] && colorsMatch(readSrc(cx, sy - 1), sourceColor, tolerance)
        if (match && !inSpan) stack.push(cx, sy - 1)
        inSpan = match
      }
    }

    if (sy < height - 1) {
      let inSpan = false
      for (let cx = left; cx <= right; cx++) {
        const match = !visited[(sy + 1) * width + cx] && colorsMatch(readSrc(cx, sy + 1), sourceColor, tolerance)
        if (match && !inSpan) stack.push(cx, sy + 1)
        inSpan = match
      }
    }
  }

  return { pixelsFilled: filled }
}

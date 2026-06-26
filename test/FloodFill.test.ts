import { describe, it, expect } from 'vitest'
import { floodFill } from '../src/FloodFill'

function createRGBAData(width: number, height: number, fill: (data: Uint8ClampedArray) => void) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255
    data[i + 1] = 255
    data[i + 2] = 255
    data[i + 3] = 255
  }
  fill(data)
  return { data, width, height }
}

function getPixel(data: Uint8ClampedArray, width: number, x: number, y: number) {
  const i = (y * width + x) * 4
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] }
}

describe('floodFill', () => {
  it('fills a contiguous region', () => {
    const src = createRGBAData(10, 10, (data) => {
      for (let y = 3; y <= 6; y++) {
        for (let x = 3; x <= 6; x++) {
          const i = (y * 10 + x) * 4
          data[i] = 255
          data[i + 1] = 0
          data[i + 2] = 0
          data[i + 3] = 255
        }
      }
    })

    const dst = { data: new Uint8ClampedArray(10 * 10 * 4), width: 10, height: 10 }

    const result = floodFill(src, dst, 4, 4, { r: 0, g: 0, b: 255, a: 255 }, { tolerance: 0 })

    expect(result.pixelsFilled).toBe(16)

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const p = getPixel(dst.data, 10, x, y)
        const inBlock = x >= 3 && x <= 6 && y >= 3 && y <= 6
        if (inBlock) {
          expect(p.r).toBe(0)
          expect(p.g).toBe(0)
          expect(p.b).toBe(255)
          expect(p.a).toBe(255)
        } else {
          expect(p.a).toBe(0)
        }
      }
    }
  })

  it('returns 0 if fill color matches source', () => {
    const src = createRGBAData(5, 5, (data) => {
      const i = (2 * 5 + 2) * 4
      data[i] = 255; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255
    })
    const dst = { data: new Uint8ClampedArray(5 * 5 * 4), width: 5, height: 5 }

    const result = floodFill(src, dst, 2, 2, { r: 255, g: 0, b: 0, a: 255 }, { tolerance: 0 })
    expect(result.pixelsFilled).toBe(0)
  })

  it('fills entire canvas when source is uniform', () => {
    const src = createRGBAData(5, 5, () => {})
    const dst = { data: new Uint8ClampedArray(5 * 5 * 4), width: 5, height: 5 }

    const result = floodFill(src, dst, 0, 0, { r: 0, g: 0, b: 0, a: 255 }, { tolerance: 0 })
    expect(result.pixelsFilled).toBe(25)
  })

  it('respects tolerance when matching colors', () => {
    const src = createRGBAData(5, 5, (data) => {
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const i = (y * 5 + x) * 4
          data[i] = 200
          data[i + 1] = 0
          data[i + 2] = 0
          data[i + 3] = 255
        }
      }
      const i = (2 * 5 + 2) * 4
      data[i] = 50; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255
    })

    const dst = { data: new Uint8ClampedArray(5 * 5 * 4), width: 5, height: 5 }

    const result1 = floodFill(src, dst, 2, 2, { r: 0, g: 255, b: 0, a: 255 }, { tolerance: 0 })
    expect(result1.pixelsFilled).toBe(1)

    const dst2 = { data: new Uint8ClampedArray(5 * 5 * 4), width: 5, height: 5 }

    const result2 = floodFill(src, dst2, 2, 2, { r: 0, g: 255, b: 0, a: 255 }, { tolerance: 200 })
    expect(result2.pixelsFilled).toBe(25)
  })

  it('does not cross color boundaries', () => {
    const src = createRGBAData(10, 10, (data) => {
      for (let y = 3; y <= 6; y++) {
        for (let x = 3; x <= 6; x++) {
          const i = (y * 10 + x) * 4
          data[i] = 255; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255
        }
      }
    })

    const dst = { data: new Uint8ClampedArray(10 * 10 * 4), width: 10, height: 10 }

    const result = floodFill(src, dst, 3, 3, { r: 0, g: 0, b: 255, a: 255 }, { tolerance: 0 })
    expect(result.pixelsFilled).toBe(16)

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const inBlock = x >= 3 && x <= 6 && y >= 3 && y <= 6
        if (!inBlock) {
          const p = getPixel(dst.data, 10, x, y)
          expect(p.a).toBe(0)
        }
      }
    }
  })
})

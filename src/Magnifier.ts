import type { MagnifierOptions } from './types'

export class Magnifier {
  private el: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private source: HTMLCanvasElement | null = null
  private _enabled = false
  private _zoom: number
  private _size: number
  private lastClientX = 0
  private lastClientY = 0
  private mounted = false

  constructor(opts: MagnifierOptions = {}) {
    this._zoom = opts.zoom ?? 3
    this._size = opts.size ?? 150

    this.canvas = document.createElement('canvas')
    this.canvas.width = this._size
    this.canvas.height = this._size
    this.canvas.style.display = 'block'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'

    this.ctx = this.canvas.getContext('2d')!

    this.el = document.createElement('div')
    this.el.style.position = 'fixed'
    this.el.style.pointerEvents = 'none'
    this.el.style.zIndex = '99999'
    this.el.style.borderRadius = '50%'
    this.el.style.overflow = 'hidden'
    this.el.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.9), 0 2px 12px rgba(0,0,0,0.4)'
    this.el.style.width = `${this._size}px`
    this.el.style.height = `${this._size}px`
    this.el.style.display = 'none'
    this.el.appendChild(this.canvas)
  }

  get enabled(): boolean {
    return this._enabled
  }

  set enabled(v: boolean) {
    this._enabled = v
    if (!v) this.hide()
  }

  get zoom(): number {
    return this._zoom
  }

  set zoom(v: number) {
    this._zoom = Math.max(1, v)
  }

  attachTo(source: HTMLCanvasElement | null): void {
    this.source = source
  }

  update(e: MouseEvent): void {
    this.lastClientX = e.clientX
    this.lastClientY = e.clientY
    if (!this._enabled || !this.source) return

    this.show()
    this.el.style.left = `${e.clientX - this._size / 2}px`
    this.el.style.top = `${e.clientY - this._size / 2}px`

    const rect = this.source.getBoundingClientRect()
    const scaleX = this.source.width / rect.width
    const scaleY = this.source.height / rect.height
    const cx = Math.round((e.clientX - rect.left) * scaleX)
    const cy = Math.round((e.clientY - rect.top) * scaleY)

    this.drawAt(cx, cy)
  }

  refresh(): void {
    if (!this._enabled || !this.source) return
    this.show()

    const rect = this.source.getBoundingClientRect()
    const scaleX = this.source.width / rect.width
    const scaleY = this.source.height / rect.height
    const cx = Math.round((this.lastClientX - rect.left) * scaleX)
    const cy = Math.round((this.lastClientY - rect.top) * scaleY)

    this.drawAt(cx, cy)
  }

  show(): void {
    if (!this.mounted) {
      document.body.appendChild(this.el)
      this.mounted = true
    }
    this.el.style.display = 'block'
  }

  hide(): void {
    this.el.style.display = 'none'
  }

  destroy(): void {
    if (this.mounted) this.el.remove()
    this.source = null
    this.mounted = false
  }

  private drawAt(cx: number, cy: number): void {
    if (!this.source) return

    const sourceSize = Math.round(this._size / this._zoom)
    const half = sourceSize / 2

    const sx = Math.max(0, Math.min(cx - half, this.source.width - sourceSize))
    const sy = Math.max(0, Math.min(cy - half, this.source.height - sourceSize))

    this.canvas.width = this._size
    this.canvas.height = this._size
    this.ctx.imageSmoothingEnabled = false
    this.ctx.drawImage(this.source, sx, sy, sourceSize, sourceSize, 0, 0, this._size, this._size)

    this.ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    this.ctx.lineWidth = 3
    this.ctx.beginPath()
    this.ctx.arc(this._size / 2, this._size / 2, this._size / 2 - 2, 0, Math.PI * 2)
    this.ctx.stroke()

    this.ctx.strokeStyle = 'rgba(255,60,60,0.85)'
    this.ctx.lineWidth = 1.5
    const ch = 10
    this.ctx.beginPath()
    this.ctx.moveTo(this._size / 2 - ch, this._size / 2)
    this.ctx.lineTo(this._size / 2 + ch, this._size / 2)
    this.ctx.moveTo(this._size / 2, this._size / 2 - ch)
    this.ctx.lineTo(this._size / 2, this._size / 2 + ch)
    this.ctx.stroke()
  }
}

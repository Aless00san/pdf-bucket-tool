<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument, PageLayers, exportPDF, Magnifier } from 'pdf-bucket-tool'
import { jsPDF } from 'jspdf'

const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const canvasRef = ref<HTMLCanvasElement>()
const fileInput = ref<HTMLInputElement>()
const color = ref('#ff0000')
const tolerance = ref(32)
const status = ref('')
const fileName = ref('')
let currentDoc: PDFDocument | null = null
const pagesLayers = ref<Map<number, PageLayers>>(new Map())
const currentPageIndex = ref(0)
const totalPages = ref(0)
const currentPageDisplay = computed(() => currentPageIndex.value + 1)

const magnifierEnabled = ref(false)
const magnifierZoom = ref(3)
const magnifier = new Magnifier()
watch(magnifierEnabled, v => magnifier.enabled = v)
watch(magnifierZoom, v => magnifier.zoom = v)

function currentLayers(): PageLayers | null {
  return pagesLayers.value.get(currentPageIndex.value) ?? null
}

function openFile() {
  fileInput.value?.click()
}

async function loadPDF(file: File) {
  const buf = await file.arrayBuffer()
  fileName.value = file.name
  status.value = 'Loading PDF...'
  currentDoc = await PDFDocument.load(new Uint8Array(buf))
  pagesLayers.value = new Map()
  totalPages.value = currentDoc.numPages
  await renderPage(0)
}

async function loadDemo() {
  status.value = 'Generating demo PDF...'

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })

  const lw = 3
  pdf.setDrawColor(0)
  pdf.setLineWidth(lw)

  // Page 1 — House
  pdf.setFontSize(20)
  pdf.text('House', 260, 30)
  pdf.triangle(130, 140, 250, 40, 370, 140)
  pdf.rect(150, 140, 200, 250)
  pdf.rect(220, 270, 60, 120)
  pdf.rect(168, 170, 50, 50)
  pdf.rect(282, 170, 50, 50)

  // Page 2 — Shapes
  pdf.addPage()
  pdf.setDrawColor(0)
  pdf.setLineWidth(lw)
  pdf.setFontSize(20)
  pdf.text('Shapes', 260, 40)
  pdf.circle(300, 140, 80)
  pdf.rect(150, 300, 100, 100)
  pdf.rect(350, 300, 100, 100)
  pdf.triangle(200, 350, 250, 280, 300, 350)
  pdf.setLineWidth(5)
  pdf.line(297.64, 40, 297.64, 841.89 - 40)

  const pdfData = new Uint8Array(pdf.output('arraybuffer'))
  fileName.value = 'demo.pdf'
  currentDoc = await PDFDocument.load(pdfData)
  pagesLayers.value = new Map()
  totalPages.value = currentDoc.numPages
  await renderPage(0)
}

async function renderPage(index: number) {
  if (!currentDoc || !canvasRef.value) return
  currentPageIndex.value = index

  const page = currentDoc.pages[index]

  let layers = pagesLayers.value.get(index)
  if (!layers) {
    const canvas = await page.renderToCanvas({ scale: 2 })
    canvasRef.value.width = canvas.width
    canvasRef.value.height = canvas.height
    const ctx = canvasRef.value.getContext('2d')!
    ctx.drawImage(canvas, 0, 0)
    const baseData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    layers = new PageLayers(baseData)
    pagesLayers.value.set(index, layers)
  } else {
    canvasRef.value.width = layers.width
    canvasRef.value.height = layers.height
  }

  displayPage()
  status.value = `Page ${currentPageDisplay.value} of ${totalPages.value} — click to fill`
}

function displayPage() {
  const layers = currentLayers()
  if (!canvasRef.value || !layers) return
  const ctx = canvasRef.value.getContext('2d')!
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  ctx.drawImage(layers.getCompositeCanvas(), 0, 0)
}

function goToPage(delta: number) {
  const next = currentPageIndex.value + delta
  if (next >= 0 && next < totalPages.value) {
    renderPage(next)
  }
}

function onCanvasClick(e: MouseEvent) {
  if (!canvasRef.value) return
  const layers = currentLayers()
  if (!layers) return

  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height
  const x = Math.round((e.clientX - rect.left) * scaleX)
  const y = Math.round((e.clientY - rect.top) * scaleY)

  const result = layers.floodFill(x, y, color.value, { tolerance: tolerance.value })
  status.value = `Filled ${result.pixelsFilled} pixels`
  displayPage()
  magnifier.refresh()
}

async function handleExport() {
  if (!currentDoc) return

  status.value = 'Exporting all pages...'

  // Ensure all pages have been visited/rendered
  for (let i = 0; i < totalPages.value; i++) {
    if (!pagesLayers.value.has(i)) {
      await renderPage(i)
    }
  }

  const pages = currentDoc.pages
  const allLayers: PageLayers[] = []
  for (let i = 0; i < pages.length; i++) {
    const l = pagesLayers.value.get(i)
    if (l) allLayers.push(l)
  }

  const pdfBytes = await exportPDF(pages, allLayers)

  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'colored-demo.pdf'
  a.click()
  URL.revokeObjectURL(url)
  status.value = 'Downloaded colored-demo.pdf'
}

function resetPage() {
  const layers = currentLayers()
  if (layers) {
    layers.clearOverlay()
    displayPage()
    status.value = 'Overlay cleared'
  }
}

function onCanvasMouseMove(e: MouseEvent) {
  if (!canvasRef.value) return
  magnifier.update(e)
}

function onCanvasMouseLeave() {
  magnifier.hide()
}

onMounted(async () => {
  await loadDemo()
  if (canvasRef.value) magnifier.attachTo(canvasRef.value)
})
</script>

<template>
  <div style="font-family: sans-serif; padding: 16px; max-width: 800px">
    <h1>PDF Bucket Tool Demo</h1>
    <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap">
      <input ref="fileInput" type="file" accept=".pdf,application/pdf" style="display:none" @change="loadPDF(($event.target as HTMLInputElement).files![0])" />
      <button @click="openFile">Open PDF</button>
      <button @click="loadDemo">Load Demo</button>
      <span v-if="fileName" style="font-size:14px;color:#666">{{ fileName }}</span>
    </div>
    <div style="margin-bottom: 12px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap">
      <label>
        Fill color:
        <input type="color" v-model="color" />
      </label>
      <label>
        Tolerance (0–255):
        <input type="range" min="0" max="255" v-model.number="tolerance" style="vertical-align: middle" />
        {{ tolerance }}
      </label>
      <label>
        <input type="checkbox" v-model="magnifierEnabled" />
        Magnifier
      </label>
      <label v-if="magnifierEnabled" style="display: inline-flex; align-items: center; gap: 4px">
        Zoom:
        <input type="range" min="2" max="10" step="0.5" v-model.number="magnifierZoom" style="vertical-align: middle; width: 80px" />
        {{ magnifierZoom }}×
      </label>
      <button @click="handleExport">Export PDF</button>
      <button @click="resetPage">Reset Page</button>
    </div>
    <div style="margin-bottom: 8px; display: flex; gap: 8px; align-items: center">
      <button :disabled="currentPageIndex === 0" @click="goToPage(-1)">Prev</button>
      <span>{{ currentPageDisplay }} / {{ totalPages }}</span>
      <button :disabled="currentPageIndex >= totalPages - 1" @click="goToPage(1)">Next</button>
    </div>
    <div style="margin-bottom: 8px; font-size: 14px; color: #555">{{ status }}</div>
    <canvas ref="canvasRef" @click="onCanvasClick" @mousemove="onCanvasMouseMove" @mouseleave="onCanvasMouseLeave" :style="{ border: '1px solid #ccc', display: 'block', maxWidth: '100%', cursor: magnifierEnabled ? 'none' : 'crosshair' }" />
  </div>
</template>

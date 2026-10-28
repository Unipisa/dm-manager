import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

// Bundle PDF.js support files locally; no CDN or external conversion service.
const assets = import.meta.glob([
    '/node_modules/pdfjs-dist/cmaps/*.bcmap',
    '/node_modules/pdfjs-dist/standard_fonts/*.{pfb,ttf}',
    '/node_modules/pdfjs-dist/wasm/*.{wasm,js}',
], { eager: true, query: '?url', import: 'default' })

class PdfBinaryDataFactory {
    async fetch({ kind, filename }) {
        const directory = { cMapUrl: 'cmaps', standardFontDataUrl: 'standard_fonts', wasmUrl: 'wasm' }[kind]
        const url = assets[`/node_modules/pdfjs-dist/${directory}/${filename}`]
        if (!url) throw new Error('Risorsa PDF non disponibile.')
        const response = await fetch(url)
        if (!response.ok) throw new Error('Impossibile caricare una risorsa PDF.')
        return new Uint8Array(await response.arrayBuffer())
    }
}

export async function pdfToPng(file) {
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('La locandina PDF deve essere inferiore a 10 MB.')
    }

    const loadingTask = getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        BinaryDataFactory: PdfBinaryDataFactory,
        useWorkerFetch: false,
    })
    const canvas = document.createElement('canvas')
    try {
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)
        const size = page.getViewport({ scale: 1 })
        const viewport = page.getViewport({ scale: 2400 / Math.max(size.width, size.height) })
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Impossibile creare l’immagine della locandina.')
        await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise
        const png = await new Promise((resolve, reject) => {
            canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Impossibile creare l’immagine della locandina.')), 'image/png')
        })
        return new File([png], file.name.replace(/\.pdf$/i, '') + '.png', { type: 'image/png' })
    } finally {
        await loadingTask.destroy()
        canvas.width = canvas.height = 0
    }
}

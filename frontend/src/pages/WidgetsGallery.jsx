import { useEffect, useRef, useState } from 'react'
import { apiPath } from '../apiPath'

export default function WidgetsGallery() {
  const [height, setHeight] = useState(600)
  const observer = useRef(null)

  useEffect(() => () => observer.current?.disconnect(), [])

  function onLoad(event) {
    observer.current?.disconnect()
    const doc = event.currentTarget.contentDocument
    const gallery = doc?.querySelector('.widget-gallery')
    if (!gallery) return

    // These changes apply only to the in-app view, leaving the standalone gallery intact.
    const style = doc.createElement('style')
    style.textContent = `
      html { overflow: hidden; }
      body { margin: 0; }
      .gallery-header, .gallery-instructions { display: none; }
      .widget-gallery { padding-top: 0; }
    `
    doc.head.appendChild(style)

    // Follow widget loads, tab switches, expanded sections, and changes in width.
    const resize = () => setHeight(Math.ceil(gallery.getBoundingClientRect().height))
    resize()
    observer.current = new ResizeObserver(resize)
    observer.current.observe(gallery)
  }

  // Keep the department website styles and the gallery's React cache isolated.
  return <>
    <h1 className="text-primary pb-4">Widgets</h1>
    <iframe
      title="Widgets gallery"
      src={apiPath('widgets-gallery', 'index.html')}
      className="d-block w-100 border-0"
      style={{ height }}
      onLoad={onLoad}
    />
  </>
}

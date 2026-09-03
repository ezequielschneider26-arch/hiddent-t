import React, { useState, useRef, useCallback } from 'react'
import { FiUpload, FiTrash2, FiDownload, FiBox, FiGrid } from 'react-icons/fi'
import Taza3D from './Taza3D'
import './Sublimador.css'

// Vista 2D: la imagen del usuario se recorta a la forma del cuerpo de la taza
// usando un clipPath SVG, por lo que "toma la forma de la taza" automaticamente.
function Taza2D({ imagen, svgRef }) {
  return React.createElement('svg', { viewBox: '0 0 400 500', className: 'taza2d-svg', ref: svgRef },
    React.createElement('defs', null,
      React.createElement('clipPath', { id: 'printClip' },
        React.createElement('path', { d: 'M95 150 L305 150 L292 400 Q290 420 270 420 L130 420 Q110 420 108 400 Z' })
      )
    ),
    imagen ? React.createElement('image', { href: imagen, x: '95', y: '150', width: '210', height: '270', preserveAspectRatio: 'xMidYMid slice', clipPath: 'url(#printClip)' }) : null,
    React.createElement('ellipse', { cx: '200', cy: '150', rx: '105', ry: '20', fill: '#E8E8EA' }),
    React.createElement('ellipse', { cx: '200', cy: '150', rx: '88', ry: '14', fill: '#D6D6DA' }),
    React.createElement('path', { d: 'M305 190 Q360 190 360 260 Q360 330 305 330', stroke: '#F0F0F3', strokeWidth: '34', fill: 'none', strokeLinecap: 'round' }),
    React.createElement('path', { d: 'M95 150 L118 420 Q150 425 130 400 L108 150 Z', fill: '#D8D8DC', opacity: '0.35' }),
    React.createElement('rect', { x: '95', y: '150', width: '210', height: '270', fill: '#FFFFFF', opacity: '0.07' })
  )
}

export default function Sublimador() {
  const [imagen, setImagen] = useState(null)
  const [vista, setVista] = useState('2d')
  const fileInputRef = useRef(null)
  const svgRef = useRef(null)
  const exportRef = useRef(null)

  const handleUpload = useCallback(function (e) {
    const f = e.target.files && e.target.files[0]
    if (f && f.type.startsWith('image/')) {
      const rd = new FileReader()
      rd.onload = function (ev) { setImagen(ev.target.result) }
      rd.readAsDataURL(f)
    }
  }, [])

  const handleDrop = useCallback(function (e) {
    e.preventDefault()
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) {
      const rd = new FileReader()
      rd.onload = function (ev) { setImagen(ev.target.result) }
      rd.readAsDataURL(f)
    }
  }, [])

  const clearImg = function () {
    setImagen(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleExport = function () {
    if (vista === '3d') {
      if (exportRef.current) downloadPng(exportRef.current())
      return
    }
    const svg = svgRef.current
    if (!svg) return
    const s = new XMLSerializer().serializeToString(svg)
    exportSvgString('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s))
  }

  function exportSvgString(svgString) {
    const img = new Image()
    img.onload = function () {
      const c = document.createElement('canvas')
      c.width = 800
      c.height = 1000
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0, c.width, c.height)
      downloadPng(c.toDataURL('image/png'))
    }
    img.src = svgString
  }

  function downloadPng(dataUrl) {
    const link = document.createElement('a')
    link.download = 'hiddent-taza-sublimada.png'
    link.href = dataUrl
    link.click()
  }

  const sendWA = function () {
    const msg = 'Hola! Quiero sublimar una taza personalizada.'
    window.open('https://wa.me/5493454497729?text=' + encodeURIComponent(msg), '_blank')
    handleExport()
  }

  return React.createElement('section', { id: 'tazas', className: 'section sublimador' },
    React.createElement('h2', { className: 'section-title' }, 'Sublimá tu Taza'),
    React.createElement('p', { className: 'section-subtitle' }, 'Subí tu imagen y mirá cómo queda tu taza personalizada'),

    React.createElement('div', { className: 'sublimador-main' },
      React.createElement('div', { className: 'sublimador-canvas' },
        React.createElement('div', { className: 'vista-toggle' },
          React.createElement('button', { className: vista === '2d' ? 'vista-btn active' : 'vista-btn', onClick: function () { setVista('2d') } },
            React.createElement(FiGrid, { size: 14 }), ' Vista 2D'),
          React.createElement('button', { className: vista === '3d' ? 'vista-btn active' : 'vista-btn', onClick: function () { setVista('3d') } },
            React.createElement(FiBox, { size: 14 }), ' Vista 3D')
        ),
        React.createElement('div', { className: vista === '3d' ? 'canvas-area taza-area-3d' : 'canvas-area taza-area-2d' },
          vista === '3d'
            ? React.createElement(Taza3D, { imagen: imagen, onExportRef: exportRef })
            : React.createElement(Taza2D, { imagen: imagen, svgRef: svgRef }),
          !imagen ? React.createElement('div', { className: 'canvas-hint' },
            React.createElement(FiUpload, { size: 24 }), React.createElement('p', null, 'Subí tu imagen para empezar')) : null,
          React.createElement('div', { className: 'canvas-tilt-hint' }, vista === '3d' ? 'Arrastrá la taza para girarla' : 'Diseño aplicado a la zona de sublimación')
        ),
        imagen ? React.createElement('div', { className: 'disenador-send-row' },
          React.createElement('button', { className: 'btn btn-whatsapp disenador-send', onClick: sendWA }, 'Enviar por WhatsApp'),
          React.createElement('button', { className: 'btn btn-outline disenador-export', onClick: handleExport },
            React.createElement(FiDownload, { size: 14 }), ' Descargar PNG')
        ) : null
      ),

      React.createElement('div', { className: 'sublimador-panel' },
        React.createElement('div', { className: 'panel-section' },
          React.createElement('h3', null, '1. Subí tu imagen'),
          React.createElement('div', { className: 'upload-zone' + (imagen ? ' has-image' : ''), onClick: function () { fileInputRef.current && fileInputRef.current.click() }, onDrop: handleDrop, onDragOver: function (e) { e.preventDefault() } },
            imagen ? React.createElement('img', { src: imagen, alt: 'diseno', className: 'upload-preview' })
              : React.createElement(React.Fragment, null, React.createElement(FiUpload, { size: 32 }), React.createElement('p', null, 'Haz clic o arrastra tu imagen'), React.createElement('span', null, 'JPG, PNG, SVG'))
          ),
          React.createElement('input', { ref: fileInputRef, type: 'file', accept: 'image/*', onChange: handleUpload, hidden: true }),
          imagen ? React.createElement('div', { className: 'upload-actions' },
            React.createElement('button', { className: 'btn-clear', onClick: clearImg }, React.createElement(FiTrash2, { size: 14 }), ' Quitar')
          ) : null
        ),
        React.createElement('div', { className: 'panel-section' },
          React.createElement('h3', null, '2. Detalles del pedido'),
          React.createElement('div', { className: 'taza-info' },
            React.createElement('p', null, React.createElement('strong', null, 'Taza:'), ' Cerámica blanca 325ml'),
            React.createElement('p', null, React.createElement('strong', null, 'Técnica:'), ' Sublimación (full color)'),
            React.createElement('p', null, 'El diseño envuelve toda la vuelta de la taza (360°). La manija y unos milímetros a cada lado quedan en blanco.')
          )
        )
      )
    )
  )
}

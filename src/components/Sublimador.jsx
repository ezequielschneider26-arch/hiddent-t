import React, { useState, useRef, useCallback } from 'react'
import { FiUpload, FiTrash2, FiDownload } from 'react-icons/fi'
import Taza3D from './Taza3D'
import './Sublimador.css'

export default function Sublimador() {
  const [imagen, setImagen] = useState(null)
  const fileInputRef = useRef(null)
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
    if (!exportRef.current) return
    const dataUrl = exportRef.current()
    if (!dataUrl) return
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
        React.createElement('div', { className: 'canvas-area taza-area-3d' },
          React.createElement(Taza3D, { imagen: imagen, onExportRef: exportRef }),
          !imagen ? React.createElement('div', { className: 'canvas-hint' },
            React.createElement(FiUpload, { size: 24 }), React.createElement('p', null, 'Subí tu imagen para empezar')) : null,
          React.createElement('div', { className: 'canvas-tilt-hint' }, 'Arrastrá la taza para girarla')
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
          React.createElement('p', { className: 'taza-measure-hint' }, 'Medida óptima de la imagen: 2000×420 px (proporción ≈ 4.8:1). Así llena la pared del cuerpo de la taza sin deformarse, sin llegar al fondo ni al borde.'),
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

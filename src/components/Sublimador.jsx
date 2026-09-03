import React, { useState, useRef, useCallback, useEffect } from 'react'
import { FiUpload, FiTrash2, FiMaximize2, FiDownload, FiCheck, FiBox, FiGrid } from 'react-icons/fi'
import { Canvas, FabricImage, Path } from 'fabric'
import Taza3D from './Taza3D'
import './Sublimador.css'

const TAZA_SVG = '/productos/taza-blank.svg'

function TazaCanvas2D(props) {
  const imagen = props.imagen
  const aplicada = props.aplicada
  const tamano = props.tamano
  const posX = props.posX
  const posY = props.posY
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const fabricRef = useRef(null)
  const userImgRef = useRef(null)

  useEffect(function () {
    if (!containerRef.current) return
    const container = containerRef.current
    const cw = container.clientWidth
    const ch = Math.round(cw * 4 / 3)

    const fc = new Canvas(canvasRef.current, {
      width: cw, height: ch, preserveObjectStacking: true,
      selection: false, backgroundColor: '#1a1a24',
    })
    fabricRef.current = fc

    FabricImage.fromURL(TAZA_SVG, { crossOrigin: 'anonymous' }).then(function (img) {
      const iw = img.width || 400
      const ih = img.height || 500
      const scale = Math.min(cw / iw, ch / ih) * 0.9
      img.set({ scaleX: scale, scaleY: scale, originX: 'center', originY: 'center', left: cw / 2, top: ch / 2, selectable: false, evented: false })
      fc.backgroundImage = img
      fc.renderAll()
    })

    return function () { fc.dispose(); fabricRef.current = null }
  }, [])

  useEffect(function () {
    const fc = fabricRef.current
    if (!fc) return
    if (userImgRef.current) { fc.remove(userImgRef.current); userImgRef.current = null }
    if (!imagen || !aplicada) { fc.renderAll(); return }

    FabricImage.fromURL(imagen).then(function (img) {
      const cw = fc.width, ch = fc.height
      const cx = (posX / 100) * cw
      const cy = (posY / 100) * ch
      const scale = (tamano / 100) * 0.5
      const imgW = img.width * scale
      const imgH = img.height * scale

      // clip con forma de taza: boca (elipse) arriba y fondo ligeramente curvo
      const rimY = imgH * 0.22
      const clip = new Path('M 0,' + imgH +
        ' L 0,' + rimY +
        ' A ' + (imgW / 2) + ',' + rimY + ' 0 0 1 ' + imgW + ',' + rimY +
        ' L ' + imgW + ',' + imgH +
        ' Q ' + (imgW / 2) + ',' + (imgH + rimY * 0.3) + ' 0,' + imgH + ' Z', {
        left: 0, top: 0, objectCaching: false,
      })

      img.set({
        left: cx, top: cy, originX: 'center', originY: 'center',
        scaleX: imgW / img.width, scaleY: imgH / img.height,
        selectable: false, hasControls: false,
        clipPath: clip,
      })
      fc.add(img)
      userImgRef.current = img
      fc.sendToBack(img)
      fc.renderAll()
    })
  }, [imagen, aplicada, tamano, posX, posY])

  useEffect(function () {
    if (!fabricRef.current) return
    const fc = fabricRef.current
    function handleResize() {
      const container = containerRef.current
      if (!container) return
      const cw = container.clientWidth
      const ch = Math.round(cw * 4 / 3)
      fc.setDimensions({ width: cw, height: ch })
      fc.renderAll()
    }
    window.addEventListener('resize', handleResize)
    return function () { window.removeEventListener('resize', handleResize) }
  }, [])

  useEffect(function () {
    if (props.onExportRef) props.onExportRef.current = function () {
      const fc = fabricRef.current
      if (!fc) return null
      return fc.toDataURL({ format: 'png', multiplier: 2, quality: 1 })
    }
  })

  return React.createElement('div', { ref: containerRef, className: 'fabric-canvas-container' },
    React.createElement('canvas', { ref: canvasRef }))
}

export default function Sublimador() {
  const [imagen, setImagen] = useState(null)
  const [aplicada, setAplicada] = useState(false)
  const [tamano, setTamano] = useState(80)
  const [posX, setPosX] = useState(50)
  const [posY, setPosY] = useState(50)
  const [vista, setVista] = useState('2d')
  const fileInputRef = useRef(null)
  const exportRef = useRef(null)

  const handleUpload = useCallback(function (e) {
    const f = e.target.files && e.target.files[0]
    if (f && f.type.startsWith('image/')) {
      const rd = new FileReader()
      rd.onload = function (ev) { setImagen(ev.target.result); setAplicada(false) }
      rd.readAsDataURL(f)
    }
  }, [])

  const handleDrop = useCallback(function (e) {
    e.preventDefault()
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) {
      const rd = new FileReader()
      rd.onload = function (ev) { setImagen(ev.target.result); setAplicada(false) }
      rd.readAsDataURL(f)
    }
  }, [])

  const aplicar = function () {
    if (!imagen) return
    setAplicada(true)
  }

  const clearImg = function () {
    setImagen(null); setAplicada(false)
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
    React.createElement('p', { className: 'section-subtitle' }, 'Subí tu imagen, aplicala en la taza y mirá cómo queda tu taza personalizada'),

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
            ? React.createElement(Taza3D, { imagen: aplicada ? imagen : null, onExportRef: exportRef })
            : React.createElement(TazaCanvas2D, { imagen: imagen, aplicada: aplicada, tamano: tamano, posX: posX, posY: posY, onExportRef: exportRef }),
          !imagen ? React.createElement('div', { className: 'canvas-hint' },
            React.createElement(FiUpload, { size: 24 }), React.createElement('p', null, 'Subí tu imagen para empezar')) : null,
          React.createElement('div', { className: 'canvas-tilt-hint' }, vista === '3d' ? 'Arrastrá la taza para girarla' : 'Diseño aplicado a la zona de sublimación')
        ),
        imagen && aplicada ? React.createElement('div', { className: 'disenador-send-row' },
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
            React.createElement('button', { className: 'btn-aplicar' + (aplicada ? ' aplicado' : ''), onClick: aplicar },
              React.createElement(FiCheck, { size: 14 }), aplicada ? ' Aplicada' : ' Aplicar en la taza'),
            React.createElement('button', { className: 'btn-clear', onClick: clearImg }, React.createElement(FiTrash2, { size: 14 }), ' Quitar')
          ) : null
        ),
        React.createElement('div', { className: 'panel-section controls' },
          React.createElement('h3', null, '2. Posicionar diseño'),
          React.createElement('div', { className: 'control-group' },
            React.createElement('label', null, React.createElement(FiMaximize2, { size: 14 }), ' Tamaño'),
            React.createElement('input', { type: 'range', min: '20', max: '100', value: tamano, onChange: function (e) { setTamano(Number(e.target.value)) } }),
            React.createElement('span', null, tamano + '%')),
          React.createElement('div', { className: 'control-group' },
            React.createElement('label', null, 'X'),
            React.createElement('input', { type: 'range', min: '0', max: '100', value: posX, onChange: function (e) { setPosX(Number(e.target.value)) } }),
            React.createElement('span', null, Math.round(posX) + '%')),
          React.createElement('div', { className: 'control-group' },
            React.createElement('label', null, 'Y'),
            React.createElement('input', { type: 'range', min: '0', max: '100', value: posY, onChange: function (e) { setPosY(Number(e.target.value)) } }),
            React.createElement('span', null, Math.round(posY) + '%'))
        ),
        React.createElement('div', { className: 'panel-section' },
          React.createElement('h3', null, '3. Detalles del pedido'),
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

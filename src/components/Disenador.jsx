import React, { useState, useRef, useCallback, useEffect } from 'react'
import { FiUpload, FiTrash2, FiRotateCw, FiMaximize2, FiSliders, FiImage, FiDownload, FiZap } from 'react-icons/fi'
import { Canvas, FabricImage, Rect } from 'fabric'
import Mochila3D from './Mochila3D'
import { removeBackground } from '../utils/removeBg'
import './Disenador.css'

var productos = [
  { id: 'mochila', nombre: 'Mochila', color: '#8B5CF6' },
  { id: 'yerbera', nombre: 'Yerbera', color: '#EC4899' },
  { id: 'bolso', nombre: 'Bolso', color: '#06B6D4' },
  { id: 'botinera', nombre: 'Botinera', color: '#F59E0B' },
  { id: 'gorra', nombre: 'Gorra', color: '#22C55E' },
  { id: 'estuche', nombre: 'Estuche', color: '#8B5CF6' },
  { id: 'cartera', nombre: 'Cartera', color: '#EC4899' },
]

var coloresTela = [
  { id: 'negro', nombre: 'Negro', hex: '#1A1A1A' },
  { id: 'blanco', nombre: 'Blanco', hex: '#F5F5F5' },
  { id: 'gris', nombre: 'Gris', hex: '#6B7280' },
  { id: 'beige', nombre: 'Beige', hex: '#D4B896' },
  { id: 'azul', nombre: 'Azul', hex: '#2563EB' },
  { id: 'rojo', nombre: 'Rojo', hex: '#DC2626' },
  { id: 'verde', nombre: 'Verde', hex: '#16A34A' },
  { id: 'rosa', nombre: 'Rosa', hex: '#EC4899' },
  { id: 'violeta', nombre: 'Violeta', hex: '#8B5CF6' },
  { id: 'mostaza', nombre: 'Mostaza', hex: '#EAB308' },
]

var zonasPorProducto = {
  mochila: [
    { id: 'centro', label: 'Centro frontal', x: 50, y: 40, size: 35 },
    { id: 'bolsillo', label: 'Bolsillo frontal', x: 50, y: 62, size: 22 },
    { id: 'tapa', label: 'Tapa superior', x: 50, y: 18, size: 20 },
  ],
  yerbera: [
    { id: 'centro', label: 'Centro frontal', x: 50, y: 45, size: 35 },
    { id: 'tapa', label: 'Tapa', x: 50, y: 20, size: 25 },
  ],
  bolso: [
    { id: 'centro', label: 'Centro', x: 50, y: 48, size: 30 },
    { id: 'bolsillo', label: 'Bolsillo frontal', x: 50, y: 68, size: 22 },
  ],
  botinera: [
    { id: 'izquierdo', label: 'Lado izquierdo', x: 25, y: 52, size: 22 },
    { id: 'derecho', label: 'Lado derecho', x: 75, y: 52, size: 22 },
    { id: 'centro', label: 'Tapa central', x: 50, y: 28, size: 20 },
  ],
  gorra: [
    { id: 'frente', label: 'Frente', x: 50, y: 38, size: 30 },
    { id: 'costado', label: 'Costado', x: 78, y: 38, size: 22 },
  ],
  estuche: [
    { id: 'centro', label: 'Centro', x: 50, y: 40, size: 30 },
    { id: 'inferior', label: 'Parte inferior', x: 50, y: 68, size: 22 },
  ],
  cartera: [
    { id: 'centro', label: 'Centro frontal', x: 50, y: 45, size: 28 },
    { id: 'bolsillo', label: 'Bolsillo', x: 50, y: 68, size: 20 },
  ],
}

var telasData = {
  mochila: [
    { id: 'nylon600', nombre: 'Nylon 600D', desc: 'Resistente al agua, ideal para uso diario.' },
    { id: 'poliester', nombre: 'Poliester 300D', desc: 'Liviano y económico, fácil de limpiar.' },
    { id: 'cuero_sint', nombre: 'Cuero Sintético PU', desc: 'Look premium, perfecto para regalos.' },
    { id: 'lona', nombre: 'Lona 12oz', desc: 'Textura natural, muy resistente.' },
    { id: 'malla', nombre: 'Malla Traspirable', desc: 'Para mochilas deportivas.' },
  ],
  yerbera: [
    { id: 'lona12', nombre: 'Lona 12oz', desc: 'La clásica. Sujeta bien.' },
    { id: 'nylon600', nombre: 'Nylon 600D', desc: 'Impermeable, protege la yerba.' },
    { id: 'cuero_sint', nombre: 'Cuero Sintético PU', desc: 'Look elegante. Superficie lisa.' },
    { id: 'polar', nombre: 'Polar Termico', desc: 'Mantiene temperatura.' },
    { id: 'tela_imp', nombre: 'Tela Impermeable', desc: 'Protección total contra derrames.' },
  ],
  bolso: [
    { id: 'lona', nombre: 'Lona 10oz', desc: 'Textura natural, resistente.' },
    { id: 'cuero_sint', nombre: 'Cuero Sintético PU', desc: 'Elegancia accesible.' },
    { id: 'algodon', nombre: 'Algodon Canvas', desc: 'Eco-friendly, transpirable.' },
    { id: 'nylon', nombre: 'Nylon Ripstop', desc: 'Ultra resistente a rasgaduras.' },
    { id: 'poliester', nombre: 'Poliester Oxford', desc: 'Impermeable, liviano.' },
  ],
  botinera: [
    { id: 'nylon600', nombre: 'Nylon 600D', desc: 'La más común. Resistente.' },
    { id: 'lona16', nombre: 'Lona 16oz', desc: 'La más gruesa. Uso industrial.' },
    { id: 'cuero_sint', nombre: 'Cuero Sintético PU', desc: 'Look premium.' },
    { id: 'pvc', nombre: 'PVC Lavable', desc: 'Se limpia con agua.' },
    { id: 'poliester', nombre: 'Poliester 600D', desc: 'Buena relación calidad-precio.' },
  ],
  gorra: [
    { id: 'algodon', nombre: 'Algodón Peinado', desc: 'La clásica. Transpirable.' },
    { id: 'poliester', nombre: 'Poliester Tricot', desc: 'Secado rápido, colores vivos.' },
    { id: 'mezclilla', nombre: 'Mezclilla', desc: 'Estilo retro/casual.' },
    { id: 'nylon', nombre: 'Nylon Malla', desc: 'Muy liviana, trucker.' },
    { id: 'polar', nombre: 'Polar Flis', desc: 'Para gorras de invierno.' },
  ],
  estuche: [
    { id: 'lona', nombre: 'Lona 10oz', desc: 'Rigidez media, protege bien.' },
    { id: 'neoprene', nombre: 'Neoprene 3mm', desc: 'Absorbe golpes.' },
    { id: 'poliester', nombre: 'Poliester 300D', desc: 'Liviano y resistente.' },
    { id: 'nylon', nombre: 'Nylon 420D', desc: 'Impermeable, liviano.' },
    { id: 'cuero_sint', nombre: 'Cuero Sintético PU', desc: 'Look elegante.' },
  ],
  cartera: [
    { id: 'cuero_sint', nombre: 'Cuero Sintético PU', desc: 'La más elegante.' },
    { id: 'lona', nombre: 'Lona 12oz', desc: 'Casual y resistente.' },
    { id: 'algodon', nombre: 'Algodon Canvas', desc: 'Eco-friendly, textura natural.' },
    { id: 'nylon', nombre: 'Nylon 420D', desc: 'Liviana, impermeable.' },
    { id: 'pvc', nombre: 'PVC Transparente', desc: 'Moderno, se ve el contenido.' },
  ],
}

var productoFotos = {
  mochila: '/productos/mochila-blank.svg',
  yerbera: '/productos/yerbera-blank.svg',
  bolso: '/productos/bolso-blank.svg',
  botinera: '/productos/botinera-blank.svg',
  gorra: '/productos/gorra-blank.svg',
  estuche: '/productos/estuche-blank.svg',
  cartera: '/productos/cartera-blank.svg',
}

var telaTextureMap = {
  nylon600: 'ft-nylon', poliester: 'ft-poliester', cuero_sint: 'ft-leather',
  lona: 'ft-canvas', lona12: 'ft-canvas', lona16: 'ft-canvas-heavy',
  malla: 'ft-mesh', algodon: 'ft-cotton', nylon: 'ft-ripstop',
  polar: 'ft-polar', neoprene: 'ft-neoprene', pvc: 'ft-glossy',
  mezclilla: 'ft-denim', tela_imp: 'ft-waterproof',
}

function FabricCanvas(props) {
  var producto=props.producto,colorTela=props.colorTela,imagen=props.imagen
  var zonaActiva=props.zonaActiva,modoLibre=props.modoLibre
  var tamano=props.tamano,rotacion=props.rotacion
  var posX=props.posX,posY=props.posY
  var onZoneClick=props.onZoneClick
  var zonasyMarca=props.zonasyMarca||[]
  var applied=props.applied
  var containerRef=useRef(null)
  var canvasRef=useRef(null)
  var fabricRef=useRef(null)
  var userImgRef=useRef(null)
  var zonesRef=useRef([])

  var zonas=zonasPorProducto[producto]||[]

  useEffect(function(){
    if(!containerRef.current)return
    var container=containerRef.current
    var cw=container.clientWidth
    var ch=Math.round(cw*4/3)

    var fc=new Canvas(canvasRef.current,{
      width:cw,height:ch,preserveObjectStacking:true,
      selection:false,backgroundColor:'#1a1a24'
    })
    fabricRef.current=fc

    var fotoSrc=productoFotos[producto]||productoFotos.mochila
    var isSvg=fotoSrc.endsWith('.svg')
    FabricImage.fromURL(fotoSrc,{crossOrigin:'anonymous'}).then(function(img){
      var iw=img.width||400,ih=img.height||500
      if(isSvg&&(!iw||iw<10)){iw=400;ih=500}
      var scale=Math.min(cw/iw,ch/ih)*0.9
      img.set({scaleX:scale,scaleY:scale,originX:'center',originY:'center',left:cw/2,top:ch/2,selectable:false,evented:false})
      fc.backgroundImage=img
      fc.renderAll()
    })

    return function(){
      fc.dispose()
      fabricRef.current=null
    }
  },[producto])

  useEffect(function(){
    var fc=fabricRef.current
    if(!fc)return
    fc.renderAll()
  },[colorTela,producto])

  useEffect(function(){
    var fc=fabricRef.current
    if(!fc)return

    zonesRef.current.forEach(function(z){fc.remove(z)})
    zonesRef.current=[]

    if(!imagen||applied)return
    if(!modoLibre&&!zonaActiva)return

    var cw=fc.width,ch=fc.height
    zonas.forEach(function(z){
      var w=(z.size/100)*cw*0.55,h=(z.size/100)*ch*0.45
      var cx=(z.x/100)*cw,cy=(z.y/100)*ch
      var isA=zonaActiva===z.id,isM=zonasyMarca.indexOf(z.id)>=0
      var rect=new Rect({
        left:cx-w/2,top:cy-h/2,width:w,height:h,rx:6,ry:6,
        fill:isA?'rgba(139,92,246,0.2)':isM?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.04)',
        stroke:isA?'#8B5CF6':isM?'#10B981':'rgba(255,255,255,0.2)',
        strokeWidth:isA||isM?2.5:1.5,
        strokeDashArray:isA||isM?null:[5,4],
        selectable:false,hasControls:false,
        excludeFromExport:true,
        _zoneId:z.id
      })
      if(onZoneClick&&!applied){
        rect.on('mousedown',function(){onZoneClick(z.id)})
        rect.on('touchstart',function(){onZoneClick(z.id)})
      }
      fc.add(rect)
      zonesRef.current.push(rect)
    })
    fc.renderAll()
  },[imagen,zonaActiva,modoLibre,applied,producto,zonasyMarca,onZoneClick])

  useEffect(function(){
    var fc=fabricRef.current
    if(!fc)return

    if(userImgRef.current){fc.remove(userImgRef.current);userImgRef.current=null}

    if(!imagen)return

    FabricImage.fromURL(imagen).then(function(img){
      var cw=fc.width,ch=fc.height
      var scale=(tamano/100)*0.25
      var imgW=img.width*scale
      var imgH=img.height*scale

      var cx,cy
      if(modoLibre){
        cx=(posX/100)*cw
        cy=(posY/100)*ch
      }else if(zonaActiva){
        var zona=null
        for(var i=0;i<zonas.length;i++){if(zonas[i].id===zonaActiva){zona=zonas[i];break}}
        if(zona){
          cx=(zona.x/100)*cw
          cy=(zona.y/100)*ch
          imgW=(zona.size/100)*cw*0.55*(tamano/40)
          imgH=imgW*(img.height/img.width)
        }else{
          cx=cw/2;cy=ch/2
        }
      }else{
        cx=cw/2;cy=ch/2
      }

      img.set({
        left:cx,top:cy,originX:'center',originY:'center',
        scaleX:imgW/img.width,scaleY:imgH/img.height,
        angle:rotacion,
        selectable:!applied,hasControls:!applied,hasBorders:!applied,
        _isUserDesign:true
      })

      if(applied){
        img.set({opacity:0.94})
      }

      fc.add(img)
      fc.setActiveObject(img)
      userImgRef.current=img
      fc.renderAll()
    })
  },[imagen,tamano,rotacion,posX,posY,modoLibre,zonaActiva,applied,producto])

  useEffect(function(){
    if(!fabricRef.current)return
    var fc=fabricRef.current
    function handleResize(){
      var container=containerRef.current
      if(!container)return
      var cw=container.clientWidth
      var ch=Math.round(cw*4/3)
      fc.setDimensions({width:cw,height:ch})
      fc.renderAll()
    }
    window.addEventListener('resize',handleResize)
    return function(){window.removeEventListener('resize',handleResize)}
  },[])

  var exportCanvas=function(){
    var fc=fabricRef.current
    if(!fc)return null
    return fc.toDataURL({format:'png',multiplier:2,quality:1})
  }

  useEffect(function(){
    if(props.onExportRef)props.onExportRef.current=exportCanvas
  })

  return React.createElement('div',{ref:containerRef,className:'fabric-canvas-container'},
    React.createElement('canvas',{ref:canvasRef})
  )
}

export default function Disenador() {
  var p=useState('mochila'),producto=p[0],setProducto=p[1]
  var q=useState('#1A1A1A'),colorTela=q[0],setColorTela=q[1]
  var r2=useState(null),imagen=r2[0],setImagen=r2[1]
  var s2=useState(null),zonaActiva=s2[0],setZonaActiva=s2[1]
  var t2=useState(40),tamano=t2[0],setTamano=t2[1]
  var u=useState(0),rotacion=u[0],setRotacion=u[1]
  var v=useState(false),modoLibre=v[0],setModoLibre=v[1]
  var w=useState(50),posX=w[0],setPosX=w[1]
  var x=useState(50),posY=x[0],setPosY=x[1]
  var ra=useState(false),removingBg=ra[0],setRemovingBg=ra[1]
  var rb=useState(30),tolerancia=rb[0],setTolerancia=rb[1]
  var mbg=useState('edge'),metodoBg=mbg[0],setMetodoBg=mbg[1]
  var rc=useState(false),bgRemoved=rc[0],setBgRemoved=rc[1]
  var rd=useState([]),zonasyMarca=rd[0],setZonasyMarca=rd[1]
  var re=useState(null),telaSeleccionada=re[0],setTelaSeleccionada=re[1]
  var rj=useState(false),aplicada=rj[0],setAplicada=rj[1]
  var rk=useState(0),rotacionY=rk[0],setRotacionY=rk[1]
  var rl=useState(0),tiltX=rl[0],setTiltX=rl[1]
  var fileInputRef=useRef(null)
  var exportRef=useRef(null)
  var canvasAreaRef=useRef(null)
  var dragStartRef=useRef(null)

  var zonas=zonasPorProducto[producto]||[]
  var is3D=producto==='mochila'

  var handleUpload=useCallback(function(e){
    var f=e.target.files&&e.target.files[0]
    if(f&&f.type.startsWith('image/')){var rd2=new FileReader();rd2.onload=function(ev){setImagen(ev.target.result);setBgRemoved(false)};rd2.readAsDataURL(f)}
  },[])

  var handleDrop=useCallback(function(e){
    e.preventDefault()
    var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]
    if(f&&f.type.startsWith('image/')){var rd2=new FileReader();rd2.onload=function(ev){setImagen(ev.target.result);setBgRemoved(false)};rd2.readAsDataURL(f)}
  },[])

  var handleRemoveBg=useCallback(async function(){
    if(!imagen)return
    setRemovingBg(true)
    try{var res=await removeBackground(imagen,tolerancia,metodoBg);setImagen(res);setBgRemoved(true)}catch (_e){}
    setRemovingBg(false)
  },[imagen,tolerancia,metodoBg])

  var aplicarImagen=function(){
    if(!imagen)return
    if(!zonaActiva&&!modoLibre){setModoLibre(true)}
    setAplicada(true)
  }
  var desaplicarImagen=function(){
    setAplicada(false)
  }

  var selZona=function(zid){
    setZonaActiva(zid);setModoLibre(false)
    if(zonasyMarca.indexOf(zid)<0){var a=zonasyMarca.slice();a.push(zid);setZonasyMarca(a)}
  }

  var cambiarProd=function(id){
    setProducto(id);setZonaActiva(null);setModoLibre(false);setZonasyMarca([]);setPosX(50);setPosY(50);setTelaSeleccionada(null);setAplicada(false);setRotacionY(0);setTiltX(0)
  }

  var reset=function(){setTamano(40);setRotacion(0);setPosX(50);setPosY(50)}

  var clearImg=function(){
    setImagen(null);setZonaActiva(null);setZonasyMarca([]);setBgRemoved(false);setAplicada(false);reset()
    if(fileInputRef.current)fileInputRef.current.value=''
  }

  var resetTilt=function(){setRotacionY(0);setTiltX(0)}

  var handleCanvasDragStart=useCallback(function(e){
    e.preventDefault()
    var clientX=e.touches?e.touches[0].clientX:e.clientX
    var clientY=e.touches?e.touches[0].clientY:e.clientY
    dragStartRef.current={x:clientX,y:clientY,startY:rotacionY,startX:tiltX}
  },[rotacionY,tiltX])

  var handleCanvasDragMove=useCallback(function(e){
    if(!dragStartRef.current)return
    var clientX=e.touches?e.touches[0].clientX:e.clientX
    var clientY=e.touches?e.touches[0].clientY:e.clientY
    var dx=clientX-dragStartRef.current.x
    var dy=clientY-dragStartRef.current.y
    var newY=Math.max(-30,Math.min(30,dragStartRef.current.startY+dx*0.3))
    var newX=Math.max(-20,Math.min(20,dragStartRef.current.startX+dy*0.2))
    setRotacionY(Math.round(newY))
    setTiltX(Math.round(newX))
  },[])

  var handleCanvasDragEnd=useCallback(function(){
    dragStartRef.current=null
  },[])

  useEffect(function(){
    if(is3D)return
    var area=canvasAreaRef.current
    if(!area)return
    var opts={passive:false}
    area.addEventListener('mousedown',handleCanvasDragStart)
    area.addEventListener('touchstart',handleCanvasDragStart,opts)
    window.addEventListener('mousemove',handleCanvasDragMove)
    window.addEventListener('touchmove',handleCanvasDragMove,opts)
    window.addEventListener('mouseup',handleCanvasDragEnd)
    window.addEventListener('touchend',handleCanvasDragEnd)
    return function(){
      area.removeEventListener('mousedown',handleCanvasDragStart)
      area.removeEventListener('touchstart',handleCanvasDragStart)
      window.removeEventListener('mousemove',handleCanvasDragMove)
      window.removeEventListener('touchmove',handleCanvasDragMove)
      window.removeEventListener('mouseup',handleCanvasDragEnd)
      window.removeEventListener('touchend',handleCanvasDragEnd)
    }
  },[handleCanvasDragStart,handleCanvasDragMove,handleCanvasDragEnd,is3D])

  var sendWA=function(){
    if(!aplicada)return
    var prod='producto'
    for(var i=0;i<productos.length;i++){if(productos[i].id===producto){prod=productos[i].nombre;break}}
    var msg='Hola! Quiero un '+prod+' bordado.'
    window.open('https://wa.me/5493454497729?text='+encodeURIComponent(msg),'_blank')
    handleExport()
  }

  var handleExport=function(){
    if(!exportRef.current)return
    var dataUrl=exportRef.current()
    if(!dataUrl)return
    var link=document.createElement('a')
    link.download='hiddent-'+producto+'-diseno.png'
    link.href=dataUrl
    link.click()
  }

  var canvasTransform='perspective(900px) rotateY('+rotacionY+'deg) rotateX('+tiltX+'deg)'
  var textureClass=telaSeleccionada?(telaTextureMap[telaSeleccionada]||''):''

  return React.createElement('section',{id:'disenador',className:'section disenador'},
    React.createElement('h2',{className:'section-title'},'Diseñá tu Bordado'),
    React.createElement('p',{className:'section-subtitle'},'Elegí el artículo, el color, subí tu imagen y elegí donde va el bordado'),

    React.createElement('div',{className:'disenador-top-section'},
      React.createElement('h3',null,'1. Elegí el artículo'),
      React.createElement('div',{className:'producto-selector-full'},productos.map(function(pr){
        return React.createElement('button',{key:pr.id,className:producto===pr.id?'producto-btn active':'producto-btn',style:{'--btn-color':pr.color},onClick:function(){cambiarProd(pr.id)}},pr.nombre)
      }))
    ),

    React.createElement('div',{className:'disenador-top-section'},
      React.createElement('h3',null,'2. Color de tela'),
      React.createElement('div',{className:'color-tela-full'},coloresTela.map(function(c){
        return React.createElement('button',{key:c.id,className:colorTela===c.hex?'color-tela-btn active':'color-tela-btn',style:{'--swatch':c.hex},onClick:function(){setColorTela(c.hex)},title:c.nombre})
      }))
    ),

    React.createElement('div',{className:'disenador-main'},
      React.createElement('div',{className:'disenador-canvas'},
        React.createElement('div',{ref:canvasAreaRef,className:is3D?'canvas-area canvas-area-3d':'canvas-area fabric-mode',style:is3D?undefined:{transform:canvasTransform}},
          is3D
            ? React.createElement(Mochila3D,{
                colorTela:colorTela,telaSeleccionada:telaSeleccionada,imagen:imagen,
                zonaActiva:zonaActiva,modoLibre:modoLibre,
                tamano:tamano,rotacion:rotacion,posX:posX,posY:posY,
                onZoneClick:imagen&&!aplicada?selZona:null,
                zonasyMarca:zonasyMarca,applied:aplicada,
                onExportRef:exportRef
              })
            : React.createElement(FabricCanvas,{
                producto:producto,colorTela:colorTela,imagen:imagen,
                zonaActiva:zonaActiva,modoLibre:modoLibre,
                tamano:tamano,rotacion:rotacion,posX:posX,posY:posY,
                onZoneClick:imagen&&!aplicada?selZona:null,
                zonasyMarca:zonasyMarca,applied:aplicada,
                onExportRef:exportRef
              }),
          !is3D&&textureClass?React.createElement('div',{className:'texture-overlay '+textureClass}):null,
          !is3D&&colorTela&&colorTela!=='#F5F5F5'?React.createElement('div',{className:'color-tint-overlay'+(colorTela==='#1A1A1A'?' negro':''),style:{backgroundColor:colorTela}}):null,
          !imagen?React.createElement('div',{className:'canvas-hint'},React.createElement(FiUpload,{size:24}),React.createElement('p',null,'Subí tu imagen para empezar')):null,
          imagen&&!zonaActiva&&!modoLibre&&!aplicada?React.createElement('div',{className:'canvas-hint'},React.createElement('p',null,'Haz clic en una zona del producto')):null,
          React.createElement('div',{className:'canvas-tilt-hint'},aplicada?'Bordado aplicado':is3D&&imagen?'Arrastrá la mochila para girarla':modoLibre&&imagen?'Arrastrá para mover el diseño':'Elegí una zona para tu bordado')
        ),
        imagen?React.createElement('div',{className:'disenador-send-row'},
          React.createElement('button',{className:'btn btn-whatsapp disenador-send'+(aplicada?'':' is-disabled'),onClick:sendWA,disabled:!aplicada},'Enviar diseño por WhatsApp'),
          React.createElement('button',{className:'btn btn-outline disenador-export',onClick:handleExport},React.createElement(FiDownload,{size:14}),' Descargar PNG'),
          React.createElement('p',{className:'send-hint'},aplicada?'El diseño se descarga en PNG para que lo adjuntes al chat':'Primero tocá "Aplicar bordado" para poder enviarlo')
        ):null
      ),

      React.createElement('div',{className:'disenador-panel'},
        React.createElement('div',{className:'panel-section'},
          React.createElement('h3',null,'3. Subí tu imagen'),
          React.createElement('div',{className:'upload-zone'+(imagen?' has-image':''),onClick:function(){fileInputRef.current&&fileInputRef.current.click()},onDrop:handleDrop,onDragOver:function(e){e.preventDefault()}},
            imagen?React.createElement('img',{src:imagen,alt:'diseno',className:'upload-preview'}):
              React.createElement(React.Fragment,null,React.createElement(FiUpload,{size:32}),React.createElement('p',null,'Haz clic o arrastra tu imagen'),React.createElement('span',null,'JPG, PNG, SVG'))
          ),
          React.createElement('input',{ref:fileInputRef,type:'file',accept:'image/*',onChange:handleUpload,hidden:true}),
          imagen?React.createElement('div',{className:'upload-actions'},
            React.createElement('button',{className:'btn-clear',onClick:clearImg},React.createElement(FiTrash2,{size:14}),' Quitar'),
            React.createElement('button',{className:'btn-bg-remove'+(removingBg?' loading':''),onClick:handleRemoveBg,disabled:removingBg},
              React.createElement(FiImage,{size:14}),removingBg?' Procesando...':bgRemoved?' Re-quitar fondo':' Quitar fondo')
          ):null,
          imagen?React.createElement('div',{className:'bgmethod-selector'},
            React.createElement('button',{type:'button',className:'bgmethod-btn'+(metodoBg==='edge'?' active':''),onClick:function(){setMetodoBg('edge')}},React.createElement(FiZap,{size:12}),' Simple'),
            React.createElement('button',{type:'button',className:'bgmethod-btn'+(metodoBg==='flood'?' active':''),onClick:function(){setMetodoBg('flood')}},React.createElement(FiZap,{size:12}),' Inteligente')
          ):null,
          imagen?React.createElement('div',{className:'tolerancia-control'},
            React.createElement('label',null,'Tolerancia: '+tolerancia+'%'),
            React.createElement('input',{type:'range',min:'5',max:'80',value:tolerancia,onChange:function(e){setTolerancia(Number(e.target.value))}})
          ):null
        ),
        React.createElement('div',{className:'panel-section controls'},
          React.createElement('h3',null,'4. Rotar y ubicar'),
          is3D?React.createElement('p',{className:'vista3d-hint'},'Arrastrá la mochila para girarla y mirar cada parte en 3D'):null,
          !is3D?React.createElement('div',{className:'control-group'},React.createElement('label',null,React.createElement(FiRotateCw,{size:14}),' Rotar vista'),React.createElement('input',{type:'range',min:'-30',max:'30',value:rotacionY,onChange:function(e){setRotacionY(Number(e.target.value))}}),React.createElement('span',null,rotacionY+'°')):null,
          !is3D?React.createElement('div',{className:'control-group'},React.createElement('label',null,' Inclinar'),React.createElement('input',{type:'range',min:'-20',max:'20',value:tiltX,onChange:function(e){setTiltX(Number(e.target.value))}}),React.createElement('span',null,tiltX+'°')):null,
          !is3D&&(rotacionY!==0||tiltX!==0)?React.createElement('button',{className:'btn btn-outline btn-small',onClick:resetTilt},'Restaurar vista'):null,
          imagen?React.createElement('hr',{className:'panel-divider'}):null,
          imagen&&!aplicada?React.createElement(React.Fragment,null,
            React.createElement('div',{className:'zonas-selector'},
              zonas.map(function(z){return React.createElement('button',{key:z.id,className:'zona-btn'+(zonaActiva===z.id?' active':'')+(zonasyMarca.indexOf(z.id)>=0&&zonaActiva!==z.id?' marcada':''),onClick:function(){selZona(z.id)}},zonasyMarca.indexOf(z.id)>=0?React.createElement(FiSliders,{size:12}):null,' '+z.label)}),
              React.createElement('button',{className:'zona-btn libre-btn'+(modoLibre?' active':''),onClick:function(){setModoLibre(true);setZonaActiva(null)}},React.createElement(FiSliders,{size:12}),' Posición libre')
            ),
            React.createElement('div',{className:'control-group'},React.createElement('label',null,React.createElement(FiMaximize2,{size:14}),' Tamaño'),React.createElement('input',{type:'range',min:'10',max:'80',value:tamano,onChange:function(e){setTamano(Number(e.target.value))}}),React.createElement('span',null,tamano+'%')),
            React.createElement('div',{className:'control-group'},React.createElement('label',null,React.createElement(FiRotateCw,{size:14}),' Rotación'),React.createElement('input',{type:'range',min:'-180',max:'180',value:rotacion,onChange:function(e){setRotacion(Number(e.target.value))}}),React.createElement('span',null,rotacion)),
            modoLibre?React.createElement(React.Fragment,null,
              React.createElement('div',{className:'control-group'},React.createElement('label',null,'X'),React.createElement('input',{type:'range',min:'0',max:'100',value:posX,onChange:function(e){setPosX(Number(e.target.value))}}),React.createElement('span',null,Math.round(posX)+'%')),
              React.createElement('div',{className:'control-group'},React.createElement('label',null,'Y'),React.createElement('input',{type:'range',min:'0',max:'100',value:posY,onChange:function(e){setPosY(Number(e.target.value))}}),React.createElement('span',null,Math.round(posY)+'%'))
            ):null,
            React.createElement('button',{className:'btn btn-outline btn-small',onClick:reset},'Restablecer')
          ):null,
          imagen?React.createElement('button',{className:'disenador-apply'+(aplicada?' aplicada':''),onClick:aplicada?desaplicarImagen:aplicarImagen},aplicada?'Desaplicar bordado':'Aplicar bordado'):null
        )
      )
    ),

    React.createElement('div',{className:'telas-section'},
      React.createElement('h3',{className:'telas-title'},'Material recomendado'),
      React.createElement('div',{className:'telas-grid'},(telasData[producto]||[]).map(function(tela){
        return React.createElement('div',{key:tela.id,className:'tela-card'+(telaSeleccionada===tela.id?' active':''),onClick:function(){setTelaSeleccionada(telaSeleccionada===tela.id?null:tela.id)}},
          React.createElement('strong',null,tela.nombre),
          React.createElement('span',{className:'tela-desc'},tela.desc)
        )
      }))
    )
  )
}

import React, { useState, useRef, useCallback } from 'react'
import { FiUpload, FiTrash2, FiRotateCw, FiMaximize2, FiSliders, FiImage } from 'react-icons/fi'
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
    { id: 'centro', label: 'Centro frontal', x: 50, y: 40, size: 35, skewX: 0, skewY: 0 },
    { id: 'bolsillo', label: 'Bolsillo frontal', x: 50, y: 62, size: 22, skewX: 0, skewY: 2 },
    { id: 'tapa', label: 'Tapa superior', x: 50, y: 18, size: 20, skewX: 0, skewY: -3 },
  ],
  yerbera: [
    { id: 'centro', label: 'Centro frontal', x: 50, y: 45, size: 35, skewX: 0, skewY: 0 },
    { id: 'tapa', label: 'Tapa', x: 50, y: 20, size: 25, skewX: 0, skewY: -2 },
  ],
  bolso: [
    { id: 'centro', label: 'Centro', x: 50, y: 48, size: 30, skewX: 0, skewY: 0 },
    { id: 'bolsillo', label: 'Bolsillo frontal', x: 50, y: 68, size: 22, skewX: 0, skewY: 2 },
  ],
  botinera: [
    { id: 'izquierdo', label: 'Lado izquierdo', x: 25, y: 52, size: 22, skewX: 3, skewY: 0 },
    { id: 'derecho', label: 'Lado derecho', x: 75, y: 52, size: 22, skewX: -3, skewY: 0 },
    { id: 'centro', label: 'Tapa central', x: 50, y: 28, size: 20, skewX: 0, skewY: 0 },
  ],
  gorra: [
    { id: 'frente', label: 'Frente', x: 50, y: 38, size: 30, skewX: 0, skewY: -4 },
    { id: 'costado', label: 'Costado', x: 78, y: 38, size: 22, skewX: 8, skewY: -2 },
  ],
  estuche: [
    { id: 'centro', label: 'Centro', x: 50, y: 40, size: 30, skewX: 0, skewY: 0 },
    { id: 'inferior', label: 'Parte inferior', x: 50, y: 68, size: 22, skewX: 0, skewY: 2 },
  ],
  cartera: [
    { id: 'centro', label: 'Centro frontal', x: 50, y: 45, size: 28, skewX: 0, skewY: 0 },
    { id: 'bolsillo', label: 'Bolsillo', x: 50, y: 68, size: 20, skewX: 0, skewY: 2 },
  ],
}

var telasData = {
  mochila: [
    { id: 'nylon600', nombre: 'Nylon 600D', desc: 'Resistente al agua, ideal para uso diario. La más vendida.' },
    { id: 'poliester', nombre: 'Poliester 300D', desc: 'Liviano y económico, fácil de limpiar.' },
    { id: 'cuero_sint', nombre: 'Cuero Sintetico PU', desc: 'Look premium, perfecto para regalos.' },
    { id: 'lona', nombre: 'Lona 12oz', desc: 'Textura natural, muy resistente. Estilo casual.' },
    { id: 'malla', nombre: 'Malla Traspirable', desc: 'Para mochilas deportivas. Circulacion de aire.' },
  ],
  yerbera: [
    { id: 'lona12', nombre: 'Lona 12oz', desc: 'La clásica. Sujeta bien, textura rugosa para bordado.' },
    { id: 'nylon600', nombre: 'Nylon 600D', desc: 'Impermeable, protege la yerba de la humedad.' },
    { id: 'cuero_sint', nombre: 'Cuero Sintetico PU', desc: 'Look elegante. Superficie lisa para bordado fino.' },
    { id: 'polar', nombre: 'Polar Termico', desc: 'Mantiene temperatura.' },
    { id: 'tela_imp', nombre: 'Tela Impermeable', desc: 'Protección total contra derrames.' },
  ],
  bolso: [
    { id: 'lona', nombre: 'Lona 10oz', desc: 'Textura natural, resistente.' },
    { id: 'cuero_sint', nombre: 'Cuero Sintetico PU', desc: 'Elegancia accesible.' },
    { id: 'algodon', nombre: 'Algodon Canvas', desc: 'Eco-friendly, transpirable.' },
    { id: 'nylon', nombre: 'Nylon Ripstop', desc: 'Ultra resistente a rasgaduras.' },
    { id: 'poliester', nombre: 'Poliester Oxford', desc: 'Impermeable, liviano.' },
  ],
  botinera: [
    { id: 'nylon600', nombre: 'Nylon 600D', desc: 'La más común. Resistente e impermeable.' },
    { id: 'lona16', nombre: 'Lona 16oz', desc: 'La más gruesa. Para uso industrial pesado.' },
    { id: 'cuero_sint', nombre: 'Cuero Sintetico PU', desc: 'Look premium, bordado nito.' },
    { id: 'pvc', nombre: 'PVC Lavable', desc: 'Se limpia con agua.' },
    { id: 'poliester', nombre: 'Poliester 600D', desc: 'Buena relacion calidad-precio.' },
  ],
  gorra: [
    { id: 'algodon', nombre: 'Algodon Peinado', desc: 'La clásica. Transpirable, cómoda.' },
    { id: 'poliester', nombre: 'Poliester Tricot', desc: 'Secado rápido, colores vivos.' },
    { id: 'mezclilla', nombre: 'Mezclilla', desc: 'Estilo retro/casual. Textura única.' },
    { id: 'nylon', nombre: 'Nylon Malla', desc: 'Muy liviana, para modelos trucker.' },
    { id: 'polar', nombre: 'Polar Flis', desc: 'Para gorras de invierno.' },
  ],
  estuche: [
    { id: 'lona', nombre: 'Lona 10oz', desc: 'Rigidez media, protege bien.' },
    { id: 'neoprene', nombre: 'Neoprene 3mm', desc: 'Absorbe golpes. Ideal para electrónicos.' },
    { id: 'poliester', nombre: 'Poliester 300D', desc: 'Liviano y resistente a manchas.' },
    { id: 'nylon', nombre: 'Nylon 420D', desc: 'Impermeable, liviano.' },
    { id: 'cuero_sint', nombre: 'Cuero Sintetico PU', desc: 'Look elegante.' },
  ],
  cartera: [
    { id: 'cuero_sint', nombre: 'Cuero Sintetico PU', desc: 'La más elegante.' },
    { id: 'lona', nombre: 'Lona 12oz', desc: 'Casual y resistente.' },
    { id: 'algodon', nombre: 'Algodon Canvas', desc: 'Eco-friendly, textura natural.' },
    { id: 'nylon', nombre: 'Nylon 420D', desc: 'Liviana, impermeable.' },
    { id: 'pvc', nombre: 'PVC Transparente', desc: 'Moderno, se ve el contenido.' },
  ],
}

var fabricClassMap = {
  nylon600:'ft-nylon',nylon420:'ft-ripstop',nylon:'ft-ripstop',
  poliester:'ft-poliester',cuero_sint:'ft-leather',
  lona:'ft-canvas',lona12:'ft-canvas',lona10:'ft-canvas-light',lona16:'ft-canvas-heavy',
  malla:'ft-mesh',algodon:'ft-cotton',mezclilla:'ft-denim',
  polar:'ft-polar',neoprene:'ft-neoprene',pvc:'ft-glossy',tela_imp:'ft-waterproof',
}

function darkenHex(hex, factor) {
  try {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
    return '#'+[Math.round(r*factor),Math.round(g*factor),Math.round(b*factor)].map(function(v){return Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')}).join('')
  } catch(e) { return '#222' }
}

function calcColors(hex) {
  try {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
    var h = function(rr,gg,bb){return '#'+[rr,gg,bb].map(function(v){return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')}).join('')}
    return {
      base: hex,
      lighter: h(r+(255-r)*0.28, g+(255-g)*0.28, b+(255-b)*0.28),
      darker: h(r*0.78, g*0.78, b*0.78),
      darkest: h(r*0.58, g*0.58, b*0.58),
      edge: h(r*0.42, g*0.42, b*0.42)
    }
  } catch(e) { return {base:'#555',lighter:'#888',darker:'#444',darkest:'#222',edge:'#111'} }
}

function makeFabricSVGPattern(uid, telaId) {
  if(!telaId) return null
  var p=uid+'fab'
  var ft=fabricClassMap[telaId]||''
  var W=React.createElement, P='pattern'
  switch(ft){
    case 'ft-nylon': return W(P,{id:p,patternUnits:'userSpaceOnUse',width:'4',height:'8'},W('rect',{width:'4',height:'2',y:'1',fill:'rgba(255,255,255,0.22)'}),W('line',{x1:'0',y1:'0',x2:'0',y2:'8',stroke:'rgba(0,0,0,0.06)',strokeWidth:'0.4'}))
    case 'ft-poliester': return W(P,{id:p,patternUnits:'userSpaceOnUse',width:'4',height:'4'},W('rect',{width:'4',height:'0.5',y:'2',fill:'rgba(255,255,255,0.15)'}),W('line',{x1:'2',y1:'0',x2:'2',y2:'4',stroke:'rgba(0,0,0,0.1)',strokeWidth:'0.3'}))
    case 'ft-leather': return W(P,{id:p,patternUnits:'userSpaceOnUse',width:'16',height:'14'},W('circle',{cx:'4',cy:'5',r:'2',fill:'rgba(0,0,0,0.22)'}),W('circle',{cx:'10',cy:'3',r:'1.5',fill:'rgba(255,255,255,0.12)'}),W('circle',{cx:'6',cy:'11',r:'2',fill:'rgba(0,0,0,0.18)'}))
    case 'ft-canvas': case 'ft-canvas-heavy': case 'ft-canvas-light': return W(P,{id:p,patternUnits:'userSpaceOnUse',width:'4',height:'4'},W('line',{x1:'0',y1:'0',x2:'0',y2:'4',stroke:'rgba(255,255,255,0.18)',strokeWidth:'0.6'}),W('line',{x1:'0',y1:'2',x2:'4',y2:'2',stroke:'rgba(0,0,0,0.14)',strokeWidth:'0.6'}))
    case 'ft-mesh': return W(P,{id:p,patternUnits:'userSpaceOnUse',width:'7',height:'7'},W('circle',{cx:'3.5',cy:'3.5',r:'2.2',fill:'rgba(0,0,0,0.35)'}))
    case 'ft-cotton': return W(P,{id:p,patternUnits:'userSpaceOnUse',width:'5',height:'5',patternTransform:'rotate(45)'},W('line',{x1:'0',y1:'2.5',x2:'5',y2:'2.5',stroke:'rgba(255,255,255,0.16)',strokeWidth:'0.5'}))
    case 'ft-denim': return W(P,{id:p,patternUnits:'userSpaceOnUse',width:'4',height:'4',patternTransform:'rotate(-45)'},W('line',{x1:'0',y1:'2',x2:'4',y2:'2',stroke:'rgba(255,255,255,0.22)',strokeWidth:'0.7'}))
    case 'ft-ripstop': return W(P,{id:p,patternUnits:'userSpaceOnUse',width:'5',height:'5'},W('line',{x1:'0',y1:'0',x2:'0',y2:'5',stroke:'rgba(255,255,255,0.15)',strokeWidth:'0.4'}),W('line',{x1:'0',y1:'0',x2:'5',y2:'0',stroke:'rgba(255,255,255,0.15)',strokeWidth:'0.4'}),W('line',{x1:'0',y1:'0',x2:'5',y2:'5',stroke:'rgba(255,255,255,0.08)',strokeWidth:'0.3'}))
    case 'ft-polar': return W(P,{id:p,patternUnits:'userSpaceOnUse',width:'6',height:'6'},W('circle',{cx:'2',cy:'2',r:'1.2',fill:'rgba(255,255,255,0.22)'}),W('circle',{cx:'5',cy:'5',r:'0.8',fill:'rgba(0,0,0,0.1)'}))
    case 'ft-neoprene': return W(P,{id:p,patternUnits:'userSpaceOnUse',width:'5',height:'5'},W('circle',{cx:'2.5',cy:'2.5',r:'0.8',fill:'rgba(0,0,0,0.14)'}))
    case 'ft-glossy': case 'ft-waterproof': return W(P,{id:p,patternUnits:'userSpaceOnUse',width:'14',height:'14',patternTransform:'rotate(135)'},W('rect',{width:'14',height:'3',fill:'rgba(255,255,255,0.15)'}))
    default: return null
  }
}

function removeImageBg(dataUrl, tolerance) {
  return new Promise(function(resolve) {
    var img = new Image()
    img.onload = function() {
      var c = document.createElement('canvas')
      c.width = img.width; c.height = img.height
      var ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)
      var d = ctx.getImageData(0, 0, c.width, c.height)
      var px = d.data
      var edge = {}
      for (var x = 0; x < c.width; x++) {
        var i1=(x*c.height)*4, i2=(x*c.height+c.height-1)*4
        var k1=px[i1]+','+px[i1+1]+','+px[i1+2], k2=px[i2]+','+px[i2+1]+','+px[i2+2]
        edge[k1]=(edge[k1]||0)+1; edge[k2]=(edge[k2]||0)+1
      }
      for (var y = 0; y < c.height; y++) {
        var i1=y*4, i2=((c.width-1)*c.height+y)*4
        var k1=px[i1]+','+px[i1+1]+','+px[i1+2], k2=px[i2]+','+px[i2+1]+','+px[i2+2]
        edge[k1]=(edge[k1]||0)+1; edge[k2]=(edge[k2]||0)+1
      }
      var bgKey='',bgCount=0
      for(var k in edge){if(edge[k]>bgCount){bgCount=edge[k];bgKey=k}}
      var bgp=bgKey.split(',')
      var bgR=parseInt(bgp[0]),bgG=parseInt(bgp[1]),bgB=parseInt(bgp[2])
      var t=tolerance*2.55
      for(var i=0;i<px.length;i+=4){
        var dr=px[i]-bgR,dg=px[i+1]-bgG,db=px[i+2]-bgB
        if(Math.sqrt(dr*dr+dg*dg+db*db)<t)px[i+3]=0
      }
      ctx.putImageData(d,0,0)
      resolve(c.toDataURL('image/png'))
    }
    img.src = dataUrl
  })
}

function SVGFrontProduct(props) {
  var pid=props.pid,fb=props.fb,selZ=props.selZ,onZC=props.onZC,zm=props.zm||[],telaId=props.telaId||null
  var zonas=zonasPorProducto[pid]||[]
  var c=calcColors(fb),u=pid.slice(0,2)
  var fabP=makeFabricSVGPattern(u,telaId)
  var s=[]

  s.push(React.createElement('defs',{key:'d'},
    React.createElement('linearGradient',{id:u+'F',x1:'0',y1:'0',x2:'0',y2:'1'},
      React.createElement('stop',{offset:'0%',stopColor:c.lighter}),
      React.createElement('stop',{offset:'100%',stopColor:c.base})),
    React.createElement('linearGradient',{id:u+'S',x1:'0',y1:'0',x2:'1',y2:'0'},
      React.createElement('stop',{offset:'0%',stopColor:c.darker}),
      React.createElement('stop',{offset:'100%',stopColor:c.darkest})),
    React.createElement('linearGradient',{id:u+'T',x1:'0',y1:'1',x2:'0.3',y2:'0'},
      React.createElement('stop',{offset:'0%',stopColor:c.base}),
      React.createElement('stop',{offset:'100%',stopColor:c.lighter})),
    fabP
  ))

  if(pid==='mochila'){
    var sd='M207,82 L234,64 L234,340 L207,358 Z'
    s.push(React.createElement('path',{key:'rs',d:sd,fill:'url(#'+u+'S)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'rso',d:sd,fill:'url(#'+u+'fab)',opacity:'0.6'}))
    s.push(React.createElement('line',{key:'rsst',x1:'220',y1:'90',x2:'220',y2:'328',stroke:c.edge,strokeWidth:'0.7',opacity:'0.35',strokeDasharray:'3 4'}))
    var td='M58,82 L95,64 L234,64 L207,82 Z'
    s.push(React.createElement('path',{key:'tf',d:td,fill:'url(#'+u+'T)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'tfo',d:td,fill:'url(#'+u+'fab)',opacity:'0.5'}))
    s.push(React.createElement('line',{key:'tz',x1:'108',y1:'73',x2:'224',y2:'73',stroke:c.edge,strokeWidth:'0.8',opacity:'0.4',strokeDasharray:'2 2'}))
    var fd='M58,82 H195 Q207,82 207,94 V346 Q207,358 195,358 H58 Q46,358 46,346 V94 Q46,82 58,82 Z'
    s.push(React.createElement('path',{key:'ff',d:fd,fill:'url(#'+u+'F)',stroke:c.edge,strokeWidth:'1.5'}))
    if(fabP)s.push(React.createElement('path',{key:'ffo',d:fd,fill:'url(#'+u+'fab)',opacity:'0.65'}))
    s.push(React.createElement('line',{key:'ucl',x1:'58',y1:'148',x2:'207',y2:'148',stroke:c.edge,strokeWidth:'1.2',opacity:'0.5'}))
    s.push(React.createElement('circle',{key:'zp',cx:'130',cy:'148',r:'4.5',fill:'#888',stroke:'#666',strokeWidth:'1'}))
    s.push(React.createElement('circle',{key:'zph',cx:'130',cy:'148',r:'1.5',fill:'#aaa'}))
    s.push(React.createElement('rect',{key:'pk',x:'72',y:'218',width:'108',height:'72',rx:'5',fill:c.darker,stroke:c.edge,strokeWidth:'1',opacity:'0.85'}))
    s.push(React.createElement('line',{key:'pkz',x1:'72',y1:'218',x2:'180',y2:'218',stroke:c.edge,strokeWidth:'1.5'}))
    s.push(React.createElement('circle',{key:'pkp',cx:'126',cy:'218',r:'3.5',fill:'#888'}))
    s.push(React.createElement('rect',{key:'pks',x:'74',y:'290',width:'104',height:'2',rx:'1',fill:'rgba(0,0,0,0.1)'}))
    s.push(React.createElement('path',{key:'bt',d:'M58,342 H195 V358 H58 Z',fill:c.darker,opacity:'0.2'}))
    s.push(React.createElement('path',{key:'stl',d:'M90,82 C88,140 86,220 83,358',stroke:c.darkest,strokeWidth:'7',fill:'none',strokeLinecap:'round',opacity:'0.9'}))
    s.push(React.createElement('path',{key:'str',d:'M170,82 C172,140 174,220 177,358',stroke:c.darkest,strokeWidth:'7',fill:'none',strokeLinecap:'round',opacity:'0.9'}))
    s.push(React.createElement('path',{key:'slh',d:'M88,120 C87,155 86,190 85,220',stroke:c.lighter,strokeWidth:'1.8',fill:'none',opacity:'0.12',strokeLinecap:'round'}))
    s.push(React.createElement('path',{key:'srh',d:'M172,120 C173,155 174,190 175,220',stroke:c.lighter,strokeWidth:'1.8',fill:'none',opacity:'0.12',strokeLinecap:'round'}))
    s.push(React.createElement('path',{key:'hd',d:'M112,64 Q112,44 130,40 Q148,40 148,44 L148,64',fill:'none',stroke:c.edge,strokeWidth:'4',strokeLinecap:'round'}))
    s.push(React.createElement('path',{key:'hdh',d:'M114,64 Q114,46 130,42 Q146,42 146,46 L146,64',fill:'none',stroke:c.lighter,strokeWidth:'1.5',opacity:'0.18',strokeLinecap:'round'}))
  }else if(pid==='bolso'){
    var sd='M195,100 L225,85 L225,345 L195,358 Z'
    s.push(React.createElement('path',{key:'rs',d:sd,fill:'url(#'+u+'S)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'rso',d:sd,fill:'url(#'+u+'fab)',opacity:'0.6'}))
    var td='M55,100 L85,85 L225,85 L195,100 Z'
    s.push(React.createElement('path',{key:'tf',d:td,fill:'url(#'+u+'T)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'tfo',d:td,fill:'url(#'+u+'fab)',opacity:'0.5'}))
    s.push(React.createElement('rect',{key:'ff',x:'55',y:'100',width:'140',height:'258',rx:'12',fill:'url(#'+u+'F)',stroke:c.edge,strokeWidth:'1.5'}))
    if(fabP)s.push(React.createElement('rect',{key:'ffo',x:'55',y:'100',width:'140',height:'258',rx:'12',fill:'url(#'+u+'fab)',opacity:'0.65'}))
    s.push(React.createElement('path',{key:'hd',d:'M95,100 Q95,55 125,48 Q155,48 155,100',fill:'none',stroke:c.edge,strokeWidth:'4',strokeLinecap:'round'}))
    s.push(React.createElement('rect',{key:'pk',x:'70',y:'210',width:'110',height:'80',rx:'6',fill:c.darker,stroke:c.edge,strokeWidth:'1',opacity:'0.8'}))
    s.push(React.createElement('line',{key:'pkz',x1:'70',y1:'210',x2:'180',y2:'210',stroke:c.edge,strokeWidth:'1.5'}))
    s.push(React.createElement('circle',{key:'pkp',cx:'125',cy:'210',r:'3.5',fill:'#888'}))
    s.push(React.createElement('path',{key:'btp',d:'M55,338 H195 V358 H55 Z',fill:c.darker,opacity:'0.2'}))
  }else if(pid==='yerbera'){
    var sd='M195,65 L225,50 L225,335 L195,348 Z'
    s.push(React.createElement('path',{key:'rs',d:sd,fill:'url(#'+u+'S)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'rso',d:sd,fill:'url(#'+u+'fab)',opacity:'0.6'}))
    var td='M55,65 L85,50 L225,50 L195,65 Z'
    s.push(React.createElement('path',{key:'tf',d:td,fill:'url(#'+u+'T)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'tfo',d:td,fill:'url(#'+u+'fab)',opacity:'0.5'}))
    s.push(React.createElement('rect',{key:'ff',x:'55',y:'65',width:'140',height:'283',rx:'8',fill:'url(#'+u+'F)',stroke:c.edge,strokeWidth:'1.5'}))
    if(fabP)s.push(React.createElement('rect',{key:'ffo',x:'55',y:'65',width:'140',height:'283',rx:'8',fill:'url(#'+u+'fab)',opacity:'0.65'}))
    s.push(React.createElement('rect',{key:'lid',x:'55',y:'65',width:'140',height:'32',rx:'8',fill:c.darker,stroke:c.edge,strokeWidth:'1',opacity:'0.7'}))
    s.push(React.createElement('line',{key:'lz',x1:'55',y1:'97',x2:'195',y2:'97',stroke:c.edge,strokeWidth:'1.5'}))
    s.push(React.createElement('circle',{key:'lp',cx:'125',cy:'97',r:'4',fill:'#888',stroke:'#666',strokeWidth:'1'}))
    s.push(React.createElement('rect',{key:'lbl',x:'85',y:'160',width:'80',height:'50',rx:'4',fill:c.darker,stroke:c.edge,strokeWidth:'0.8',opacity:'0.6'}))
    s.push(React.createElement('path',{key:'btp',d:'M55,332 H195 V348 H55 Z',fill:c.darker,opacity:'0.2'}))
  }else if(pid==='botinera'){
    var sd='M205,110 L235,95 L235,330 L205,343 Z'
    s.push(React.createElement('path',{key:'rs',d:sd,fill:'url(#'+u+'S)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'rso',d:sd,fill:'url(#'+u+'fab)',opacity:'0.6'}))
    var td='M45,110 L75,95 L235,95 L205,110 Z'
    s.push(React.createElement('path',{key:'tf',d:td,fill:'url(#'+u+'T)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'tfo',d:td,fill:'url(#'+u+'fab)',opacity:'0.5'}))
    s.push(React.createElement('rect',{key:'ff',x:'45',y:'110',width:'160',height:'233',rx:'10',fill:'url(#'+u+'F)',stroke:c.edge,strokeWidth:'1.5'}))
    if(fabP)s.push(React.createElement('rect',{key:'ffo',x:'45',y:'110',width:'160',height:'233',rx:'10',fill:'url(#'+u+'fab)',opacity:'0.65'}))
    s.push(React.createElement('path',{key:'zip',d:'M45,155 H205',stroke:c.edge,strokeWidth:'2',strokeDasharray:'4 3'}))
    s.push(React.createElement('circle',{key:'zpp',cx:'125',cy:'155',r:'5',fill:'#888',stroke:'#666',strokeWidth:'1.5'}))
    s.push(React.createElement('rect',{key:'lp',x:'60',y:'190',width:'55',height:'65',rx:'4',fill:c.darker,stroke:c.edge,strokeWidth:'0.8',opacity:'0.7'}))
    s.push(React.createElement('rect',{key:'rp',x:'140',y:'190',width:'55',height:'65',rx:'4',fill:c.darker,stroke:c.edge,strokeWidth:'0.8',opacity:'0.7'}))
    s.push(React.createElement('path',{key:'btp',d:'M45,328 H205 V343 H45 Z',fill:c.darker,opacity:'0.2'}))
  }else if(pid==='gorra'){
    var sd='M198,250 L198,160 Q205,112 218,102 L235,102 Q228,115 225,160 L225,238 Z'
    s.push(React.createElement('path',{key:'rs',d:sd,fill:'url(#'+u+'S)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'rso',d:sd,fill:'url(#'+u+'fab)',opacity:'0.6'}))
    var bd='M55,250 Q48,260 35,275 Q26,292 55,300 L178,300 Q205,292 205,275 Q200,260 198,250 Z'
    s.push(React.createElement('path',{key:'brim',d:bd,fill:c.darker,stroke:c.edge,strokeWidth:'1.5'}))
    if(fabP)s.push(React.createElement('path',{key:'brimo',d:bd,fill:'url(#'+u+'fab)',opacity:'0.5'}))
    s.push(React.createElement('path',{key:'brimund',d:'M35,275 Q26,292 55,300 L178,300 Q205,292 205,275',fill:'none',stroke:c.edge,strokeWidth:'1',opacity:'0.3'}))
    var fd='M55,250 L55,165 Q55,108 130,98 Q198,108 198,165 L198,250 Z'
    s.push(React.createElement('path',{key:'ff',d:fd,fill:'url(#'+u+'F)',stroke:c.edge,strokeWidth:'1.5'}))
    if(fabP)s.push(React.createElement('path',{key:'ffo',d:fd,fill:'url(#'+u+'fab)',opacity:'0.65'}))
    s.push(React.createElement('path',{key:'sm1',d:'M130,98 Q128,170 130,250',stroke:c.edge,strokeWidth:'0.8',opacity:'0.4',fill:'none'}))
    s.push(React.createElement('path',{key:'sm2',d:'M130,98 Q162,150 175,250',stroke:c.edge,strokeWidth:'0.8',opacity:'0.3',fill:'none'}))
    s.push(React.createElement('path',{key:'sm3',d:'M130,98 Q98,150 85,250',stroke:c.edge,strokeWidth:'0.8',opacity:'0.3',fill:'none'}))
    s.push(React.createElement('circle',{key:'btn',cx:'130',cy:'98',r:'5',fill:c.darker,stroke:c.edge,strokeWidth:'1'}))
    s.push(React.createElement('circle',{key:'ey1',cx:'100',cy:'168',r:'2.5',fill:'none',stroke:c.edge,strokeWidth:'0.7',opacity:'0.3'}))
    s.push(React.createElement('circle',{key:'ey2',cx:'160',cy:'168',r:'2.5',fill:'none',stroke:c.edge,strokeWidth:'0.7',opacity:'0.3'}))
    s.push(React.createElement('circle',{key:'ey3',cx:'100',cy:'200',r:'2.5',fill:'none',stroke:c.edge,strokeWidth:'0.7',opacity:'0.3'}))
    s.push(React.createElement('circle',{key:'ey4',cx:'160',cy:'200',r:'2.5',fill:'none',stroke:c.edge,strokeWidth:'0.7',opacity:'0.3'}))
    s.push(React.createElement('rect',{key:'stp',x:'216',y:'218',width:'10',height:'16',rx:'2',fill:c.darker,stroke:c.edge,strokeWidth:'0.8',opacity:'0.5'}))
  }else if(pid==='estuche'){
    var sd='M200,80 L230,65 L230,330 L200,343 Z'
    s.push(React.createElement('path',{key:'rs',d:sd,fill:'url(#'+u+'S)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'rso',d:sd,fill:'url(#'+u+'fab)',opacity:'0.6'}))
    var td='M50,80 L80,65 L230,65 L200,80 Z'
    s.push(React.createElement('path',{key:'tf',d:td,fill:'url(#'+u+'T)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'tfo',d:td,fill:'url(#'+u+'fab)',opacity:'0.5'}))
    s.push(React.createElement('rect',{key:'ff',x:'50',y:'80',width:'150',height:'263',rx:'10',fill:'url(#'+u+'F)',stroke:c.edge,strokeWidth:'1.5'}))
    if(fabP)s.push(React.createElement('rect',{key:'ffo',x:'50',y:'80',width:'150',height:'263',rx:'10',fill:'url(#'+u+'fab)',opacity:'0.65'}))
    s.push(React.createElement('line',{key:'zip',x1:'50',y1:'200',x2:'200',y2:'200',stroke:c.edge,strokeWidth:'2',strokeDasharray:'4 3'}))
    s.push(React.createElement('circle',{key:'zpp',cx:'125',cy:'200',r:'5',fill:'#888',stroke:'#666',strokeWidth:'1.5'}))
    s.push(React.createElement('path',{key:'hd',d:'M85,80 Q85,55 125,48 Q165,55 165,80',fill:'none',stroke:c.edge,strokeWidth:'3.5',strokeLinecap:'round'}))
    s.push(React.createElement('path',{key:'btp',d:'M50,330 H200 V343 H50 Z',fill:c.darker,opacity:'0.2'}))
  }else if(pid==='cartera'){
    var sd='M198,75 L228,60 L228,335 L198,348 Z'
    s.push(React.createElement('path',{key:'rs',d:sd,fill:'url(#'+u+'S)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'rso',d:sd,fill:'url(#'+u+'fab)',opacity:'0.6'}))
    var td='M52,75 L82,60 L228,60 L198,75 Z'
    s.push(React.createElement('path',{key:'tf',d:td,fill:'url(#'+u+'T)',stroke:c.edge,strokeWidth:'1'}))
    if(fabP)s.push(React.createElement('path',{key:'tfo',d:td,fill:'url(#'+u+'fab)',opacity:'0.5'}))
    s.push(React.createElement('rect',{key:'ff',x:'52',y:'75',width:'146',height:'273',rx:'8',fill:'url(#'+u+'F)',stroke:c.edge,strokeWidth:'1.5'}))
    if(fabP)s.push(React.createElement('rect',{key:'ffo',x:'52',y:'75',width:'146',height:'273',rx:'8',fill:'url(#'+u+'fab)',opacity:'0.65'}))
    s.push(React.createElement('line',{key:'cl',x1:'52',y1:'185',x2:'198',y2:'185',stroke:c.edge,strokeWidth:'2.5'}))
    s.push(React.createElement('circle',{key:'clp',cx:'125',cy:'185',r:'8',fill:c.darker,stroke:c.edge,strokeWidth:'2'}))
    s.push(React.createElement('circle',{key:'clpi',cx:'125',cy:'185',r:'3',fill:c.lighter,opacity:'0.3'}))
    s.push(React.createElement('path',{key:'hd',d:'M90,75 Q90,50 125,45 Q160,50 160,75',fill:'none',stroke:c.edge,strokeWidth:'3',strokeLinecap:'round'}))
    s.push(React.createElement('path',{key:'btp',d:'M52,332 H198 V348 H52 Z',fill:c.darker,opacity:'0.2'}))
  }

  if(onZC){
    zonas.forEach(function(z){
      var w=(z.size/100)*280*0.55,h=(z.size/100)*400*0.45
      var cx=(z.x/100)*280,cy=(z.y/100)*400
      var isA=selZ===z.id,isM=zm.indexOf(z.id)>=0
      s.push(React.createElement('rect',{key:'z'+z.id,x:cx-w/2,y:cy-h/2,width:w,height:h,rx:6,
        fill:isA?'rgba(139,92,246,0.25)':isM?'rgba(16,185,129,0.25)':'rgba(255,255,255,0.04)',
        stroke:isA?'#8B5CF6':isM?'#10B981':'#aaa',
        strokeWidth:isA||isM?2.5:1.5,strokeDasharray:isA||isM?'none':'5 4',
        style:{cursor:'pointer'},onClick:function(){onZC(z.id)}}))
      if(!isA&&!isM){
        s.push(React.createElement('text',{key:'l'+z.id,x:cx,y:cy,textAnchor:'middle',dominantBaseline:'middle',fill:'#aaa',fontSize:'8',opacity:'0.5'},z.label))
      }
    })
  }
  return React.createElement('svg',{viewBox:'0 0 280 400',className:'product-svg'},s)
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
  var y=useState(false),isDragging=y[0],setIsDragging=y[1]
  var z2=useState({x:0,y:0}),dragStart=z2[0],setDragStart=z2[1]
  var ra=useState(false),removingBg=ra[0],setRemovingBg=ra[1]
  var rb=useState(30),tolerancia=rb[0],setTolerancia=rb[1]
  var rc=useState(false),bgRemoved=rc[0],setBgRemoved=rc[1]
  var rd=useState([]),zonasyMarca=rd[0],setZonasyMarca=rd[1]
  var re=useState(null),telaSeleccionada=re[0],setTelaSeleccionada=re[1]
  var rf=useState(0),rotationY=rf[0],setRotationY=rf[1]
  var rg=useState(-8),tiltX=rg[0],setTiltX=rg[1]
  var rh=useState(false),isRotating=rh[0],setIsRotating=rh[1]
  var ri=useState({x:0,y:0,ry:0,tx:0}),rotateStart=ri[0],setRotateStart=ri[1]
  var canvasRef=useRef(null),fileInputRef=useRef(null)

  var zonas=zonasPorProducto[producto]||[]
  var zonaSel=null
  for(var zi=0;zi<zonas.length;zi++){if(zonas[zi].id===zonaActiva){zonaSel=zonas[zi];break}}

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
    try{var res=await removeImageBg(imagen,tolerancia);setImagen(res);setBgRemoved(true)}catch(e){}
    setRemovingBg(false)
  },[imagen,tolerancia])

  var TILT_X_MAX=85
  var ROT_Y_MAX=180

  var onCanvasPointerDown=function(e){
    if(imagen&&modoLibre){
      setIsDragging(true)
      var rect=canvasRef.current.getBoundingClientRect()
      setDragStart({x:e.clientX-rect.left-(posX/100)*rect.width,y:e.clientY-rect.top-(posY/100)*rect.height})
    }else{
      setIsRotating(true)
      setRotateStart({x:e.clientX,y:e.clientY,ry:rotationY,tx:tiltX})
    }
    if(e.currentTarget.setPointerCapture)try{e.currentTarget.setPointerCapture(e.pointerId)}catch(err){}
  }

  var onCanvasPointerMove=function(e){
    if(isDragging&&canvasRef.current){
      var rect=canvasRef.current.getBoundingClientRect()
      var nx=((e.clientX-rect.left-dragStart.x)/rect.width)*100
      var ny=((e.clientY-rect.top-dragStart.y)/rect.height)*100
      setPosX(Math.max(0,Math.min(100,nx)))
      setPosY(Math.max(0,Math.min(100,ny)))
      return
    }
    if(isRotating){
      var dx=e.clientX-rotateStart.x
      var dy=e.clientY-rotateStart.y
      setRotationY(Math.max(-ROT_Y_MAX,Math.min(ROT_Y_MAX,rotateStart.ry+dx*0.5)))
      setTiltX(Math.max(-TILT_X_MAX,Math.min(TILT_X_MAX,rotateStart.tx-dy*0.4)))
    }
  }

  var onCanvasPointerUp=function(){setIsDragging(false);setIsRotating(false)}

  var resetView=function(e){e.stopPropagation();setTiltX(-8);setRotationY(0)}

  var selZona=function(zid){
    setZonaActiva(zid);setModoLibre(false)
    if(zonasyMarca.indexOf(zid)<0){var a=zonasyMarca.slice();a.push(zid);setZonasyMarca(a)}
  }

  var cambiarProd=function(id){
    setProducto(id);setZonaActiva(null);setModoLibre(false);setZonasyMarca([]);setPosX(50);setPosY(50);setTelaSeleccionada(null);setRotationY(0);setTiltX(-8)
  }

  var reset=function(){setTamano(40);setRotacion(0);setPosX(50);setPosY(50)}

  var clearImg=function(){
    setImagen(null);setZonaActiva(null);setZonasyMarca([]);setBgRemoved(false);reset()
    if(fileInputRef.current)fileInputRef.current.value=''
  }

  var sendWA=function(){
    var prod='producto',tela='Personalizado'
    for(var i=0;i<productos.length;i++){if(productos[i].id===producto){prod=productos[i].nombre;break}}
    for(var i=0;i<coloresTela.length;i++){if(coloresTela[i].hex===colorTela){tela=coloresTela[i].nombre;break}}
    var msg='Hola! Quiero un '+prod+' bordado.\n\nColor de tela: '+tela+'\n'
    if(zonaActiva){var zl=zonaActiva;for(var i=0;i<zonas.length;i++){if(zonas[i].id===zonaActiva){zl=zonas[i].label;break}};msg+='Ubicación: '+zl+'\n'}
    else if(modoLibre){msg+='Posición personalizada\n'}
    msg+='Tamaño: '+tamano+'%\nRotación: '+rotacion+'\n\nAdjunto la imagen del bordado.'
    window.open('https://wa.me/5493454497729?text='+encodeURIComponent(msg),'_blank')
  }

  var imgStyle=function(){
    if(modoLibre)return{left:posX+'%',top:posY+'%',width:tamano+'%',transform:'translate(-50%,-50%) rotate('+rotacion+'deg)',cursor:isDragging?'grabbing':'grab'}
    if(zonaSel){var sr=tamano/40;return{left:zonaSel.x+'%',top:zonaSel.y+'%',width:(zonaSel.size*sr)+'%',transform:'translate(-50%,-50%) skew('+(zonaSel.skewX||0)+'deg,'+(zonaSel.skewY||0)+'deg) rotate('+rotacion+'deg)'}}
    return{display:'none'}
  }

  var boxTransform='rotateX('+(-tiltX)+'deg) rotateY('+rotationY+'deg)'

  return React.createElement('section',{id:'disenador',className:'section disenador'},
    React.createElement('h2',{className:'section-title'},'Diseñá tu Bordado'),
    React.createElement('p',{className:'section-subtitle'},'Elegí el artículo, el color, subí tu imagen y elegí dónde va el bordado'),

    React.createElement('div',{className:'disenador-top-section'},
      React.createElement('h3',null,'1. Elegí el artículo'),
      React.createElement('div',{className:'producto-selector-full'},productos.map(function(p){
        return React.createElement('button',{key:p.id,className:producto===p.id?'producto-btn active':'producto-btn',style:{'--btn-color':p.color},onClick:function(){cambiarProd(p.id)}},p.nombre)
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
        React.createElement('div',{
          ref:canvasRef,
          className:'canvas-area'+((modoLibre&&imagen)?' mode-place':' mode-3d')+(isDragging||isRotating?' active-drag':''),
          onPointerDown:onCanvasPointerDown,onPointerMove:onCanvasPointerMove,onPointerUp:onCanvasPointerUp,onPointerLeave:onCanvasPointerUp,onPointerCancel:onCanvasPointerUp
        },
          React.createElement('div',{className:'canvas-light-shine',style:{transform:'translate('+(rotationY*0.3)+'%, '+(-tiltX*0.5)+'%)'}}),
          React.createElement('div',{className:'canvas-groundshadow',style:{transform:'translateX(-50%) rotate('+(tiltX*0.15)+'deg) scaleX('+(1-Math.abs(tiltX)/90)+')'}}),
          React.createElement('div',{className:'product-3d-model',style:{transform:boxTransform}},
            React.createElement(SVGFrontProduct,{pid:producto,fb:colorTela,selZ:zonaActiva,onZC:imagen?selZona:undefined,zm:zonasyMarca,telaId:telaSeleccionada}),
            imagen&&(zonaActiva||modoLibre)?React.createElement('img',{src:imagen,alt:'diseño',className:'canvas-image',style:imgStyle(),draggable:false}):null
          ),
          !imagen?React.createElement('div',{className:'canvas-hint'},React.createElement(FiUpload,{size:24}),React.createElement('p',null,'Subí tu imagen para empezar')):null,
          imagen&&!zonaActiva&&!modoLibre?React.createElement('div',{className:'canvas-hint'},React.createElement('p',null,'Hacé clic en una zona del producto')):null,
          React.createElement('div',{className:'canvas-tilt-hint'},modoLibre&&imagen?'Arrastrá para mover el diseño':'Arrastrá para rotar el producto en 3D'),
          telaSeleccionada?React.createElement('div',{className:'fabric-badge'},function(){for(var i=0;i<(telasData[producto]||[]).length;i++){if(telasData[producto][i].id===telaSeleccionada){return telasData[producto][i].nombre}};return''}()):null,
          React.createElement('button',{className:'btn-reset-view',onClick:resetView,title:'Vista frontal'},React.createElement(FiRotateCw,{size:14}))
        ),
        imagen&&(zonaActiva||modoLibre)?React.createElement('button',{className:'btn btn-whatsapp disenador-send',onClick:sendWA},'Enviar diseño por WhatsApp'):null
      ),

      React.createElement('div',{className:'disenador-panel'},
        React.createElement('div',{className:'panel-section'},
          React.createElement('h3',null,'3. Subí tu imagen'),
          React.createElement('div',{className:'upload-zone'+(imagen?' has-image':''),onClick:function(){fileInputRef.current&&fileInputRef.current.click()},onDrop:handleDrop,onDragOver:function(e){e.preventDefault()}},
            imagen?React.createElement('img',{src:imagen,alt:'diseño',className:'upload-preview'}):
              React.createElement(React.Fragment,null,React.createElement(FiUpload,{size:32}),React.createElement('p',null,'Haz clic o arrastra tu imagen'),React.createElement('span',null,'JPG, PNG, SVG'))
          ),
          React.createElement('input',{ref:fileInputRef,type:'file',accept:'image/*',onChange:handleUpload,hidden:true}),
          imagen?React.createElement('div',{className:'upload-actions'},
            React.createElement('button',{className:'btn-clear',onClick:clearImg},React.createElement(FiTrash2,{size:14}),' Quitar'),
            React.createElement('button',{className:'btn-bg-remove'+(removingBg?' loading':''),onClick:handleRemoveBg,disabled:removingBg},
              React.createElement(FiImage,{size:14}),removingBg?' Procesando...':bgRemoved?' Re-quitar fondo':' Quitar fondo')
          ):null,
          imagen?React.createElement('div',{className:'tolerancia-control'},
            React.createElement('label',null,'Tolerancia: '+tolerancia+'%'),
            React.createElement('input',{type:'range',min:'5',max:'80',value:tolerancia,onChange:function(e){setTolerancia(Number(e.target.value))}})
          ):null
        ),
        imagen?React.createElement('div',{className:'panel-section controls'},
          React.createElement('h3',null,'4. Elegí la ubicación'),
          React.createElement('div',{className:'zonas-selector'},
            zonas.map(function(z){return React.createElement('button',{key:z.id,className:'zona-btn'+(zonaActiva===z.id?' active':'')+(zonasyMarca.indexOf(z.id)>=0&&zonaActiva!==z.id?' marcada':''),onClick:function(){selZona(z.id)}},zonasyMarca.indexOf(z.id)>=0?React.createElement(FiSliders,{size:12}):null,' '+z.label)}),
            React.createElement('button',{className:'zona-btn libre-btn'+(modoLibre?' active':''),onClick:function(){setModoLibre(true);setZonaActiva(null)}},React.createElement(FiSliders,{size:12}),' Posición libre')
          ),
          React.createElement('hr',{className:'panel-divider'}),
          React.createElement('div',{className:'control-group'},React.createElement('label',null,React.createElement(FiMaximize2,{size:14}),' Tamaño'),React.createElement('input',{type:'range',min:'10',max:'80',value:tamano,onChange:function(e){setTamano(Number(e.target.value))}}),React.createElement('span',null,tamano+'%')),
          React.createElement('div',{className:'control-group'},React.createElement('label',null,React.createElement(FiRotateCw,{size:14}),' Rotación'),React.createElement('input',{type:'range',min:'-180',max:'180',value:rotacion,onChange:function(e){setRotacion(Number(e.target.value))}}),React.createElement('span',null,rotacion)),
          modoLibre?React.createElement(React.Fragment,null,
            React.createElement('div',{className:'control-group'},React.createElement('label',null,'X'),React.createElement('input',{type:'range',min:'0',max:'100',value:posX,onChange:function(e){setPosX(Number(e.target.value))}}),React.createElement('span',null,Math.round(posX)+'%')),
            React.createElement('div',{className:'control-group'},React.createElement('label',null,'Y'),React.createElement('input',{type:'range',min:'0',max:'100',value:posY,onChange:function(e){setPosY(Number(e.target.value))}}),React.createElement('span',null,Math.round(posY)+'%'))
          ):null,
          React.createElement('button',{className:'btn btn-outline btn-small',onClick:reset},'Restablecer')
        ):null
      )
    ),

    React.createElement('div',{className:'telas-section'},
      React.createElement('h3',{className:'telas-title'},'Material recomendado'),
      React.createElement('div',{className:'telas-grid'},(telasData[producto]||[]).map(function(tela){
        return React.createElement('div',{key:tela.id,className:'tela-card'+(telaSeleccionada===tela.id?' active':''),onClick:function(){setTelaSeleccionada(tela.id)}},
          React.createElement('strong',null,tela.nombre),
          React.createElement('span',{className:'tela-desc'},tela.desc)
        )
      }))
    )
  )
}

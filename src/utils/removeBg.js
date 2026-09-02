export function loadImage(dataUrl) {
  return new Promise(function (resolve, reject) {
    var img = new Image()
    img.onload = function () { resolve(img) }
    img.onerror = reject
    img.src = dataUrl
  })
}

export function drawToCanvas(dataUrl, maxSize) {
  return loadImage(dataUrl).then(function (img) {
    var w = img.naturalWidth || img.width
    var h = img.naturalHeight || img.height
    if (!w || !h) { w = 200; h = 200 }
    var scale = Math.min(1, maxSize / Math.max(w, h))
    var c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(w * scale))
    c.height = Math.max(1, Math.round(h * scale))
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    return c
  })
}

// Detecta el color de fondo mas frecuente muestreando los 4 bordes de la imagen.
function detectEdgeBg(data) {
  var w = data.width, h = data.height
  var px = data.data
  var edge = {}
  for (var x = 0; x < w; x++) {
    var i1 = (x * h) * 4
    var i2 = (x * h + h - 1) * 4
    var k1 = px[i1] + ',' + px[i1 + 1] + ',' + px[i1 + 2]
    var k2 = px[i2] + ',' + px[i2 + 1] + ',' + px[i2 + 2]
    edge[k1] = (edge[k1] || 0) + 1
    edge[k2] = (edge[k2] || 0) + 1
  }
  for (var y = 0; y < h; y++) {
    var j1 = (y * w) * 4
    var j2 = (((w - 1) * h) + y) * 4
    var k3 = px[j1] + ',' + px[j1 + 1] + ',' + px[j1 + 2]
    var k4 = px[j2] + ',' + px[j2 + 1] + ',' + px[j2 + 2]
    edge[k3] = (edge[k3] || 0) + 1
    edge[k4] = (edge[k4] || 0) + 1
  }
  var bgKey = '', bgCount = 0
  for (var k in edge) { if (edge[k] > bgCount) { bgCount = edge[k]; bgKey = k } }
  var bgp = bgKey.split(',')
  return { r: parseInt(bgp[0]), g: parseInt(bgp[1]), b: parseInt(bgp[2]) }
}

// Metodo 1: muestreo de bordes. Elimina todos los pixeles cuyo color
// este dentro de la tolerancia del color de fondo detectado.
export function removeBgByEdge(dataUrl, tolerance) {
  return drawToCanvas(dataUrl, 1600).then(function (c) {
    var ctx = c.getContext('2d')
    var img = ctx.getImageData(0, 0, c.width, c.height)
    var bg = detectEdgeBg(img)
    var t = tolerance * 2.55
    var d = img.data
    for (var i = 0; i < d.length; i += 4) {
      var dr = d[i] - bg.r, dg = d[i + 1] - bg.g, db = d[i + 2] - bg.b
      if (Math.sqrt(dr * dr + dg * dg + db * db) < t) {
        d[i + 3] = 0
      }
    }
    ctx.putImageData(img, 0, 0)
    return c.toDataURL('image/png')
  })
}

// Metodo 2: flood fill. Desde cada borde inunda las areas conectadas cuyo
// color difiere del vecino dentro de la tolerancia. Conserva el interior
// del diseno aunque tenga colores parecidos al fondo.
export function removeBgByFlood(dataUrl, tolerance) {
  return drawToCanvas(dataUrl, 1600).then(function (c) {
    var ctx = c.getContext('2d')
    var img = ctx.getImageData(0, 0, c.width, c.height)
    var w = c.width, h = c.height
    var d = img.data

    var bg = detectEdgeBg(img)
    var t = tolerance * 2.55 * 0.6
    var t2 = t * t

    var visited = new Uint8Array(w * h)
    var stack = new Int32Array(w * h)
    var sp = 0

    function push(i) {
      if (i >= 0 && i < w * h && !visited[i]) { visited[i] = 1; stack[sp++] = i }
    }

    // recorremos todo el borde exterior
    for (var x0 = 0; x0 < w; x0++) {
      push(x0); push((h - 1) * w + x0)
    }
    for (var y0 = 0; y0 < h; y0++) {
      push(y0 * w); push(y0 * w + (w - 1))
    }

    var idx
    while (sp > 0) {
      var cur = stack[--sp]
      var cx = cur % w
      var cy = (cur / w) | 0
      idx = cur * 4
      var cr = d[idx], cg = d[idx + 1], cb = d[idx + 2]
      var dr2 = cr - bg.r, dg2 = cg - bg.g, db2 = cb - bg.b
      var dist = dr2 * dr2 + dg2 * dg2 + db2 * db2
      if (dist > t2) continue
      d[idx + 3] = 0
      if (cx > 0) push(cur - 1)
      if (cx < w - 1) push(cur + 1)
      if (cy > 0) push(cur - w)
      if (cy < h - 1) push(cur + w)
    }

    ctx.putImageData(img, 0, 0)
    return c.toDataURL('image/png')
  })
}

export function removeBackground(dataUrl, tolerance, method) {
  if (method === 'flood') return removeBgByFlood(dataUrl, tolerance)
  return removeBgByEdge(dataUrl, tolerance)
}

import { useState, useRef } from 'react'
import { FiSend, FiImage, FiX } from 'react-icons/fi'
import './Presupuesto.css'

const productos = [
  'Mochila', 'Yerbera', 'Bolso', 'Estuche', 'Cartera', 'Gorra', 'Botinera', 'Matera', 'Riñonera', 'Otro'
]

export default function Presupuesto() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    producto: '',
    descripcion: '',
  })
  const [imagen, setImagen] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const fileRef = useRef(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImage = (e) => {
    const f = e.target.files && e.target.files[0]
    if (f && f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setImagen(ev.target.result)
      reader.readAsDataURL(f)
    }
  }

  const removeImage = () => {
    setImagen(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const msg = `Hola! Soy ${form.nombre}. Quiero un presupuesto para:\n\n` +
      `Producto: ${form.producto}\n` +
      `Descripcion: ${form.descripcion}\n` +
      `Email: ${form.email}\n\n` +
      `(Adjunta la imagen en el chat)`
    window.open(
      `https://wa.me/5493454497729?text=${encodeURIComponent(msg)}`,
      '_blank'
    )
  }

  return (
    <section id="presupuesto" className="section presupuesto">
      <h2 className="section-title">Pedí tu Presupuesto</h2>
      <p className="section-subtitle">
        Contanos tu idea y te enviamos un precio sin compromiso
      </p>

      <form className="presupuesto-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              placeholder="Tu nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="producto">Tipo de Producto</label>
          <select
            id="producto"
            name="producto"
            value={form.producto}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un producto</option>
            {productos.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="descripcion">Que queres bordar?</label>
          <textarea
            id="descripcion"
            name="descripcion"
            placeholder="Describe tu idea: imagen, frase, colores, tamanos..."
            rows={5}
            value={form.descripcion}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Imagen de referencia (opcional)</label>
          {imagen ? (
            <div className="presupuesto-image-preview">
              <img src={imagen} alt="referencia" />
              <button type="button" className="presupuesto-image-remove" onClick={removeImage}>
                <FiX size={16} />
              </button>
            </div>
          ) : (
            <div
              className="presupuesto-image-upload"
              onClick={() => fileRef.current && fileRef.current.click()}
            >
              <FiImage size={24} />
              <span>Subi una imagen de referencia</span>
              <span className="presupuesto-image-hint">JPG, PNG</span>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImage}
            hidden
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full">
          <FiSend size={18} />
          Enviar
        </button>
      </form>
    </section>
  )
}

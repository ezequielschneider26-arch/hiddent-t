import './Catalogo.css'

const productos = [
  {
    id: 1,
    nombre: 'Mochilas',
    descripcion: 'Mochilas bordadas con el diseño que elijas. Ideales para regalo o uso personal.',
    imagen: '/images/mochila-placeholder.svg',
    color: '#8B5CF6',
  },
  {
    id: 2,
    nombre: 'Yerberas',
    descripcion: 'Yerberas bordadas a medida. Perfectas para el mate o para regalar.',
    imagen: '/images/yerbera-placeholder.svg',
    color: '#EC4899',
  },
  {
    id: 3,
    nombre: 'Bolsos',
    descripcion: 'Bolsos con bordado personalizado. Tamaños y estilos variados.',
    imagen: '/images/bolso-placeholder.svg',
    color: '#06B6D4',
  },
  {
    id: 4,
    nombre: 'Botineras',
    descripcion: 'Botineras bordadas. Elegi el diseño y el color de tela.',
    imagen: '/images/botinera-placeholder.svg',
    color: '#F59E0B',
  },
  {
    id: 5,
    nombre: 'Gorras',
    descripcion: 'Gorras bordadas con tu logo, frase o imagen. Estilo unico.',
    imagen: '/images/gorra-placeholder.svg',
    color: '#22C55E',
  },
  {
    id: 6,
    nombre: 'Estuches',
    descripcion: 'Estuches bordados para lapices, maquillaje o lo que necesites.',
    imagen: '/images/estuche-placeholder.svg',
    color: '#8B5CF6',
  },
  {
    id: 7,
    nombre: 'Carteras',
    descripcion: 'Carteras con bordado unico. Cada pieza es especial.',
    imagen: '/images/cartera-placeholder.svg',
    color: '#EC4899',
  },
  {
    id: 8,
    nombre: 'Personalizado',
    descripcion: 'No encontras lo que buscas? Bordamos lo que se te ocurra.',
    imagen: '/images/personalizado-placeholder.svg',
    color: '#06B6D4',
  },
]

export default function Catalogo() {
  return (
    <section id="catalogo" className="section catalogo">
      <h2 className="section-title">Nuestros Productos</h2>
      <p className="section-subtitle">
        Todo bordado con maquina industrial de alta precision
      </p>

      <div className="catalogo-grid">
        {productos.map((producto) => (
          <div key={producto.id} className="catalogo-card">
            <div
              className="catalogo-card-image"
              style={{ borderTop: `3px solid ${producto.color}` }}
            >
              <img src={producto.imagen} alt={producto.nombre} />
            </div>
            <div className="catalogo-card-content">
              <h3>{producto.nombre}</h3>
              <p>{producto.descripcion}</p>
              <a
                href="https://wa.me/5491100000000?text=Hola!%20Quiero%20un%20bordado"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-small"
              >
                Consultar
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

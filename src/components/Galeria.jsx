import { useState, useRef, useCallback } from 'react'
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import './Galeria.css'

const categorias = [
  {
    id: 'mochilas',
    nombre: 'Mochilas',
    fotos: [
      { imagen: '/images/trabajos/mochila1.jpeg', titulo: 'Mochila personalizada 1' },
      { imagen: '/images/trabajos/mochila2.jpeg', titulo: 'Mochila personalizada 2' },
      { imagen: '/images/trabajos/mochila3.jpeg', titulo: 'Mochila personalizada 3' },
      { imagen: '/images/trabajos/mochila4.jpeg', titulo: 'Mochila personalizada 4' },
      { imagen: '/images/trabajos/mochila5.jpeg', titulo: 'Mochila personalizada 5' },
      { imagen: '/images/trabajos/mochila6.jpeg', titulo: 'Mochila personalizada 6' },
      { imagen: '/images/trabajos/mochila7.jpeg', titulo: 'Mochila personalizada 7' },
      { imagen: '/images/trabajos/mochila8.jpeg', titulo: 'Mochila personalizada 8' },
      { imagen: '/images/trabajos/mochila9.jpeg', titulo: 'Mochila personalizada 9' },
    ]
  },
  {
    id: 'yerberas',
    nombre: 'Yerberas',
    fotos: [
      { imagen: '/images/trabajos/yerbera1.jpeg', titulo: 'Yerbera personalizada 1' },
      { imagen: '/images/trabajos/yerbera2.jpeg', titulo: 'Yerbera personalizada 2' },
    ]
  },
  {
    id: 'bolsos',
    nombre: 'Bolsos',
    fotos: [
      { imagen: '/images/trabajos/bolsomano1.jpeg', titulo: 'Bolso de mano 1' },
      { imagen: '/images/trabajos/bolsomano2.jpeg', titulo: 'Bolso de mano 2' },
      { imagen: '/images/trabajos/bolsomano3.jpeg', titulo: 'Bolso de mano 3' },
      { imagen: '/images/trabajos/bolsomano4.jpeg', titulo: 'Bolso de mano 4' },
    ]
  },
  {
    id: 'botineras',
    nombre: 'Botineras',
    fotos: [
      { imagen: '/images/trabajos/botinera1.jpeg', titulo: 'Botinera personalizada 1' },
      { imagen: '/images/trabajos/botinera2.jpeg', titulo: 'Botinera personalizada 2' },
      { imagen: '/images/trabajos/botinera3.jpeg', titulo: 'Botinera personalizada 3' },
      { imagen: '/images/trabajos/botinera4.jpeg', titulo: 'Botinera personalizada 4' },
      { imagen: '/images/trabajos/botinera5.jpeg', titulo: 'Botinera personalizada 5' },
    ]
  },
  {
    id: 'carteras',
    nombre: 'Carteras',
    fotos: [
      { imagen: '/images/trabajos/cartera1.jpeg', titulo: 'Cartera personalizada 1' },
      { imagen: '/images/trabajos/cartera2.jpeg', titulo: 'Cartera personalizada 2' },
      { imagen: '/images/trabajos/cartera3.jpeg', titulo: 'Cartera personalizada 3' },
      { imagen: '/images/trabajos/cartera4.jpeg', titulo: 'Cartera personalizada 4' },
    ]
  },
  {
    id: 'materas',
    nombre: 'Materas',
    fotos: [
      { imagen: '/images/trabajos/matera1.jpeg', titulo: 'Matera personalizada 1' },
      { imagen: '/images/trabajos/matera2.jpeg', titulo: 'Matera personalizada 2' },
      { imagen: '/images/trabajos/matera3.jpeg', titulo: 'Matera personalizada 3' },
      { imagen: '/images/trabajos/matera4.jpeg', titulo: 'Matera personalizada 4' },
    ]
  },
  {
    id: 'rinoneras',
    nombre: 'Riñoneras',
    fotos: [
      { imagen: '/images/trabajos/rinonera1.jpeg', titulo: 'Riñonera personalizada 1' },
    ]
  },
]

export default function Galeria() {
  const [activa, setActiva] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const scrollRef = useRef(null)

  const toggleCategoria = useCallback((id) => {
    setActiva(prev => prev === id ? null : id)
  }, [])

  const scrollCarousel = useCallback((dir) => {
    if (!scrollRef.current) return
    const w = scrollRef.current.offsetWidth * 0.7
    scrollRef.current.scrollBy({ left: dir === 'left' ? -w : w, behavior: 'smooth' })
  }, [])

  return (
    <section id="galeria" className="section galeria">
      <h2 className="section-title">Galeria de Trabajos</h2>
      <p className="section-subtitle">
        Selecciona una categoria para ver los trabajos realizados
      </p>

      <div className="galeria-cats">
        {categorias.map((cat) => (
          <div key={cat.id} className={'galeria-cat-block' + (activa === cat.id ? ' activa' : '')}>
            <div className="galeria-cat-card" onClick={() => toggleCategoria(cat.id)}>
              <div className="galeria-cat-thumb">
                <img src={cat.fotos[0].imagen} alt={cat.nombre} />
              </div>
              <div className="galeria-cat-info">
                <h3>{cat.nombre}</h3>
              </div>
              <div className={'galeria-cat-arrow' + (activa === cat.id ? ' open' : '')}>
                <FiChevronRight size={20} />
              </div>
            </div>

            {activa === cat.id && (
              <div className="galeria-carousel-wrap">
                <button className="galeria-carousel-btn left" onClick={(e) => { e.stopPropagation(); scrollCarousel('left') }}>
                  <FiChevronLeft size={22} />
                </button>
                <div className="galeria-carousel" ref={scrollRef}>
                  {cat.fotos.map((foto, i) => (
                    <div key={i} className="galeria-slide" onClick={(e) => { e.stopPropagation(); setLightbox(foto) }}>
                      <img src={foto.imagen} alt={foto.titulo} />
                      <div className="galeria-slide-info">
                        <span>{foto.titulo}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="galeria-carousel-btn right" onClick={(e) => { e.stopPropagation(); scrollCarousel('right') }}>
                  <FiChevronRight size={22} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox-close" onClick={() => setLightbox(null)}>
            <FiX size={28} />
          </button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.imagen} alt={lightbox.titulo} />
            <p>{lightbox.titulo}</p>
          </div>
        </div>
      )}
    </section>
  )
}

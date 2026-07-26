import { FiScissors, FiAward, FiHeart, FiZap } from 'react-icons/fi'
import './SobreNosotros.css'

const features = [
  { icon: <FiScissors size={28} />, titulo: 'Maquina Industrial', texto: 'Bordamos con maquinas de alta velocidad y precision para resultados impecables.' },
  { icon: <FiAward size={28} />, titulo: 'Calidad Premium', texto: 'Hilos de primera y terminaciones perfectas en cada pieza que sale de nuestro taller.' },
  { icon: <FiHeart size={28} />, titulo: 'Hecho con Amor', texto: 'Cada bordado es unico. Ponemos dedicacion y carino en cada trabajo.' },
  { icon: <FiZap size={28} />, titulo: 'Entrega Rapida', texto: 'Trabajamos con tiempos competitivos sin sacrificar la calidad del resultado.' },
]

export default function SobreNosotros() {
  return (
    <section id="nosotros" className="section sobre-nosotros">
      <h2 className="section-title">Sobre Nosotros</h2>
      <p className="section-subtitle">
        Somos un emprendimiento especializado en bordado con maquina industrial
      </p>

      <div className="nosotros-text">
        <p>
          En <strong>HIDDEN T</strong> transformamos ideas en bordados. Con
          maquinas industriales de alta precision, podemos bordar cualquier imagen
          que imagines: fotos, logos, personajes, frases, diseños propios o lo
          que se te ocurra.
        </p>
        <p>
          Trabajamos sobre mochilas, yerberas, bolsos, estuches, carteras y
          mucho mas. Cada pieza es unica y personalizada al gusto del cliente.
        </p>
      </div>

      <div className="nosotros-features">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.titulo}</h3>
            <p>{f.texto}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

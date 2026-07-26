import { FiArrowDown } from 'react-icons/fi'
import './Hero.css'

export default function Hero() {
  return (
    <section id="inicio" className="hero">
      <div className="hero-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="hero-content">
        <h1 className="hero-title">
          Transformamos tu idea
          <br />
          en <span className="hero-highlight">bordado</span>
        </h1>
        <p className="hero-text">
          Bordados industriales de alta precision. Mochilas, yerberas, bolsos
          y mas. Bordamos la imagen que se te ocurra — foto, logo, personaje,
          lo que imagines.
        </p>
        <div className="hero-buttons">
          <a href="#presupuesto" className="btn btn-primary">
            Pedir Presupuesto
          </a>
          <a href="#galeria" className="btn btn-outline">
            Ver Trabajos
          </a>
        </div>
      </div>

      <a href="#catalogo" className="hero-scroll">
        <FiArrowDown size={24} />
      </a>
    </section>
  )
}

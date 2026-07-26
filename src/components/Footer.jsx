import { FiInstagram, FiHeart } from 'react-icons/fi'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="footer-logo">
            <div className="logo-icon">
              <svg className="crown" viewBox="0 0 24 14" width="18" height="10">
                <path d="M2 12 L6 2 L10 8 L14 0 L18 8 L22 2 L24 12 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="0.5"/>
              </svg>
              <span className="logo-t">T</span>
            </div>
            <span className="logo-h">HIDDENT</span>
          </span>
          <p>Bordados industriales con alma</p>
        </div>

        <div className="footer-links">
          <a href="#catalogo">Catálogo</a>
          <a href="#galeria">Galería</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#presupuesto">Presupuesto</a>
        </div>

        <div className="footer-social">
          <a
            href="https://instagram.com/hiddent.t"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <FiInstagram size={20} />
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          Hecho con <FiHeart size={14} className="heart-icon" /> en Argentina
          &middot; {new Date().getFullYear()} HIDDEN T
        </p>
      </div>
    </footer>
  )
}

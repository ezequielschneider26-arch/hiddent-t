import { FiMail, FiMapPin, FiClock, FiInstagram } from 'react-icons/fi'
import './Contacto.css'

export default function Contacto() {
  return (
    <section id="contacto" className="section contacto">
      <h2 className="section-title">Contacto</h2>
      <p className="section-subtitle">
        Escribinos y armamos tu pedido
      </p>

      <div className="contacto-grid">
        <div className="contacto-info">
          <div className="contacto-item">
            <FiInstagram size={20} />
            <div>
              <h4>Instagram</h4>
              <p>@hiddent.t</p>
            </div>
          </div>
          <div className="contacto-item">
            <FiMail size={20} />
            <div>
              <h4>Email</h4>
              <p>hidden.t@email.com</p>
            </div>
          </div>
          <div className="contacto-item">
            <FiMapPin size={20} />
            <div>
              <h4>Ubicacion</h4>
              <p>Argentina</p>
            </div>
          </div>
          <div className="contacto-item">
            <FiClock size={20} />
            <div>
              <h4>Horario</h4>
              <p>Lun a Vie: 9 a 18hs</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

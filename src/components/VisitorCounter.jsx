import './VisitorCounter.css'

// URL de la imagen del contador. Se genera gratis sin registración en un servicio
// como https://flagcounter.com o https://www.hitwebcounter.com (entrá, configurá
// tu sitio y copiá la URL de la imagen que te muestran). Pegala aquí.
const COUNTER_IMAGE_URL = ''

export default function VisitorCounter() {
  if (!COUNTER_IMAGE_URL) return null
  return (
    <div className="visitor-counter" aria-label="Contador de visitas">
      <span className="visitor-label">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
        VISITANTES
      </span>
      <img
        className="visitor-number"
        src={COUNTER_IMAGE_URL}
        alt="Contador de visitas de la página"
        loading="lazy"
      />
    </div>
  )
}

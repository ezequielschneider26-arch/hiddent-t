import { useState } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import './Navbar.css'

const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Catalogo', href: '#catalogo' },
  { label: 'Disenador', href: '#disenador' },
  { label: 'Galeria', href: '#galeria' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Presupuesto', href: '#presupuesto' },
  { label: 'Contacto', href: '#contacto' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="#inicio" className="navbar-logo">
          <div className="logo-icon">
            <svg className="crown" viewBox="0 0 24 14" width="22" height="12">
              <path d="M2 12 L6 2 L10 8 L14 0 L18 8 L22 2 L24 12 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="0.5"/>
            </svg>
            <span className="logo-t">T</span>
          </div>
          <span className="logo-h">HIDDEN</span>
        </a>

        <div className={`navbar-links ${open ? 'active' : ''}`}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>

        <button className="navbar-toggle" onClick={() => setOpen(!open)}>
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
    </nav>
  )
}

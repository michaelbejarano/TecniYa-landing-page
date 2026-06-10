export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a href="#" className="logo">
          <span className="logo-mark">⚒</span>
          Tecni<span>Ya</span>
        </a>
        <div className="nav-links">
          <a href="#servicios">Servicios</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#tecnicos">Técnicos</a>
          <a href="#app">App</a>
          <a href="#contacto" className="btn btn-primary nav-cta">
            Quiero saber más
          </a>
        </div>
      </div>
    </nav>
  )
}

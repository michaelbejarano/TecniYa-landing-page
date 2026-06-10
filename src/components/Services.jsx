import { motion } from 'framer-motion'

const SERVICES = [
  { icon: '⚡', name: 'Electricidad', desc: 'Cortocircuitos, tableros, instalación de luminarias y tomacorrientes.', count: '480 técnicos' },
  { icon: '🔧', name: 'Gasfitería', desc: 'Fugas, grifería, termas, desatoros e instalaciones sanitarias.', count: '390 técnicos' },
  { icon: '🎨', name: 'Pintura', desc: 'Interiores, fachadas, empastado y acabados profesionales.', count: '310 técnicos' },
  { icon: '❄️', name: 'Climatización', desc: 'Aire acondicionado: instalación, mantenimiento y recarga de gas.', count: '150 técnicos' },
  { icon: '🪚', name: 'Carpintería', desc: 'Muebles a medida, reparaciones, puertas y closets.', count: '220 técnicos' },
  { icon: '🧺', name: 'Electrodomésticos', desc: 'Lavadoras, refrigeradoras, cocinas y hornos. Todas las marcas.', count: '270 técnicos' },
]

export default function Services() {
  return (
    <section id="servicios">
      <div className="container">
        <div className="section-head">
          <span className="kicker">Servicios</span>
          <h2 className="section-title">Cada rincón de tu casa,<br />cubierto.</h2>
          <p className="section-sub">
            Seis especialidades, cientos de técnicos verificados con DNI,
            antecedentes y prueba técnica.
          </p>
        </div>
        <div className="services-grid">
          {SERVICES.map((s, i) => (
            <motion.div
              key={s.name}
              className="service-card"
              data-num={`0${i + 1}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="service-icon">{s.icon}</div>
              <h3>{s.name}</h3>
              <p>{s.desc}</p>
              <div className="service-meta">
                <span className="m-count">{s.count}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

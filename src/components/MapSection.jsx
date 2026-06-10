import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion } from 'framer-motion'
import CityMap from '../three/CityMap.jsx'

const STEPS = [
  { title: 'Cuenta tu problema', desc: 'Foto + descripción en 30 segundos. La app detecta la especialidad.' },
  { title: 'Te conectamos al más cercano', desc: 'Técnicos verificados a tu alrededor reciben la solicitud al instante.' },
  { title: 'Síguelo en vivo', desc: 'Ve su ruta en el mapa, como un delivery. Sabes exactamente cuándo llega.' },
  { title: 'Paga al terminar', desc: 'Pago seguro desde la app y garantía de 30 días en cada trabajo.' },
]

export default function MapSection() {
  return (
    <section id="como-funciona" className="map-section">
      <div className="container">
        <div className="map-wrap">
          <div>
            <span className="kicker">Cómo funciona</span>
            <h2 className="section-title">Tu técnico llega rápido, directo a tu casa.</h2>
            <div className="map-steps">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.title}
                  className="map-step"
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                >
                  <div className="step-num">{i + 1}</div>
                  <div>
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            className="map-canvas"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="map-status">
              <div className="status-chip">
                <span className="status-dot" />
                3 técnicos cerca de ti
              </div>
              <div className="status-chip">⚡ Juan Q. en camino</div>
            </div>
            <Canvas shadows dpr={[1, 2]} camera={{ position: [7, 8.5, 9], fov: 38 }}>
              <Suspense fallback={null}>
                <CityMap />
              </Suspense>
            </Canvas>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

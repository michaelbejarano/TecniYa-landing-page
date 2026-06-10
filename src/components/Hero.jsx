import { Suspense, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from 'framer-motion'
import ExplodedHouse from '../three/ExplodedHouse.jsx'

const ROOMS = [
  {
    key: 'cocina',
    name: 'Cocina',
    service: 'Electrodomésticos',
    detail: 'Reparación de refrigeradoras, cocinas, lavadoras y microondas. Diagnóstico y repuestos en una sola visita.',
    // video con precio incrustado; reactivar cuando se regenere sin precio:
    // video: '/videos/cocina.mp4',
    side: 'right',
  },
  {
    key: 'sala',
    name: 'Sala',
    service: 'Electricidad',
    detail: 'Cortocircuitos, tableros, tomacorrientes e iluminación. Instalaciones seguras y certificadas.',
    // video: '/videos/sala.mp4',
    side: 'left',
  },
  {
    key: 'bano',
    name: 'Baño',
    service: 'Gasfitería · Grifería',
    detail: 'Cambio de grifería, duchas, presión de agua y filtraciones. Acabados que duran.',
    // video: '/videos/bano.mp4',
    side: 'right',
  },
  {
    key: 'dormitorio',
    name: 'Dormitorio',
    service: 'Carpintería',
    detail: 'Closets, puertas, muebles a medida y reparaciones en madera. Trabajo fino, a tu estilo.',
    side: 'left',
  },
]

// Línea de tiempo del scroll: intro → explosión → 4 ambientes → cierre
function phaseFor(p) {
  if (p < 0.1) return 'intro'
  if (p < 0.38) return 'explode'
  if (p < 0.52) return 0
  if (p < 0.66) return 1
  if (p < 0.8) return 2
  if (p < 0.92) return 3
  return 'outro'
}

export default function Hero() {
  const wrap = useRef(null)
  const { scrollYProgress } = useScroll({
    target: wrap,
    offset: ['start start', 'end end'],
  })
  const [phase, setPhase] = useState('intro')

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const ph = phaseFor(v)
    setPhase((cur) => (cur === ph ? cur : ph))
  })

  const introOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0])
  const introY = useTransform(scrollYProgress, [0, 0.08], [0, -60])
  const cueOpacity = useTransform(scrollYProgress, [0.0, 0.05], [1, 0])

  const activeRoom = typeof phase === 'number' ? phase : null
  const room = activeRoom != null ? ROOMS[activeRoom] : null
  const railVisible = phase === 'explode' || activeRoom != null

  return (
    <header className="hero-exploded" ref={wrap}>
      <div className="hero-sticky">
        <Canvas shadows="soft" dpr={[1, 2]} camera={{ position: [4.6, 2.6, 9.8], fov: 40, near: 1.5, far: 60 }}>
          <Suspense fallback={null}>
            <ExplodedHouse progress={scrollYProgress} phase={phase} activeRoom={activeRoom} />
          </Suspense>
        </Canvas>
        <div className="hero-vignette" />

        {/* Intro: titular sobre la casa cerrada */}
        <motion.div className="hero-intro" style={{ opacity: introOpacity, y: introY }}>
          <span className="kicker">Técnicos verificados · Lima</span>
          <h1>
            Tu casa habla.
            <br />
            Nosotros traemos <em>al técnico</em>.
          </h1>
          <p className="hero-sub">
            Baja para abrir la casa y descubre lo que un técnico verificado
            puede resolver en cada ambiente.
          </p>
          <div className="hero-actions">
            <a href="#contacto" className="btn btn-primary">
              Quiero saber más →
            </a>
            <a href="#contacto" className="btn btn-ghost">
              Soy técnico
            </a>
          </div>
        </motion.div>

        <motion.div className="scroll-cue" style={{ opacity: cueOpacity }}>
          <span>Desliza para abrir la casa</span>
          <span className="cue-arrow">▾</span>
        </motion.div>

        {/* Riel de progreso por ambientes */}
        <div className={`hero-rail ${railVisible ? 'show' : ''}`}>
          {ROOMS.map((r, i) => (
            <div key={r.key} className={`rail-item ${activeRoom === i ? 'on' : ''}`}>
              <span className="dot" />
              {r.name}
            </div>
          ))}
        </div>

        {/* Panel del ambiente activo */}
        <AnimatePresence mode="wait">
          {room && (
            <motion.aside
              key={room.key}
              className={`room-panel ${room.side}`}
              initial={{ opacity: 0, y: 46 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -34 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {room.video && (
                <video
                  className="rp-video"
                  src={room.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}
              <span className="rp-kicker">
                {room.name} · ambiente {activeRoom + 1}/4
              </span>
              <h3 className="rp-title">{room.service}</h3>
              <p className="rp-problem">{room.detail}</p>
              <a href="#contacto" className="btn btn-primary rp-cta">
                Quiero saber más →
              </a>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Cierre del hero */}
        <AnimatePresence>
          {phase === 'outro' && (
            <motion.div
              className="hero-outro"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="kicker">Una sola app</span>
              <h2>
                Una casa. Cualquier problema.
                <br />
                <em>Un técnico en camino.</em>
              </h2>
              <div className="hero-stats">
                <div className="stat">
                  <strong>2,400+</strong>
                  <span>TÉCNICOS ACTIVOS</span>
                </div>
                <div className="stat">
                  <strong>18 min</strong>
                  <span>LLEGADA PROMEDIO</span>
                </div>
                <div className="stat">
                  <strong>4.9 ★</strong>
                  <span>CALIFICACIÓN</span>
                </div>
              </div>
              <a href="#contacto" className="btn btn-primary" style={{ marginTop: 36 }}>
                Quiero saber más →
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

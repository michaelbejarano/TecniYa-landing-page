import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const TECHS = [
  { name: 'Juan Quispe', trade: 'Electricista', score: 4.9, jobs: 312, tags: ['Tableros', 'Cortocircuitos'], grad: 'linear-gradient(135deg,#ffa31a,#ff6a3c)' },
  { name: 'Rosa Mendoza', trade: 'Gasfitera', score: 4.8, jobs: 287, tags: ['Termas', 'Fugas'], grad: 'linear-gradient(135deg,#2dd4a8,#1a9e8f)' },
  { name: 'Carlos Huamán', trade: 'Pintor', score: 5.0, jobs: 198, tags: ['Interiores', 'Fachadas'], grad: 'linear-gradient(135deg,#c46a8a,#8a3f6f)' },
  { name: 'María Torres', trade: 'Téc. Electrodomésticos', score: 4.9, jobs: 256, tags: ['Lavadoras', 'Refrigeración'], grad: 'linear-gradient(135deg,#3f8fd9,#2a5fa8)' },
]

function TiltCard({ tech, index }) {
  const ref = useRef(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [9, -9]), { stiffness: 200, damping: 20 })
  const ry = useSpring(useTransform(mx, [0, 1], [-9, 9]), { stiffness: 200, damping: 20 })

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    mx.set(px)
    my.set(py)
    ref.current.style.setProperty('--mx', `${px * 100}%`)
    ref.current.style.setProperty('--my', `${py * 100}%`)
  }

  const onLeave = () => {
    mx.set(0.5)
    my.set(0.5)
  }

  const initials = tech.name.split(' ').map((w) => w[0]).join('')
  const stars = '★'.repeat(Math.round(tech.score))

  return (
    <motion.div
      ref={ref}
      className="tech-card"
      style={{ rotateX: rx, rotateY: ry }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="card-shine" />
      <div className="tech-avatar" style={{ background: tech.grad }}>{initials}</div>
      <h3>{tech.name}</h3>
      <div className="tech-trade">{tech.trade}</div>
      <div className="tech-rating">
        <span className="stars">{stars}</span>
        <span className="score">{tech.score.toFixed(1)}</span>
      </div>
      <div className="tech-tags">
        {tech.tags.map((t) => <span key={t}>{t}</span>)}
      </div>
      <div className="tech-foot">
        <span className="jobs">{tech.jobs} trabajos</span>
        <span className="verified">✓ Verificado</span>
      </div>
    </motion.div>
  )
}

export default function Technicians() {
  return (
    <section id="tecnicos">
      <div className="container">
        <div className="section-head center">
          <span className="kicker">Técnicos destacados</span>
          <h2 className="section-title">Gente que sabe lo que hace.</h2>
          <p className="section-sub">
            Todos pasan verificación de identidad, antecedentes y una prueba
            técnica presencial antes de recibir su primer trabajo.
          </p>
        </div>
        <div className="tech-grid">
          {TECHS.map((t, i) => (
            <TiltCard key={t.name} tech={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

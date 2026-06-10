import { motion } from 'framer-motion'

const FEATURES = [
  { icon: '📍', title: 'Seguimiento en vivo', desc: 'Ve la ubicación del técnico en tiempo real, como tu delivery favorito.' },
  { icon: '💬', title: 'Chat y fotos', desc: 'Envía fotos del problema antes de que llegue. Sin sorpresas.' },
  { icon: '🛡️', title: 'Pago protegido', desc: 'El dinero se libera solo cuando confirmas que el trabajo quedó bien.' },
]

export default function AppSection() {
  return (
    <section id="app">
      <div className="container">
        <div className="app-wrap">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="phone">
              <div className="phone-screen">
                <div className="ps-title">¿Qué pasó en casa? 🏠</div>
                <div className="ps-search">🔍 fuga de agua en la cocina…</div>
                <div className="ps-card active">
                  <div className="ps-ava" style={{ background: 'linear-gradient(135deg,#ffa31a,#ff6a3c)' }}>JQ</div>
                  <div>
                    <h5>Juan Quispe</h5>
                    <p>Gasfitero · 4.9 ★</p>
                  </div>
                  <span className="ps-eta">8 min</span>
                </div>
                <div className="ps-card">
                  <div className="ps-ava" style={{ background: 'linear-gradient(135deg,#2dd4a8,#1a9e8f)' }}>RM</div>
                  <div>
                    <h5>Rosa Mendoza</h5>
                    <p>Gasfitera · 4.8 ★</p>
                  </div>
                  <span className="ps-eta">14 min</span>
                </div>
                <div className="ps-card">
                  <div className="ps-ava" style={{ background: 'linear-gradient(135deg,#3f8fd9,#2a5fa8)' }}>PV</div>
                  <div>
                    <h5>Pedro Vargas</h5>
                    <p>Gasfitero · 4.7 ★</p>
                  </div>
                  <span className="ps-eta">21 min</span>
                </div>
                <div className="ps-btn">Pedir a Juan ahora</div>
              </div>
            </div>
          </motion.div>

          <div>
            <span className="kicker">La app</span>
            <h2 className="section-title">Tu técnico,<br />en el bolsillo.</h2>
            <p className="section-sub">
              Pide, compara, sigue y paga. Todo desde el celular,
              sin llamadas ni regateos incómodos.
            </p>
            <div className="app-features">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  className="app-feature"
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="af-icon">{f.icon}</div>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="store-badges">
              <a href="#" className="store-badge">
                <span style={{ fontSize: 22 }}></span>
                <span><small>DESCARGA EN</small><strong>App Store</strong></span>
              </a>
              <a href="#" className="store-badge">
                <span style={{ fontSize: 22 }}>▶</span>
                <span><small>DISPONIBLE EN</small><strong>Google Play</strong></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

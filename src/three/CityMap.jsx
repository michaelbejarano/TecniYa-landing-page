import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'

// Mini ciudad 3D tipo mapa Uber: pin del usuario, técnicos cerca,
// y una camioneta que recorre la ruta en loop.

const AMBER = '#ffa31a'
const TEAL = '#2dd4a8'

// posiciones libres de edificios (las calles son los ejes en múltiplos de 2)
const HOME = new THREE.Vector3(3, 0, 3)
const TECHS = [
  { id: 1, name: 'Juan Q.', trade: 'Gasfitero', pos: new THREE.Vector3(-5, 0, -3) },
  { id: 2, name: 'Rosa M.', trade: 'Electricista', pos: new THREE.Vector3(5, 0, -5) },
  { id: 3, name: 'Carlos H.', trade: 'Pintor', pos: new THREE.Vector3(-3, 0, 5) },
]

// ruta por las "calles": del técnico 1 hasta la casa, en L
const ROUTE = [
  new THREE.Vector3(-5, 0.12, -3),
  new THREE.Vector3(-5, 0.12, 0),
  new THREE.Vector3(-2, 0.12, 0),
  new THREE.Vector3(-2, 0.12, 2),
  new THREE.Vector3(1, 0.12, 2),
  new THREE.Vector3(1, 0.12, 3),
  new THREE.Vector3(3, 0.12, 3),
]

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function Buildings() {
  const rand = useMemo(() => seededRandom(42), [])
  const blocks = useMemo(() => {
    const list = []
    for (let x = -7; x <= 7; x += 2) {
      for (let z = -7; z <= 7; z += 2) {
        // deja libres calles (coordenadas pares = manzana, dejamos huecos al azar)
        const r = rand()
        if (r < 0.28) continue
        const isHome = Math.abs(x - HOME.x) < 1 && Math.abs(z - HOME.z) < 1
        const isTech = TECHS.some((t) => Math.abs(x - t.pos.x) < 1 && Math.abs(z - t.pos.z) < 1)
        if (isHome || isTech) continue
        const h = 0.3 + r * 1.6
        list.push({ x, z, h, w: 1.1 + rand() * 0.4 })
      }
    }
    return list
  }, [rand])

  return (
    <group>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshStandardMaterial color="#1b3258" roughness={0.9} />
        </mesh>
      ))}
      {/* ventanitas en algunos edificios */}
      {blocks.filter((_, i) => i % 3 === 0).map((b, i) => (
        <mesh key={`w${i}`} position={[b.x, b.h * 0.6, b.z + b.w / 2 + 0.01]}>
          <planeGeometry args={[b.w * 0.5, b.h * 0.3]} />
          <meshBasicMaterial color="#3e6db5" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Pin({ position, color, label, sub, pulse }) {
  const ring = useRef()
  useFrame(({ clock }) => {
    if (!ring.current || !pulse) return
    const t = (clock.getElapsedTime() * 0.8) % 1
    ring.current.scale.setScalar(0.5 + t * 2)
    ring.current.material.opacity = 0.5 * (1 - t)
  })

  return (
    <group position={position}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <coneGeometry args={[0.1, 0.5, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
      {pulse && (
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.5, 0.62, 40]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} toneMapped={false} />
        </mesh>
      )}
      {label && (
        <Html position={[0, 1.15, 0]} center zIndexRange={[10, 0]}>
          <div
            style={{
              background: 'rgba(8,17,32,0.9)',
              border: `1px solid ${color}`,
              borderRadius: 10,
              padding: '5px 10px',
              fontFamily: "'Spline Sans Mono', monospace",
              fontSize: 11,
              color: '#f4efe4',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {label}
            {sub && <span style={{ color, marginLeft: 6 }}>{sub}</span>}
          </div>
        </Html>
      )}
    </group>
  )
}

function Van() {
  const van = useRef()
  const [eta, setEta] = useState(8)
  const curve = useMemo(() => new THREE.CatmullRomCurve3(ROUTE, false, 'catmullrom', 0.05), [])

  useFrame(({ clock }) => {
    if (!van.current) return
    const t = (clock.getElapsedTime() * 0.07) % 1
    const p = curve.getPointAt(t)
    const tan = curve.getTangentAt(t)
    van.current.position.copy(p)
    van.current.rotation.y = Math.atan2(tan.x, tan.z)
    const remaining = Math.max(1, Math.round((1 - t) * 8))
    if (remaining !== eta) setEta(remaining)
  })

  return (
    <group ref={van}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.32, 0.22, 0.55]} />
        <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.3, -0.08]}>
        <boxGeometry args={[0.28, 0.14, 0.3]} />
        <meshStandardMaterial color="#fff3dd" />
      </mesh>
      <Html position={[0, 0.75, 0]} center zIndexRange={[15, 0]}>
        <div
          style={{
            background: AMBER,
            color: '#081120',
            borderRadius: 8,
            padding: '3px 9px',
            fontFamily: "'Spline Sans Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          🔧 {eta} min
        </div>
      </Html>
    </group>
  )
}

export default function CityMap() {
  const world = useRef()
  const routePoints = useMemo(
    () => new THREE.CatmullRomCurve3(ROUTE, false, 'catmullrom', 0.05).getPoints(80),
    []
  )

  useFrame(({ pointer }) => {
    if (!world.current) return
    world.current.rotation.y = THREE.MathUtils.lerp(world.current.rotation.y, pointer.x * 0.12, 0.05)
    world.current.rotation.x = THREE.MathUtils.lerp(world.current.rotation.x, pointer.y * 0.04, 0.05)
  })

  return (
    <>
      <ambientLight intensity={0.5} color="#9fc0f5" />
      <directionalLight position={[8, 12, 4]} intensity={1.1} color="#ffeed8" castShadow />

      <group ref={world} position={[0, -1.2, 0]}>
        {/* base del mapa */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[17, 17]} />
          <meshStandardMaterial color="#0d1d3a" roughness={1} />
        </mesh>
        {/* trama de calles */}
        <gridHelper args={[16, 8, '#27497e', '#1a3460']} position={[0, 0.02, 0]} />

        <Buildings />

        {/* ruta iluminada */}
        <Line points={routePoints} color={AMBER} lineWidth={2.5} transparent opacity={0.85} />

        <Van />

        <Pin position={HOME} color={TEAL} label="Tu casa" pulse />
        {TECHS.map((t) => (
          <Pin key={t.id} position={t.pos} color={AMBER} label={t.name} sub={t.trade} />
        ))}
      </group>
    </>
  )
}

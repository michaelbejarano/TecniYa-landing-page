import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, N8AO, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

// Casa "exploded view" controlada por scroll (estilo keynote de Apple):
// cerrada al inicio; al bajar, techo se eleva, fachada se desprende,
// paredes se separan y el piso superior se despega revelando 4 ambientes.
// `progress` es el MotionValue del scroll (0..1 del hero).

const AMBER = '#ffa31a'
const WALL = '#eae2d6' // beige cálido
const WALL_DARK = '#d6c9b4'
const FLOOR = '#6f4e37' // madera nogal
const ROOF = '#c95a35' // terracota apagado
const WOOD = '#6f4e37'
const BLACK = '#222222' // negro mate
const GOLD = '#d4b16a' // dorado suave
const GRAY = '#c8c8c8'
const LIFT = 1.18 // cuánto sube el segundo piso al explotar
const ROOF_LIFT = 2.6 // cuánto sube el techo

// Pieza genérica: se desplaza desde `base` en dirección `dir` según el
// factor de explosión e (0 = casa cerrada, 1 = abierta).
// Bordes redondeados + material PBR (roughness/metalness por pieza).
function Part({
  ctx, base, dir = [0, 0, 0], rotZ = 0, spinZ = 0, args, color,
  fade = false, emissive = null, emissiveIntensity = 0,
  roughness = 0.85, metalness = 0, radius = 0.02,
}) {
  const ref = useRef()
  const mat = useRef()
  // el radio no puede exceder la mitad de la dimensión más corta
  const r = Math.min(radius, Math.min(...args) * 0.38)

  useFrame(() => {
    const e = ctx.current
    if (!ref.current) return
    ref.current.position.set(
      base[0] + dir[0] * e,
      base[1] + dir[1] * e,
      base[2] + dir[2] * e
    )
    if (spinZ) ref.current.rotation.z = rotZ + spinZ * e
    if (fade && mat.current) {
      const o = 1 - Math.min(1, e * 1.5)
      mat.current.opacity = o
      ref.current.visible = o > 0.02
    }
  })

  return (
    <RoundedBox
      ref={ref}
      args={args}
      radius={r}
      smoothness={2}
      position={base}
      rotation={[0, 0, rotZ]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        ref={mat}
        color={color}
        roughness={roughness}
        metalness={metalness}
        transparent={fade}
        emissive={emissive || '#000000'}
        emissiveIntensity={emissiveIntensity}
        toneMapped={!emissive}
      />
    </RoundedBox>
  )
}

function Hotspot({ ctx, base, lift = 0, active }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const e = ctx.current
    const t = clock.getElapsedTime()
    const s = e * (active ? 1.7 : 1 + Math.sin(t * 3 + base[0]) * 0.15)
    if (!ref.current) return
    ref.current.scale.setScalar(Math.max(0.001, s))
    ref.current.position.set(base[0], base[1] + lift * e, base[2])
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshStandardMaterial
        color={AMBER}
        emissive={AMBER}
        emissiveIntensity={active ? 3.5 : 1.8}
        toneMapped={false}
      />
    </mesh>
  )
}

function RoomLight({ ctx, base, lift = 0, active }) {
  const ref = useRef()
  useFrame((_, dt) => {
    const e = ctx.current
    if (!ref.current) return
    ref.current.position.set(base[0], base[1] + lift * e, base[2])
    const target = e * (active ? 7 : 1.1)
    ref.current.intensity = THREE.MathUtils.damp(ref.current.intensity, target, 4, dt)
  })
  return <pointLight ref={ref} distance={3.2} color={AMBER} intensity={0} />
}

/* ---------- Viñetas animadas por ambiente ---------- */

// Gotas cayendo en loop (fuga de cocina / grifo de baño)
function Drops({ ctx, base, lift = 0, height = 0.5, active }) {
  const refs = [useRef(), useRef(), useRef()]
  useFrame(({ clock }) => {
    const e = ctx.current
    const t = clock.getElapsedTime()
    refs.forEach((r, i) => {
      if (!r.current) return
      const cycle = (t * (active ? 1.5 : 0.8) + i * 0.33) % 1
      r.current.position.set(base[0], base[1] + lift * e - cycle * height, base[2])
      r.current.scale.setScalar(0.6 + cycle * 0.5)
      r.current.visible = e > 0.55
    })
  })
  return refs.map((r, i) => (
    <mesh key={i} ref={r}>
      <sphereGeometry args={[0.035, 8, 8]} />
      <meshStandardMaterial
        color="#5fb8ff"
        emissive="#3d9bff"
        emissiveIntensity={1.3}
        toneMapped={false}
        transparent
        opacity={0.9}
      />
    </mesh>
  ))
}

// Charco que pulsa bajo la fuga
function Puddle({ ctx, base, lift = 0, active }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const e = ctx.current
    const t = clock.getElapsedTime()
    if (!ref.current) return
    const s = (1 + Math.sin(t * 2.4) * 0.18) * (active ? 1.25 : 1)
    ref.current.scale.set(s, 1, s * 0.8)
    ref.current.position.set(base[0], base[1] + lift * e, base[2])
    ref.current.visible = e > 0.55
  })
  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.2, 0.2, 0.015, 20]} />
      <meshStandardMaterial
        color="#2d7fd9"
        emissive="#2d7fd9"
        emissiveIntensity={0.5}
        transparent
        opacity={0.7}
        toneMapped={false}
      />
    </mesh>
  )
}

// Chispas eléctricas intermitentes (tomacorriente de la sala)
function Sparks({ ctx, base, active }) {
  const spark = useRef()
  const light = useRef()
  useFrame(({ clock }) => {
    const e = ctx.current
    const t = clock.getElapsedTime()
    const flick = Math.max(0, Math.sin(t * 9) * Math.sin(t * 13.7) - 0.15) * (active ? 1 : 0.45)
    if (spark.current) {
      spark.current.visible = e > 0.55 && flick > 0.12
      spark.current.scale.setScalar(0.6 + flick * 1.2)
      spark.current.rotation.z = t * 4
    }
    if (light.current) light.current.intensity = e * flick * 7
  })
  return (
    <group position={base}>
      <mesh ref={spark}>
        <octahedronGeometry args={[0.07, 0]} />
        <meshBasicMaterial color="#ffe9a8" toneMapped={false} />
      </mesh>
      <pointLight ref={light} distance={1.8} color="#ffd24d" intensity={0} />
    </group>
  )
}

// Serrucho cortando una tabla (carpintería en el dormitorio)
function Saw({ ctx, active }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const e = ctx.current
    const t = clock.getElapsedTime()
    if (!ref.current) return
    const sp = active ? 5 : 2
    ref.current.position.set(0.45 + Math.sin(t * sp) * 0.16, 2.08 + LIFT * e, 0.2)
    ref.current.rotation.z = Math.sin(t * sp) * 0.09
    ref.current.visible = e > 0.45
  })
  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[0.34, 0.1, 0.02]} />
        <meshStandardMaterial color="#cdd3da" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0.22, 0.05, 0]}>
        <boxGeometry args={[0.14, 0.08, 0.05]} />
        <meshStandardMaterial color="#8a5a33" roughness={0.8} />
      </mesh>
    </group>
  )
}

// Técnico low-poly con casco y herramienta; el brazo derecho "trabaja"
// y acelera cuando su ambiente está enfocado.
function Technician({ ctx, base, lift = 0, rotY = 0, suit = '#3f8fd9', pose = 'stand', tool = 'wrench', active, speed = [3, 7] }) {
  const group = useRef()
  const arm = useRef()

  useFrame(({ clock }) => {
    const e = ctx.current
    const t = clock.getElapsedTime()
    if (!group.current) return
    group.current.visible = e > 0.5
    group.current.position.set(base[0], base[1] + lift * e + Math.sin(t * 2.2 + base[0]) * 0.01, base[2])
    if (arm.current) {
      const sp = active ? speed[1] : speed[0]
      arm.current.rotation.x = -1.0 + Math.sin(t * sp) * (active ? 0.42 : 0.18)
    }
  })

  const kneel = pose === 'kneel'
  const skin = '#e3a87c'
  const dark = '#1f2c45'
  const metal = { color: '#cdd3da', metalness: 0.7, roughness: 0.3 }

  return (
    <group ref={group} position={base} rotation={[0, rotY, 0]}>
      {/* piernas */}
      {kneel ? (
        <mesh position={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.2]} />
          <meshStandardMaterial color={dark} />
        </mesh>
      ) : (
        <>
          <mesh position={[-0.05, 0.12, 0]} castShadow>
            <boxGeometry args={[0.07, 0.24, 0.08]} />
            <meshStandardMaterial color={dark} />
          </mesh>
          <mesh position={[0.05, 0.12, 0]} castShadow>
            <boxGeometry args={[0.07, 0.24, 0.08]} />
            <meshStandardMaterial color={dark} />
          </mesh>
        </>
      )}
      {/* torso con franja reflectante */}
      <mesh position={[0, kneel ? 0.25 : 0.38, 0]} castShadow>
        <boxGeometry args={[0.21, 0.28, 0.12]} />
        <meshStandardMaterial color={suit} />
      </mesh>
      <mesh position={[0, kneel ? 0.25 : 0.38, 0.063]}>
        <boxGeometry args={[0.21, 0.045, 0.005]} />
        <meshStandardMaterial color="#ffe9a8" emissive="#ffd24d" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      {/* brazo izquierdo */}
      <mesh position={[-0.135, kneel ? 0.26 : 0.38, 0]} castShadow>
        <boxGeometry args={[0.05, 0.22, 0.06]} />
        <meshStandardMaterial color={suit} />
      </mesh>
      {/* brazo derecho trabajando (pivot en el hombro) */}
      <group ref={arm} position={[0.135, kneel ? 0.34 : 0.48, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.05, 0.22, 0.06]} />
          <meshStandardMaterial color={suit} />
        </mesh>
        {tool === 'wrench' && (
          <group position={[0, -0.22, 0.02]}>
            <mesh>
              <boxGeometry args={[0.025, 0.13, 0.02]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh position={[0, 0.075, 0]}>
              <boxGeometry args={[0.07, 0.04, 0.025]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          </group>
        )}
        {tool === 'screwdriver' && (
          <group position={[0, -0.22, 0.02]}>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.014, 0.014, 0.1, 8]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh position={[0, -0.03, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.06, 8]} />
              <meshStandardMaterial color={AMBER} />
            </mesh>
          </group>
        )}
      </group>
      {/* cabeza + casco de seguridad */}
      <mesh position={[0, kneel ? 0.46 : 0.58, 0]} castShadow>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, kneel ? 0.515 : 0.635, 0]}>
        <cylinderGeometry args={[0.075, 0.08, 0.05, 12]} />
        <meshStandardMaterial color={AMBER} />
      </mesh>
      <mesh position={[0, kneel ? 0.495 : 0.615, 0.065]}>
        <boxGeometry args={[0.1, 0.015, 0.06]} />
        <meshStandardMaterial color={AMBER} />
      </mesh>
    </group>
  )
}

function Dust() {
  const ref = useRef()
  const positions = useMemo(() => {
    const a = new Float32Array(150 * 3)
    for (let i = 0; i < 150; i++) {
      a[i * 3] = (Math.random() - 0.5) * 15
      a[i * 3 + 1] = Math.random() * 7.5
      a[i * 3 + 2] = (Math.random() - 0.5) * 11
    }
    return a
  }, [])
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.02
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={150} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#7da5e6" transparent opacity={0.45} sizeAttenuation />
    </points>
  )
}

// Cámara dirigida por fase de scroll: intro → explosión → tour por ambientes → cierre
const CAM = {
  intro: { pos: [4.6, 2.6, 9.8], tgt: [-1.7, 1.6, 0] },
  explode: { pos: [5.2, 3.8, 9.6], tgt: [0, 1.9, 0] },
  0: { pos: [-2.5, 1.5, 5.6], tgt: [-1.1, 0.85, 0] }, // cocina
  1: { pos: [2.7, 1.5, 5.6], tgt: [1.1, 0.85, 0] }, // sala
  2: { pos: [-2.5, 4.1, 5.4], tgt: [-1.1, 3.35, 0] }, // baño
  3: { pos: [2.7, 4.1, 5.4], tgt: [1.1, 3.35, 0] }, // dormitorio
  outro: { pos: [6.4, 4.8, 10.6], tgt: [0, 2.2, 0] },
}

function CameraRig({ phase }) {
  const { camera } = useThree()
  const tgt = useRef(new THREE.Vector3(-1.7, 1.6, 0))
  useFrame((_, dt) => {
    const c = CAM[phase] ?? CAM.explode
    const d = THREE.MathUtils.damp
    camera.position.x = d(camera.position.x, c.pos[0], 2, dt)
    camera.position.y = d(camera.position.y, c.pos[1], 2, dt)
    camera.position.z = d(camera.position.z, c.pos[2], 2, dt)
    tgt.current.x = d(tgt.current.x, c.tgt[0], 2.4, dt)
    tgt.current.y = d(tgt.current.y, c.tgt[1], 2.4, dt)
    tgt.current.z = d(tgt.current.z, c.tgt[2], 2.4, dt)
    camera.lookAt(tgt.current)
  })
  return null
}

export default function ExplodedHouse({ progress, phase, activeRoom }) {
  const ctx = useRef(0)
  const group = useRef()

  useFrame(({ clock }) => {
    const p = progress.get()
    ctx.current = THREE.MathUtils.smoothstep(p, 0.06, 0.34)
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.18) * 0.03
    }
  })

  const up = [0, LIFT, 0] // piezas del segundo piso

  return (
    <>
      <fog attach="fog" args={['#081120', 13, 27]} />

      {/* Iluminación de 3 puntos: key cálida con sombras suaves, fill fría, rim azul trasera */}
      <ambientLight intensity={0.22} color="#9fb4d8" />
      <directionalLight
        position={[7, 10, 6]}
        intensity={1.7}
        color="#ffe8c8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={9}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-6, 4, 5]} intensity={0.4} color="#7da5e6" />
      <spotLight position={[-5, 7, -8]} intensity={1.4} angle={0.7} penumbra={1} color="#5b8dd9" />

      {/* Environment local (sin red): reflejos suaves para los materiales PBR */}
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={2} color="#ffe8c8" position={[5, 6, 4]} scale={[6, 4, 1]} target={[0, 1, 0]} />
        <Lightformer form="rect" intensity={1.1} color="#3a64b0" position={[-6, 3, -4]} scale={[5, 4, 1]} target={[0, 1, 0]} />
        <Lightformer form="circle" intensity={1.4} color="#fff6e8" position={[0, 8, 0]} scale={[4, 4, 1]} target={[0, 0, 0]} />
      </Environment>

      <CameraRig phase={phase} />

      <group ref={group}>
        {/* ---------- terreno ---------- */}
        <Part ctx={ctx} base={[0, -0.14, 0]} args={[5.6, 0.25, 3.6]} color="#16335c" edges={false} />

        {/* ---------- piso 1 (queda en su sitio) ---------- */}
        <Part ctx={ctx} base={[0, 0.06, 0]} args={[4.4, 0.12, 2.4]} color={FLOOR} roughness={0.55} radius={0.025} />
        <Part ctx={ctx} base={[0, 0.84, -0.85]} dir={[0, 0, -0.9]} args={[4.4, 1.55, 0.12]} color={WALL} />
        <Part ctx={ctx} base={[-2.2, 0.84, 0]} dir={[-1.1, 0, 0]} args={[0.12, 1.55, 1.78]} color={WALL_DARK} />
        <Part ctx={ctx} base={[2.2, 0.84, 0]} dir={[1.1, 0, 0]} args={[0.12, 1.55, 1.78]} color={WALL_DARK} />
        <Part ctx={ctx} base={[0, 0.84, -0.05]} args={[0.1, 1.5, 1.7]} color={WALL_DARK} />
        {/* ventanas traseras piso 1 */}
        <Part ctx={ctx} base={[-1.1, 0.95, -0.78]} dir={[0, 0, -0.9]} args={[0.5, 0.42, 0.05]} color="#ffd27a" emissive="#ffb544" emissiveIntensity={0.7} edges={false} />
        <Part ctx={ctx} base={[1.1, 0.95, -0.78]} dir={[0, 0, -0.9]} args={[0.5, 0.42, 0.05]} color="#ffd27a" emissive="#ffb544" emissiveIntensity={0.7} edges={false} />

        {/* ---------- piso 2 (se despega hacia arriba) ---------- */}
        <Part ctx={ctx} base={[0, 1.6, 0]} dir={up} args={[4.4, 0.14, 2.4]} color={FLOOR} roughness={0.55} radius={0.025} />
        <Part ctx={ctx} base={[0, 2.42, -0.85]} dir={[0, LIFT, -0.9]} args={[4.4, 1.55, 0.12]} color={WALL} />
        <Part ctx={ctx} base={[-2.2, 2.42, 0]} dir={[-1.1, LIFT, 0]} args={[0.12, 1.55, 1.78]} color={WALL_DARK} />
        <Part ctx={ctx} base={[2.2, 2.42, 0]} dir={[1.1, LIFT, 0]} args={[0.12, 1.55, 1.78]} color={WALL_DARK} />
        <Part ctx={ctx} base={[0, 2.42, -0.05]} dir={up} args={[0.1, 1.5, 1.7]} color={WALL_DARK} />
        {/* ventanas traseras piso 2 */}
        <Part ctx={ctx} base={[-1.1, 2.55, -0.78]} dir={[0, LIFT, -0.9]} args={[0.5, 0.42, 0.05]} color="#ffd27a" emissive="#ffb544" emissiveIntensity={0.7} edges={false} />
        <Part ctx={ctx} base={[1.1, 2.55, -0.78]} dir={[0, LIFT, -0.9]} args={[0.5, 0.42, 0.05]} color="#ffd27a" emissive="#ffb544" emissiveIntensity={0.7} edges={false} />

        {/* ---------- techo a dos aguas (vuela alto y se abre) ---------- */}
        <Part ctx={ctx} base={[-1.12, 3.66, 0]} dir={[-0.55, ROOF_LIFT, 0]} rotZ={0.42} spinZ={0.16} args={[2.55, 0.14, 2.6]} color={ROOF} roughness={0.7} radius={0.03} />
        <Part ctx={ctx} base={[1.12, 3.66, 0]} dir={[0.55, ROOF_LIFT, 0]} rotZ={-0.42} spinZ={-0.16} args={[2.55, 0.14, 2.6]} color={ROOF} roughness={0.7} radius={0.03} />
        <Part ctx={ctx} base={[1.5, 3.85, -0.3]} dir={[0.75, ROOF_LIFT + 0.2, 0]} args={[0.3, 0.6, 0.3]} color={WALL_DARK} />

        {/* ---------- fachada frontal (cierra la casa; se desprende y desvanece) ---------- */}
        <Part ctx={ctx} base={[-1.1, 0.84, 0.9]} dir={[-1.7, 0, 2.0]} args={[2.2, 1.55, 0.1]} color={WALL} fade />
        <Part ctx={ctx} base={[1.1, 0.84, 0.9]} dir={[1.7, 0, 2.0]} args={[2.2, 1.55, 0.1]} color={WALL} fade />
        <Part ctx={ctx} base={[-1.1, 2.42, 0.9]} dir={[-1.7, 0.6, 2.0]} args={[2.2, 1.55, 0.1]} color={WALL} fade />
        <Part ctx={ctx} base={[1.1, 2.42, 0.9]} dir={[1.7, 0.6, 2.0]} args={[2.2, 1.55, 0.1]} color={WALL} fade />
        {/* puerta y ventanas frontales, viajan con su panel */}
        <Part ctx={ctx} base={[-0.5, 0.6, 0.97]} dir={[-1.7, 0, 2.0]} args={[0.6, 1.05, 0.08]} color="#7a4b26" fade />
        <Part ctx={ctx} base={[1.1, 1.0, 0.97]} dir={[1.7, 0, 2.0]} args={[0.55, 0.45, 0.08]} color="#ffd27a" emissive="#ffb544" emissiveIntensity={0.8} fade edges={false} />
        <Part ctx={ctx} base={[-1.1, 2.55, 0.97]} dir={[-1.7, 0.6, 2.0]} args={[0.55, 0.45, 0.08]} color="#ffd27a" emissive="#ffb544" emissiveIntensity={0.8} fade edges={false} />
        <Part ctx={ctx} base={[1.1, 2.55, 0.97]} dir={[1.7, 0.6, 2.0]} args={[0.55, 0.45, 0.08]} color="#ffd27a" emissive="#ffb544" emissiveIntensity={0.8} fade edges={false} />

        {/* ---------- mobiliario: cocina (piso 1 izq) ---------- */}
        <Part ctx={ctx} base={[-1.45, 0.28, -0.45]} args={[0.9, 0.35, 0.5]} color={GRAY} roughness={0.5} radius={0.04} />
        <Part ctx={ctx} base={[-0.55, 0.35, -0.5]} args={[0.35, 0.5, 0.4]} color="#dfe3e6" metalness={0.55} roughness={0.32} radius={0.04} />
        <Part ctx={ctx} base={[-1.0, 0.48, 0.35]} args={[0.5, 0.06, 0.5]} color={WOOD} roughness={0.5} radius={0.03} />
        {/* refrigeradora acero + manija */}
        <Part ctx={ctx} base={[-1.92, 0.6, 0.35]} args={[0.42, 0.95, 0.42]} color="#d8dadc" metalness={0.65} roughness={0.3} radius={0.05} />
        <Part ctx={ctx} base={[-1.7, 0.75, 0.45]} args={[0.025, 0.3, 0.025]} color="#9aa7b8" metalness={0.85} roughness={0.3} />
        {/* hornillas y olla de acero sobre la cocina */}
        <Part ctx={ctx} base={[-1.6, 0.47, -0.4]} args={[0.18, 0.02, 0.18]} color={BLACK} roughness={0.4} />
        <Part ctx={ctx} base={[-1.28, 0.47, -0.4]} args={[0.18, 0.02, 0.18]} color={BLACK} roughness={0.4} />
        <Part ctx={ctx} base={[-1.28, 0.53, -0.4]} args={[0.14, 0.09, 0.14]} color="#cdd3da" metalness={0.9} roughness={0.22} radius={0.03} />
        {/* caja de herramientas roja del gasfitero */}
        <Part ctx={ctx} base={[-1.05, 0.19, 0.35]} args={[0.28, 0.14, 0.16]} color="#d9412d" roughness={0.55} radius={0.03} />
        <Part ctx={ctx} base={[-1.05, 0.275, 0.35]} args={[0.1, 0.025, 0.03]} color={BLACK} metalness={0.6} roughness={0.4} />
        {/* tubería metálica expuesta bajo el lavadero */}
        <Part ctx={ctx} base={[-0.55, 0.25, -0.42]} args={[0.05, 0.28, 0.05]} color="#9aa7b8" metalness={0.85} roughness={0.32} />
        <Part ctx={ctx} base={[-0.48, 0.13, -0.42]} args={[0.12, 0.05, 0.05]} color="#9aa7b8" metalness={0.85} roughness={0.32} />

        {/* ---------- sala (piso 1 der): sofá de tela, mesa nogal, TV negro mate ---------- */}
        <Part ctx={ctx} base={[1.2, 0.26, -0.4]} args={[1.0, 0.3, 0.45]} color="#97a0ae" roughness={1} radius={0.06} />
        <Part ctx={ctx} base={[1.45, 0.45, -0.55]} args={[0.45, 0.12, 0.15]} color="#c9c2b4" roughness={1} radius={0.05} />
        <Part ctx={ctx} base={[1.1, 0.22, 0.35]} args={[0.55, 0.05, 0.35]} color={WOOD} roughness={0.45} radius={0.025} />
        <Part ctx={ctx} base={[1.2, 1.0, -0.72]} args={[0.5, 0.32, 0.06]} color={BLACK} metalness={0.3} roughness={0.3} radius={0.015} />
        {/* alfombra */}
        <Part ctx={ctx} base={[1.15, 0.13, 0.05]} args={[0.9, 0.015, 0.65]} color="#24456e" roughness={1} />
        {/* lámpara de pie: poste negro mate, base dorada, pantalla encendida */}
        <Part ctx={ctx} base={[1.95, 0.5, 0.5]} args={[0.03, 0.75, 0.03]} color={BLACK} metalness={0.5} roughness={0.4} />
        <Part ctx={ctx} base={[1.95, 0.13, 0.5]} args={[0.14, 0.02, 0.14]} color={GOLD} metalness={0.8} roughness={0.3} />
        <Part ctx={ctx} base={[1.95, 0.92, 0.5]} args={[0.2, 0.16, 0.2]} color="#ffd27a" emissive="#ffb544" emissiveIntensity={0.8} radius={0.04} />
        {/* planta */}
        <Part ctx={ctx} base={[0.35, 0.17, 0.6]} args={[0.13, 0.12, 0.13]} color="#b35e3b" roughness={0.9} radius={0.03} />
        <Part ctx={ctx} base={[0.35, 0.32, 0.6]} args={[0.18, 0.2, 0.18]} color="#2f7d52" roughness={1} radius={0.07} />
        {/* cuadro con marco dorado en la pared trasera */}
        <Part ctx={ctx} base={[0.65, 1.05, -0.77]} dir={[0, 0, -0.9]} args={[0.34, 0.26, 0.03]} color="#2d5f8a" roughness={0.4} />
        <Part ctx={ctx} base={[0.65, 1.05, -0.785]} dir={[0, 0, -0.9]} args={[0.38, 0.3, 0.02]} color={GOLD} metalness={0.7} roughness={0.35} />
        {/* bolso de herramientas del electricista */}
        <Part ctx={ctx} base={[0.72, 0.18, 0.55]} args={[0.24, 0.13, 0.15]} color={BLACK} roughness={0.8} radius={0.04} />
        <Part ctx={ctx} base={[0.72, 0.25, 0.55]} args={[0.24, 0.02, 0.15]} color={AMBER} roughness={0.6} />

        {/* ---------- baño (piso 2 izq): cerámica con brillo, espejo y metales ---------- */}
        <Part ctx={ctx} base={[-1.5, 1.85, -0.4]} dir={up} args={[0.55, 0.25, 0.4]} color="#ffffff" roughness={0.22} radius={0.05} />
        <Part ctx={ctx} base={[-0.6, 1.92, -0.45]} dir={up} args={[0.3, 0.4, 0.3]} color="#ffffff" roughness={0.22} radius={0.06} />
        <Part ctx={ctx} base={[-0.6, 2.15, -0.55]} dir={up} args={[0.26, 0.25, 0.1]} color="#f4f6f8" roughness={0.22} radius={0.04} />
        <Part ctx={ctx} base={[-1.5, 2.2, -0.4]} dir={up} args={[0.04, 0.5, 0.04]} color="#b8c2cc" metalness={0.9} roughness={0.2} />
        {/* espejo sobre el lavatorio */}
        <Part ctx={ctx} base={[-1.5, 2.55, -0.77]} dir={[0, LIFT, -0.9]} args={[0.36, 0.3, 0.03]} color="#cfe2f2" metalness={1} roughness={0.06} />
        {/* ducha de esquina cromada */}
        <Part ctx={ctx} base={[-2.0, 2.15, -0.6]} dir={up} args={[0.04, 0.85, 0.04]} color="#b8c2cc" metalness={0.9} roughness={0.22} />
        <Part ctx={ctx} base={[-1.95, 2.6, -0.5]} dir={up} args={[0.12, 0.03, 0.12]} color="#cdd3da" metalness={0.9} roughness={0.2} />
        {/* toalla colgada en el divisor + tapete */}
        <Part ctx={ctx} base={[-0.09, 2.18, 0.35]} dir={up} args={[0.04, 0.24, 0.2]} color="#2dd4a8" roughness={1} radius={0.02} />
        <Part ctx={ctx} base={[-1.1, 1.69, 0.1]} dir={up} args={[0.34, 0.015, 0.22]} color="#1a9e8f" roughness={1} />

        {/* ---------- dormitorio (piso 2 der): cama de tela + banco de carpintero ---------- */}
        <Part ctx={ctx} base={[1.55, 1.86, -0.35]} dir={up} args={[0.85, 0.28, 0.55]} color="#b3766f" roughness={1} radius={0.06} />
        <Part ctx={ctx} base={[1.55, 2.0, -0.58]} dir={up} args={[0.85, 0.1, 0.15]} color="#f2ede2" roughness={1} radius={0.04} />
        {/* tabla en proceso de corte sobre dos caballetes */}
        <Part ctx={ctx} base={[0.45, 1.99, 0.2]} dir={up} args={[0.85, 0.06, 0.26]} color="#9a6b42" roughness={0.6} radius={0.02} />
        <Part ctx={ctx} base={[0.15, 1.84, 0.2]} dir={up} args={[0.07, 0.24, 0.26]} color={WOOD} roughness={0.65} />
        <Part ctx={ctx} base={[0.75, 1.84, 0.2]} dir={up} args={[0.07, 0.24, 0.26]} color={WOOD} roughness={0.65} />
        {/* puerta nueva de nogal apoyada en la pared */}
        <Part ctx={ctx} base={[1.95, 2.35, 0.55]} dir={[1.1, LIFT, 0]} args={[0.06, 1.3, 0.5]} color={WOOD} roughness={0.5} radius={0.02} />
        {/* alfombra, velador con lámpara, aserrín y prensa en la tabla */}
        <Part ctx={ctx} base={[1.3, 1.69, 0.15]} args={[0.7, 0.015, 0.5]} dir={up} color="#4a3258" roughness={1} />
        <Part ctx={ctx} base={[1.0, 1.78, -0.6]} dir={up} args={[0.2, 0.18, 0.2]} color={WOOD} roughness={0.55} radius={0.03} />
        <Part ctx={ctx} base={[1.0, 1.93, -0.6]} dir={up} args={[0.09, 0.1, 0.09]} color="#ffd27a" emissive="#ffb544" emissiveIntensity={0.7} radius={0.03} />
        <Part ctx={ctx} base={[0.45, 1.71, 0.4]} dir={up} args={[0.16, 0.05, 0.1]} color="#c9a06a" roughness={1} radius={0.03} />
        <Part ctx={ctx} base={[0.3, 1.7, 0.05]} dir={up} args={[0.05, 0.018, 0.03]} color="#c9a06a" roughness={1} />
        <Part ctx={ctx} base={[0.62, 1.7, 0.33]} dir={up} args={[0.04, 0.015, 0.05]} color="#c9a06a" roughness={1} />
        <Part ctx={ctx} base={[0.14, 2.04, 0.2]} dir={up} args={[0.04, 0.12, 0.06]} color="#cdd3da" metalness={0.85} roughness={0.3} />

        {/* tomacorriente en el muro divisor (lado sala) */}
        <Part ctx={ctx} base={[0.08, 0.5, 0.3]} args={[0.05, 0.14, 0.1]} color="#e8e8e8" edges={false} />

        {/* ---------- viñetas animadas: cada ambiente muestra su servicio ---------- */}
        {/* cocina: electrodomésticos — chispas de diagnóstico en la refrigeradora */}
        <Sparks ctx={ctx} base={[-1.92, 0.85, 0.4]} active={activeRoom === 0} />
        {/* sala: chispas en el tomacorriente */}
        <Sparks ctx={ctx} base={[0.14, 0.52, 0.3]} active={activeRoom === 1} />
        {/* baño: grifo goteando sobre el lavatorio */}
        <Drops ctx={ctx} base={[-1.5, 2.42, -0.4]} lift={LIFT} height={0.42} active={activeRoom === 2} />
        <Puddle ctx={ctx} base={[-1.5, 1.99, -0.4]} lift={LIFT} active={activeRoom === 2} />
        {/* dormitorio: serrucho cortando la tabla */}
        <Saw ctx={ctx} active={activeRoom === 3} />

        {/* ---------- técnicos trabajando en cada ambiente ---------- */}
        {/* técnico de electrodomésticos frente a la refrigeradora de la cocina */}
        <Technician
          ctx={ctx}
          base={[-1.55, 0.13, 0.4]}
          rotY={-Math.PI / 2}
          suit="#3f8fd9"
          tool="screwdriver"
          active={activeRoom === 0}
        />
        {/* electricista frente al tomacorriente de la sala */}
        <Technician
          ctx={ctx}
          base={[0.5, 0.13, 0.3]}
          rotY={-Math.PI / 2}
          suit="#3f8fd9"
          tool="screwdriver"
          active={activeRoom === 1}
        />
        {/* gasfitero ajustando la grifería del baño */}
        <Technician
          ctx={ctx}
          base={[-1.12, 1.68, -0.05]}
          lift={LIFT}
          rotY={-2.4}
          suit="#1a9e8f"
          tool="wrench"
          active={activeRoom === 2}
        />
        {/* carpintero serruchando la tabla (brazo sincronizado con el serrucho) */}
        <Technician
          ctx={ctx}
          base={[1.0, 1.68, 0.2]}
          lift={LIFT}
          rotY={-Math.PI / 2}
          suit="#8a5a33"
          tool="none"
          speed={[2, 5]}
          active={activeRoom === 3}
        />

        {/* ---------- hotspots y luces por ambiente ---------- */}
        <Hotspot ctx={ctx} base={[-1.1, 0.9, 0.55]} active={activeRoom === 0} />
        <Hotspot ctx={ctx} base={[1.1, 0.9, 0.55]} active={activeRoom === 1} />
        <Hotspot ctx={ctx} base={[-1.1, 2.5, 0.55]} lift={LIFT} active={activeRoom === 2} />
        <Hotspot ctx={ctx} base={[1.1, 2.5, 0.55]} lift={LIFT} active={activeRoom === 3} />
        <RoomLight ctx={ctx} base={[-1.1, 1.2, 0.2]} active={activeRoom === 0} />
        <RoomLight ctx={ctx} base={[1.1, 1.2, 0.2]} active={activeRoom === 1} />
        <RoomLight ctx={ctx} base={[-1.1, 2.8, 0.2]} lift={LIFT} active={activeRoom === 2} />
        <RoomLight ctx={ctx} base={[1.1, 2.8, 0.2]} lift={LIFT} active={activeRoom === 3} />
      </group>

      <Dust />
      <ContactShadows position={[0, -0.27, 0]} opacity={0.55} scale={13} blur={2.6} far={4} color="#020817" />

      {/* Postprocesado: oclusión ambiental + bloom suave + viñeta */}
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={0.5} intensity={1.5} distanceFalloff={0.8} halfRes />
        <Bloom mipmapBlur intensity={0.55} luminanceThreshold={1} luminanceSmoothing={0.25} />
        <Vignette eskil={false} offset={0.22} darkness={0.5} />
      </EffectComposer>
    </>
  )
}

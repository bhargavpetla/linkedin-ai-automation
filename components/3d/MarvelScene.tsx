"use client";
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Sparkles, Stars, Line, Box, Octahedron, Icosahedron, Torus } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';

// --- LAMBO COLOR PALETTE ---
const C_VERDE = '#7ED321';   // Verde Mantis
const C_ARANCIO = '#FF6F00'; // Arancio Atlas
const C_VIOLA = '#9146FF';   // Viola Pasifae
const C_CARBON = '#111111';  // Carbon Black
const C_GUNMETAL = '#232526'; // Gunmetal
const C_CHROME = '#E2E8F0';  // Satin Chrome

function RotatingHex({ color = C_VERDE, radius = 2.2, speed = 0.6, thickness = 0.05 }) {
  const ref = useRef<any>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.15 * speed;
    ref.current.rotation.z += dt * 0.1 * speed;
  });
  // Using Torus with low radial segments to create a hexagonal/octagonal ring look
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <torusGeometry args={[radius, thickness, 3, 6]} /> 
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
}

function AICore() {
  const coreRef = useRef<any>(null);
  const ringRef = useRef<any>(null);
  
  useFrame((state, dt) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += dt * 0.4;
      coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= dt * 0.2;
    }
  });

  return (
    <group position={[0, 0.5, -1.4]}>
      <Float speed={2} floatIntensity={0.5} rotationIntensity={0.2}>
        {/* Central Processor Unit */}
        <mesh ref={coreRef}>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial 
            color={C_CARBON} 
            metalness={0.9} 
            roughness={0.1}
            emissive={C_VERDE}
            emissiveIntensity={0.2}
            wireframe={false}
          />
        </mesh>
        
        {/* Inner Glowing Core */}
        <mesh scale={[0.4, 0.4, 0.4]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={C_VERDE} emissive={C_VERDE} emissiveIntensity={2} toneMapped={false} />
        </mesh>

        {/* Floating Data Rings */}
        <group ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
           <RotatingHex color={C_CHROME} radius={1.6} speed={0.8} thickness={0.02} />
           <RotatingHex color={C_ARANCIO} radius={2.0} speed={0.5} thickness={0.03} />
           <RotatingHex color={C_VERDE} radius={2.4} speed={0.3} thickness={0.02} />
        </group>
      </Float>
    </group>
  );
}

function DataStream() {
  // Abstract data stream moving vertically
  const lines: JSX.Element[] = [];
  for (let i = 0; i < 5; i++) {
    lines.push(
      <group key={i} position={[2.5, i * 1.5 - 3, -3]} rotation={[0, 0, -0.2]}>
         <Box args={[0.05, 1, 0.05]}>
            <meshStandardMaterial color={C_VERDE} emissive={C_VERDE} emissiveIntensity={1} />
         </Box>
      </group>
    );
  }
  return <group>{lines}</group>;
}

function NeuralLattice() {
  // Angular, geometric connections
  const lines: JSX.Element[] = [];
  const size = 4;
  for (let i = -size; i <= size; i += 2) {
    lines.push(
      <Line
        key={`h-${i}`}
        points={[[-size, i * 0.5, -4], [size, i * 0.5, -4]]}
        color={C_GUNMETAL}
        lineWidth={1}
        opacity={0.3}
        transparent
      />
    );
    lines.push(
      <Line
        key={`v-${i}`}
        points={[[i * 0.5, -size, -4], [i * 0.5, size, -4]]}
        color={C_GUNMETAL}
        lineWidth={1}
        opacity={0.3}
        transparent
      />
    );
  }
  return <group position={[-2, -1, -3]} rotation={[0.2, 0.2, 0]}>{lines}</group>;
}

function GPUBlock() {
  // Heavy industrial server block
  const ref = useRef<any>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y -= dt * 0.2;
  });

  return (
    <group position={[2.8, -0.5, -2]}>
      <Float speed={1.5} floatIntensity={0.8} rotationIntensity={0.5}>
        <mesh ref={ref}>
          <boxGeometry args={[1.2, 1.8, 0.4]} />
          <meshStandardMaterial 
            color={C_CARBON} 
            metalness={0.8} 
            roughness={0.3} 
          />
        </mesh>
        {/* Heat sink fins */}
        {[...Array(6)].map((_, i) => (
          <mesh key={i} position={[0, i * 0.2 - 0.5, 0.22]}>
            <boxGeometry args={[1.1, 0.05, 0.05]} />
            <meshStandardMaterial color={C_CHROME} metalness={1} roughness={0.1} />
          </mesh>
        ))}
        {/* Status Light */}
        <mesh position={[0.4, 0.7, 0.21]}>
          <circleGeometry args={[0.08, 16]} />
          <meshStandardMaterial color={C_ARANCIO} emissive={C_ARANCIO} emissiveIntensity={2} />
        </mesh>
      </Float>
    </group>
  );
}

function SignalPath() {
  // Floor circuitry
  const traces: JSX.Element[] = [];
  for (let i = -4; i <= 4; i+=2) {
    traces.push(
      <Line key={`t-${i}`} points={[[i * 0.5, -2, -1], [i * 0.5 + 1, -2, -4]]} color={C_VERDE} lineWidth={1.5} opacity={0.4} transparent />
    );
  }
  return <group>{traces}</group>;
}

function FloatingNodes() {
  // Distributed computing nodes
  const nodes = useMemo(() => ([
      { pos: [-3, 2, -3], color: C_VERDE },
      { pos: [3, 2.5, -2], color: C_ARANCIO },
      { pos: [-2, -2, -1.5], color: C_VIOLA },
      { pos: [1.5, -2.5, -2], color: C_VERDE },
  ]), []);

  return (
    <group>
      {nodes.map((node, i) => (
        <Float key={i} speed={1 + Math.random()} rotationIntensity={1} floatIntensity={1} position={node.pos as any}>
          <Icosahedron args={[0.3, 0]}>
            <meshStandardMaterial 
              color={C_CARBON} 
              metalness={0.9} 
              roughness={0.1}
              emissive={node.color}
              emissiveIntensity={0.8}
              wireframe
            />
          </Icosahedron>
          <mesh>
             <boxGeometry args={[0.15, 0.15, 0.15]} />
             <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={1.5} />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

export default function MarvelScene() {
  const isMobile = useIsMobile();
  const dpr = useMemo<[number, number]>(() => (isMobile ? [1, 1] : [1, 2]), [isMobile]);
  const sparklesCount = isMobile ? 30 : 60;
  const starsCount = isMobile ? 400 : 1500;
  const autoRotateSpeed = isMobile ? 0.2 : 0.4;

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      dpr={dpr}
      gl={{ antialias: true, toneMappingExposure: 1.1 }}
      className="pointer-events-none"
    >
      <color attach="background" args={[C_CARBON]} />
      {/* Cinematic Studio Lighting */}
      <ambientLight intensity={0.2} /> {/* Low ambient base */}
      
      {/* Key Light - Cool White */}
      <spotLight position={[5, 5, 5]} intensity={1.5} angle={0.5} penumbra={1} color="#FFFFFF" />
      
      {/* Rim Light - Verde Mantis */}
      <spotLight position={[-5, 2, -5]} intensity={2} angle={0.4} penumbra={0.5} color={C_VERDE} />
      
      {/* Fill Light - Warm Arancio */}
      <pointLight position={[0, -4, 2]} intensity={0.8} color={C_ARANCIO} />

      <AICore />
      <NeuralLattice />
      <GPUBlock />
      <SignalPath />
      <FloatingNodes />
      <DataStream />

      <Sparkles count={sparklesCount} scale={[10, 8, 10]} size={2} speed={0.4} opacity={0.5} color={C_VERDE} />
      <Stars radius={50} depth={20} count={starsCount} factor={3} fade speed={0.5} saturation={0} />

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={autoRotateSpeed} />
      
      {/* Slight fog for depth */}
      <fog attach="fog" args={[C_CARBON, 5, 20]} />
    </Canvas>
  );
}

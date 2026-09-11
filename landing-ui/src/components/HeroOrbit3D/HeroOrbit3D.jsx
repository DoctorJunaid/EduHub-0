import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { ArrowRight, Compass } from '@phosphor-icons/react';
import './heroOrbit.css';

/* ─── Satellite Definitions ─── */
const SATELLITES = [
  { name: 'University', color: '#3b82f6', emissive: '#2563eb', shape: 'octahedron', orbitRadius: 4.2, speed: 0.35, tilt: 0.3, phase: 0, scale: 0.38 },
  { name: 'Student', color: '#14b8a6', emissive: '#0d9488', shape: 'icosahedron', orbitRadius: 4.8, speed: 0.28, tilt: -0.5, phase: Math.PI * 0.33, scale: 0.34 },
  { name: 'Alumni', color: '#8b5cf6', emissive: '#7c3aed', shape: 'dodecahedron', orbitRadius: 5.2, speed: 0.22, tilt: 0.6, phase: Math.PI * 0.66, scale: 0.32 },
  { name: 'Rankings', color: '#f59e0b', emissive: '#d97706', shape: 'box', orbitRadius: 4.5, speed: 0.32, tilt: -0.25, phase: Math.PI * 1.0, scale: 0.35 },
  { name: 'Courses', color: '#6366f1', emissive: '#4f46e5', shape: 'torusKnot', orbitRadius: 5.5, speed: 0.2, tilt: 0.45, phase: Math.PI * 1.33, scale: 0.28 },
  { name: 'Coaching', color: '#10b981', emissive: '#059669', shape: 'cone', orbitRadius: 4.0, speed: 0.38, tilt: -0.4, phase: Math.PI * 1.66, scale: 0.36 },
];

/* ─── Central Glowing Sphere ─── */
function CoreSphere() {
  const meshRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
      glowRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group>
      {/* Outer glow shell */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Second glow ring */}
      <mesh>
        <sphereGeometry args={[1.65, 32, 32]} />
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Core sphere */}
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[1.4, 64, 64]} />
        <meshStandardMaterial
          color="#1e1b4b"
          metalness={0.3}
          roughness={0.4}
          emissive="#4338ca"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Wireframe overlay for tech feel */}
      <mesh>
        <sphereGeometry args={[1.42, 24, 24]} />
        <meshBasicMaterial
          color="#6366f1"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Core label */}
      <Html position={[0, -2, 0]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div className="orbit-label">
          <span className="orbit-label-text" style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(99,102,241,0.2)' }}>
            EduHub
          </span>
        </div>
      </Html>
    </group>
  );
}

/* ─── Satellite Object ─── */
function SatelliteShape({ shape, color, emissive, scale }) {
  const geometryMap = {
    octahedron: <octahedronGeometry args={[1, 0]} />,
    icosahedron: <icosahedronGeometry args={[1, 0]} />,
    dodecahedron: <dodecahedronGeometry args={[1, 0]} />,
    box: <boxGeometry args={[1.3, 1.3, 1.3]} />,
    torusKnot: <torusKnotGeometry args={[0.7, 0.25, 64, 8]} />,
    cone: <coneGeometry args={[0.8, 1.4, 6]} />,
  };

  return (
    <mesh castShadow scale={scale}>
      {geometryMap[shape]}
      <meshStandardMaterial
        color={color}
        metalness={0.4}
        roughness={0.35}
        emissive={emissive}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

/* ─── Orbiting Satellite with Path ─── */
function OrbitingSatellite({ sat }) {
  const groupRef = useRef();
  const meshRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime * sat.speed + sat.phase;
    const x = Math.cos(t) * sat.orbitRadius;
    const z = Math.sin(t) * sat.orbitRadius;
    const y = Math.sin(t * 0.7) * sat.tilt * 1.5;

    groupRef.current.position.set(x, y, z);

    // Self-rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008;
      meshRef.current.rotation.x += 0.004;
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={meshRef}>
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <SatelliteShape
            shape={sat.shape}
            color={sat.color}
            emissive={sat.emissive}
            scale={sat.scale}
          />
        </Float>
      </group>

      {/* Label */}
      <Html position={[0, -0.7, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="orbit-label">
          <span className="orbit-label-text">{sat.name}</span>
        </div>
      </Html>
    </group>
  );
}

/* ─── Orbit Ring Paths (visual guides) ─── */
function OrbitRing({ radius, tilt, opacity = 0.06 }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle * 0.7) * tilt * 1.5,
        Math.sin(angle) * radius
      ));
    }
    return pts;
  }, [radius, tilt]);

  const lineObj = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: '#6366f1', transparent: true, opacity });
    return new THREE.Line(geometry, material);
  }, [points, opacity]);

  return <primitive object={lineObj} />;
}

/* ─── Camera Rig (mouse parallax) ─── */
function CameraRig() {
  const vec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const x = state.pointer.x * 1.5;
    const y = state.pointer.y * 0.8 + 0.5;
    state.camera.position.lerp(vec.set(x, y, 14), 0.03);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ─── Full 3D Scene ─── */
function OrbitScene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        color="#e0e7ff"
      />
      <directionalLight
        position={[-5, -3, -5]}
        intensity={0.3}
        color="#8b5cf6"
      />
      <pointLight position={[0, 0, 0]} intensity={0.6} color="#6366f1" distance={12} />

      {/* Core */}
      <CoreSphere />

      {/* Orbit ring paths */}
      {SATELLITES.map((sat) => (
        <OrbitRing key={sat.name + '-ring'} radius={sat.orbitRadius} tilt={sat.tilt} opacity={0.05} />
      ))}

      {/* Satellites */}
      {SATELLITES.map((sat) => (
        <OrbitingSatellite key={sat.name} sat={sat} />
      ))}

      {/* Camera rig */}
      <CameraRig />
    </>
  );
}

/* ─── Main Component ─── */
export default function HeroOrbit3D({ onGetStarted }) {
  return (
    <section className="hero-orbit-section" id="top">
      {/* Ambient background glow */}
      <div className="hero-orbit-glow" />

      <div className="hero-orbit-inner">
        {/* ─── Left: Text Content ─── */}
        <motion.div
          className="hero-orbit-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <div className="hero-orbit-label">
            <span className="label-pulse" />
            <span>Live Education Network</span>
          </div>

          <h1 className="hero-orbit-headline">
            The Connected{' '}
            <span className="headline-gradient">Education Ecosystem</span>
          </h1>

          <p className="hero-orbit-subtitle">
            Automate and unify your institution's operations — from student enrollment and interactive grading, to seamless fee management and deep analytics, all in one intelligent portal.
          </p>

          <div className="hero-orbit-actions">
            <button
              className="hero-orbit-btn-primary"
              onClick={() => onGetStarted && onGetStarted()}
            >
              <span>Get Started</span>
              <ArrowRight size={18} weight="bold" />
            </button>

            <button
              className="hero-orbit-btn-secondary"
              onClick={() => {
                const el = document.getElementById('institutes');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Compass size={18} weight="bold" />
              <span>Explore Institutes</span>
            </button>
          </div>

          <div className="hero-orbit-trust">
            <div className="hero-orbit-trust-item">
              <span className="trust-dot" />
              <span>50+ Institutions</span>
            </div>
            <div className="hero-orbit-trust-item">
              <span className="trust-dot" />
              <span>120k+ Active Students</span>
            </div>
            <div className="hero-orbit-trust-item">
              <span className="trust-dot" />
              <span>HEC Verified</span>
            </div>
          </div>
        </motion.div>

        {/* ─── Right: 3D Canvas ─── */}
        <motion.div
          className="hero-orbit-canvas-wrap"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        >
          <Canvas
            camera={{ position: [0, 0.5, 14], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
          >
            <OrbitScene />
          </Canvas>
        </motion.div>
      </div>
    </section>
  );
}

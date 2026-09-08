import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Generates random points in a massive sphere
function ParticleSphere({ count = 8000, color = "#10b981" }) {
  const points = useRef();

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Distribute points in a large spherical volume
      const r = 40 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    return positions;
  }, [count]);

  useFrame((state, delta) => {
    // Slow ambient rotation
    if (points.current) {
      points.current.rotation.y -= delta * 0.05;
      points.current.rotation.z -= delta * 0.02;
    }
  });

  return (
    <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.15}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function Rig() {
  const vec = new THREE.Vector3();
  useFrame((state) => {
    // Scroll drives the Z depth
    const scrollY = window.scrollY;
    const targetZ = 30 - scrollY * 0.015; // move forward as you scroll down
    
    // Mouse drives slight X/Y shifts
    const targetX = (state.pointer.x * window.innerWidth) * 0.005;
    const targetY = (state.pointer.y * window.innerHeight) * 0.005;

    state.camera.position.lerp(vec.set(targetX, targetY, targetZ), 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function WebGLBackground({ isDark }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'none',
      background: isDark ? '#0f172a' : '#f1f5f9',
      transition: 'background 0.5s ease'
    }}>
      <Canvas 
        camera={{ position: [0, 0, 30], fov: 60 }} 
        dpr={[1, 2]} // Cap DPR for performance
        gl={{ antialias: false, alpha: true }}
      >
        <fog attach="fog" args={[isDark ? '#0f172a' : '#f1f5f9', 10, 45]} />
        <ParticleSphere color={isDark ? "#10b981" : "#059669"} count={isDark ? 8000 : 5000} />
        <Rig />
      </Canvas>
    </div>
  );
}

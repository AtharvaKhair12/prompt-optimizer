"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { Suspense } from "react";

function NeuralNode({ position, delay }: { position: [number, number, number]; delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseY = position[1];

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = baseY + Math.sin(clock.getElapsedTime() * 0.5 + delay) * 0.3;
      const scale = 1 + Math.sin(clock.getElapsedTime() * 0.8 + delay) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color="#8b5cf6"
        emissive="#7c3aed"
        emissiveIntensity={1.5}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  );
}

function ConnectionLine({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([...start, ...end]);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: "#8b5cf6", transparent: true, opacity: 0.2 });
    return new THREE.Line(geo, mat);
  }, [start, end]);

  useFrame(({ clock }) => {
    if (lineObj.material instanceof THREE.LineBasicMaterial) {
      lineObj.material.opacity = 0.15 + Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  return <primitive object={lineObj} />;
}

function NeuralNetwork() {
  const groupRef = useRef<THREE.Group>(null);

  // Generate node positions in a spherical arrangement
  const nodes = useMemo(() => {
    const positions: [number, number, number][] = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 1.8 + Math.random() * 0.5;
      positions.push([
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(phi),
      ]);
    }
    return positions;
  }, []);

  // Generate connections between nearby nodes
  const connections = useMemo(() => {
    const conns: { start: [number, number, number]; end: [number, number, number] }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.sqrt(
          Math.pow(nodes[i][0] - nodes[j][0], 2) +
          Math.pow(nodes[i][1] - nodes[j][1], 2) +
          Math.pow(nodes[i][2] - nodes[j][2], 2)
        );
        if (dist < 2.2) {
          conns.push({ start: nodes[i], end: nodes[j] });
        }
      }
    }
    return conns;
  }, [nodes]);

  useFrame(({ clock, pointer }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.08;
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.05) * 0.1;
      // Mouse parallax
      groupRef.current.rotation.x += pointer.y * 0.1;
      groupRef.current.rotation.y += pointer.x * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((pos, i) => (
        <NeuralNode key={i} position={pos} delay={i * 0.3} />
      ))}
      {connections.map((conn, i) => (
        <ConnectionLine key={i} start={conn.start} end={conn.end} />
      ))}
      {/* Central glowing orb */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh>
          <sphereGeometry args={[0.4, 32, 32]} />
          <MeshDistortMaterial
            color="#7c3aed"
            emissive="#6d28d9"
            emissiveIntensity={2}
            roughness={0.1}
            metalness={0.9}
            distort={0.3}
            speed={2}
          />
        </mesh>
      </Float>
    </group>
  );
}

function GradientFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="w-64 h-64 rounded-full animate-glow-pulse"
        style={{
          background: "radial-gradient(circle, oklch(0.65 0.22 290 / 0.3) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

export function HeroScene3D() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Suspense fallback={<GradientFallback />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ pointerEvents: "none" }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={1} color="#8b5cf6" />
          <pointLight position={[-5, -5, 5]} intensity={0.5} color="#06b6d4" />
          <NeuralNetwork />
        </Canvas>
      </Suspense>
    </div>
  );
}

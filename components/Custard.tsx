
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CustardProps {
  position: [number, number, number];
  id: string;
}

export const Custard: React.FC<CustardProps> = ({ position, id }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Slow rotation for a mystical feel
      meshRef.current.rotation.y += 0.02;
      
      // Floating bobbing animation
      const pulse = Math.sin(state.clock.elapsedTime * 2.0) * 0.12;
      meshRef.current.position.y = position[1] + pulse + 0.2;
    }
  });

  return (
    <group ref={meshRef} position={position} name={`custard-${id}`}>
      {/* Bowl / Container */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.25, 0.15, 16]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* The Glowy Custard Content */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.1, 16]} />
        <meshStandardMaterial 
          color="#ff00ff" 
          emissive="#ff00ff" 
          emissiveIntensity={8} // Highly emissive to stand out in the dark
          toneMapped={false}
        />
      </mesh>

      {/* Main Glow Light - This makes the surrounding floor and trees glow pink */}
      <pointLight 
        color="#ff00ff" 
        intensity={5} 
        distance={6} 
        decay={2}
      />

      {/* Small Inner Light for extra core brightness */}
      <pointLight 
        color="#ffffff" 
        intensity={2} 
        distance={2} 
      />

      {/* Decorative 'Aura' - simple ring to help guide the player */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <ringGeometry args={[0.5, 0.55, 32]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

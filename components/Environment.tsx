
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sky, Stars, Cloud, Clouds } from '@react-three/drei';
import { Obstacle } from '../types';

interface TreeProps {
  position: [number, number, number];
  scale?: number;
}

const Tree: React.FC<TreeProps> = ({ position, scale = 1 }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.8, 6, 8]} />
        <meshStandardMaterial color="#2b1d0e" roughness={1} />
      </mesh>
      <group position={[0, 4, 0]}>
        {[0, 1.5, 3, 4.5].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} castShadow receiveShadow>
            <coneGeometry args={[3 - i * 0.5, 3.5, 8]} />
            <meshStandardMaterial color="#1a241a" roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

const WillowTree: React.FC<TreeProps> = ({ position, scale = 1 }) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 1, 8, 8]} />
        <meshStandardMaterial color="#3d2b1f" roughness={1} />
      </mesh>
      {/* Branches & Leaves (Weeping style) */}
      <group position={[0, 8, 0]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI * 2) / 6, 0]}>
            <mesh position={[2, -2, 0]} rotation={[0.5, 0, 0]} castShadow receiveShadow>
              <capsuleGeometry args={[0.4, 6, 4, 8]} />
              <meshStandardMaterial color="#2d4a2d" roughness={1} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

const Water: React.FC<{ position: [number, number, number], radius: number }> = ({ position, radius }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#002244';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material.map) {
        material.map.offset.x = state.clock.elapsedTime * 0.05;
        material.map.offset.y = state.clock.elapsedTime * 0.03;
      }
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <circleGeometry args={[radius, 32]} />
      <meshStandardMaterial 
        color="#003366" 
        map={texture} 
        transparent 
        opacity={0.8} 
        metalness={0.9} 
        roughness={0.1} 
        envMapIntensity={1}
      />
    </mesh>
  );
};

const HangingPo: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* The Rope */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 3.5]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Po Body */}
      <group position={[0, 0, 0]}>
        {/* Main Body */}
        <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.4, 1, 8, 12]} />
          <meshStandardMaterial color="#b20000" roughness={0.8} />
        </mesh>

        {/* Head */}
        <group position={[0, 0, 0]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#b20000" />
          </mesh>
          {/* Face mask - Pale and haunting */}
          <mesh position={[0, 0, 0.3]} rotation={[0.1, 0, 0]} receiveShadow>
            <sphereGeometry args={[0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#c0c0c0" roughness={1} />
          </mesh>
          {/* Po's Circle Antenna */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <torusGeometry args={[0.12, 0.03, 8, 24]} />
            <meshStandardMaterial color="#b20000" />
          </mesh>
          {/* Hollow Eyes */}
          <mesh position={[-0.12, 0.05, 0.28]}>
             <circleGeometry args={[0.06, 8]} />
             <meshBasicMaterial color="black" />
          </mesh>
          <mesh position={[0.12, 0.05, 0.28]}>
             <circleGeometry args={[0.06, 8]} />
             <meshBasicMaterial color="black" />
          </mesh>
        </group>

        {/* Limp Arms */}
        <mesh position={[-0.5, -0.6, 0]} rotation={[0, 0, 0.2]} castShadow receiveShadow>
           <capsuleGeometry args={[0.15, 0.8, 4, 8]} />
           <meshStandardMaterial color="#b20000" />
        </mesh>
        <mesh position={[0.5, -0.6, 0]} rotation={[0, 0, -0.2]} castShadow receiveShadow>
           <capsuleGeometry args={[0.15, 0.8, 4, 8]} />
           <meshStandardMaterial color="#b20000" />
        </mesh>

        {/* Limp Legs */}
        <mesh position={[-0.2, -1.3, 0]} rotation={[0.1, 0, 0.05]} castShadow receiveShadow>
           <capsuleGeometry args={[0.18, 0.7, 4, 8]} />
           <meshStandardMaterial color="#b20000" />
        </mesh>
        <mesh position={[0.2, -1.3, 0]} rotation={[0.1, 0, -0.05]} castShadow receiveShadow>
           <capsuleGeometry args={[0.18, 0.7, 4, 8]} />
           <meshStandardMaterial color="#b20000" />
        </mesh>
      </group>
    </group>
  );
};

const DeadDipsy: React.FC = () => {
  return (
    <group>
      {/* Dipsy's Body on the floor at the base of the slide */}
      <group position={[6.5, 0.1, -10]} rotation={[0, 0.5, 0]}>
        {/* Torso */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.4, 0.8, 8, 12]} />
          <meshStandardMaterial color="#008000" roughness={0.8} />
        </mesh>
        {/* Belly / Stomach Screen */}
        <mesh position={[0, 0.15, -0.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
           <planeGeometry args={[0.4, 0.3]} />
           <meshStandardMaterial color="#b0b0b0" />
        </mesh>
        {/* Limp Arms */}
        <mesh position={[-0.6, 0.1, -0.2]} rotation={[0, 0.5, Math.PI / 2]} castShadow receiveShadow>
           <capsuleGeometry args={[0.12, 0.7]} />
           <meshStandardMaterial color="#008000" />
        </mesh>
        <mesh position={[0.6, 0.1, -0.2]} rotation={[0, -0.5, -Math.PI / 2]} castShadow receiveShadow>
           <capsuleGeometry args={[0.12, 0.7]} />
           <meshStandardMaterial color="#008000" />
        </mesh>
        {/* Limp Legs */}
        <mesh position={[-0.2, 0.1, 0.8]} rotation={[0, 0.2, Math.PI / 2]} castShadow receiveShadow>
           <capsuleGeometry args={[0.15, 0.6]} />
           <meshStandardMaterial color="#008000" />
        </mesh>
        <mesh position={[0.2, 0.1, 0.8]} rotation={[0, -0.2, -Math.PI / 2]} castShadow receiveShadow>
           <capsuleGeometry args={[0.15, 0.6]} />
           <meshStandardMaterial color="#008000" />
        </mesh>
        {/* Blood Pool */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -0.4]} receiveShadow>
          <circleGeometry args={[1.2, 16]} />
          <meshBasicMaterial color="#600000" transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Dipsy's Head on the Slide ramp */}
      <group position={[8, 1.8, -8.5]} rotation={[0.4, 0.2, -0.3]}>
         <mesh castShadow receiveShadow>
           <sphereGeometry args={[0.38, 16, 16]} />
           <meshStandardMaterial color="#008000" />
         </mesh>
         {/* Head blood */}
         <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
            <circleGeometry args={[0.3, 8]} />
            <meshBasicMaterial color="#8b0000" />
         </mesh>
         {/* Face mask */}
         <mesh position={[0, 0, 0.28]} rotation={[0, 0, 0]} receiveShadow>
            <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#d8d8d8" />
         </mesh>
         {/* Straight Antenna */}
         <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.4]} />
            <meshStandardMaterial color="#008000" />
         </mesh>
      </group>
    </group>
  );
};

const LargeDeadTree: React.FC<{ position: [number, number, number]; rotationY?: number }> = ({ position, rotationY = 0 }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Twisted Trunk */}
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1.8, 12, 8]} />
        <meshStandardMaterial color="#2d2215" roughness={1} />
      </mesh>
      {/* Large Horizontal Branch */}
      <group position={[0, 10, 0]}>
        <mesh position={[4, 0, 0]} rotation={[0, 0, Math.PI / 2.2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.7, 8, 8]} />
          <meshStandardMaterial color="#2d2215" roughness={1} />
        </mesh>
        {/* Po hangs here */}
        <HangingPo position={[7, -1.5, 0]} />
      </group>
      {/* Extra dead branches */}
      <mesh position={[-3, 8, 1]} rotation={[0, 0, -Math.PI / 3]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.5, 6, 8]} />
        <meshStandardMaterial color="#2d2215" />
      </mesh>
    </group>
  );
};

const DeadLaaLaa: React.FC<{ position: [number, number, number]; rotation: [number, number, number] }> = ({ position, rotation }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Body lying down */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.45, 1.2, 8, 16]} />
        <meshStandardMaterial color="#e6e600" roughness={0.8} />
      </mesh>
      
      {/* Head */}
      <group position={[0, 0.2, -1.1]} rotation={[0.2, 0.3, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#e6e600" />
        </mesh>
        {/* Face mask */}
        <mesh position={[0, 0, -0.28]} rotation={[0, Math.PI, 0]} receiveShadow>
          <sphereGeometry args={[0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#d8d8d8" />
        </mesh>
        {/* Antenna */}
        <mesh position={[0, 0.5, 0]} castShadow>
           <torusGeometry args={[0.12, 0.03, 8, 16]} />
           <meshStandardMaterial color="#e6e600" />
        </mesh>
      </group>

      {/* Blood Splatters */}
      <mesh position={[0.2, 0.3, 0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.2, 8]} />
        <meshBasicMaterial color="#8b0000" transparent opacity={0.8} />
      </mesh>
      <mesh position={[-0.1, 0.3, -0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.15, 8]} />
        <meshBasicMaterial color="#8b0000" transparent opacity={0.8} />
      </mesh>
      
      {/* Arms spread out */}
      <mesh position={[-0.7, 0.2, -0.3]} rotation={[0, -0.5, Math.PI / 2]} castShadow receiveShadow>
        <capsuleGeometry args={[0.12, 0.8]} />
        <meshStandardMaterial color="#e6e600" />
      </mesh>
      <mesh position={[0.7, 0.2, -0.3]} rotation={[0, 0.5, -Math.PI / 2]} castShadow receiveShadow>
        <capsuleGeometry args={[0.12, 0.8]} />
        <meshStandardMaterial color="#e6e600" />
      </mesh>
    </group>
  );
};

const Rock: React.FC<{ position: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => {
  return (
    <mesh position={position} scale={[scale, scale, scale]} rotation={[Math.random(), Math.random(), Math.random()]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1.5, 0]} />
      <meshStandardMaterial color="#444" roughness={0.9} />
    </mesh>
  );
};

const GrassWall: React.FC<{ position: [number, number, number], rotation: [number, number, number], size: [number, number, number] }> = ({ position, rotation, size }) => {
  const hedgeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0a1a0a';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#1a2e1a' : '#051005';
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(size[0] / 4, size[1] / 4);
    return tex;
  }, [size]);

  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial map={hedgeTexture} roughness={1} metalness={0} />
    </mesh>
  );
};

interface TeletubbyHouseProps {
  lightsOn: boolean;
}

const TeletubbyHouse: React.FC<TeletubbyHouseProps> = ({ lightsOn }) => {
  const intensityFactor = lightsOn ? 1 : 0.05;

  return (
    <group position={[0, 0, -40]}>
      <mesh position={[0, 4, 0]} receiveShadow castShadow>
        <sphereGeometry args={[15, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a331a" roughness={1} />
      </mesh>
      {[ -1, 1 ].map((side) => (
        <group key={side} position={[side * 10, 1, 10]} rotation={[0, side * -0.4, 0]}>
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <torusGeometry args={[2, 0.3, 16, 32, Math.PI]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, 1.5, -0.2]} receiveShadow>
             <circleGeometry args={[1.8, 16, 0, Math.PI]} />
             <meshBasicMaterial color={lightsOn ? "#aaddff" : "#112233"} />
          </mesh>
          <pointLight position={[0, 2, 1]} intensity={50 * intensityFactor} distance={15} color="#aaddff" />
        </group>
      ))}
      <group position={[0, 0, 14.5]}>
        <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
          <torusGeometry args={[3, 0.5, 16, 32, Math.PI]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        <mesh position={[2.5, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 2.5, 1]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        <mesh position={[-2.5, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 2.5, 1]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        <pointLight position={[0, 2, 2]} intensity={100 * intensityFactor} distance={20} color="#ffffff" />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <circleGeometry args={[14.8, 32]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>
      <group position={[0, 0, 0]} name="house-console">
        <mesh position={[0, 2, 0]} castShadow receiveShadow name="house-console-pillar">
          <cylinderGeometry args={[2, 2.5, 4, 12]} />
          <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]} position={[0, 2, 2.1]} rotation-x={-0.1} name={`house-console-panel-${i}`}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.8, 2.5, 0.2]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {[-1, 0, 1].map((bx) => 
              [-1, -0.5, 0, 0.5, 1].map((by) => (
                <mesh key={`${bx}-${by}`} position={[bx * 0.4, by * 0.4, 0.15]}>
                  <sphereGeometry args={[0.08, 8, 8]} />
                  <meshStandardMaterial 
                    color={["red", "yellow", "blue", "green", "white"][Math.floor(Math.random()*5)]} 
                    emissive={["red", "yellow", "blue", "green", "white"][Math.floor(Math.random()*5)]} 
                    emissiveIntensity={lightsOn ? 2 : 0.5} 
                  />
                </mesh>
              ))
            )}
          </group>
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 4, 0]}>
            <mesh position={[0, 4.5, 8]} rotation={[Math.PI / 2.2, 0, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.2, 0.2, 18, 8]} />
              <meshStandardMaterial color="#0a0a0a" metalness={1} roughness={0} />
            </mesh>
          </group>
        ))}
      </group>
      <group position={[8, 0, -8]} rotation={[0, Math.PI / 4, 0]}>
         {/* THE SLIDE */}
         <mesh position={[0, 1.5, 0]} rotation={[-Math.PI / 6, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.2, 0.3, 8]} />
            <meshStandardMaterial color="#400040" roughness={0.1} metalness={0.5} />
         </mesh>
         <mesh position={[0, 3.2, 4]} castShadow receiveShadow>
            <boxGeometry args={[3.5, 0.8, 1]} />
            <meshStandardMaterial color="#111" />
         </mesh>
         
         {/* DEAD DIPSY PLACEMENT */}
         <DeadDipsy />

         <pointLight position={[0, 0.5, -4]} intensity={20 * intensityFactor} distance={10} color="#ff00ff" />
      </group>
      <pointLight position={[0, 8, 0]} intensity={150 * intensityFactor} distance={40} color="#66aaff" />
      <pointLight position={[0, 2, 0]} intensity={80 * intensityFactor} distance={25} color="#ffffff" />
      <pointLight position={[0, 4, -5]} intensity={50 * intensityFactor} distance={20} color="#ff0000" />
    </group>
  );
};

export const World: React.FC<{ houseLightsOn: boolean, obstacles: Obstacle[] }> = ({ houseLightsOn, obstacles }) => {
  const boundarySize = 100;

  const groundTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Significantly lightened the grass base color for much higher visibility ("light bright")
      ctx.fillStyle = '#3a8a3a'; 
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 10000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 4;
        // Vibrant and light green noise for a lush, clear appearance
        ctx.fillStyle = Math.random() > 0.7 ? '#4eb34e' : '#2d6a2d';
        ctx.fillRect(x, y, size, size);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(120, 120);
    return tex;
  }, []);

  const obstacleElements = useMemo(() => {
    return obstacles.map(obs => {
      switch(obs.type) {
        case 'tree':
          return <Tree key={obs.id} position={obs.position} scale={obs.scale} />;
        case 'rock':
          return <Rock key={obs.id} position={obs.position} scale={obs.scale} />;
        case 'willow':
          return <WillowTree key={obs.id} position={obs.position} />;
        case 'dead-tree':
          return <LargeDeadTree key={obs.id} position={obs.position} />;
        default:
          return null;
      }
    });
  }, [obstacles]);

  return (
    <>
      <Sky 
        distance={450000} 
        sunPosition={[100, -2.5, 100]} 
        inclination={0.6} 
        azimuth={0.25} 
      />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Clouds>
        <Cloud position={[0, 40, -50]} opacity={0.3} speed={0.2} bounds={[20, 5, 20]} segments={20} color="#222233" />
        <Cloud position={[50, 45, 50]} opacity={0.25} speed={0.1} bounds={[15, 5, 15]} segments={15} color="#332222" />
        <Cloud position={[-60, 35, 20]} opacity={0.2} speed={0.15} bounds={[25, 5, 25]} segments={10} color="#1a1a2e" />
      </Clouds>

      {/* Made fog slightly more distant and less opaque to improve visibility */}
      <fog attach="fog" args={['#101018', 10, 110]} />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial map={groundTexture} roughness={0.8} metalness={0} />
      </mesh>
      
      <TeletubbyHouse lightsOn={houseLightsOn} />
      
      {obstacleElements}

      {/* --- THE BEACH AREA --- */}
      <group position={[70, 0, 70]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
           <circleGeometry args={[25, 32]} />
           <meshStandardMaterial color="#d2c290" roughness={1} />
        </mesh>
        
        <DeadLaaLaa position={[3, 0.1, 4]} rotation={[0, 0.8, 0]} />
        
        {/* IMPROVED WATER COMPONENT */}
        <Water position={[-15, 0.07, 10]} radius={10} />
        
        {/* Subtle Water Reflections */}
        <pointLight position={[-15, 2, 10]} intensity={10} distance={15} color="#00ffff" />
      </group>

      {/* --- THE GALLOWS AREA (Hanging Po) --- */}
      <group position={[-60, 0, 50]} rotation={[0, -Math.PI / 4, 0]}>
         <pointLight position={[7, 4, 0]} intensity={10} distance={15} color="#ff3333" />
      </group>

      <GrassWall position={[0, 6, boundarySize]} rotation={[0, 0, 0]} size={[boundarySize * 2, 12, 1]} />
      <GrassWall position={[0, 6, -boundarySize]} rotation={[0, 0, 0]} size={[boundarySize * 2, 12, 1]} />
      <GrassWall position={[boundarySize, 6, 0]} rotation={[0, Math.PI / 2, 0]} size={[boundarySize * 2, 12, 1]} />
      <GrassWall position={[-boundarySize, 6, 0]} rotation={[0, Math.PI / 2, 0]} size={[boundarySize * 2, 12, 1]} />

      <directionalLight 
        position={[100, 50, 100]} 
        intensity={0.8} 
        color="#ffaa77" 
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-camera-far={300}
        shadow-bias={-0.0005}
      />
      {/* Increased ambient light for much better overall scene brightness */}
      <ambientLight intensity={0.4} color="#555588" />
    </>
  );
};

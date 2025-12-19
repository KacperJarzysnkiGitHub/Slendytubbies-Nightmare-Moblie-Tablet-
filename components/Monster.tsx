
import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface MonsterProps {
  onCatch: () => void;
  onDangerUpdate?: (danger: number) => void;
  active: boolean;
  isScaring: boolean;
  soundVolume: number;
}

const MONSTER_FOOTSTEP_URL = "https://cdn.pixabay.com/audio/2024/02/05/audio_5b38d72855.mp3";
const FOOTSTEP_INTERVAL_BASE = 0.55;
const MAX_AUDIBLE_DISTANCE = 45;

export const Monster: React.FC<MonsterProps> = ({ onCatch, onDangerUpdate, active, isScaring, soundVolume }) => {
  const meshRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const faceLightRef = useRef<THREE.PointLight>(null);
  const hasTeleported = useRef(false);
  
  const footstepAudio = useRef<HTMLAudioElement | null>(null);
  const footstepTimer = useRef(0);
  const { camera } = useThree();
  
  const BASE_SPEED = 4.6;
  const CHASE_SPEED = 6.2;
  const ATTACK_RANGE = 12; 

  const TINKY_PURPLE = "#5d3fd3";

  useEffect(() => {
    footstepAudio.current = new Audio(MONSTER_FOOTSTEP_URL);
    if (!active) hasTeleported.current = false;
  }, [active]);

  useFrame((state, delta) => {
    if (!active || !meshRef.current) return;
    const monsterPos = meshRef.current.position;
    const playerPos = camera.position;
    const time = state.clock.getElapsedTime();

    if (isScaring) {
      if (!hasTeleported.current) {
        // Teleport to player face on first frame of jumpscare
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        monsterPos.copy(playerPos).add(forward.multiplyScalar(1.2));
        monsterPos.y = playerPos.y - 1.2;
        hasTeleported.current = true;
      }
      meshRef.current.lookAt(playerPos.x, monsterPos.y, playerPos.z);
      if (bodyRef.current) {
        bodyRef.current.position.x = (Math.random() - 0.5) * 0.3;
        bodyRef.current.position.y = (Math.random() - 0.5) * 0.3;
      }
      if (faceLightRef.current) faceLightRef.current.intensity = 20 + Math.sin(time * 60) * 15;
      return;
    }

    const dist = monsterPos.distanceTo(playerPos);
    const isAttacking = dist < ATTACK_RANGE;
    const currentSpeed = isAttacking ? CHASE_SPEED : BASE_SPEED;
    const direction = new THREE.Vector3().subVectors(playerPos, monsterPos).normalize();
    monsterPos.x += direction.x * currentSpeed * delta;
    monsterPos.z += direction.z * currentSpeed * delta;
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, Math.atan2(direction.x, direction.z), 0.1);

    const stepInterval = FOOTSTEP_INTERVAL_BASE * (BASE_SPEED / currentSpeed);
    footstepTimer.current += delta;
    if (footstepTimer.current >= stepInterval) {
      if (dist < MAX_AUDIBLE_DISTANCE && footstepAudio.current) {
        const step = footstepAudio.current.cloneNode() as HTMLAudioElement;
        step.volume = soundVolume * (1 - dist / MAX_AUDIBLE_DISTANCE) * 0.8;
        step.play().catch(() => {});
      }
      footstepTimer.current = 0;
    }

    if (onDangerUpdate) onDangerUpdate(THREE.MathUtils.clamp(1 - dist / 35, 0, 1));
    if (dist < 1.9) onCatch();
  });

  return (
    <group ref={meshRef} position={[60, 0, 60]}>
      <group ref={bodyRef}>
        {/* Proportional Tinky Winky Body */}
        <group ref={torsoRef}>
          {/* Main Body (Fat/Plump) */}
          <mesh position={[0, 1.1, 0]} castShadow>
            <capsuleGeometry args={[0.55, 0.7, 8, 12]} />
            <meshStandardMaterial color={TINKY_PURPLE} roughness={0.8} />
          </mesh>

          {/* Belly Screen */}
          <mesh position={[0, 1.1, 0.42]} castShadow>
             <planeGeometry args={[0.45, 0.4]} />
             <meshStandardMaterial color="#999" roughness={0.4} metalness={0.2} />
          </mesh>

          {/* Arms */}
          <mesh position={[-0.6, 1.3, 0]} rotation={[0, 0, 0.4]} castShadow>
            <capsuleGeometry args={[0.15, 0.6, 4, 8]} />
            <meshStandardMaterial color={TINKY_PURPLE} />
          </mesh>
          <mesh position={[0.6, 1.3, 0]} rotation={[0, 0, -0.4]} castShadow>
            <capsuleGeometry args={[0.15, 0.6, 4, 8]} />
            <meshStandardMaterial color={TINKY_PURPLE} />
          </mesh>

          {/* Legs */}
          <mesh position={[-0.25, 0.4, 0]} castShadow>
            <capsuleGeometry args={[0.18, 0.6, 4, 8]} />
            <meshStandardMaterial color={TINKY_PURPLE} />
          </mesh>
          <mesh position={[0.25, 0.4, 0]} castShadow>
            <capsuleGeometry args={[0.18, 0.6, 4, 8]} />
            <meshStandardMaterial color={TINKY_PURPLE} />
          </mesh>

          {/* Head Group */}
          <group ref={headGroupRef} position={[0, 2.1, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.45, 16, 16]} />
              <meshStandardMaterial color={TINKY_PURPLE} />
            </mesh>

            {/* Triangle Antenna (3 segments) */}
            <group position={[0, 0.6, 0]}>
               <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.3]} />
                  <meshStandardMaterial color={TINKY_PURPLE} />
               </mesh>
               <mesh position={[-0.15, -0.05, 0]} rotation={[0, 0, Math.PI / 6]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.3]} />
                  <meshStandardMaterial color={TINKY_PURPLE} />
               </mesh>
               <mesh position={[0.15, -0.05, 0]} rotation={[0, 0, -Math.PI / 6]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.3]} />
                  <meshStandardMaterial color={TINKY_PURPLE} />
               </mesh>
               <mesh position={[0, -0.1, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.1]} />
                  <meshStandardMaterial color={TINKY_PURPLE} />
               </mesh>
            </group>

            {/* Creepy Face Mask */}
            <group position={[0, 0, 0.35]}>
              <mesh>
                <sphereGeometry args={[0.38, 16, 16, 0, Math.PI*2, 0, Math.PI*0.6]} />
                <meshStandardMaterial color="#c0c0c0" roughness={1} />
              </mesh>
              {/* Hollow Black Eyes */}
              <mesh position={[-0.14, 0.1, 0.15]}>
                <sphereGeometry args={[0.085]} />
                <meshBasicMaterial color="black" />
              </mesh>
              <mesh position={[0.14, 0.1, 0.15]}>
                <sphereGeometry args={[0.085]} />
                <meshBasicMaterial color="black" />
              </mesh>
              {/* Screaming Open Mouth */}
              <mesh position={[0, -0.15, 0.15]} rotation={[0, 0, 0]}>
                <sphereGeometry args={[0.14]} scale={[1, 1.6, 0.3]} />
                <meshBasicMaterial color="black" />
              </mesh>
            </group>
            
            {/* Ominous Face Glow */}
            <pointLight ref={faceLightRef} color="#ff0000" intensity={1.5} distance={5} />
          </group>
        </group>
      </group>
    </group>
  );
};

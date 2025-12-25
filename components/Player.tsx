
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { Obstacle, JoystickInput, Custard as ICustard } from '../types';

interface PlayerProps {
  onInteract: (raycaster: THREE.Raycaster) => void;
  flashlightOn: boolean;
  isScaring?: boolean;
  battery: number;
  obstacles: Obstacle[];
  custards: ICustard[];
  onCollectCustard: (id: string) => void;
  onToggleFlashlight: () => void;
  soundVolume: number;
  canWin: boolean;
  onWin: () => void;
  mobileMovement: JoystickInput;
  mobileLook: JoystickInput;
  isSprintActive: boolean;
  isJumpRequested: boolean;
  clearJumpRequest: () => void;
  active: boolean;
  isMobile: boolean;
}

const WALK_SPEED = 6.5;
const SPRINT_SPEED = 11;
const LOOK_SENSITIVITY_JOYSTICK = 2.0;
const WORLD_BOUNDARY = 98.5;
const WIN_ZONE_POSITION = new THREE.Vector3(0, 0, -40);
const WIN_DISTANCE = 5;
const PLAYER_RADIUS = 0.6;
const EYE_HEIGHT = 1.7;
const GRAVITY = 25;
const JUMP_FORCE = 8.5;
const FOOTSTEP_INTERVAL_WALK = 0.38;
const FOOTSTEP_INTERVAL_SPRINT = 0.22;
const CUSTARD_COLLECT_RADIUS_SQ = 2.25; // 1.5 units squared
const FOOTSTEP_URL = "https://cdn.pixabay.com/audio/2022/03/10/audio_f5519f6c01.mp3";

const PlayerBody: React.FC<{ isMoving: boolean; isSprinting: boolean }> = ({ isMoving, isSprinting }) => {
  const bodyGroupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const walkSpeed = isSprinting ? 16 : 12;
    const walkCycle = Math.sin(time * walkSpeed);
    if (isMoving) {
      if (leftLegRef.current) leftLegRef.current.rotation.x = walkCycle * 0.5;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -walkCycle * 0.5;
      if (bodyGroupRef.current) bodyGroupRef.current.position.y = Math.abs(walkCycle) * 0.05;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (bodyGroupRef.current) bodyGroupRef.current.position.y = 0;
    }
  });

  return (
    <group ref={bodyGroupRef} position={[0, -EYE_HEIGHT, 0]}>
      <mesh position={[0, 0.85, 0]} castShadow><capsuleGeometry args={[0.35, 0.7, 8, 16]} /><meshStandardMaterial color="#f8f8f8" /></mesh>
      <group ref={leftLegRef} position={[-0.15, 0.4, 0]}><mesh><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#f8f8f8" /></mesh></group>
      <group ref={rightLegRef} position={[0.15, 0.4, 0]}><mesh><boxGeometry args={[0.15, 0.5, 0.15]} /><meshStandardMaterial color="#f8f8f8" /></mesh></group>
    </group>
  );
};

export const Player: React.FC<PlayerProps> = ({ 
  onInteract, 
  flashlightOn, 
  isScaring = false, 
  battery, 
  obstacles, 
  custards,
  onCollectCustard,
  onToggleFlashlight, 
  soundVolume, 
  canWin, 
  onWin,
  mobileMovement,
  mobileLook,
  isSprintActive,
  isJumpRequested,
  clearJumpRequest,
  active,
  isMobile
}) => {
  const { camera, gl } = useThree();
  const moveState = useRef({ forward: false, backward: false, left: false, right: false, sprint: false, jump: false });
  const velocity = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const footstepAudio = useRef<HTMLAudioElement | null>(null);
  const footstepTimer = useRef(0);
  const lightTarget = useRef(new THREE.Object3D());
  const flashlightRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(true);
  
  const lookRotationRef = useRef({ yaw: 0, pitch: 0 });

  const supportsPointerLock = useMemo(() => {
    return typeof document !== 'undefined' && !!document.documentElement.requestPointerLock;
  }, []);

  useEffect(() => {
    footstepAudio.current = new Audio(FOOTSTEP_URL);
    camera.add(lightTarget.current);
    lightTarget.current.position.set(0, 0, -10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!active || isScaring) return;
      switch (e.code) {
        case 'KeyW': moveState.current.forward = true; break;
        case 'KeyS': moveState.current.backward = true; break;
        case 'KeyA': moveState.current.left = true; break;
        case 'KeyD': moveState.current.right = true; break;
        case 'ShiftLeft': moveState.current.sprint = true; break;
        case 'Space': moveState.current.jump = true; break;
        case 'KeyF': onToggleFlashlight(); break;
        case 'KeyE': raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera); onInteract(raycaster.current); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': moveState.current.forward = false; break;
        case 'KeyS': moveState.current.backward = false; break;
        case 'KeyA': moveState.current.left = false; break;
        case 'KeyD': moveState.current.right = false; break;
        case 'ShiftLeft': moveState.current.sprint = false; break;
        case 'Space': moveState.current.jump = false; break;
      }
    };

    const handleMobileInteract = (e: TouchEvent) => {
      if (!active) return;
      const target = e.target as HTMLElement;
      if (target.closest('#mobile-interact')) {
        raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
        onInteract(raycaster.current);
      }
    };

    // Defensive handling for PointerLock errors
    const handlePLError = (e: Event) => {
      console.warn("PointerLock failed:", e);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleMobileInteract);
    document.addEventListener('pointerlockerror', handlePLError);

    return () => { 
      window.removeEventListener('keydown', handleKeyDown); 
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleMobileInteract);
      document.removeEventListener('pointerlockerror', handlePLError);
    };
  }, [onToggleFlashlight, onInteract, camera, isScaring, active, isMobile]);

  useFrame((state, delta) => {
    if (!active || isScaring) {
      velocity.current.set(0, 0, 0);
      return;
    }

    // --- CUSTARD COLLECTION CHECK ---
    // Check if player is close enough to any custard to collect it automatically
    for (const custard of custards) {
      const dx = camera.position.x - custard.position[0];
      const dz = camera.position.z - custard.position[2];
      // Using squared distance for performance
      if (dx * dx + dz * dz < CUSTARD_COLLECT_RADIUS_SQ) {
        onCollectCustard(custard.id);
      }
    }

    // --- CAMERA ROTATION (Dual Joystick Mode) ---
    if (isMobile) {
      // Apply joystick input to rotation
      lookRotationRef.current.yaw -= mobileLook.x * LOOK_SENSITIVITY_JOYSTICK * delta;
      lookRotationRef.current.pitch -= mobileLook.y * LOOK_SENSITIVITY_JOYSTICK * delta;
      
      // Clamp pitch
      lookRotationRef.current.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, lookRotationRef.current.pitch));

      camera.rotation.order = 'YXZ';
      camera.rotation.y = lookRotationRef.current.yaw;
      camera.rotation.x = lookRotationRef.current.pitch;
    }

    const isMovingKbd = moveState.current.forward || moveState.current.backward || moveState.current.left || moveState.current.right;
    const isMovingMobile = Math.abs(mobileMovement.x) > 0.05 || Math.abs(mobileMovement.y) > 0.05;
    const isSprinting = (isMovingKbd && moveState.current.sprint) || (isMovingMobile && isSprintActive);

    // Physics: Vertical Movement (Gravity and Jumping)
    if (isGrounded.current && (moveState.current.jump || isJumpRequested)) {
      verticalVelocity.current = JUMP_FORCE;
      isGrounded.current = false;
      if (isJumpRequested) clearJumpRequest();
    }

    if (!isGrounded.current) {
      verticalVelocity.current -= GRAVITY * delta;
      camera.position.y += verticalVelocity.current * delta;

      // Ground collision
      if (camera.position.y <= EYE_HEIGHT) {
        camera.position.y = EYE_HEIGHT;
        verticalVelocity.current = 0;
        isGrounded.current = true;
      }
    }

    // Horizontal Movement
    const currentSpeed = isSprinting ? SPRINT_SPEED : WALK_SPEED;
    const direction = new THREE.Vector3();
    
    if (isMovingMobile) {
      // In dual stick mode, movement is relative to camera view
      direction.set(mobileMovement.x, 0, mobileMovement.y).normalize().multiplyScalar(currentSpeed).applyEuler(new THREE.Euler(0, camera.rotation.y, 0));
    } else {
      const frontVector = new THREE.Vector3(0, 0, Number(moveState.current.backward) - Number(moveState.current.forward));
      const sideVector = new THREE.Vector3(Number(moveState.current.left) - Number(moveState.current.right), 0, 0);
      direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(currentSpeed).applyEuler(new THREE.Euler(0, camera.rotation.y, 0));
    }

    direction.y = 0; 
    velocity.current.lerp(direction, 0.3); // Tightened for better walk response

    let nextX = camera.position.x + velocity.current.x * delta;
    let nextZ = camera.position.z + velocity.current.z * delta;

    // Obstacle collision
    for (const obs of obstacles) {
      const dx = nextX - obs.position[0]; const dz = nextZ - obs.position[2];
      const distSq = dx * dx + dz * dz; const combRad = PLAYER_RADIUS + obs.radius;
      if (distSq < combRad * combRad) {
        const dist = Math.sqrt(distSq); const overlap = combRad - dist;
        nextX += (dx / dist) * overlap; nextZ += (dz / dist) * overlap;
      }
    }
    
    if (Math.abs(nextX) < WORLD_BOUNDARY) camera.position.x = nextX;
    if (Math.abs(nextZ) < WORLD_BOUNDARY) camera.position.z = nextZ;
    if (bodyRef.current) bodyRef.current.rotation.y = camera.rotation.y;
    
    if (canWin && camera.position.distanceTo(WIN_ZONE_POSITION) < WIN_DISTANCE) onWin();

    // Footsteps
    if (isGrounded.current && (isMovingKbd || isMovingMobile)) {
      footstepTimer.current += delta;
      if (footstepTimer.current >= (isSprinting ? FOOTSTEP_INTERVAL_SPRINT : FOOTSTEP_INTERVAL_WALK)) {
        if (footstepAudio.current) {
          const step = footstepAudio.current.cloneNode() as HTMLAudioElement;
          step.volume = soundVolume * (isSprinting ? 0.7 : 0.4);
          step.play().catch(() => {});
        }
        footstepTimer.current = 0;
      }
    }

    // Flashlight Bobbing
    if (flashlightRef.current) {
      const time = state.clock.getElapsedTime();
      const bobY = (isGrounded.current && (isMovingKbd || isMovingMobile)) ? Math.sin(time * (isSprinting ? 16 : 12)) * 0.04 : 0;
      flashlightRef.current.position.y = -0.45 + bobY;
      flashlightRef.current.traverse((obj) => {
        if (obj instanceof THREE.Light && obj.name === 'mainSpot') obj.intensity = flashlightOn ? 800 : 0;
      });
    }
  });

  return (
    <>
      {active && !isMobile && supportsPointerLock && <PointerLockControls makeDefault />}
      <primitive object={lightTarget.current} />
      <group ref={bodyRef} position={camera.position}>
        <PlayerBody 
          isMoving={(moveState.current.forward || moveState.current.backward || moveState.current.left || moveState.current.right || Math.abs(mobileMovement.x) > 0.05 || Math.abs(mobileMovement.y) > 0.05) && isGrounded.current} 
          isSprinting={isSprintActive || moveState.current.sprint} 
        />
      </group>
      <group ref={flashlightRef} position={[0.45, -0.45, -0.8]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.04, 0.05, 0.6]} /><meshStandardMaterial color="#111" /></mesh>
        <spotLight name="mainSpot" visible={flashlightOn} position={[0, 0, -0.3]} target={lightTarget.current} intensity={800} distance={100} castShadow />
      </group>
    </>
  );
};

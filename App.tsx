
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { GameState, Custard as ICustard, Obstacle, JoystickInput } from './types';
import { World } from './components/Environment';
import { Player } from './components/Player';
import { Custard } from './components/Custard';
import { Monster } from './components/Monster';
import { getHorrorMessage } from './services/geminiService';
import { Ghost, Play, Settings as SettingsIcon, X, Skull, RotateCcw, Home, BatteryFull, BatteryLow, BatteryWarning, ArrowBigUp, Download, Zap, Eye, Hand, ChevronUp, ChevronLeft } from 'lucide-react';

const TOTAL_CUSTARDS = 10;
const BATTERY_DRAIN_RATE = 0.8;
const BATTERY_RECHARGE_RATE = 0.4;
const HOUSE_POSITION = new THREE.Vector3(0, 0, -40);

const worldObstacles: Obstacle[] = Array.from({ length: 60 }).map((_, i) => {
  const angle = Math.random() * Math.PI * 2;
  const radius = 15 + Math.random() * 80;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  const types: Obstacle['type'][] = ['tree', 'rock', 'willow', 'dead-tree'];
  const type = types[Math.floor(Math.random() * types.length)];
  let collRadius = 0.8;
  let scale = 0.8 + Math.random() * 0.7;
  
  if (type === 'rock') collRadius = 1.6 * scale;
  else if (type === 'willow') collRadius = 1.2 * scale;
  else if (type === 'dead-tree') collRadius = 1.4 * scale;

  return {
    id: `obs-${i}`,
    position: [x, 0, z],
    radius: collRadius,
    type,
    scale
  };
});

const JUMPSCARE_SOUND_URL = "https://cdn.pixabay.com/audio/2022/03/25/audio_27357c320a.mp3"; 
const MENU_MUSIC_URL = "https://cdn.pixabay.com/audio/2022/10/30/audio_33989c676d.mp3"; 
const GAME_AMBIENCE_URL = "https://cdn.pixabay.com/audio/2022/03/24/audio_73d9e265c0.mp3"; 
const HEARTBEAT_SOUND_URL = "https://cdn.pixabay.com/audio/2024/02/08/audio_824707833e.mp3";
const WIN_FANFARE_URL = "https://cdn.pixabay.com/audio/2021/08/04/audio_06250269f8.mp3";

const APP_VERSION = "v1.7.4-Joystick-Fix";

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [custards, setCustards] = useState<ICustard[]>([]);
  const [collectedCount, setCollectedCount] = useState(0);
  const [flashlightOn, setFlashlightOn] = useState(true);
  const [battery, setBattery] = useState(100);
  const [houseLightsOn, setHouseLightsOn] = useState(true);
  const [horrorMessage, setHorrorMessage] = useState("");
  const [isScaring, setIsScaring] = useState(false);
  const [dangerLevel, setDangerLevel] = useState(0); 
  const [isMobile, setIsMobile] = useState(false);
  
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [soundVolume, setSoundVolume] = useState(0.8);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [walkJoystick, setWalkJoystick] = useState<JoystickInput>({ x: 0, y: 0 });
  const [isSprintActive, setIsSprintActive] = useState(false);
  const [isJumpRequested, setIsJumpRequested] = useState(false);

  const jumpscareAudio = useRef<HTMLAudioElement | null>(null);
  const menuAudio = useRef<HTMLAudioElement | null>(null);
  const gameAudio = useRef<HTMLAudioElement | null>(null);
  const heartbeatAudio = useRef<HTMLAudioElement | null>(null);
  const winAudio = useRef<HTMLAudioElement | null>(null);
  
  const custardsGroupRef = useRef<THREE.Group>(null);
  const sceneRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const checkMobile = () => {
      // Inclusive detection for any touch-capable device (Mobile/Tablet/Touchscreen)
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      setIsMobile(isTouch);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const downloadAppFile = useCallback(() => {
    const htmlContent = `<!DOCTYPE html><html><head><title>Slendytubbies Nightmare Installer</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{background:#000;color:#fff;text-align:center;font-family:sans-serif;padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0}h1{color:#b91c1c;font-size:3rem;margin-bottom:10px}p{color:#888;max-width:400px;line-height:1.5}.btn{padding:15px 40px;background:#b91c1c;border:none;border-radius:5px;color:#fff;font-weight:bold;cursor:pointer;text-decoration:none;margin-top:30px;box-shadow:0 0 20px rgba(185,28,28,0.5)}</style></head><body><h1>SLENDYTUBBIES APK</h1><p>To install the full game on your Mobile or Tablet device, open the original game link and use the "Add to Home Screen" feature in your browser's menu.</p><a href="${window.location.href}" class="btn">OPEN ORIGINAL LINK</a></body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Slendytubbies_Nightmare_Installer.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    const initAudio = (url: string, loop: boolean = false, initialVolume: number = 0.5) => {
      const audio = new Audio(url);
      audio.loop = loop;
      audio.volume = initialVolume;
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      return audio;
    };
    jumpscareAudio.current = initAudio(JUMPSCARE_SOUND_URL, false, soundVolume);
    menuAudio.current = initAudio(MENU_MUSIC_URL, true, musicVolume);
    gameAudio.current = initAudio(GAME_AMBIENCE_URL, true, musicVolume);
    heartbeatAudio.current = initAudio(HEARTBEAT_SOUND_URL, true, 0);
    winAudio.current = initAudio(WIN_FANFARE_URL, false, soundVolume);
    return () => {
      [menuAudio, gameAudio, heartbeatAudio, winAudio].forEach(ref => { if (ref.current) ref.current.pause(); });
    };
  }, []);

  useEffect(() => {
    if (gameState === GameState.START) {
      gameAudio.current?.pause();
      if (menuAudio.current?.paused) menuAudio.current.play().catch(() => {});
    } else if (gameState === GameState.PLAYING) {
      menuAudio.current?.pause();
      if (gameAudio.current?.paused) gameAudio.current.play().catch(() => {});
    }
  }, [gameState]);

  useEffect(() => {
    let interval: number;
    if (gameState === GameState.PLAYING) {
      interval = window.setInterval(() => {
        setBattery(prev => {
          if (flashlightOn) {
            const next = Math.max(0, prev - (BATTERY_DRAIN_RATE * 0.1));
            if (next === 0 && flashlightOn) setFlashlightOn(false);
            return next;
          } else {
            return Math.min(100, prev + (BATTERY_RECHARGE_RATE * 0.1));
          }
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameState, flashlightOn]);

  const initGame = useCallback(() => {
    const newCustards: ICustard[] = [];
    newCustards.push({ id: 'house-1', position: [5, 0.2, -45] });
    newCustards.push({ id: 'house-2', position: [-5, 0.2, -42] });
    for (let i = 2; i < TOTAL_CUSTARDS; i++) {
      const x = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      if (Math.sqrt(x * x + z * z) < 15 || Math.sqrt(x * x + (z + 40) * (z + 40)) < 15) { i--; continue; }
      newCustards.push({ id: `c-${i}`, position: [x, 0.2, z] });
    }
    setCustards(newCustards);
    setCollectedCount(0);
    setFlashlightOn(true);
    setBattery(100);
    setGameState(GameState.PLAYING);
    setIsScaring(false);
    setDangerLevel(0);
    setHorrorMessage("Collect 10 Custards...");
    
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  const handleInteract = useCallback((raycaster: THREE.Raycaster) => {
    if (gameState !== GameState.PLAYING || isScaring) return;
    if (custardsGroupRef.current) {
      const intersects = raycaster.intersectObjects(custardsGroupRef.current.children, true);
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.name.startsWith('custard-')) obj = obj.parent;
        if (obj) {
          const id = obj.name.replace('custard-', '');
          setCustards(prev => prev.filter(c => c.id !== id));
          setCollectedCount(prev => {
            const nextCount = prev + 1;
            getHorrorMessage(nextCount, TOTAL_CUSTARDS).then(setHorrorMessage);
            return nextCount;
          });
        }
      }
    }
  }, [gameState, isScaring]);

  const handleJoystick = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : (e as any);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2;
    const limitedDist = Math.min(distance, maxDist);
    const angle = Math.atan2(dy, dx);
    
    setWalkJoystick({
      x: (Math.cos(angle) * limitedDist) / maxDist,
      y: (Math.sin(angle) * limitedDist) / maxDist
    });
  };

  const handleJoystickEnd = () => {
    setWalkJoystick({ x: 0, y: 0 });
  };

  const handleCatch = useCallback(() => {
    if (gameState === GameState.PLAYING && !isScaring) {
      setIsScaring(true);
      if (jumpscareAudio.current) {
        jumpscareAudio.current.currentTime = 0;
        jumpscareAudio.current.play().catch(() => {});
      }
      setTimeout(() => {
        setIsScaring(false);
        setGameState(GameState.GAMEOVER);
      }, 1600);
    }
  }, [gameState, isScaring]);

  const handleWin = useCallback(() => {
    if (collectedCount === TOTAL_CUSTARDS) {
      winAudio.current?.play().catch(() => {});
      setGameState(GameState.WIN);
    }
  }, [collectedCount]);

  const exitToMenu = useCallback(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    setGameState(GameState.START);
  }, []);

  const getBatteryIcon = () => {
    if (battery > 70) return <BatteryFull size={24} className="text-green-500" />;
    if (battery > 25) return <BatteryLow size={24} className="text-yellow-500" />;
    return <BatteryWarning size={24} className="text-red-600 animate-pulse" />;
  };

  return (
    <div className={`w-full h-screen relative bg-black font-sans overflow-hidden select-none touch-none ${isScaring ? 'animate-shake' : ''}`}>
      <style>{`
        @keyframes shake { 0%, 100% { transform: translate(0, 0); } 5% { transform: translate(-10px, -10px); } 15% { transform: translate(10px, 10px); } 25% { transform: translate(-10px, 10px); } }
        @keyframes flash { 0%, 100% { background: rgba(0,0,0,1); } 50% { background: rgba(185,28,28,0.3); } }
        .animate-shake { animation: shake 0.1s infinite; }
        .jumpscare-flash { animation: flash 0.2s linear infinite; }
        .danger-pulse { animation: dangerPulse 1.5s ease-in-out infinite; }
        @keyframes dangerPulse { 0%, 100% { opacity: 0; } 50% { opacity: var(--danger-opacity, 0); } }
        
        .mesh-texture {
          background-color: #222;
          background-image: 
            radial-gradient(circle, #444 0%, #222 70%),
            repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 5px 5px;
          border: 4px solid #555;
          box-shadow: inset 0 0 15px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5);
          opacity: 1;
        }

        .mesh-knob {
          background: radial-gradient(circle at 30% 30%, #555, #111);
          background-image: 
            radial-gradient(circle, #888 1px, transparent 1px);
          background-size: 6px 6px;
          border: 4px solid #222;
          box-shadow: 0 5px 15px rgba(0,0,0,0.7);
          opacity: 1;
        }

        .jump-btn-retro {
          background: rgba(255, 255, 255, 0.95);
          border: 4px solid #333;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        }

        .retro-menu-text {
          font-family: 'Times New Roman', serif;
          color: rgba(255, 255, 255, 0.7);
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
          font-size: 2.2rem;
          transition: color 0.2s;
        }
        .retro-menu-text:active {
          color: #fff;
        }
      `}</style>

      {(gameState === GameState.PLAYING || isScaring) && (
        <div className="absolute inset-0 z-0">
          <Canvas shadows camera={{ fov: 75, position: [0, 1.7, 0] }}>
            <group ref={sceneRef}>
              <World houseLightsOn={houseLightsOn} obstacles={worldObstacles} />
              <group ref={custardsGroupRef}>
                {custards.map(c => <Custard key={c.id} id={c.id} position={c.position} />)}
              </group>
              <Monster onCatch={handleCatch} active={gameState === GameState.PLAYING && !isScaring} isScaring={isScaring} onDangerUpdate={setDangerLevel} soundVolume={soundVolume} />
              {collectedCount === TOTAL_CUSTARDS && (
                <group position={[HOUSE_POSITION.x, 0, HOUSE_POSITION.z]}>
                  <pointLight intensity={20} distance={30} color="#00ffff" />
                  <mesh position={[0, 10, 0]}><cylinderGeometry args={[0.1, 0.1, 20]} /><meshBasicMaterial color="#00ffff" transparent opacity={0.3} /></mesh>
                </group>
              )}
            </group>
            <Player 
              onInteract={handleInteract} 
              flashlightOn={flashlightOn && !isScaring} 
              isScaring={isScaring} 
              battery={battery} 
              obstacles={worldObstacles} 
              onToggleFlashlight={() => { if (!isScaring && battery > 0) setFlashlightOn(!flashlightOn); }} 
              soundVolume={soundVolume} 
              canWin={collectedCount === TOTAL_CUSTARDS} 
              onWin={handleWin}
              mobileMovement={walkJoystick}
              isSprintActive={isSprintActive}
              isJumpRequested={isJumpRequested}
              clearJumpRequest={() => setIsJumpRequested(false)}
              active={gameState === GameState.PLAYING}
              isMobile={isMobile}
            />
          </Canvas>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
            <div className="w-1 h-1 bg-white/40 rounded-full"></div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-10 pointer-events-none danger-pulse bg-red-900/30" style={{ '--danger-opacity': (dangerLevel * 0.7).toString() } as any} />

      <div className="absolute inset-0 z-[500] pointer-events-none h-full w-full">
        {gameState === GameState.START && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] text-white p-6 pointer-events-auto">
            <div className="mb-12 relative flex flex-col items-center">
              <Ghost className="text-red-800 mb-4 animate-pulse" size={isMobile ? 48 : 64} />
              <h1 className="text-5xl lg:text-9xl font-black italic text-red-700 drop-shadow-[0_0_30px_rgba(185,28,28,0.6)] text-center uppercase"> SLENDYTUBBIES </h1>
              <p className="text-zinc-600 font-bold uppercase tracking-[0.5em] mt-4 opacity-70 text-sm">NIGHTMARE</p>
            </div>
            <div className="flex flex-col gap-4 w-72">
              <button onClick={initGame} className="bg-red-800 hover:bg-red-700 border-b-[6px] border-red-950 text-white py-5 font-black uppercase tracking-widest text-xl flex items-center justify-center gap-3 active:scale-95 cursor-pointer"> <Play fill="white" size={20} /> START GAME </button>
              <button onClick={downloadAppFile} className="bg-zinc-900/80 hover:bg-zinc-800 border-b-2 border-zinc-950 text-zinc-400 py-3 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"> <Download size={14} /> DOWNLOAD APK </button>
              <button onClick={() => setIsSettingsOpen(true)} className="bg-zinc-900/80 hover:bg-zinc-800 border-b-2 border-zinc-950 text-zinc-500 py-3 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"> <SettingsIcon size={14} /> SETTINGS </button>
            </div>
            <div className="absolute bottom-6 right-8 text-zinc-700 font-mono text-[10px] tracking-widest uppercase opacity-40"> {APP_VERSION} </div>
          </div>
        )}

        {gameState === GameState.PLAYING && !isScaring && (
          <div className="absolute inset-0 w-full h-full pointer-events-none z-[600]">
            <div className="absolute top-8 left-8 pointer-events-auto">
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={exitToMenu}
                className="retro-menu-text font-serif italic"
              >
                Main Menu
              </button>
            </div>

            <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-2">
              <div className="px-6 py-1 bg-black/60 rounded-full text-white font-bold text-lg border border-red-900/40 backdrop-blur-sm">
                {collectedCount} / {TOTAL_CUSTARDS}
              </div>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-3 bg-black/50 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
              <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${battery > 25 ? 'bg-green-500' : 'bg-red-600'}`} style={{ width: `${battery}%` }} />
              </div>
              {getBatteryIcon()}
            </div>

            {isMobile && (
              <div className="absolute inset-0 h-full w-full pointer-events-none">
                {/* Walking Joystick (Bottom-Left) */}
                <div 
                  className="absolute bottom-10 left-10 w-44 h-44 rounded-full flex items-center justify-center pointer-events-auto touch-none mesh-texture z-[700]" 
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchMove={handleJoystick} 
                  onTouchEnd={handleJoystickEnd}
                >
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center mesh-knob" 
                    style={{ transform: `translate(${walkJoystick.x * 50}px, ${walkJoystick.y * 50}px)` }}
                  ></div>
                </div>

                {/* Jump Button (Right Center) */}
                <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-auto z-[700]">
                  <button 
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                    className="w-24 h-24 jump-btn-retro rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-2xl"
                    onTouchStart={(e) => { e.stopPropagation(); setIsJumpRequested(true); }}
                  >
                    <svg viewBox="0 0 100 100" className="w-20 h-20">
                      <circle cx="50" cy="20" r="10" fill="black" />
                      <path d="M50 30 L50 65" stroke="black" strokeWidth="6" />
                      <path d="M50 40 L25 25 M50 40 L80 30" stroke="black" strokeWidth="6" strokeLinecap="round" />
                      <path d="M50 65 L25 85 M50 65 L75 80" stroke="black" strokeWidth="6" strokeLinecap="round" />
                      <path d="M85 75 L85 55 L75 65 M85 55 L95 65" stroke="#16a34a" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Utility Buttons (Sprint/Interact/Flashlight) */}
                <div className="absolute bottom-10 right-10 flex flex-col gap-4 pointer-events-auto z-[700]">
                   <button 
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`w-16 h-16 mesh-texture rounded-full flex items-center justify-center transition-colors ${isSprintActive ? 'border-red-600' : 'border-zinc-500'}`}
                      onTouchStart={(e) => { e.stopPropagation(); setIsSprintActive(true); }}
                      onTouchEnd={(e) => { e.stopPropagation(); setIsSprintActive(false); }}
                      id="mobile-interact"
                    >
                      <Hand size={32} className={isSprintActive ? 'text-red-500' : 'text-zinc-400'} />
                    </button>
                    <button 
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); if (battery > 0) setFlashlightOn(!flashlightOn); }} 
                      className={`w-16 h-16 mesh-texture rounded-full flex items-center justify-center transition-all ${flashlightOn ? 'border-yellow-400 bg-zinc-800' : 'border-zinc-700 opacity-60'}`}
                    >
                      <Eye size={28} className={flashlightOn ? 'text-yellow-400' : 'text-zinc-600'} />
                    </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isScaring && (
          <div className="absolute inset-0 z-[1000] jumpscare-flash pointer-events-none flex items-center justify-center bg-black">
             <div className="relative w-full h-full flex items-center justify-center animate-shake">
               <div className="flex flex-col items-center scale-75 md:scale-100">
                  <div className="flex gap-20 -mb-4">
                     <div className="w-40 h-40 bg-red-600 rounded-full blur-md border-8 border-white shadow-[0_0_80px_rgba(255,0,0,1)]"></div>
                     <div className="w-40 h-40 bg-red-600 rounded-full blur-md border-8 border-white shadow-[0_0_80px_rgba(255,0,0,1)]"></div>
                  </div>
                  <div className="w-96 h-48 bg-black border-t-8 border-zinc-900 rounded-b-full mt-4"></div>
               </div>
             </div>
          </div>
        )}

        {gameState === GameState.GAMEOVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 text-white p-6 pointer-events-auto z-[900]">
            <Skull className="text-red-600 mb-6 drop-shadow-xl" size={64} />
            <h2 className="text-7xl font-black uppercase italic text-red-700 mb-2 text-center"> YOU DIED </h2>
            <div className="flex flex-col gap-4 w-64 mt-8">
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={initGame} 
                className="bg-red-800 hover:bg-red-700 border-b-4 border-red-950 text-white py-4 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95 cursor-pointer"> <RotateCcw size={18} /> RETRY </button>
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={exitToMenu} 
                className="bg-zinc-900/80 hover:bg-zinc-800 border-b-2 border-zinc-950 text-zinc-400 py-3 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 cursor-pointer"> <Home size={14} /> MAIN MENU </button>
            </div>
          </div>
        )}

        {gameState === GameState.WIN && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-white p-8 pointer-events-auto text-center z-[900]">
            <h2 className="text-6xl font-black mb-10 uppercase italic"> SURVIVED </h2>
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={exitToMenu} 
              className="bg-cyan-600 hover:bg-cyan-500 text-black py-5 w-72 font-black uppercase tracking-widest text-sm border-b-4 border-cyan-800 flex items-center justify-center gap-3 active:scale-95 cursor-pointer"> <Home size={20} /> MAIN MENU </button>
          </div>
        )}

        {isSettingsOpen && (
          <div className="absolute inset-0 bg-black/98 flex items-center justify-center pointer-events-auto z-[1100]">
            <div className="w-full max-sm border border-zinc-800 bg-zinc-950 p-10 relative shadow-2xl m-4">
              <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setIsSettingsOpen(false)} className="absolute top-6 right-6 text-zinc-600 hover:text-white cursor-pointer"><X size={24} /></button>
              <h2 className="text-2xl font-black mb-10 uppercase tracking-widest text-red-700 border-b border-red-900/30 pb-4">Settings</h2>
              <div className="space-y-8">
                <div className="space-y-2"> 
                  <div className="flex justify-between text-[11px] uppercase font-bold text-zinc-400"><span>Volume</span><span>{Math.round(soundVolume * 100)}%</span></div> 
                  <input type="range" min="0" max="1" step="0.01" value={soundVolume} onChange={(e) => setSoundVolume(parseFloat(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg accent-red-700" onPointerDown={(e) => e.stopPropagation()} /> 
                </div>
              </div>
              <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setIsSettingsOpen(false)} className="w-full mt-10 bg-red-800 py-4 font-black uppercase text-xs tracking-widest active:scale-95 transition-transform cursor-pointer">CLOSE</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default App;

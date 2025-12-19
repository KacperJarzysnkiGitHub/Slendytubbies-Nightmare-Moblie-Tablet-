
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  WIN = 'WIN',
  GAMEOVER = 'GAMEOVER'
}

export interface Custard {
  id: string;
  position: [number, number, number];
}

export interface Obstacle {
  id: string;
  position: [number, number, number];
  radius: number;
  type: 'tree' | 'rock' | 'willow' | 'dead-tree';
  scale?: number;
}

export interface JoystickInput {
  x: number;
  y: number;
}

export interface GameStats {
  custardsCollected: number;
  totalCustards: number;
  startTime: number;
  endTime?: number;
}

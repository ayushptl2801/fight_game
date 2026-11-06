export type GameScreen = 
  | 'TITLE' 
  | 'HOW_TO_PLAY' 
  | 'LEVEL_INTRO' 
  | 'FIGHT' 
  | 'PAUSE' 
  | 'RESULTS';

export type OpponentId = 'shashwat' | 'aditya' | 'harsh' | 'shreyansh' | 'ayush';

export interface OpponentConfig {
  id: OpponentId;
  levelNumber: number;
  name: string;
  title: string;
  subtitle: string;
  description: string;
  arenaName: string;
  arenaType: 'courtyard' | 'forest' | 'stone' | 'mountain' | 'storm';
  maxHp: number;
  speed: number;
  attackDamageLight: number;
  attackDamageHeavy: number;
  attackInterval: number; // seconds between attacks
  telegraphDuration: number; // warning indicator time in seconds
  blockChance: number; // 0..1
  dodgeChance: number; // 0..1
  aggression: number; // 0..1 tendency to close distance
  isUnbeatableBoss?: boolean;
  colors: {
    primary: number; // armor/coat
    secondary: number; // trim/accents
    skin: number;
    hair: number;
    blade: number;
    bladeGlow: number;
    trailColor: number;
    auraColor?: number;
  };
  tips: string[];
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
}

export interface OpponentStats {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  isTelegraphing: boolean;
  telegraphType: 'light' | 'heavy' | 'unblockable';
  telegraphProgress: number; // 0 to 1
}

export interface FightOutcome {
  level: number;
  opponentId: OpponentId;
  opponentName: string;
  result: 'VICTORY' | 'DEFEAT' | 'SURVIVED_FINAL';
  survivalTimeSeconds?: number;
  damageDealt: number;
  damageTaken: number;
  hitsLanded: number;
  parriesExecuted: number;
}

export interface GameSaveData {
  unlockedLevel: number; // 1 to 5
  levelsCompleted: number[];
  ayushBestSurvivalTime: number; // seconds
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

export type ActionType = 
  | 'IDLE' 
  | 'RUN' 
  | 'ATTACK_LIGHT' 
  | 'ATTACK_HEAVY' 
  | 'BLOCK' 
  | 'DODGE' 
  | 'HIT' 
  | 'DEAD';

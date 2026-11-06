import React, { useEffect, useRef, useState } from 'react';
import { Pause, Volume2, VolumeX, Shield, Swords, AlertCircle, Clock, Zap } from 'lucide-react';
import { CombatEngine, CombatHUDState } from '../game/combatEngine';
import { OpponentConfig, FightOutcome } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { PauseModal } from './PauseModal';
import { TouchControls } from './TouchControls';

interface FightScreenProps {
  opponent: OpponentConfig;
  onFinishFight: (outcome: FightOutcome) => void;
  onExitToMenu: () => void;
  onRestartFight: () => void;
}

export const FightScreen: React.FC<FightScreenProps> = ({
  opponent,
  onFinishFight,
  onExitToMenu,
  onRestartFight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CombatEngine | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // HUD State synced from 3D Combat Engine
  const [hud, setHud] = useState<CombatHUDState>({
    playerHp: 100,
    playerMaxHp: 100,
    playerStamina: 100,
    playerMaxStamina: 100,
    opponentHp: opponent.maxHp,
    opponentMaxHp: opponent.maxHp,
    opponentName: opponent.name,
    opponentTitle: opponent.title,
    isAyush: !!opponent.isUnbeatableBoss,
    survivalTime: 0,
    telegraph: {
      active: false,
      type: 'light',
      progress: 0,
    },
    combatLog: [],
    floatingTexts: [],
  });

  // Detect touch device or small screen
  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Initialize Combat Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new CombatEngine(
      containerRef.current,
      opponent,
      (newHud) => setHud(newHud),
      (outcome) => onFinishFight(outcome)
    );

    engineRef.current = engine;
    engine.start();

    // Escape key listener for Pause
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPaused((prev) => {
          const next = !prev;
          if (next) engine.pause();
          else engine.resume();
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      engine.dispose();
      engineRef.current = null;
    };
  }, [opponent]);

  const handlePause = () => {
    soundManager.playClick();
    if (engineRef.current) {
      engineRef.current.pause();
    }
    setIsPaused(true);
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
    setIsPaused(false);
  };

  const handleToggleMute = () => {
    soundManager.playClick();
    const next = !isMuted;
    soundManager.setMuted(next);
    setIsMuted(next);
  };

  const handleVirtualMovement = (x: number, z: number) => {
    if (engineRef.current) {
      engineRef.current.setVirtualMovement(x, z);
    }
  };

  const handleVirtualAction = (action: 'quick' | 'heavy' | 'dodge' | 'blockStart' | 'blockEnd' | 'sprintToggle') => {
    if (engineRef.current) {
      engineRef.current.triggerVirtualAction(action);
    }
  };

  const playerHpPercent = (hud.playerHp / hud.playerMaxHp) * 100;
  const playerStaminaPercent = (hud.playerStamina / hud.playerMaxStamina) * 100;
  const opponentHpPercent = opponent.isUnbeatableBoss ? 100 : (hud.opponentHp / hud.opponentMaxHp) * 100;

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Floating Damage Text Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {hud.floatingTexts.map((ft) => (
          <div
            key={ft.id}
            className="absolute font-black text-xl md:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-cinzel transition-transform -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-75 duration-100"
            style={{
              left: `${ft.x}px`,
              top: `${ft.y}px`,
              color: ft.color,
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>

      {/* Top HUD: Health, Stamina, Boss Timer & Controls */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-6 z-20 pointer-events-none">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          {/* Main Status Bar */}
          <div className="flex items-center justify-between gap-4">
            {/* Player Health & Stamina */}
            <div className="flex-1 max-w-sm pointer-events-auto">
              <div className="flex items-center justify-between text-xs md:text-sm font-bold mb-1">
                <span className="text-cyan-400 font-cinzel flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  YOU (CHALLENGER)
                </span>
                <span className="font-mono text-slate-300">
                  {Math.round(hud.playerHp)} / {hud.playerMaxHp}
                </span>
              </div>
              {/* HP Bar */}
              <div className="w-full h-4 md:h-5 bg-slate-900/90 rounded-full border border-white/20 p-0.5 overflow-hidden shadow-lg">
                <div
                  className="h-full rounded-full transition-all duration-150 ease-out bg-gradient-to-r from-cyan-600 via-blue-500 to-cyan-400"
                  style={{ width: `${Math.max(0, playerHpPercent)}%` }}
                />
              </div>
              {/* Stamina Bar */}
              <div className="w-full h-1.5 md:h-2 bg-slate-900/80 rounded-full border border-white/10 mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-600 to-emerald-400"
                  style={{ width: `${Math.max(0, playerStaminaPercent)}%` }}
                />
              </div>
            </div>

            {/* Center Match Info / Survival Clock */}
            <div className="flex flex-col items-center pointer-events-auto">
              {hud.isAyush ? (
                <div className="flex flex-col items-center px-4 py-1.5 rounded-2xl bg-purple-950/80 border border-purple-500/50 shadow-xl shadow-purple-950/60 pulse-boss-glow">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-black text-purple-300 uppercase tracking-widest font-cinzel">
                    <Clock size={14} className="text-purple-400" />
                    SURVIVE THE WRATH
                  </div>
                  <div className="text-xl md:text-2xl font-black text-purple-200 font-mono tracking-wider">
                    {hud.survivalTime.toFixed(1)}s
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center px-4 py-1 rounded-xl bg-slate-900/80 border border-white/10 shadow-md">
                  <span className="text-[10px] md:text-xs font-bold text-amber-400 uppercase tracking-widest font-cinzel">
                    Trial {opponent.levelNumber} of 5
                  </span>
                  <span className="text-xs text-slate-300 font-bold font-rajdhani">
                    {opponent.arenaName}
                  </span>
                </div>
              )}

              {/* Pause & Mute buttons */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handlePause}
                  className="p-1.5 md:p-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition-all flex items-center gap-1 text-xs font-bold font-rajdhani"
                >
                  <Pause size={16} />
                  <span className="hidden sm:inline">Pause</span>
                </button>
                <button
                  onClick={handleToggleMute}
                  className="p-1.5 md:p-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition-all"
                >
                  {isMuted ? <VolumeX size={16} className="text-rose-400" /> : <Volume2 size={16} className="text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Opponent Health */}
            <div className="flex-1 max-w-sm pointer-events-auto text-right">
              <div className="flex items-center justify-between text-xs md:text-sm font-bold mb-1">
                <span className="font-mono text-slate-300 order-1">
                  {hud.isAyush ? '∞ / ∞' : `${Math.round(hud.opponentHp)} / ${hud.opponentMaxHp}`}
                </span>
                <span
                  className={`font-cinzel flex items-center gap-1.5 order-2 ${
                    hud.isAyush ? 'text-purple-400 font-black' : 'text-rose-400'
                  }`}
                >
                  {hud.opponentName.toUpperCase()}
                  <span className={`w-2 h-2 rounded-full ${hud.isAyush ? 'bg-purple-500 animate-pulse' : 'bg-rose-500'}`} />
                </span>
              </div>
              {/* Opponent HP Bar */}
              <div className="w-full h-4 md:h-5 bg-slate-900/90 rounded-full border border-white/20 p-0.5 overflow-hidden shadow-lg">
                <div
                  className={`h-full rounded-full transition-all duration-150 ease-out ${
                    hud.isAyush
                      ? 'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-400 pulse-boss-glow'
                      : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500'
                  }`}
                  style={{ width: `${Math.max(0, opponentHpPercent)}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 italic mt-0.5">
                {hud.isAyush ? 'UNDEFEATED SOVEREIGN' : hud.opponentTitle}
              </div>
            </div>
          </div>

          {/* Telegraph Alert Warning Bar (When Opponent Prepares Strike) */}
          {hud.telegraph.active && (
            <div className="w-full max-w-md mx-auto pointer-events-auto animate-in fade-in zoom-in-95 duration-100">
              <div
                className={`py-1.5 px-4 rounded-xl border flex items-center justify-between shadow-lg ${
                  hud.telegraph.type === 'unblockable'
                    ? 'bg-purple-950/90 border-purple-400 text-purple-200'
                    : hud.telegraph.type === 'heavy'
                    ? 'bg-red-950/90 border-red-400 text-red-200'
                    : 'bg-amber-950/90 border-yellow-400 text-yellow-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs md:text-sm font-black uppercase font-cinzel">
                  <AlertCircle size={18} className="animate-spin" />
                  <span>
                    {hud.telegraph.type === 'unblockable'
                      ? 'UNBLOCKABLE VOID STRIKE — DODGE!'
                      : hud.telegraph.type === 'heavy'
                      ? 'HEAVY OVERHEAD — DODGE RECOMMENDED!'
                      : 'INCOMING STRIKE — GUARD OR EVADE!'}
                  </span>
                </div>
                {/* Windup Progress Bar */}
                <div className="w-20 h-2 bg-black/60 rounded-full overflow-hidden ml-3 border border-white/20">
                  <div
                    className="h-full bg-white transition-all duration-75"
                    style={{ width: `${hud.telegraph.progress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Guidance & Combat Log */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none flex flex-col md:flex-row justify-between items-end gap-3">
        {/* Dynamic Combat Log */}
        <div className="bg-slate-950/60 backdrop-blur-sm border border-white/5 rounded-xl p-2.5 max-w-xs w-full text-xs text-slate-300 font-rajdhani space-y-1 pointer-events-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-cinzel">
            Battle Log
          </div>
          {hud.combatLog.length === 0 ? (
            <div className="italic text-slate-500">Engage the enemy swordsman...</div>
          ) : (
            hud.combatLog.slice(0, 3).map((log, idx) => (
              <div key={idx} className="truncate">
                • {log}
              </div>
            ))
          )}
        </div>

        {/* Keyboard Quick Bar (Desktop) */}
        {!isTouchDevice && (
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 text-xs text-slate-300 font-mono pointer-events-auto shadow-xl">
            <span className="font-bold text-white font-cinzel uppercase tracking-wider">Controls:</span>
            <span>WASD/Arrows: Move</span>
            <span className="text-slate-600">|</span>
            <span>Shift: Run</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">Space: Dodge</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400">J: Quick</span>
            <span className="text-slate-600">|</span>
            <span className="text-orange-400">K: Strong</span>
            <span className="text-slate-600">|</span>
            <span className="text-blue-400">L: Block</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Esc: Pause</span>
          </div>
        )}
      </div>

      {/* Mobile / Touchscreen On-Screen Controls */}
      {isTouchDevice && (
        <TouchControls
          onMovement={handleVirtualMovement}
          onAction={handleVirtualAction}
        />
      )}

      {/* Pause Modal Overlay */}
      {isPaused && (
        <PauseModal
          onResume={handleResume}
          onRestart={onRestartFight}
          onMainMenu={onExitToMenu}
        />
      )}
    </div>
  );
};

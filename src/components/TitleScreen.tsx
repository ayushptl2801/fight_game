import React, { useState } from 'react';
import { Swords, Play, BookOpen, Volume2, VolumeX, RotateCcw, Award, CheckCircle2, Lock, Flame } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { OPPONENTS } from '../game/opponents';
import { HowToPlayModal } from './HowToPlayModal';

interface TitleScreenProps {
  unlockedLevel: number;
  levelsCompleted: number[];
  bestAyushTime: number;
  onSelectLevel: (levelNum: number) => void;
  onResetProgress: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  unlockedLevel,
  levelsCompleted,
  bestAyushTime,
  onSelectLevel,
  onResetProgress,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [confirmReset, setConfirmReset] = useState(false);

  const handleToggleSound = () => {
    soundManager.playClick();
    const next = !isMuted;
    soundManager.setMuted(next);
    setIsMuted(next);
  };

  const handlePlayNext = () => {
    soundManager.playClick();
    onSelectLevel(unlockedLevel);
  };

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col justify-between items-center p-4 md:p-8 bg-gradient-to-b from-slate-950 via-[#0a0c16] to-slate-950 overflow-y-auto">
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {/* Background visual motif */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px]" />
      </div>

      {/* Top Header Controls */}
      <div className="w-full max-w-4xl flex justify-between items-center z-10 py-2">
        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400 font-cinzel">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Version 1.0 • Browser 3D Combat</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Button */}
          <button
            onClick={handleToggleSound}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition-all flex items-center gap-2 text-xs font-bold font-rajdhani"
          >
            {isMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-emerald-400" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>

          {/* How to Play */}
          <button
            onClick={() => {
              soundManager.playClick();
              setShowHowToPlay(true);
            }}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition-all flex items-center gap-2 text-xs font-bold font-rajdhani"
          >
            <BookOpen size={18} className="text-cyan-400" />
            <span className="hidden sm:inline">How to Play</span>
          </button>
        </div>
      </div>

      {/* Main Title Hero Section */}
      <div className="w-full max-w-4xl flex flex-col items-center text-center my-auto py-6 z-10 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950/60 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-widest uppercase font-cinzel">
            <Swords size={14} className="text-cyan-400" />
            Original 3D Sword Combat
          </div>

          <h1 className="text-5xl md:text-7xl font-black font-cinzel tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-100 to-amber-200 drop-shadow-md">
            BLADE TRIALS
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto font-rajdhani tracking-wide">
            Face five formidable swordsmen in sequence. Prove your precision, reflexes, and courage against the ultimate undefeated sovereign.
          </p>
        </div>

        {/* Primary Play Button */}
        <div className="w-full max-w-xs pt-2">
          <button
            onClick={handlePlayNext}
            className={`w-full py-4 rounded-2xl text-lg font-black flex items-center justify-center gap-3 shadow-2xl transition-all ${
              unlockedLevel === 5 ? 'btn-boss pulse-boss-glow' : 'btn-primary'
            }`}
          >
            <Play size={22} fill="currentColor" />
            <span>
              {unlockedLevel === 1
                ? 'START TRIAL'
                : unlockedLevel === 5
                ? 'ENTER AYUSH TRIAL'
                : `CONTINUE TRIAL ${unlockedLevel}`}
            </span>
          </button>
        </div>

        {/* Level Progression Roadmap */}
        <div className="w-full pt-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-cinzel">
              Trial Progression Roadmap
            </span>
            {bestAyushTime > 0 && (
              <span className="text-xs text-purple-300 font-bold flex items-center gap-1 font-mono">
                <Award size={14} className="text-amber-400" />
                Ayush Survival Record: {bestAyushTime.toFixed(1)}s
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {OPPONENTS.map((opp) => {
              const isUnlocked = opp.levelNumber <= unlockedLevel;
              const isCompleted = levelsCompleted.includes(opp.levelNumber);
              const isCurrent = opp.levelNumber === unlockedLevel;
              const isBoss = opp.isUnbeatableBoss;

              return (
                <button
                  key={opp.id}
                  disabled={!isUnlocked}
                  onClick={() => {
                    if (isUnlocked) {
                      soundManager.playClick();
                      onSelectLevel(opp.levelNumber);
                    }
                  }}
                  className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    !isUnlocked
                      ? 'bg-slate-950/40 border-white/5 opacity-40 cursor-not-allowed'
                      : isBoss
                      ? 'bg-gradient-to-b from-purple-950/70 to-slate-900 border-purple-500/50 hover:border-purple-400 shadow-lg shadow-purple-950/50'
                      : isCurrent
                      ? 'bg-blue-950/60 border-cyan-400/80 shadow-lg shadow-cyan-900/40 hover:scale-[1.02]'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-[10px] font-bold uppercase font-cinzel ${
                        isBoss ? 'text-purple-400' : 'text-slate-400'
                      }`}
                    >
                      Trial {opp.levelNumber}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : !isUnlocked ? (
                      <Lock size={14} className="text-slate-500" />
                    ) : isBoss ? (
                      <Flame size={16} className="text-purple-400 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    )}
                  </div>

                  <div className="mt-2">
                    <div
                      className={`font-black text-sm truncate font-cinzel ${
                        isBoss ? 'text-purple-300' : 'text-white'
                      }`}
                    >
                      {opp.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-rajdhani">{opp.title}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="w-full max-w-4xl flex justify-between items-center z-10 py-2 border-t border-white/10 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-rose-400 font-bold">Reset all progress?</span>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onResetProgress();
                  setConfirmReset(false);
                }}
                className="text-rose-300 hover:text-white underline font-bold"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="text-slate-400 hover:text-white underline ml-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="hover:text-rose-400 transition-colors flex items-center gap-1.5 font-bold"
            >
              <RotateCcw size={14} />
              Reset Progress
            </button>
          )}
        </div>

        <div>
          <span>Blade Trials • Five Swordsmen Challenge</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Trophy, Skull, ShieldAlert, RotateCcw, ArrowRight, Home, Clock, Award, Swords } from 'lucide-react';
import { FightOutcome } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface ResultsScreenProps {
  outcome: FightOutcome;
  bestAyushTime: number;
  onContinue: () => void;
  onRetry: () => void;
  onMainMenu: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  outcome,
  bestAyushTime,
  onContinue,
  onRetry,
  onMainMenu,
}) => {
  const isAyushFight = outcome.opponentId === 'ayush' || outcome.result === 'SURVIVED_FINAL';
  const isWin = outcome.result === 'VICTORY';
  const isDefeat = outcome.result === 'DEFEAT';

  // Ayush survival tier evaluation
  const getSurvivalTier = (seconds: number) => {
    if (seconds >= 60) return { title: 'Legendary Survivor', color: 'text-amber-300', badge: 'Mythic' };
    if (seconds >= 45) return { title: 'Grand Duelist', color: 'text-purple-300', badge: 'Diamond' };
    if (seconds >= 30) return { title: 'Master of Evasion', color: 'text-cyan-300', badge: 'Gold' };
    if (seconds >= 15) return { title: 'Blade Adept', color: 'text-emerald-300', badge: 'Silver' };
    return { title: 'Courageous Challenger', color: 'text-slate-300', badge: 'Bronze' };
  };

  const survivalTime = outcome.survivalTimeSeconds || 0;
  const tier = getSurvivalTier(survivalTime);
  const isNewRecord = isAyushFight && survivalTime > 0 && survivalTime >= bestAyushTime;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-6 md:p-8 border border-slate-700 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        {/* Outcome Header Banner */}
        <div className="text-center space-y-2">
          {isAyushFight ? (
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-950/80 border-2 border-purple-400 text-purple-300 shadow-xl shadow-purple-900/50 pulse-boss-glow">
                <ShieldAlert size={40} />
              </div>
              <div>
                <span className="text-xs font-bold text-purple-400 tracking-widest uppercase font-cinzel">The Final Trial Concludes</span>
                <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-300 to-purple-400 font-cinzel tracking-wider mt-1">
                  AYUSH REMAINS UNDEFEATED
                </h1>
                <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                  As foretold by the ancient code, the Sovereign's blade could not be broken. Your endurance against his boundless power is carved into history.
                </p>
              </div>
            </div>
          ) : isWin ? (
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400 text-emerald-300 shadow-xl shadow-emerald-900/50">
                <Trophy size={32} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-amber-400 font-cinzel tracking-wider">
                TRIAL CONQUERED!
              </h1>
              <p className="text-sm text-emerald-300 font-rajdhani font-semibold">
                {outcome.opponentName} has fallen before your blade.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-950/80 border-2 border-rose-500 text-rose-400 shadow-xl shadow-rose-900/50">
                <Skull size={32} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-rose-500 font-cinzel tracking-wider">
                FALLEN IN BATTLE
              </h1>
              <p className="text-sm text-slate-300 font-rajdhani">
                You were bested by {outcome.opponentName}. Sharpen your reflexes and try again.
              </p>
            </div>
          )}
        </div>

        {/* Survival Special Box (Ayush) */}
        {isAyushFight && (
          <div className="bg-gradient-to-b from-purple-900/30 to-slate-900/60 p-5 rounded-2xl border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="text-purple-400" size={20} />
                <span className="text-sm font-bold text-slate-200 uppercase font-rajdhani">Time Survived</span>
              </div>
              <div className="text-right">
                <span className="text-2xl md:text-3xl font-black text-purple-300 font-mono">
                  {survivalTime.toFixed(1)}s
                </span>
                {isNewRecord && (
                  <span className="ml-2 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase">
                    New Best!
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="text-amber-400" size={20} />
                <span className="text-sm font-bold text-slate-200 uppercase font-rajdhani">Survival Honor Rank</span>
              </div>
              <span className={`text-base font-black uppercase font-cinzel ${tier.color}`}>
                {tier.title}
              </span>
            </div>
          </div>
        )}

        {/* Combat Performance Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/70 p-3 rounded-xl border border-white/5 text-center">
            <span className="text-xs text-slate-400 uppercase font-bold">Damage Dealt</span>
            <div className="text-xl font-bold text-cyan-400 mt-1 font-mono">{outcome.damageDealt}</div>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl border border-white/5 text-center">
            <span className="text-xs text-slate-400 uppercase font-bold">Damage Taken</span>
            <div className="text-xl font-bold text-rose-400 mt-1 font-mono">{outcome.damageTaken}</div>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl border border-white/5 text-center">
            <span className="text-xs text-slate-400 uppercase font-bold">Hits Landed</span>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">{outcome.hitsLanded}</div>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl border border-white/5 text-center">
            <span className="text-xs text-slate-400 uppercase font-bold">Guards/Parries</span>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{outcome.parriesExecuted}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* Main button: Continue (if win and not level 5) */}
          {isWin && outcome.level < 5 && (
            <button
              onClick={() => {
                soundManager.playClick();
                onContinue();
              }}
              className="btn-primary flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2"
            >
              Next Opponent
              <ArrowRight size={18} />
            </button>
          )}

          {/* Retry Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onRetry();
            }}
            className={`${
              isAyushFight ? 'btn-boss flex-1' : isDefeat ? 'btn-primary flex-1' : 'btn-secondary flex-1'
            } py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2`}
          >
            <RotateCcw size={18} />
            {isAyushFight ? 'Retry Survival Challenge' : 'Retry Level'}
          </button>

          {/* Main Menu Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onMainMenu();
            }}
            className="btn-secondary px-6 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

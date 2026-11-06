import React from 'react';
import { OpponentConfig } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Swords, ShieldAlert, ArrowLeft, Lightbulb, MapPin, Skull } from 'lucide-react';

interface LevelIntroScreenProps {
  opponent: OpponentConfig;
  onStartFight: () => void;
  onBack: () => void;
}

export const LevelIntroScreen: React.FC<LevelIntroScreenProps> = ({ opponent, onStartFight, onBack }) => {
  const isAyush = opponent.isUnbeatableBoss;

  return (
    <div className="relative w-full h-full min-h-screen flex items-center justify-center p-4 md:p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-y-auto">
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: isAyush
            ? 'radial-gradient(circle at center, #9333ea 0%, transparent 70%)'
            : 'radial-gradient(circle at center, #2563eb 0%, transparent 70%)',
        }}
      />

      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 md:p-10 border border-slate-700 shadow-2xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Navigation & Stage Label */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <button
            onClick={() => {
              soundManager.playClick();
              onBack();
            }}
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Select
          </button>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-black px-3 py-1 rounded-full border uppercase tracking-wider font-cinzel ${
                isAyush
                  ? 'bg-purple-950 text-purple-300 border-purple-500/60 shadow-lg shadow-purple-900/50'
                  : 'bg-blue-950 text-blue-300 border-blue-500/50'
              }`}
            >
              Trial {opponent.levelNumber} of 5
            </span>
          </div>
        </div>

        {/* Opponent Profile Title & Arena */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400 font-bold uppercase tracking-wider">
            <MapPin size={16} className={isAyush ? 'text-purple-400' : 'text-cyan-400'} />
            <span>Arena: {opponent.arenaName}</span>
          </div>

          <h1
            className={`text-4xl md:text-5xl font-black font-cinzel tracking-wider ${
              isAyush
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-400 to-purple-200'
                : 'text-white'
            }`}
          >
            {opponent.name}
          </h1>

          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-amber-400 font-cinzel">{opponent.title}</span>
            <span className="text-slate-600">•</span>
            <span className="text-sm text-slate-400 italic">{opponent.subtitle}</span>
          </div>
        </div>

        {/* Warning Badge for Ayush */}
        {isAyush && (
          <div className="bg-purple-950/70 border border-purple-500/60 p-4 rounded-2xl flex items-start gap-3 shadow-lg shadow-purple-950/50 pulse-boss-glow">
            <ShieldAlert size={28} className="text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-black text-purple-300 font-cinzel tracking-wider uppercase">
                Final Survival Challenge
              </div>
              <div className="text-xs text-slate-200 mt-1 leading-relaxed">
                Ayush is the Supreme Sovereign of the Trials and <b>cannot be defeated</b>. He will not succumb to damage. Your objective is pure <b>endurance</b> — survive the storm as long as your skills allow!
              </div>
            </div>
          </div>
        )}

        {/* Lore / Story Description */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-rajdhani">
            {opponent.description}
          </p>
        </div>

        {/* Tactical Tips */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider font-cinzel">
            <Lightbulb size={16} />
            <span>Tactical Advice</span>
          </div>
          <ul className="space-y-2 text-xs md:text-sm text-slate-300">
            {opponent.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Start Fight Action Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onStartFight();
            }}
            className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-transform ${
              isAyush ? 'btn-boss' : 'btn-primary'
            }`}
          >
            {isAyush ? <Skull size={24} /> : <Swords size={24} />}
            <span>{isAyush ? 'ENTER THE FINAL SURVIVAL' : 'START FIGHT'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

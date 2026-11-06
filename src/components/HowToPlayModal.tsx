import React from 'react';
import { X, Shield, Zap, Sparkles, Swords, AlertTriangle, Wind } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 md:p-8 relative border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-amber-400 font-cinzel tracking-wider flex items-center gap-2">
              <Swords className="text-amber-400" />
              Blade Trials Combat Codex
            </h2>
            <p className="text-sm text-slate-400 font-rajdhani">Master the ancient arts of the blade</p>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-6">
          {/* Controls table */}
          <div>
            <h3 className="text-lg font-bold text-white font-cinzel mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Warrior Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                <span className="text-slate-300">Move / Navigate</span>
                <span className="font-mono bg-slate-800 text-cyan-300 px-2.5 py-1 rounded border border-cyan-500/30">WASD or Arrows</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                <span className="text-slate-300">Sprint / Run</span>
                <span className="font-mono bg-slate-800 text-amber-300 px-2.5 py-1 rounded border border-amber-500/30">Shift</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                <span className="text-slate-300">Evasive Dodge (i-frames)</span>
                <span className="font-mono bg-slate-800 text-emerald-300 px-2.5 py-1 rounded border border-emerald-500/30">Space</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                <span className="text-slate-300">Quick Attack</span>
                <span className="font-mono bg-slate-800 text-rose-300 px-2.5 py-1 rounded border border-rose-500/30">J</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                <span className="text-slate-300">Heavy Attack (Guard Break)</span>
                <span className="font-mono bg-slate-800 text-orange-300 px-2.5 py-1 rounded border border-orange-500/30">K</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                <span className="text-slate-300">Defensive Guard (Block)</span>
                <span className="font-mono bg-slate-800 text-blue-300 px-2.5 py-1 rounded border border-blue-500/30">L (Hold)</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 flex items-center justify-between sm:col-span-2">
                <span className="text-slate-300">Pause Match</span>
                <span className="font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-white/20">Escape</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 italic">
              * On mobile or touch devices, an on-screen analog joystick and dedicated combat buttons will automatically appear.
            </p>
          </div>

          {/* Combat Tactics & Rules */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white font-cinzel mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Combat Mechanics & Tactics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-900/70 p-4 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <Zap size={18} />
                  <span>Guard Breaking</span>
                </div>
                <p className="text-xs text-slate-300">
                  Heavy opponents like Harsh will block regular strikes. Unleash a slow <b>Strong Attack (K)</b> to shatter their guard and leave them vulnerable.
                </p>
              </div>

              <div className="bg-slate-900/70 p-4 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-yellow-400 font-bold">
                  <AlertTriangle size={18} />
                  <span>Attack Telegraphs</span>
                </div>
                <p className="text-xs text-slate-300">
                  Opponents telegraph attacks with glowing signals above their heads:
                  <br />• <span className="text-yellow-400 font-semibold">Yellow:</span> Quick slash (Block or Dodge)
                  <br />• <span className="text-red-400 font-semibold">Red:</span> Guard crusher (Must Dodge!)
                  <br />• <span className="text-purple-400 font-semibold">Purple:</span> Void slash (Ayush only)
                </p>
              </div>

              <div className="bg-slate-900/70 p-4 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Wind size={18} />
                  <span>Stamina Flow</span>
                </div>
                <p className="text-xs text-slate-300">
                  Attacking, blocking, and dodging consume your green stamina gauge. If depleted, your guard will easily break and you will be unable to dodge.
                </p>
              </div>
            </div>
          </div>

          {/* Opponent Order & The Final Boss */}
          <div className="bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-purple-950/40 p-4 rounded-xl border border-purple-500/30">
            <h4 className="text-base font-bold text-purple-300 font-cinzel mb-1 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              The Five Opponents & The Unconquered Ayush
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              You must challenge the warriors in sequence: <b>1. Shashwat → 2. Aditya → 3. Harsh → 4. Shreyansh → 5. Ayush</b>.
              <br /><br />
              <strong className="text-purple-300">The Final Trial (Ayush):</strong> Ayush is the supreme blade master and is <i>unbeatable by design</i>. His dark aegis deflects all mortal blows. Your ultimate mission in Trial V is <b>survival</b>: test your dodges, reflexes, and willpower to endure as long as possible before the inevitable fall.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="btn-primary px-6 py-2.5 rounded-xl font-bold text-sm"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

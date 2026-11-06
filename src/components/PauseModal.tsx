import React, { useState } from 'react';
import { Play, RotateCcw, BookOpen, Volume2, VolumeX, Home } from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { HowToPlayModal } from './HowToPlayModal';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, onMainMenu }) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const handleToggleSound = () => {
    soundManager.playClick();
    const next = !isMuted;
    soundManager.setMuted(next);
    setIsMuted(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      <div className="glass-panel w-full max-w-md rounded-2xl p-6 md:p-8 border border-slate-700 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white font-cinzel tracking-widest">
            TRIAL PAUSED
          </h2>
          <p className="text-xs text-slate-400 font-rajdhani uppercase tracking-wider">
            Catch your breath, warrior
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="btn-primary w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2"
          >
            <Play size={18} />
            Resume Fight
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onRestart();
            }}
            className="btn-secondary w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Restart Level
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setShowHowToPlay(true);
            }}
            className="btn-secondary w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2"
          >
            <BookOpen size={18} />
            Controls & Guide
          </button>

          <button
            onClick={handleToggleSound}
            className="btn-secondary w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2"
          >
            {isMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-emerald-400" />}
            {isMuted ? 'Unmute Audio' : 'Mute Audio'}
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onMainMenu();
            }}
            className="w-full py-3 rounded-xl font-bold text-base text-rose-300 hover:text-white hover:bg-rose-950/40 border border-rose-900/40 transition-colors flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Exit to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

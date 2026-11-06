import React, { useRef, useState, useEffect } from 'react';
import { Shield, Zap, Sparkles, Wind } from 'lucide-react';

interface TouchControlsProps {
  onMovement: (x: number, z: number) => void;
  onAction: (action: 'quick' | 'heavy' | 'dodge' | 'blockStart' | 'blockEnd' | 'sprintToggle') => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onMovement, onAction }) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [isSprintActive, setIsSprintActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const JOYSTICK_RADIUS = 46;

  // Touch joystick handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsJoystickActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsJoystickActive(false);
        setKnobPos({ x: 0, y: 0 });
        onMovement(0, 0);
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const clampedDist = Math.min(distance, JOYSTICK_RADIUS);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: knobX, y: knobY });

    // Normalized vector: X is horizontal, Z is vertical (forward/back in 3D world)
    const normX = knobX / JOYSTICK_RADIUS;
    const normZ = knobY / JOYSTICK_RADIUS;
    onMovement(normX, normZ);
  };

  const handleSprintToggle = () => {
    setIsSprintActive((prev) => {
      const next = !prev;
      onAction('sprintToggle');
      return next;
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex justify-between items-end p-4 md:p-8">
      {/* Left Joystick Area */}
      <div className="pointer-events-auto relative flex flex-col items-center">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="w-32 h-32 rounded-full border-2 border-white/20 bg-slate-900/40 backdrop-blur-sm relative flex items-center justify-center active:border-cyan-400/60"
          style={{ touchAction: 'none' }}
        >
          {/* Base Rings */}
          <div className="w-16 h-16 rounded-full border border-white/10" />
          {/* Knob */}
          <div
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-400 border-2 border-white/80 shadow-lg shadow-cyan-500/40 absolute flex items-center justify-center transition-transform"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              transition: isJoystickActive ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div className="w-4 h-4 rounded-full bg-white/60" />
          </div>
        </div>
        <span className="text-xs text-white/50 font-bold tracking-wider mt-2 uppercase font-rajdhani">Move</span>
      </div>

      {/* Right Action Buttons */}
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {/* Top auxiliary row: Sprint & Block */}
        <div className="flex gap-3">
          {/* Sprint Toggle */}
          <button
            onClick={handleSprintToggle}
            className={`w-14 h-14 rounded-full border flex flex-col items-center justify-center shadow-md active:scale-95 transition-all ${
              isSprintActive
                ? 'bg-amber-600 border-amber-300 text-white shadow-amber-500/50'
                : 'bg-slate-800/80 border-white/20 text-slate-300'
            }`}
          >
            <Wind size={20} />
            <span className="text-[10px] font-bold uppercase">Run</span>
          </button>

          {/* Block (Hold button) */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onAction('blockStart');
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onAction('blockEnd');
            }}
            onMouseDown={() => onAction('blockStart')}
            onMouseUp={() => onAction('blockEnd')}
            className="w-14 h-14 rounded-full bg-slate-800/80 border border-blue-400/50 text-blue-300 flex flex-col items-center justify-center shadow-md active:bg-blue-600 active:text-white active:scale-95 transition-all"
          >
            <Shield size={20} />
            <span className="text-[10px] font-bold uppercase">Block</span>
          </button>
        </div>

        {/* Main combat buttons row */}
        <div className="flex gap-3 items-end">
          {/* Dodge */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onAction('dodge');
            }}
            onClick={() => onAction('dodge')}
            className="w-16 h-16 rounded-full bg-emerald-700/80 border border-emerald-400/60 text-emerald-100 flex flex-col items-center justify-center shadow-lg shadow-emerald-900/40 active:scale-90 active:bg-emerald-500 transition-all"
          >
            <Sparkles size={22} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Dodge</span>
          </button>

          {/* Heavy Attack */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onAction('heavy');
            }}
            onClick={() => onAction('heavy')}
            className="w-16 h-16 rounded-full bg-orange-700/80 border border-orange-400/60 text-orange-100 flex flex-col items-center justify-center shadow-lg shadow-orange-900/40 active:scale-90 active:bg-orange-500 transition-all"
          >
            <Zap size={22} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Heavy (K)</span>
          </button>

          {/* Quick Attack (Primary large button) */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onAction('quick');
            }}
            onClick={() => onAction('quick')}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-700 to-red-500 border-2 border-red-300 text-white flex flex-col items-center justify-center shadow-xl shadow-red-600/40 active:scale-90 transition-all"
          >
            <span className="text-xl font-extrabold font-cinzel">⚔️</span>
            <span className="text-xs font-bold uppercase tracking-wider">Quick (J)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

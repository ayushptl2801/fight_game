import React, { useState, useEffect } from 'react';
import { GameScreen, FightOutcome, GameSaveData } from './types/game';
import { OPPONENTS } from './game/opponents';
import { TitleScreen } from './components/TitleScreen';
import { LevelIntroScreen } from './components/LevelIntroScreen';
import { FightScreen } from './components/FightScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { HowToPlayModal } from './components/HowToPlayModal';

const SAVE_STORAGE_KEY = 'blade_trials_save_v1';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [fightOutcome, setFightOutcome] = useState<FightOutcome | null>(null);

  // Persistent save data
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [levelsCompleted, setLevelsCompleted] = useState<number[]>([]);
  const [bestAyushTime, setBestAyushTime] = useState<number>(0);

  // Load saved progress on mount
  useEffect(() => {
    try {
      const savedStr = localStorage.getItem(SAVE_STORAGE_KEY);
      if (savedStr) {
        const data: GameSaveData = JSON.parse(savedStr);
        if (data.unlockedLevel) setUnlockedLevel(Math.min(5, Math.max(1, data.unlockedLevel)));
        if (Array.isArray(data.levelsCompleted)) setLevelsCompleted(data.levelsCompleted);
        if (typeof data.ayushBestSurvivalTime === 'number') setBestAyushTime(data.ayushBestSurvivalTime);
      }
    } catch (e) {
      console.warn('Failed to read save data:', e);
    }
  }, []);

  // Save progress helper
  const saveProgress = (newUnlocked: number, completed: number[], ayushTime: number) => {
    try {
      const data: GameSaveData = {
        unlockedLevel: newUnlocked,
        levelsCompleted: completed,
        ayushBestSurvivalTime: ayushTime,
        soundEnabled: true,
        musicVolume: 0.5,
        sfxVolume: 0.7,
      };
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  };

  const handleSelectLevel = (levelNum: number) => {
    setSelectedLevel(levelNum);
    setScreen('LEVEL_INTRO');
  };

  const handleStartFight = () => {
    setScreen('FIGHT');
  };

  const handleFightFinished = (outcome: FightOutcome) => {
    setFightOutcome(outcome);

    if (outcome.result === 'VICTORY') {
      // Completed level 1, 2, 3, or 4
      const nextUnlocked = Math.min(5, Math.max(unlockedLevel, outcome.level + 1));
      const nextCompleted = Array.from(new Set([...levelsCompleted, outcome.level]));

      setUnlockedLevel(nextUnlocked);
      setLevelsCompleted(nextCompleted);
      saveProgress(nextUnlocked, nextCompleted, bestAyushTime);
    } else if (outcome.result === 'SURVIVED_FINAL') {
      // Ayush Survival Challenge ended
      const time = outcome.survivalTimeSeconds || 0;
      let newBest = bestAyushTime;
      if (time > bestAyushTime) {
        newBest = time;
        setBestAyushTime(time);
      }
      saveProgress(unlockedLevel, levelsCompleted, newBest);
    }

    setScreen('RESULTS');
  };

  const handleContinueNextLevel = () => {
    if (selectedLevel < 5) {
      setSelectedLevel(selectedLevel + 1);
      setScreen('LEVEL_INTRO');
    } else {
      setScreen('TITLE');
    }
  };

  const handleRetry = () => {
    setScreen('FIGHT');
  };

  const handleResetProgress = () => {
    setUnlockedLevel(1);
    setLevelsCompleted([]);
    setBestAyushTime(0);
    localStorage.removeItem(SAVE_STORAGE_KEY);
  };

  const currentOpponent = OPPONENTS.find((o) => o.levelNumber === selectedLevel) || OPPONENTS[0];

  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950 font-rajdhani text-white">
      {screen === 'TITLE' && (
        <TitleScreen
          unlockedLevel={unlockedLevel}
          levelsCompleted={levelsCompleted}
          bestAyushTime={bestAyushTime}
          onSelectLevel={handleSelectLevel}
          onResetProgress={handleResetProgress}
        />
      )}

      {screen === 'HOW_TO_PLAY' && (
        <HowToPlayModal onClose={() => setScreen('TITLE')} />
      )}

      {screen === 'LEVEL_INTRO' && (
        <LevelIntroScreen
          opponent={currentOpponent}
          onStartFight={handleStartFight}
          onBack={() => setScreen('TITLE')}
        />
      )}

      {screen === 'FIGHT' && (
        <FightScreen
          opponent={currentOpponent}
          onFinishFight={handleFightFinished}
          onExitToMenu={() => setScreen('TITLE')}
          onRestartFight={handleRetry}
        />
      )}

      {screen === 'RESULTS' && fightOutcome && (
        <ResultsScreen
          outcome={fightOutcome}
          bestAyushTime={bestAyushTime}
          onContinue={handleContinueNextLevel}
          onRetry={handleRetry}
          onMainMenu={() => setScreen('TITLE')}
        />
      )}
    </main>
  );
};

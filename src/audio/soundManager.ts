// Procedural Web Audio API Sound and Music System
// Runs 100% locally with zero external network assets or file loading errors

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  // Music sequencing
  private currentStage: number = 0;
  private isMusicPlaying: boolean = false;
  private musicIntervalId: number | null = null;
  private noteIndex: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // ================= SFX =================

  public playClick() {
    this.init();
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playSwingLight() {
    this.init();
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    
    // Noise whoosh
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.06);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.12);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  public playSwingHeavy() {
    this.init();
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Deep whoosh + pitch drop
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);

    // Noise layer
    const bufferSize = this.ctx.sampleRate * 0.22;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.22);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);
  }

  public playHit() {
    this.init();
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Body impact thump
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);

    // Blade slice sound
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 4;

    const sliceGain = this.ctx.createGain();
    sliceGain.gain.setValueAtTime(0.5, now);
    sliceGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    noise.connect(filter);
    filter.connect(sliceGain);
    sliceGain.connect(this.sfxGain);

    noise.start(now);
  }

  public playBlock() {
    this.init();
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // High metal ring
    [1200, 1850, 2900].forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.36);
    });

    // Sharp clash snap
    const oscSnap = this.ctx.createOscillator();
    oscSnap.type = 'square';
    oscSnap.frequency.setValueAtTime(600, now);
    oscSnap.frequency.exponentialRampToValueAtTime(100, now + 0.04);
    const snapGain = this.ctx.createGain();
    snapGain.gain.setValueAtTime(0.4, now);
    snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    oscSnap.connect(snapGain);
    snapGain.connect(this.sfxGain);
    oscSnap.start(now);
    oscSnap.stop(now + 0.05);
  }

  public playDodge() {
    this.init();
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playTelegraphWarning() {
    this.init();
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  public playBossAura() {
    this.init();
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(45, now + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.61);
  }

  public playVictory() {
    this.init();
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const noteTime = now + idx * 0.12;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
  }

  public playDefeat() {
    this.init();
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [330, 311, 293, 220]; // Descending minor
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const noteTime = now + idx * 0.2;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.36);
    });
  }

  // ================= DYNAMIC BGM SYNTHESIZER =================

  public startStageMusic(levelNumber: number) {
    this.init();
    this.currentStage = levelNumber;
    this.stopMusic();
    this.isMusicPlaying = true;
    this.noteIndex = 0;

    // Tempo and scales tailored for each level
    const tempoMs = levelNumber === 5 ? 180 : levelNumber === 4 ? 200 : levelNumber === 3 ? 240 : 260;

    this.musicIntervalId = window.setInterval(() => {
      if (!this.isMusicPlaying || this.isMuted || !this.ctx || !this.musicGain) return;
      this.playMusicStep(levelNumber);
      this.noteIndex = (this.noteIndex + 1) % 16;
    }, tempoMs);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  private playMusicStep(level: number) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;

    // Level-specific scales and progressions
    // Level 1: Pentatonic Courtyard
    // Level 2: Forest Celtic Minor
    // Level 3: Stone March Phrygian
    // Level 4: Mountain Whirlwind Dorian
    // Level 5: Ayush Storm Dark Symphony (Heavy low drones, sinister diminished notes)

    let bassFreq = 110;
    let melodyFreq = 0;

    if (level === 1) {
      const bassNotes = [110, 110, 130.81, 146.83];
      bassFreq = bassNotes[Math.floor(this.noteIndex / 4) % bassNotes.length];
      const melodyNotes = [220, 261.63, 293.66, 329.63, 392.00, 440, 329.63, 293.66];
      if (this.noteIndex % 2 === 0) {
        melodyFreq = melodyNotes[this.noteIndex % melodyNotes.length];
      }
    } else if (level === 2) {
      const bassNotes = [98, 98, 116.54, 130.81];
      bassFreq = bassNotes[Math.floor(this.noteIndex / 4) % bassNotes.length];
      const melodyNotes = [196, 233.08, 261.63, 293.66, 349.23, 293.66, 261.63, 233.08];
      melodyFreq = melodyNotes[(this.noteIndex * 3) % melodyNotes.length];
    } else if (level === 3) {
      const bassNotes = [82.41, 82.41, 87.31, 73.42]; // E2, F2, D2
      bassFreq = bassNotes[Math.floor(this.noteIndex / 4) % bassNotes.length];
      const leadNotes = [164.81, 174.61, 196, 220, 174.61, 164.81];
      if (this.noteIndex % 2 === 1) {
        melodyFreq = leadNotes[this.noteIndex % leadNotes.length];
      }
    } else if (level === 4) {
      const bassNotes = [73.42, 87.31, 98, 110];
      bassFreq = bassNotes[Math.floor(this.noteIndex / 4) % bassNotes.length];
      const arps = [293.66, 349.23, 440, 523.25, 440, 349.23];
      melodyFreq = arps[this.noteIndex % arps.length];
    } else {
      // Level 5: AYUSH - Unbeatable Dark Lord theme
      const bassNotes = [55, 55, 58.27, 51.91]; // A1, Bb1, G#1 (Sinister)
      bassFreq = bassNotes[Math.floor(this.noteIndex / 4) % bassNotes.length];
      const sinisterLead = [220, 233.08, 311.13, 293.66, 370, 311.13, 233.08, 207.65];
      melodyFreq = sinisterLead[(this.noteIndex * 2) % sinisterLead.length];
    }

    // Play Bass pulse on beats 0, 4, 8, 12
    if (this.noteIndex % 4 === 0) {
      const bassOsc = this.ctx.createOscillator();
      bassOsc.type = level === 5 ? 'sawtooth' : 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(level === 5 ? 300 : 200, now);

      const bassGain = this.ctx.createGain();
      bassGain.gain.setValueAtTime(level === 5 ? 0.35 : 0.25, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + 0.36);
    }

    // Play Melody note if set
    if (melodyFreq > 0) {
      const melOsc = this.ctx.createOscillator();
      melOsc.type = level === 5 ? 'sawtooth' : level === 1 ? 'sine' : 'triangle';
      melOsc.frequency.setValueAtTime(melodyFreq, now);

      const melGain = this.ctx.createGain();
      melGain.gain.setValueAtTime(level === 5 ? 0.12 : 0.15, now);
      melGain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);

      melOsc.connect(melGain);
      melGain.connect(this.musicGain);

      melOsc.start(now);
      melOsc.stop(now + 0.23);
    }
  }
}

export const soundManager = new SoundManager();

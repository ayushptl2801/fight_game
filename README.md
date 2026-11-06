# Blade Trials ⚔️

An original, fast-paced browser-based 3D sword-fighting game built with **React**, **Three.js**, **TypeScript**, and **Vite**.

Face five formidable swordsmen in sequence, master timing, blocks, parries, and evasive dodges, and test your ultimate valor against the unbeatable sovereign, Ayush.

---

## 🎮 Playable Opponents & Arenas

The player faces five opponents in exact progression:

1. **Shashwat — *The Eager Novice***
   - **Arena:** *Training Courtyard* (Warm morning sunlight, cherry blossom petals, stone courtyard, wooden dummies)
   - **Style:** Textbook strikes and readable forms. Perfect for mastering movement, attack timing, and dodges.

2. **Aditya — *The Crimson Blader***
   - **Arena:** *Forest Clearing* (Mossy boulders, towering pines, floating firefly particles)
   - **Style:** Aggressive duelist who closes distance quickly and chains rapid slashes.

3. **Harsh — *The Iron Bastion***
   - **Arena:** *Ancient Stone Arena* (Gladiator colosseum ruins, cracked stone, fiery braziers)
   - **Style:** Heavily armored powerhouse who frequently blocks standard attacks. Punishes mistakes with guard-crushing overhead slams (must dodge!).

4. **Shreyansh — *The Phantom Duelist***
   - **Arena:** *Frozen Mountain Platform* (Floating ice crag, howling blizzard winds, glowing cyan crystals)
   - **Style:** Blinding agility, sidestep dodges, and lightning-fast thrusts.

5. **Ayush — *The Unconquered Sovereign (Final Boss)***
   - **Arena:** *Storm-lit Final Arena* (Floating obsidian monolith, runic sigils, storm sparks, crackling lightning flashes)
   - **Style:** Wreathed in dark void energy with a colossal purple broadsword. Performs instant void dashes, teleport slashes, and shockwaves.
   - **Unbeatable by Design:** Ayush cannot be slain; his dark aegis deflects all mortal blows. The trial is a **Survival Challenge** to test how long you can endure his wrath. Surviving awards an honorable rank based on your survival time.

---

## 🕹️ Controls

### Keyboard & Mouse
- **Move:** `WASD` or **Arrow Keys**
- **Run / Sprint:** `Shift` (drains stamina)
- **Evasive Dodge (i-frames):** `Space`
- **Quick Attack:** `J`
- **Strong Attack (Guard Breaker):** `K`
- **Block / Guard:** `L` (Hold)
- **Pause Match:** `Escape`

### Mobile & Touchscreen
- **Movement:** Left virtual analog touch joystick
- **Combat Actions:** Right on-screen buttons for *Quick (J)*, *Heavy (K)*, *Dodge (Space)*, *Block (L)*, and *Run (Shift)*.

---

## ⚔️ Combat Mechanics

- **Guard Breaking:** Heavy opponents like Harsh block light attacks. Use **K (Strong Attack)** to shatter their guard.
- **Telegraph Alerts:** Opponents signal attacks with overhead indicators and HUD warnings:
  - 🟡 **Yellow:** Quick attack (Block or Dodge)
  - 🔴 **Red:** Heavy strike (Dodge recommended — will crush your guard!)
  - 🟣 **Purple:** Unblockable void attack (Ayush only — must Dodge!)
- **Stamina System:** Attacking, sprinting, and dodging consume stamina. Stamina regenerates when not performing actions.
- **Dynamic Procedural Audio:** Synthesized Web Audio API soundtrack and SFX (whooshes, metallic clashes, parries, hit thuds, and victory fanfares) with zero remote file dependencies.
- **Local Save System:** Unlocked levels and Ayush survival high scores automatically save to the browser's `localStorage`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/ayushptl2801/fight_game.git

# Navigate to project folder
cd fight_game

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack
- **Framework:** React 18
- **3D Graphics:** Three.js
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom Dark Martial Arts CSS
- **Audio:** Web Audio API (Procedural Synthesizer & SFX)
- **Build Tool:** Vite
- **Icons:** Lucide React

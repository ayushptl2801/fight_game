import * as THREE from 'three';
import { Character3D } from './character';
import { createArena, ArenaEnvironment } from './arena';
import { ParticleSystem } from './particles';
import { OpponentConfig, FightOutcome, ActionType } from '../types/game';
import { soundManager } from '../audio/soundManager';

export interface CombatHUDState {
  playerHp: number;
  playerMaxHp: number;
  playerStamina: number;
  playerMaxStamina: number;
  opponentHp: number;
  opponentMaxHp: number;
  opponentName: string;
  opponentTitle: string;
  isAyush: boolean;
  survivalTime: number;
  telegraph: {
    active: boolean;
    type: 'light' | 'heavy' | 'unblockable';
    progress: number;
  };
  combatLog: string[];
  floatingTexts: { id: number; text: string; color: string; x: number; y: number }[];
}

export class CombatEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private arenaEnv: ArenaEnvironment | null = null;
  private particles: ParticleSystem;

  // Characters
  public player: Character3D;
  public opponent: Character3D;
  public config: OpponentConfig;

  // Lights
  private dirLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;

  // Combat Stats
  private playerHp: number = 100;
  private readonly playerMaxHp: number = 100;
  private playerStamina: number = 100;
  private readonly playerMaxStamina: number = 100;
  private opponentHp: number = 100;
  private opponentMaxHp: number = 100;

  // Stats for results
  private damageDealt: number = 0;
  private damageTaken: number = 0;
  private hitsLanded: number = 0;
  private parriesExecuted: number = 0;
  private survivalTimer: number = 0;

  // Opponent AI State
  private opponentAiTimer: number = 0;
  private opponentNextActionTime: number = 1.5;
  private isOpponentTelegraphing: boolean = false;
  private telegraphTimer: number = 0;
  private telegraphDuration: number = 0.8;
  private pendingAttackType: 'light' | 'heavy' | 'unblockable' = 'light';
  private opponentTelegraphMesh!: THREE.Mesh;

  // Inputs
  private keysPressed: { [key: string]: boolean } = {};
  private keyJustPressed: { [key: string]: boolean } = {};
  private virtualMovement = { x: 0, z: 0 };
  private virtualActions = {
    quickAttack: false,
    heavyAttack: false,
    dodge: false,
    block: false,
    sprint: false,
  };

  // State
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isEnded: boolean = false;
  private onEndCallback: (outcome: FightOutcome) => void;
  private onHUDUpdateCallback: (state: CombatHUDState) => void;

  // Camera tracking & shake
  private cameraShakeIntensity: number = 0;
  private cameraBasePos = new THREE.Vector3(0, 5, 11);
  private cameraLookTarget = new THREE.Vector3(0, 1.2, 0);

  // Floating Damage numbers
  private floatingTexts: { id: number; text: string; color: string; pos: THREE.Vector3; life: number }[] = [];
  private nextTextId: number = 1;
  private combatLogs: string[] = [];

  // Hit cooldowns
  private playerAttackCooldown: number = 0;
  private opponentAttackCooldown: number = 0;

  constructor(
    container: HTMLElement,
    opponentConfig: OpponentConfig,
    onHUDUpdate: (state: CombatHUDState) => void,
    onEnd: (outcome: FightOutcome) => void
  ) {
    this.container = container;
    this.config = opponentConfig;
    this.onHUDUpdateCallback = onHUDUpdate;
    this.onEndCallback = onEnd;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 100);
    this.camera.position.set(0, 5.5, 12);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.position.set(12, 20, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 40;
    this.dirLight.shadow.camera.left = -15;
    this.dirLight.shadow.camera.right = 15;
    this.dirLight.shadow.camera.top = 15;
    this.dirLight.shadow.camera.bottom = -15;
    this.scene.add(this.dirLight);

    // 4. Particles
    this.particles = new ParticleSystem(this.scene);

    // 5. Arena
    this.arenaEnv = createArena(this.config.arenaType, this.scene);

    // 6. Characters
    // Player
    this.player = new Character3D({
      isPlayer: true,
      name: 'Player',
      colors: {
        primary: 0x1e3a8a, // Cobalt blue armor
        secondary: 0xf59e0b, // Amber gold trim
        skin: 0xf3c59a,
        hair: 0x1f2937,
        blade: 0xe2e8f0,
        bladeGlow: 0x38bdf8,
        trailColor: 0x0284c7,
      },
    });
    this.player.group.position.set(0, 0, 4);
    this.player.facingAngle = Math.PI; // Face north
    this.scene.add(this.player.group);

    // Opponent
    this.opponent = new Character3D({
      isPlayer: false,
      name: this.config.name,
      colors: this.config.colors,
      isBoss: !!this.config.isUnbeatableBoss,
    });
    this.opponent.group.position.set(0, 0, -4);
    this.opponent.facingAngle = 0; // Face south
    this.scene.add(this.opponent.group);

    // Opponent Telegraph Ring / Icon
    const ringGeo = new THREE.RingGeometry(0.35, 0.55, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffeb3b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.opponentTelegraphMesh = new THREE.Mesh(ringGeo, ringMat);
    this.opponentTelegraphMesh.rotation.x = -Math.PI / 2;
    this.opponentTelegraphMesh.position.y = 2.4;
    this.opponent.group.add(this.opponentTelegraphMesh);

    // Initialize stats
    this.opponentHp = this.config.maxHp;
    this.opponentMaxHp = this.config.maxHp;

    // Bind event listeners
    this.setupListeners();

    // Start Sound
    soundManager.startStageMusic(this.config.levelNumber);
  }

  private setupListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (!this.keysPressed[key]) {
      this.keyJustPressed[key] = true;
    }
    this.keysPressed[key] = true;

    // Prevent scrolling for game controls
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.keysPressed[key] = false;
  };

  private handleResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public setVirtualMovement(x: number, z: number) {
    this.virtualMovement = { x, z };
  }

  public triggerVirtualAction(action: 'quick' | 'heavy' | 'dodge' | 'blockStart' | 'blockEnd' | 'sprintToggle') {
    if (action === 'quick') this.virtualActions.quickAttack = true;
    if (action === 'heavy') this.virtualActions.heavyAttack = true;
    if (action === 'dodge') this.virtualActions.dodge = true;
    if (action === 'blockStart') this.virtualActions.block = true;
    if (action === 'blockEnd') this.virtualActions.block = false;
    if (action === 'sprintToggle') this.virtualActions.sprint = !this.virtualActions.sprint;
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    soundManager.resume();
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    let lastTime = performance.now();

    const loop = (now: number) => {
      if (!this.isRunning) return;
      requestAnimationFrame(loop);

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (!this.isPaused) {
        this.update(delta);
      }
      this.render();
    };

    requestAnimationFrame(loop);
  }

  private update(delta: number) {
    if (this.isEnded) {
      this.player.update(delta);
      this.opponent.update(delta);
      this.particles.update(delta);
      if (this.arenaEnv) this.arenaEnv.update(delta);
      return;
    }

    if (this.config.isUnbeatableBoss) {
      this.survivalTimer += delta;
    }

    // Stamina regeneration
    if (this.player.currentAction !== 'RUN' && this.player.currentAction !== 'BLOCK') {
      this.playerStamina = Math.min(this.playerMaxStamina, this.playerStamina + delta * 24);
    }

    // Cooldown ticks
    if (this.playerAttackCooldown > 0) this.playerAttackCooldown -= delta;
    if (this.opponentAttackCooldown > 0) this.opponentAttackCooldown -= delta;

    // Process inputs
    this.handlePlayerInput(delta);

    // Process Opponent AI
    this.handleOpponentAI(delta);

    // Boundaries check
    this.enforceArenaBoundaries(this.player.group.position, 13);
    this.enforceArenaBoundaries(this.opponent.group.position, 13);

    // Update animations and particles
    this.player.update(delta);
    this.opponent.update(delta);
    this.particles.update(delta);
    if (this.arenaEnv) this.arenaEnv.update(delta);

    // Floating combat text updates
    this.updateFloatingTexts(delta);

    // Dynamic Camera Tracking
    this.updateCamera(delta);

    // Dispatch HUD update
    this.broadcastHUD();

    // Reset single-frame keys
    this.keyJustPressed = {};
    this.virtualActions.quickAttack = false;
    this.virtualActions.heavyAttack = false;
    this.virtualActions.dodge = false;
  }

  private handlePlayerInput(delta: number) {
    if (this.player.currentAction === 'DEAD' || this.player.currentAction === 'HIT') return;

    // Determine movement direction
    let moveX = 0;
    let moveZ = 0;

    if (this.keysPressed['w'] || this.keysPressed['arrowup']) moveZ -= 1;
    if (this.keysPressed['s'] || this.keysPressed['arrowdown']) moveZ += 1;
    if (this.keysPressed['a'] || this.keysPressed['arrowleft']) moveX -= 1;
    if (this.keysPressed['d'] || this.keysPressed['arrowright']) moveX += 1;

    // Virtual stick input
    if (this.virtualMovement.x !== 0 || this.virtualMovement.z !== 0) {
      moveX += this.virtualMovement.x;
      moveZ += this.virtualMovement.z;
    }

    const isMoving = moveX !== 0 || moveZ !== 0;
    const isSprinting = (this.keysPressed['shift'] || this.virtualActions.sprint) && this.playerStamina > 10;

    // Dodge action (Space or Virtual Dodge)
    const wantsDodge = (this.keyJustPressed[' '] || this.virtualActions.dodge) && this.playerStamina >= 20;
    if (wantsDodge && this.player.currentAction !== 'DODGE') {
      this.playerStamina -= 20;
      this.player.setAction('DODGE', 0.45);
      soundManager.playDodge();
      this.particles.emitDust(this.player.group.position, 8);

      // Dash in current move direction or backwards from opponent
      const dir = isMoving
        ? new THREE.Vector2(moveX, moveZ).normalize()
        : new THREE.Vector2(
            this.player.group.position.x - this.opponent.group.position.x,
            this.player.group.position.z - this.opponent.group.position.z
          ).normalize();

      this.player.velocity.set(dir.x * 12, 0, dir.y * 12);
      return;
    }

    // Quick Attack (J or Virtual Quick)
    const wantsQuick = (this.keyJustPressed['j'] || this.virtualActions.quickAttack) && this.playerAttackCooldown <= 0;
    if (wantsQuick && this.player.currentAction !== 'DODGE' && this.playerStamina >= 14) {
      this.playerStamina -= 14;
      this.playerAttackCooldown = 0.42;
      this.player.setAction('ATTACK_LIGHT', 0.42);
      soundManager.playSwingLight();

      // Face opponent
      this.faceTarget(this.player, this.opponent);

      // Check hit during active window
      setTimeout(() => this.checkPlayerAttackHit('light'), 160);
      return;
    }

    // Strong Attack (K or Virtual Heavy)
    const wantsHeavy = (this.keyJustPressed['k'] || this.virtualActions.heavyAttack) && this.playerAttackCooldown <= 0;
    if (wantsHeavy && this.player.currentAction !== 'DODGE' && this.playerStamina >= 28) {
      this.playerStamina -= 28;
      this.playerAttackCooldown = 0.75;
      this.player.setAction('ATTACK_HEAVY', 0.75);
      soundManager.playSwingHeavy();

      // Face opponent
      this.faceTarget(this.player, this.opponent);

      // Check hit during active window
      setTimeout(() => this.checkPlayerAttackHit('heavy'), 360);
      return;
    }

    // Block (Hold L or Hold Virtual Block)
    const wantsBlock = (this.keysPressed['l'] || this.virtualActions.block) && this.playerStamina > 5;
    if (wantsBlock && this.player.currentAction !== 'ATTACK_LIGHT' && this.player.currentAction !== 'ATTACK_HEAVY' && this.player.currentAction !== 'DODGE') {
      if (this.player.currentAction !== 'BLOCK') {
        this.player.setAction('BLOCK', 0);
      }
      this.faceTarget(this.player, this.opponent);
      return;
    } else if (this.player.currentAction === 'BLOCK' && !wantsBlock) {
      this.player.setAction('IDLE');
    }

    // Movement execution
    if (this.player.currentAction === 'DODGE') {
      this.player.group.position.x += this.player.velocity.x * delta;
      this.player.group.position.z += this.player.velocity.z * delta;
      this.player.velocity.multiplyScalar(0.92);
    } else if (isMoving && this.player.currentAction !== 'ATTACK_LIGHT' && this.player.currentAction !== 'ATTACK_HEAVY') {
      const speed = isSprinting ? 6.5 : 4.2;
      if (isSprinting) {
        this.playerStamina = Math.max(0, this.playerStamina - delta * 12);
      }

      const inputVector = new THREE.Vector2(moveX, moveZ).normalize();
      this.player.group.position.x += inputVector.x * speed * delta;
      this.player.group.position.z += inputVector.y * speed * delta;

      // Rotate toward movement direction
      const targetAngle = Math.atan2(inputVector.x, inputVector.y);
      this.player.facingAngle = targetAngle;

      if (this.player.currentAction !== 'RUN') {
        this.player.setAction('RUN', 0);
      }
    } else if (this.player.currentAction === 'RUN') {
      this.player.setAction('IDLE');
    }
  }

  private handleOpponentAI(delta: number) {
    if (this.opponent.currentAction === 'DEAD' || this.opponent.currentAction === 'HIT') {
      this.opponentTelegraphMesh.visible = false;
      return;
    }

    const distToPlayer = this.player.group.position.distanceTo(this.opponent.group.position);
    this.faceTarget(this.opponent, this.player);

    // Handle active telegraph
    if (this.isOpponentTelegraphing) {
      this.telegraphTimer += delta;
      const progress = Math.min(1, this.telegraphTimer / this.telegraphDuration);

      // Visual warning above head
      this.opponentTelegraphMesh.visible = true;
      const mat = this.opponentTelegraphMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + progress * 0.5;
      mat.color.setHex(this.pendingAttackType === 'heavy' ? 0xff1744 : this.pendingAttackType === 'unblockable' ? 0xd500f9 : 0xffea00);
      this.opponentTelegraphMesh.scale.set(1 + progress * 0.8, 1 + progress * 0.8, 1);

      if (this.telegraphTimer >= this.telegraphDuration) {
        this.isOpponentTelegraphing = false;
        this.opponentTelegraphMesh.visible = false;
        this.executeOpponentAttack(this.pendingAttackType);
      }
      return;
    }

    this.opponentTelegraphMesh.visible = false;
    this.opponentAiTimer += delta;

    // AI Decision Making
    if (this.opponentAiTimer >= this.opponentNextActionTime && this.opponentAttackCooldown <= 0) {
      this.opponentAiTimer = 0;
      this.opponentNextActionTime = this.config.attackInterval * (0.8 + Math.random() * 0.4);

      // In attack range (~2.5 units)
      if (distToPlayer <= 3.0) {
        // Attack decision
        this.startOpponentTelegraph();
      } else {
        // In Ayush's case, he can also dash-strike or teleport forward
        if (this.config.isUnbeatableBoss && Math.random() < 0.45) {
          this.executeAyushVoidDash();
        }
      }
    }

    // Navigation toward player
    if (this.opponent.currentAction !== 'ATTACK_LIGHT' && this.opponent.currentAction !== 'ATTACK_HEAVY' && this.opponent.currentAction !== 'DODGE') {
      if (distToPlayer > 2.2) {
        // Move closer
        const dir = new THREE.Vector3()
          .subVectors(this.player.group.position, this.opponent.group.position)
          .normalize();

        const speed = this.config.speed;
        this.opponent.group.position.x += dir.x * speed * delta;
        this.opponent.group.position.z += dir.z * speed * delta;

        if (this.opponent.currentAction !== 'RUN') {
          this.opponent.setAction('RUN', 0);
        }
      } else {
        if (this.opponent.currentAction === 'RUN') {
          this.opponent.setAction('IDLE');
        }
      }
    }
  }

  private startOpponentTelegraph() {
    this.isOpponentTelegraphing = true;
    this.telegraphTimer = 0;
    this.telegraphDuration = this.config.telegraphDuration;

    // Pick attack style
    const roll = Math.random();
    if (this.config.isUnbeatableBoss) {
      this.pendingAttackType = roll < 0.4 ? 'unblockable' : roll < 0.7 ? 'heavy' : 'light';
      soundManager.playBossAura();
    } else if (this.config.id === 'harsh') {
      this.pendingAttackType = roll < 0.5 ? 'heavy' : 'light';
    } else {
      this.pendingAttackType = roll < 0.3 ? 'heavy' : 'light';
    }

    soundManager.playTelegraphWarning();
  }

  private executeOpponentAttack(type: 'light' | 'heavy' | 'unblockable') {
    if (type === 'light') {
      this.opponent.setAction('ATTACK_LIGHT', 0.45);
      this.opponentAttackCooldown = 0.5;
      soundManager.playSwingLight();
      setTimeout(() => this.checkOpponentAttackHit('light'), 180);
    } else {
      this.opponent.setAction('ATTACK_HEAVY', 0.8);
      this.opponentAttackCooldown = 0.9;
      soundManager.playSwingHeavy();
      setTimeout(() => this.checkOpponentAttackHit(type), 380);
    }
  }

  private executeAyushVoidDash() {
    soundManager.playBossAura();
    this.particles.emitVoidBlast(this.opponent.group.position, 18);

    // Swiftly teleport/dash near player
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      0,
      (Math.random() - 0.5) * 2
    ).normalize().multiplyScalar(2.2);

    this.opponent.group.position.copy(this.player.group.position).add(offset);
    this.particles.emitVoidBlast(this.opponent.group.position, 25);
    this.faceTarget(this.opponent, this.player);

    this.startOpponentTelegraph();
  }

  private checkPlayerAttackHit(attackType: 'light' | 'heavy') {
    if (this.opponent.currentAction === 'DEAD') return;

    const dist = this.player.group.position.distanceTo(this.opponent.group.position);
    if (dist > 3.2) return; // Out of range!

    const baseDmg = attackType === 'heavy' ? 38 : 20;

    // AYUSH UNBEATABLE MECHANIC:
    // Ayush either deflects effortlessly with dark aura, or absorbs minimal damage (1-2) with no stagger!
    if (this.config.isUnbeatableBoss) {
      soundManager.playBlock();
      this.particles.emitVoidBlast(this.opponent.getSwordTipWorldPosition(), 15);
      this.cameraShake(0.2);
      this.addFloatingText('BLOCKED!', '#d500f9', this.opponent.group.position);
      this.logCombat(`Ayush effortlessly deflected your strike.`);
      this.damageDealt += 1;
      return;
    }

    // Check if opponent dodged
    if (Math.random() < this.config.dodgeChance && this.opponent.currentAction !== 'ATTACK_HEAVY') {
      this.opponent.setAction('DODGE', 0.4);
      soundManager.playDodge();
      this.addFloatingText('DODGED', '#90caf9', this.opponent.group.position);
      return;
    }

    // Check if opponent blocked
    const isHarsh = this.config.id === 'harsh';
    const opponentBlocks = Math.random() < this.config.blockChance && this.opponent.currentAction !== 'ATTACK_HEAVY';

    if (opponentBlocks) {
      if (attackType === 'heavy') {
        // Guard break!
        soundManager.playHit();
        this.particles.emitSparks(this.opponent.getSwordTipWorldPosition(), 20);
        this.cameraShake(0.35);
        this.opponent.setAction('HIT', 0.6);
        const dmg = Math.round(baseDmg * 0.7);
        this.opponentHp = Math.max(0, this.opponentHp - dmg);
        this.damageDealt += dmg;
        this.hitsLanded += 1;
        this.addFloatingText(`GUARD BREAK! -${dmg}`, '#ffb300', this.opponent.group.position);
        this.logCombat(`You broke ${this.config.name}'s guard with a heavy strike!`);
      } else {
        // Blocked light attack
        soundManager.playBlock();
        this.particles.emitSparks(this.opponent.getSwordTipWorldPosition(), 10);
        this.addFloatingText('GUARDED', '#b0bec5', this.opponent.group.position);
        this.logCombat(`${this.config.name} blocked your attack.`);
      }
    } else {
      // Direct clean hit!
      soundManager.playHit();
      this.particles.emitHit(this.opponent.getBodyCenterWorldPosition(), 18);
      this.cameraShake(attackType === 'heavy' ? 0.3 : 0.15);
      this.opponent.setAction('HIT', attackType === 'heavy' ? 0.55 : 0.35);

      const dmg = baseDmg + Math.floor(Math.random() * 5);
      this.opponentHp = Math.max(0, this.opponentHp - dmg);
      this.damageDealt += dmg;
      this.hitsLanded += 1;

      this.addFloatingText(`-${dmg}`, '#ff5252', this.opponent.group.position);
      this.logCombat(`Hit ${this.config.name} for ${dmg} damage!`);
    }

    // Check opponent defeat
    if (this.opponentHp <= 0 && !this.config.isUnbeatableBoss) {
      this.handleVictory();
    }
  }

  private checkOpponentAttackHit(attackType: 'light' | 'heavy' | 'unblockable') {
    if (this.player.currentAction === 'DEAD') return;

    const dist = this.opponent.group.position.distanceTo(this.player.group.position);
    if (dist > 3.4) return; // Player dodged out of range!

    // Player invulnerable in dodge
    if (this.player.isInvulnerable) {
      this.addFloatingText('EVADED', '#64b5f6', this.player.group.position);
      return;
    }

    let baseDmg = attackType === 'heavy' ? this.config.attackDamageHeavy : this.config.attackDamageLight;
    if (attackType === 'unblockable') baseDmg = 55;

    // Check player blocking
    if (this.player.isBlocking && attackType !== 'unblockable') {
      if (attackType === 'heavy') {
        // Guard break on heavy attack!
        soundManager.playHit();
        this.particles.emitSparks(this.player.getSwordTipWorldPosition(), 18);
        this.cameraShake(0.4);
        this.playerStamina = 0;
        this.player.setAction('HIT', 0.6);
        const dmg = Math.round(baseDmg * 0.5);
        this.playerHp = Math.max(0, this.playerHp - dmg);
        this.damageTaken += dmg;
        this.addFloatingText(`GUARD CRUSH! -${dmg}`, '#ff9800', this.player.group.position);
        this.logCombat(`Your guard was crushed by ${this.config.name}'s heavy blow!`);
      } else {
        // Successful block
        soundManager.playBlock();
        this.particles.emitSparks(this.player.getSwordTipWorldPosition(), 12);
        this.parriesExecuted += 1;
        this.playerStamina = Math.max(0, this.playerStamina - 18);
        const dmg = Math.round(baseDmg * 0.15); // Mitigated 85%
        this.playerHp = Math.max(0, this.playerHp - dmg);
        this.damageTaken += dmg;
        this.addFloatingText(`BLOCKED -${dmg}`, '#cfd8dc', this.player.group.position);
        this.logCombat(`Blocked ${this.config.name}'s strike.`);
      }
    } else {
      // Direct hit on player
      soundManager.playHit();
      this.particles.emitHit(this.player.getBodyCenterWorldPosition(), 20);
      this.cameraShake(attackType === 'heavy' ? 0.45 : 0.25);
      this.player.setAction('HIT', 0.45);

      const dmg = baseDmg + Math.floor(Math.random() * 4);
      this.playerHp = Math.max(0, this.playerHp - dmg);
      this.damageTaken += dmg;
      this.addFloatingText(`-${dmg}`, '#e53935', this.player.group.position);
      this.logCombat(`${this.config.name} struck you for ${dmg} damage!`);
    }

    // Check player death
    if (this.playerHp <= 0) {
      this.handleDefeat();
    }
  }

  private handleVictory() {
    this.isEnded = true;
    this.opponent.setAction('DEAD', 2.0);
    soundManager.stopMusic();
    soundManager.playVictory();

    this.logCombat(`VICTORY! ${this.config.name} has been defeated!`);

    setTimeout(() => {
      this.onEndCallback({
        level: this.config.levelNumber,
        opponentId: this.config.id,
        opponentName: this.config.name,
        result: 'VICTORY',
        damageDealt: this.damageDealt,
        damageTaken: this.damageTaken,
        hitsLanded: this.hitsLanded,
        parriesExecuted: this.parriesExecuted,
      });
    }, 2200);
  }

  private handleDefeat() {
    this.isEnded = true;
    this.player.setAction('DEAD', 2.0);
    soundManager.stopMusic();
    soundManager.playDefeat();

    if (this.config.isUnbeatableBoss) {
      this.logCombat(`Ayush stands undefeated. You survived for ${this.survivalTimer.toFixed(1)}s.`);
      setTimeout(() => {
        this.onEndCallback({
          level: this.config.levelNumber,
          opponentId: this.config.id,
          opponentName: this.config.name,
          result: 'SURVIVED_FINAL',
          survivalTimeSeconds: Math.round(this.survivalTimer * 10) / 10,
          damageDealt: this.damageDealt,
          damageTaken: this.damageTaken,
          hitsLanded: this.hitsLanded,
          parriesExecuted: this.parriesExecuted,
        });
      }, 2200);
    } else {
      this.logCombat(`Defeated by ${this.config.name}.`);
      setTimeout(() => {
        this.onEndCallback({
          level: this.config.levelNumber,
          opponentId: this.config.id,
          opponentName: this.config.name,
          result: 'DEFEAT',
          damageDealt: this.damageDealt,
          damageTaken: this.damageTaken,
          hitsLanded: this.hitsLanded,
          parriesExecuted: this.parriesExecuted,
        });
      }, 2200);
    }
  }

  private faceTarget(source: Character3D, target: Character3D) {
    const dx = target.group.position.x - source.group.position.x;
    const dz = target.group.position.z - source.group.position.z;
    source.facingAngle = Math.atan2(dx, dz);
  }

  private enforceArenaBoundaries(pos: THREE.Vector3, maxRadius: number) {
    const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    if (dist > maxRadius) {
      pos.x = (pos.x / dist) * maxRadius;
      pos.z = (pos.z / dist) * maxRadius;
    }
  }

  private cameraShake(intensity: number) {
    this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, intensity);
  }

  private updateCamera(delta: number) {
    // Midpoint between both fighters
    const midX = (this.player.group.position.x + this.opponent.group.position.x) / 2;
    const midZ = (this.player.group.position.z + this.opponent.group.position.z) / 2;
    const dist = this.player.group.position.distanceTo(this.opponent.group.position);

    const targetPos = new THREE.Vector3(
      midX * 0.45,
      4.2 + dist * 0.18,
      midZ + 8.5 + dist * 0.35
    );

    this.camera.position.lerp(targetPos, delta * 3.5);

    // Look at midpoint
    const lookTarget = new THREE.Vector3(midX, 1.2, midZ);
    this.cameraLookTarget.lerp(lookTarget, delta * 4.0);

    // Apply camera shake if any
    if (this.cameraShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity * 1.4;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity * 1.4;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 2.5);
    }

    this.camera.lookAt(this.cameraLookTarget);
  }

  private addFloatingText(text: string, color: string, worldPos: THREE.Vector3) {
    this.floatingTexts.push({
      id: this.nextTextId++,
      text,
      color,
      pos: worldPos.clone().add(new THREE.Vector3(0, 1.8, 0)),
      life: 0,
    });
  }

  private updateFloatingTexts(delta: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += delta;
      ft.pos.y += delta * 1.2;
      if (ft.life >= 1.0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private logCombat(msg: string) {
    this.combatLogs.unshift(msg);
    if (this.combatLogs.length > 5) {
      this.combatLogs.pop();
    }
  }

  private broadcastHUD() {
    // Project 3D floating texts to 2D screen coordinates
    const texts2D = this.floatingTexts.map((ft) => {
      const p = ft.pos.clone().project(this.camera);
      const x = ((p.x + 1) * this.container.clientWidth) / 2;
      const y = ((-p.y + 1) * this.container.clientHeight) / 2;
      return {
        id: ft.id,
        text: ft.text,
        color: ft.color,
        x,
        y,
      };
    });

    this.onHUDUpdateCallback({
      playerHp: Math.max(0, this.playerHp),
      playerMaxHp: this.playerMaxHp,
      playerStamina: Math.max(0, this.playerStamina),
      playerMaxStamina: this.playerMaxStamina,
      opponentHp: Math.max(0, this.opponentHp),
      opponentMaxHp: this.opponentMaxHp,
      opponentName: this.config.name,
      opponentTitle: this.config.title,
      isAyush: !!this.config.isUnbeatableBoss,
      survivalTime: Math.round(this.survivalTimer * 10) / 10,
      telegraph: {
        active: this.isOpponentTelegraphing,
        type: this.pendingAttackType,
        progress: this.isOpponentTelegraphing ? Math.min(1, this.telegraphTimer / this.telegraphDuration) : 0,
      },
      combatLog: [...this.combatLogs],
      floatingTexts: texts2D,
    });
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.isRunning = false;
    soundManager.stopMusic();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);

    if (this.arenaEnv) {
      this.arenaEnv.dispose();
    }
    this.particles.dispose();
    this.renderer.dispose();

    if (this.container && this.renderer.domElement && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

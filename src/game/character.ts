import * as THREE from 'three';
import { ActionType } from '../types/game';

export interface CharacterConfig {
  isPlayer: boolean;
  name: string;
  colors: {
    primary: number;
    secondary: number;
    skin: number;
    hair: number;
    blade: number;
    bladeGlow: number;
    trailColor: number;
    auraColor?: number;
  };
  swordScale?: number;
  isBoss?: boolean;
}

export class Character3D {
  public group: THREE.Group;
  public config: CharacterConfig;

  // Body hierarchy for procedural animation
  private torsoGroup!: THREE.Group;
  private headGroup!: THREE.Group;
  private leftArmGroup!: THREE.Group;
  private rightArmGroup!: THREE.Group;
  private leftForearmGroup!: THREE.Group;
  private rightForearmGroup!: THREE.Group;
  private leftLegGroup!: THREE.Group;
  private rightLegGroup!: THREE.Group;
  private leftShinGroup!: THREE.Group;
  private rightShinGroup!: THREE.Group;
  private swordMesh!: THREE.Group;
  private swordBlade!: THREE.Mesh;
  private auraParticles?: THREE.Points;
  private swordTrailMesh?: THREE.Mesh;
  private blockShieldMesh?: THREE.Mesh;

  // Animation states
  public currentAction: ActionType = 'IDLE';
  public actionTimer: number = 0;
  public actionDuration: number = 0;
  private animTime: number = 0;
  public isInvulnerable: boolean = false;
  public isBlocking: boolean = false;

  // Movement position & facing
  public velocity = new THREE.Vector3();
  public facingAngle: number = 0; // In radians

  constructor(config: CharacterConfig) {
    this.config = config;
    this.group = new THREE.Group();
    this.buildMesh();
  }

  private buildMesh() {
    const c = this.config.colors;

    // Materials
    const matPrimary = new THREE.MeshStandardMaterial({
      color: c.primary,
      roughness: 0.4,
      metalness: 0.5,
    });
    const matSecondary = new THREE.MeshStandardMaterial({
      color: c.secondary,
      roughness: 0.3,
      metalness: 0.7,
    });
    const matSkin = new THREE.MeshStandardMaterial({
      color: c.skin,
      roughness: 0.8,
      metalness: 0.1,
    });
    const matHair = new THREE.MeshStandardMaterial({
      color: c.hair,
      roughness: 0.7,
    });
    const matBlade = new THREE.MeshStandardMaterial({
      color: c.blade,
      roughness: 0.15,
      metalness: 0.95,
      emissive: c.bladeGlow,
      emissiveIntensity: this.config.isBoss ? 0.6 : 0.25,
    });
    const matLeather = new THREE.MeshStandardMaterial({
      color: 0x3d271d,
      roughness: 0.9,
    });

    // Root offset
    const scale = this.config.isBoss ? 1.25 : 1.0;
    this.group.scale.set(scale, scale, scale);

    // Torso Group (pivot at pelvis)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = 1.0;
    this.group.add(this.torsoGroup);

    // Pelvis / Belt
    const pelvisGeo = new THREE.BoxGeometry(0.55, 0.25, 0.35);
    const pelvis = new THREE.Mesh(pelvisGeo, matLeather);
    pelvis.castShadow = true;
    this.torsoGroup.add(pelvis);

    // Gold/Trim buckle
    const buckleGeo = new THREE.BoxGeometry(0.18, 0.18, 0.38);
    const buckle = new THREE.Mesh(buckleGeo, matSecondary);
    this.torsoGroup.add(buckle);

    // Chest / Breastplate
    const chestGeo = new THREE.BoxGeometry(0.65, 0.65, 0.42);
    const chest = new THREE.Mesh(chestGeo, matPrimary);
    chest.position.y = 0.45;
    chest.castShadow = true;
    this.torsoGroup.add(chest);

    // Shoulder Pauldrons
    const pauldronGeo = new THREE.BoxGeometry(0.28, 0.22, 0.38);
    const leftPauldron = new THREE.Mesh(pauldronGeo, matSecondary);
    leftPauldron.position.set(-0.48, 0.72, 0);
    leftPauldron.rotation.z = 0.2;
    leftPauldron.castShadow = true;
    this.torsoGroup.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, matSecondary);
    rightPauldron.position.set(0.48, 0.72, 0);
    rightPauldron.rotation.z = -0.2;
    rightPauldron.castShadow = true;
    this.torsoGroup.add(rightPauldron);

    // Head Group (pivot at neck)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.85, 0);
    this.torsoGroup.add(this.headGroup);

    const headGeo = new THREE.BoxGeometry(0.34, 0.38, 0.34);
    const head = new THREE.Mesh(headGeo, matSkin);
    head.position.y = 0.2;
    head.castShadow = true;
    this.headGroup.add(head);

    // Helmet / Hair
    const hairGeo = new THREE.BoxGeometry(0.38, 0.24, 0.38);
    const hair = new THREE.Mesh(hairGeo, matHair);
    hair.position.y = 0.35;
    hair.position.z = -0.02;
    hair.castShadow = true;
    this.headGroup.add(hair);

    // Eyes / Glowing Visor
    const visorGeo = new THREE.BoxGeometry(0.3, 0.08, 0.05);
    const visorMat = new THREE.MeshBasicMaterial({
      color: this.config.isBoss ? 0xff0055 : (this.config.isPlayer ? 0x00ffff : 0xffdd44),
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.22, 0.17);
    this.headGroup.add(visor);

    // Left Arm Group (pivot at shoulder)
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.45, 0.65, 0);
    this.torsoGroup.add(this.leftArmGroup);

    const armGeo = new THREE.BoxGeometry(0.18, 0.4, 0.18);
    const leftUpperArm = new THREE.Mesh(armGeo, matPrimary);
    leftUpperArm.position.y = -0.2;
    leftUpperArm.castShadow = true;
    this.leftArmGroup.add(leftUpperArm);

    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.y = -0.4;
    this.leftArmGroup.add(this.leftForearmGroup);

    const forearmGeo = new THREE.BoxGeometry(0.16, 0.38, 0.16);
    const leftForearm = new THREE.Mesh(forearmGeo, matSecondary);
    leftForearm.position.y = -0.2;
    leftForearm.castShadow = true;
    this.leftForearmGroup.add(leftForearm);

    // Right Arm Group (pivot at shoulder)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.45, 0.65, 0);
    this.torsoGroup.add(this.rightArmGroup);

    const rightUpperArm = new THREE.Mesh(armGeo, matPrimary);
    rightUpperArm.position.y = -0.2;
    rightUpperArm.castShadow = true;
    this.rightArmGroup.add(rightUpperArm);

    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.y = -0.4;
    this.rightArmGroup.add(this.rightForearmGroup);

    const rightForearm = new THREE.Mesh(forearmGeo, matSecondary);
    rightForearm.position.y = -0.2;
    rightForearm.castShadow = true;
    this.rightForearmGroup.add(rightForearm);

    // Sword in Right Hand
    this.swordMesh = new THREE.Group();
    this.swordMesh.position.set(0, -0.38, 0.15);
    this.rightForearmGroup.add(this.swordMesh);

    const swordScale = (this.config.swordScale || 1.0) * (this.config.isBoss ? 1.35 : 1.0);

    // Sword Hilt & Guard
    const gripGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8);
    const grip = new THREE.Mesh(gripGeo, matLeather);
    grip.rotation.x = Math.PI / 2;
    this.swordMesh.add(grip);

    const guardGeo = new THREE.BoxGeometry(0.32 * swordScale, 0.06, 0.12);
    const guard = new THREE.Mesh(guardGeo, matSecondary);
    guard.position.z = 0.18;
    this.swordMesh.add(guard);

    // Sword Blade
    const bladeLength = 1.35 * swordScale;
    const bladeGeo = new THREE.BoxGeometry(0.09 * swordScale, 0.02, bladeLength);
    this.swordBlade = new THREE.Mesh(bladeGeo, matBlade);
    this.swordBlade.position.z = 0.18 + bladeLength / 2;
    this.swordBlade.castShadow = true;
    this.swordMesh.add(this.swordBlade);

    // Sword Tip
    const tipGeo = new THREE.ConeGeometry(0.06 * swordScale, 0.25 * swordScale, 4);
    const tip = new THREE.Mesh(tipGeo, matBlade);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 0.18 + bladeLength + (0.12 * swordScale);
    this.swordMesh.add(tip);

    // Left Leg Group (pivot at hip)
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.2, 0, 0);
    this.group.add(this.leftLegGroup);

    const thighGeo = new THREE.BoxGeometry(0.22, 0.5, 0.22);
    const leftThigh = new THREE.Mesh(thighGeo, matPrimary);
    leftThigh.position.y = -0.25;
    leftThigh.castShadow = true;
    this.leftLegGroup.add(leftThigh);

    this.leftShinGroup = new THREE.Group();
    this.leftShinGroup.position.y = -0.5;
    this.leftLegGroup.add(this.leftShinGroup);

    const shinGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    const leftShin = new THREE.Mesh(shinGeo, matSecondary);
    leftShin.position.y = -0.25;
    leftShin.castShadow = true;
    this.leftShinGroup.add(leftShin);

    // Right Leg Group (pivot at hip)
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.2, 0, 0);
    this.group.add(this.rightLegGroup);

    const rightThigh = new THREE.Mesh(thighGeo, matPrimary);
    rightThigh.position.y = -0.25;
    rightThigh.castShadow = true;
    this.rightLegGroup.add(rightThigh);

    this.rightShinGroup = new THREE.Group();
    this.rightShinGroup.position.y = -0.5;
    this.rightLegGroup.add(this.rightShinGroup);

    const rightShin = new THREE.Mesh(shinGeo, matSecondary);
    rightShin.position.y = -0.25;
    rightShin.castShadow = true;
    this.rightShinGroup.add(rightShin);

    // Block Energy Shield (visible when blocking)
    const shieldGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.05, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: this.config.colors.bladeGlow,
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    this.blockShieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.blockShieldMesh.rotation.x = Math.PI / 2;
    this.blockShieldMesh.position.set(0, 1.1, 0.6);
    this.group.add(this.blockShieldMesh);

    // Aura particles for Boss (Ayush)
    if (this.config.isBoss && this.config.colors.auraColor) {
      const particleCount = 45;
      const partGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 1.6;
        positions[i * 3 + 1] = Math.random() * 2.2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      }
      partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const partMat = new THREE.PointsMaterial({
        color: this.config.colors.auraColor,
        size: 0.14,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      this.auraParticles = new THREE.Points(partGeo, partMat);
      this.group.add(this.auraParticles);
    }
  }

  public setAction(action: ActionType, duration: number = 0.5) {
    if (this.currentAction === 'DEAD') return; // Cannot change state if dead
    this.currentAction = action;
    this.actionTimer = 0;
    this.actionDuration = duration;

    this.isInvulnerable = action === 'DODGE';
    this.isBlocking = action === 'BLOCK';

    if (this.blockShieldMesh) {
      (this.blockShieldMesh.material as THREE.MeshBasicMaterial).opacity = action === 'BLOCK' ? 0.65 : 0;
    }
  }

  public update(delta: number) {
    this.animTime += delta;
    this.actionTimer += delta;

    // Boss aura animation
    if (this.auraParticles) {
      const posAttr = this.auraParticles.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] += delta * 1.5;
        if (arr[i * 3 + 1] > 2.4) {
          arr[i * 3 + 1] = 0.1;
          arr[i * 3] = (Math.random() - 0.5) * 1.6;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Facing rotation
    this.group.rotation.y = this.facingAngle;

    // Check action expiration
    if (this.actionDuration > 0 && this.actionTimer >= this.actionDuration) {
      if (this.currentAction !== 'DEAD') {
        this.setAction('IDLE');
      }
    }

    // Procedural animation blending
    this.animate(delta);
  }

  private animate(delta: number) {
    const progress = this.actionDuration > 0 ? Math.min(1, this.actionTimer / this.actionDuration) : 0;
    const t = this.animTime * 6;

    switch (this.currentAction) {
      case 'IDLE': {
        // Natural breathing bob and combat stance
        this.torsoGroup.position.y = 1.0 + Math.sin(t * 0.5) * 0.03;
        this.torsoGroup.rotation.y = 0.2;
        this.torsoGroup.rotation.x = 0.05;

        // Arms ready
        this.rightArmGroup.rotation.x = -0.4 + Math.sin(t * 0.5) * 0.04;
        this.rightArmGroup.rotation.z = -0.3;
        this.rightForearmGroup.rotation.x = -0.5;

        this.leftArmGroup.rotation.x = -0.3;
        this.leftArmGroup.rotation.z = 0.4;
        this.leftForearmGroup.rotation.x = -0.6;

        // Legs
        this.leftLegGroup.rotation.x = -0.1;
        this.rightLegGroup.rotation.x = 0.15;
        this.leftShinGroup.rotation.x = 0.1;
        this.rightShinGroup.rotation.x = 0.05;

        // Sword held forward
        this.swordMesh.rotation.x = 0.6;
        this.swordMesh.rotation.y = 0.2;
        break;
      }

      case 'RUN': {
        // Running stride
        const runCycle = this.animTime * 14;
        this.torsoGroup.position.y = 0.95 + Math.abs(Math.sin(runCycle)) * 0.08;
        this.torsoGroup.rotation.x = 0.25; // Forward lean
        this.torsoGroup.rotation.y = Math.sin(runCycle) * 0.15;

        // Legs alternating
        this.leftLegGroup.rotation.x = Math.sin(runCycle) * 0.8;
        this.rightLegGroup.rotation.x = -Math.sin(runCycle) * 0.8;
        this.leftShinGroup.rotation.x = Math.max(0, -Math.sin(runCycle) * 0.8);
        this.rightShinGroup.rotation.x = Math.max(0, Math.sin(runCycle) * 0.8);

        // Arms pumping
        this.leftArmGroup.rotation.x = -Math.sin(runCycle) * 0.7;
        this.rightArmGroup.rotation.x = Math.sin(runCycle) * 0.6;
        this.swordMesh.rotation.x = 0.4;
        break;
      }

      case 'ATTACK_LIGHT': {
        // Quick horizontal slash arc
        // Windup (0..0.25), Slash (0.25..0.65), Recovery (0.65..1.0)
        let armRotX = 0;
        let armRotY = 0;
        let torsoRotY = 0;

        if (progress < 0.25) {
          const p = progress / 0.25;
          armRotX = -0.5 - p * 0.8;
          armRotY = -p * 0.8;
          torsoRotY = -p * 0.6;
        } else if (progress < 0.65) {
          const p = (progress - 0.25) / 0.4;
          armRotX = -1.3 + p * 1.6;
          armRotY = -0.8 + p * 2.2;
          torsoRotY = -0.6 + p * 1.2;
        } else {
          const p = (progress - 0.65) / 0.35;
          armRotX = 0.3 - p * 0.7;
          armRotY = 1.4 - p * 1.2;
          torsoRotY = 0.6 - p * 0.4;
        }

        this.torsoGroup.rotation.y = torsoRotY;
        this.rightArmGroup.rotation.x = armRotX;
        this.rightArmGroup.rotation.y = armRotY;
        this.rightArmGroup.rotation.z = -0.2;
        this.swordMesh.rotation.x = 1.2;
        this.swordMesh.rotation.z = 0.8;
        break;
      }

      case 'ATTACK_HEAVY': {
        // High overhead slam with forward step
        let armRotX = 0;
        let torsoX = 0;

        if (progress < 0.35) {
          // Windup overhead
          const p = progress / 0.35;
          armRotX = -0.4 - p * 2.2; // High overhead
          torsoX = -p * 0.2;
          this.torsoGroup.position.y = 1.0 + p * 0.18;
        } else if (progress < 0.65) {
          // Slam downward with power!
          const p = (progress - 0.35) / 0.3;
          armRotX = -2.6 + p * 2.8;
          torsoX = -0.2 + p * 0.6;
          this.torsoGroup.position.y = 1.18 - p * 0.35;
        } else {
          // Recovery
          const p = (progress - 0.65) / 0.35;
          armRotX = 0.2 - p * 0.6;
          torsoX = 0.4 - p * 0.35;
          this.torsoGroup.position.y = 0.83 + p * 0.17;
        }

        this.torsoGroup.rotation.x = torsoX;
        this.rightArmGroup.rotation.x = armRotX;
        this.leftArmGroup.rotation.x = armRotX * 0.8; // Both hands braced
        this.swordMesh.rotation.x = 1.5;
        break;
      }

      case 'BLOCK': {
        // Defensive braced stance
        this.torsoGroup.position.y = 0.92;
        this.torsoGroup.rotation.x = 0.15;
        this.torsoGroup.rotation.y = -0.3;

        this.rightArmGroup.rotation.x = -1.2;
        this.rightArmGroup.rotation.y = -0.8;
        this.rightArmGroup.rotation.z = 0.4;
        this.rightForearmGroup.rotation.x = -0.4;

        this.leftArmGroup.rotation.x = -1.0;
        this.leftArmGroup.rotation.y = 0.6;

        this.swordMesh.rotation.x = 1.5;
        this.swordMesh.rotation.y = 1.2;
        this.swordMesh.rotation.z = -0.6;

        // Crouch legs
        this.leftLegGroup.rotation.x = -0.3;
        this.rightLegGroup.rotation.x = 0.4;
        break;
      }

      case 'DODGE': {
        // Fast roll / shadow dash
        // Rotate body around X and Y
        const rollAngle = progress * Math.PI * 2;
        this.torsoGroup.position.y = 0.6 + Math.sin(progress * Math.PI) * 0.3;
        this.torsoGroup.rotation.x = rollAngle;
        this.leftLegGroup.rotation.x = 0.8;
        this.rightLegGroup.rotation.x = -0.8;
        this.rightArmGroup.rotation.x = -1.5;
        break;
      }

      case 'HIT': {
        // Stumble backward recoil
        const recoil = Math.sin(progress * Math.PI);
        this.torsoGroup.position.y = 1.0;
        this.torsoGroup.rotation.x = -recoil * 0.4;
        this.headGroup.rotation.x = -recoil * 0.6;
        this.rightArmGroup.rotation.x = recoil * 0.8;
        this.leftArmGroup.rotation.x = recoil * 0.8;
        break;
      }

      case 'DEAD': {
        // Dramatic collapse to ground
        const p = Math.min(1, this.actionTimer / 1.2);
        this.torsoGroup.position.y = 1.0 - p * 0.85;
        this.torsoGroup.rotation.x = -p * 1.4;
        this.torsoGroup.rotation.z = p * 0.4;
        this.headGroup.rotation.x = p * 0.8;
        this.swordMesh.position.y = -0.38 + p * 0.3;
        this.swordMesh.rotation.x = p * 2.0;
        break;
      }
    }
  }

  public getSwordTipWorldPosition(): THREE.Vector3 {
    const tipPos = new THREE.Vector3(0, 0, 1.6);
    this.swordMesh.localToWorld(tipPos);
    return tipPos;
  }

  public getBodyCenterWorldPosition(): THREE.Vector3 {
    const center = new THREE.Vector3(0, 1.1, 0);
    this.group.localToWorld(center);
    return center;
  }
}

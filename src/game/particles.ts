import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  gravity: number;
  scaleDown: boolean;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private sparkGeo: THREE.BufferGeometry;
  private sparkMat: THREE.MeshBasicMaterial;
  private bloodGeo: THREE.BufferGeometry;
  private bloodMat: THREE.MeshBasicMaterial;
  private dustGeo: THREE.BufferGeometry;
  private dustMat: THREE.MeshBasicMaterial;
  private voidGeo: THREE.BufferGeometry;
  private voidMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    this.sparkMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });

    this.bloodGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    this.bloodMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });

    this.dustGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    this.dustMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.7 });

    this.voidGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    this.voidMat = new THREE.MeshBasicMaterial({ color: 0xd500f9 });
  }

  public emitSparks(pos: THREE.Vector3, count = 14) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.sparkMat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 1,
        (Math.random() - 0.5) * 6
      );

      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
        gravity: 12,
        scaleDown: true,
      });
    }
  }

  public emitHit(pos: THREE.Vector3, count = 12) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.bloodGeo, this.bloodMat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 5
      );

      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.25,
        gravity: 14,
        scaleDown: true,
      });
    }
  }

  public emitDust(pos: THREE.Vector3, count = 6) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.dustGeo, this.dustMat);
      mesh.position.copy(pos);
      mesh.position.y = 0.1;
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2.5,
        Math.random() * 1.5 + 0.5,
        (Math.random() - 0.5) * 2.5
      );

      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.2,
        gravity: 2,
        scaleDown: true,
      });
    }
  }

  public emitVoidBlast(pos: THREE.Vector3, count = 25) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.voidGeo, this.voidMat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 3;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 4 + 1,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        gravity: 8,
        scaleDown: true,
      });
    }
  }

  public update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.velocity.y -= p.gravity * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Scale down fade
      if (p.scaleDown) {
        const factor = 1 - p.life / p.maxLife;
        p.mesh.scale.set(factor, factor, factor);
      }
    }
  }

  public clear() {
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.particles = [];
  }

  public dispose() {
    this.clear();
    this.sparkGeo.dispose();
    this.sparkMat.dispose();
    this.bloodGeo.dispose();
    this.bloodMat.dispose();
    this.dustGeo.dispose();
    this.dustMat.dispose();
    this.voidGeo.dispose();
    this.voidMat.dispose();
  }
}

import * as THREE from 'three';

export interface ArenaEnvironment {
  group: THREE.Group;
  update: (delta: number) => void;
  dispose: () => void;
}

export function createArena(type: 'courtyard' | 'forest' | 'stone' | 'mountain' | 'storm', scene: THREE.Scene): ArenaEnvironment {
  const group = new THREE.Group();
  scene.add(group);

  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
  let updateFn = (_delta: number) => {};

  // Common boundary limit
  const ARENA_RADIUS = 14;

  if (type === 'courtyard') {
    // 1. TRAINING COURTYARD (Shashwat)
    scene.background = new THREE.Color(0xdce7f0);
    scene.fog = new THREE.FogExp2(0xdce7f0, 0.015);

    // Stone tile floor
    const floorGeo = new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS, 1, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x9e978e,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    group.add(floor);
    disposables.push(floorGeo, floorMat);

    // Decorative inner stone ring
    const ringGeo = new THREE.RingGeometry(5.8, 6.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x6e665d, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);
    disposables.push(ringGeo, ringMat);

    // Wooden fences and posts around perimeter
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const x = Math.cos(angle) * (ARENA_RADIUS - 0.8);
      const z = Math.sin(angle) * (ARENA_RADIUS - 0.8);

      const postGeo = new THREE.BoxGeometry(0.3, 2.2, 0.3);
      const post = new THREE.Mesh(postGeo, fenceMat);
      post.position.set(x, 1.1, z);
      post.castShadow = true;
      group.add(post);
      disposables.push(postGeo);
    }
    disposables.push(fenceMat);

    // Practice dummies
    [-6, 6].forEach((xPos) => {
      const dummyGroup = new THREE.Group();
      dummyGroup.position.set(xPos, 0, -5);
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.4, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x7c5e42 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 1.2;
      dummyGroup.add(pole);

      const crossGeo = new THREE.BoxGeometry(1.4, 0.2, 0.2);
      const cross = new THREE.Mesh(crossGeo, poleMat);
      cross.position.y = 1.6;
      dummyGroup.add(cross);

      const headGeo = new THREE.SphereGeometry(0.24, 8, 8);
      const head = new THREE.Mesh(headGeo, poleMat);
      head.position.y = 2.4;
      dummyGroup.add(head);

      group.add(dummyGroup);
      disposables.push(poleGeo, poleMat, crossGeo, headGeo);
    });

    // Cherry Blossom trees on perimeter
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x422a1d });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0xffb7c5, roughness: 0.6 });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.4;
      const x = Math.cos(angle) * (ARENA_RADIUS + 3);
      const z = Math.sin(angle) * (ARENA_RADIUS + 3);

      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      const trunkGeo = new THREE.CylinderGeometry(0.4, 0.7, 4.5, 8);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.25;
      tree.add(trunk);

      const crownGeo = new THREE.SphereGeometry(2.4, 8, 8);
      const crown = new THREE.Mesh(crownGeo, foliageMat);
      crown.position.y = 4.8;
      crown.scale.set(1.4, 1, 1.4);
      tree.add(crown);

      group.add(tree);
      disposables.push(trunkGeo, crownGeo);
    }
    disposables.push(trunkMat, foliageMat);

    // Petal particles
    const petalCount = 80;
    const petalGeo = new THREE.BufferGeometry();
    const petalPositions = new Float32Array(petalCount * 3);
    for (let i = 0; i < petalCount; i++) {
      petalPositions[i * 3] = (Math.random() - 0.5) * 26;
      petalPositions[i * 3 + 1] = Math.random() * 8;
      petalPositions[i * 3 + 2] = (Math.random() - 0.5) * 26;
    }
    petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPositions, 3));
    const petalMat = new THREE.PointsMaterial({
      color: 0xffb7c5,
      size: 0.18,
      transparent: true,
      opacity: 0.8,
    });
    const petalPoints = new THREE.Points(petalGeo, petalMat);
    group.add(petalPoints);
    disposables.push(petalGeo, petalMat);

    updateFn = (delta: number) => {
      const pos = petalGeo.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < petalCount; i++) {
        arr[i * 3 + 1] -= delta * 0.9;
        arr[i * 3] += Math.sin(arr[i * 3 + 1] + i) * delta * 0.4;
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 8;
          arr[i * 3] = (Math.random() - 0.5) * 26;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 26;
        }
      }
      pos.needsUpdate = true;
    };
  } else if (type === 'forest') {
    // 2. FOREST CLEARING (Aditya)
    scene.background = new THREE.Color(0x192e1e);
    scene.fog = new THREE.FogExp2(0x192e1e, 0.02);

    const floorGeo = new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS, 1, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x2e4a28,
      roughness: 0.95,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    group.add(floor);
    disposables.push(floorGeo, floorMat);

    // Mossy rocks
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x485542, roughness: 0.9 });
    for (let i = 0; i < 8; i++) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = (i / 8) * Math.PI * 2 + 0.3;
      rock.position.set(
        Math.cos(angle) * (ARENA_RADIUS - 1.5),
        0.5,
        Math.sin(angle) * (ARENA_RADIUS - 1.5)
      );
      rock.scale.set(1 + Math.random() * 0.8, 0.7 + Math.random() * 0.5, 1 + Math.random() * 0.8);
      rock.castShadow = true;
      group.add(rock);
    }
    disposables.push(rockGeo, rockMat);

    // Surrounding Pine Trees
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d271d });
    const needleMat = new THREE.MeshStandardMaterial({ color: 0x16361a, roughness: 0.8 });
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x = Math.cos(angle) * (ARENA_RADIUS + 2.5);
      const z = Math.sin(angle) * (ARENA_RADIUS + 2.5);

      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3.5, 6);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.75;
      tree.add(trunk);

      for (let layer = 0; layer < 3; layer++) {
        const coneGeo = new THREE.ConeGeometry(2.2 - layer * 0.45, 2.5, 6);
        const cone = new THREE.Mesh(coneGeo, needleMat);
        cone.position.y = 3.2 + layer * 1.6;
        tree.add(cone);
        disposables.push(coneGeo);
      }

      group.add(tree);
      disposables.push(trunkGeo);
    }
    disposables.push(trunkMat, needleMat);

    // Fireflies
    const fireflyCount = 70;
    const fireflyGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(fireflyCount * 3);
    for (let i = 0; i < fireflyCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = 0.5 + Math.random() * 4.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const fireflyMat = new THREE.PointsMaterial({
      color: 0xbbff33,
      size: 0.22,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
    group.add(fireflies);
    disposables.push(fireflyGeo, fireflyMat);

    let time = 0;
    updateFn = (delta: number) => {
      time += delta;
      const pos = fireflyGeo.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < fireflyCount; i++) {
        arr[i * 3] += Math.sin(time * 1.5 + i) * 0.02;
        arr[i * 3 + 1] += Math.cos(time * 1.2 + i * 2) * 0.015;
        arr[i * 3 + 2] += Math.sin(time * 0.9 + i * 3) * 0.02;
      }
      pos.needsUpdate = true;
    };
  } else if (type === 'stone') {
    // 3. ANCIENT STONE ARENA (Harsh)
    scene.background = new THREE.Color(0x2d1e16);
    scene.fog = new THREE.FogExp2(0x2d1e16, 0.025);

    const floorGeo = new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS, 1, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x54473b,
      roughness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    group.add(floor);
    disposables.push(floorGeo, floorMat);

    // Ancient Ruined Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x7a6c5b, roughness: 0.8 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * (ARENA_RADIUS - 1.2);
      const z = Math.sin(angle) * (ARENA_RADIUS - 1.2);

      const height = 4.5 + ((i % 3) * 1.5);
      const pillarGeo = new THREE.CylinderGeometry(0.7, 0.75, height, 12);
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, height / 2, z);
      pillar.castShadow = true;
      group.add(pillar);
      disposables.push(pillarGeo);
    }
    disposables.push(pillarMat);

    // Fiery Braziers on 4 cardinal points
    const brazierMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    const braziers: THREE.PointLight[] = [];

    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((angle) => {
      const x = Math.cos(angle) * (ARENA_RADIUS - 3.5);
      const z = Math.sin(angle) * (ARENA_RADIUS - 3.5);

      const standGeo = new THREE.CylinderGeometry(0.3, 0.45, 1.8, 8);
      const stand = new THREE.Mesh(standGeo, brazierMat);
      stand.position.set(x, 0.9, z);
      group.add(stand);

      const bowlGeo = new THREE.CylinderGeometry(0.7, 0.3, 0.5, 8);
      const bowl = new THREE.Mesh(bowlGeo, brazierMat);
      bowl.position.set(x, 1.9, z);
      group.add(bowl);

      const flameLight = new THREE.PointLight(0xff7700, 2.0, 10);
      flameLight.position.set(x, 2.2, z);
      group.add(flameLight);
      braziers.push(flameLight);

      disposables.push(standGeo, bowlGeo);
    });
    disposables.push(brazierMat);

    let brazierTimer = 0;
    updateFn = (delta: number) => {
      brazierTimer += delta;
      braziers.forEach((light, idx) => {
        light.intensity = 1.8 + Math.sin(brazierTimer * 8 + idx * 2) * 0.6;
      });
    };
  } else if (type === 'mountain') {
    // 4. FROZEN MOUNTAIN PLATFORM (Shreyansh)
    scene.background = new THREE.Color(0x0e1724);
    scene.fog = new THREE.FogExp2(0x0e1724, 0.02);

    // Floating ice crag platform
    const floorGeo = new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS - 3, 2.5, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3d5a73,
      roughness: 0.3,
      metalness: 0.4,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -1.25;
    floor.receiveShadow = true;
    group.add(floor);
    disposables.push(floorGeo, floorMat);

    // Giant ice crystals around edges
    const crystalGeo = new THREE.ConeGeometry(0.8, 4.0, 5);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x80deea,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x00bcd4,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(
        Math.cos(angle) * (ARENA_RADIUS - 1.0),
        1.5,
        Math.sin(angle) * (ARENA_RADIUS - 1.0)
      );
      crystal.rotation.z = (Math.random() - 0.5) * 0.4;
      crystal.rotation.x = (Math.random() - 0.5) * 0.4;
      group.add(crystal);
    }
    disposables.push(crystalGeo, crystalMat);

    // Blizzard Snow Particles
    const snowCount = 200;
    const snowGeo = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3] = (Math.random() - 0.5) * 32;
      snowPositions[i * 3 + 1] = Math.random() * 10;
      snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 32;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
    });
    const snow = new THREE.Points(snowGeo, snowMat);
    group.add(snow);
    disposables.push(snowGeo, snowMat);

    updateFn = (delta: number) => {
      const pos = snowGeo.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < snowCount; i++) {
        arr[i * 3] += delta * 4.5; // Strong crosswind
        arr[i * 3 + 1] -= delta * 2.5;
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 10;
          arr[i * 3] = (Math.random() - 0.5) * 32;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 32;
        }
      }
      pos.needsUpdate = true;
    };
  } else {
    // 5. STORM-LIT FINAL ARENA - AYUSH'S DOMAIN
    scene.background = new THREE.Color(0x06020c);
    scene.fog = new THREE.FogExp2(0x06020c, 0.022);

    // Floating Obsidian Monolith
    const floorGeo = new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS - 4, 3.5, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x11081f,
      roughness: 0.2,
      metalness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -1.75;
    floor.receiveShadow = true;
    group.add(floor);
    disposables.push(floorGeo, floorMat);

    // Glowing Runic Sigil Floor Inlay
    const sigilRingGeo = new THREE.RingGeometry(8, 8.4, 48);
    const sigilMat = new THREE.MeshBasicMaterial({
      color: 0xaa00ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const sigilRing = new THREE.Mesh(sigilRingGeo, sigilMat);
    sigilRing.rotation.x = -Math.PI / 2;
    sigilRing.position.y = 0.02;
    group.add(sigilRing);

    const innerSigilGeo = new THREE.RingGeometry(3.5, 3.8, 36);
    const innerSigil = new THREE.Mesh(innerSigilGeo, sigilMat);
    innerSigil.rotation.x = -Math.PI / 2;
    innerSigil.position.y = 0.02;
    group.add(innerSigil);
    disposables.push(sigilRingGeo, innerSigilGeo, sigilMat);

    // Floating dark obsidian monolith spires around void
    const spireGeo = new THREE.ConeGeometry(1.2, 7.0, 4);
    const spireMat = new THREE.MeshStandardMaterial({
      color: 0x1f0b3b,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x581845,
      emissiveIntensity: 0.2,
    });
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const spire = new THREE.Mesh(spireGeo, spireMat);
      spire.position.set(
        Math.cos(angle) * (ARENA_RADIUS + 3.0),
        1.5,
        Math.sin(angle) * (ARENA_RADIUS + 3.0)
      );
      spire.rotation.x = 0.2;
      group.add(spire);
    }
    disposables.push(spireGeo, spireMat);

    // Lightning flash light
    const lightningLight = new THREE.DirectionalLight(0xd500f9, 0);
    lightningLight.position.set(10, 25, 10);
    group.add(lightningLight);

    // Storm Sparks & Void Energy Particles
    const stormCount = 240;
    const stormGeo = new THREE.BufferGeometry();
    const stormPositions = new Float32Array(stormCount * 3);
    for (let i = 0; i < stormCount; i++) {
      stormPositions[i * 3] = (Math.random() - 0.5) * 36;
      stormPositions[i * 3 + 1] = Math.random() * 12;
      stormPositions[i * 3 + 2] = (Math.random() - 0.5) * 36;
    }
    stormGeo.setAttribute('position', new THREE.BufferAttribute(stormPositions, 3));
    const stormMat = new THREE.PointsMaterial({
      color: 0xba68c8,
      size: 0.22,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const stormPoints = new THREE.Points(stormGeo, stormMat);
    group.add(stormPoints);
    disposables.push(stormGeo, stormMat);

    let lightningTimer = 0;
    let nextLightning = 2.5;

    updateFn = (delta: number) => {
      lightningTimer += delta;
      if (lightningTimer > nextLightning) {
        lightningLight.intensity = 4.5;
        setTimeout(() => {
          lightningLight.intensity = 0.5;
          setTimeout(() => {
            lightningLight.intensity = 3.0;
            setTimeout(() => {
              lightningLight.intensity = 0;
            }, 60);
          }, 80);
        }, 50);

        lightningTimer = 0;
        nextLightning = 2.0 + Math.random() * 4.0;
      }

      // Storm rain/sparks swirl
      const pos = stormGeo.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < stormCount; i++) {
        arr[i * 3 + 1] -= delta * 12.0; // Fast rain/spark drop
        arr[i * 3] += Math.sin(arr[i * 3 + 1] * 0.5) * 0.1;
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 12;
          arr[i * 3] = (Math.random() - 0.5) * 36;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 36;
        }
      }
      pos.needsUpdate = true;
    };
  }

  const dispose = () => {
    scene.remove(group);
    disposables.forEach((item) => item.dispose());
  };

  return {
    group,
    update: updateFn,
    dispose,
  };
}

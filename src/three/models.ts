import * as THREE from 'three';
import { CharacterDefinition } from '../data/characters';
import {
  DisasterId,
  FurnitureType,
  PredatorKind,
  RoomDef,
  RubbleBarrier,
} from '../types/game';
import { getDoorId, getDoorWorldTransform } from '../utils/gameEngine';
import { ProceduralTexturePack } from './textures';

const _unitBox = new THREE.BoxGeometry(1, 1, 1);

function createSquareRing(innerR: number, outerR: number, color: number, opacity = 0.82): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(innerR, outerR, 4),
    new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity,
      depthWrite: false,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.rotation.z = Math.PI / 4;
  return ring;
}

export function createSurvivorModel(
  shirtColor: number,
  shadowTex: THREE.Texture
): { group: THREE.Group; ring: THREE.Mesh; armR: THREE.Mesh } {
  const group = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.95),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  group.add(shadow);

  const ring = createSquareRing(0.46, 0.62, 0xf59e0b, 0.86);
  ring.position.y = 0.05;
  group.add(ring);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.85 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a788, roughness: 0.68 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2c2019, roughness: 0.88 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

  // Minecraft-style blocky legs
  const legL = new THREE.Mesh(_unitBox, legMat);
  legL.scale.set(0.22, 0.64, 0.24);
  legL.position.set(-0.12, 0.32, 0);
  legL.castShadow = true;
  group.add(legL);

  const legR = new THREE.Mesh(_unitBox, legMat);
  legR.scale.set(0.22, 0.64, 0.24);
  legR.position.set(0.12, 0.32, 0);
  legR.castShadow = true;
  group.add(legR);

  // Blocky torso
  const torso = new THREE.Mesh(_unitBox, shirtMat);
  torso.scale.set(0.48, 0.64, 0.26);
  torso.position.y = 0.96;
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  // Blocky arms
  const armL = new THREE.Mesh(_unitBox, shirtMat);
  armL.scale.set(0.19, 0.6, 0.22);
  armL.position.set(-0.34, 0.96, 0);
  armL.castShadow = true;
  group.add(armL);

  const armR = new THREE.Mesh(_unitBox, shirtMat);
  armR.scale.set(0.19, 0.6, 0.22);
  armR.position.set(0.34, 1.12, 0);
  armR.rotation.z = -0.65;
  armR.castShadow = true;
  group.add(armR);

  // Cubic Minecraft head + blocky hair + square pixel eyes
  const head = new THREE.Mesh(_unitBox, skinMat);
  head.scale.set(0.44, 0.44, 0.44);
  head.position.y = 1.5;
  head.castShadow = true;
  group.add(head);

  const hair = new THREE.Mesh(_unitBox, hairMat);
  hair.scale.set(0.47, 0.14, 0.47);
  hair.position.y = 1.67;
  hair.castShadow = true;
  group.add(hair);

  const hairBack = new THREE.Mesh(_unitBox, hairMat);
  hairBack.scale.set(0.46, 0.3, 0.12);
  hairBack.position.set(0, 1.53, -0.18);
  group.add(hairBack);

  for (const ex of [-0.1, 0.1]) {
    const eye = new THREE.Mesh(_unitBox, eyeMat);
    eye.scale.set(0.08, 0.06, 0.02);
    eye.position.set(ex, 1.5, 0.225);
    group.add(eye);
  }

  return { group, ring, armR };
}

export function createCacheModel(locked: boolean): {
  group: THREE.Group;
  lid: THREE.Group;
  beacon: THREE.Mesh;
} {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: locked ? 0x8a4d1e : 0x0f5c8a,
    roughness: 0.72,
    metalness: 0.15,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.5,
    metalness: 0.6,
  });

  const base = new THREE.Mesh(_unitBox, bodyMat);
  base.scale.set(1.04, 0.56, 0.78);
  base.position.y = 0.28;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const strapL = new THREE.Mesh(_unitBox, trimMat);
  strapL.scale.set(0.12, 0.58, 0.8);
  strapL.position.set(-0.34, 0.29, 0);
  group.add(strapL);

  const strapR = new THREE.Mesh(_unitBox, trimMat);
  strapR.scale.set(0.12, 0.58, 0.8);
  strapR.position.set(0.34, 0.29, 0);
  group.add(strapR);

  const lid = new THREE.Group();
  lid.position.set(0, 0.56, -0.39);
  const lidMesh = new THREE.Mesh(_unitBox, bodyMat);
  lidMesh.scale.set(1.04, 0.18, 0.78);
  lidMesh.position.set(0, 0.09, 0.39);
  lid.add(lidMesh);

  const latch = new THREE.Mesh(
    _unitBox,
    new THREE.MeshStandardMaterial({
      color: locked ? 0xfbbf24 : 0x38bdf8,
      emissive: locked ? 0xd97706 : 0x0284c7,
      emissiveIntensity: 0.7,
      roughness: 0.25,
      metalness: 0.75,
    })
  );
  latch.scale.set(0.2, 0.18, 0.08);
  latch.position.set(0, 0.02, 0.79);
  lid.add(latch);
  group.add(lid);

  const beacon = new THREE.Mesh(
    _unitBox,
    new THREE.MeshStandardMaterial({
      color: locked ? 0xfbbf24 : 0x38bdf8,
      emissive: locked ? 0xf59e0b : 0x0ea5e9,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    })
  );
  beacon.scale.set(0.24, 0.24, 0.24);
  beacon.position.y = 1.08;
  group.add(beacon);

  return { group, lid, beacon };
}

/**
 * Minecraft-style Voxel Tree (square oak/spruce log trunk + stacked square leaf block tiers)
 * or Stacked Cubic Cobblestone/Basalt/Magma Boulder Blocks.
 */
export function createSceneryProp(
  disasterId: DisasterId,
  textures?: ProceduralTexturePack
): THREE.Group {
  const g = new THREE.Group();
  if (
    disasterId === 'earthquake' ||
    disasterId === 'flood' ||
    disasterId === 'tsunami' ||
    disasterId === 'asteroid' ||
    disasterId === 'volcano' ||
    disasterId === 'landslide' ||
    disasterId === 'avalanche' ||
    disasterId === 'glof' ||
    disasterId === 'sinkhole' ||
    disasterId === 'storm_surge' ||
    disasterId === 'duststorm' ||
    disasterId === 'drought'
  ) {
    const isLavaRock = disasterId === 'asteroid' || disasterId === 'volcano';
    const isWaterRock =
      disasterId === 'flood' ||
      disasterId === 'tsunami' ||
      disasterId === 'storm_surge' ||
      disasterId === 'glof';
    const isDesertRock = disasterId === 'duststorm' || disasterId === 'drought';
    const isSnowRock = disasterId === 'avalanche';

    const stoneMat = new THREE.MeshStandardMaterial({
      map: textures?.wallConcrete ?? null,
      color: isLavaRock
        ? 0x452b30
        : isWaterRock
        ? 0x577580
        : isDesertRock
        ? 0xa87d4b
        : isSnowRock
        ? 0xdcebf7
        : 0x7d7a74,
      emissive: isLavaRock ? 0x7c1d18 : 0x000000,
      emissiveIntensity: isLavaRock ? 0.38 : 0,
      roughness: 0.92,
      metalness: 0.04,
    });
    const b1 = new THREE.Mesh(_unitBox, stoneMat);
    b1.scale.set(1.5, 1.0, 1.35);
    b1.position.set(0, 0.5, 0);
    b1.castShadow = true;
    b1.receiveShadow = true;
    g.add(b1);

    const b2 = new THREE.Mesh(_unitBox, stoneMat);
    b2.scale.set(0.9, 0.85, 0.9);
    b2.position.set(0.45, 1.05, 0.2);
    b2.castShadow = true;
    b2.receiveShadow = true;
    g.add(b2);

    const b3 = new THREE.Mesh(_unitBox, stoneMat);
    b3.scale.set(0.75, 0.6, 0.75);
    b3.position.set(-0.6, 0.3, -0.45);
    b3.castShadow = true;
    b3.receiveShadow = true;
    g.add(b3);
    return g;
  }

  const trunkMat = new THREE.MeshStandardMaterial({
    map: textures?.bark ?? null,
    color: textures ? 0xffffff : 0x5c4028,
    roughness: 0.94,
  });
  const leafColor =
    disasterId === 'blizzard' ||
    disasterId === 'heavy_snowfall' ||
    disasterId === 'coldwave'
      ? 0xdcebf7
      : disasterId === 'tornado' || disasterId === 'windstorm'
      ? 0x708245
      : disasterId === 'heatwave'
      ? 0x8f823f
      : disasterId === 'thunderstorm' || disasterId === 'hailstorm' || disasterId === 'severe_fog'
      ? 0x3b6352
      : 0x4b8f43;
  const leafMat = new THREE.MeshStandardMaterial({
    map: textures?.foliage ?? null,
    color: textures ? 0xeef5ed : leafColor,
    roughness: 0.88,
    metalness: 0.02,
  });

  // Square Minecraft Log Trunk
  const trunk = new THREE.Mesh(_unitBox, trunkMat);
  trunk.scale.set(0.62, 2.4, 0.62);
  trunk.position.y = 1.2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  g.add(trunk);

  // Stacked square Minecraft voxel leaf canopies
  const tiers = [
    { w: 2.6, h: 0.95, y: 2.45 },
    { w: 1.9, h: 0.95, y: 3.35 },
    { w: 1.15, h: 0.9, y: 4.2 },
  ];
  for (const t of tiers) {
    const tier = new THREE.Mesh(_unitBox, leafMat);
    tier.scale.set(t.w, t.h, t.w);
    tier.position.y = t.y;
    tier.castShadow = true;
    tier.receiveShadow = true;
    g.add(tier);
  }

  return g;
}

/**
 * Minecraft-Style Voxel Architectural Room Builder:
 * Oak Plank / Stone Brick / Quartz Block walls, stepped block entry stairs & blocky furniture.
 */
export function createRoomGroup(
  room: RoomDef,
  textures: ProceduralTexturePack,
  floorY = 0
): THREE.Group {
  const group = new THREE.Group();
  group.position.y = floorY;
  const halfW = room.w / 2;
  const halfD = room.d / 2;
  const wallT = 0.44;
  const doorH = 2.45;

  const floorTex =
    room.floorType === 'tile'
      ? textures.tileFloor
      : room.floorType === 'wood'
      ? textures.woodFloor
      : room.floorType === 'lodge'
      ? textures.lodgeFloor
      : textures.concreteFloor;

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: room.floorType === 'tile' ? 0.5 : 0.84,
    metalness: 0.04,
  });

  const floor = new THREE.Mesh(_unitBox, floorMat);
  floor.scale.set(room.w, 0.12, room.d);
  floor.position.set(room.x, 0.06, room.z);
  floor.receiveShadow = true;
  group.add(floor);

  const foundationMat = new THREE.MeshStandardMaterial({
    map: textures.wallConcrete,
    color: 0x7a8391,
    roughness: 0.92,
  });
  const foundation = new THREE.Mesh(_unitBox, foundationMat);
  foundation.scale.set(room.w + 0.3, 3.4, room.d + 0.3);
  foundation.position.set(room.x, -1.7, room.z);
  foundation.receiveShadow = true;
  group.add(foundation);

  // Minecraft-style stepped block stairs at every doorway
  for (const door of room.doors) {
    const steps = [
      { dist: 0.45, h: 0.65, y: -0.25 },
      { dist: 1.15, h: 0.5, y: -0.5 },
    ];
    for (const st of steps) {
      const stepMesh = new THREE.Mesh(_unitBox, foundationMat);
      if (door.side === 'north' || door.side === 'south') {
        const sign = door.side === 'south' ? 1 : -1;
        stepMesh.scale.set(door.width + 0.3, st.h, 0.72);
        stepMesh.position.set(room.x + door.offset, st.y, room.z + sign * (halfD + st.dist));
      } else {
        const sign = door.side === 'east' ? 1 : -1;
        stepMesh.scale.set(0.72, st.h, door.width + 0.3);
        stepMesh.position.set(room.x + sign * (halfW + st.dist), st.y, room.z + door.offset);
      }
      stepMesh.receiveShadow = true;
      group.add(stepMesh);
    }
  }

  const ceilingMat = new THREE.MeshStandardMaterial({
    map: textures.wallConcrete,
    color: 0x94a3b8,
    roughness: 0.88,
    metalness: 0.05,
  });
  const ceiling = new THREE.Mesh(_unitBox, ceilingMat);
  ceiling.scale.set(room.w + 0.65, 0.28, room.d + 0.65);
  ceiling.position.set(room.x, room.wallHeight + 0.14, room.z);
  ceiling.castShadow = true;
  ceiling.receiveShadow = true;
  group.add(ceiling);

  const roofTrim = new THREE.Mesh(
    _unitBox,
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65, metalness: 0.2 })
  );
  roofTrim.scale.set(room.w + 0.85, 0.16, room.d + 0.85);
  roofTrim.position.set(room.x, room.wallHeight + 0.32, room.z);
  roofTrim.castShadow = true;
  group.add(roofTrim);

  const isHospital = room.buildingType === 'hospital';
  const isSupermarket = room.buildingType === 'supermarket';

  // Glowing Glowstone / Sea-Lantern Ceiling Block
  const lightStrip = new THREE.Mesh(
    _unitBox,
    new THREE.MeshStandardMaterial({
      color: isHospital ? 0xe0f2fe : isSupermarket ? 0xd1fae5 : room.isShelter ? 0xfef3c7 : 0xe2e8f0,
      emissive: isHospital ? 0x38bdf8 : isSupermarket ? 0x34d399 : room.isShelter ? 0xf59e0b : 0x94a3b8,
      emissiveIntensity: isHospital || isSupermarket || room.isShelter ? 1.2 : 0.6,
    })
  );
  lightStrip.scale.set(1.1, 0.12, 1.1);
  lightStrip.position.set(room.x, room.wallHeight - 0.04, room.z);
  group.add(lightStrip);

  // Distinct Exterior Features & Rooftop Signs for Hospitals and Supermarkets
  if (isHospital) {
    const crossMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.75,
      roughness: 0.35,
    });
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.45,
    });
    const trimBand = new THREE.Mesh(_unitBox, bandMat);
    trimBand.scale.set(room.w + 0.55, 0.22, room.d + 0.55);
    trimBand.position.set(room.x, room.wallHeight - 0.12, room.z);
    group.add(trimBand);

    // Rooftop Red Cross emblem
    const crossV = new THREE.Mesh(_unitBox, crossMat);
    crossV.scale.set(0.42, 1.3, 0.42);
    crossV.position.set(room.x, room.wallHeight + 1.05, room.z);
    group.add(crossV);
    const crossH = new THREE.Mesh(_unitBox, crossMat);
    crossH.scale.set(1.3, 0.42, 0.42);
    crossH.position.set(room.x, room.wallHeight + 1.05, room.z);
    group.add(crossH);

    const hospSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: getNameTagTexture('🏥', 'HOSPITAL', 'MEDKITS INSIDE', '#fb7185'),
        transparent: true,
        depthTest: true,
      })
    );
    hospSprite.position.set(room.x, room.wallHeight + 2.35, room.z);
    hospSprite.scale.set(3.4, 1.15, 1);
    group.add(hospSprite);
  } else if (isSupermarket) {
    const marketMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.5,
      roughness: 0.45,
    });
    const awningMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.55,
    });
    const fascia = new THREE.Mesh(_unitBox, marketMat);
    fascia.scale.set(room.w + 0.65, 0.3, room.d + 0.65);
    fascia.position.set(room.x, room.wallHeight - 0.08, room.z);
    group.add(fascia);

    // Doorway canopies
    for (const door of room.doors) {
      const isHoriz = door.side === 'north' || door.side === 'south';
      const awning = new THREE.Mesh(_unitBox, awningMat);
      if (isHoriz) {
        const sign = door.side === 'south' ? 1 : -1;
        awning.scale.set(door.width + 0.6, 0.18, 0.9);
        awning.position.set(room.x + door.offset, 2.65, room.z + sign * (halfD + 0.42));
      } else {
        const sign = door.side === 'east' ? 1 : -1;
        awning.scale.set(0.9, 0.18, door.width + 0.6);
        awning.position.set(room.x + sign * (halfW + 0.42), 2.65, room.z + door.offset);
      }
      group.add(awning);
    }

    const marketSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: getNameTagTexture('🛒', 'SUPERMARKET', 'FOOD INSIDE', '#34d399'),
        transparent: true,
        depthTest: true,
      })
    );
    marketSprite.position.set(room.x, room.wallHeight + 2.15, room.z);
    marketSprite.scale.set(3.6, 1.2, 1);
    group.add(marketSprite);
  }

  const wallTex =
    room.floorType === 'wood' || room.floorType === 'lodge'
      ? textures.wallWood
      : room.floorType === 'tile'
      ? textures.wallPlaster
      : textures.wallConcrete;

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    bumpMap: textures.wallBump,
    bumpScale: 0.03,
    color: isHospital ? 0xf8fafc : isSupermarket ? 0xecfdf5 : room.floorType === 'tile' ? 0xffffff : room.wallColor,
    roughness: 0.86,
    metalness: 0.02,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    map: textures.bark,
    color: isHospital ? 0x0284c7 : isSupermarket ? 0x059669 : 0x4b382a,
    roughness: 0.82,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.15,
    metalness: 0.15,
    transparent: true,
    opacity: 0.36,
  });

  const buildWallSide = (
    side: 'north' | 'south' | 'east' | 'west',
    fixedCoord: number,
    centerAlong: number,
    totalLen: number
  ) => {
    const isHoriz = side === 'north' || side === 'south';
    const doors = (room.doors || []).filter((d) => d.side === side);
    const windows = (room.windows || []).filter((w) => w.side === side);

    type Opening = { offset: number; width: number; kind: 'door' | 'window' };
    const openings: Opening[] = [
      ...doors.map((d) => ({ offset: d.offset, width: d.width, kind: 'door' as const })),
      ...windows.map((w) => ({ offset: w.offset, width: w.width, kind: 'window' as const })),
    ].sort((a, b) => a.offset - b.offset);

    const start = centerAlong - totalLen / 2;
    const end = centerAlong + totalLen / 2;
    let cursor = start;

    const placeSegment = (
      segStart: number,
      segEnd: number,
      yBottom: number,
      height: number,
      mat: THREE.Material,
      extraThick = 0
    ) => {
      const len = segEnd - segStart;
      if (len < 0.08) return;
      const mid = segStart + len / 2;
      const t = wallT + extraThick;
      const mesh = new THREE.Mesh(_unitBox, mat);
      mesh.scale.set(isHoriz ? len : t, height, isHoriz ? t : len);
      mesh.position.set(
        isHoriz ? mid : fixedCoord,
        yBottom + height / 2,
        isHoriz ? fixedCoord : mid
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    };

    for (const op of openings) {
      const gStart = Math.max(start, centerAlong + op.offset - op.width / 2);
      const gEnd = Math.min(end, centerAlong + op.offset + op.width / 2);

      placeSegment(cursor, gStart, 0, room.wallHeight, wallMat);
      placeSegment(cursor, gStart, 0, 0.16, trimMat, 0.05);

      if (op.kind === 'door') {
        placeSegment(gStart, gEnd, doorH, room.wallHeight - doorH, wallMat);
        const postW = 0.14;
        placeSegment(gStart, gStart + postW, 0, doorH, trimMat, 0.05);
        placeSegment(gEnd - postW, gEnd, 0, doorH, trimMat, 0.05);
        placeSegment(gStart, gEnd, doorH - 0.14, 0.14, trimMat, 0.05);
      } else {
        placeSegment(gStart, gEnd, 0, 0.95, wallMat);
        placeSegment(gStart, gEnd, 0, 0.16, trimMat, 0.05);
        placeSegment(gStart, gEnd, 0.92, 0.1, trimMat, 0.06);
        placeSegment(gStart, gEnd, 2.25, room.wallHeight - 2.25, wallMat);

        const glassLen = gEnd - gStart;
        const mid = gStart + glassLen / 2;
        const glass = new THREE.Mesh(_unitBox, glassMat);
        glass.scale.set(isHoriz ? glassLen : 0.08, 1.3, isHoriz ? 0.08 : glassLen);
        glass.position.set(isHoriz ? mid : fixedCoord, 1.6, isHoriz ? fixedCoord : mid);
        group.add(glass);

        const mullion = new THREE.Mesh(_unitBox, trimMat);
        mullion.scale.set(isHoriz ? 0.1 : 0.16, 1.3, isHoriz ? 0.16 : 0.1);
        mullion.position.set(isHoriz ? mid : fixedCoord, 1.6, isHoriz ? fixedCoord : mid);
        group.add(mullion);
      }

      cursor = Math.max(cursor, gEnd);
    }

    placeSegment(cursor, end, 0, room.wallHeight, wallMat);
    placeSegment(cursor, end, 0, 0.16, trimMat, 0.05);
  };

  buildWallSide('north', room.z - halfD, room.x, room.w);
  buildWallSide('south', room.z + halfD, room.x, room.w);
  buildWallSide('west', room.x - halfW, room.z, room.d);
  buildWallSide('east', room.x + halfW, room.z, room.d);

  for (const item of room.furniture) {
    const prop = createFurnitureMesh(item.type);
    prop.position.set(item.x, 0.12, item.z);
    if (item.rotY) prop.rotation.y = item.rotY;
    group.add(prop);
  }

  return group;
}

export interface BuiltDoorInstance {
  doorId: string;
  roomName: string;
  isShelter: boolean;
  worldX: number;
  worldZ: number;
  isHoriz: boolean;
  width: number;
  leftPivot: THREE.Group;
  rightPivot: THREE.Group;
}

/**
 * Builds physical double-leaf hinged Minecraft-style doors inside every RoomDef doorway.
 * Oriented so local +Z points outward; swinging leftPivot (-rotY) & rightPivot (+rotY) opens outward.
 */
export function createRoomDoorSet(
  room: RoomDef,
  textures: ProceduralTexturePack,
  floorY = 0
): { group: THREE.Group; doors: BuiltDoorInstance[] } {
  const group = new THREE.Group();
  const doors: BuiltDoorInstance[] = [];

  const leafMat = new THREE.MeshStandardMaterial({
    map: room.isShelter ? textures.wallConcrete : textures.wallWood,
    color: room.isShelter ? 0x475569 : 0x8b5a34,
    roughness: room.isShelter ? 0.48 : 0.78,
    metalness: room.isShelter ? 0.42 : 0.06,
  });

  const braceMat = new THREE.MeshStandardMaterial({
    color: room.isShelter ? 0x1e293b : 0x4b321d,
    roughness: 0.72,
    metalness: room.isShelter ? 0.35 : 0.08,
  });

  const handleMat = new THREE.MeshStandardMaterial({
    color: room.isShelter ? 0xe2e8f0 : 0xfbbf24,
    roughness: 0.25,
    metalness: 0.8,
  });

  const windowGlassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.14,
    metalness: 0.15,
    transparent: true,
    opacity: 0.44,
  });

  const doorH = 2.18;
  const leafThick = 0.12;

  room.doors.forEach((door, idx) => {
    const doorId = getDoorId(room, door, idx);
    const tr = getDoorWorldTransform(room, door);

    const frame = new THREE.Group();
    frame.position.set(tr.x, floorY + 0.12, tr.z);
    frame.rotation.y = tr.rotY;

    const clearW = Math.max(0.8, door.width - 0.28);
    const leafW = clearW / 2 - 0.015;

    const buildLeaf = (dirSign: 1 | -1): THREE.Group => {
      const pivot = new THREE.Group();
      pivot.position.set(-dirSign * (clearW / 2), 0, 0);

      const centerX = dirSign * (leafW / 2);

      // Lower solid oak / steel panel
      const lowerPanel = new THREE.Mesh(_unitBox, leafMat);
      lowerPanel.scale.set(leafW, 1.24, leafThick);
      lowerPanel.position.set(centerX, 0.62, 0);
      lowerPanel.castShadow = true;
      lowerPanel.receiveShadow = true;
      pivot.add(lowerPanel);

      // Upper side stiles & top header framing the window cutout
      const outerStile = new THREE.Mesh(_unitBox, leafMat);
      outerStile.scale.set(0.2, 0.94, leafThick);
      outerStile.position.set(dirSign * 0.1, 1.71, 0);
      outerStile.castShadow = true;
      pivot.add(outerStile);

      const innerStile = new THREE.Mesh(_unitBox, leafMat);
      innerStile.scale.set(0.2, 0.94, leafThick);
      innerStile.position.set(dirSign * (leafW - 0.1), 1.71, 0);
      innerStile.castShadow = true;
      pivot.add(innerStile);

      const topRail = new THREE.Mesh(_unitBox, leafMat);
      topRail.scale.set(leafW, 0.22, leafThick);
      topRail.position.set(centerX, doorH - 0.11, 0);
      topRail.castShadow = true;
      pivot.add(topRail);

      // Frosted glass observation pane
      const paneW = Math.max(0.2, leafW - 0.4);
      const glassPane = new THREE.Mesh(_unitBox, windowGlassMat);
      glassPane.scale.set(paneW, 0.72, 0.04);
      glassPane.position.set(centerX, 1.6, 0);
      pivot.add(glassPane);

      // Cross-brace / safety stripe trim
      const brace = new THREE.Mesh(_unitBox, braceMat);
      brace.scale.set(leafW + 0.01, 0.12, leafThick + 0.03);
      brace.position.set(centerX, 1.18, 0);
      pivot.add(brace);

      // Dual-sided metallic lever handles near meeting center
      const handleX = dirSign * Math.max(0.18, leafW - 0.16);
      const handleBar = new THREE.Mesh(_unitBox, handleMat);
      handleBar.scale.set(0.16, 0.06, leafThick + 0.11);
      handleBar.position.set(handleX, 1.0, 0);
      pivot.add(handleBar);

      const latchPlate = new THREE.Mesh(_unitBox, handleMat);
      latchPlate.scale.set(0.08, 0.18, leafThick + 0.04);
      latchPlate.position.set(dirSign * (leafW - 0.12), 1.0, 0);
      pivot.add(latchPlate);

      return pivot;
    };

    const leftPivot = buildLeaf(1);
    const rightPivot = buildLeaf(-1);
    frame.add(leftPivot);
    frame.add(rightPivot);
    group.add(frame);

    doors.push({
      doorId,
      roomName: room.name,
      isShelter: room.isShelter,
      worldX: tr.x,
      worldZ: tr.z,
      isHoriz: tr.isHoriz,
      width: door.width,
      leftPivot,
      rightPivot,
    });
  });

  return { group, doors };
}

function createFurnitureMesh(type: FurnitureType): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c512d, roughness: 0.8 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.55 });

  if (type === 'bed') {
    const frame = new THREE.Mesh(_unitBox, woodMat);
    frame.scale.set(1.75, 0.3, 0.98);
    frame.position.y = 0.22;
    g.add(frame);
    const mattress = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.85 })
    );
    mattress.scale.set(1.66, 0.2, 0.9);
    mattress.position.y = 0.46;
    g.add(mattress);
    const blanket = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.9 })
    );
    blanket.scale.set(1.08, 0.22, 0.92);
    blanket.position.set(0.28, 0.47, 0);
    g.add(blanket);
    const pillow = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 })
    );
    pillow.scale.set(0.38, 0.12, 0.68);
    pillow.position.set(-0.55, 0.6, 0);
    g.add(pillow);
  } else if (type === 'desk' || type === 'workbench') {
    const top = new THREE.Mesh(_unitBox, type === 'workbench' ? metalMat : woodMat);
    top.scale.set(type === 'workbench' ? 1.85 : 1.35, 0.14, 0.82);
    top.position.y = 0.78;
    g.add(top);
    for (const lx of [-0.55, 0.55]) {
      for (const lz of [-0.3, 0.3]) {
        const leg = new THREE.Mesh(_unitBox, woodMat);
        leg.scale.set(0.12, 0.76, 0.12);
        leg.position.set(lx, 0.38, lz);
        g.add(leg);
      }
    }
    const monitor = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: 0x0ea5e9,
        emissiveIntensity: 0.3,
        roughness: 0.4,
      })
    );
    monitor.scale.set(0.44, 0.32, 0.14);
    monitor.position.set(0, 1.0, -0.18);
    g.add(monitor);
  } else if (type === 'shelf') {
    const back = new THREE.Mesh(_unitBox, woodMat);
    back.scale.set(1.3, 1.8, 0.12);
    back.position.set(0, 0.9, -0.28);
    g.add(back);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.78 });
    for (const sy of [0.25, 0.85, 1.45]) {
      const plank = new THREE.Mesh(_unitBox, woodMat);
      plank.scale.set(1.3, 0.1, 0.56);
      plank.position.set(0, sy, 0);
      g.add(plank);
      const box = new THREE.Mesh(_unitBox, boxMat);
      box.scale.set(0.34, 0.28, 0.34);
      box.position.set(-0.3 + (sy > 1 ? 0.5 : 0), sy + 0.18, 0);
      g.add(box);
    }
  } else if (type === 'heater') {
    // Classic Minecraft Square Furnace Block!
    const furnace = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({ color: 0x525866, roughness: 0.85 })
    );
    furnace.scale.set(0.86, 0.92, 0.86);
    furnace.position.y = 0.46;
    g.add(furnace);
    const ember = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 1.5,
      })
    );
    ember.scale.set(0.44, 0.28, 0.08);
    ember.position.set(0, 0.32, 0.42);
    g.add(ember);
    const pipe = new THREE.Mesh(_unitBox, metalMat);
    pipe.scale.set(0.24, 1.8, 0.24);
    pipe.position.y = 1.8;
    g.add(pipe);
  }
  return g;
}

export function createRubbleModel(
  rubble: RubbleBarrier,
  disasterId: DisasterId,
  textures?: ProceduralTexturePack
): THREE.Group {
  const g = new THREE.Group();
  const color =
    disasterId === 'blizzard'
      ? 0xe2eef8
      : disasterId === 'wildfire'
      ? 0x5c4028
      : disasterId === 'flood' || disasterId === 'tsunami'
      ? 0x7c5c3e
      : disasterId === 'asteroid'
      ? 0x3b2c30
      : disasterId === 'tornado'
      ? 0x6b5b45
      : 0x717882;

  const mat = new THREE.MeshStandardMaterial({
    map: textures?.wallConcrete ?? null,
    color,
    roughness: 0.92,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color:
      disasterId === 'wildfire' || disasterId === 'asteroid'
        ? 0xf97316
        : disasterId === 'thunderstorm'
        ? 0x38bdf8
        : 0xf59e0b,
    emissive:
      disasterId === 'wildfire' || disasterId === 'asteroid'
        ? 0x9a3412
        : disasterId === 'thunderstorm'
        ? 0x0284c7
        : 0x78350f,
    emissiveIntensity: 0.45,
    roughness: 0.7,
  });

  const block1 = new THREE.Mesh(_unitBox, mat);
  block1.scale.set(1.4, 0.95, 1.1);
  block1.position.set(-0.75, 0.48, 0.05);
  block1.castShadow = true;
  block1.receiveShadow = true;
  g.add(block1);

  const block2 = new THREE.Mesh(_unitBox, mat);
  block2.scale.set(1.3, 0.85, 1.05);
  block2.position.set(0.7, 0.42, -0.1);
  block2.castShadow = true;
  block2.receiveShadow = true;
  g.add(block2);

  const beam = new THREE.Mesh(_unitBox, accentMat);
  beam.scale.set(rubble.w * 0.85, 0.34, 0.42);
  beam.position.set(0, 0.95, 0);
  beam.castShadow = true;
  g.add(beam);

  return g;
}

export function createExtractionPad(
  pos: { x: number; z: number },
  textures: ProceduralTexturePack,
  padY = 0
): { group: THREE.Group; ring: THREE.Mesh; pillar: THREE.Mesh } {
  const group = new THREE.Group();
  group.position.set(pos.x, padY, pos.z);

  const plinth = new THREE.Mesh(
    _unitBox,
    new THREE.MeshStandardMaterial({
      map: textures.wallConcrete,
      color: 0x525d6e,
      roughness: 0.92,
    })
  );
  plinth.scale.set(5.0, 3.4, 5.0);
  plinth.position.y = -1.7;
  plinth.receiveShadow = true;
  group.add(plinth);

  const pad = new THREE.Mesh(
    _unitBox,
    new THREE.MeshStandardMaterial({ map: textures.helipad, roughness: 0.65, metalness: 0.1 })
  );
  pad.scale.set(4.8, 0.18, 4.8);
  pad.position.y = 0.09;
  pad.receiveShadow = true;
  group.add(pad);

  // Corner Minecraft Sea-Lantern Beacon Posts
  const cornerMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 0.9,
    roughness: 0.3,
  });
  for (const cx of [-2.15, 2.15]) {
    for (const cz of [-2.15, 2.15]) {
      const post = new THREE.Mesh(_unitBox, cornerMat);
      post.scale.set(0.32, 0.48, 0.32);
      post.position.set(cx, 0.32, cz);
      group.add(post);
    }
  }

  const ring = createSquareRing(2.55, 2.85, 0x10b981, 0.85);
  ring.position.y = 0.2;
  group.add(ring);

  const pillar = new THREE.Mesh(
    _unitBox,
    new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  pillar.scale.set(0.35, 18, 0.35);
  pillar.position.y = 9;
  group.add(pillar);

  return { group, ring, pillar };
}

const nameTagTexCache = new Map<string, THREE.CanvasTexture>();

function getNameTagTexture(
  emoji: string,
  label: string,
  sublabel: string | null,
  accentHex: string
): THREE.CanvasTexture {
  const cacheKey = `${emoji}:${label}:${sublabel ?? ''}:${accentHex}`;
  const existing = nameTagTexCache.get(cacheKey);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 384, 128);

    // Blocky Minecraft-style crisp square plaque with pixel border
    ctx.fillStyle = 'rgba(11, 17, 27, 0.94)';
    ctx.fillRect(10, 12, 364, 104);
    ctx.lineWidth = 6;
    ctx.strokeStyle = accentHex;
    ctx.strokeRect(10, 12, 364, 104);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px "JetBrains Mono", monospace';
    ctx.fillText(`${emoji} ${label}`, 192, sublabel ? 48 : 65);

    if (sublabel) {
      ctx.fillStyle = accentHex;
      ctx.font = 'bold 23px "JetBrains Mono", monospace';
      ctx.fillText(sublabel, 192, 88);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  nameTagTexCache.set(cacheKey, tex);
  return tex;
}

const PICKUP_PALETTE: Record<string, { color: number; hex: string }> = {
  medkit: { color: 0xf43f5e, hex: '#fb7185' },
  food: { color: 0x22c55e, hex: '#4ade80' },
  tool: { color: 0xf59e0b, hex: '#fbbf24' },
  flare: { color: 0xf97316, hex: '#fb923c' },
  gear: { color: 0x10b981, hex: '#34d399' },
};

/**
 * Floating Minecraft Block Pickup: square halo + spinning voxel crate cube + Name Tag.
 */
export function createGroundPickupModel(
  emoji: string,
  label: string,
  itemType: string
): { group: THREE.Group; bobGroup: THREE.Group; ring: THREE.Mesh } {
  const palette = PICKUP_PALETTE[itemType] || PICKUP_PALETTE.food;
  const group = new THREE.Group();

  const ring = createSquareRing(0.42, 0.62, palette.color, 0.8);
  ring.position.y = 0.05;
  group.add(ring);

  const bobGroup = new THREE.Group();
  bobGroup.position.y = 0.62;

  const core = new THREE.Mesh(
    _unitBox,
    new THREE.MeshStandardMaterial({
      color: palette.color,
      emissive: palette.color,
      emissiveIntensity: 0.7,
      roughness: 0.35,
      metalness: 0.2,
    })
  );
  core.scale.set(0.42, 0.42, 0.42);
  bobGroup.add(core);

  const band = new THREE.Mesh(
    _unitBox,
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.5,
    })
  );
  band.scale.set(0.46, 0.1, 0.46);
  bobGroup.add(band);

  const spriteMat = new THREE.SpriteMaterial({
    map: getNameTagTexture(emoji, label, null, palette.hex),
    transparent: true,
    depthTest: true,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.y = 0.62;
  sprite.scale.set(1.55, 0.52, 1);
  bobGroup.add(sprite);

  group.add(bobGroup);

  return { group, bobGroup, ring };
}

/**
 * Indoor Hospital Medkit or Supermarket Food Pedestal Station.
 */
export function createBuildingSupplyModel(
  itemType: 'medkit' | 'food'
): { group: THREE.Group; bobGroup: THREE.Group; ring: THREE.Mesh } {
  const isMed = itemType === 'medkit';
  const accentColor = isMed ? 0xf43f5e : 0x22c55e;
  const accentHex = isMed ? '#fb7185' : '#4ade80';

  const group = new THREE.Group();

  // Multi-tier Hospital Medical Shelf or Supermarket Grocery Shelf
  const frameMat = new THREE.MeshStandardMaterial({
    color: isMed ? 0xcbd5e1 : 0x6b4423,
    roughness: isMed ? 0.45 : 0.82,
    metalness: isMed ? 0.35 : 0.05,
  });
  const plankMat = new THREE.MeshStandardMaterial({
    color: isMed ? 0xf1f5f9 : 0x8c5c32,
    roughness: isMed ? 0.5 : 0.78,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: isMed ? 0x0284c7 : 0x059669,
    emissive: isMed ? 0x0369a1 : 0x047857,
    emissiveIntensity: 0.25,
    roughness: 0.5,
  });

  // Back panel
  const back = new THREE.Mesh(_unitBox, frameMat);
  back.scale.set(1.36, 1.86, 0.08);
  back.position.set(0, 0.93, -0.26);
  back.castShadow = true;
  back.receiveShadow = true;
  group.add(back);

  // 4 vertical corner posts
  for (const px of [-0.64, 0.64]) {
    for (const pz of [-0.26, 0.26]) {
      const post = new THREE.Mesh(_unitBox, frameMat);
      post.scale.set(0.08, 1.88, 0.08);
      post.position.set(px, 0.94, pz);
      post.castShadow = true;
      group.add(post);
    }
  }

  // Top sign header strip
  const headerBar = new THREE.Mesh(_unitBox, trimMat);
  headerBar.scale.set(1.38, 0.14, 0.58);
  headerBar.position.set(0, 1.88, 0);
  headerBar.castShadow = true;
  group.add(headerBar);

  // 3 Shelf Planks: lower (y=0.38), middle collectible shelf (y=0.96), upper (y=1.50)
  for (const sy of [0.38, 0.96, 1.50]) {
    const plank = new THREE.Mesh(_unitBox, plankMat);
    plank.scale.set(1.32, 0.08, 0.56);
    plank.position.set(0, sy, 0);
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);
  }

  // Decorative background stock on bottom & top shelves so the rack looks fully stocked
  const decorColors = isMed
    ? [0xe0f2fe, 0xbae6fd, 0xfecdd3]
    : [0xfde68a, 0xfca5a5, 0x86efac];
  for (const [dx, dy, colIdx] of [
    [-0.38, 0.54, 0],
    [0.05, 0.53, 1],
    [0.40, 0.55, 2],
    [-0.35, 1.66, 2],
    [0.34, 1.66, 0],
  ] as Array<[number, number, number]>) {
    const stock = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({
        color: decorColors[colIdx],
        roughness: 0.65,
      })
    );
    stock.scale.set(0.24, 0.24, 0.24);
    stock.position.set(dx, dy, -0.04);
    stock.castShadow = true;
    group.add(stock);
  }

  // Floor highlight marker right in front of the shelf
  const ring = createSquareRing(0.56, 0.72, accentColor, 0.85);
  ring.position.set(0, 0.04, 0.1);
  group.add(ring);

  // Collectible item group seated squarely ON the middle shelf plank (plank top = 1.00)
  const bobGroup = new THREE.Group();
  bobGroup.position.set(0, 1.18, 0.04);

  if (isMed) {
    const caseMesh = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0x334155,
        emissiveIntensity: 0.22,
        roughness: 0.3,
      })
    );
    caseMesh.scale.set(0.48, 0.32, 0.34);
    caseMesh.castShadow = true;
    bobGroup.add(caseMesh);

    const crossMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    });
    const crossH = new THREE.Mesh(_unitBox, crossMat);
    crossH.scale.set(0.26, 0.09, 0.37);
    bobGroup.add(crossH);
    const crossV = new THREE.Mesh(_unitBox, crossMat);
    crossV.scale.set(0.09, 0.22, 0.37);
    bobGroup.add(crossV);

    // Secondary pill bottle next to medkit on the same shelf
    const bottle = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35 })
    );
    bottle.scale.set(0.14, 0.22, 0.14);
    bottle.position.set(0.36, -0.05, 0);
    bobGroup.add(bottle);
  } else {
    const crateMesh = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        emissive: 0x15803d,
        emissiveIntensity: 0.35,
        roughness: 0.6,
      })
    );
    crateMesh.scale.set(0.5, 0.26, 0.36);
    crateMesh.castShadow = true;
    bobGroup.add(crateMesh);

    const appleMesh = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.4 })
    );
    appleMesh.scale.set(0.15, 0.15, 0.15);
    appleMesh.position.set(-0.12, 0.18, 0.05);
    bobGroup.add(appleMesh);

    const breadMesh = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xd97706, emissiveIntensity: 0.35 })
    );
    breadMesh.scale.set(0.2, 0.13, 0.15);
    breadMesh.position.set(0.11, 0.17, -0.03);
    bobGroup.add(breadMesh);

    // Cereal / food carton next to basket on the same shelf
    const carton = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.3 })
    );
    carton.scale.set(0.16, 0.26, 0.14);
    carton.position.set(-0.36, -0.02, 0);
    bobGroup.add(carton);
  }

  const tagSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getNameTagTexture(
        isMed ? '🏥' : '🍎',
        isMed ? 'MEDKIT SHELF' : 'FOOD SHELF',
        isMed ? 'HOSPITAL SUPPLY' : 'SUPERMARKET SUPPLY',
        accentHex
      ),
      transparent: true,
      depthTest: true,
    })
  );
  tagSprite.position.y = 1.02;
  tagSprite.scale.set(1.75, 0.58, 1);
  bobGroup.add(tagSprite);

  group.add(bobGroup);

  return { group, bobGroup, ring };
}

/**
 * First-Person Blocky Tactical Flashlight + Soft Beam Cone.
 */
export function createFirstPersonFlashlightModel(): {
  group: THREE.Group;
  lens: THREE.Mesh;
  beam: THREE.Mesh;
} {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.42,
    metalness: 0.72,
  });
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.32,
    metalness: 0.6,
  });

  const barrel = new THREE.Mesh(_unitBox, bodyMat);
  barrel.scale.set(0.065, 0.065, 0.28);
  group.add(barrel);

  const headBezel = new THREE.Mesh(_unitBox, bezelMat);
  headBezel.scale.set(0.088, 0.088, 0.075);
  headBezel.position.set(0, 0, -0.155);
  group.add(headBezel);

  const lens = new THREE.Mesh(
    _unitBox,
    new THREE.MeshBasicMaterial({ color: 0xfef9c3 })
  );
  lens.scale.set(0.068, 0.068, 0.015);
  lens.position.set(0, 0, -0.195);
  group.add(lens);

  const beamGeo = new THREE.ConeGeometry(1.15, 5.2, 16, 1, true);
  beamGeo.translate(0, -2.6, 0);
  beamGeo.rotateX(Math.PI / 2);
  const beam = new THREE.Mesh(
    beamGeo,
    new THREE.MeshBasicMaterial({
      color: 0xfef3c7,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  beam.position.set(0, 0, -0.2);
  beam.visible = false;
  group.add(beam);

  return { group, lens, beam };
}

/**
 * Ground Landing Beacon Ring for the Day-2 Rescue Helicopter.
 */
export function createHelicopterLandingBeacon(): {
  group: THREE.Group;
  ring: THREE.Mesh;
  pillar: THREE.Mesh;
} {
  const group = new THREE.Group();

  const pad = new THREE.Mesh(
    _unitBox,
    new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      emissive: 0x047857,
      emissiveIntensity: 0.55,
      roughness: 0.7,
    })
  );
  pad.scale.set(4.8, 0.12, 4.8);
  pad.position.y = 0.06;
  group.add(pad);

  const ring = createSquareRing(2.65, 3.05, 0x10b981, 0.9);
  ring.position.y = 0.16;
  group.add(ring);

  const pillar = new THREE.Mesh(
    _unitBox,
    new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  pillar.scale.set(0.4, 24, 0.4);
  pillar.position.y = 12;
  group.add(pillar);

  return { group, ring, pillar };
}

/**
 * Floating 30-second Voxel Ground Gun Pickup + Name Tag.
 */
export function createGroundGunModel(
  emoji: string,
  name: string,
  colorNum: number,
  colorHex: string
): { group: THREE.Group; bobGroup: THREE.Group; ring: THREE.Mesh } {
  const group = new THREE.Group();

  const ring = createSquareRing(0.48, 0.72, colorNum, 0.85);
  ring.position.y = 0.055;
  group.add(ring);

  const bobGroup = new THREE.Group();
  bobGroup.position.y = 0.58;

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.65,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: colorNum,
    emissive: colorNum,
    emissiveIntensity: 0.85,
    roughness: 0.3,
    metalness: 0.4,
  });

  const receiver = new THREE.Mesh(_unitBox, metalMat);
  receiver.scale.set(0.16, 0.16, 0.62);
  bobGroup.add(receiver);

  const barrel = new THREE.Mesh(_unitBox, metalMat);
  barrel.scale.set(0.08, 0.08, 0.52);
  barrel.position.set(0, 0.03, -0.45);
  bobGroup.add(barrel);

  const stock = new THREE.Mesh(_unitBox, metalMat);
  stock.scale.set(0.12, 0.18, 0.28);
  stock.position.set(0, -0.02, 0.36);
  bobGroup.add(stock);

  const grip = new THREE.Mesh(_unitBox, metalMat);
  grip.scale.set(0.1, 0.24, 0.12);
  grip.position.set(0, -0.15, 0.12);
  bobGroup.add(grip);

  const energyStrip = new THREE.Mesh(_unitBox, accentMat);
  energyStrip.scale.set(0.18, 0.06, 0.44);
  energyStrip.position.set(0, 0.07, -0.08);
  bobGroup.add(energyStrip);

  const tagSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getNameTagTexture(emoji, name, 'WEAPON · 30s', colorHex),
      transparent: true,
      depthTest: true,
    })
  );
  tagSprite.position.y = 0.68;
  tagSprite.scale.set(1.85, 0.62, 1);
  bobGroup.add(tagSprite);

  group.add(bobGroup);

  return { group, bobGroup, ring };
}

/**
 * First-Person Voxel Tactical Gun Viewmodel built cleanly out of Minecraft blocks.
 */
export function createFirstPersonGunModel(textures?: ProceduralTexturePack): {
  group: THREE.Group;
  muzzleFlash: THREE.Mesh;
  energyRail: THREE.Mesh;
} {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    bumpMap: textures?.wallBump ?? null,
    bumpScale: 0.015,
    roughness: 0.45,
    metalness: 0.65,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.32,
    metalness: 0.8,
  });

  const receiver = new THREE.Mesh(_unitBox, bodyMat);
  receiver.scale.set(0.095, 0.11, 0.46);
  group.add(receiver);

  const shroud = new THREE.Mesh(_unitBox, bodyMat);
  shroud.scale.set(0.08, 0.08, 0.28);
  shroud.position.set(0, 0.015, -0.32);
  group.add(shroud);

  const barrel = new THREE.Mesh(_unitBox, trimMat);
  barrel.scale.set(0.045, 0.045, 0.44);
  barrel.position.set(0, 0.022, -0.38);
  group.add(barrel);

  const muzzleBrake = new THREE.Mesh(_unitBox, bodyMat);
  muzzleBrake.scale.set(0.06, 0.06, 0.08);
  muzzleBrake.position.set(0, 0.022, -0.58);
  group.add(muzzleBrake);

  const foregrip = new THREE.Mesh(_unitBox, bodyMat);
  foregrip.scale.set(0.055, 0.11, 0.065);
  foregrip.position.set(0, -0.072, -0.26);
  group.add(foregrip);

  const sightFrame = new THREE.Mesh(_unitBox, bodyMat);
  sightFrame.scale.set(0.06, 0.055, 0.11);
  sightFrame.position.set(0, 0.08, -0.05);
  group.add(sightFrame);

  const opticGlass = new THREE.Mesh(
    _unitBox,
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.7,
      transparent: true,
      opacity: 0.46,
    })
  );
  opticGlass.scale.set(0.044, 0.036, 0.014);
  opticGlass.position.set(0, 0.088, -0.09);
  group.add(opticGlass);

  const energyRail = new THREE.Mesh(
    _unitBox,
    new THREE.MeshBasicMaterial({ color: 0xf43f5e })
  );
  energyRail.scale.set(0.1, 0.024, 0.36);
  energyRail.position.set(0, 0.04, -0.08);
  group.add(energyRail);

  const muzzleFlash = new THREE.Mesh(
    _unitBox,
    new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.94,
    })
  );
  muzzleFlash.scale.set(0.16, 0.16, 0.16);
  muzzleFlash.position.set(0, 0.022, -0.65);
  muzzleFlash.visible = false;
  group.add(muzzleFlash);

  return { group, muzzleFlash, energyRail };
}

/**
 * Minecraft-Style Voxel Predator / Apex Monster:
 * Pixel hide texture, blocky legs/chest, cubic horned head, square glowing eyes & voxel dorsal spines.
 */
export function createPredatorModel(
  kind: PredatorKind,
  name: string,
  textures: ProceduralTexturePack
): { group: THREE.Group; legL: THREE.Mesh; legR: THREE.Mesh; ring: THREE.Mesh } {
  const group = new THREE.Group();
  const isApex = kind === 'apex_monster';
  const isBeast = kind === 'beast';
  const scale = isApex ? 1.38 : isBeast ? 1.14 : 0.96;

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4 * scale, 1.4 * scale),
    new THREE.MeshBasicMaterial({ map: textures.contactShadow, transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  group.add(shadow);

  const ringColor = isApex ? 0xef4444 : isBeast ? 0xf97316 : 0xf43f5e;
  const ring = createSquareRing(0.6 * scale, 0.78 * scale, ringColor, 0.8);
  ring.position.y = 0.05;
  group.add(ring);

  const hideMat = new THREE.MeshStandardMaterial({
    map: textures.predatorHide,
    bumpMap: textures.predatorHideBump,
    bumpScale: 0.06,
    color: isApex ? 0x99333f : isBeast ? 0x8f7465 : 0x64748b,
    emissive: isApex ? 0x3b0712 : 0x000000,
    emissiveIntensity: isApex ? 0.35 : 0,
    roughness: 0.72,
    metalness: 0.06,
  });

  const boneMat = new THREE.MeshStandardMaterial({
    color: isApex ? 0xe5d3c0 : 0xc7beb3,
    roughness: 0.6,
  });

  const eyeMat = new THREE.MeshBasicMaterial({
    color: isApex ? 0xfef08a : 0xff2a4b,
  });

  const bodyGroup = new THREE.Group();
  bodyGroup.scale.setScalar(scale);

  // Blocky Legs
  const legL = new THREE.Mesh(_unitBox, hideMat);
  legL.scale.set(0.24, 0.68, 0.26);
  legL.position.set(-0.22, 0.34, 0);
  legL.castShadow = true;
  legL.receiveShadow = true;
  bodyGroup.add(legL);

  const legR = new THREE.Mesh(_unitBox, hideMat);
  legR.scale.set(0.24, 0.68, 0.26);
  legR.position.set(0.22, 0.34, 0);
  legR.castShadow = true;
  legR.receiveShadow = true;
  bodyGroup.add(legR);

  // Hunched Cubic Abdomen & Chest
  const abdomen = new THREE.Mesh(_unitBox, hideMat);
  abdomen.scale.set(0.56, 0.5, 0.56);
  abdomen.position.set(0, 0.82, -0.08);
  abdomen.castShadow = true;
  bodyGroup.add(abdomen);

  const chest = new THREE.Mesh(_unitBox, hideMat);
  chest.scale.set(0.82, 0.64, 0.74);
  chest.position.set(0, 1.22, 0.04);
  chest.castShadow = true;
  bodyGroup.add(chest);

  // 5 Cubic Dorsal Spines
  for (let i = 0; i < 5; i++) {
    const spine = new THREE.Mesh(_unitBox, boneMat);
    spine.scale.set(0.12, isApex ? 0.28 : 0.2, 0.14);
    spine.position.set(0, 1.52 - i * 0.14, -0.24 - i * 0.08);
    bodyGroup.add(spine);
  }

  // Blocky Arms + Square Claws
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(_unitBox, hideMat);
    arm.scale.set(0.22, 0.22, 0.66);
    arm.position.set(side * 0.52, 1.15, 0.32);
    arm.castShadow = true;
    bodyGroup.add(arm);

    for (let c = -1; c <= 1; c++) {
      const claw = new THREE.Mesh(_unitBox, boneMat);
      claw.scale.set(0.05, 0.06, 0.22);
      claw.position.set(side * 0.52 + c * 0.06, 1.08, 0.7);
      bodyGroup.add(claw);
    }
  }

  // Cubic Monster Skull + Snout + Fangs
  const cranium = new THREE.Mesh(_unitBox, hideMat);
  cranium.scale.set(0.54, 0.52, 0.58);
  cranium.position.set(0, 1.62, 0.28);
  cranium.castShadow = true;
  bodyGroup.add(cranium);

  const lowerJaw = new THREE.Mesh(_unitBox, hideMat);
  lowerJaw.scale.set(0.42, 0.12, 0.4);
  lowerJaw.position.set(0, 1.32, 0.42);
  bodyGroup.add(lowerJaw);

  for (const fx of [-0.12, 0.12]) {
    const fang = new THREE.Mesh(_unitBox, boneMat);
    fang.scale.set(0.06, 0.12, 0.06);
    fang.position.set(fx, 1.38, 0.56);
    bodyGroup.add(fang);
  }

  // Square Glowing Monster Eyes
  for (const ex of [-0.14, 0.14]) {
    const eye = new THREE.Mesh(_unitBox, eyeMat);
    eye.scale.set(0.11, 0.09, 0.04);
    eye.position.set(ex, 1.65, 0.575);
    bodyGroup.add(eye);
  }

  // Stepped Blocky Horns
  for (const side of [-1, 1]) {
    const h1 = new THREE.Mesh(_unitBox, boneMat);
    h1.scale.set(0.12, 0.22, 0.12);
    h1.position.set(side * 0.22, 1.95, 0.2);
    bodyGroup.add(h1);

    if (isApex) {
      const h2 = new THREE.Mesh(_unitBox, boneMat);
      h2.scale.set(0.1, 0.2, 0.1);
      h2.position.set(side * 0.28, 2.12, 0.14);
      bodyGroup.add(h2);
    }
  }

  const nameSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getNameTagTexture(
        isApex ? '👹' : '🐺',
        name,
        isApex ? 'APEX PREDATOR' : 'HOSTILE CHASER',
        isApex ? '#ef4444' : '#f97316'
      ),
      transparent: true,
      depthTest: true,
    })
  );
  nameSprite.position.set(0, 2.52, 0);
  nameSprite.scale.set(1.7, 0.56, 1);
  bodyGroup.add(nameSprite);

  group.add(bodyGroup);

  return { group, legL, legR, ring };
}

/**
 * Voxel Street Lamp Post with an amber emissive lantern bulb that turns on at night.
 */
export function createStreetLightModel(): {
  group: THREE.Group;
  bulbMat: THREE.MeshStandardMaterial;
  bulbLocalPos: THREE.Vector3;
} {
  const group = new THREE.Group();

  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
    metalness: 0.55,
  });
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.8,
    metalness: 0.3,
  });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xffc978,
    emissiveIntensity: 0,
    roughness: 0.25,
    metalness: 0.05,
  });

  // Base pedestal
  const plinth = new THREE.Mesh(_unitBox, baseMat);
  plinth.scale.set(0.46, 0.36, 0.46);
  plinth.position.y = 0.18;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Tall vertical post
  const pole = new THREE.Mesh(_unitBox, poleMat);
  pole.scale.set(0.18, 4.15, 0.18);
  pole.position.y = 2.42;
  pole.castShadow = true;
  group.add(pole);

  // Angled overhang arm toward the road
  const arm = new THREE.Mesh(_unitBox, poleMat);
  arm.scale.set(0.95, 0.14, 0.14);
  arm.position.set(0.42, 4.46, 0);
  group.add(arm);

  // Lantern cap
  const hood = new THREE.Mesh(_unitBox, poleMat);
  hood.scale.set(0.46, 0.12, 0.36);
  hood.position.set(0.82, 4.38, 0);
  group.add(hood);

  // Glowing bulb enclosure
  const bulb = new THREE.Mesh(_unitBox, bulbMat);
  bulb.scale.set(0.32, 0.18, 0.26);
  bulb.position.set(0.82, 4.24, 0);
  group.add(bulb);

  return {
    group,
    bulbMat,
    bulbLocalPos: new THREE.Vector3(0.82, 4.05, 0),
  };
}

/**
 * Minecraft-Style Voxel Rescue Helicopter for the Extraction Airlift Cutscene:
 * Features an open left/right cabin doorway so the 1st-person camera sits inside
 * looking out past the door frame, landing skid, and spinning rotor tips at the disaster below.
 */
export function createExtractionHelicopterModel(textures: ProceduralTexturePack): {
  group: THREE.Group;
  mainRotor: THREE.Group;
  tailRotor: THREE.Group;
} {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    map: textures.wallConcrete,
    color: 0x334155,
    roughness: 0.65,
    metalness: 0.35,
  });
  const rescueStripeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.25,
    roughness: 0.5,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.5,
    metalness: 0.75,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.28,
  });
  const consoleGlowMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });

  // Cabin floor deck (wide open doorway on left/right)
  const floorDeck = new THREE.Mesh(_unitBox, darkMetalMat);
  floorDeck.scale.set(2.5, 0.22, 4.4);
  floorDeck.position.set(0, 0.28, 0);
  floorDeck.castShadow = true;
  group.add(floorDeck);

  // Rear bulkhead & engine bay
  const rearBulkhead = new THREE.Mesh(_unitBox, bodyMat);
  rearBulkhead.scale.set(2.5, 1.9, 1.35);
  rearBulkhead.position.set(0, 1.3, 1.52);
  rearBulkhead.castShadow = true;
  group.add(rearBulkhead);

  // Orange rescue stripe along rear body
  const rearStripe = new THREE.Mesh(_unitBox, rescueStripeMat);
  rearStripe.scale.set(2.56, 0.28, 1.38);
  rearStripe.position.set(0, 0.9, 1.52);
  group.add(rearStripe);

  // Nose & Pilot Avionics Console (visible on right-front while looking out left open door)
  const noseBase = new THREE.Mesh(_unitBox, bodyMat);
  noseBase.scale.set(2.3, 0.95, 1.15);
  noseBase.position.set(0, 0.72, -2.15);
  noseBase.castShadow = true;
  group.add(noseBase);

  const noseStripe = new THREE.Mesh(_unitBox, rescueStripeMat);
  noseStripe.scale.set(2.36, 0.24, 1.18);
  noseStripe.position.set(0, 0.75, -2.15);
  group.add(noseStripe);

  const consolePanel = new THREE.Mesh(_unitBox, darkMetalMat);
  consolePanel.scale.set(1.5, 0.55, 0.45);
  consolePanel.position.set(0.18, 1.1, -1.45);
  group.add(consolePanel);

  const screenA = new THREE.Mesh(_unitBox, consoleGlowMat);
  screenA.scale.set(0.32, 0.22, 0.04);
  screenA.position.set(-0.08, 1.2, -1.21);
  group.add(screenA);

  const screenB = new THREE.Mesh(_unitBox, new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
  screenB.scale.set(0.28, 0.22, 0.04);
  screenB.position.set(0.34, 1.2, -1.21);
  group.add(screenB);

  // Front windshield frame & tinted glass
  const windshield = new THREE.Mesh(_unitBox, glassMat);
  windshield.scale.set(2.1, 1.05, 0.08);
  windshield.position.set(0, 1.65, -1.8);
  windshield.rotation.x = 0.28;
  group.add(windshield);

  // Corner door frame struts (leaving big wide view out the open left doorway!)
  for (const sx of [-1.18, 1.18]) {
    const frontPost = new THREE.Mesh(_unitBox, darkMetalMat);
    frontPost.scale.set(0.16, 1.85, 0.18);
    frontPost.position.set(sx, 1.28, -1.5);
    group.add(frontPost);

    const midRail = new THREE.Mesh(_unitBox, rescueStripeMat);
    midRail.scale.set(0.12, 0.14, 2.35);
    midRail.position.set(sx, 0.44, -0.32);
    group.add(midRail);
  }

  // Roof ceiling + overhead turbine cowling
  const roof = new THREE.Mesh(_unitBox, bodyMat);
  roof.scale.set(2.55, 0.28, 4.1);
  roof.position.set(0, 2.25, -0.05);
  roof.castShadow = true;
  group.add(roof);

  const turbinePod = new THREE.Mesh(_unitBox, darkMetalMat);
  turbinePod.scale.set(1.2, 0.5, 2.1);
  turbinePod.position.set(0, 2.58, 0.55);
  group.add(turbinePod);

  // Passenger bench inside right/rear of cabin
  const seatBench = new THREE.Mesh(_unitBox, rescueStripeMat);
  seatBench.scale.set(0.65, 0.42, 1.5);
  seatBench.position.set(0.75, 0.58, 0.15);
  group.add(seatBench);

  // Left & Right Landing Skids (visible beneath the open doorway!)
  for (const sx of [-1.35, 1.35]) {
    const skid = new THREE.Mesh(_unitBox, darkMetalMat);
    skid.scale.set(0.16, 0.14, 3.9);
    skid.position.set(sx, -0.32, -0.15);
    group.add(skid);

    for (const sz of [-1.0, 0.95]) {
      const strut = new THREE.Mesh(_unitBox, darkMetalMat);
      strut.scale.set(0.12, 0.62, 0.12);
      strut.position.set(sx * 0.92, -0.02, sz);
      strut.rotation.z = sx > 0 ? 0.24 : -0.24;
      group.add(strut);
    }
  }

  // Tail boom + vertical tail fin + spinning tail rotor
  const tailBoom = new THREE.Mesh(_unitBox, bodyMat);
  tailBoom.scale.set(0.55, 0.55, 4.2);
  tailBoom.position.set(0, 1.55, 4.2);
  tailBoom.castShadow = true;
  group.add(tailBoom);

  const tailFin = new THREE.Mesh(_unitBox, rescueStripeMat);
  tailFin.scale.set(0.18, 1.35, 0.72);
  tailFin.position.set(0, 2.1, 6.0);
  group.add(tailFin);

  const tailRotor = new THREE.Group();
  tailRotor.position.set(-0.22, 2.1, 6.0);
  const tailBladeA = new THREE.Mesh(_unitBox, darkMetalMat);
  tailBladeA.scale.set(0.06, 1.35, 0.16);
  tailRotor.add(tailBladeA);
  const tailBladeB = new THREE.Mesh(_unitBox, rescueStripeMat);
  tailBladeB.scale.set(0.06, 0.16, 1.35);
  tailRotor.add(tailBladeB);
  group.add(tailRotor);

  // Spinning Overhead Main Rotor Assembly
  const mainRotor = new THREE.Group();
  mainRotor.position.set(0, 2.95, 0.1);

  const mast = new THREE.Mesh(_unitBox, darkMetalMat);
  mast.scale.set(0.28, 0.45, 0.28);
  mast.position.y = -0.18;
  mainRotor.add(mast);

  for (let b = 0; b < 4; b++) {
    const bladeWrap = new THREE.Group();
    bladeWrap.rotation.y = (b * Math.PI) / 2;
    const blade = new THREE.Mesh(_unitBox, darkMetalMat);
    blade.scale.set(0.32, 0.06, 4.2);
    blade.position.set(0, 0.04, 2.1);
    bladeWrap.add(blade);
    const tip = new THREE.Mesh(_unitBox, rescueStripeMat);
    tip.scale.set(0.34, 0.07, 0.42);
    tip.position.set(0, 0.04, 4.05);
    bladeWrap.add(tip);
    mainRotor.add(bladeWrap);
  }
  group.add(mainRotor);

  return { group, mainRotor, tailRotor };
}

/**
 * Playable Minecraft-Style Blocky Character Model rendered in 3rd-Person View.
 * Matches the selected character's clothing, skin, headgear/visor, and held voxel weapon.
 */
export function createPlayerCharacterModel(
  character: CharacterDefinition,
  textures: ProceduralTexturePack,
  customShirtHex?: string
): {
  group: THREE.Group;
  bodyRoot: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  head: THREE.Group;
  heldGun: THREE.Group;
  gunRail: THREE.Mesh;
  heldFlashlight: THREE.Group;
  tpBeam: THREE.Mesh;
} {
  const group = new THREE.Group();
  const bodyScale = character.bodyScale;

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05 * bodyScale, 1.05 * bodyScale),
    new THREE.MeshBasicMaterial({ map: textures.contactShadow, transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  group.add(shadow);

  const bodyRoot = new THREE.Group();
  bodyRoot.scale.setScalar(bodyScale);
  group.add(bodyRoot);

  const pantsMat = new THREE.MeshStandardMaterial({ color: character.pantsColor, roughness: 0.85 });
  const shirtColorNum = customShirtHex
    ? new THREE.Color(customShirtHex).getHex()
    : character.shirtColor;
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColorNum, roughness: 0.72 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: character.accentColor,
    emissive: character.hatStyle === 'visor' ? character.accentColor : 0x000000,
    emissiveIntensity: character.hatStyle === 'visor' ? 0.55 : 0,
    roughness: 0.5,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: character.skinColor, roughness: 0.68 });
  const hairMat = new THREE.MeshStandardMaterial({ color: character.hairColor, roughness: 0.88 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

  // Hip-pivoted Legs
  const legL = new THREE.Group();
  legL.position.set(-0.125, 0.66, 0);
  const legLMesh = new THREE.Mesh(_unitBox, pantsMat);
  legLMesh.scale.set(0.23, 0.66, 0.25);
  legLMesh.position.y = -0.33;
  legLMesh.castShadow = true;
  legL.add(legLMesh);
  bodyRoot.add(legL);

  const legR = new THREE.Group();
  legR.position.set(0.125, 0.66, 0);
  const legRMesh = new THREE.Mesh(_unitBox, pantsMat);
  legRMesh.scale.set(0.23, 0.66, 0.25);
  legRMesh.position.y = -0.33;
  legRMesh.castShadow = true;
  legR.add(legRMesh);
  bodyRoot.add(legR);

  // Blocky Torso + Accent Stripe
  const torso = new THREE.Mesh(_unitBox, shirtMat);
  torso.scale.set(0.5, 0.68, 0.28);
  torso.position.y = 1.0;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyRoot.add(torso);

  const vestStripe = new THREE.Mesh(_unitBox, accentMat);
  vestStripe.scale.set(0.52, 0.12, 0.3);
  vestStripe.position.y = 1.02;
  bodyRoot.add(vestStripe);

  // Shoulder-pivoted Left Arm + Held Flashlight (for Night Time)
  const armL = new THREE.Group();
  armL.position.set(-0.36, 1.32, 0);
  const armLMesh = new THREE.Mesh(_unitBox, shirtMat);
  armLMesh.scale.set(0.2, 0.62, 0.22);
  armLMesh.position.y = -0.31;
  armLMesh.castShadow = true;
  armL.add(armLMesh);

  const heldFlashlight = new THREE.Group();
  heldFlashlight.position.set(0, -0.54, 0.16);
  const flBody = new THREE.Mesh(
    _unitBox,
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 })
  );
  flBody.scale.set(0.1, 0.1, 0.32);
  heldFlashlight.add(flBody);
  const flLens = new THREE.Mesh(
    _unitBox,
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  flLens.scale.set(0.11, 0.11, 0.04);
  flLens.position.set(0, 0, 0.17);
  heldFlashlight.add(flLens);

  const tpBeamGeo = new THREE.ConeGeometry(1.4, 6.2, 16, 1, true);
  tpBeamGeo.translate(0, -3.1, 0);
  tpBeamGeo.rotateX(-Math.PI / 2);
  const tpBeam = new THREE.Mesh(
    tpBeamGeo,
    new THREE.MeshBasicMaterial({
      color: 0xfef3c7,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  tpBeam.position.set(0, 0, 0.2);
  tpBeam.visible = false;
  heldFlashlight.add(tpBeam);
  heldFlashlight.visible = false;
  armL.add(heldFlashlight);
  bodyRoot.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.36, 1.32, 0);
  const armRMesh = new THREE.Mesh(_unitBox, shirtMat);
  armRMesh.scale.set(0.2, 0.62, 0.22);
  armRMesh.position.y = -0.31;
  armRMesh.castShadow = true;
  armR.add(armRMesh);

  const heldGun = new THREE.Group();
  heldGun.position.set(0, -0.52, 0.26);
  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.7,
  });
  const gunBody = new THREE.Mesh(_unitBox, gunMetalMat);
  gunBody.scale.set(0.1, 0.12, 0.44);
  heldGun.add(gunBody);
  const gunBarrel = new THREE.Mesh(_unitBox, gunMetalMat);
  gunBarrel.scale.set(0.05, 0.05, 0.3);
  gunBarrel.position.set(0, 0.02, 0.34);
  heldGun.add(gunBarrel);
  const gunRail = new THREE.Mesh(
    _unitBox,
    new THREE.MeshBasicMaterial({ color: 0xf43f5e })
  );
  gunRail.scale.set(0.11, 0.03, 0.32);
  gunRail.position.set(0, 0.06, 0.04);
  heldGun.add(gunRail);
  heldGun.visible = false;
  armR.add(heldGun);
  bodyRoot.add(armR);

  // Cubic Head + Character Headgear / Visor
  const head = new THREE.Group();
  head.position.set(0, 1.56, 0);

  const headCube = new THREE.Mesh(_unitBox, skinMat);
  headCube.scale.set(0.46, 0.46, 0.46);
  headCube.castShadow = true;
  head.add(headCube);

  const hairTop = new THREE.Mesh(_unitBox, hairMat);
  hairTop.scale.set(0.49, 0.14, 0.49);
  hairTop.position.y = 0.18;
  head.add(hairTop);

  const hairBack = new THREE.Mesh(_unitBox, hairMat);
  hairBack.scale.set(0.48, 0.34, 0.12);
  hairBack.position.set(0, 0.02, -0.19);
  head.add(hairBack);

  if (character.hatStyle === 'visor') {
    const visor = new THREE.Mesh(_unitBox, accentMat);
    visor.scale.set(0.42, 0.12, 0.08);
    visor.position.set(0, 0.03, 0.23);
    head.add(visor);
  } else {
    for (const ex of [-0.1, 0.1]) {
      const eye = new THREE.Mesh(_unitBox, eyeMat);
      eye.scale.set(0.08, 0.06, 0.03);
      eye.position.set(ex, 0.02, 0.235);
      head.add(eye);
    }
  }

  if (character.hatStyle === 'hardhat' || character.hatStyle === 'cap') {
    const capCrown = new THREE.Mesh(_unitBox, character.hatStyle === 'cap' ? shirtMat : accentMat);
    capCrown.scale.set(0.5, 0.16, 0.5);
    capCrown.position.y = 0.26;
    head.add(capCrown);
    const brim = new THREE.Mesh(_unitBox, accentMat);
    brim.scale.set(0.52, 0.06, 0.22);
    brim.position.set(0, 0.2, 0.26);
    head.add(brim);
  } else if (character.hatStyle === 'medic') {
    const medCap = new THREE.Mesh(
      _unitBox,
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 })
    );
    medCap.scale.set(0.5, 0.16, 0.5);
    medCap.position.y = 0.26;
    head.add(medCap);
  } else if (character.hatStyle === 'headband') {
    const band = new THREE.Mesh(_unitBox, accentMat);
    band.scale.set(0.5, 0.08, 0.5);
    band.position.y = 0.11;
    head.add(band);
  }

  bodyRoot.add(head);

  return { group, bodyRoot, legL, legR, armL, armR, head, heldGun, gunRail, heldFlashlight, tpBeam };
}

/**
 * Roadside Field Warning Signpost Model (Requirement 6: Observe & Read Warning Signs).
 */
export function createWarningSignModel(textures: ProceduralTexturePack): {
  group: THREE.Group;
  beacon: THREE.Mesh;
} {
  const group = new THREE.Group();

  const postMat = new THREE.MeshStandardMaterial({
    map: textures.bark,
    color: 0x6b4b30,
    roughness: 0.9,
  });
  const boardMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0x78350f,
    emissiveIntensity: 0.35,
    roughness: 0.5,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
  });

  const post = new THREE.Mesh(_unitBox, postMat);
  post.scale.set(0.18, 1.55, 0.18);
  post.position.y = 0.78;
  post.castShadow = true;
  group.add(post);

  const board = new THREE.Mesh(_unitBox, boardMat);
  board.scale.set(1.05, 0.72, 0.1);
  board.position.set(0, 1.52, 0);
  board.castShadow = true;
  group.add(board);

  const bar = new THREE.Mesh(_unitBox, trimMat);
  bar.scale.set(0.14, 0.32, 0.12);
  bar.position.set(0, 1.58, 0);
  group.add(bar);

  const dot = new THREE.Mesh(_unitBox, trimMat);
  dot.scale.set(0.14, 0.12, 0.12);
  dot.position.set(0, 1.32, 0);
  group.add(dot);

  const beacon = new THREE.Mesh(
    _unitBox,
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  beacon.scale.set(0.2, 0.12, 0.2);
  beacon.position.set(0, 1.98, 0);
  group.add(beacon);

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: getNameTagTexture('⚠️', 'WARNING SIGN', 'PRESS F TO READ', '#f59e0b'),
      transparent: true,
      depthTest: true,
    })
  );
  sprite.position.set(0, 2.45, 0);
  sprite.scale.set(1.8, 0.6, 1);
  group.add(sprite);

  return { group, beacon };
}


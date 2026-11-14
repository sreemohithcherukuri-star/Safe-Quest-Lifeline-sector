import * as THREE from 'three';
import { DisasterId, RoomDef } from '../types/game';

const BLOCK_STEP = 2.0; // 2m column grid (with UV 0..2 => crisp 1m Minecraft blocks)

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function rawTerrainHeight(x: number, z: number): number {
  const distFromSpawn = Math.hypot(x, z - 4.5);
  const fade = smoothstep(3.5, 14.5, distFromSpawn);

  const broad =
    Math.sin(x * 0.042 + 0.4) * Math.cos(z * 0.038 - 0.3) * 2.5 +
    Math.sin((x + z) * 0.026) * 1.5;
  const medium =
    Math.sin(x * 0.105 - 0.8) * Math.sin(z * 0.092 + 0.5) * 0.85 +
    Math.cos((x * 0.8 - z * 0.6) * 0.08) * 0.6;
  const micro = Math.sin(x * 0.23 + z * 0.19) * 0.15;

  return (1.55 + broad + medium + micro) * fade;
}

/**
 * Deterministic stepped Minecraft block terrain heightmap.
 * Keeps a flat spawn plaza around (0, 4.5) and quantizes hills into 0.5m slab steps.
 */
export function getTerrainHeight(x: number, z: number): number {
  const bx = Math.floor(x / BLOCK_STEP) * BLOCK_STEP + BLOCK_STEP * 0.5;
  const bz = Math.floor(z / BLOCK_STEP) * BLOCK_STEP + BLOCK_STEP * 0.5;
  if (Math.hypot(bx, bz - 4.5) < 4.5) return 0;
  return Math.round(rawTerrainHeight(bx, bz) * 2) / 2;
}

/**
 * Surface normal aligned to stepped Minecraft block tops.
 */
export function getTerrainNormal(
  _x: number,
  _z: number,
  out = new THREE.Vector3()
): THREE.Vector3 {
  return out.set(0, 1, 0);
}

/**
 * Highest terrain sample under a room footprint + slight clearance so hillsides
 * never clip through interior room floors.
 */
export function getRoomFloorY(room: Pick<RoomDef, 'x' | 'z' | 'w' | 'd'>): number {
  const hw = room.w * 0.48;
  const hd = room.d * 0.48;
  let maxH = getTerrainHeight(room.x, room.z);
  for (let sx = -1; sx <= 1; sx++) {
    for (let sz = -1; sz <= 1; sz++) {
      maxH = Math.max(maxH, getTerrainHeight(room.x + sx * hw, room.z + sz * hd));
    }
  }
  return maxH + 0.1;
}

export function getExtractionY(x: number, z: number): number {
  const r = 2.4;
  let maxH = getTerrainHeight(x, z);
  for (let sx = -1; sx <= 1; sx++) {
    for (let sz = -1; sz <= 1; sz++) {
      maxH = Math.max(maxH, getTerrainHeight(x + sx * r, z + sz * r));
    }
  }
  return maxH + 0.08;
}

/**
 * Builds a true stepped Minecraft voxel/block terrain mesh for one chunk,
 * complete with flat grass/snow/ash block tops and vertical dirt/stone cliff sides.
 */
export function createChunkTerrainGeometry(
  cx: number,
  cz: number,
  chunkSize: number,
  _segments: number,
  disasterId: DisasterId
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const worldOffsetX = cx * chunkSize;
  const worldOffsetZ = cz * chunkSize;
  const half = chunkSize / 2;
  const cols = Math.round(chunkSize / BLOCK_STEP);

  const isSnowBiome =
    disasterId === 'blizzard' ||
    disasterId === 'avalanche' ||
    disasterId === 'heavy_snowfall' ||
    disasterId === 'coldwave';
  const isAridBiome =
    disasterId === 'duststorm' || disasterId === 'drought' || disasterId === 'heatwave';
  const isVolcanicBiome = disasterId === 'volcano' || disasterId === 'asteroid';
  const isCoastalBiome =
    disasterId === 'tsunami' || disasterId === 'cyclone' || disasterId === 'storm_surge';

  const lowColor = isSnowBiome
    ? new THREE.Color(0xb0c8de)
    : disasterId === 'glof'
    ? new THREE.Color(0x698899)
    : isAridBiome
    ? new THREE.Color(0xb5864c)
    : isVolcanicBiome
    ? new THREE.Color(0x4d383b)
    : disasterId === 'wildfire'
    ? new THREE.Color(0x756957)
    : disasterId === 'landslide' || disasterId === 'sinkhole'
    ? new THREE.Color(0x635749)
    : disasterId === 'flood'
    ? new THREE.Color(0x638273)
    : isCoastalBiome
    ? new THREE.Color(0x4a737d)
    : disasterId === 'tornado' || disasterId === 'windstorm'
    ? new THREE.Color(0x627345)
    : disasterId === 'thunderstorm' || disasterId === 'hailstorm' || disasterId === 'severe_fog'
    ? new THREE.Color(0x475e56)
    : new THREE.Color(0x759e52);

  const midColor = isSnowBiome
    ? new THREE.Color(0xe3effa)
    : disasterId === 'glof'
    ? new THREE.Color(0x9fb8c7)
    : isAridBiome
    ? new THREE.Color(0xcfa368)
    : isVolcanicBiome
    ? new THREE.Color(0x6e5658)
    : disasterId === 'wildfire'
    ? new THREE.Color(0x8c8764)
    : disasterId === 'landslide' || disasterId === 'sinkhole'
    ? new THREE.Color(0x7d6e5c)
    : disasterId === 'flood'
    ? new THREE.Color(0x82a38e)
    : isCoastalBiome
    ? new THREE.Color(0x6c9199)
    : disasterId === 'tornado' || disasterId === 'windstorm'
    ? new THREE.Color(0x7a9154)
    : disasterId === 'thunderstorm' || disasterId === 'hailstorm' || disasterId === 'severe_fog'
    ? new THREE.Color(0x5b786a)
    : new THREE.Color(0x8cb863);

  const crestColor = isSnowBiome
    ? new THREE.Color(0xf8fbff)
    : disasterId === 'glof'
    ? new THREE.Color(0xdbeaf7)
    : isAridBiome
    ? new THREE.Color(0xe6be83)
    : isVolcanicBiome
    ? new THREE.Color(0x8c706b)
    : disasterId === 'wildfire'
    ? new THREE.Color(0xa89680)
    : disasterId === 'landslide' || disasterId === 'sinkhole'
    ? new THREE.Color(0x968572)
    : disasterId === 'flood'
    ? new THREE.Color(0x9fb8ab)
    : isCoastalBiome
    ? new THREE.Color(0x8faeb8)
    : disasterId === 'tornado' || disasterId === 'windstorm'
    ? new THREE.Color(0x96a66e)
    : disasterId === 'thunderstorm' || disasterId === 'hailstorm' || disasterId === 'severe_fog'
    ? new THREE.Color(0x748f82)
    : new THREE.Color(0xa6cf78);

  const dirtSideTint =
    isSnowBiome || disasterId === 'glof'
      ? new THREE.Color(0x7b8ea3)
      : isVolcanicBiome
      ? new THREE.Color(0x3f292b)
      : isAridBiome
      ? new THREE.Color(0x946535)
      : new THREE.Color(0x6e4e35);

  const topColor = new THREE.Color();
  const sideColor = new THREE.Color();
  let vertCount = 0;

  const pushQuad = (
    p0: [number, number, number],
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    nx: number,
    ny: number,
    nz: number,
    uSpan: number,
    vSpan: number,
    col: THREE.Color
  ) => {
    const base = vertCount;
    positions.push(...p0, ...p1, ...p2, ...p3);
    for (let k = 0; k < 4; k++) {
      normals.push(nx, ny, nz);
      colors.push(col.r, col.g, col.b);
    }
    uvs.push(0, 0, uSpan, 0, uSpan, vSpan, 0, vSpan);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    vertCount += 4;
  };

  for (let iz = 0; iz < cols; iz++) {
    for (let ix = 0; ix < cols; ix++) {
      const lx0 = -half + ix * BLOCK_STEP;
      const lz0 = -half + iz * BLOCK_STEP;
      const lx1 = lx0 + BLOCK_STEP;
      const lz1 = lz0 + BLOCK_STEP;
      const wxCenter = worldOffsetX + lx0 + BLOCK_STEP * 0.5;
      const wzCenter = worldOffsetZ + lz0 + BLOCK_STEP * 0.5;

      const h = getTerrainHeight(wxCenter, wzCenter);
      const elevT = Math.max(0, Math.min(1, (h + 0.8) / 5.2));
      if (elevT < 0.45) {
        topColor.lerpColors(lowColor, midColor, elevT / 0.45);
      } else {
        topColor.lerpColors(midColor, crestColor, (elevT - 0.45) / 0.55);
      }

      // Top horizontal face (counter-clockwise when viewed from +Y)
      pushQuad(
        [lx0, h, lz1],
        [lx1, h, lz1],
        [lx1, h, lz0],
        [lx0, h, lz0],
        0,
        1,
        0,
        2,
        2,
        topColor
      );

      // Vertical Minecraft block cliff sides where this block rises above neighbors
      sideColor.copy(topColor).lerp(dirtSideTint, 0.72);
      const hEast = getTerrainHeight(wxCenter + BLOCK_STEP, wzCenter);
      if (h > hEast) {
        const vSpan = Math.max(0.5, h - hEast);
        pushQuad(
          [lx1, hEast, lz1],
          [lx1, hEast, lz0],
          [lx1, h, lz0],
          [lx1, h, lz1],
          1,
          0,
          0,
          2,
          vSpan,
          sideColor
        );
      }

      const hWest = getTerrainHeight(wxCenter - BLOCK_STEP, wzCenter);
      if (h > hWest) {
        const vSpan = Math.max(0.5, h - hWest);
        pushQuad(
          [lx0, hWest, lz0],
          [lx0, hWest, lz1],
          [lx0, h, lz1],
          [lx0, h, lz0],
          -1,
          0,
          0,
          2,
          vSpan,
          sideColor
        );
      }

      const hSouth = getTerrainHeight(wxCenter, wzCenter + BLOCK_STEP);
      if (h > hSouth) {
        const vSpan = Math.max(0.5, h - hSouth);
        pushQuad(
          [lx0, hSouth, lz1],
          [lx1, hSouth, lz1],
          [lx1, h, lz1],
          [lx0, h, lz1],
          0,
          0,
          1,
          2,
          vSpan,
          sideColor
        );
      }

      const hNorth = getTerrainHeight(wxCenter, wzCenter - BLOCK_STEP);
      if (h > hNorth) {
        const vSpan = Math.max(0.5, h - hNorth);
        pushQuad(
          [lx1, hNorth, lz0],
          [lx0, hNorth, lz0],
          [lx0, h, lz0],
          [lx1, h, lz0],
          0,
          0,
          -1,
          2,
          vSpan,
          sideColor
        );
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Builds a blocky stepped road strip aligned to the Minecraft terrain grid.
 */
export function createTerrainRoadGeometry(road: {
  x: number;
  z: number;
  w: number;
  d: number;
}): THREE.BufferGeometry {
  const isHoriz = road.w > road.d;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertCount = 0;

  const length = isHoriz ? road.w : road.d;
  const width = isHoriz ? road.d : road.w;
  const steps = Math.max(1, Math.round(length / BLOCK_STEP));
  const stepLen = length / steps;

  for (let i = 0; i < steps; i++) {
    const startAlong = -length / 2 + i * stepLen;
    const endAlong = startAlong + stepLen;
    const midAlong = (startAlong + endAlong) * 0.5;

    const wx = isHoriz ? road.x + midAlong : road.x;
    const wz = isHoriz ? road.z : road.z + midAlong;
    // Sample left/center/right across road width so road blocks clear slab steps cleanly
    const h =
      Math.max(
        getTerrainHeight(wx, wz),
        getTerrainHeight(isHoriz ? wx : wx - width * 0.4, isHoriz ? wz - width * 0.4 : wz),
        getTerrainHeight(isHoriz ? wx : wx + width * 0.4, isHoriz ? wz + width * 0.4 : wz)
      ) + 0.06;

    const base = vertCount;
    if (isHoriz) {
      const hw = width / 2;
      positions.push(
        startAlong, h, hw,
        endAlong, h, hw,
        endAlong, h, -hw,
        startAlong, h, -hw
      );
      uvs.push(0, i, 0, i + 1, 1, i + 1, 1, i);
    } else {
      const hw = width / 2;
      positions.push(
        -hw, h, endAlong,
        hw, h, endAlong,
        hw, h, startAlong,
        -hw, h, startAlong
      );
      uvs.push(0, i + 1, 1, i + 1, 1, i, 0, i);
    }

    for (let k = 0; k < 4; k++) normals.push(0, 1, 0);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    vertCount += 4;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

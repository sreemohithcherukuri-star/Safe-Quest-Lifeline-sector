import * as THREE from 'three';
import { DisasterId } from '../types/game';

/**
 * Deterministic pseudo-random helper so pixel-art blocks look crisp and consistent.
 */
function hashPixel(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function createPixelBlockTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeatX = 1,
  repeatY = 1,
  isColor = true
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  draw(ctx, width, height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.anisotropy = 1;
  tex.needsUpdate = true;
  return tex;
}

export interface ProceduralTexturePack {
  asphalt: THREE.CanvasTexture;
  terrain: THREE.CanvasTexture;
  terrainBump: THREE.CanvasTexture;
  bark: THREE.CanvasTexture;
  foliage: THREE.CanvasTexture;
  predatorHide: THREE.CanvasTexture;
  predatorHideBump: THREE.CanvasTexture;
  waterRipple: THREE.CanvasTexture;
  wallWood: THREE.CanvasTexture;
  wallPlaster: THREE.CanvasTexture;
  wallConcrete: THREE.CanvasTexture;
  wallBump: THREE.CanvasTexture;
  tileFloor: THREE.CanvasTexture;
  woodFloor: THREE.CanvasTexture;
  concreteFloor: THREE.CanvasTexture;
  lodgeFloor: THREE.CanvasTexture;
  helipad: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  skyDome: THREE.CanvasTexture;
  nightSkyDome: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(
  _maxAnisotropy: number,
  disasterId: DisasterId
): ProceduralTexturePack {
  // 16x16 Minecraft Cobblestone / Asphalt Road Block
  const asphalt = createPixelBlockTexture(16, 16, (ctx, w, h) => {
    const palette = ['#2a313d', '#333b49', '#222832', '#3d4656'];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Outer stone curb border pixels
        if (x === 0 || x === w - 1) {
          ctx.fillStyle = (y % 4 === 0) ? '#475569' : '#64748b';
        } else if ((x === 7 || x === 8) && y >= 2 && y <= 10) {
          // Pixelated amber road dash
          ctx.fillStyle = '#eab308';
        } else {
          const idx = Math.floor(hashPixel(x, y, 1) * palette.length);
          ctx.fillStyle = palette[idx];
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });

  // 16x16 Minecraft Terrain Block (Grass / Snow / Ash / Basalt / Sand / Slate)
  const terrainPalette: string[] =
    disasterId === 'blizzard' ||
    disasterId === 'avalanche' ||
    disasterId === 'heavy_snowfall' ||
    disasterId === 'coldwave'
      ? ['#e2eef8', '#f1f7fd', '#cfe0f0', '#dbeaf7']
      : disasterId === 'glof'
      ? ['#c4d8e6', '#8ea8b8', '#e2eef8', '#688394']
      : disasterId === 'wildfire'
      ? ['#6e6a47', '#5a583a', '#7c754d', '#494534']
      : disasterId === 'volcano' || disasterId === 'asteroid'
      ? ['#473539', '#593d41', '#382a2d', '#6e494b']
      : disasterId === 'duststorm' || disasterId === 'drought' || disasterId === 'heatwave'
      ? ['#c9a468', '#b88d52', '#d6b67c', '#a37b47']
      : disasterId === 'flood' || disasterId === 'tsunami' || disasterId === 'storm_surge' || disasterId === 'cyclone'
      ? ['#4c7a56', '#3d6647', '#598a63', '#365842']
      : disasterId === 'landslide' || disasterId === 'sinkhole'
      ? ['#6b6154', '#5c5246', '#7a7063', '#4e463c']
      : disasterId === 'tornado' || disasterId === 'windstorm'
      ? ['#5b7c3b', '#4d6b31', '#698d46', '#445e2b']
      : disasterId === 'thunderstorm' || disasterId === 'hailstorm' || disasterId === 'severe_fog'
      ? ['#415a4c', '#364b3f', '#4e6b5b', '#2d3f35']
      : ['#5d8c3e', '#4f7a34', '#6c9c48', '#52733a']; // classic Minecraft grass block green

  const terrain = createPixelBlockTexture(16, 16, (ctx, w, h) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const edge = x === 0 || y === 0;
        const r = hashPixel(x, y, 2);
        if (edge && r < 0.45) {
          ctx.fillStyle = terrainPalette[1];
        } else {
          const idx = Math.floor(r * terrainPalette.length);
          ctx.fillStyle = terrainPalette[idx];
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });

  // 16x16 Crisp Minecraft Block Surface Bump
  const terrainBump = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const isSeam = x === 0 || y === 0;
          const v = isSeam ? 92 : 120 + Math.floor(hashPixel(x, y, 3) * 90);
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    1,
    1,
    false
  );

  // 16x16 Minecraft Oak / Spruce Log Bark
  const bark = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      const tones =
        disasterId === 'wildfire' || disasterId === 'volcano'
          ? ['#292524', '#1c1917', '#3b3330', '#44403c']
          : disasterId === 'duststorm' || disasterId === 'drought'
          ? ['#856847', '#735739', '#967856', '#5e462d']
          : ['#5c4028', '#4a321f', '#6b4b30', '#3d2817'];
      for (let x = 0; x < w; x++) {
        const colTone = x % 3 === 0 ? 1 : x % 2 === 0 ? 0 : 2;
        for (let y = 0; y < h; y++) {
          const r = hashPixel(x, y, 4);
          const pick = r < 0.2 ? 3 : colTone;
          ctx.fillStyle = tones[pick];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    1,
    2
  );

  // 16x16 Minecraft Pixel Leaves Block
  const foliage = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      const leafTones =
        disasterId === 'blizzard' ||
        disasterId === 'avalanche' ||
        disasterId === 'heavy_snowfall' ||
        disasterId === 'coldwave' ||
        disasterId === 'glof'
          ? ['#dcecf7', '#5f8772', '#4c705d', '#b7d4e6']
          : disasterId === 'wildfire' || disasterId === 'volcano'
          ? ['#44403c', '#7c2d12', '#292524', '#9a3412']
          : disasterId === 'drought' || disasterId === 'heatwave' || disasterId === 'duststorm'
          ? ['#8a7c45', '#6e6234', '#9e8e52', '#594e28']
          : ['#2d6e2d', '#1e4f1e', '#3c8539', '#173d17'];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const r = hashPixel(x, y, 5);
          // Checkerboard dark leaf gaps for authentic Minecraft leaves look
          if ((x + y) % 4 === 0 && r < 0.55) {
            ctx.fillStyle = leafTones[3];
          } else {
            ctx.fillStyle = leafTones[Math.floor(r * 3)];
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    1,
    1
  );

  // 16x16 Minecraft Monster / Predator Pixel Hide
  const predatorHide = createPixelBlockTexture(16, 16, (ctx, w, h) => {
    const scaleColors = ['#2d1b2e', '#3f2238', '#1d121f', '#582947'];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = Math.floor(hashPixel(x, y, 6) * scaleColors.length);
        ctx.fillStyle = scaleColors[idx];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });

  const predatorHideBump = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const v = (x + y) % 2 === 0 ? 185 : 100;
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    1,
    1,
    false
  );

  // 16x16 Minecraft Water Block Texture
  const waterRipple = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      const waterShades = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa'];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const r = hashPixel(x, y, 7);
          const idx = r > 0.86 ? 3 : r > 0.5 ? 2 : r > 0.2 ? 1 : 0;
          ctx.fillStyle = waterShades[idx];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    14,
    14
  );

  // 16x16 Minecraft Oak Planks Wall
  const wallWood = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      const woodShades = ['#9c7548', '#8a653c', '#ae8553', '#7a5733'];
      for (let y = 0; y < h; y++) {
        const isPlankSeam = y === 0 || y === 4 || y === 8 || y === 12;
        const plankRow = Math.floor(y / 4);
        for (let x = 0; x < w; x++) {
          const vertJoint = (plankRow % 2 === 0 && x === 7) || (plankRow % 2 === 1 && x === 14);
          if (isPlankSeam || vertJoint) {
            ctx.fillStyle = '#5c4024';
          } else {
            ctx.fillStyle = woodShades[Math.floor(hashPixel(x, y, 8) * woodShades.length)];
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    3,
    2
  );

  // 16x16 Minecraft Smooth Sandstone / Quartz Wall
  const wallPlaster = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      const shades = ['#e7e2d8', '#dbd5ca', '#efeae1', '#cfC8bc'];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (y === 0 || y === 8 || (y < 8 && x === 0) || (y >= 8 && x === 8)) {
            ctx.fillStyle = '#bfb7a8';
          } else {
            ctx.fillStyle = shades[Math.floor(hashPixel(x, y, 9) * shades.length)];
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    2,
    2
  );

  // 16x16 Minecraft Stone Bricks Wall
  const wallConcrete = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      const stoneShades = ['#7a808a', '#6d737d', '#868d96', '#616770'];
      for (let y = 0; y < h; y++) {
        const row = Math.floor(y / 4);
        const hMortar = y % 4 === 0;
        for (let x = 0; x < w; x++) {
          const vMortar = (row % 2 === 0 && x % 8 === 0) || (row % 2 === 1 && (x + 4) % 8 === 0);
          if (hMortar || vMortar) {
            ctx.fillStyle = '#474c54';
          } else {
            ctx.fillStyle = stoneShades[Math.floor(hashPixel(x, y, 10) * stoneShades.length)];
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    3,
    2
  );

  // 16x16 Brick/Plank Seam Bump
  const wallBump = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const seam = y % 4 === 0 || x % 8 === 0;
          const v = seam ? 85 : 175 + Math.floor(hashPixel(x, y, 11) * 40);
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    3,
    2,
    false
  );

  // 16x16 Minecraft Polished Tile Checkered Floor
  const tileFloor = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const qx = Math.floor(x / 8);
          const qy = Math.floor(y / 8);
          const grout = x % 8 === 0 || y % 8 === 0;
          if (grout) {
            ctx.fillStyle = '#64748b';
          } else {
            ctx.fillStyle = (qx + qy) % 2 === 0 ? '#e2e8f0' : '#cbd5e1';
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    3,
    3
  );

  // 16x16 Minecraft Spruce Plank Floor
  const woodFloor = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      const tones = ['#735032', '#644429', '#815b39', '#5a3d24'];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (y % 4 === 0 || (Math.floor(y / 4) % 2 === 0 ? x === 0 : x === 8)) {
            ctx.fillStyle = '#402a18';
          } else {
            ctx.fillStyle = tones[Math.floor(hashPixel(x, y, 12) * tones.length)];
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    3,
    3
  );

  // 16x16 Minecraft Cobblestone Floor
  const concreteFloor = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      const cobble = ['#646a73', '#565c64', '#747b85', '#4b5057'];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          ctx.fillStyle = cobble[Math.floor(hashPixel(x, y, 13) * cobble.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    3,
    3
  );

  // 16x16 Minecraft Red & Gold Wool Carpet Floor
  const lodgeFloor = createPixelBlockTexture(
    16,
    16,
    (ctx, w, h) => {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const border = x === 0 || x === 15 || y === 0 || y === 15;
          const trim = x === 1 || x === 14 || y === 1 || y === 14;
          if (border) {
            ctx.fillStyle = '#7f1d1d';
          } else if (trim) {
            ctx.fillStyle = '#f59e0b';
          } else {
            ctx.fillStyle = hashPixel(x, y, 14) > 0.5 ? '#991b1b' : '#b91c1c';
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    2,
    2
  );

  // 32x32 Minecraft Pixel-Art Helipad Block Surface
  const helipad = createPixelBlockTexture(32, 32, (ctx, w, h) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const outerEdge = x <= 1 || x >= w - 2 || y <= 1 || y >= h - 2;
        if (outerEdge) {
          ctx.fillStyle = ((x + y) >> 1) % 2 === 0 ? '#facc15' : '#18181b';
        } else {
          const v = hashPixel(x, y, 15) > 0.5 ? '#334155' : '#475569';
          ctx.fillStyle = v;
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Crisp square safety ring inside pad
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(5, 5, 22, 1);
    ctx.fillRect(5, 26, 22, 1);
    ctx.fillRect(5, 5, 1, 22);
    ctx.fillRect(26, 5, 1, 22);

    // Blocky Minecraft pixel "H"
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(9, 8, 3, 16);
    ctx.fillRect(20, 8, 3, 16);
    ctx.fillRect(12, 14, 8, 4);
  });

  // 16x16 Pixelated Square Contact Shadow
  const contactShadow = createPixelBlockTexture(16, 16, (ctx, w, h) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = Math.abs(x - 7.5);
        const dy = Math.abs(y - 7.5);
        const boxDist = Math.max(dx, dy) / 7.5;
        const alpha = Math.max(0, 0.52 * (1 - boxDist));
        ctx.fillStyle = `rgba(0,0,0,${alpha.toFixed(2)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });

  // 64x32 Minecraft Daytime Pixel Sky with Square Sun & Blocky Clouds
  const skyDome = createPixelBlockTexture(64, 32, (ctx, w, h) => {
    const isBlizzard =
      disasterId === 'blizzard' ||
      disasterId === 'avalanche' ||
      disasterId === 'heavy_snowfall' ||
      disasterId === 'coldwave' ||
      disasterId === 'glof';
    const isWildfire = disasterId === 'wildfire' || disasterId === 'volcano';
    const isArid =
      disasterId === 'duststorm' || disasterId === 'heatwave' || disasterId === 'drought';
    const isAsteroid = disasterId === 'asteroid';
    const isStorm =
      disasterId === 'thunderstorm' ||
      disasterId === 'tornado' ||
      disasterId === 'cyclone' ||
      disasterId === 'storm_surge' ||
      disasterId === 'hailstorm' ||
      disasterId === 'windstorm' ||
      disasterId === 'severe_fog';

    for (let y = 0; y < h; y++) {
      const t = y / h;
      for (let x = 0; x < w; x++) {
        if (t < 0.25) {
          ctx.fillStyle = isWildfire
            ? '#64442f'
            : isArid
            ? '#9a6b39'
            : isAsteroid
            ? '#473d66'
            : isStorm
            ? '#38587a'
            : isBlizzard
            ? '#7fa8cc'
            : '#2c7ce5';
        } else if (t < 0.52) {
          ctx.fillStyle = isWildfire
            ? '#a65e33'
            : isArid
            ? '#c98e4e'
            : isAsteroid
            ? '#69578c'
            : isStorm
            ? '#5278a1'
            : isBlizzard
            ? '#acc8e0'
            : '#5fa8f5';
        } else {
          ctx.fillStyle = isWildfire
            ? '#d98a55'
            : isArid
            ? '#e8c084'
            : isAsteroid
            ? '#937bb8'
            : isStorm
            ? '#7398bf'
            : isBlizzard
            ? '#d7e6f5'
            : '#9dd2fc';
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Iconic Minecraft Square Sun
    ctx.fillStyle = isWildfire ? '#fde047' : '#fef9c3';
    ctx.fillRect(10, 5, 5, 4);

    // Flat Blocky Minecraft Clouds
    ctx.fillStyle = isWildfire
      ? 'rgba(248, 210, 185, 0.82)'
      : isStorm || isAsteroid
      ? 'rgba(218, 228, 240, 0.78)'
      : 'rgba(255, 255, 255, 0.9)';
    const cloudSpecs = [
      [4, 9, 10, 2],
      [20, 7, 14, 2],
      [40, 10, 12, 2],
      [53, 8, 8, 2],
      [14, 13, 8, 2],
      [33, 14, 11, 2],
    ];
    for (const [cx, cy, cw, ch] of cloudSpecs) {
      ctx.fillRect(cx, cy, cw, ch);
    }
  });

  // 64x32 Minecraft Nighttime Pixel Sky with Stars & Square Moon
  const nightSkyDome = createPixelBlockTexture(64, 32, (ctx, w, h) => {
    for (let y = 0; y < h; y++) {
      const t = y / h;
      for (let x = 0; x < w; x++) {
        if (t < 0.25) {
          ctx.fillStyle = '#020409';
        } else if (t < 0.52) {
          ctx.fillStyle = '#040814';
        } else {
          ctx.fillStyle = '#080e1f';
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Crisp Pixel Stars in upper hemisphere
    for (let y = 1; y < 17; y++) {
      for (let x = 0; x < w; x++) {
        const r = hashPixel(x, y, 99);
        if (r > 0.965) {
          ctx.fillStyle = r > 0.985 ? '#f8fafc' : '#bae6fd';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Iconic Minecraft Square Moon
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(44, 5, 4, 4);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(45, 6, 2, 1);
    ctx.fillRect(46, 7, 1, 1);

    // Dark Slate Night Clouds
    ctx.fillStyle = 'rgba(14, 22, 38, 0.72)';
    const nightClouds = [
      [6, 10, 9, 2],
      [24, 8, 13, 2],
      [50, 11, 9, 2],
      [15, 14, 10, 2],
    ];
    for (const [cx, cy, cw, ch] of nightClouds) {
      ctx.fillRect(cx, cy, cw, ch);
    }
  });

  const all = [
    asphalt,
    terrain,
    terrainBump,
    bark,
    foliage,
    predatorHide,
    predatorHideBump,
    waterRipple,
    wallWood,
    wallPlaster,
    wallConcrete,
    wallBump,
    tileFloor,
    woodFloor,
    concreteFloor,
    lodgeFloor,
    helipad,
    contactShadow,
    skyDome,
    nightSkyDome,
  ];

  return {
    asphalt,
    terrain,
    terrainBump,
    bark,
    foliage,
    predatorHide,
    predatorHideBump,
    waterRipple,
    wallWood,
    wallPlaster,
    wallConcrete,
    wallBump,
    tileFloor,
    woodFloor,
    concreteFloor,
    lodgeFloor,
    helipad,
    contactShadow,
    skyDome,
    nightSkyDome,
    dispose: () => {
      all.forEach((t) => t.dispose());
    },
  };
}

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CHARACTERS } from '../data/characters';
import { GAME_MODES } from '../data/gameModes';
import { GUNS } from '../data/guns';
import { createProceduralTextures } from './textures';
import {
  createChunkTerrainGeometry,
  createTerrainRoadGeometry,
  getExtractionY,
  getRoomFloorY,
  getTerrainHeight,
} from './terrain';
import { soundFX } from '../utils/sound';
import { SCENARIOS } from '../data/scenarios';
import {
  ActiveRunState,
  BoxCollider,
  CameraViewMode,
  ChunkData,
  GraphicsQuality,
  GunType,
  NearbyPrompt,
  ResourceArrowTarget,
  ThemeMode,
} from '../types/game';
import {
  findRoomInChunks,
  getRoomClosedDoorColliders,
  hasItemType,
  resolveInfiniteCollisions,
} from '../utils/gameEngine';
import { CHUNK_SIZE, chunkKey, generateChunk } from './chunkWorld';
import {
  BuiltDoorInstance,
  createBuildingSupplyModel,
  createExtractionHelicopterModel,
  createFirstPersonFlashlightModel,
  createFirstPersonGunModel,
  createGroundGunModel,
  createHelicopterLandingBeacon,
  createPlayerCharacterModel,
  createPredatorModel,
  createRoomDoorSet,
  createRoomGroup,
  createRubbleModel,
  createSceneryProp,
  createStreetLightModel,
  createSurvivorModel,
  createWarningSignModel,
} from './models';

interface FirstPersonViewportProps {
  run: ActiveRunState;
  viewMode: CameraViewMode;
  theme: ThemeMode;
  graphicsQuality?: GraphicsQuality;
  joystickVecRef: React.MutableRefObject<{ x: number; y: number }>;
  yawOffsetRef: React.MutableRefObject<number>;
  jumpTriggerRef: React.MutableRefObject<number>;
  shootTriggerRef: React.MutableRefObject<number>;
  sprintRef: React.MutableRefObject<boolean>;
  cutsceneMode: 'intro' | 'extraction' | null;
  onCutsceneProgress: (progress: number) => void;
  onCutsceneEnd: () => void;
  onEnsureChunks: (newChunks: ChunkData[]) => void;
  onCollectSupply: (supplyId: string, itemType: 'medkit' | 'food') => void;
  onCollectGun: (gunId: string, gunType: GunType) => void;
  onKillPredator: (predatorId: string) => void;
  onPredatorHitPlayer: (predatorName: string, damage: number) => void;
  onGamepadAction?: (
    action:
      | 'interact'
      | 'toggle_view'
      | 'toggle_map'
      | 'sprint_toggle'
      | 'flashlight'
      | 'quick_heal'
  ) => void;
  onTickSimulation: (
    dt: number,
    playerX: number,
    playerZ: number,
    playerYaw: number,
    distDelta: number,
    roomName: string,
    inShelter: boolean,
    nearestPrompt: NearbyPrompt | null,
    nearestExtDist: number,
    nearestExtAngleDeg: number,
    isSprinting: boolean,
    predatorPositions: Array<{ id: string; x: number; z: number }>,
    nearestResourceArrow?: ResourceArrowTarget | null,
    terrainElevation?: number
  ) => void;
}

interface StreetLampEntry {
  x: number;
  y: number;
  z: number;
  bulbMat: THREE.MeshStandardMaterial;
}

interface MountedChunk {
  key: string;
  cx: number;
  cz: number;
  group: THREE.Group;
  signMeshes: Map<string, { group: THREE.Group; beacon: THREE.Mesh }>;
  supplyMeshes: Map<string, { group: THREE.Group; bobGroup: THREE.Group; ring: THREE.Mesh }>;
  gunMeshes: Map<string, { group: THREE.Group; bobGroup: THREE.Group; ring: THREE.Mesh }>;
  rubbleMeshes: Map<string, THREE.Group>;
  doorMeshes: Map<string, BuiltDoorInstance>;
  hazardMeshes: Map<string, { group: THREE.Group; core: THREE.Mesh }>;
  streetLamps: StreetLampEntry[];
}

export function FirstPersonViewport({
  run,
  viewMode,
  theme,
  graphicsQuality = 'high',
  joystickVecRef,
  yawOffsetRef,
  jumpTriggerRef,
  shootTriggerRef,
  sprintRef,
  cutsceneMode,
  onCutsceneProgress,
  onCutsceneEnd,
  onEnsureChunks,
  onCollectSupply,
  onCollectGun,
  onKillPredator,
  onPredatorHitPlayer,
  onGamepadAction,
  onTickSimulation,
}: FirstPersonViewportProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const runRef = useRef(run);
  runRef.current = run;

  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  const themeRef = useRef(theme);
  themeRef.current = theme;

  const cutsceneModeRef = useRef(cutsceneMode);
  cutsceneModeRef.current = cutsceneMode;

  const cutsceneProgressCbRef = useRef(onCutsceneProgress);
  cutsceneProgressCbRef.current = onCutsceneProgress;

  const cutsceneEndCbRef = useRef(onCutsceneEnd);
  cutsceneEndCbRef.current = onCutsceneEnd;

  const ensureChunksRef = useRef(onEnsureChunks);
  ensureChunksRef.current = onEnsureChunks;

  const collectSupplyCbRef = useRef(onCollectSupply);
  collectSupplyCbRef.current = onCollectSupply;

  const collectGunCbRef = useRef(onCollectGun);
  collectGunCbRef.current = onCollectGun;

  const killPredatorCbRef = useRef(onKillPredator);
  killPredatorCbRef.current = onKillPredator;

  const predatorHitCbRef = useRef(onPredatorHitPlayer);
  predatorHitCbRef.current = onPredatorHitPlayer;

  const gamepadActionCbRef = useRef(onGamepadAction);
  gamepadActionCbRef.current = onGamepadAction;

  const tickCbRef = useRef(onTickSimulation);
  tickCbRef.current = onTickSimulation;

  const [webglLost, setWebglLost] = useState(false);
  const [webglUnsupported, setWebglUnsupported] = useState(false);

  const scenarioId = run.scenarioId;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scenario = SCENARIOS[scenarioId];

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2') || probe.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const isCoarsePointer =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
    const maxDpr = graphicsQuality === 'ultra' ? 2 : graphicsQuality === 'high' ? 1.5 : 1;
    const enableShadows = !isSoftwareGl && graphicsQuality !== 'balanced';
    const shadowSize = graphicsQuality === 'ultra' && !isCoarsePointer ? 2048 : 1024;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl && graphicsQuality !== 'balanced',
        powerPreference: isCoarsePointer ? 'default' : 'high-performance',
      });
    } catch {
      setWebglUnsupported(true);
      return;
    }
    setWebglUnsupported(false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.shadowMap.enabled = enableShadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight));
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const onContextRestored = () => setWebglLost(false);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(scenario.skyColor);
    const isFogHeavy =
      scenario.id === 'blizzard' ||
      scenario.id === 'severe_fog' ||
      scenario.id === 'duststorm' ||
      scenario.id === 'heavy_snowfall';
    const baseFog = scenario.id === 'severe_fog' ? 0.048 : isFogHeavy ? 0.036 : 0.0125;
    const fog = new THREE.FogExp2(scenario.fogColor, baseFog);
    scene.fog = fog;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const textures = createProceduralTextures(
      renderer.capabilities.getMaxAnisotropy(),
      scenarioId
    );

    // True 1st-Person Perspective Camera
    const camera = new THREE.PerspectiveCamera(
      70,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.15,
      120
    );
    camera.rotation.order = 'YXZ';
    scene.add(camera);

    // 1st-Person Weapon Viewmodel + Night Flashlight attached to camera + reusable tracer beam
    const fpGun = createFirstPersonGunModel(textures);
    fpGun.group.position.set(0.3, -0.25, -0.5);
    fpGun.group.visible = false;
    camera.add(fpGun.group);

    const fpFlashlight = createFirstPersonFlashlightModel();
    fpFlashlight.group.position.set(-0.32, -0.26, -0.45);
    fpFlashlight.group.visible = false;
    camera.add(fpFlashlight.group);

    const tracerMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.92,
    });
    const tracerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 1, 0.08),
      tracerMat
    );
    tracerMesh.visible = false;
    scene.add(tracerMesh);

    // Blocky Minecraft Rescue Helicopter + Day-2 Landing Zone Beacon
    const extractionHeli = createExtractionHelicopterModel(textures);
    extractionHeli.group.visible = false;
    scene.add(extractionHeli.group);

    const heliLandingBeacon = createHelicopterLandingBeacon();
    heliLandingBeacon.group.visible = false;
    scene.add(heliLandingBeacon.group);

    // Selected Blocky Character 3D Model (visible in 3rd-Person View)
    const playerAvatar = createPlayerCharacterModel(
      CHARACTERS[runRef.current.characterId],
      textures,
      runRef.current.customShirtHex
    );
    playerAvatar.group.visible = false;
    scene.add(playerAvatar.group);
    const thirdPersonCamPos = new THREE.Vector3();

    // Cinematic 3-point exterior lighting: Hemisphere sky bounce + crisp Shadow Key + Cool Fill Rim + Night Flashlight
    const hemi = new THREE.HemisphereLight(
      scenario.id === 'blizzard' || scenario.id === 'avalanche' ? 0xdbeafe : 0xcbdcf5,
      scenario.groundColor,
      0.92
    );
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(
      scenario.id === 'wildfire' || scenario.id === 'volcano' ? 0xffcaa6 : 0xfff5e6,
      1.5
    );
    keyLight.position.set(18, 28, 16);
    keyLight.castShadow = enableShadows;
    keyLight.shadow.mapSize.width = shadowSize;
    keyLight.shadow.mapSize.height = shadowSize;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 85;
    const d = 30;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.00035;
    keyLight.shadow.normalBias = 0.025;
    scene.add(keyLight);
    scene.add(keyLight.target);

    const fillLight = new THREE.DirectionalLight(
      scenario.id === 'wildfire' ? 0x94a3b8 : 0x7dd3fc,
      0.42
    );
    fillLight.position.set(-16, 12, -14);
    scene.add(fillLight);

    // Player Night-Time Flashlight Rig: forward SpotLight beam + 5m radial PointLight around the survivor
    const flashlightRig = new THREE.Group();
    const flashlightSpot = new THREE.SpotLight(0xfffbeb, 0, 38, Math.PI / 5.5, 0.45, 1.1);
    flashlightSpot.position.set(0, 0, 0);
    flashlightSpot.target.position.set(0, -0.3, -12);
    flashlightSpot.castShadow = false;
    flashlightRig.add(flashlightSpot);
    flashlightRig.add(flashlightSpot.target);

    const flashlightAura = new THREE.PointLight(0xfff3d1, 0, 6.2, 1.2);
    flashlightAura.position.set(0, 0.15, 0);
    flashlightAura.castShadow = false;
    flashlightRig.add(flashlightAura);
    scene.add(flashlightRig);

    // Pooled Dim Street Lights (4 warm PointLights assigned to nearest roadside lamp posts at night)
    const streetLightPool: THREE.PointLight[] = [];
    for (let i = 0; i < 4; i++) {
      const sl = new THREE.PointLight(0xffcf87, 0, 14, 1.65);
      sl.castShadow = false;
      scene.add(sl);
      streetLightPool.push(sl);
    }

    // Closing Wildfire Perimeter Flame Wall (active when scenarioId === 'wildfire')
    const wildfirePillars: Array<{
      group: THREE.Group;
      outer: THREE.Mesh;
      inner: THREE.Mesh;
      angle: number;
    }> = [];
    if (scenario.id === 'wildfire') {
      const fireOuterGeo = new THREE.BoxGeometry(2.6, 5.2, 2.6);
      const fireInnerGeo = new THREE.BoxGeometry(1.4, 3.8, 1.4);
      const fireOuterMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.78,
      });
      const fireInnerMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.9,
      });
      const pillarCount = 28;
      for (let i = 0; i < pillarCount; i++) {
        const fg = new THREE.Group();
        const outer = new THREE.Mesh(fireOuterGeo, fireOuterMat);
        outer.position.y = 2.6;
        fg.add(outer);
        const inner = new THREE.Mesh(fireInnerGeo, fireInnerMat);
        inner.position.y = 1.9;
        fg.add(inner);
        scene.add(fg);
        wildfirePillars.push({
          group: fg,
          outer,
          inner,
          angle: (i / pillarCount) * Math.PI * 2,
        });
      }
    }

    // Minecraft Daytime & Nighttime Atmospheric Sky Domes centered on player
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(98, 28, 16),
      new THREE.MeshBasicMaterial({
        map: textures.skyDome,
        side: THREE.BackSide,
        fog: false,
        depthWrite: false,
      })
    );
    scene.add(skyDome);

    const nightSkyMat = new THREE.MeshBasicMaterial({
      map: textures.nightSkyDome,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
      transparent: true,
      opacity: 0,
    });
    const nightSkyDome = new THREE.Mesh(
      new THREE.SphereGeometry(97, 28, 16),
      nightSkyMat
    );
    nightSkyDome.visible = false;
    scene.add(nightSkyDome);

    // Pre-allocated colors for zero-GC 1-minute Day/Night cycle interpolation
    const dayFogColor = new THREE.Color(
      scenario.id === 'wildfire' || scenario.id === 'volcano'
        ? 0xe3a87b
        : scenario.id === 'duststorm' || scenario.id === 'drought' || scenario.id === 'heatwave'
        ? 0xdab47c
        : scenario.id === 'blizzard' ||
          scenario.id === 'avalanche' ||
          scenario.id === 'heavy_snowfall' ||
          scenario.id === 'coldwave'
        ? 0xdcebfa
        : scenario.id === 'asteroid'
        ? 0x9b8db8
        : scenario.id === 'severe_fog'
        ? 0xa4b6c9
        : scenario.id === 'thunderstorm' ||
          scenario.id === 'tornado' ||
          scenario.id === 'cyclone' ||
          scenario.id === 'hailstorm' ||
          scenario.id === 'windstorm'
        ? 0x8ca6c2
        : 0xaad4f5
    );
    const nightFogColor = new THREE.Color(0x020409);
    const twilightFogColor = new THREE.Color(0xd97742);
    const dayHemiSky = new THREE.Color(
      scenario.id === 'blizzard' || scenario.id === 'avalanche' ? 0xe0f2fe : 0xdbeafe
    );
    const nightHemiSky = new THREE.Color(0x050b16);
    const dayHemiGround = new THREE.Color(scenario.groundColor);
    const nightHemiGround = new THREE.Color(0x020409);
    const dayKeyColor = new THREE.Color(
      scenario.id === 'wildfire' || scenario.id === 'volcano' ? 0xffd9b8 : 0xfff6e0
    );
    const nightKeyColor = new THREE.Color(0x4f74a8);
    const twilightKeyColor = new THREE.Color(0xfb923c);
    const dayFillColor = new THREE.Color(0x93c5fd);
    const nightFillColor = new THREE.Color(0x1d4b75);
    scene.background = dayFogColor.clone();
    fog.color.copy(dayFogColor);

    // Shared Hilly Terrain Material (high-res texture + deeper bump relief + elevation vertex colors)
    const terrainMat = new THREE.MeshStandardMaterial({
      map: textures.terrain,
      bumpMap: textures.terrainBump,
      bumpScale: 0.34,
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.04,
    });

    // Optional Flood / Tsunami / Storm Surge / GLOF rising surge plane with Minecraft pixel water blocks
    const isWaterDisaster =
      scenario.id === 'flood' ||
      scenario.id === 'tsunami' ||
      scenario.id === 'storm_surge' ||
      scenario.id === 'glof';
    let floodWaterPlane: THREE.Mesh | null = null;
    if (isWaterDisaster) {
      floodWaterPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(140, 140, 24, 24),
        new THREE.MeshStandardMaterial({
          map: textures.waterRipple,
          color:
            scenario.id === 'tsunami' || scenario.id === 'glof'
              ? 0x67e8f9
              : 0x93c5fd,
          roughness: 0.25,
          metalness: 0.15,
          transparent: true,
          opacity: scenario.id === 'tsunami' ? 0.72 : 0.62,
        })
      );
      floodWaterPlane.rotation.x = -Math.PI / 2;
      floodWaterPlane.position.y = scenario.id === 'tsunami' ? 0.55 : 0.35;
      scene.add(floodWaterPlane);
    }

    // Falling blocky voxel meteors / volcanic pyroclastic bombs in Asteroid & Volcano sky
    const meteors: Array<{ group: THREE.Group; ox: number; oy: number; oz: number; speed: number }> =
      [];
    if (scenario.id === 'asteroid' || scenario.id === 'volcano') {
      const meteorCoreMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const meteorTailMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.78,
      });
      for (let i = 0; i < 8; i++) {
        const mg = new THREE.Group();
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), meteorCoreMat);
        mg.add(head);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 0.5), meteorTailMat);
        tail.position.set(1.4, 2.1, 0);
        tail.rotation.z = Math.PI / 4;
        mg.add(tail);
        const ox = (Math.random() - 0.5) * 65;
        const oz = (Math.random() - 0.5) * 65;
        const oy = 12 + Math.random() * 22;
        mg.position.set(ox, oy, oz);
        scene.add(mg);
        meteors.push({ group: mg, ox, oy, oz, speed: 14 + Math.random() * 10 });
      }
    }

    // Sky-to-ground blocky lightning bolt mesh for Storm disasters
    let lightningBolt: THREE.Mesh | null = null;
    if (
      scenario.id === 'thunderstorm' ||
      scenario.id === 'tornado' ||
      scenario.id === 'tsunami' ||
      scenario.id === 'cyclone' ||
      scenario.id === 'hailstorm' ||
      scenario.id === 'windstorm'
    ) {
      lightningBolt = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 36, 0.45),
        new THREE.MeshBasicMaterial({
          color: 0xbae6fd,
          transparent: true,
          opacity: 0.95,
        })
      );
      lightningBolt.visible = false;
      scene.add(lightningBolt);
    }

    // Shared road material across chunks with asphalt aggregate bump
    const roadMat = new THREE.MeshStandardMaterial({
      map: textures.asphalt,
      bumpMap: textures.terrainBump,
      bumpScale: 0.06,
      roughness: 0.84,
      metalness: 0.06,
    });

    // Lightweight atmospheric particle cloud centered around player
    const particleCount = graphicsQuality === 'ultra' ? 220 : graphicsQuality === 'high' ? 160 : 90;
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 34;
      particlePos[i * 3 + 1] = Math.random() * 8;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 34;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particles = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({
        color:
          scenario.id === 'wildfire' || scenario.id === 'volcano'
            ? 0xfb923c
            : scenario.id === 'asteroid'
            ? 0xf43f5e
            : scenario.id === 'duststorm' || scenario.id === 'drought'
            ? 0xfbbf24
            : isWaterDisaster || scenario.id === 'cyclone'
            ? 0xbae6fd
            : scenario.id === 'tornado' || scenario.id === 'windstorm'
            ? 0xa3a380
            : scenario.id === 'thunderstorm'
            ? 0x93c5fd
            : scenario.id === 'earthquake' || scenario.id === 'landslide' || scenario.id === 'sinkhole'
            ? 0xd6d3d1
            : 0xf8fafc,
        size:
          scenario.id === 'blizzard' ||
          scenario.id === 'tornado' ||
          scenario.id === 'avalanche' ||
          scenario.id === 'heavy_snowfall' ||
          scenario.id === 'hailstorm' ||
          scenario.id === 'duststorm'
            ? 0.21
            : scenario.id === 'thunderstorm' || scenario.id === 'tsunami' || scenario.id === 'cyclone'
            ? 0.16
            : 0.14,
        transparent: true,
        opacity: 0.74,
      })
    );
    scene.add(particles);

    // Active chunk, terrain tile, survivor & chasing predator 3D registries
    const terrainTiles = new Map<string, { cx: number; cz: number; mesh: THREE.Mesh }>();
    const mountedChunks = new Map<string, MountedChunk>();
    const survivorMeshes = new Map<
      string,
      { group: THREE.Group; ring: THREE.Mesh; armR: THREE.Mesh; posX: number; posZ: number }
    >();
    const predatorMeshes = new Map<
      string,
      {
        group: THREE.Group;
        legL: THREE.Mesh;
        legR: THREE.Mesh;
        ring: THREE.Mesh;
        posX: number;
        posZ: number;
        cooldown: number;
        seed: number;
      }
    >();

    const getSurfaceY = (x: number, z: number, chunks: Record<string, ChunkData>): number => {
      const th = getTerrainHeight(x, z);
      const rm = findRoomInChunks(chunks, x, z);
      return rm ? Math.max(th, getRoomFloorY(rm)) : th;
    };

    const mountChunkToScene = (ch: ChunkData) => {
      if (mountedChunks.has(ch.key)) return;
      const group = new THREE.Group();
      const signMeshes = new Map<string, { group: THREE.Group; beacon: THREE.Mesh }>();
      const supplyMeshes = new Map<
        string,
        { group: THREE.Group; bobGroup: THREE.Group; ring: THREE.Mesh }
      >();
      const gunMeshes = new Map<
        string,
        { group: THREE.Group; bobGroup: THREE.Group; ring: THREE.Mesh }
      >();
      const rubbleMeshes = new Map<string, THREE.Group>();
      const doorMeshes = new Map<string, BuiltDoorInstance>();
      const hazardMeshes = new Map<string, { group: THREE.Group; core: THREE.Mesh }>();
      const streetLamps: StreetLampEntry[] = [];

      // Terrain-hugging road ribbons
      for (const r of ch.roads) {
        const rm = new THREE.Mesh(createTerrainRoadGeometry(r), roadMat);
        rm.position.set(r.x, 0, r.z);
        rm.receiveShadow = true;
        group.add(rm);
      }

      // Multi-tier roadside trees / rock outcrops grounded on hills
      const cxWorld = ch.cx * CHUNK_SIZE;
      const czWorld = ch.cz * CHUNK_SIZE;
      const corners: Array<[number, number]> = [
        [-10.8, -10.8],
        [10.8, 10.8],
        [-10.8, 10.8],
        [10.8, -10.8],
      ];
      corners.forEach(([ox, oz], idx) => {
        const wx = cxWorld + ox;
        const wz = czWorld + oz;
        const prop = createSceneryProp(scenarioId, textures);
        prop.position.set(wx, getTerrainHeight(wx, wz) - 0.12, wz);
        prop.rotation.y = (idx + Math.abs(ch.cx + ch.cz)) * 1.1;
        const sc = 0.85 + ((Math.abs(ch.cx * 3 + ch.cz * 5 + idx) % 4) * 0.1);
        prop.scale.setScalar(sc);
        group.add(prop);
      });

      // Rooms & physical hinged doors seated on hill foundation plinths
      for (const room of ch.rooms) {
        const roomY = getRoomFloorY(room);
        group.add(createRoomGroup(room, textures, roomY));
        const doorSet = createRoomDoorSet(room, textures, roomY);
        group.add(doorSet.group);
        for (const d of doorSet.doors) {
          doorMeshes.set(d.doorId, d);
        }
      }

      // Rubbles grounded on terrain
      for (const rub of ch.rubbles) {
        const rg = createRubbleModel(rub, scenarioId, textures);
        rg.position.set(rub.x, getTerrainHeight(rub.x, rub.z), rub.z);
        group.add(rg);
        rubbleMeshes.set(rub.id, rg);
      }

      // Hospital Medkit & Supermarket Food Shelves inside buildings
      for (const sup of ch.buildingSupplies || []) {
        const sm = createBuildingSupplyModel(sup.itemType);
        const hostRoom = ch.rooms.find(
          (rm) =>
            sup.x >= rm.x - rm.w / 2 &&
            sup.x <= rm.x + rm.w / 2 &&
            sup.z >= rm.z - rm.d / 2 &&
            sup.z <= rm.z + rm.d / 2
        );
        const sy = hostRoom ? getRoomFloorY(hostRoom) : getTerrainHeight(sup.x, sup.z);
        sm.group.position.set(sup.x, sy, sup.z);
        const isCollected = Boolean(runRef.current.collectedSupplyIds[sup.id]);
        sm.group.visible = true;
        sm.bobGroup.visible = !isCollected;
        sm.ring.visible = !isCollected;
        group.add(sm.group);
        supplyMeshes.set(sup.id, sm);
      }

      // Field Warning Signs seated along roadsides
      for (const sg of ch.signs || []) {
        const sm = createWarningSignModel(textures);
        sm.group.position.set(sg.x, getTerrainHeight(sg.x, sg.z), sg.z);
        group.add(sm.group);
        signMeshes.set(sg.id, sm);
      }

      // Floating 30-second Ground Guns with visible Name Tags
      for (const g of ch.guns || []) {
        const def = GUNS[g.gunType];
        const gm = createGroundGunModel(def.emoji, def.name, def.colorNum, def.colorHex);
        gm.group.position.set(g.x, getTerrainHeight(g.x, g.z), g.z);
        gm.group.visible = !runRef.current.collectedGunIds[g.id];
        group.add(gm.group);
        gunMeshes.set(g.id, gm);
      }

      // A few Dim Street Lights along the main roads that turn on at night
      const lampSpots: Array<{ x: number; z: number; rotY: number }> = [
        { x: cxWorld - 2.45, z: czWorld - 7.8, rotY: 0 },
        { x: cxWorld + 2.45, z: czWorld + 7.8, rotY: Math.PI },
      ];
      for (const spot of lampSpots) {
        const lamp = createStreetLightModel();
        const ly = getTerrainHeight(spot.x, spot.z);
        lamp.group.position.set(spot.x, ly, spot.z);
        lamp.group.rotation.y = spot.rotY;
        group.add(lamp.group);
        const cosR = Math.cos(spot.rotY);
        const sinR = Math.sin(spot.rotY);
        const worldBulbX = spot.x + lamp.bulbLocalPos.x * cosR + lamp.bulbLocalPos.z * sinR;
        const worldBulbZ = spot.z - lamp.bulbLocalPos.x * sinR + lamp.bulbLocalPos.z * cosR;
        streetLamps.push({
          x: worldBulbX,
          y: ly + lamp.bulbLocalPos.y,
          z: worldBulbZ,
          bulbMat: lamp.bulbMat,
        });
      }

      // Layered Hazard Zones grounded on hills
      for (const h of ch.hazards) {
        const hg = new THREE.Group();
        hg.position.set(h.x, getTerrainHeight(h.x, h.z) + 0.15, h.z);
        const hazColor =
          scenario.id === 'wildfire'
            ? h.level === 2
              ? 0xf97316
              : 0xf59e0b
            : scenario.id === 'asteroid'
            ? h.level === 2
              ? 0xf43f5e
              : 0xf97316
            : scenario.id === 'flood' || scenario.id === 'tsunami'
            ? h.level === 2
              ? 0x06b6d4
              : 0x38bdf8
            : scenario.id === 'tornado'
            ? h.level === 2
              ? 0x84cc16
              : 0xa3e635
            : scenario.id === 'thunderstorm'
            ? h.level === 2
              ? 0x6366f1
              : 0x38bdf8
            : scenario.id === 'earthquake'
            ? h.level === 2
              ? 0xef4444
              : 0xf59e0b
            : h.level === 2
            ? 0xe0f2fe
            : 0xbae6fd;

        const disc = new THREE.Mesh(
          new THREE.PlaneGeometry(h.radius * 1.85, h.radius * 1.85),
          new THREE.MeshBasicMaterial({
            color: hazColor,
            transparent: true,
            opacity: h.level === 2 ? 0.3 : 0.18,
            depthWrite: false,
          })
        );
        disc.rotation.x = -Math.PI / 2;
        hg.add(disc);

        const borderRing = new THREE.Mesh(
          new THREE.RingGeometry(h.radius * 0.92, h.radius * 1.05, 4),
          new THREE.MeshBasicMaterial({
            color: hazColor,
            transparent: true,
            opacity: h.level === 2 ? 0.65 : 0.35,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        borderRing.rotation.x = -Math.PI / 2;
        borderRing.rotation.z = Math.PI / 4;
        borderRing.position.y = 0.02;
        hg.add(borderRing);

        let core: THREE.Mesh;
        if (scenario.id === 'tornado') {
          core = new THREE.Mesh(
            new THREE.BoxGeometry(h.level === 2 ? 2.4 : 1.4, h.level === 2 ? 12 : 7.5, h.level === 2 ? 2.4 : 1.4),
            new THREE.MeshStandardMaterial({
              color: 0x64748b,
              emissive: hazColor,
              emissiveIntensity: 0.35,
              transparent: true,
              opacity: 0.72,
            })
          );
          core.position.y = h.level === 2 ? 6.0 : 3.75;
          hg.add(core);
        } else if (scenario.id === 'thunderstorm') {
          core = new THREE.Mesh(
            new THREE.BoxGeometry(h.level === 2 ? 0.7 : 0.4, h.level === 2 ? 14 : 8, h.level === 2 ? 0.7 : 0.4),
            new THREE.MeshBasicMaterial({
              color: 0x93c5fd,
              transparent: true,
              opacity: h.level === 2 ? 0.82 : 0.48,
            })
          );
          core.position.y = h.level === 2 ? 7 : 4;
          hg.add(core);
        } else {
          core = new THREE.Mesh(
            new THREE.BoxGeometry(h.level === 2 ? 1.15 : 0.7, h.level === 2 ? 1.85 : 0.9, h.level === 2 ? 1.15 : 0.7),
            new THREE.MeshStandardMaterial({
              color: hazColor,
              emissive: hazColor,
              emissiveIntensity: h.level === 2 ? 1.15 : 0.45,
              transparent: true,
              opacity: 0.74,
            })
          );
          core.position.y = h.level === 2 ? 0.92 : 0.45;
          hg.add(core);
        }

        if (h.level === 2 && scenario.id !== 'tornado') {
          const innerCore = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 1.35, 0.6),
            new THREE.MeshBasicMaterial({
              color: scenario.id === 'wildfire' || scenario.id === 'asteroid' ? 0xfef08a : 0xffffff,
              transparent: true,
              opacity: 0.78,
            })
          );
          innerCore.position.y = 0.68;
          hg.add(innerCore);
        }

        hg.visible = h.active;
        group.add(hg);
        hazardMeshes.set(h.id, { group: hg, core });
      }

      // Survivors grounded on their room floor
      for (const s of ch.survivors) {
        if (!survivorMeshes.has(s.id)) {
          const sm = createSurvivorModel(s.shirtColor, textures.contactShadow);
          const hostRoom = ch.rooms.find(
            (rm) =>
              s.x >= rm.x - rm.w / 2 &&
              s.x <= rm.x + rm.w / 2 &&
              s.z >= rm.z - rm.d / 2 &&
              s.z <= rm.z + rm.d / 2
          );
          const sy = hostRoom ? getRoomFloorY(hostRoom) + 0.08 : getTerrainHeight(s.x, s.z) + 0.08;
          sm.group.position.set(s.x, sy, s.z);
          scene.add(sm.group);
          survivorMeshes.set(s.id, { ...sm, posX: s.x, posZ: s.z });
        }
      }

      // Chasing Predators & Apex Monsters
      for (const pr of ch.predators || []) {
        if (!predatorMeshes.has(pr.id)) {
          const pm = createPredatorModel(pr.kind, pr.name, textures);
          const pyGround = getTerrainHeight(pr.x, pr.z);
          pm.group.position.set(pr.x, pyGround, pr.z);
          pm.group.visible = pr.alive;
          scene.add(pm.group);
          predatorMeshes.set(pr.id, {
            ...pm,
            posX: pr.x,
            posZ: pr.z,
            cooldown: 0,
            seed: Math.abs(pr.x * 0.7 + pr.z * 0.3),
          });
        }
      }

      scene.add(group);
      mountedChunks.set(ch.key, {
        key: ch.key,
        cx: ch.cx,
        cz: ch.cz,
        group,
        signMeshes,
        supplyMeshes,
        gunMeshes,
        rubbleMeshes,
        doorMeshes,
        hazardMeshes,
        streetLamps,
      });
    };

    const unmountChunk = (mc: MountedChunk) => {
      scene.remove(mc.group);
      mc.group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
        }
      });
      mountedChunks.delete(mc.key);
    };

    const syncChunksAroundPlayer = (px: number, pz: number) => {
      const pcx = Math.round(px / CHUNK_SIZE);
      const pcz = Math.round(pz / CHUNK_SIZE);
      const currentRun = runRef.current;
      const newlyGenerated: ChunkData[] = [];

      // Mount 5x5 hilly terrain horizon tiles (-2..+2) for seamless distant hills
      for (let dz = -2; dz <= 2; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          const cx = pcx + dx;
          const cz = pcz + dz;
          const k = chunkKey(cx, cz);
          if (!terrainTiles.has(k)) {
            const segs = Math.abs(dx) <= 1 && Math.abs(dz) <= 1 ? 24 : 12;
            const geo = createChunkTerrainGeometry(cx, cz, CHUNK_SIZE, segs, scenarioId);
            const mesh = new THREE.Mesh(geo, terrainMat);
            mesh.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
            mesh.receiveShadow = true;
            scene.add(mesh);
            terrainTiles.set(k, { cx, cz, mesh });
          }
        }
      }

      for (const [k, tile] of terrainTiles.entries()) {
        if (Math.abs(tile.cx - pcx) > 3 || Math.abs(tile.cz - pcz) > 3) {
          scene.remove(tile.mesh);
          tile.mesh.geometry.dispose();
          terrainTiles.delete(k);
        }
      }

      // Ensure 3x3 gameplay chunks around player
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          const cx = pcx + dx;
          const cz = pcz + dz;
          const k = chunkKey(cx, cz);
          let ch = currentRun.chunks[k];
          if (!ch) {
            ch = generateChunk(
              scenarioId,
              cx,
              cz,
              currentRun.difficulty,
              currentRun.wave,
              currentRun.gameMode,
              {
                enablePredators: currentRun.enablePredators,
                enableGuns: currentRun.enableGuns,
              }
            );
            newlyGenerated.push(ch);
          }
          if (!mountedChunks.has(k)) {
            mountChunkToScene(ch);
          }
        }
      }

      if (newlyGenerated.length > 0) {
        ensureChunksRef.current(newlyGenerated);
      }

      // Unmount far chunks (beyond radius 2) to keep memory & draw calls constant forever
      for (const [k, mc] of mountedChunks.entries()) {
        if (Math.abs(mc.cx - pcx) > 2 || Math.abs(mc.cz - pcz) > 2) {
          unmountChunk(mc);
        }
      }
    };

    // Player 1st-person state, sprint & jump physics
    let px = runRef.current.playerX;
    let pz = runRef.current.playerZ;
    let py = 0;
    let vy = 0;
    let playerGroundY = getTerrainHeight(px, pz);
    let onGround = true;
    let airSprintMomentum = false;
    let airLaunchDirX = 0;
    let airLaunchDirZ = 0;
    let landDip = 0;
    let lastJumpTrig = jumpTriggerRef.current;
    let jumpBufferTimer = 0;
    let yaw = runRef.current.playerYaw;
    let pitch = -0.05;
    let thirdPersonZoom = 3.85;
    let walkBobTime = 0;
    let freeCamActivePrev = viewModeRef.current === 'free_cam';
    let freeCamX = px;
    let freeCamY = playerGroundY + 7.5;
    let freeCamZ = pz + 7.5;
    let freeCamYaw = yaw;
    let freeCamPitch = -0.35;
    let freeCamSpeed = 22;

    // Cutscene & Atmospheric FX timers
    let cutsceneElapsed = 0;
    const INTRO_DURATION = 5.4;
    const EXTRACTION_DURATION = 5.8;
    let cutsceneReportTimer = 0;
    let prevCutsceneMode: 'intro' | 'extraction' | null = cutsceneModeRef.current;
    let heliOriginX = px;
    let heliOriginY = playerGroundY;
    let heliOriginZ = pz;
    const heliCamWorld = new THREE.Vector3();
    const heliLookWorld = new THREE.Vector3();
    let nextLightningAt =
      scenario.id === 'thunderstorm' || scenario.id === 'hailstorm'
        ? 2.2
        : scenario.id === 'flood' ||
          scenario.id === 'blizzard' ||
          scenario.id === 'tsunami' ||
          scenario.id === 'tornado' ||
          scenario.id === 'cyclone' ||
          scenario.id === 'windstorm'
        ? 4.5
        : 9999;
    let lightningFlash = 0;

    // Initial chunk mount
    syncChunksAroundPlayer(px, pz);

    // Shooting & gun state
    let lastShootTrig = shootTriggerRef.current;
    let gunCooldown = 0;
    let muzzleFlashTimer = 0;
    let gunRecoil = 0;
    let tracerTimer = 0;
    const locallyCollectedSupplies = new Set<string>();
    const locallyCollectedGuns = new Set<string>();
    const locallyKilledPredators = new Set<string>();

    const rayOrigin = new THREE.Vector3();
    const rayDir = new THREE.Vector3();
    const muzzleWorld = new THREE.Vector3();
    const tracerEnd = new THREE.Vector3();
    const tracerMid = new THREE.Vector3();

    const fireGun = () => {
      const currentRun = runRef.current;
      const modalOpen = Boolean(
        currentRun.activeSurvivorId || currentRun.activeCacheId || currentRun.activeSign
      );
      if (
        cutsceneModeRef.current !== null ||
        viewModeRef.current === 'free_cam' ||
        modalOpen ||
        currentRun.outcome !== 'ongoing' ||
        !currentRun.activeGun ||
        currentRun.activeGun.remainingSec <= 0 ||
        gunCooldown > 0
      ) {
        return;
      }

      const gunDef = GUNS[currentRun.activeGun.type];
      gunCooldown = gunDef.cooldownSec;
      muzzleFlashTimer = 0.065;
      gunRecoil = 1.0;
      soundFX.shoot();

      if (viewModeRef.current === 'third_person') {
        camera.updateMatrixWorld();
        camera.getWorldPosition(rayOrigin);
        camera.getWorldDirection(rayDir);
        // Start hit scan past the camera-to-player chase offset so bullets only hit targets ahead
        rayOrigin.addScaledVector(rayDir, 3.2);
        playerAvatar.heldGun.getWorldPosition(muzzleWorld);
      } else {
        camera.updateMatrixWorld();
        camera.getWorldPosition(rayOrigin);
        camera.getWorldDirection(rayDir);
        fpGun.muzzleFlash.getWorldPosition(muzzleWorld);
      }

      const candidates: Array<{ id: string; t: number; hitX: number; hitY: number; hitZ: number }> = [];
      for (const pr of Object.values(currentRun.predatorStates)) {
        if (!pr.alive || locallyKilledPredators.has(pr.id)) continue;
        const pm = predatorMeshes.get(pr.id);
        const prX = pm ? pm.posX : pr.x;
        const prZ = pm ? pm.posZ : pr.z;
        const prY = getSurfaceY(prX, prZ, currentRun.chunks) + 1.1;

        const vx = prX - rayOrigin.x;
        const vy_ = prY - rayOrigin.y;
        const vz = prZ - rayOrigin.z;
        const t = vx * rayDir.x + vy_ * rayDir.y + vz * rayDir.z;
        if (t <= 0.1 || t > gunDef.range) continue;

        const cx = rayOrigin.x + rayDir.x * t;
        const cy = rayOrigin.y + rayDir.y * t;
        const cz = rayOrigin.z + rayDir.z * t;
        const horizDist = Math.hypot(prX - cx, prZ - cz);
        const vertDist = Math.abs(prY - cy);
        const hitRadius = pr.radius + gunDef.spreadRadius;

        if (horizDist <= hitRadius && vertDist <= 1.55 + gunDef.spreadRadius * 0.45) {
          candidates.push({ id: pr.id, t, hitX: prX, hitY: prY, hitZ: prZ });
        }
      }

      candidates.sort((a, b) => a.t - b.t);
      const hitsToKill =
        gunDef.id === 'shotgun' ? candidates.slice(0, 3) : candidates.slice(0, 1);

      if (hitsToKill.length > 0) {
        for (const h of hitsToKill) {
          locallyKilledPredators.add(h.id);
          const pm = predatorMeshes.get(h.id);
          if (pm) pm.group.visible = false;
          killPredatorCbRef.current(h.id);
        }
        soundFX.predatorDown();
        tracerEnd.set(hitsToKill[0].hitX, hitsToKill[0].hitY, hitsToKill[0].hitZ);
      } else {
        tracerEnd.copy(rayOrigin).addScaledVector(rayDir, Math.min(28, gunDef.range));
      }

      const len = muzzleWorld.distanceTo(tracerEnd);
      if (len > 0.2) {
        tracerMid.addVectors(muzzleWorld, tracerEnd).multiplyScalar(0.5);
        tracerMesh.position.copy(tracerMid);
        tracerMesh.lookAt(tracerEnd);
        tracerMesh.rotateX(Math.PI / 2);
        tracerMesh.scale.set(1, len, 1);
        tracerMat.color.setHex(gunDef.colorNum);
        tracerTimer = 0.085;
      }
    };

    // Multi-touch & Roblox-style Mouse Drag-to-look (Left or Right click drag) + Left-click/tap-to-fire
    let lookPointerId: number | null = null;
    let lookPointerType = 'mouse';
    let lookPointerButton = 0;
    let lastLookX = 0;
    let lastLookY = 0;
    let downX = 0;
    let downY = 0;
    let downTime = 0;
    const onPointerDown = (e: PointerEvent) => {
      if (cutsceneModeRef.current !== null) return;
      if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
      if (lookPointerId !== null) return;
      lookPointerId = e.pointerId;
      lookPointerType = e.pointerType || 'mouse';
      lookPointerButton = e.button;
      lastLookX = e.clientX;
      lastLookY = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      downTime = performance.now();
      try {
        renderer.domElement.setPointerCapture(e.pointerId);
      } catch {
        // ignore if pointer capture is unavailable
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (lookPointerId !== e.pointerId || cutsceneModeRef.current !== null) return;
      const dx = e.clientX - lastLookX;
      const dy = e.clientY - lastLookY;
      lastLookX = e.clientX;
      lastLookY = e.clientY;
      const sens = lookPointerType === 'touch' ? 0.0056 : 0.0045;
      if (viewModeRef.current === 'free_cam') {
        freeCamYaw -= dx * sens;
        freeCamPitch = Math.max(-1.45, Math.min(1.45, freeCamPitch - dy * (sens * 0.85)));
      } else {
        yaw -= dx * sens;
        pitch = Math.max(-0.65, Math.min(0.55, pitch - dy * (sens * 0.78)));
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (lookPointerId !== e.pointerId) return;
      lookPointerId = null;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      const elapsedTap = performance.now() - downTime;
      if (
        lookPointerButton === 0 &&
        moved < 10 &&
        elapsedTap < 280 &&
        viewModeRef.current !== 'free_cam'
      ) {
        fireGun();
      }
    };
    const onPointerCancel = (e: PointerEvent) => {
      if (lookPointerId === e.pointerId) {
        lookPointerId = null;
      }
    };
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    const onWheel = (e: WheelEvent) => {
      if (cutsceneModeRef.current !== null) return;
      if (viewModeRef.current === 'free_cam') {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.14 : 0.88;
        freeCamSpeed = Math.max(8, Math.min(58, freeCamSpeed * factor));
      } else if (viewModeRef.current === 'third_person') {
        e.preventDefault();
        const step = e.deltaY > 0 ? 0.55 : -0.55;
        thirdPersonZoom = Math.max(1.8, Math.min(9.5, thirdPersonZoom + step));
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);

    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement | null)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') return;
      const modalOpen = Boolean(
        runRef.current.activeSurvivorId ||
          runRef.current.activeCacheId ||
          runRef.current.activeSign
      );
      if (cutsceneModeRef.current === null && !modalOpen) {
        if (
          e.code === 'Space' ||
          e.code === 'ArrowUp' ||
          e.code === 'ArrowDown' ||
          e.code === 'ArrowLeft' ||
          e.code === 'ArrowRight' ||
          e.code === 'PageUp' ||
          e.code === 'PageDown'
        ) {
          e.preventDefault();
        }
        if (e.code === 'Space' && !e.repeat && viewModeRef.current !== 'free_cam') {
          jumpBufferTimer = 0.18;
        }
        if (e.code === 'KeyG' && !e.repeat && viewModeRef.current !== 'free_cam') {
          fireGun();
        }
      }
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    const onWindowBlur = () => {
      lookPointerId = null;
      for (const code of Object.keys(keys)) {
        keys[code] = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    resizeObserver?.observe(container);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;
    let uiTimer = 0;
    let chunkCheckTimer = 0;
    let accumulatedDist = 0;
    let sprintingDuringInterval = false;
    let lastPromptSig = '';
    let lastRoomSig = '';

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const lookTarget = new THREE.Vector3();
    const prevGpButtons = {
      jump: false,
      fire: false,
      interact: false,
      view: false,
      map: false,
      heal: false,
      flashlight: false,
    };

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(0.08, Math.max(0.001, clock.getDelta()));
      const elapsed = clock.elapsedTime;
      const currentRun = runRef.current;
      const activeCutsceneMode = cutsceneModeRef.current;
      const inCutscene = activeCutsceneMode !== null;

      // Detect cutscene mode transitions cleanly
      if (activeCutsceneMode !== prevCutsceneMode) {
        cutsceneElapsed = 0;
        cutsceneReportTimer = 0;
        if (activeCutsceneMode === 'extraction') {
          const extX = currentRun.helicopter?.x ?? px;
          const extZ = currentRun.helicopter?.z ?? pz;
          heliOriginX = extX;
          heliOriginZ = extZ;
          heliOriginY = getExtractionY(extX, extZ) + 0.35;
          extractionHeli.group.visible = true;
          heliLandingBeacon.group.visible = false;
        } else {
          extractionHeli.group.visible = false;
        }
      }

      // 1-Minute Day / Night Cycle (starts at Day; flips every 60s between Day and Night)
      const cyclePos = currentRun.elapsedSec % 120;
      let nightFactor = 0;
      if (cyclePos >= 56 && cyclePos < 60) {
        const u = (cyclePos - 56) / 4;
        nightFactor = u * u * (3 - 2 * u);
      } else if (cyclePos >= 60 && cyclePos < 116) {
        nightFactor = 1;
      } else if (cyclePos >= 116) {
        const u = (cyclePos - 116) / 4;
        nightFactor = 1 - u * u * (3 - 2 * u);
      }
      const dayFactor = 1 - nightFactor;
      const twilight = 4 * nightFactor * dayFactor;

      nightSkyDome.visible = nightFactor > 0.005;
      nightSkyMat.opacity = nightFactor;

      fog.color.copy(dayFogColor).lerp(nightFogColor, nightFactor).lerp(twilightFogColor, twilight * 0.55);
      (scene.background as THREE.Color).copy(fog.color);

      hemi.color.copy(dayHemiSky).lerp(nightHemiSky, nightFactor);
      hemi.groundColor.copy(dayHemiGround).lerp(nightHemiGround, nightFactor);
      keyLight.color.copy(dayKeyColor).lerp(nightKeyColor, nightFactor).lerp(twilightKeyColor, twilight * 0.65);
      fillLight.color.copy(dayFillColor).lerp(nightFillColor, nightFactor);
      keyLight.intensity = THREE.MathUtils.lerp(1.85, 0.11, nightFactor);
      fillLight.intensity = THREE.MathUtils.lerp(0.5, 0.06, nightFactor);
      scene.environmentIntensity = THREE.MathUtils.lerp(1.0, 0.09, nightFactor);

      // Usable Flashlight during Night Time
      const charEyeHeight = CHARACTERS[currentRun.characterId].eyeHeight;
      const isNightTime = cyclePos >= 56;
      const beamActive =
        isNightTime &&
        currentRun.flashlightOn &&
        !inCutscene &&
        currentRun.outcome === 'ongoing';
      flashlightRig.position.set(px, playerGroundY + py + charEyeHeight * 0.92, pz);
      flashlightRig.rotation.set(pitch, yaw, 0, 'YXZ');
      flashlightSpot.intensity = beamActive ? 6.5 : 0;
      flashlightAura.intensity = beamActive ? 8.0 : 0;
      fpFlashlight.group.visible = beamActive && viewModeRef.current === 'first_person';
      fpFlashlight.beam.visible = beamActive;

      // Update dim Street Lights (bulb emissive + 4 pooled dim warm PointLights that switch on at night)
      const lampFocusX = viewModeRef.current === 'free_cam' ? freeCamX : px;
      const lampFocusZ = viewModeRef.current === 'free_cam' ? freeCamZ : pz;
      const candidateLamps: Array<{ lamp: StreetLampEntry; distSq: number }> = [];
      for (const mc of mountedChunks.values()) {
        for (const lamp of mc.streetLamps) {
          lamp.bulbMat.emissiveIntensity = nightFactor * 1.45;
          if (nightFactor > 0.02) {
            const dx = lamp.x - lampFocusX;
            const dz = lamp.z - lampFocusZ;
            const distSq = dx * dx + dz * dz;
            if (distSq < 1296) {
              candidateLamps.push({ lamp, distSq });
            }
          }
        }
      }
      if (nightFactor > 0.02 && candidateLamps.length > 0) {
        candidateLamps.sort((a, b) => a.distSq - b.distSq);
        for (let i = 0; i < streetLightPool.length; i++) {
          const sl = streetLightPool[i];
          const entry = candidateLamps[i];
          if (entry) {
            sl.position.set(entry.lamp.x, entry.lamp.y, entry.lamp.z);
            sl.intensity = 2.35 * nightFactor;
          } else {
            sl.intensity = 0;
          }
        }
      } else {
        for (const sl of streetLightPool) {
          sl.intensity = 0;
        }
      }

      // Animate Closing Wildfire Perimeter Pillars
      if (wildfirePillars.length > 0) {
        const wf = currentRun.wildfireRing;
        const showRing = Boolean(wf && currentRun.disasterPhase !== 'all_clear');
        for (let i = 0; i < wildfirePillars.length; i++) {
          const wp = wildfirePillars[i];
          wp.group.visible = showRing;
          if (!showRing || !wf) continue;
          const fx = wf.centerX + Math.cos(wp.angle) * wf.radius;
          const fz = wf.centerZ + Math.sin(wp.angle) * wf.radius;
          const fy = getTerrainHeight(fx, fz);
          wp.group.position.set(fx, fy, fz);
          const flicker = 0.85 + Math.sin(elapsed * 9.5 + i * 1.7) * 0.28;
          wp.outer.scale.set(1, flicker, 1);
          wp.inner.scale.set(1, 0.85 + Math.cos(elapsed * 12 + i) * 0.3, 1);
        }
      }

      // Realistic Atmospheric Lightning, Thunderstorm Bolts & Wildfire/Asteroid Glow Flicker
      if (elapsed >= nextLightningAt) {
        lightningFlash = 1.0;
        const interval = scenario.id === 'thunderstorm' ? 2.6 + Math.random() * 3.4 : 7.5 + Math.random() * 6.5;
        nextLightningAt = elapsed + interval;
        if (lightningBolt) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 16 + Math.random() * 24;
          lightningBolt.position.set(
            px + Math.cos(angle) * dist,
            playerGroundY + 18,
            pz + Math.sin(angle) * dist
          );
          lightningBolt.rotation.z = (Math.random() - 0.5) * 0.25;
        }
        soundFX.thunder();
      }
      const themeBoost = themeRef.current === 'light' ? 0.18 : 0;
      const baseHemi = THREE.MathUtils.lerp(1.06, 0.08, nightFactor) + themeBoost * (1 - nightFactor * 0.6);
      const baseExposure = THREE.MathUtils.lerp(1.2, 0.42, nightFactor) + themeBoost * 0.2 * (1 - nightFactor * 0.6);
      if (lightningFlash > 0) {
        lightningFlash = Math.max(0, lightningFlash - dt * 4.8);
        hemi.intensity = baseHemi + lightningFlash * 2.25;
        renderer.toneMappingExposure = baseExposure + lightningFlash * 0.6;
        if (lightningBolt) {
          lightningBolt.visible = lightningFlash > 0.65;
        }
      } else if (scenario.id === 'wildfire' || scenario.id === 'asteroid') {
        if (lightningBolt) lightningBolt.visible = false;
        hemi.intensity = baseHemi + Math.sin(elapsed * 8.5) * 0.07;
        renderer.toneMappingExposure = baseExposure;
      } else {
        if (lightningBolt) lightningBolt.visible = false;
        hemi.intensity = baseHemi;
        renderer.toneMappingExposure = baseExposure;
      }

      if (prevCutsceneMode !== null && activeCutsceneMode === null) {
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
      }
      prevCutsceneMode = activeCutsceneMode;

      const isFreeCam = !inCutscene && viewModeRef.current === 'free_cam';
      if (isFreeCam && !freeCamActivePrev) {
        freeCamX = camera.position.x;
        freeCamY = Math.max(camera.position.y, getTerrainHeight(camera.position.x, camera.position.z) + 1.5);
        freeCamZ = camera.position.z;
        freeCamYaw = yaw;
        freeCamPitch = pitch;
      }
      freeCamActivePrev = isFreeCam;

      // Apply Roblox-style PC camera turn (Left/Right Arrows, Comma/Period, Q/E, or HUD buttons) & I/O zoom
      if (!inCutscene) {
        if (yawOffsetRef.current !== 0) {
          if (isFreeCam) freeCamYaw += yawOffsetRef.current;
          else yaw += yawOffsetRef.current;
          yawOffsetRef.current = 0;
        }
        const turnRate = 2.25 * dt;
        if (keys['ArrowLeft'] || keys['Comma'] || keys['KeyQ']) {
          if (isFreeCam) freeCamYaw += turnRate;
          else yaw += turnRate;
        }
        if (keys['ArrowRight'] || keys['Period'] || keys['KeyE']) {
          if (isFreeCam) freeCamYaw -= turnRate;
          else yaw -= turnRate;
        }
        if (viewModeRef.current === 'third_person') {
          if (keys['KeyI']) {
            thirdPersonZoom = Math.max(1.8, thirdPersonZoom - 5.5 * dt);
          }
          if (keys['KeyO']) {
            thirdPersonZoom = Math.min(9.5, thirdPersonZoom + 5.5 * dt);
          }
        }
      } else {
        yawOffsetRef.current = 0;
      }

      // Poll Gamepad API (Xbox / PlayStation / Switch / Backbone / Mobile Bluetooth Controllers)
      let gpMoveX = 0;
      let gpMoveY = 0;
      let gpSprint = false;
      const modalOpen = Boolean(
        currentRun.activeSurvivorId || currentRun.activeCacheId || currentRun.activeSign
      );
      if (!inCutscene && !modalOpen && currentRun.outcome === 'ongoing') {
        const pads = navigator.getGamepads?.();
        const gp = pads ? Array.from(pads).find((p): p is Gamepad => Boolean(p && p.connected)) : undefined;
        if (gp) {
          const lx = Math.abs(gp.axes[0] ?? 0) > 0.18 ? gp.axes[0] : 0;
          const ly = Math.abs(gp.axes[1] ?? 0) > 0.18 ? gp.axes[1] : 0;
          const rx = Math.abs(gp.axes[2] ?? 0) > 0.18 ? gp.axes[2] : 0;
          const ry = Math.abs(gp.axes[3] ?? 0) > 0.18 ? gp.axes[3] : 0;
          gpMoveX = lx;
          gpMoveY = ly;
          if (isFreeCam) {
            freeCamYaw -= rx * 2.4 * dt;
            freeCamPitch = Math.max(-1.45, Math.min(1.45, freeCamPitch - ry * 1.65 * dt));
          } else {
            yaw -= rx * 2.4 * dt;
            pitch = Math.max(-0.65, Math.min(0.55, pitch - ry * 1.65 * dt));
          }

          const jumpBtn = Boolean(gp.buttons[0]?.pressed);
          const healBtn = Boolean(gp.buttons[1]?.pressed || gp.buttons[13]?.pressed);
          const interactBtn = Boolean(gp.buttons[2]?.pressed);
          const viewBtn = Boolean(gp.buttons[3]?.pressed);
          const flashlightBtn = Boolean(gp.buttons[6]?.pressed || gp.buttons[12]?.pressed);
          const mapBtn = Boolean(gp.buttons[9]?.pressed || gp.buttons[8]?.pressed);
          const fireBtn = Boolean(gp.buttons[7]?.pressed || gp.buttons[5]?.pressed);
          gpSprint = Boolean(gp.buttons[4]?.pressed || gp.buttons[10]?.pressed);

          if (jumpBtn && !prevGpButtons.jump && !isFreeCam) jumpBufferTimer = 0.18;
          if (fireBtn && !prevGpButtons.fire && !isFreeCam) fireGun();
          if (interactBtn && !prevGpButtons.interact) gamepadActionCbRef.current?.('interact');
          if (viewBtn && !prevGpButtons.view) gamepadActionCbRef.current?.('toggle_view');
          if (mapBtn && !prevGpButtons.map) gamepadActionCbRef.current?.('toggle_map');
          if (healBtn && !prevGpButtons.heal) gamepadActionCbRef.current?.('quick_heal');
          if (flashlightBtn && !prevGpButtons.flashlight) gamepadActionCbRef.current?.('flashlight');

          prevGpButtons.jump = jumpBtn;
          prevGpButtons.heal = healBtn;
          prevGpButtons.interact = interactBtn;
          prevGpButtons.view = viewBtn;
          prevGpButtons.flashlight = flashlightBtn;
          prevGpButtons.map = mapBtn;
          prevGpButtons.fire = fireBtn;
        }
      }

      // Update PC Free Cam flight when active (leaves player standing safely in sector)
      let inX = 0;
      let inZ = 0;
      let mag = 0;
      let moving = false;
      let sprintingNow = false;
      let dirX = 0;
      let dirZ = 0;

      if (isFreeCam && !modalOpen && currentRun.outcome === 'ongoing') {
        let fcFwdInput = -gpMoveY - joystickVecRef.current.y;
        let fcRightInput = gpMoveX + joystickVecRef.current.x;
        let fcUpInput = 0;
        if (keys['KeyW'] || keys['ArrowUp']) fcFwdInput += 1;
        if (keys['KeyS'] || keys['ArrowDown']) fcFwdInput -= 1;
        if (keys['KeyD']) fcRightInput += 1;
        if (keys['KeyA']) fcRightInput -= 1;
        if (keys['Space'] || keys['PageUp']) fcUpInput += 1;
        if (keys['KeyX'] || keys['PageDown']) fcUpInput -= 1;

        const fcBoost =
          sprintRef.current || gpSprint || Boolean(keys['ShiftLeft'] || keys['ShiftRight'])
            ? 2.2
            : 1.0;
        const speed = freeCamSpeed * fcBoost;
        const cosP = Math.cos(freeCamPitch);
        const fwdX = -Math.sin(freeCamYaw) * cosP;
        const fwdY = Math.sin(freeCamPitch);
        const fwdZ = -Math.cos(freeCamYaw) * cosP;
        const rightX = Math.cos(freeCamYaw);
        const rightZ = -Math.sin(freeCamYaw);

        const rawX = fwdX * fcFwdInput + rightX * fcRightInput;
        const rawY = fwdY * fcFwdInput + fcUpInput;
        const rawZ = fwdZ * fcFwdInput + rightZ * fcRightInput;
        const rawLen = Math.hypot(rawX, rawY, rawZ);
        if (rawLen > 0.05) {
          const norm = Math.min(1, rawLen) / rawLen;
          freeCamX += rawX * norm * speed * dt;
          freeCamY += rawY * norm * speed * dt;
          freeCamZ += rawZ * norm * speed * dt;
          const minCamY = getTerrainHeight(freeCamX, freeCamZ) + 0.75;
          freeCamY = Math.max(minCamY, Math.min(85, freeCamY));
        }
      } else {
        // Character Movement Vector (Roblox PC: W/S/Up/Down forward-back, A/D strafe, Left/Right Arrows turn)
        inX = joystickVecRef.current.x + gpMoveX;
        inZ = joystickVecRef.current.y + gpMoveY;
        if (keys['KeyW'] || keys['ArrowUp']) inZ -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) inZ += 1;
        if (keys['KeyA']) inX -= 1;
        if (keys['KeyD']) inX += 1;

        mag = Math.hypot(inX, inZ);
        moving = !inCutscene && currentRun.outcome === 'ongoing' && !modalOpen && mag > 0.08;

        const wantsSprint =
          sprintRef.current || gpSprint || Boolean(keys['ShiftLeft'] || keys['ShiftRight']);
        const canSprint =
          wantsSprint &&
          currentRun.stamina > 3 &&
          !inCutscene &&
          !modalOpen &&
          currentRun.outcome === 'ongoing';
        sprintingNow = canSprint && moving;
        if (sprintingNow && onGround) {
          sprintingDuringInterval = true;
        }

        if (moving) {
          const nx = inX / mag;
          const nz = inZ / mag;
          const fwdX = -Math.sin(yaw);
          const fwdZ = -Math.cos(yaw);
          const rightX = Math.cos(yaw);
          const rightZ = -Math.sin(yaw);
          dirX = rightX * nx + fwdX * -nz;
          dirZ = rightZ * nx + fwdZ * -nz;
        }
      }

      // Handle Jump & Sprint-Jump Input (Spacebar or HUD Jump Button, buffered so quick taps while walking never drop)
      if (jumpTriggerRef.current !== lastJumpTrig) {
        lastJumpTrig = jumpTriggerRef.current;
        jumpBufferTimer = 0.18;
      }
      if (inCutscene || modalOpen) {
        jumpBufferTimer = 0;
        keys['Space'] = false;
      } else {
        jumpBufferTimer = Math.max(0, jumpBufferTimer - dt);
      }

      const jumpRequested = jumpBufferTimer > 0 || Boolean(keys['Space']);

      if (
        !inCutscene &&
        !modalOpen &&
        currentRun.outcome === 'ongoing' &&
        jumpRequested &&
        onGround
      ) {
        jumpBufferTimer = 0;
        const jumpMult = GAME_MODES[currentRun.gameMode].jumpMultiplier;
        if (sprintingNow) {
          // Sprint Jump: higher arc + long horizontal forward burst
          vy = 7.8 * jumpMult;
          airSprintMomentum = true;
          airLaunchDirX = dirX;
          airLaunchDirZ = dirZ;
          sprintingDuringInterval = true;
        } else {
          // Standard Jump (works seamlessly both standing still and while walking)
          vy = 6.5 * jumpMult;
          airSprintMomentum = false;
        }
        onGround = false;
        soundFX.jump();
      }

      // Vertical Jump Physics & Gravity
      if (!onGround) {
        vy -= 16.8 * dt;
        py += vy * dt;
        if (py <= 0) {
          py = 0;
          vy = 0;
          landDip = airSprintMomentum ? -0.14 : -0.095;
          onGround = true;
          airSprintMomentum = false;
        }
      }
      landDip = THREE.MathUtils.damp(landDip, 0, 12, dt);

      // Apply Horizontal Ground or Sprint-Jump Airborne Motion
      if (moving || (!onGround && airSprintMomentum)) {
        const clampedMag = Math.min(1, mag);
        const survivorsList = Object.values(currentRun.survivorStates);
        const escorted = survivorsList.filter((s) => s.status === 'escorted');
        const penalty = escorted.reduce((acc, s) => acc + s.escortSpeedPenalty, 0);
        const speedBonus = escorted.some((s) => s.perkId === 'extra_speed') ? 0.15 : 0;
        const charSpeedMult = CHARACTERS[currentRun.characterId].speedMultiplier;
        const modeSpeedMult = GAME_MODES[currentRun.gameMode].speedMultiplier * charSpeedMult;
        const escortMod = Math.max(0.62, 1 - penalty + speedBonus) * modeSpeedMult;

        let moveX = dirX;
        let moveZ = dirZ;
        let speed = 7.4 * clampedMag * escortMod;

        if (!onGround && airSprintMomentum) {
          // Carry sprint-jump launch momentum with light mid-air steering
          const steerX = moving ? dirX * 0.35 + airLaunchDirX * 0.65 : airLaunchDirX;
          const steerZ = moving ? dirZ * 0.35 + airLaunchDirZ * 0.65 : airLaunchDirZ;
          const sLen = Math.hypot(steerX, steerZ) || 1;
          moveX = steerX / sLen;
          moveZ = steerZ / sLen;
          speed = 12.6 * escortMod;
        } else if (sprintingNow) {
          speed = 11.6 * clampedMag * escortMod;
        }

        const targetX = px + moveX * speed * dt;
        const targetZ = pz + moveZ * speed * dt;

        // Gather colliders from mounted 3x3 chunks only (jumping high enough vaults low rubble!)
        const activeColliders = [];
        for (const mc of mountedChunks.values()) {
          const ch = currentRun.chunks[mc.key];
          if (!ch) continue;
          activeColliders.push(...ch.colliders);
          for (const room of ch.rooms) {
            activeColliders.push(...getRoomClosedDoorColliders(room, currentRun.openDoorIds));
          }
          if (py < 0.55) {
            for (const r of ch.rubbles) {
              if (!currentRun.clearedRubbleIds[r.id]) {
                activeColliders.push(r);
              }
            }
          }
        }

        const resolved = resolveInfiniteCollisions(targetX, targetZ, 0.44, activeColliders);
        accumulatedDist += Math.hypot(resolved.x - px, resolved.z - pz);
        px = resolved.x;
        pz = resolved.z;
        if (onGround && moving) {
          walkBobTime += dt * (sprintingNow ? 14.5 : 10) * clampedMag;
        }
      }

      // Dynamic FOV Kick for visceral sprint and sprint-jump feedback
      const targetFov =
        !inCutscene && !onGround && airSprintMomentum
          ? 81
          : !inCutscene && sprintingNow
          ? 77.5
          : 70;
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 9, dt);
        camera.updateProjectionMatrix();
      }

      // Check chunk streaming periodically (track chopper during extraction, Free Cam when scouting!)
      const focusX =
        activeCutsceneMode === 'extraction'
          ? extractionHeli.group.position.x
          : isFreeCam
          ? freeCamX
          : px;
      const focusZ =
        activeCutsceneMode === 'extraction'
          ? extractionHeli.group.position.z
          : isFreeCam
          ? freeCamZ
          : pz;
      chunkCheckTimer += dt;
      if (chunkCheckTimer >= 0.25) {
        chunkCheckTimer = 0;
        syncChunksAroundPlayer(focusX, focusZ);
      }

      // Smoothly track hilly terrain & room floor elevation under player
      const currentRoom = findRoomInChunks(currentRun.chunks, px, pz);
      const targetGroundY = currentRoom
        ? Math.max(getTerrainHeight(px, pz), getRoomFloorY(currentRoom))
        : getTerrainHeight(px, pz);
      playerGroundY = THREE.MathUtils.damp(playerGroundY, targetGroundY, 20, dt);

      // Camera Update: Opening Spline, Helicopter Extraction Cabin View, OR 1st/3rd-Person Camera
      const bobOffset = moving && onGround ? Math.sin(walkBobTime) * 0.055 : 0;
      const isQuakeBurst =
        (scenario.id === 'earthquake' ||
          scenario.id === 'volcano' ||
          scenario.id === 'landslide' ||
          scenario.id === 'sinkhole') &&
        currentRun.disasterPhase !== 'all_clear' &&
        (activeCutsceneMode === 'intro' ||
          (currentRun.wave > 0 && Math.sin(elapsed * 1.35) > 0.82));
      const shake = isQuakeBurst ? Math.sin(elapsed * 46) * 0.13 : 0;

      if (activeCutsceneMode === 'extraction') {
        cutsceneElapsed += dt;
        const p = Math.min(1, cutsceneElapsed / EXTRACTION_DURATION);
        cutsceneReportTimer += dt;
        if (cutsceneReportTimer >= 0.06 || p >= 1) {
          cutsceneReportTimer = 0;
          cutsceneProgressCbRef.current(p);
        }

        // Spin helicopter main & tail rotors rapidly
        extractionHeli.mainRotor.rotation.y += dt * 24;
        extractionHeli.tailRotor.rotation.x += dt * 32;

        // Liftoff flight curve: spool up on pad -> climb smoothly upward & away over blocky world
        const climbU = Math.max(0, Math.min(1, (p - 0.16) / 0.84));
        const climbEase = climbU * climbU * (3 - 2 * climbU);
        const bankFactor = Math.sin(climbU * Math.PI);
        const vibration = Math.sin(elapsed * 38) * 0.015;

        const hx = heliOriginX - climbEase * 18;
        const hy = heliOriginY + climbEase * 24 + vibration;
        const hz = heliOriginZ - climbEase * 22;

        extractionHeli.group.visible = true;
        extractionHeli.group.position.set(hx, hy, hz);
        extractionHeli.group.rotation.set(
          -0.15 * bankFactor,
          0.35 + climbEase * 0.35,
          0.14 * bankFactor
        );
        extractionHeli.group.updateMatrixWorld(true);

        // Camera seated inside cabin looking outward through the open left helicopter door
        heliCamWorld.set(-0.26, 1.36, -0.18);
        extractionHeli.group.localToWorld(heliCamWorld);
        camera.position.copy(heliCamWorld);

        const panAngle = Math.sin(p * Math.PI) * 1.25;
        heliLookWorld.set(-5.8, -1.8 - climbEase * 2.1, -3.2 + panAngle);
        extractionHeli.group.localToWorld(heliLookWorld);
        camera.lookAt(heliLookWorld);

        if (p >= 1) {
          cutsceneEndCbRef.current();
        }
      } else if (activeCutsceneMode === 'intro') {
        cutsceneElapsed += dt;
        const p = Math.min(1, cutsceneElapsed / INTRO_DURATION);
        cutsceneReportTimer += dt;
        if (cutsceneReportTimer >= 0.06 || p >= 1) {
          cutsceneReportTimer = 0;
          cutsceneProgressCbRef.current(p);
        }

        if (p < 0.35) {
          const u = p / 0.35;
          const ease = u * u * (3 - 2 * u);
          const cxPos = THREE.MathUtils.lerp(18, -12, ease);
          const czPos = THREE.MathUtils.lerp(22, 14, ease);
          camera.position.set(
            cxPos + shake,
            Math.max(THREE.MathUtils.lerp(13.5, 10.0, ease), getTerrainHeight(cxPos, czPos) + 4),
            czPos + shake
          );
          lookTarget.set(0, getTerrainHeight(0, -4) + 1.5, -4);
          camera.lookAt(lookTarget);
        } else if (p < 0.72) {
          const u = (p - 0.35) / 0.37;
          const ease = u * u * (3 - 2 * u);
          const cxPos = THREE.MathUtils.lerp(-12, -8.5, ease);
          const czPos = THREE.MathUtils.lerp(14, -10, ease);
          camera.position.set(
            cxPos + shake,
            Math.max(THREE.MathUtils.lerp(10.0, 4.6, ease), getTerrainHeight(cxPos, czPos) + 2.4),
            czPos + shake
          );
          const tx = THREE.MathUtils.lerp(0, 6.2, ease);
          const tz = THREE.MathUtils.lerp(-4, 6.2, ease);
          lookTarget.set(tx, getTerrainHeight(tx, tz) + 1.4, tz);
          camera.lookAt(lookTarget);
        } else {
          const u = (p - 0.72) / 0.28;
          const ease = 1 - Math.pow(1 - u, 3);
          const endGround = getSurfaceY(px, pz, currentRun.chunks);
          camera.position.set(
            THREE.MathUtils.lerp(-8.5, px, ease),
            THREE.MathUtils.lerp(4.6, endGround + charEyeHeight, ease),
            THREE.MathUtils.lerp(-10, pz, ease)
          );
          lookTarget.set(
            THREE.MathUtils.lerp(6.2, px, ease),
            THREE.MathUtils.lerp(getTerrainHeight(6.2, 6.2) + 1.4, endGround + charEyeHeight * 0.9, ease),
            THREE.MathUtils.lerp(6.2, pz - 12, ease)
          );
          camera.lookAt(lookTarget);
        }

        if (p >= 1) {
          camera.rotation.set(pitch, yaw, 0, 'YXZ');
          cutsceneEndCbRef.current();
        }
      } else if (viewModeRef.current === 'free_cam') {
        thirdPersonCamPos.set(0, 0, 0);
        camera.position.set(freeCamX, freeCamY, freeCamZ);
        camera.rotation.order = 'YXZ';
        camera.rotation.y = freeCamYaw;
        camera.rotation.x = freeCamPitch;
        camera.rotation.z = 0;
      } else if (viewModeRef.current === 'third_person') {
        // 3rd-Person View: Centered Roblox-style chase camera with I/O & Scroll zoom
        const fwdX = -Math.sin(yaw);
        const fwdZ = -Math.cos(yaw);
        const cosP = Math.cos(pitch);
        const backDist = thirdPersonZoom * Math.cos(pitch * 0.4);
        const camX = px - fwdX * backDist + shake;
        const camZ = pz - fwdZ * backDist + shake;
        const groundUnderCam = getTerrainHeight(camX, camZ);
        const zoomLift = (thirdPersonZoom - 3.85) * 0.28;
        const desiredCamY = Math.max(
          playerGroundY + py + (1.35 + charEyeHeight * 0.6 + zoomLift) - Math.sin(pitch) * (backDist * 0.48),
          groundUnderCam + 0.75
        );
        if (thirdPersonCamPos.lengthSq() === 0) {
          thirdPersonCamPos.set(camX, desiredCamY, camZ);
        } else {
          thirdPersonCamPos.x = THREE.MathUtils.damp(thirdPersonCamPos.x, camX, 16, dt);
          thirdPersonCamPos.y = THREE.MathUtils.damp(thirdPersonCamPos.y, desiredCamY, 16, dt);
          thirdPersonCamPos.z = THREE.MathUtils.damp(thirdPersonCamPos.z, camZ, 16, dt);
        }
        camera.position.copy(thirdPersonCamPos);
        const aimDist = 22;
        lookTarget.set(
          px - Math.sin(yaw) * cosP * aimDist,
          playerGroundY + py + charEyeHeight * 0.92 + Math.sin(pitch) * aimDist,
          pz - Math.cos(yaw) * cosP * aimDist
        );
        camera.lookAt(lookTarget);
      } else {
        thirdPersonCamPos.set(0, 0, 0);
        camera.position.set(
          px + shake,
          playerGroundY + charEyeHeight + py + bobOffset + landDip,
          pz + shake
        );
        camera.rotation.order = 'YXZ';
        camera.rotation.y = yaw;
        camera.rotation.x = pitch;
        camera.rotation.z = isQuakeBurst ? shake * 0.16 : 0;
      }

      // Animate & Toggle Playable Blocky Character Avatar in 3rd-Person & Free Cam Views
      const showThirdPersonAvatar =
        !inCutscene && (viewModeRef.current === 'third_person' || viewModeRef.current === 'free_cam');
      playerAvatar.group.visible = showThirdPersonAvatar;
      if (showThirdPersonAvatar) {
        playerAvatar.group.position.set(px, playerGroundY + py, pz);
        playerAvatar.group.rotation.y = yaw + Math.PI;
        const stride = moving && onGround ? Math.sin(walkBobTime) * 0.65 : 0;
        const jumpPose = !onGround ? 0.45 : 0;
        playerAvatar.legL.rotation.x = stride + jumpPose;
        playerAvatar.legR.rotation.x = -stride - jumpPose;
        playerAvatar.heldFlashlight.visible = beamActive;
        playerAvatar.tpBeam.visible = beamActive;
        playerAvatar.armL.rotation.x = beamActive ? -Math.PI * 0.42 : -stride * 0.85;
        const hasActiveGun = Boolean(
          currentRun.activeGun && currentRun.activeGun.remainingSec > 0
        );
        playerAvatar.heldGun.visible = hasActiveGun;
        if (hasActiveGun && currentRun.activeGun) {
          (playerAvatar.gunRail.material as THREE.MeshBasicMaterial).color.setHex(
            GUNS[currentRun.activeGun.type].colorNum
          );
          playerAvatar.armR.rotation.x = -Math.PI * 0.45 - gunRecoil * 0.25;
        } else {
          playerAvatar.armR.rotation.x = stride * 0.85;
        }
      }

      // Keep skyDome, flood/tsunami surge, meteors, particles, and sun shadow frustum centered around active focus
      const centerX =
        activeCutsceneMode === 'extraction'
          ? extractionHeli.group.position.x
          : isFreeCam
          ? freeCamX
          : px;
      const centerZ =
        activeCutsceneMode === 'extraction'
          ? extractionHeli.group.position.z
          : isFreeCam
          ? freeCamZ
          : pz;
      const centerY = activeCutsceneMode === 'extraction' ? heliOriginY : playerGroundY;
      skyDome.position.set(centerX, centerY, centerZ);
      skyDome.rotation.y += dt * 0.004;
      nightSkyDome.position.set(centerX, centerY, centerZ);
      nightSkyDome.rotation.y = skyDome.rotation.y;
      if (floodWaterPlane) {
        const waveAmp = scenario.id === 'tsunami' || scenario.id === 'storm_surge' ? 0.16 : 0.04;
        const baseY = scenario.id === 'tsunami' ? 0.55 : 0.35;
        const phaseWaterMult =
          currentRun.disasterPhase === 'all_clear'
            ? 0.08
            : currentRun.disasterPhase === 'subsiding'
            ? 0.45
            : 1.0;
        const ripple = Math.sin(elapsed * (scenario.id === 'tsunami' ? 3.2 : 2.1)) * waveAmp * phaseWaterMult;
        const targetY =
          (baseY + Math.min(scenario.id === 'tsunami' ? 2.1 : 1.45, currentRun.wave * 0.28)) *
            phaseWaterMult +
          ripple -
          (currentRun.disasterPhase === 'all_clear' ? 0.65 : 0);
        floodWaterPlane.position.set(
          centerX,
          THREE.MathUtils.damp(floodWaterPlane.position.y, targetY, 2.8, dt),
          centerZ
        );
        textures.waterRipple.offset.x = (elapsed * 0.06) % 1;
        textures.waterRipple.offset.y = (elapsed * 0.04) % 1;
      }
      if (meteors.length > 0) {
        const activeFall = currentRun.disasterPhase !== 'all_clear';
        for (const m of meteors) {
          m.group.visible = activeFall;
          if (!activeFall) continue;
          m.ox -= m.speed * dt * 0.65;
          m.oy -= m.speed * dt;
          if (m.oy < -2) {
            m.ox = (Math.random() - 0.2) * 58;
            m.oz = (Math.random() - 0.5) * 58;
            m.oy = 20 + Math.random() * 16;
          }
          m.group.position.set(centerX + m.ox, centerY + m.oy, centerZ + m.oz);
          m.group.rotation.y += dt * 3;
        }
      }
      keyLight.position.set(centerX + 16, centerY + 26, centerZ + 14);
      keyLight.target.position.set(centerX, centerY, centerZ);
      particles.position.set(centerX, centerY, centerZ);
      particles.visible = currentRun.disasterPhase !== 'all_clear';

      // Dynamic visibility / atmospheric fog clarity indoors, with Flare, or during All-Clear
      const calmsDown =
        currentRun.disasterPhase === 'all_clear'
          ? 0.45
          : currentRun.disasterPhase === 'subsiding'
          ? 0.72
          : 1.0;
      const targetFogDensity =
        currentRun.flareTurnsRemainingSec > 0
          ? 0.008
          : currentRoom
          ? 0.014
          : baseFog * (scenario.id === 'severe_fog' || scenario.id === 'duststorm' ? calmsDown : 1.0);
      fog.density = THREE.MathUtils.damp(fog.density, targetFogDensity, 4, dt);

      // Handle HUD Fire trigger & gun cooldown/recoil/tracer timers
      if (shootTriggerRef.current !== lastShootTrig) {
        lastShootTrig = shootTriggerRef.current;
        fireGun();
      }
      gunCooldown = Math.max(0, gunCooldown - dt);
      muzzleFlashTimer = Math.max(0, muzzleFlashTimer - dt);
      tracerTimer = Math.max(0, tracerTimer - dt);
      gunRecoil = THREE.MathUtils.damp(gunRecoil, 0, 16, dt);
      tracerMesh.visible = tracerTimer > 0;

      if (
        !inCutscene &&
        viewModeRef.current === 'first_person' &&
        currentRun.outcome === 'ongoing' &&
        currentRun.activeGun &&
        currentRun.activeGun.remainingSec > 0
      ) {
        fpGun.group.visible = true;
        const gDef = GUNS[currentRun.activeGun.type];
        (fpGun.energyRail.material as THREE.MeshBasicMaterial).color.setHex(gDef.colorNum);
        const swayX = moving && onGround ? Math.cos(walkBobTime * 0.5) * 0.015 : 0;
        const swayY = moving && onGround ? Math.abs(Math.sin(walkBobTime * 0.5)) * 0.012 : 0;
        fpGun.group.position.set(0.3 + swayX, -0.25 - swayY + gunRecoil * 0.02, -0.5 + gunRecoil * 0.09);
        fpGun.group.rotation.x = gunRecoil * 0.16;
        fpGun.muzzleFlash.visible = muzzleFlashTimer > 0;
      } else {
        fpGun.group.visible = false;
      }

      if (fpFlashlight.group.visible) {
        const swayX = moving && onGround ? Math.cos(walkBobTime * 0.5) * 0.012 : 0;
        const swayY = moving && onGround ? Math.abs(Math.sin(walkBobTime * 0.5)) * 0.01 : 0;
        fpFlashlight.group.position.set(-0.32 + swayX, -0.26 - swayY, -0.45);
      }

      // Animate Rescue Helicopter arrival (30s landing window) and departure lift-off every 2 days
      let heliLanded = false;
      if (activeCutsceneMode !== 'extraction') {
        const heli = currentRun.helicopter;
        if (heli && heli.arrived) {
          const landY = getExtractionY(heli.x, heli.z);
          heliLandingBeacon.group.visible = true;
          heliLandingBeacon.group.position.set(heli.x, landY, heli.z);
          heliLandingBeacon.ring.scale.setScalar(1 + Math.sin(elapsed * 3.5) * 0.06);

          const descent = Math.min(
            1,
            Math.max(0, (currentRun.elapsedSec - heli.arrivalTimeSec) / 3.0)
          );
          const ease = 1 - Math.pow(1 - descent, 3);
          heliLanded = descent >= 0.75;
          const heliY = THREE.MathUtils.lerp(landY + 34, landY + 0.35, ease);
          extractionHeli.group.visible = true;
          extractionHeli.group.position.set(heli.x, heliY, heli.z);
          extractionHeli.group.rotation.set(0, 0.35 + Math.sin(elapsed * 0.6) * 0.05, 0);
          extractionHeli.mainRotor.rotation.y += dt * 22;
          extractionHeli.tailRotor.rotation.x += dt * 28;
        } else if (
          heli &&
          heli.lastDepartedAtSec !== undefined &&
          heli.lastDepartedX !== undefined &&
          heli.lastDepartedZ !== undefined &&
          currentRun.elapsedSec - heli.lastDepartedAtSec < 4.0
        ) {
          const landY = getExtractionY(heli.lastDepartedX, heli.lastDepartedZ);
          const ascent = Math.min(1, Math.max(0, (currentRun.elapsedSec - heli.lastDepartedAtSec) / 4.0));
          const ease = ascent * ascent;
          const heliY = THREE.MathUtils.lerp(landY + 0.35, landY + 38, ease);
          heliLandingBeacon.group.visible = false;
          extractionHeli.group.visible = true;
          extractionHeli.group.position.set(heli.lastDepartedX, heliY, heli.lastDepartedZ);
          extractionHeli.group.rotation.set(-0.08 * ease, 0.35 + ascent * 0.4, 0);
          extractionHeli.mainRotor.rotation.y += dt * 24;
          extractionHeli.tailRotor.rotation.x += dt * 30;
        } else {
          heliLandingBeacon.group.visible = false;
          extractionHeli.group.visible = false;
        }
      }

      // Animate mounted chunk props (hospital medkits, supermarket food, superpowers, guns, rubbles, hazards)
      const pickupMagnetR = GAME_MODES[currentRun.gameMode].pickupMagnetRadius;
      const worldWallColliders: BoxCollider[] = [];
      for (const mc of mountedChunks.values()) {
        const ch = currentRun.chunks[mc.key];
        if (!ch) continue;
        worldWallColliders.push(...ch.colliders);
        for (const room of ch.rooms) {
          worldWallColliders.push(...getRoomClosedDoorColliders(room, currentRun.openDoorIds));
        }
        for (const d of mc.doorMeshes.values()) {
          const isOpen = Boolean(currentRun.openDoorIds[d.doorId]);
          d.leftPivot.rotation.y = THREE.MathUtils.damp(
            d.leftPivot.rotation.y,
            isOpen ? -1.48 : 0,
            11,
            dt
          );
          d.rightPivot.rotation.y = THREE.MathUtils.damp(
            d.rightPivot.rotation.y,
            isOpen ? 1.48 : 0,
            11,
            dt
          );
        }
        for (const r of ch.rubbles) {
          const rm = mc.rubbleMeshes.get(r.id);
          if (rm) rm.visible = !currentRun.clearedRubbleIds[r.id];
        }
        for (const sup of ch.buildingSupplies || []) {
          const sm = mc.supplyMeshes.get(sup.id);
          const alreadyCollected =
            Boolean(currentRun.collectedSupplyIds[sup.id]) || locallyCollectedSupplies.has(sup.id);
          if (sm) {
            sm.group.visible = true;
            sm.bobGroup.visible = !alreadyCollected;
            sm.ring.visible = !alreadyCollected;
            if (!alreadyCollected) {
              sm.bobGroup.position.y = 1.18;
              sm.bobGroup.rotation.y = Math.sin(elapsed * 1.4 + sup.x) * 0.18;
              sm.ring.scale.setScalar(1 + Math.sin(elapsed * 4 + sup.z) * 0.06);
            }
          }
          if (
            !alreadyCollected &&
            !inCutscene &&
            !modalOpen &&
            currentRun.outcome === 'ongoing' &&
            py < 2.2 &&
            Math.hypot(px - sup.x, pz - sup.z) <= Math.max(1.55, pickupMagnetR)
          ) {
            locallyCollectedSupplies.add(sup.id);
            if (sm) sm.group.visible = false;
            collectSupplyCbRef.current(sup.id, sup.itemType);
          }
        }
        for (const g of ch.guns || []) {
          const gm = mc.gunMeshes.get(g.id);
          const alreadyGotGun =
            Boolean(currentRun.collectedGunIds[g.id]) || locallyCollectedGuns.has(g.id);
          if (gm) {
            gm.group.visible = !alreadyGotGun;
            if (!alreadyGotGun) {
              gm.bobGroup.position.y = 0.58 + Math.sin(elapsed * 2.9 + g.x) * 0.13;
              gm.bobGroup.rotation.y += dt * 1.9;
              gm.ring.scale.setScalar(1 + Math.sin(elapsed * 4.2 + g.z) * 0.09);
            }
          }
          if (
            !alreadyGotGun &&
            !inCutscene &&
            !modalOpen &&
            currentRun.outcome === 'ongoing' &&
            py < 2.2 &&
            Math.hypot(px - g.x, pz - g.z) <= Math.max(1.75, pickupMagnetR)
          ) {
            locallyCollectedGuns.add(g.id);
            if (gm) gm.group.visible = false;
            collectGunCbRef.current(g.id, g.gunType);
          }
        }
        for (const sg of ch.signs || []) {
          const sm = mc.signMeshes.get(sg.id);
          if (sm) {
            sm.beacon.rotation.y += dt * 2.5;
          }
        }
        for (const h of ch.hazards) {
          const hm = mc.hazardMeshes.get(h.id);
          if (hm) {
            const active =
              h.activationWave <= currentRun.wave && currentRun.disasterPhase !== 'all_clear';
            hm.group.visible = active;
            if (active) {
              hm.group.position.set(h.x, getTerrainHeight(h.x, h.z) + 0.15, h.z);
              hm.core.rotation.y += dt * (scenario.id === 'tornado' || scenario.id === 'cyclone' ? 7.5 : 1.8);
              hm.core.scale.y =
                scenario.id === 'tornado' || scenario.id === 'cyclone'
                  ? 1 + Math.sin(elapsed * 4.5 + h.x) * 0.06
                  : 1 + Math.sin(elapsed * 7.5 + h.x) * 0.14;
            }
          }
        }
      }

      // Animate & Follow Survivors
      let escortIdx = 0;
      for (const s of Object.values(currentRun.survivorStates)) {
        const sm = survivorMeshes.get(s.id);
        if (!sm) continue;
        if (s.status === 'stranded') {
          sm.group.visible = true;
          sm.armR.rotation.z = -0.6 + Math.sin(elapsed * 6 + s.x) * 0.35;
          sm.ring.visible = true;
          (sm.ring.material as THREE.MeshBasicMaterial).color.setHex(
            s.inHazard ? 0xef4444 : 0xf59e0b
          );
        } else if (s.status === 'escorted') {
          sm.group.visible = true;
          sm.ring.visible = false;
          sm.armR.rotation.z = 0;
          const followDist = 2.0 + escortIdx * 1.1;
          const targetFx = px + Math.sin(yaw) * followDist;
          const targetFz = pz + Math.cos(yaw) * followDist;
          sm.posX = THREE.MathUtils.damp(sm.posX, targetFx, 5.2, dt);
          sm.posZ = THREE.MathUtils.damp(sm.posZ, targetFz, 5.2, dt);
          const sy = getSurfaceY(sm.posX, sm.posZ, currentRun.chunks) + 0.06;
          sm.group.position.set(sm.posX, sy, sm.posZ);
          sm.group.lookAt(px, sy, pz);
          escortIdx++;
        } else if (s.status === 'self_evacuated') {
          sm.ring.visible = false;
          sm.posX += dt * 2.5;
          const sy = getSurfaceY(sm.posX, sm.posZ, currentRun.chunks) + 0.06;
          sm.group.position.set(sm.posX, sy, sm.posZ);
          if (Math.hypot(sm.posX - px, sm.posZ - pz) > 18) {
            sm.group.visible = false;
          }
        } else {
          sm.group.visible = false;
        }
      }

      // Animate & Chase Predators / Monsters
      const predatorPositions: Array<{ id: string; x: number; z: number }> = [];
      for (const pr of Object.values(currentRun.predatorStates)) {
        const pm = predatorMeshes.get(pr.id);
        if (!pm) continue;
        if (!pr.alive || locallyKilledPredators.has(pr.id)) {
          pm.group.visible = false;
          continue;
        }

        const dx = px - pm.posX;
        const dz = pz - pm.posZ;
        const dToPlayer = Math.hypot(dx, dz);
        if (dToPlayer > 52) {
          pm.group.visible = false;
          continue;
        }
        pm.group.visible = true;

        if (!inCutscene && !modalOpen && currentRun.outcome === 'ongoing' && dToPlayer < 46) {
          if (dToPlayer > pr.radius + 0.48) {
            const nx = dx / dToPlayer;
            const nz = dz / dToPlayer;
            const stepX = pm.posX + nx * pr.speed * dt;
            const stepZ = pm.posZ + nz * pr.speed * dt;
            const resolved = resolveInfiniteCollisions(
              stepX,
              stepZ,
              pr.radius * 0.68,
              worldWallColliders
            );
            pm.posX = resolved.x;
            pm.posZ = resolved.z;
          }
          const stride = Math.sin(elapsed * 6.5 + pm.seed) * 0.52;
          pm.legL.rotation.x = stride;
          pm.legR.rotation.x = -stride;
          pm.ring.scale.setScalar(1 + Math.sin(elapsed * 3.8 + pm.seed) * 0.08);

          pm.cooldown = Math.max(0, pm.cooldown - dt);
          if (dToPlayer <= pr.radius + 0.78 && py < 1.35 && pm.cooldown <= 0) {
            pm.cooldown = 0.95;
            predatorHitCbRef.current(pr.name, pr.damage);
          }
        }

        const pry = getSurfaceY(pm.posX, pm.posZ, currentRun.chunks);
        const breathBob = Math.abs(Math.sin(elapsed * 3.2 + pm.seed)) * 0.05;
        pm.group.position.set(pm.posX, pry + breathBob, pm.posZ);
        pm.group.lookAt(px, pry + breathBob, pz);
        predatorPositions.push({ id: pr.id, x: pm.posX, z: pm.posZ });
      }

      // Update particles wrapping locally around player
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let ppy = posAttr.getY(i);
        let ppx = posAttr.getX(i);
        let ppz = posAttr.getZ(i);
        if (scenario.id === 'wildfire' || scenario.id === 'volcano') {
          ppy += dt * 2.2;
          ppx += dt * 0.8;
          if (ppy > 8) ppy = 0.2;
          if (ppx > 17) ppx = -17;
        } else if (scenario.id === 'tornado' || scenario.id === 'cyclone') {
          const ang = dt * 1.9;
          const nx = ppx * Math.cos(ang) - ppz * Math.sin(ang);
          const nz = ppx * Math.sin(ang) + ppz * Math.cos(ang);
          ppx = nx;
          ppz = nz;
          ppy += Math.sin(elapsed * 4 + i) * dt * 1.6;
          if (ppy < 0.2 || ppy > 8.5) ppy = 1.5;
        } else if (scenario.id === 'duststorm') {
          ppx += dt * 9.5;
          ppy -= dt * 0.6;
          if (ppx > 17) ppx = -17;
          if (ppy < 0) ppy = 7.5;
        } else if (scenario.id === 'asteroid') {
          ppy -= dt * 6.5;
          ppx -= dt * 3.8;
          if (ppy < 0) ppy = 8;
          if (ppx < -17) ppx = 17;
        } else {
          const fallSpeed =
            scenario.id === 'thunderstorm' || scenario.id === 'tsunami' || scenario.id === 'hailstorm'
              ? 8.5
              : scenario.id === 'blizzard' || scenario.id === 'avalanche' || scenario.id === 'heavy_snowfall'
              ? 4.0
              : 5.0;
          const windX =
            scenario.id === 'blizzard' || scenario.id === 'windstorm'
              ? 3.2
              : scenario.id === 'thunderstorm'
              ? 1.8
              : 0.3;
          ppy -= dt * fallSpeed;
          ppx += dt * windX;
          if (ppy < 0) ppy = 8;
          if (ppx > 17) ppx = -17;
        }
        posAttr.setY(i, ppy);
        posAttr.setX(i, ppx);
        posAttr.setZ(i, ppz);
      }
      posAttr.needsUpdate = true;

      // Throttled simulation & HUD callback (~5Hz, or immediate on prompt/room change; paused during opening cutscene)
      uiTimer += dt;
      if (!inCutscene && currentRun.outcome === 'ongoing') {
        let nearest: NearbyPrompt | null = null;
        let bestDist = 999;
        let nearestExtDist = 999;
        let nearestExtAngle = 0;

        const heli = currentRun.helicopter;
        if (heli && heli.arrived) {
          const ed = Math.hypot(px - heli.x, pz - heli.z);
          const boardRemSec = Math.max(0, Math.ceil(heli.departureTimeSec - currentRun.elapsedSec));
          nearestExtDist = ed;
          const targetAngle = Math.atan2(heli.x - px, -(heli.z - pz));
          nearestExtAngle = ((targetAngle + yaw) * 180) / Math.PI;
          if (ed < 4.2 && ed < bestDist) {
            bestDist = ed;
            const modeDef = GAME_MODES[currentRun.gameMode];
            if (currentRun.gameMode === 'endless_survival') {
              const resupplyId = `heli_resupply_${Math.round(heli.arrivalTimeSec)}`;
              const claimed = Boolean(currentRun.claimedResupplyIds[resupplyId]);
              nearest = {
                kind: 'extraction',
                id: resupplyId,
                title: `Rescue Helicopter (${boardRemSec}s left)`,
                subtitle: claimed
                  ? 'Helicopter drop crate claimed for this 2-day visit'
                  : `Field Resupply (${boardRemSec}s before takeoff): +45% Health/Stamina & +2 supplies`,
                actionLabel: claimed ? 'Claimed' : 'Claim Resupply',
                disabled: claimed,
              };
            } else {
              const rescuedTotal = Object.values(currentRun.survivorStates).filter(
                (s) =>
                  s.status === 'escorted' ||
                  s.status === 'self_evacuated' ||
                  s.status === 'rescued'
              ).length;
              const remainingReq = Math.max(0, modeDef.requiredRescues - rescuedTotal);
              nearest = {
                kind: 'extraction',
                id: 'rescue_helicopter',
                title: `Rescue Helicopter (${boardRemSec}s left)`,
                subtitle: !heliLanded
                  ? 'Rescue Helicopter descending — prepare to board...'
                  : remainingReq > 0
                  ? `Rescue Ops: Save ${remainingReq} more civilian${remainingReq === 1 ? '' : 's'} to board`
                  : `Landed (${boardRemSec}s before takeoff) — board now or wait 2 days!`,
                actionLabel: !heliLanded
                  ? 'Landing...'
                  : remainingReq > 0
                  ? 'Boarding Locked'
                  : `Board (${boardRemSec}s)`,
                disabled: !heliLanded || remainingReq > 0,
              };
            }
          }
        }

        for (const s of Object.values(currentRun.survivorStates)) {
          if (s.status !== 'stranded') continue;
          const dist = Math.hypot(px - s.x, pz - s.z);
          if (dist < 2.6 && dist < bestDist) {
            bestDist = dist;
            nearest = {
              kind: 'survivor',
              id: s.id,
              title: s.name,
              subtitle: `${s.role} · ${s.roomName}`,
              actionLabel: 'Rescue Choice',
            };
          }
        }

        // Intelligent Directional Resource Arrow (NON-SPOILERY: guides ONLY to location & distance)
        let bestResDist = 36;
        let bestResDx = 0;
        let bestResDz = 0;
        let foundRes = false;

        for (const mc of mountedChunks.values()) {
          const ch = currentRun.chunks[mc.key];
          if (!ch) continue;
          for (const sg of ch.signs || []) {
            const dist = Math.hypot(px - sg.x, pz - sg.z);
            if (dist < 2.8 && dist < bestDist) {
              bestDist = dist;
              nearest = {
                kind: 'sign',
                id: sg.id,
                title: sg.title,
                subtitle: 'Roadside Warning Sign — inspect local emergency advisory',
                actionLabel: 'Read Sign',
              };
            }
          }
          for (const g of ch.guns || []) {
            if (currentRun.collectedGunIds[g.id] || locallyCollectedGuns.has(g.id)) continue;
            const dist = Math.hypot(px - g.x, pz - g.z);
            if (dist > 1.5 && dist < bestResDist) {
              bestResDist = dist;
              bestResDx = g.x - px;
              bestResDz = g.z - pz;
              foundRes = true;
            }
            if (dist < 3.0 && dist < bestDist) {
              bestDist = dist;
              const def = GUNS[g.gunType];
              nearest = {
                kind: 'gun',
                id: g.id,
                gunType: g.gunType,
                title: `${def.emoji} ${def.name} (30s)`,
                subtitle: def.description,
                actionLabel: 'Equip Gun',
              };
            }
          }
          for (const s of ch.buildingSupplies || []) {
            if (currentRun.collectedSupplyIds[s.id] || locallyCollectedSupplies.has(s.id)) continue;
            const dist = Math.hypot(px - s.x, pz - s.z);
            // Rare Hospitals & Supermarkets can be picked up by Resource Signal from up to 72m
            if (dist > 1.5 && dist < 72 && (!foundRes || dist < bestResDist || bestResDist > 36)) {
              if (!foundRes || dist < bestResDist) {
                bestResDist = dist;
                bestResDx = s.x - px;
                bestResDz = s.z - pz;
                foundRes = true;
              }
            }
            if (dist < 2.6 && dist < bestDist) {
              bestDist = dist;
              const isMed = s.itemType === 'medkit';
              nearest = {
                kind: 'supply',
                id: s.id,
                itemType: s.itemType,
                title: isMed ? '🏥 Hospital Medkit Shelf' : '🍎 Supermarket Food Shelf',
                subtitle: isMed
                  ? 'Trauma Medkit on Hospital shelf (+38% Health)'
                  : 'Fresh Food on Supermarket shelf (+40% Stamina & +14 HP)',
                actionLabel: isMed ? 'Take from Shelf' : 'Take from Shelf',
              };
            }
          }
          for (const d of mc.doorMeshes.values()) {
            const dist = Math.hypot(px - d.worldX, pz - d.worldZ);
            if (dist < 2.55 && dist < bestDist) {
              bestDist = dist;
              const isOpen = Boolean(currentRun.openDoorIds[d.doorId]);
              nearest = {
                kind: 'door',
                id: d.doorId,
                title: `${d.roomName} Door`,
                subtitle: isOpen
                  ? 'Close door to seal shelter against hazards & monsters'
                  : d.isShelter
                  ? 'Reinforced shelter door — open to enter'
                  : 'Swing double doors open to pass through',
                actionLabel: isOpen ? 'Close Door' : 'Open Door',
              };
            }
          }
          for (const r of ch.rubbles) {
            if (currentRun.clearedRubbleIds[r.id]) continue;
            const dist = Math.hypot(px - r.x, pz - r.z);
            if (dist < 2.9 && dist < bestDist) {
              bestDist = dist;
              const hasTool = hasItemType(currentRun.inventory, 'tool');
              nearest = {
                kind: 'rubble',
                id: r.id,
                title: r.label,
                subtitle: hasTool
                  ? `Use ${scenario.toolName} to clear path`
                  : `Blocked · Needs ${scenario.toolName}`,
                actionLabel: 'Clear Debris',
                disabled: !hasTool,
              };
            }
          }
        }

        let resourceArrow: ResourceArrowTarget | null = null;
        if (foundRes) {
          const fwdX = -Math.sin(yaw);
          const fwdZ = -Math.cos(yaw);
          const rightX = Math.cos(yaw);
          const rightZ = -Math.sin(yaw);
          const fwdDot = bestResDx * fwdX + bestResDz * fwdZ;
          const rightDot = bestResDx * rightX + bestResDz * rightZ;
          resourceArrow = {
            distance: Math.round(bestResDist),
            angleDeg: Math.round((Math.atan2(rightDot, fwdDot) * 180) / Math.PI),
          };
        }

        const roomName = currentRoom ? currentRoom.name : 'Outdoor Corridor';
        const promptSig = nearest
          ? `${nearest.kind}:${nearest.id}:${nearest.disabled}:${nearest.actionLabel}`
          : 'none';
        const changed = promptSig !== lastPromptSig || roomName !== lastRoomSig;

        if (uiTimer >= 0.2 || changed) {
          const simDt = uiTimer;
          uiTimer = 0;
          lastPromptSig = promptSig;
          lastRoomSig = roomName;
          const distDelta = accumulatedDist;
          accumulatedDist = 0;
          const sprintReport = sprintingDuringInterval;
          sprintingDuringInterval = false;

          tickCbRef.current(
            simDt,
            px,
            pz,
            yaw,
            distDelta,
            roomName,
            Boolean(currentRoom?.isShelter),
            nearest,
            nearestExtDist < 999 ? Math.round(nearestExtDist) : 0,
            nearestExtAngle,
            sprintReport,
            predatorPositions,
            resourceArrow,
            getTerrainHeight(px, pz)
          );
        }
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      textures.dispose();
      envTex.dispose();
      roadMat.dispose();
      terrainMat.dispose();
      particleGeo.dispose();
      skyDome.geometry.dispose();
      (skyDome.material as THREE.Material).dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material?.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [scenarioId, graphicsQuality, joystickVecRef, yawOffsetRef, jumpTriggerRef, shootTriggerRef, sprintRef]);

  const isArmed = Boolean(run.activeGun && run.activeGun.remainingSec > 0);

  return (
    <div className="relative w-full h-full bg-[#0B111B]">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {/* Subtle Center Crosshair (1st & 3rd person; highlights rose/amber when armed) */}
      {cutsceneMode === null && viewMode !== 'free_cam' && !webglUnsupported && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
          {isArmed ? (
            <div className="relative flex h-6 w-6 items-center justify-center">
              <div className="h-5 w-5 rounded-full border-2 border-rose-400/90 shadow-sm" />
              <div className="absolute h-1.5 w-1.5 rounded-full bg-amber-300" />
            </div>
          ) : (
            <div className="h-1.5 w-1.5 rounded-full bg-white/75 ring-2 ring-slate-950/60" />
          )}
        </div>
      )}
      {webglLost && !webglUnsupported && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-center p-6">
          <div className="space-y-2">
            <p className="font-display text-2xl font-bold text-amber-400">3D View Interrupted</p>
            <p className="text-sm text-slate-300">Recovering WebGL context.</p>
          </div>
        </div>
      )}
      {webglUnsupported && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/95 text-center p-6">
          <div className="max-w-md space-y-2.5 rounded-xl border border-amber-500/40 bg-[#131C2B] p-6">
            <p className="font-display text-2xl font-bold text-amber-400">
              3D Graphics Unavailable on This Browser
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your device or browser has WebGL hardware rendering disabled. Enable WebGL in browser
              settings or switch Graphics Quality to Balanced and reload.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

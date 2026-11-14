import { useCallback, useEffect, useRef, useState } from 'react';
import { ControlsModal } from './components/ControlsModal';
import { CutsceneOverlay } from './components/CutsceneOverlay';
import { EndReportModal } from './components/EndReportModal';
import { GameHUD } from './components/GameHUD';
import { RescueModal } from './components/RescueModal';
import { SettingsModal } from './components/SettingsModal';
import { SignModal } from './components/SignModal';
import { StartPage } from './components/StartPage';
import { StatsAchievementsModal } from './components/StatsAchievementsModal';
import { TitleMenu } from './components/TitleMenu';
import { TopBar } from './components/TopBar';
import { TutorialVideoModal } from './components/TutorialVideoModal';
import { DIFFICULTIES, HELICOPTER_ARRIVAL_SEC, HELICOPTER_STAY_SEC } from './data/achievements';
import { CHARACTERS } from './data/characters';
import { GAME_MODES } from './data/gameModes';
import { GUNS } from './data/guns';
import { createItem, SCENARIOS } from './data/scenarios';
import { getLanguageDir } from './i18n/translations';
import { FirstPersonViewport } from './three/FirstPersonViewport';
import {
  ActiveRunState,
  CameraViewMode,
  CareerStats,
  CharacterId,
  ChunkData,
  ControlPlatform,
  CustomMusicControls,
  Difficulty,
  DisasterId,
  GameMode,
  GameState,
  GraphicsQuality,
  GunType,
  LanguageCode,
  NearbyPrompt,
  PerformanceEvaluation,
  ResourceArrowTarget,
  ThemeMode,
  WarningSign,
} from './types/game';
import {
  addLog,
  computeDisasterPhase,
  evaluateRunPerformance,
  getSurvivorRescueResources,
  getWaveInterval,
  hasItemType,
  initializeRun,
  loadCareerStats,
  recordRunToCareer,
  saveCareerStats,
} from './utils/gameEngine';
import { soundFX } from './utils/sound';
import { tutorialVoiceOver } from './utils/voiceOver';

let runtimeItemId = 1000;
const THEME_STORAGE_KEY = 'lifeline_sector_theme';
const BEST_POINTS_STORAGE_KEY = 'lifeline_sector_best_points';
const LANGUAGE_STORAGE_KEY = 'safequest_language';
const VOICE_LANGUAGE_STORAGE_KEY = 'safequest_voice_language';
const GRAPHICS_STORAGE_KEY = 'safequest_graphics';
const CONTROL_PLATFORM_STORAGE_KEY = 'safequest_control_platform';

function loadSavedControlPlatform(): ControlPlatform {
  if (typeof window === 'undefined') return 'auto';
  try {
    const raw = window.localStorage.getItem(CONTROL_PLATFORM_STORAGE_KEY);
    if (raw === 'pc' || raw === 'mobile' || raw === 'controller' || raw === 'auto') return raw;
    return 'auto';
  } catch {
    return 'auto';
  }
}

function loadSavedTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function loadSavedBestPoints(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(BEST_POINTS_STORAGE_KEY);
    if (raw === null) return 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
  } catch {
    return 0;
  }
}

function loadSavedLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  try {
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null;
    const valid: LanguageCode[] = ['en', 'hi', 'es', 'fr', 'ar', 'zh', 'ja', 'pt', 'de', 'ko'];
    return raw && valid.includes(raw) ? raw : 'en';
  } catch {
    return 'en';
  }
}

function loadSavedVoiceLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  try {
    const raw = window.localStorage.getItem(VOICE_LANGUAGE_STORAGE_KEY) as LanguageCode | null;
    const valid: LanguageCode[] = ['en', 'hi', 'es', 'fr', 'ar', 'zh', 'ja', 'pt', 'de', 'ko'];
    if (raw && valid.includes(raw)) return raw;
    return loadSavedLanguage();
  } catch {
    return 'en';
  }
}

function loadSavedGraphics(): GraphicsQuality {
  if (typeof window === 'undefined') return 'high';
  try {
    const raw = window.localStorage.getItem(GRAPHICS_STORAGE_KEY);
    if (raw === 'ultra' || raw === 'balanced' || raw === 'high') return raw;
    return 'high';
  } catch {
    return 'high';
  }
}

function findHelicopterLandingSpot(
  chunks: Record<string, ChunkData>,
  px: number,
  pz: number
): { x: number; z: number } {
  const rooms = Object.values(chunks).flatMap((ch) => ch.rooms);
  const radii = [18, 22, 26, 14];
  const margin = 3.5;

  for (const r of radii) {
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const cx = px + Math.cos(ang) * r;
      const cz = pz + Math.sin(ang) * r;
      const blocked = rooms.some(
        (rm) =>
          cx >= rm.x - rm.w / 2 - margin &&
          cx <= rm.x + rm.w / 2 + margin &&
          cz >= rm.z - rm.d / 2 - margin &&
          cz <= rm.z + rm.d / 2 + margin
      );
      if (!blocked) {
        return { x: Math.round(cx * 10) / 10, z: Math.round(cz * 10) / 10 };
      }
    }
  }
  return { x: Math.round((px + 18) * 10) / 10, z: Math.round(pz * 10) / 10 };
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START_PAGE');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('adult');
  const [customShirtHex, setCustomShirtHex] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<CameraViewMode>('third_person');
  const lastCharViewRef = useRef<'third_person' | 'first_person'>('third_person');
  const [controlPlatform, setControlPlatform] = useState<ControlPlatform>(loadSavedControlPlatform);
  const [controllerConnected, setControllerConnected] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(loadSavedTheme);
  const [language, setLanguage] = useState<LanguageCode>(loadSavedLanguage);
  const [voiceLanguage, setVoiceLanguage] = useState<LanguageCode>(loadSavedVoiceLanguage);
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(loadSavedGraphics);
  const [careerStats, setCareerStats] = useState<CareerStats>(loadCareerStats);
  const careerStatsRef = useRef(careerStats);
  careerStatsRef.current = careerStats;
  const [bestPoints, setBestPoints] = useState<number>(loadSavedBestPoints);
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterId>('wildfire');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [selectedMode, setSelectedMode] = useState<GameMode>('standard_escape');
  const [enablePredators, setEnablePredators] = useState(false);
  const [enableGuns, setEnableGuns] = useState(false);
  const [showTutorialVideo, setShowTutorialVideo] = useState(true);
  const [run, setRun] = useState<ActiveRunState | null>(null);
  const [runKey, setRunKey] = useState(1);
  const [muted, setMuted] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);

  // Persistent custom soundtrack state (plays continuously on repeat across screens)
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [musicName, setMusicName] = useState<string | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicLoop, setMusicLoop] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.55);
  const [musicError, setMusicError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicUrlRef = useRef<string | null>(null);
  const pendingAutoPlayRef = useRef(false);

  const [nearbyPrompt, setNearbyPrompt] = useState<NearbyPrompt | null>(null);
  const [resourceArrow, setResourceArrow] = useState<ResourceArrowTarget | null>(null);
  const [extractionDist, setExtractionDist] = useState(40);
  const [extractionAngleDeg, setExtractionAngleDeg] = useState(0);
  const [cutsceneMode, setCutsceneMode] = useState<'intro' | 'extraction' | null>(null);
  const [cutsceneProgress, setCutsceneProgress] = useState(0);
  const [sprintActive, setSprintActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [performanceEval, setPerformanceEval] = useState<PerformanceEvaluation | null>(null);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<string[]>([]);
  const [newlyUnlockedRegion, setNewlyUnlockedRegion] = useState<string | null>(null);
  const recordedRunKeyRef = useRef<number>(0);

  const joystickVecRef = useRef({ x: 0, y: 0 });
  const yawOffsetRef = useRef(0);
  const jumpTriggerRef = useRef(0);
  const shootTriggerRef = useRef(0);
  const sprintRef = useRef(false);
  const warnedWaveRef = useRef<number>(-1);

  const toggleMute = () => {
    const next = !muted;
    soundFX.muted = next;
    setMuted(next);
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.loop = musicLoop;
    el.muted = muted;
    el.volume = musicVolume;
  }, [musicLoop, muted, musicVolume, musicUrl]);

  useEffect(() => {
    return () => {
      if (musicUrlRef.current) {
        URL.revokeObjectURL(musicUrlRef.current);
      }
    };
  }, []);

  const attemptAudioPlay = useCallback((el: HTMLAudioElement) => {
    el.play()
      .then(() => {
        pendingAutoPlayRef.current = false;
        setMusicPlaying(true);
        setMusicError(null);
      })
      .catch((err: unknown) => {
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError') {
          pendingAutoPlayRef.current = false;
          setMusicPlaying(false);
          setMusicError('Browser paused autoplay — tap Play to start track.');
        } else if (name === 'NotSupportedError') {
          pendingAutoPlayRef.current = false;
          setMusicPlaying(false);
          setMusicError('Audio format not supported by this browser.');
        }
      });
  }, []);

  const handleUploadMusic = useCallback(
    (file: File) => {
      if (musicUrlRef.current) {
        URL.revokeObjectURL(musicUrlRef.current);
      }
      const nextUrl = URL.createObjectURL(file);
      musicUrlRef.current = nextUrl;
      const cleanName = file.name.replace(/\.[^/.]+$/, '') || 'Custom Track';
      setMusicUrl(nextUrl);
      setMusicName(cleanName);
      setMusicLoop(true);
      setMusicError(null);
      pendingAutoPlayRef.current = true;

      if (muted) {
        soundFX.muted = false;
        setMuted(false);
      }

      const el = audioRef.current;
      if (el) {
        el.src = nextUrl;
        el.loop = true;
        el.muted = false;
        el.volume = musicVolume;
        el.currentTime = 0;
        el.load();
        attemptAudioPlay(el);
      }
    },
    [attemptAudioPlay, musicVolume, muted]
  );

  const handleToggleMusicPlay = useCallback(() => {
    const el = audioRef.current;
    if (!el || !musicUrlRef.current) return;
    setMusicError(null);
    if (el.paused) {
      if (!el.src) {
        el.src = musicUrlRef.current;
        el.load();
      }
      attemptAudioPlay(el);
    } else {
      pendingAutoPlayRef.current = false;
      el.pause();
    }
  }, [attemptAudioPlay]);

  const handleToggleMusicLoop = useCallback(() => {
    setMusicLoop((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.loop = next;
      }
      return next;
    });
  }, []);

  const handleMusicVolumeChange = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setMusicVolume(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  const handleClearMusic = useCallback(() => {
    pendingAutoPlayRef.current = false;
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute('src');
      el.load();
    }
    if (musicUrlRef.current) {
      URL.revokeObjectURL(musicUrlRef.current);
      musicUrlRef.current = null;
    }
    setMusicUrl(null);
    setMusicName(null);
    setMusicPlaying(false);
    setMusicError(null);
  }, []);

  const musicControls: CustomMusicControls = {
    trackName: musicName,
    hasTrack: Boolean(musicUrl),
    isPlaying: musicPlaying,
    isLooping: musicLoop,
    volume: musicVolume,
    error: musicError,
    onUploadFile: handleUploadMusic,
    onTogglePlay: handleToggleMusicPlay,
    onToggleLoop: handleToggleMusicLoop,
    onVolumeChange: handleMusicVolumeChange,
    onClearTrack: handleClearMusic,
  };

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage quota errors
    }
  }, [theme]);

  useEffect(() => {
    if (!run) return;
    if (run.points > bestPoints) {
      setBestPoints(run.points);
      try {
        window.localStorage.setItem(BEST_POINTS_STORAGE_KEY, String(run.points));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [run, bestPoints]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage quota errors
    }
  }, [language]);

  useEffect(() => {
    try {
      window.localStorage.setItem(VOICE_LANGUAGE_STORAGE_KEY, voiceLanguage);
    } catch {
      // Ignore storage quota errors
    }
  }, [voiceLanguage]);

  useEffect(() => {
    try {
      window.localStorage.setItem(GRAPHICS_STORAGE_KEY, graphicsQuality);
    } catch {
      // Ignore storage quota errors
    }
  }, [graphicsQuality]);

  useEffect(() => {
    if (!run || run.outcome === 'ongoing' || recordedRunKeyRef.current === runKey) return;
    recordedRunKeyRef.current = runKey;
    const evalResult = evaluateRunPerformance(run);
    const { nextStats, newlyUnlockedAchievements: newAch, newlyUnlockedRegion: newReg } =
      recordRunToCareer(careerStatsRef.current, run, evalResult);
    setPerformanceEval(evalResult);
    setCareerStats(nextStats);
    setNewlyUnlockedAchievements(newAch);
    setNewlyUnlockedRegion(newReg);
  }, [run, runKey]);

  const handleToggleSandbox = useCallback(() => {
    setCareerStats((prev) => {
      const next = { ...prev, sandboxUnlockAll: !prev.sandboxUnlockAll };
      saveCareerStats(next);
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CONTROL_PLATFORM_STORAGE_KEY, controlPlatform);
    } catch {
      // Ignore storage quota errors
    }
  }, [controlPlatform]);

  useEffect(() => {
    const syncGamepads = () => {
      const pads = navigator.getGamepads?.();
      const hasPad = pads ? Array.from(pads).some((p) => Boolean(p && p.connected)) : false;
      setControllerConnected(hasPad);
    };
    syncGamepads();
    window.addEventListener('gamepadconnected', syncGamepads);
    window.addEventListener('gamepaddisconnected', syncGamepads);
    return () => {
      window.removeEventListener('gamepadconnected', syncGamepads);
      window.removeEventListener('gamepaddisconnected', syncGamepads);
    };
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleSelectViewMode = useCallback((mode: CameraViewMode) => {
    if (mode === 'third_person' || mode === 'first_person') {
      lastCharViewRef.current = mode;
    }
    setViewMode(mode);
  }, []);

  const handleToggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next: CameraViewMode =
        prev === 'free_cam'
          ? lastCharViewRef.current
          : prev === 'first_person'
          ? 'third_person'
          : 'first_person';
      if (next === 'third_person' || next === 'first_person') {
        lastCharViewRef.current = next;
      }
      return next;
    });
  }, []);

  const handleToggleFreeCam = useCallback(() => {
    setViewMode((prev) => {
      if (prev === 'free_cam') {
        return lastCharViewRef.current;
      }
      if (prev === 'third_person' || prev === 'first_person') {
        lastCharViewRef.current = prev;
      }
      return 'free_cam';
    });
  }, []);

  const handleSelectMode = useCallback((mode: GameMode) => {
    setSelectedMode(mode);
    const isMonsterMode = mode === 'monster_hunt';
    setEnablePredators(isMonsterMode);
    setEnableGuns(isMonsterMode);
  }, []);

  const toggleSprint = useCallback(() => {
    setSprintActive((prev) => {
      const next = !prev;
      sprintRef.current = next;
      return next;
    });
  }, []);

  const startNewRun = useCallback(
    (
      disaster: DisasterId = selectedDisaster,
      diff: Difficulty = difficulty,
      mode: GameMode = selectedMode,
      predatorsEnabled: boolean = enablePredators,
      gunsEnabled: boolean = enableGuns,
      characterId: CharacterId = selectedCharacter
    ) => {
      tutorialVoiceOver.stop();
      setShowTutorialVideo(false);
      const fresh = initializeRun(disaster, diff, mode, {
        enablePredators: predatorsEnabled,
        enableGuns: gunsEnabled,
        characterId,
        customShirtHex,
      });
      yawOffsetRef.current = 0;
      joystickVecRef.current = { x: 0, y: 0 };
      sprintRef.current = false;
      warnedWaveRef.current = -1;
      setSprintActive(false);
      setNearbyPrompt(null);
      setResourceArrow(null);
      setPerformanceEval(null);
      setNewlyUnlockedAchievements([]);
      setNewlyUnlockedRegion(null);
      setMapExpanded(false);
      setCutsceneProgress(0);
      setCutsceneMode('intro');
      soundFX.cutsceneCue();
      setRun(fresh);
      setRunKey((k) => k + 1);
      setGameState('PLAYING');
    },
    [
      selectedDisaster,
      difficulty,
      selectedMode,
      enablePredators,
      enableGuns,
      selectedCharacter,
      customShirtHex,
    ]
  );

  const handleCollectSupply = useCallback((supplyId: string, itemType: 'medkit' | 'food') => {
    setRun((prev) => {
      if (!prev || prev.collectedSupplyIds[supplyId]) return prev;
      const scenario = SCENARIOS[prev.scenarioId];
      const newItem = createItem(itemType, scenario, `item-${runtimeItemId++}`);
      soundFX.pickup();
      return {
        ...prev,
        inventory: [...prev.inventory, newItem],
        collectedSupplyIds: { ...prev.collectedSupplyIds, [supplyId]: true },
        itemsCollectedCount: prev.itemsCollectedCount + 1,
        points: prev.points + 30,
        logs: addLog(
          prev.logs,
          prev.elapsedSec,
          itemType === 'medkit'
            ? `Picked up Hospital Medkit (${newItem.emoji} ${newItem.shortLabel}, +30 pts).`
            : `Picked up Supermarket Food (${newItem.emoji} ${newItem.shortLabel}, +30 pts).`,
          'item'
        ),
      };
    });
  }, []);

  const handleToggleFlashlight = useCallback(() => {
    setRun((prev) => {
      if (!prev || prev.outcome !== 'ongoing') return prev;
      const cyclePos = prev.elapsedSec % 120;
      const isNightTime = cyclePos >= 56;
      if (!isNightTime) {
        return {
          ...prev,
          flashlightOn: false,
          logs: addLog(
            prev.logs,
            prev.elapsedSec,
            '☀️ Flashlight can only be turned on during night time.',
            'info'
          ),
        };
      }
      const nextOn = !prev.flashlightOn;
      soundFX.pickup();
      return {
        ...prev,
        flashlightOn: nextOn,
        logs: addLog(
          prev.logs,
          prev.elapsedSec,
          nextOn ? '🔦 Flashlight switched ON.' : '🔦 Flashlight switched OFF.',
          'info'
        ),
      };
    });
  }, []);

  const handleCollectGun = useCallback((gunId: string, gunType: GunType) => {
    setRun((prev) => {
      if (!prev || prev.collectedGunIds[gunId]) return prev;
      const def = GUNS[gunType];
      soundFX.pickup();
      return {
        ...prev,
        collectedGunIds: { ...prev.collectedGunIds, [gunId]: true },
        activeGun: { type: gunType, remainingSec: def.durationSec },
        logs: addLog(
          prev.logs,
          prev.elapsedSec,
          `Equipped ${def.emoji} ${def.name} (${def.durationSec}s) — click screen, tap FIRE, or press G to shoot.`,
          'item'
        ),
      };
    });
  }, []);

  const handleKillPredator = useCallback((predatorId: string) => {
    setRun((prev) => {
      if (!prev) return prev;
      const target = prev.predatorStates[predatorId];
      if (!target || !target.alive) return prev;
      return {
        ...prev,
        predatorsDefeatedCount: prev.predatorsDefeatedCount + 1,
        points: prev.points + 150,
        predatorStates: {
          ...prev.predatorStates,
          [predatorId]: { ...target, alive: false, hp: 0 },
        },
        logs: addLog(
          prev.logs,
          prev.elapsedSec,
          `Eliminated ${target.name} (+150 pts)!`,
          'rescue'
        ),
      };
    });
  }, []);

  const handlePredatorHitPlayer = useCallback((predatorName: string, damage: number) => {
    setRun((prev) => {
      if (!prev || prev.outcome !== 'ongoing') return prev;
      soundFX.predatorBite();
      const charDef = CHARACTERS[prev.characterId];
      const dmg = damage * GAME_MODES[prev.gameMode].damageMultiplier * charDef.damageMultiplier;
      const nextHealth = Math.max(0, prev.health - dmg);

      if (nextHealth <= 0) {
        soundFX.fail();
        setGameState('GAME_OVER');
        return {
          ...prev,
          health: 0,
          outcome: 'fallen',
          outcomeReason: `Taken down by ${predatorName} near ${prev.currentRoomName} after ${Math.round(
            prev.distanceTraveled
          )}m.`,
          logs: addLog(
            prev.logs,
            prev.elapsedSec,
            `${predatorName} overwhelmed you!`,
            'hazard'
          ),
        };
      }

      return {
        ...prev,
        health: nextHealth,
        logs: addLog(
          prev.logs,
          prev.elapsedSec,
          `${predatorName} struck you (-${Math.round(dmg)} HP)! Shoot it or run!`,
          'warning'
        ),
      };
    });
  }, []);

  const handleFireGun = useCallback(() => {
    shootTriggerRef.current += 1;
  }, []);

  const handleEnsureChunks = useCallback((newChunks: ChunkData[]) => {
    setRun((prev) => {
      if (!prev) return prev;
      const nextChunks = { ...prev.chunks };
      const nextSurvivors = { ...prev.survivorStates };
      const nextPredators = { ...prev.predatorStates };

      for (const ch of newChunks) {
        if (!nextChunks[ch.key]) {
          nextChunks[ch.key] = ch;
          for (const s of ch.survivors) {
            if (!nextSurvivors[s.id]) nextSurvivors[s.id] = { ...s };
          }
          for (const pr of ch.predators || []) {
            if (!nextPredators[pr.id]) nextPredators[pr.id] = { ...pr };
          }
        }
      }

      return {
        ...prev,
        chunks: nextChunks,
        survivorStates: nextSurvivors,
        predatorStates: nextPredators,
      };
    });
  }, []);

  const handleTickSimulation = useCallback(
    (
      dt: number,
      px: number,
      pz: number,
      playerYaw: number,
      distDelta: number,
      roomName: string,
      inShelter: boolean,
      nearest: NearbyPrompt | null,
      extDist: number,
      extAngle: number,
      isSprinting: boolean,
      predatorPositions: Array<{ id: string; x: number; z: number }>,
      nearestResourceArrow: ResourceArrowTarget | null = null,
      terrainElevation: number = 0
    ) => {
      setNearbyPrompt((prev) => {
        if (
          prev?.id === nearest?.id &&
          prev?.kind === nearest?.kind &&
          prev?.disabled === nearest?.disabled &&
          prev?.actionLabel === nearest?.actionLabel
        ) {
          return prev;
        }
        return nearest;
      });
      setResourceArrow(nearestResourceArrow ?? null);
      setExtractionDist(extDist);
      setExtractionAngleDeg(extAngle);

      setRun((prev) => {
        if (!prev || prev.outcome !== 'ongoing') return prev;
        if (prev.activeSurvivorId || prev.activeCacheId || prev.activeSign) {
          return { ...prev, playerX: px, playerZ: pz, playerYaw };
        }

        const scenario = SCENARIOS[prev.scenarioId];
        const diffDef = DIFFICULTIES[prev.difficulty];
        const waveInterval = getWaveInterval(prev.difficulty, prev.gameMode);

        let nextWave = prev.wave;
        let nextWaveInSec = prev.nextWaveInSec - dt;
        let logs = prev.logs;
        const nextElapsed = prev.elapsedSec + dt;
        let waveBannerUntilSec = prev.waveBannerUntilSec;

        // Recurring 2-day Rescue Helicopter arrival (arrives every 240s, stays 30s)
        const prevHeli = prev.helicopter ?? {
          arrived: false,
          x: 0,
          z: 0,
          arrivalTimeSec: 0,
          departureTimeSec: 0,
          nextArrivalSec: HELICOPTER_ARRIVAL_SEC,
          missedCount: 0,
        };
        let nextHelicopter = prevHeli;
        if (!prevHeli.arrived && nextElapsed >= prevHeli.nextArrivalSec) {
          const spot = findHelicopterLandingSpot(prev.chunks, px, pz);
          nextHelicopter = {
            ...prevHeli,
            arrived: true,
            x: spot.x,
            z: spot.z,
            arrivalTimeSec: nextElapsed,
            departureTimeSec: nextElapsed + HELICOPTER_STAY_SEC,
            nextArrivalSec: prevHeli.nextArrivalSec + HELICOPTER_ARRIVAL_SEC,
          };
          soundFX.allClear();
          logs = addLog(
            logs,
            nextElapsed,
            `🚁 Rescue Helicopter landed! You have ${HELICOPTER_STAY_SEC}s to reach the green compass landing zone and board!`,
            'rescue'
          );
        } else if (prevHeli.arrived && nextElapsed >= prevHeli.departureTimeSec) {
          nextHelicopter = {
            ...prevHeli,
            arrived: false,
            lastDepartedX: prevHeli.x,
            lastDepartedZ: prevHeli.z,
            lastDepartedAtSec: nextElapsed,
            missedCount: prevHeli.missedCount + 1,
          };
          soundFX.warning();
          logs = addLog(
            logs,
            nextElapsed,
            '🚁 Rescue Helicopter departed! Missed the 30s window — survive 2 more days until it returns.',
            'warning'
          );
        }

        const cycleStart = Math.max(0, nextHelicopter.nextArrivalSec - HELICOPTER_ARRIVAL_SEC);
        const cycleElapsed = Math.max(0, nextElapsed - cycleStart);
        const nextPhase = nextHelicopter.arrived
          ? 'all_clear'
          : computeDisasterPhase(cycleElapsed, HELICOPTER_ARRIVAL_SEC);
        const nextTimeRem = nextHelicopter.arrived
          ? 0
          : Math.max(0, nextHelicopter.nextArrivalSec - nextElapsed);

        if (nextPhase !== prev.disasterPhase) {
          if (nextPhase === 'peak_danger') {
            soundFX.siren();
            logs = addLog(
              logs,
              nextElapsed,
              '🚨 PEAK DANGER: Hold inside reinforced shelter until Official All-Clear!',
              'hazard'
            );
          } else if (nextPhase === 'subsiding') {
            logs = addLog(
              logs,
              nextElapsed,
              'Hazard is subsiding — prepare to move toward open ground for the 30s Rescue Helicopter window.',
              'info'
            );
          } else if (nextPhase === 'all_clear' && !nextHelicopter.arrived) {
            soundFX.allClear();
            logs = addLog(
              logs,
              nextElapsed,
              '✅ OFFICIAL ALL-CLEAR: Rescue Helicopter inbound soon — watch your green compass (30s boarding window)!',
              'rescue'
            );
          }
        }

        const peakShelterSec =
          prev.peakShelterSec + (nextPhase === 'peak_danger' && inShelter ? dt : 0);
        const peakExposedSec =
          prev.peakExposedSec + (nextPhase === 'peak_danger' && !inShelter ? dt : 0);
        const highGroundSec = prev.highGroundSec + (terrainElevation >= 1.5 ? dt : 0);

        if (nextWaveInSec <= 5 && nextWaveInSec > 0 && warnedWaveRef.current !== prev.wave) {
          warnedWaveRef.current = prev.wave;
          soundFX.warning();
        }

        if (nextWaveInSec <= 0) {
          nextWave += 1;
          nextWaveInSec = waveInterval;
          waveBannerUntilSec = nextElapsed + 3.8;
          soundFX.hazard();
          logs = addLog(
            logs,
            nextElapsed,
            `Wave ${nextWave}: ${scenario.severeLabel} intensifies across the sector (+100 pts).`,
            'hazard'
          );
        }

        let nextFlashlightOn = (nextElapsed % 120) >= 56 ? prev.flashlightOn : false;
        const prevPhaseIdx = Math.floor(prev.elapsedSec / 60);
        const nextPhaseIdx = Math.floor(nextElapsed / 60);
        if (nextPhaseIdx > prevPhaseIdx) {
          const isNightNow = nextPhaseIdx % 2 === 1;
          if (!isNightNow) nextFlashlightOn = false;
          logs = addLog(
            logs,
            nextElapsed,
            isNightNow
              ? '🌙 Nightfall settles across the sector — press L or tap Flashlight to light your way!'
              : '☀️ Daybreak — sunlight returns across the sector (flashlight turned off).',
            'info'
          );
        }

        // Tick active 30s gun timer
        let nextActiveGun = prev.activeGun;
        if (nextActiveGun) {
          const remGun = nextActiveGun.remainingSec - dt;
          if (remGun > 0) {
            nextActiveGun = { ...nextActiveGun, remainingSec: remGun };
          } else {
            const gDef = GUNS[nextActiveGun.type];
            logs = addLog(
              logs,
              nextElapsed,
              `${gDef.emoji} ${gDef.name} battery depleted (30s expired).`,
              'info'
            );
            nextActiveGun = null;
          }
        }

        // Sync live chasing predator coordinates
        let nextPredators = prev.predatorStates;
        if (predatorPositions.length > 0) {
          nextPredators = { ...prev.predatorStates };
          for (const pos of predatorPositions) {
            const existing = nextPredators[pos.id];
            if (existing && existing.alive) {
              nextPredators[pos.id] = { ...existing, x: pos.x, z: pos.z };
            }
          }
        }

        const modeDef = GAME_MODES[prev.gameMode];
        const charDef = CHARACTERS[prev.characterId];
        const hasGear = hasItemType(prev.inventory, 'gear');
        const survivorsList = Object.values(prev.survivorStates);
        const escorted = survivorsList.filter((s) => s.status === 'escorted');
        const hasMedic = escorted.some((s) => s.perkId === 'medic_aura');
        const hasResist = escorted.some((s) => s.perkId === 'hazard_resist');

        // Closing-in Wildfire perimeter + creeping flame cells
        let nextWildfireRing = prev.wildfireRing ?? null;
        let nextChunks = prev.chunks;
        let chunksMutated = false;

        if (prev.scenarioId === 'wildfire' && nextWildfireRing) {
          const drift = Math.min(1, dt * 0.55);
          const dxC = px - nextWildfireRing.centerX;
          const dzC = pz - nextWildfireRing.centerZ;
          const distC = Math.hypot(dxC, dzC);
          const newCenterX =
            distC > 0.05 ? nextWildfireRing.centerX + (dxC / distC) * Math.min(distC, dt * 0.55) : nextWildfireRing.centerX;
          const newCenterZ =
            distC > 0.05 ? nextWildfireRing.centerZ + (dzC / distC) * Math.min(distC, dt * 0.55) : nextWildfireRing.centerZ;

          let newRadius = nextWildfireRing.radius;
          if (nextPhase === 'subsiding' || nextPhase === 'all_clear' || nextHelicopter.arrived) {
            newRadius = Math.min(38, nextWildfireRing.radius + dt * 1.45);
          } else {
            const shrinkSpeed = (0.36 + nextWave * 0.07) * (1 + drift * 0.05);
            newRadius = Math.max(nextWildfireRing.minRadius, nextWildfireRing.radius - dt * shrinkSpeed);
          }

          nextWildfireRing = {
            ...nextWildfireRing,
            centerX: newCenterX,
            centerZ: newCenterZ,
            radius: newRadius,
          };

          // Gently creep active outdoor wildfire hazard pockets toward the survivor
          if (nextPhase !== 'all_clear' && !nextHelicopter.arrived) {
            const updatedChunks: Record<string, ChunkData> = {};
            const creepDist = dt * (0.75 + nextWave * 0.12);
            for (const [ckey, ch] of Object.entries(prev.chunks)) {
              if (Math.abs(ch.cx * 24 - px) > 52 || Math.abs(ch.cz * 24 - pz) > 52) {
                updatedChunks[ckey] = ch;
                continue;
              }
              let chChanged = false;
              const movedHazards = ch.hazards.map((hz) => {
                if (hz.activationWave > nextWave) return hz;
                const dHx = px - hz.x;
                const dHz = pz - hz.z;
                const dH = Math.hypot(dHx, dHz);
                if (dH <= 2.2 || dH > 46) return hz;
                const candX = hz.x + (dHx / dH) * creepDist;
                const candZ = hz.z + (dHz / dH) * creepDist;
                const insideRoom = ch.rooms.some(
                  (rm) =>
                    candX >= rm.x - rm.w / 2 - 0.5 &&
                    candX <= rm.x + rm.w / 2 + 0.5 &&
                    candZ >= rm.z - rm.d / 2 - 0.5 &&
                    candZ <= rm.z + rm.d / 2 + 0.5
                );
                if (insideRoom) return hz;
                chChanged = true;
                return { ...hz, x: candX, z: candZ };
              });
              if (chChanged) {
                chunksMutated = true;
                updatedChunks[ckey] = { ...ch, hazards: movedHazards };
              } else {
                updatedChunks[ckey] = ch;
              }
            }
            if (chunksMutated) {
              nextChunks = updatedChunks;
            }
          }
        }

        let maxHazLevel: 0 | 1 | 2 = 0;
        for (const ch of Object.values(nextChunks)) {
          for (const h of ch.hazards) {
            if (h.activationWave > nextWave) continue;
            if (Math.hypot(px - h.x, pz - h.z) <= h.radius) {
              if (h.level === 2) maxHazLevel = 2;
              else if (maxHazLevel === 0) maxHazLevel = 1;
            }
          }
        }

        if (
          prev.scenarioId === 'wildfire' &&
          nextWildfireRing &&
          nextPhase !== 'all_clear' &&
          !inShelter &&
          Math.hypot(px - nextWildfireRing.centerX, pz - nextWildfireRing.centerZ) >
            nextWildfireRing.radius
        ) {
          maxHazLevel = 2;
        }

        let health = prev.health;
        let stamina = prev.stamina;

        if (inShelter && maxHazLevel === 0) {
          // Passive safe-shelter health regeneration
          health = Math.min(prev.maxHealth, health + dt * 2.0);
        }

        const compoundActive =
          diffDef.compoundHazardEnabled &&
          Boolean(scenario.secondaryHazardId) &&
          (nextPhase === 'onset' || nextPhase === 'peak_danger');
        const diffDmgMult = diffDef.damageMultiplier * (compoundActive ? 1.18 : 1.0);
        const isColdScenario =
          prev.scenarioId === 'blizzard' ||
          prev.scenarioId === 'avalanche' ||
          prev.scenarioId === 'coldwave' ||
          prev.scenarioId === 'heavy_snowfall';

        if (isColdScenario) {
          if (inShelter) {
            stamina = Math.min(prev.maxStamina, stamina + dt * 8.5);
          } else {
            const chillRate =
              (hasGear || hasResist ? 1.8 : 4.2) *
              modeDef.damageMultiplier *
              diffDef.staminaDrainMultiplier;
            stamina = Math.max(0, stamina - dt * chillRate);
          }
        } else if (maxHazLevel === 0 && !isSprinting) {
          const regenRate = inShelter ? 6.5 : 3.2;
          stamina = Math.min(prev.maxStamina, stamina + dt * regenRate);
        }

        if (isSprinting) {
          const sprintCost =
            (hasGear || hasResist ? 4.8 : 7.4) *
            modeDef.sprintCostMultiplier *
            diffDef.staminaDrainMultiplier;
          stamina = Math.max(2, stamina - dt * sprintCost);
        }

        if (maxHazLevel === 1) {
          const stamDrain =
            (hasGear || hasResist ? 2.2 : 5.2) *
            modeDef.damageMultiplier *
            diffDef.staminaDrainMultiplier;
          stamina = Math.max(0, stamina - dt * stamDrain);
          if (!hasGear && !inShelter) {
            health = Math.max(
              0,
              health -
                dt *
                  (hasMedic ? 1.2 : 2.0) *
                  modeDef.damageMultiplier *
                  charDef.damageMultiplier *
                  diffDmgMult
            );
          }
        } else if (maxHazLevel === 2) {
          const baseDmg = 6.4 * diffDmgMult * modeDef.damageMultiplier * charDef.damageMultiplier;
          const hpDmg = baseDmg * (hasGear ? 0.35 : 1) * (hasMedic ? 0.65 : 1);
          health = Math.max(0, health - dt * hpDmg);
          stamina = Math.max(
            0,
            stamina -
              dt * (hasGear ? 3.0 : 7.5) * modeDef.damageMultiplier * diffDef.staminaDrainMultiplier
          );
        }

        if (stamina <= 0) {
          health = Math.max(0, health - dt * 3.5 * charDef.damageMultiplier * diffDmgMult);
        }

        // Update nearby stranded survivors hazard countdowns
        let survivorChanged = false;
        const nextSurvivors = { ...prev.survivorStates };
        for (const [sid, s] of Object.entries(nextSurvivors)) {
          if (s.status !== 'stranded') continue;
          // Only tick hazard timer for survivors within loaded range (~45m)
          if (Math.hypot(s.x - px, s.z - pz) > 45) continue;

          let inDanger = false;
          for (const ch of Object.values(prev.chunks)) {
            for (const h of ch.hazards) {
              if (
                h.activationWave <= nextWave &&
                h.level === 2 &&
                Math.hypot(s.x - h.x, s.z - h.z) <= h.radius + 0.8
              ) {
                inDanger = true;
                break;
              }
            }
            if (inDanger) break;
          }

          if (!inDanger) {
            if (s.inHazard) {
              nextSurvivors[sid] = { ...s, inHazard: false };
              survivorChanged = true;
            }
            continue;
          }

          const rem = s.urgencySeconds - dt;
          if (rem <= 0) {
            logs = addLog(
              logs,
              nextElapsed,
              `Radio lost: ${s.name} in ${s.roomName} was overtaken by ${scenario.severeLabel}.`,
              'warning'
            );
            nextSurvivors[sid] = { ...s, inHazard: true, urgencySeconds: 0, status: 'lost' };
          } else {
            nextSurvivors[sid] = { ...s, inHazard: true, urgencySeconds: rem };
          }
          survivorChanged = true;
        }

        const nextFlare = Math.max(0, prev.flareTurnsRemainingSec - dt);
        const nextDistance = prev.distanceTraveled + distDelta;
        const distPoints =
          Math.floor(nextDistance * 2) - Math.floor(prev.distanceTraveled * 2);
        const wavePoints = nextWave > prev.wave ? 100 : 0;
        const nextPoints = prev.points + Math.max(0, distPoints) + wavePoints;

        if (health <= 0) {
          soundFX.fail();
          setGameState('GAME_OVER');
          return {
            ...prev,
            chunks: chunksMutated ? nextChunks : prev.chunks,
            wildfireRing: nextWildfireRing,
            elapsedSec: nextElapsed,
            disasterPhase: nextPhase,
            disasterTimeRemainingSec: nextTimeRem,
            peakShelterSec,
            peakExposedSec,
            highGroundSec,
            wave: nextWave,
            nextWaveInSec,
            playerX: px,
            playerZ: pz,
            playerYaw,
            distanceTraveled: nextDistance,
            points: nextPoints,
            health: 0,
            stamina,
            currentRoomName: roomName,
            activeGun: nextActiveGun,
            predatorStates: nextPredators,
            survivorStates: survivorChanged ? nextSurvivors : prev.survivorStates,
            flareTurnsRemainingSec: nextFlare,
            logs,
            inHazardLevel: maxHazLevel,
            waveBannerUntilSec,
            flashlightOn: nextFlashlightOn,
            helicopter: nextHelicopter,
            outcome: 'fallen',
            outcomeReason: `Overwhelmed by ${scenario.title.toLowerCase()} near ${roomName} after ${Math.round(
              nextDistance
            )}m.`,
          };
        }

        return {
          ...prev,
          chunks: chunksMutated ? nextChunks : prev.chunks,
          wildfireRing: nextWildfireRing,
          elapsedSec: nextElapsed,
          disasterPhase: nextPhase,
          disasterTimeRemainingSec: nextTimeRem,
          peakShelterSec,
          peakExposedSec,
          highGroundSec,
          wave: nextWave,
          nextWaveInSec,
          playerX: px,
          playerZ: pz,
          playerYaw,
          distanceTraveled: nextDistance,
          points: nextPoints,
          health,
          stamina,
          currentRoomName: roomName,
          activeGun: nextActiveGun,
          predatorStates: nextPredators,
          survivorStates: survivorChanged ? nextSurvivors : prev.survivorStates,
          flareTurnsRemainingSec: nextFlare,
          logs,
          inHazardLevel: maxHazLevel,
          waveBannerUntilSec,
          flashlightOn: nextFlashlightOn,
          helicopter: nextHelicopter,
        };
      });
    },
    []
  );

  const handleInteractPrompt = useCallback(
    (prompt: NearbyPrompt) => {
      if (prompt.disabled) return;

      if (prompt.kind === 'supply') {
        handleCollectSupply(prompt.id, prompt.itemType === 'medkit' ? 'medkit' : 'food');
        return;
      }

      if (prompt.kind === 'gun' && prompt.gunType) {
        handleCollectGun(prompt.id, prompt.gunType);
        return;
      }

      if (prompt.kind === 'survivor') {
        setRun((prev) => (prev ? { ...prev, activeSurvivorId: prompt.id } : prev));
        return;
      }

      if (prompt.kind === 'rubble') {
        soundFX.pickup();
        setRun((prev) => {
          if (!prev) return prev;
          const scenario = SCENARIOS[prev.scenarioId];
          return {
            ...prev,
            clearedRubbleIds: { ...prev.clearedRubbleIds, [prompt.id]: true },
            points: prev.points + 75,
            logs: addLog(
              prev.logs,
              prev.elapsedSec,
              `Cleared ${prompt.title} with ${scenario.toolName} (+75 pts).`,
              'info'
            ),
          };
        });
        return;
      }

      if (prompt.kind === 'sign') {
        soundFX.signRead();
        setRun((prev) => {
          if (!prev) return prev;
          let foundSign: WarningSign | null = null;
          for (const ch of Object.values(prev.chunks)) {
            const sg = (ch.signs || []).find((s) => s.id === prompt.id);
            if (sg) {
              foundSign = sg;
              break;
            }
          }
          if (!foundSign) return prev;
          const firstRead = !prev.signsReadIds[foundSign.id];
          return {
            ...prev,
            signsReadIds: { ...prev.signsReadIds, [foundSign.id]: true },
            activeSign: foundSign,
            points: prev.points + (firstRead ? 50 : 0),
            logs: firstRead
              ? addLog(
                  prev.logs,
                  prev.elapsedSec,
                  `Inspected field sign: ${foundSign.title} (+50 pts).`,
                  'info'
                )
              : prev.logs,
          };
        });
        return;
      }

      if (prompt.kind === 'door') {
        setRun((prev) => {
          if (!prev) return prev;
          const nextOpen = !prev.openDoorIds[prompt.id];
          if (nextOpen) soundFX.doorOpen();
          else soundFX.doorClose();
          return {
            ...prev,
            openDoorIds: {
              ...prev.openDoorIds,
              [prompt.id]: nextOpen,
            },
          };
        });
        return;
      }

      if (prompt.kind === 'extraction') {
        if (run?.gameMode === 'endless_survival') {
          soundFX.heal();
          setRun((prev) => {
            if (!prev || prev.claimedResupplyIds[prompt.id]) return prev;
            const scenario = SCENARIOS[prev.scenarioId];
            const supply1 = createItem('medkit', scenario, `item-${runtimeItemId++}`);
            const supply2 = createItem(
              prev.wave % 2 === 0 ? 'food' : 'flare',
              scenario,
              `item-${runtimeItemId++}`
            );
            return {
              ...prev,
              health: Math.min(prev.maxHealth, prev.health + 45),
              stamina: Math.min(prev.maxStamina, prev.stamina + 45),
              inventory: [...prev.inventory, supply1, supply2],
              itemsCollectedCount: prev.itemsCollectedCount + 2,
              points: prev.points + 150,
              claimedResupplyIds: { ...prev.claimedResupplyIds, [prompt.id]: true },
              logs: addLog(
                prev.logs,
                prev.elapsedSec,
                `Helicopter Resupply claimed (+150 pts): +45 HP/Stamina, ${supply1.emoji} ${supply1.shortLabel} & ${supply2.emoji} ${supply2.shortLabel}.`,
                'rescue'
              ),
            };
          });
          return;
        }

        if (run && (!run.helicopter?.arrived || run.disasterPhase !== 'all_clear')) {
          soundFX.warning();
          setRun((prev) => {
            if (!prev) return prev;
            const nextArrival = prev.helicopter?.nextArrivalSec ?? HELICOPTER_ARRIVAL_SEC;
            return {
              ...prev,
              earlyExitAttempts: prev.earlyExitAttempts + 1,
              logs: addLog(
                prev.logs,
                prev.elapsedSec,
                `Rescue Helicopter arrives in ${Math.ceil(
                  Math.max(0, nextArrival - prev.elapsedSec)
                )}s (stays 30s every 2 days) — hold shelter until it lands!`,
                'warning'
              ),
            };
          });
          return;
        }

        // Trigger the helicopter extraction cutscene looking out of the chopper
        soundFX.cutsceneCue();
        setNearbyPrompt(null);
        setMapExpanded(false);
        setCutsceneProgress(0);
        setCutsceneMode('extraction');
      }
    },
    [run?.gameMode, run?.disasterPhase, run?.helicopter?.arrived, handleCollectSupply, handleCollectGun]
  );

  const finalizeExtractionVictory = useCallback(() => {
    setCutsceneMode(null);
    soundFX.victory();
    setGameState('GAME_OVER');
    setRun((prev) => {
      if (!prev || prev.outcome !== 'ongoing') return prev;
      const finalSurvivors: ActiveRunState['survivorStates'] = {};
      for (const [k, s] of Object.entries(prev.survivorStates)) {
        finalSurvivors[k] = s.status === 'escorted' ? { ...s, status: 'rescued' } : s;
      }
      const saved = Object.values(finalSurvivors).filter(
        (s) => s.status === 'rescued' || s.status === 'self_evacuated'
      ).length;
      const extractionBonus = 500 + saved * 350;
      const finalPoints = prev.points + extractionBonus;
      return {
        ...prev,
        survivorStates: finalSurvivors,
        points: finalPoints,
        outcome: 'extracted',
        outcomeReason: `Boarded the Rescue Helicopter within its 30s landing window after ${Math.round(
          prev.distanceTraveled
        )}m with ${saved} civilian${saved === 1 ? '' : 's'} saved (+${extractionBonus} extraction pts).`,
      };
    });
  }, []);

  const handleCutsceneFinishOrSkip = useCallback(() => {
    if (cutsceneMode === 'extraction') {
      finalizeExtractionVictory();
    } else {
      setCutsceneMode(null);
    }
  }, [cutsceneMode, finalizeExtractionVictory]);

  const handleUseItem = useCallback((itemId: string) => {
    setRun((prev) => {
      if (!prev || prev.outcome !== 'ongoing') return prev;
      const item = prev.inventory.find((i) => i.id === itemId);
      if (!item) return prev;

      const scenario = SCENARIOS[prev.scenarioId];
      const remaining = prev.inventory.filter((i) => i.id !== itemId);

      if (item.type === 'medkit') {
        soundFX.heal();
        let stabilizedName: string | null = null;
        const nextSurvivors = { ...prev.survivorStates };
        for (const [k, s] of Object.entries(nextSurvivors)) {
          if (!stabilizedName && s.status === 'escorted' && s.escortSpeedPenalty > 0) {
            stabilizedName = s.name;
            nextSurvivors[k] = { ...s, escortSpeedPenalty: 0, injured: false };
          }
        }
        return {
          ...prev,
          health: Math.min(prev.maxHealth, prev.health + 38),
          inventory: remaining,
          survivorStates: nextSurvivors,
          logs: addLog(
            prev.logs,
            prev.elapsedSec,
            stabilizedName
              ? `Used Trauma Medkit (+38% Health) & stabilized ${stabilizedName}.`
              : 'Used Trauma Medkit (+38% Health).',
            'rescue'
          ),
        };
      }

      if (item.type === 'food') {
        soundFX.heal();
        return {
          ...prev,
          health: Math.min(prev.maxHealth, prev.health + 14),
          stamina: Math.min(prev.maxStamina, prev.stamina + 40),
          inventory: remaining,
          logs: addLog(
            prev.logs,
            prev.elapsedSec,
            `Ate ${item.name} (+40% ${scenario.staminaLabel} & +14 HP).`,
            'item'
          ),
        };
      }

      if (item.type === 'flare') {
        soundFX.pickup();
        return {
          ...prev,
          flareTurnsRemainingSec: 18,
          cachesRevealed: true,
          inventory: remaining,
          logs: addLog(
            prev.logs,
            prev.elapsedSec,
            'Fired Emergency Flare — fog cleared for 18 seconds.',
            'info'
          ),
        };
      }

      return prev;
    });
  }, []);

  const handleQuickHeal = useCallback(() => {
    if (!run || run.outcome !== 'ongoing') return;
    const med = run.inventory.find((i) => i.type === 'medkit');
    if (med) {
      handleUseItem(med.id);
    }
  }, [run, handleUseItem]);

  const handleDropItem = useCallback((itemId: string) => {
    setRun((prev) => {
      if (!prev) return prev;
      const item = prev.inventory.find((i) => i.id === itemId);
      if (!item) return prev;
      return {
        ...prev,
        inventory: prev.inventory.filter((i) => i.id !== itemId),
        logs: addLog(prev.logs, prev.elapsedSec, `Dropped ${item.shortLabel}.`, 'info'),
      };
    });
  }, []);

  const handleEscortSurvivor = useCallback((survivorId: string) => {
    setRun((prev) => {
      if (!prev) return prev;
      const target = prev.survivorStates[survivorId];
      if (!target) return prev;
      const res = getSurvivorRescueResources(prev.inventory, target, 'escort');
      if (!res.canProceed) {
        return {
          ...prev,
          logs: addLog(
            prev.logs,
            prev.elapsedSec,
            res.reason || `Gather Food or Medkit before escorting ${target.name}.`,
            'warning'
          ),
        };
      }
      soundFX.rescue();
      const takenIds = new Set(res.itemsToTake.map((it) => it.id));
      const nextInv = prev.inventory.filter((it) => !takenIds.has(it.id));
      const takenLabel = res.itemsToTake.map((it) => `${it.emoji} ${it.shortLabel}`).join(' + ');
      const medicBonus = prev.gameMode === 'field_medic' ? 15 : 0;
      return {
        ...prev,
        activeSurvivorId: null,
        inventory: nextInv,
        health: Math.min(prev.maxHealth, prev.health + medicBonus),
        points: prev.points + 200,
        cachesRevealed: prev.cachesRevealed || target.perkId === 'scout_reveal',
        survivorStates: {
          ...prev.survivorStates,
          [survivorId]: { ...target, status: 'escorted' },
        },
        logs: addLog(
          prev.logs,
          prev.elapsedSec,
          medicBonus > 0
            ? `Shared ${takenLabel} & survival steps — ${target.name} joined your party (+15 HP · +200 pts).`
            : `Shared ${takenLabel} & survival steps — ${target.name} joined your party (${target.perkLabel} · +200 pts).`,
          'rescue'
        ),
      };
    });
  }, []);

  const handleSelfEvacSurvivor = useCallback((survivorId: string) => {
    setRun((prev) => {
      if (!prev) return prev;
      const target = prev.survivorStates[survivorId];
      if (!target) return prev;
      const res = getSurvivorRescueResources(prev.inventory, target, 'self_evac');
      if (!res.canProceed) return prev;
      soundFX.rescue();
      const takenIds = new Set(res.itemsToTake.map((it) => it.id));
      const nextInv = prev.inventory.filter((it) => !takenIds.has(it.id));
      const takenLabel = res.itemsToTake.map((it) => `${it.emoji} ${it.shortLabel}`).join(' + ');
      const medicBonus = prev.gameMode === 'field_medic' ? 15 : 0;
      return {
        ...prev,
        activeSurvivorId: null,
        health: Math.min(prev.maxHealth, prev.health + medicBonus),
        points: prev.points + 200,
        inventory: nextInv,
        survivorStates: {
          ...prev.survivorStates,
          [survivorId]: { ...target, status: 'self_evacuated' },
        },
        logs: addLog(
          prev.logs,
          prev.elapsedSec,
          medicBonus > 0
            ? `Shared survival steps & gave ${takenLabel} to ${target.name} (+15 HP · +200 pts).`
            : `Shared survival steps & gave ${takenLabel} to ${target.name} — safely heading out (+200 pts).`,
          'rescue'
        ),
      };
    });
  }, []);

  const handleLeaveSurvivor = useCallback((survivorId: string) => {
    setRun((prev) => {
      if (!prev) return prev;
      const target = prev.survivorStates[survivorId];
      if (!target) return prev;
      return {
        ...prev,
        activeSurvivorId: null,
        survivorStates: {
          ...prev.survivorStates,
          [survivorId]: { ...target, status: 'left_behind' },
        },
        logs: addLog(prev.logs, prev.elapsedSec, `Left ${target.name} behind.`, 'warning'),
      };
    });
  }, []);

  const handleGamepadAction = useCallback(
    (
      action:
        | 'interact'
        | 'toggle_view'
        | 'toggle_map'
        | 'sprint_toggle'
        | 'flashlight'
        | 'quick_heal'
    ) => {
      if (action === 'toggle_view') {
        handleToggleViewMode();
      } else if (action === 'toggle_map') {
        setMapExpanded((m) => !m);
      } else if (action === 'sprint_toggle') {
        toggleSprint();
      } else if (action === 'flashlight') {
        handleToggleFlashlight();
      } else if (action === 'quick_heal') {
        handleQuickHeal();
      } else if (action === 'interact') {
        if (run?.activeSign) {
          setRun((p) => (p ? { ...p, activeSign: null } : p));
        } else if (nearbyPrompt && !nearbyPrompt.disabled && !mapExpanded) {
          handleInteractPrompt(nearbyPrompt);
        }
      }
    },
    [
      handleToggleViewMode,
      toggleSprint,
      handleToggleFlashlight,
      handleQuickHeal,
      run?.activeSign,
      nearbyPrompt,
      mapExpanded,
      handleInteractPrompt,
    ]
  );

  // Keyboard shortcuts for Interact (F), Map (M), View (V), Free Cam (C), Heal (H), Flashlight (L), Esc, Skip Cutscene
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (showControls) {
          setShowControls(false);
          return;
        }
        if (showSettings) {
          setShowSettings(false);
          return;
        }
        if (showStats) {
          setShowStats(false);
          return;
        }
        if (run?.activeSign) {
          setRun((p) => (p ? { ...p, activeSign: null } : p));
          return;
        }
      }
      if (gameState !== 'PLAYING') return;
      if (cutsceneMode !== null && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) {
        e.preventDefault();
        handleCutsceneFinishOrSkip();
        return;
      }
      const targetTag = (e.target as HTMLElement | null)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') return;
      const k = e.key.toLowerCase();
      if (k === 'm' && cutsceneMode === null) {
        setMapExpanded((m) => !m);
      } else if (k === 'v' && cutsceneMode === null) {
        handleToggleViewMode();
      } else if (k === 'c' && cutsceneMode === null) {
        handleToggleFreeCam();
      } else if (k === 'h' && cutsceneMode === null) {
        handleQuickHeal();
      } else if (k === 'l' && cutsceneMode === null) {
        handleToggleFlashlight();
      } else if (k === 'f' && cutsceneMode === null && nearbyPrompt && !nearbyPrompt.disabled && !mapExpanded) {
        handleInteractPrompt(nearbyPrompt);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gameState,
    cutsceneMode,
    nearbyPrompt,
    mapExpanded,
    showControls,
    showSettings,
    showStats,
    run?.activeSign,
    handleInteractPrompt,
    handleCutsceneFinishOrSkip,
    handleToggleViewMode,
    handleToggleFreeCam,
    handleQuickHeal,
    handleToggleFlashlight,
  ]);

  const activeSurvivor = run?.activeSurvivorId
    ? run.survivorStates[run.activeSurvivorId] || null
    : null;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const unmuteAudio = useCallback(() => {
    if (muted) {
      soundFX.muted = false;
      setMuted(false);
    }
  }, [muted]);

  const persistentAudio = (
    <audio
      ref={audioRef}
      loop={musicLoop}
      preload="auto"
      onCanPlay={() => {
        const el = audioRef.current;
        if (el && pendingAutoPlayRef.current && el.paused) {
          attemptAudioPlay(el);
        }
      }}
      onPlay={() => {
        setMusicPlaying(true);
        setMusicError(null);
      }}
      onPause={() => setMusicPlaying(false)}
      onEnded={() => {
        if (!musicLoop) setMusicPlaying(false);
      }}
      onError={() => {
        pendingAutoPlayRef.current = false;
        setMusicPlaying(false);
        setMusicError('Could not decode audio file — try MP3, WAV, OGG, or M4A.');
      }}
      className="hidden"
    />
  );

  const persistentModals = (
    <>
      {showTutorialVideo && (
        <TutorialVideoModal
          voiceLang={voiceLanguage}
          muted={muted}
          onChangeVoiceLang={setVoiceLanguage}
          onToggleMute={toggleMute}
          onClose={() => setShowTutorialVideo(false)}
        />
      )}
      {showControls && (
        <ControlsModal
          controlPlatform={controlPlatform}
          controllerConnected={controllerConnected}
          onSelectPlatform={setControlPlatform}
          onClose={() => setShowControls(false)}
        />
      )}
      {showSettings && (
        <SettingsModal
          lang={language}
          graphicsQuality={graphicsQuality}
          viewMode={viewMode}
          controlPlatform={controlPlatform}
          controllerConnected={controllerConnected}
          theme={theme}
          muted={muted}
          sandboxUnlockAll={careerStats.sandboxUnlockAll}
          music={musicControls}
          onChangeLanguage={setLanguage}
          onChangeGraphics={setGraphicsQuality}
          onChangeViewMode={handleSelectViewMode}
          onChangeControlPlatform={setControlPlatform}
          onOpenControls={() => {
            setShowSettings(false);
            setShowControls(true);
          }}
          onToggleTheme={handleToggleTheme}
          onToggleMute={toggleMute}
          onToggleSandbox={handleToggleSandbox}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showStats && (
        <StatsAchievementsModal
          lang={language}
          careerStats={careerStats}
          onClose={() => setShowStats(false)}
        />
      )}
    </>
  );

  const rootDir = getLanguageDir(language);

  return (
    <div dir={rootDir} className="min-h-screen bg-[#0B111B] text-slate-100">
      {persistentAudio}

      {gameState === 'START_PAGE' ? (
        <>
          <TopBar
            gameState={gameState}
            lang={language}
            muted={muted}
            theme={theme}
            onToggleMute={toggleMute}
            onToggleTheme={handleToggleTheme}
            onGoStartPage={() => setGameState('START_PAGE')}
            onGoMenu={() => {
              setGameState('TITLE_MENU');
              setRun(null);
            }}
            onOpenStats={() => setShowStats(true)}
            onOpenControls={() => setShowControls(true)}
            onOpenTutorial={() => setShowTutorialVideo(true)}
            onOpenSettings={() => setShowSettings(true)}
            onScrollSection={scrollToSection}
            onPrimaryAction={() => {
              tutorialVoiceOver.stop();
              setShowTutorialVideo(false);
              setGameState('TITLE_MENU');
            }}
          />
          <StartPage
            selectedCharacter={selectedCharacter}
            customShirtHex={customShirtHex}
            viewMode={viewMode}
            controlPlatform={controlPlatform}
            controllerConnected={controllerConnected}
            lang={language}
            muted={muted}
            music={musicControls}
            onSelectCharacter={setSelectedCharacter}
            onSelectShirtHex={setCustomShirtHex}
            onSelectViewMode={handleSelectViewMode}
            onChangeControlPlatform={setControlPlatform}
            onOpenControls={() => setShowControls(true)}
            onOpenTutorial={() => setShowTutorialVideo(true)}
            onChangeLanguage={setLanguage}
            onUnmute={unmuteAudio}
            onOpenSettings={() => setShowSettings(true)}
            onEnterGame={() => {
              tutorialVoiceOver.stop();
              setShowTutorialVideo(false);
              setGameState('TITLE_MENU');
            }}
          />
        </>
      ) : gameState === 'TITLE_MENU' || !run ? (
        <>
          <TopBar
            gameState={gameState}
            lang={language}
            muted={muted}
            theme={theme}
            onToggleMute={toggleMute}
            onToggleTheme={handleToggleTheme}
            onGoStartPage={() => setGameState('START_PAGE')}
            onGoMenu={() => {
              setGameState('TITLE_MENU');
              setRun(null);
            }}
            onOpenStats={() => setShowStats(true)}
            onOpenControls={() => setShowControls(true)}
            onOpenTutorial={() => setShowTutorialVideo(true)}
            onOpenSettings={() => setShowSettings(true)}
            onScrollSection={scrollToSection}
            onPrimaryAction={() => startNewRun()}
          />
          <TitleMenu
            lang={language}
            selectedDisaster={selectedDisaster}
            difficulty={difficulty}
            selectedMode={selectedMode}
            selectedCharacter={selectedCharacter}
            viewMode={viewMode}
            enablePredators={enablePredators}
            enableGuns={enableGuns}
            bestPoints={bestPoints}
            careerStats={careerStats}
            muted={muted}
            music={musicControls}
            onSelectDisaster={setSelectedDisaster}
            onSelectDifficulty={setDifficulty}
            onSelectMode={handleSelectMode}
            onChangeCharacter={() => setGameState('START_PAGE')}
            onSelectViewMode={handleSelectViewMode}
            onTogglePredators={() => setEnablePredators((p) => !p)}
            onToggleGuns={() => setEnableGuns((g) => !g)}
            onUnmute={unmuteAudio}
            onOpenControls={() => setShowControls(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenStats={() => setShowStats(true)}
            onStartRun={() => startNewRun()}
          />
        </>
      ) : (
        <div className="relative h-screen w-screen overflow-hidden bg-[#0B111B] text-slate-100">
          <FirstPersonViewport
        key={runKey}
        run={run}
        viewMode={viewMode}
        theme={theme}
        graphicsQuality={graphicsQuality}
        joystickVecRef={joystickVecRef}
        yawOffsetRef={yawOffsetRef}
        jumpTriggerRef={jumpTriggerRef}
        shootTriggerRef={shootTriggerRef}
        sprintRef={sprintRef}
        cutsceneMode={cutsceneMode}
        onCutsceneProgress={setCutsceneProgress}
        onCutsceneEnd={handleCutsceneFinishOrSkip}
        onEnsureChunks={handleEnsureChunks}
        onCollectSupply={handleCollectSupply}
        onCollectGun={handleCollectGun}
        onKillPredator={handleKillPredator}
        onPredatorHitPlayer={handlePredatorHitPlayer}
        onGamepadAction={handleGamepadAction}
        onTickSimulation={handleTickSimulation}
      />

      {cutsceneMode !== null ? (
        <CutsceneOverlay
          scenarioId={run.scenarioId}
          mode={cutsceneMode}
          progress={cutsceneProgress}
          onSkip={handleCutsceneFinishOrSkip}
        />
      ) : (
        <GameHUD
          run={run}
          lang={language}
          nearbyPrompt={nearbyPrompt}
          resourceArrow={resourceArrow}
          extractionDist={extractionDist}
          extractionAngleDeg={extractionAngleDeg}
          mapExpanded={mapExpanded}
          muted={muted}
          sprintActive={sprintActive}
          viewMode={viewMode}
          controlPlatform={controlPlatform}
          controllerConnected={controllerConnected}
          theme={theme}
          music={musicControls}
          onToggleMap={() => setMapExpanded((m) => !m)}
          onToggleMute={toggleMute}
          onToggleSprint={toggleSprint}
          onToggleFlashlight={handleToggleFlashlight}
          onToggleViewMode={handleToggleViewMode}
          onToggleFreeCam={handleToggleFreeCam}
          onOpenControls={() => setShowControls(true)}
          onToggleTheme={handleToggleTheme}
          onOpenSettings={() => setShowSettings(true)}
          onQuickHeal={handleQuickHeal}
          onJoystickChange={(vec) => {
            joystickVecRef.current = vec;
          }}
          onRotateCamera={(delta) => {
            yawOffsetRef.current += delta;
          }}
          onJump={() => {
            jumpTriggerRef.current += 1;
          }}
          onFireGun={handleFireGun}
          onInteractPrompt={handleInteractPrompt}
          onUseItem={handleUseItem}
          onDropItem={handleDropItem}
          onRestart={() =>
            startNewRun(
              run.scenarioId,
              run.difficulty,
              run.gameMode,
              run.enablePredators,
              run.enableGuns,
              run.characterId
            )
          }
          onExitMenu={() => {
            setGameState('TITLE_MENU');
            setRun(null);
          }}
        />
      )}

      {run.activeSign && (
        <SignModal
          sign={run.activeSign}
          lang={language}
          onClose={() => setRun((p) => (p ? { ...p, activeSign: null } : p))}
        />
      )}

      {activeSurvivor && (
        <RescueModal
          run={run}
          survivor={activeSurvivor}
          onEscort={handleEscortSurvivor}
          onSelfEvacuate={handleSelfEvacSurvivor}
          onLeaveBehind={handleLeaveSurvivor}
          onClose={() => setRun((p) => (p ? { ...p, activeSurvivorId: null } : p))}
        />
      )}

      {gameState === 'GAME_OVER' && (
        <EndReportModal
          run={run}
          bestPoints={bestPoints}
          lang={language}
          performanceEval={performanceEval}
          newlyUnlockedAchievements={newlyUnlockedAchievements}
          newlyUnlockedRegion={newlyUnlockedRegion}
          onPlayAgain={() =>
            startNewRun(
              run.scenarioId,
              run.difficulty,
              run.gameMode,
              run.enablePredators,
              run.enableGuns,
              run.characterId
            )
          }
          onChangeScenario={() => {
            setGameState('TITLE_MENU');
            setRun(null);
          }}
        />
      )}
        </div>
      )}

      {persistentModals}
    </div>
  );
}

import { ACHIEVEMENTS, DIFFICULTIES, HELICOPTER_ARRIVAL_SEC, REGIONS, REGION_ORDER } from '../data/achievements';
import { CHARACTERS } from '../data/characters';
import { GAME_MODES } from '../data/gameModes';
import { createItem, SCENARIOS } from '../data/scenarios';
import { CHUNK_SIZE, chunkKey, generateChunk } from '../three/chunkWorld';
import {
  ActiveRunState,
  BoxCollider,
  CareerStats,
  CharacterId,
  ChunkData,
  Difficulty,
  DisasterId,
  DisasterPhase,
  DoorOpening,
  GameMode,
  InventoryItem,
  ItemType,
  LogEntry,
  PerformanceEvaluation,
  RoomDef,
  SafetyComparisonRow,
} from '../types/game';

let uidCounter = 1;
const nextUid = (prefix: string) => `${prefix}-${uidCounter++}`;

const CAREER_STORAGE_KEY = 'safequest_career_stats_v1';

export function getWaveInterval(difficulty: Difficulty, gameMode: GameMode): number {
  const base = DIFFICULTIES[difficulty].waveIntervalSec;
  return Math.max(7, Math.round(base * GAME_MODES[gameMode].waveMultiplier));
}

export function computeDisasterPhase(elapsedSec: number, durationSec: number): DisasterPhase {
  const ratio = elapsedSec / Math.max(1, durationSec);
  if (ratio < 0.14) return 'early_warning';
  if (ratio < 0.36) return 'onset';
  if (ratio < 0.78) return 'peak_danger';
  if (ratio < 1.0) return 'subsiding';
  return 'all_clear';
}

export function initializeRun(
  disasterId: DisasterId,
  difficulty: Difficulty,
  gameMode: GameMode = 'standard_escape',
  options: {
    characterId?: CharacterId;
    customShirtHex?: string;
    enablePredators?: boolean;
    enableGuns?: boolean;
  } = {}
): ActiveRunState {
  const characterId: CharacterId = options.characterId ?? 'adult';
  const charDef = CHARACTERS[characterId];
  const enablePredators = options.enablePredators ?? gameMode === 'monster_hunt';
  const enableGuns = options.enableGuns ?? gameMode === 'monster_hunt';
  const maxHealth = 100 + charDef.bonusHealth;
  const maxStamina = 100 + charDef.bonusStamina;
  const scenario = SCENARIOS[disasterId];
  const modeDef = GAME_MODES[gameMode];
  const diffDef = DIFFICULTIES[difficulty];
  const waveSec = getWaveInterval(difficulty, gameMode);
  const disasterDurationSec = diffDef.disasterDurationSec;

  const startingTypes: ItemType[] =
    gameMode === 'hardcore_ironman'
      ? []
      : gameMode === 'field_medic'
      ? ['medkit', 'medkit', 'medkit', 'food', 'food', 'tool']
      : gameMode === 'scavenger_blitz'
      ? [...scenario.startingItems, 'medkit', 'flare']
      : difficulty === 'beginner'
      ? [...scenario.startingItems, 'medkit']
      : scenario.startingItems;

  const inventory: InventoryItem[] = startingTypes.map((type) =>
    createItem(type, scenario, nextUid('item'))
  );

  const chunks: Record<string, ChunkData> = {};
  const searchedCacheIds: Record<string, boolean> = {};
  const cacheRemainingItems: Record<string, ItemType[]> = {};
  const survivorStates: Record<string, ActiveRunState['survivorStates'][string]> = {};
  const predatorStates: Record<string, ActiveRunState['predatorStates'][string]> = {};

  for (let cz = -1; cz <= 1; cz++) {
    for (let cx = -1; cx <= 1; cx++) {
      const ch = generateChunk(disasterId, cx, cz, difficulty, 0, gameMode, {
        enablePredators,
        enableGuns,
      });
      chunks[ch.key] = ch;
      for (const s of ch.survivors) {
        survivorStates[s.id] = { ...s };
      }
      for (const pr of ch.predators || []) {
        predatorStates[pr.id] = { ...pr };
      }
    }
  }

  const logs: LogEntry[] = [
    {
      id: nextUid('log'),
      timeSec: 0,
      text: `${scenario.title} (${diffDef.label} · ${modeDef.title}): Survival Steps — 1) Gather Medkits in Hospitals & Food in Supermarkets, 2) Shelter & use Flashlight (L) at night, 3) Board the Rescue Helicopter during its 30s window every 2 days!`,
      kind: 'info',
    },
    ...(diffDef.compoundHazardEnabled && scenario.secondaryHazardId
      ? [
          {
            id: nextUid('log'),
            timeSec: 0,
            text: `Compound Crisis Alert: Secondary ${SCENARIOS[scenario.secondaryHazardId].title} risk expected during Peak Danger.`,
            kind: 'warning' as const,
          },
        ]
      : []),
  ];

  return {
    scenarioId: disasterId,
    difficulty,
    gameMode,
    characterId,
    customShirtHex: options.customShirtHex,
    enablePredators,
    enableGuns,
    elapsedSec: 0,
    disasterPhase: 'early_warning',
    disasterDurationSec,
    disasterTimeRemainingSec: disasterDurationSec,
    peakShelterSec: 0,
    peakExposedSec: 0,
    earlyExitAttempts: 0,
    highGroundSec: 0,
    signsReadIds: {},
    decisionEvents: [],
    wave: 0,
    nextWaveInSec: waveSec,
    playerX: 0,
    playerZ: 4.5,
    playerYaw: 0,
    health: maxHealth,
    maxHealth,
    stamina: maxStamina,
    maxStamina,
    currentRoomName: 'Central Avenue',
    inventory,
    chunks,
    openDoorIds: {},
    clearedRubbleIds: {},
    searchedCacheIds,
    cacheRemainingItems,
    collectedPickupIds: {},
    collectedSupplyIds: {},
    collectedGunIds: {},
    points: 0,
    activeGun: null,
    claimedResupplyIds: {},
    survivorStates,
    predatorStates,
    predatorsDefeatedCount: 0,
    flareTurnsRemainingSec: 0,
    flashlightOn: false,
    wildfireRing:
      disasterId === 'wildfire'
        ? {
            centerX: 0,
            centerZ: 4.5,
            radius: 58,
            minRadius: difficulty === 'expert' || difficulty === 'advanced' ? 13 : 16,
          }
        : null,
    helicopter: {
      arrived: false,
      x: 0,
      z: 0,
      arrivalTimeSec: 0,
      departureTimeSec: 0,
      nextArrivalSec: HELICOPTER_ARRIVAL_SEC,
      missedCount: 0,
    },
    cachesRevealed: false,
    activeCacheId: null,
    activeSurvivorId: null,
    activeSign: null,
    outcome: 'ongoing',
    outcomeReason: '',
    logs,
    itemsCollectedCount: 0,
    distanceTraveled: 0,
    inHazardLevel: 0,
    waveBannerUntilSec: 0,
  };
}

export function evaluateRunPerformance(run: ActiveRunState): PerformanceEvaluation {
  const scenario = SCENARIOS[run.scenarioId];
  const signsRead = Object.keys(run.signsReadIds).length;
  const totalPeakSec = run.peakShelterSec + run.peakExposedSec;
  const shelterRatio = totalPeakSec > 0 ? run.peakShelterSec / totalPeakSec : 1;
  const hasGear = hasItemType(run.inventory, 'gear');
  const savedCivilians = Object.values(run.survivorStates).filter(
    (s) => s.status === 'rescued' || s.status === 'self_evacuated' || s.status === 'escorted'
  ).length;
  const isElevationScenario =
    run.scenarioId === 'flood' ||
    run.scenarioId === 'tsunami' ||
    run.scenarioId === 'storm_surge' ||
    run.scenarioId === 'glof';

  const rows: SafetyComparisonRow[] = [];

  // 1. Shelter Discipline
  if (shelterRatio >= 0.65 && run.earlyExitAttempts === 0) {
    rows.push({
      topic: 'Peak Danger Shelter Discipline',
      whatYouDid: `Held safe shelter for ${Math.round(run.peakShelterSec)}s during Peak Danger without leaving prematurely.`,
      whatYouShouldDo: 'Remain inside reinforced shelters away from windows until the hazard subsides.',
      whySafer: 'Most disaster injuries occur when people step outdoors before peak winds, debris, or surges pass.',
      verdict: 'good',
    });
  } else {
    rows.push({
      topic: 'Peak Danger Shelter Discipline',
      whatYouDid: `Spent ${Math.round(run.peakExposedSec)}s exposed outdoors during Peak Danger${
        run.earlyExitAttempts > 0 ? ` and attempted early evacuation ${run.earlyExitAttempts}x` : ''
      }.`,
      whatYouShouldDo: `Move indoors before ${scenario.severeLabel} peaks and hold until Subsiding / All-Clear.`,
      whySafer: 'Temporary lulls (like cyclone eyes or pause between aftershocks) often precede the most violent phase.',
      verdict: run.earlyExitAttempts > 0 || shelterRatio < 0.35 ? 'critical' : 'improve',
    });
  }

  // 2. 2-Day Survival & 30s Helicopter Rescue Timing
  if (run.outcome === 'extracted' && run.earlyExitAttempts === 0) {
    rows.push({
      topic: '2-Day Survival & 30s Helicopter Window',
      whatYouDid:
        (run.helicopter?.missedCount ?? 0) > 0
          ? `Caught a later Rescue Helicopter after missing ${run.helicopter?.missedCount} earlier 30s window(s).`
          : 'Survived 2 full days and boarded the Rescue Helicopter within its 30-second landing window.',
      whatYouShouldDo: 'Wait indoors until Day 2 ends, then sprint to the landing zone within 30 seconds.',
      whySafer: 'Rescue aircraft can only hold briefly on landing zones during post-storm intervals every 2 days.',
      verdict: 'good',
    });
  } else {
    rows.push({
      topic: '2-Day Survival & Helicopter Rescue',
      whatYouDid:
        run.outcome === 'fallen'
          ? `Overwhelmed during ${run.disasterPhase.replace('_', ' ')} before the 2-day helicopter rescue.`
          : `Attempted early evacuation ${run.earlyExitAttempts}x before the 2-day All-Clear.`,
      whatYouShouldDo: 'Hold safe shelter through both days until the Rescue Helicopter lands after Day 2.',
      whySafer: 'Moving outdoors too early exposes you to peak hazards before airlift clearance.',
      verdict: run.outcome === 'fallen' ? 'critical' : 'improve',
    });
  }

  // 3. Situation Awareness (Warning Signs)
  if (signsRead >= 1) {
    rows.push({
      topic: 'Warning Signs & Local Advisories',
      whatYouDid: `Inspected ${signsRead} field warning sign${signsRead === 1 ? '' : 's'} and observed hazard conditions.`,
      whatYouShouldDo: 'Read local signage and official emergency alerts to adapt to terrain-specific risks.',
      whySafer: 'Local signs reveal flash-flood channels, unstable slopes, or tsunami elevation lines not obvious at a glance.',
      verdict: 'good',
    });
  } else {
    rows.push({
      topic: 'Warning Signs & Local Advisories',
      whatYouDid: 'Bypassed field warning signs without inspecting local hazard bulletins.',
      whatYouShouldDo: `Inspect roadside ${scenario.warningSignTitle} signs when navigating unfamiliar terrain.`,
      whySafer: 'Recognizing early warning indicators gives crucial minutes to reach shelter or high ground.',
      verdict: 'improve',
    });
  }

  // 4. Hospital & Supermarket Resource Scavenging
  if (hasGear && run.itemsCollectedCount >= 2) {
    rows.push({
      topic: 'Hospital & Supermarket Scavenging',
      whatYouDid: `Maintained ${scenario.gearName} alongside ${run.itemsCollectedCount} medkits & food scavenged from Hospitals & Supermarkets.`,
      whatYouShouldDo: 'Visit Hospitals for Medkits and Supermarkets for Food, plus use your Flashlight at night.',
      whySafer: 'Gathering medical kits and food indoors minimizes outdoor exposure and keeps stamina and trauma under control.',
      verdict: 'good',
    });
  } else {
    rows.push({
      topic: 'Hospital & Supermarket Scavenging',
      whatYouDid: `${hasGear ? 'Carried protection' : `Missed ${scenario.gearName}`}; gathered ${run.itemsCollectedCount} hospital/supermarket supplies.`,
      whatYouShouldDo: 'Follow directional signals into Hospitals for Medkits and Supermarkets for Food during safe windows.',
      whySafer: 'Knowing where medical aid and food are located indoors prevents exhaustion and untreated trauma.',
      verdict: hasGear ? 'improve' : 'critical',
    });
  }

  // 5. Terrain Positioning
  if (isElevationScenario) {
    if (run.highGroundSec >= 18) {
      rows.push({
        topic: 'Elevation & Terrain Safety',
        whatYouDid: `Maintained elevated ground for ${Math.round(run.highGroundSec)}s away from low surge channels.`,
        whatYouShouldDo: 'Move promptly uphill/inland during coastal or river flood emergencies.',
        whySafer: 'Water pools deeply and accelerates in low valleys; higher ridges provide natural vertical safety.',
        verdict: 'good',
      });
    } else {
      rows.push({
        topic: 'Elevation & Terrain Safety',
        whatYouDid: `Spent limited time on elevated ground (${Math.round(run.highGroundSec)}s) during flood surge risk.`,
        whatYouShouldDo: 'Seek ridges, elevated terraces, or multi-story lockhouses early in flood/tsunami scenarios.',
        whySafer: 'Floodwaters and tsunami bores gain velocity in flat lowlands and submerge street corridors first.',
        verdict: 'improve',
      });
    }
  } else {
    rows.push({
      topic: 'Community Care & Rescue',
      whatYouDid:
        savedCivilians > 0
          ? `Assisted ${savedCivilians} stranded civilian${savedCivilians === 1 ? '' : 's'} using safe supplies or escort.`
          : 'Operated solo without assisting nearby stranded civilians.',
      whatYouShouldDo: 'Assist nearby civilians when safe to do so using spare medkits, food, or shelter escorts.',
      whySafer: 'Coordinated neighbor check-ins save lives while minimizing unnecessary exposure for everyone.',
      verdict: savedCivilians > 0 ? 'good' : 'improve',
    });
  }

  // Score Pillars (each 0..25)
  const decisionScore = Math.round(
    Math.min(25, shelterRatio * 18 + (run.earlyExitAttempts === 0 ? 7 : Math.max(0, 7 - run.earlyExitAttempts * 3)))
  );
  const awarenessScore = Math.round(
    Math.min(25, (signsRead >= 2 ? 15 : signsRead === 1 ? 10 : 4) + (isElevationScenario ? Math.min(10, run.highGroundSec / 2) : Math.min(10, run.distanceTraveled / 20)))
  );
  const resourceScore = Math.round(
    Math.min(25, (hasGear ? 12 : 4) + Math.min(13, run.itemsCollectedCount * 3))
  );
  const complianceScore = Math.round(
    Math.min(
      25,
      (run.outcome === 'extracted' ? 16 : run.disasterPhase === 'all_clear' ? 11 : 4) +
        Math.min(5, savedCivilians * 2.5) +
        (run.health > 40 ? 4 : run.health > 0 ? 2 : 0)
    )
  );

  const totalScore = Math.max(
    0,
    Math.min(100, decisionScore + awarenessScore + resourceScore + complianceScore)
  );

  return {
    totalScore,
    decisionScore,
    awarenessScore,
    resourceScore,
    complianceScore,
    rows,
  };
}

export function loadCareerStats(): CareerStats {
  const initialUnlockedRegions = REGION_ORDER.filter((r) => REGIONS[r].initiallyUnlocked);
  const fallback: CareerStats = {
    runsCompleted: 0,
    runsSurvived: 0,
    totalPoints: 0,
    bestSafetyScore: 0,
    totalCiviliansSaved: 0,
    signsReadCount: 0,
    completedDisasters: {},
    unlockedRegions: initialUnlockedRegions,
    achievements: [],
    sandboxUnlockAll: false,
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(CAREER_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<CareerStats>;
    return {
      ...fallback,
      ...parsed,
      unlockedRegions:
        Array.isArray(parsed.unlockedRegions) && parsed.unlockedRegions.length > 0
          ? Array.from(new Set([...initialUnlockedRegions, ...parsed.unlockedRegions]))
          : initialUnlockedRegions,
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      completedDisasters: parsed.completedDisasters ?? {},
    };
  } catch {
    return fallback;
  }
}

export function saveCareerStats(stats: CareerStats): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}

export function recordRunToCareer(
  prev: CareerStats,
  run: ActiveRunState,
  evaluation: PerformanceEvaluation
): { nextStats: CareerStats; newlyUnlockedAchievements: string[]; newlyUnlockedRegion: string | null } {
  const survived = run.outcome === 'extracted';
  const savedCivilians = Object.values(run.survivorStates).filter(
    (s) => s.status === 'rescued' || s.status === 'self_evacuated' || s.status === 'escorted'
  ).length;
  const signsRead = Object.keys(run.signsReadIds).length;

  const nextCompleted = { ...prev.completedDisasters };
  if (survived) {
    nextCompleted[run.scenarioId] = (nextCompleted[run.scenarioId] ?? 0) + 1;
  }

  let newlyUnlockedRegion: string | null = null;
  const nextRegions = [...prev.unlockedRegions];
  if (survived) {
    const nextLocked = REGION_ORDER.find((r) => !nextRegions.includes(r));
    if (nextLocked) {
      nextRegions.push(nextLocked);
      newlyUnlockedRegion = REGIONS[nextLocked].name;
    }
  }

  const candidateStats: CareerStats = {
    ...prev,
    runsCompleted: prev.runsCompleted + 1,
    runsSurvived: prev.runsSurvived + (survived ? 1 : 0),
    totalPoints: prev.totalPoints + run.points,
    bestSafetyScore: Math.max(prev.bestSafetyScore, evaluation.totalScore),
    totalCiviliansSaved: prev.totalCiviliansSaved + savedCivilians,
    signsReadCount: prev.signsReadCount + signsRead,
    completedDisasters: nextCompleted,
    unlockedRegions: nextRegions,
    achievements: [...prev.achievements],
  };

  const uniqueCompletedCount = Object.keys(nextCompleted).length;
  const checks: Array<[string, boolean]> = [
    ['first_all_clear', survived],
    [
      'shelter_discipline',
      survived && run.earlyExitAttempts === 0 && run.peakShelterSec >= run.peakExposedSec,
    ],
    ['field_reader', candidateStats.signsReadCount >= 3],
    ['safety_90', evaluation.totalScore >= 90],
    ['guardian_angel', candidateStats.totalCiviliansSaved >= 5],
    ['five_disasters', uniqueCompletedCount >= 5],
    ['ten_disasters', uniqueCompletedCount >= 10],
    [
      'advanced_survivor',
      survived && (run.difficulty === 'advanced' || run.difficulty === 'expert'),
    ],
    ['world_unlocked', nextRegions.length >= REGION_ORDER.length],
    ['high_scorer', candidateStats.totalPoints >= 5000],
  ];

  const newlyUnlockedAchievements: string[] = [];
  for (const [id, ok] of checks) {
    if (ok && !candidateStats.achievements.includes(id)) {
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) {
        candidateStats.achievements.push(id);
        newlyUnlockedAchievements.push(def.title);
      }
    }
  }

  saveCareerStats(candidateStats);
  return { nextStats: candidateStats, newlyUnlockedAchievements, newlyUnlockedRegion };
}

export interface StackedInventoryEntry {
  type: ItemType;
  sampleItem: InventoryItem;
  count: number;
}

export function groupInventory(inventory: InventoryItem[]): StackedInventoryEntry[] {
  const map = new Map<ItemType, StackedInventoryEntry>();
  for (const item of inventory) {
    const existing = map.get(item.type);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(item.type, { type: item.type, sampleItem: item, count: 1 });
    }
  }
  return Array.from(map.values());
}

export function hasItemType(inventory: InventoryItem[], type: ItemType): boolean {
  return inventory.some((item) => item.type === type);
}

export function getSurvivorRescueResources(
  inventory: InventoryItem[],
  survivor: ActiveRunState['survivorStates'][string],
  mode: 'escort' | 'self_evac'
): { itemsToTake: InventoryItem[]; canProceed: boolean; reason: string | null } {
  const taken: InventoryItem[] = [];
  const usedIds = new Set<string>();

  const pickFirst = (type: ItemType): InventoryItem | null => {
    const found = inventory.find((it) => it.type === type && !usedIds.has(it.id));
    if (found) {
      usedIds.add(found.id);
      taken.push(found);
      return found;
    }
    return null;
  };

  if (mode === 'self_evac') {
    const req = pickFirst(survivor.selfEvacItem);
    if (!req) {
      return {
        itemsToTake: [],
        canProceed: false,
        reason: `Requires ${survivor.selfEvacItem} in your backpack`,
      };
    }
    // Also share 1 spare Food or Medkit for the journey if available
    if (!pickFirst('food')) {
      pickFirst('medkit');
    }
    return { itemsToTake: taken, canProceed: true, reason: null };
  }

  // Escorting a survivor requires sharing 1–2 consumable supplies (Medkit / Food / Flare)
  if (survivor.injured) {
    pickFirst('medkit');
    pickFirst('food');
    if (taken.length === 0) {
      pickFirst('flare');
    }
  } else {
    pickFirst('food');
    if (taken.length === 0) {
      pickFirst('medkit');
    } else {
      // Uninjured companions also take a spare flare or extra food if carried
      if (!pickFirst('flare')) {
        const spareFoodCount = inventory.filter((it) => it.type === 'food').length;
        if (spareFoodCount >= 2) {
          pickFirst('food');
        }
      }
    }
    if (taken.length === 0) {
      pickFirst('flare');
    }
  }

  if (taken.length === 0) {
    return {
      itemsToTake: [],
      canProceed: false,
      reason: 'Requires at least 1 Food (Supermarket) or Medkit (Hospital) to share',
    };
  }

  return { itemsToTake: taken, canProceed: true, reason: null };
}

export function addLog(
  logs: LogEntry[],
  timeSec: number,
  text: string,
  kind: LogEntry['kind']
): LogEntry[] {
  return [{ id: nextUid('log'), timeSec: Math.floor(timeSec), text, kind }, ...logs].slice(0, 24);
}

export function buildRoomWallColliders(room: RoomDef): BoxCollider[] {
  const colliders: BoxCollider[] = [];
  const wallT = 0.42;
  const halfW = room.w / 2;
  const halfD = room.d / 2;

  const splitWall = (
    axis: 'x' | 'z',
    fixedCoord: number,
    centerAlong: number,
    totalLen: number,
    doors: DoorOpening[]
  ) => {
    const start = centerAlong - totalLen / 2;
    const end = centerAlong + totalLen / 2;
    const sorted = [...doors].sort((a, b) => a.offset - b.offset);

    let cursor = start;
    for (const d of sorted) {
      const gapStart = Math.max(start, centerAlong + d.offset - d.width / 2);
      const gapEnd = Math.min(end, centerAlong + d.offset + d.width / 2);
      if (gapStart - cursor > 0.15) {
        const segLen = gapStart - cursor;
        const segCenter = cursor + segLen / 2;
        colliders.push(
          axis === 'x'
            ? { x: segCenter, z: fixedCoord, w: segLen, d: wallT }
            : { x: fixedCoord, z: segCenter, w: wallT, d: segLen }
        );
      }
      cursor = Math.max(cursor, gapEnd);
    }

    if (end - cursor > 0.15) {
      const segLen = end - cursor;
      const segCenter = cursor + segLen / 2;
      colliders.push(
        axis === 'x'
          ? { x: segCenter, z: fixedCoord, w: segLen, d: wallT }
          : { x: fixedCoord, z: segCenter, w: wallT, d: segLen }
      );
    }
  };

  splitWall('x', room.z - halfD, room.x, room.w, room.doors.filter((d) => d.side === 'north'));
  splitWall('x', room.z + halfD, room.x, room.w, room.doors.filter((d) => d.side === 'south'));
  splitWall('z', room.x - halfW, room.z, room.d, room.doors.filter((d) => d.side === 'west'));
  splitWall('z', room.x + halfW, room.z, room.d, room.doors.filter((d) => d.side === 'east'));

  for (const f of room.furniture) {
    const fw = f.type === 'bed' ? 1.8 : f.type === 'workbench' ? 1.9 : 1.3;
    const fd = f.type === 'bed' ? 1.1 : 0.9;
    colliders.push({ x: f.x, z: f.z, w: fw, d: fd });
  }

  return colliders;
}

export function getDoorId(room: RoomDef, door: DoorOpening, index: number): string {
  return door.id ?? `${room.id}-door-${index}`;
}

export function getDoorWorldTransform(
  room: RoomDef,
  door: DoorOpening
): { x: number; z: number; rotY: number; isHoriz: boolean } {
  const halfW = room.w / 2;
  const halfD = room.d / 2;
  if (door.side === 'south') {
    return { x: room.x + door.offset, z: room.z + halfD, rotY: 0, isHoriz: true };
  }
  if (door.side === 'north') {
    return { x: room.x + door.offset, z: room.z - halfD, rotY: Math.PI, isHoriz: true };
  }
  if (door.side === 'east') {
    return { x: room.x + halfW, z: room.z + door.offset, rotY: Math.PI / 2, isHoriz: false };
  }
  return { x: room.x - halfW, z: room.z + door.offset, rotY: -Math.PI / 2, isHoriz: false };
}

export function getRoomClosedDoorColliders(
  room: RoomDef,
  openDoorIds: Record<string, boolean>
): BoxCollider[] {
  const closed: BoxCollider[] = [];
  const wallT = 0.44;
  room.doors.forEach((door, idx) => {
    const doorId = getDoorId(room, door, idx);
    if (openDoorIds[doorId]) return;
    const tr = getDoorWorldTransform(room, door);
    closed.push({
      x: tr.x,
      z: tr.z,
      w: tr.isHoriz ? door.width : wallT,
      d: tr.isHoriz ? wallT : door.width,
    });
  });
  return closed;
}

export function resolveInfiniteCollisions(
  x: number,
  z: number,
  radius: number,
  colliders: BoxCollider[]
): { x: number; z: number } {
  let px = x;
  let pz = z;

  for (let pass = 0; pass < 2; pass++) {
    for (const box of colliders) {
      const minX = box.x - box.w / 2;
      const maxX = box.x + box.w / 2;
      const minZ = box.z - box.d / 2;
      const maxZ = box.z + box.d / 2;

      const closestX = Math.max(minX, Math.min(px, maxX));
      const closestZ = Math.max(minZ, Math.min(pz, maxZ));

      const dx = px - closestX;
      const dz = pz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        if (distSq > 0.00001) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          px += (dx / dist) * overlap;
          pz += (dz / dist) * overlap;
        } else {
          const leftPen = px - minX;
          const rightPen = maxX - px;
          const topPen = pz - minZ;
          const botPen = maxZ - pz;
          const minPen = Math.min(leftPen, rightPen, topPen, botPen);
          if (minPen === leftPen) px = minX - radius;
          else if (minPen === rightPen) px = maxX + radius;
          else if (minPen === topPen) pz = minZ - radius;
          else pz = maxZ + radius;
        }
      }
    }
  }

  return { x: px, z: pz };
}

export function findRoomInChunks(
  chunks: Record<string, ChunkData>,
  x: number,
  z: number
): RoomDef | null {
  const cx = Math.round(x / CHUNK_SIZE);
  const cz = Math.round(z / CHUNK_SIZE);
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const ch = chunks[chunkKey(cx + dx, cz + dz)];
      if (!ch) continue;
      for (const r of ch.rooms) {
        if (
          x >= r.x - r.w / 2 &&
          x <= r.x + r.w / 2 &&
          z >= r.z - r.d / 2 &&
          z <= r.z + r.d / 2
        ) {
          return r;
        }
      }
    }
  }
  return null;
}

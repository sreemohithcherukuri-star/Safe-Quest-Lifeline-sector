export type DisasterId =
  | 'wildfire'
  | 'flood'
  | 'earthquake'
  | 'blizzard'
  | 'asteroid'
  | 'tsunami'
  | 'tornado'
  | 'thunderstorm'
  | 'cyclone'
  | 'volcano'
  | 'landslide'
  | 'avalanche'
  | 'heatwave'
  | 'coldwave'
  | 'drought'
  | 'duststorm'
  | 'hailstorm'
  | 'storm_surge'
  | 'heavy_snowfall'
  | 'windstorm'
  | 'glof'
  | 'sinkhole'
  | 'severe_fog';

export type RegionId =
  | 'forest'
  | 'coastline'
  | 'metro'
  | 'alpine'
  | 'arid'
  | 'volcanic';

export type Difficulty =
  | 'beginner'
  | 'easy'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export type GameMode =
  | 'standard_escape'
  | 'rescue_ops'
  | 'endless_survival'
  | 'scavenger_blitz'
  | 'hardcore_ironman'
  | 'alpine_sprint'
  | 'field_medic'
  | 'supply_frenzy'
  | 'monster_hunt';

export type GameState = 'START_PAGE' | 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

export type CameraViewMode = 'third_person' | 'first_person' | 'free_cam';

export type ControlPlatform = 'auto' | 'pc' | 'mobile' | 'controller';

export type ThemeMode = 'dark' | 'light';

export type GraphicsQuality = 'ultra' | 'high' | 'balanced';

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'es'
  | 'fr'
  | 'ar'
  | 'zh'
  | 'ja'
  | 'pt'
  | 'de'
  | 'ko';

export type DisasterPhase =
  | 'early_warning'
  | 'onset'
  | 'peak_danger'
  | 'subsiding'
  | 'all_clear';

export type CharacterId = 'adult' | 'child';

export type ItemType = 'medkit' | 'food' | 'tool' | 'flare' | 'gear';

export interface InventoryItem {
  id: string;
  type: ItemType;
  emoji: string;
  name: string;
  shortLabel: string;
  description: string;
  weight: number;
}

export interface BoxCollider {
  x: number;
  z: number;
  w: number;
  d: number;
}

export type RoomFloorType = 'tile' | 'wood' | 'concrete' | 'lodge';

export type FurnitureType = 'bed' | 'desk' | 'shelf' | 'workbench' | 'heater';

export interface RoomFurniture {
  type: FurnitureType;
  x: number;
  z: number;
  rotY?: number;
}

export interface DoorOpening {
  id?: string;
  side: 'north' | 'south' | 'east' | 'west';
  offset: number;
  width: number;
}

export type BuildingType = 'standard' | 'hospital' | 'supermarket';

export interface RoomDef {
  id: string;
  name: string;
  buildingType?: BuildingType;
  x: number;
  z: number;
  w: number;
  d: number;
  wallHeight: number;
  floorType: RoomFloorType;
  wallColor: number;
  isShelter: boolean;
  doors: DoorOpening[];
  windows?: Array<{ side: 'north' | 'south' | 'east' | 'west'; offset: number; width: number }>;
  furniture: RoomFurniture[];
}

export interface BuildingSupply {
  id: string;
  roomId: string;
  buildingType: 'hospital' | 'supermarket';
  x: number;
  z: number;
  itemType: 'medkit' | 'food';
}

export interface RubbleBarrier {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  cleared: boolean;
  label: string;
}

export interface CacheNode {
  id: string;
  x: number;
  z: number;
  label: string;
  roomName?: string;
  searched: boolean;
  locked: boolean;
  items: ItemType[];
}

export interface WarningSign {
  id: string;
  x: number;
  z: number;
  title: string;
  message: string;
  officialGuidance: string;
}

export interface GroundPickup {
  id: string;
  x: number;
  z: number;
  itemType: ItemType;
}

export type GunType = 'tactical_rifle' | 'shotgun' | 'plasma_carbine';

export interface GroundGun {
  id: string;
  x: number;
  z: number;
  gunType: GunType;
}

export type PredatorKind = 'stalker' | 'beast' | 'apex_monster';

export interface Predator {
  id: string;
  kind: PredatorKind;
  name: string;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  alive: boolean;
}

export type SurvivorStatus =
  | 'stranded'
  | 'escorted'
  | 'self_evacuated'
  | 'rescued'
  | 'left_behind'
  | 'lost';

export interface Survivor {
  id: string;
  name: string;
  role: string;
  x: number;
  z: number;
  roomName: string;
  condition: string;
  injured: boolean;
  urgencySeconds: number;
  maxUrgencySeconds: number;
  inHazard: boolean;
  status: SurvivorStatus;
  selfEvacItem: ItemType;
  selfEvacText: string;
  escortSpeedPenalty: number;
  perkLabel: string;
  perkId: 'medic_aura' | 'scout_reveal' | 'hazard_resist' | 'extra_speed';
  shirtColor: number;
}

export interface HazardCell {
  id: string;
  x: number;
  z: number;
  radius: number;
  level: 1 | 2;
  active: boolean;
  activationWave: number;
}

export interface ExtractionPoint {
  id: string;
  x: number;
  z: number;
  name: string;
}

export interface ChunkData {
  key: string;
  cx: number;
  cz: number;
  rooms: RoomDef[];
  buildingSupplies: BuildingSupply[];
  roads: Array<{ x: number; z: number; w: number; d: number }>;
  rubbles: RubbleBarrier[];
  caches: CacheNode[];
  signs: WarningSign[];
  pickups: GroundPickup[];
  guns: GroundGun[];
  predators: Predator[];
  survivors: Survivor[];
  hazards: HazardCell[];
  extraction: ExtractionPoint | null;
  colliders: BoxCollider[];
}

export interface LogEntry {
  id: string;
  timeSec: number;
  text: string;
  kind: 'info' | 'warning' | 'rescue' | 'hazard' | 'item';
}

export interface NearbyPrompt {
  kind:
    | 'survivor'
    | 'cache'
    | 'rubble'
    | 'extraction'
    | 'pickup'
    | 'supply'
    | 'gun'
    | 'sign'
    | 'door';
  id: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  disabled?: boolean;
  itemType?: ItemType;
  gunType?: GunType;
}

export interface ResourceArrowTarget {
  distance: number;
  angleDeg: number;
}

export interface ScenarioDefinition {
  id: DisasterId;
  regionId: RegionId;
  biomeLabel: string;
  title: string;
  location: string;
  subtitle: string;
  imageUrl: string | null;
  accentHex: string;
  skyColor: number;
  fogColor: number;
  groundColor: number;
  hazardLabel: string;
  severeLabel: string;
  staminaLabel: string;
  extractionName: string;
  toolName: string;
  gearName: string;
  briefing: string;
  hazardMechanic: string;
  warningSignTitle: string;
  warningSignMessage: string;
  officialGuidance: string;
  secondaryHazardId?: DisasterId;
  recommendedMinDifficulty: Difficulty;
  startingItems: ItemType[];
}

export interface DecisionEvent {
  id: string;
  timeSec: number;
  category: 'shelter' | 'resource' | 'terrain' | 'warning' | 'evacuation' | 'rescue';
  action: string;
  quality: 'safe' | 'risky' | 'mistake';
  idealAction: string;
  reason: string;
}

export interface SafetyComparisonRow {
  topic: string;
  whatYouDid: string;
  whatYouShouldDo: string;
  whySafer: string;
  verdict: 'good' | 'improve' | 'critical';
}

export interface PerformanceEvaluation {
  totalScore: number;
  decisionScore: number;
  awarenessScore: number;
  resourceScore: number;
  complianceScore: number;
  rows: SafetyComparisonRow[];
}

export interface ActiveRunState {
  scenarioId: DisasterId;
  difficulty: Difficulty;
  gameMode: GameMode;
  characterId: CharacterId;
  customShirtHex?: string;
  enablePredators: boolean;
  enableGuns: boolean;
  elapsedSec: number;
  disasterPhase: DisasterPhase;
  disasterDurationSec: number;
  disasterTimeRemainingSec: number;
  peakShelterSec: number;
  peakExposedSec: number;
  earlyExitAttempts: number;
  highGroundSec: number;
  signsReadIds: Record<string, boolean>;
  decisionEvents: DecisionEvent[];
  wave: number;
  nextWaveInSec: number;
  playerX: number;
  playerZ: number;
  playerYaw: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  currentRoomName: string;
  inventory: InventoryItem[];
  chunks: Record<string, ChunkData>;
  openDoorIds: Record<string, boolean>;
  clearedRubbleIds: Record<string, boolean>;
  searchedCacheIds: Record<string, boolean>;
  cacheRemainingItems: Record<string, ItemType[]>;
  collectedPickupIds: Record<string, boolean>;
  collectedSupplyIds: Record<string, boolean>;
  collectedGunIds: Record<string, boolean>;
  points: number;
  activeGun: { type: GunType; remainingSec: number } | null;
  claimedResupplyIds: Record<string, boolean>;
  survivorStates: Record<string, Survivor>;
  predatorStates: Record<string, Predator>;
  predatorsDefeatedCount: number;
  flareTurnsRemainingSec: number;
  flashlightOn: boolean;
  wildfireRing?: {
    centerX: number;
    centerZ: number;
    radius: number;
    minRadius: number;
  } | null;
  helicopter: {
    arrived: boolean;
    x: number;
    z: number;
    arrivalTimeSec: number;
    departureTimeSec: number;
    nextArrivalSec: number;
    missedCount: number;
    lastDepartedX?: number;
    lastDepartedZ?: number;
    lastDepartedAtSec?: number;
  } | null;
  cachesRevealed: boolean;
  activeCacheId: string | null;
  activeSurvivorId: string | null;
  activeSign: WarningSign | null;
  outcome: 'ongoing' | 'extracted' | 'fallen';
  outcomeReason: string;
  logs: LogEntry[];
  itemsCollectedCount: number;
  distanceTraveled: number;
  inHazardLevel: 0 | 1 | 2;
  waveBannerUntilSec: number;
}

export interface CareerStats {
  runsCompleted: number;
  runsSurvived: number;
  totalPoints: number;
  bestSafetyScore: number;
  totalCiviliansSaved: number;
  signsReadCount: number;
  completedDisasters: Partial<Record<DisasterId, number>>;
  unlockedRegions: RegionId[];
  achievements: string[];
  sandboxUnlockAll: boolean;
}

export interface CustomMusicControls {
  trackName: string | null;
  hasTrack: boolean;
  isPlaying: boolean;
  isLooping: boolean;
  volume: number;
  error?: string | null;
  onUploadFile: (file: File) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onVolumeChange: (volume: number) => void;
  onClearTrack: () => void;
}

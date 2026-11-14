import { Difficulty, DisasterId, RegionId } from '../types/game';

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  tagline: string;
  waveIntervalSec: number;
  disasterDurationSec: number;
  damageMultiplier: number;
  staminaDrainMultiplier: number;
  resourceScarcity: number; // 1 = plentiful, 0.55 = scarce
  compoundHazardEnabled: boolean;
}

export const DAY_CYCLE_SEC = 120; // 60s Day + 60s Night
export const HELICOPTER_ARRIVAL_SEC = 240; // Rescue helicopter arrives every 2 full days
export const HELICOPTER_STAY_SEC = 30; // Stays landed for only 30 seconds per visit

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    id: 'beginner',
    label: 'Beginner',
    tagline: 'Gentle hazards · helicopter stays 30s every 2 days',
    waveIntervalSec: 24,
    disasterDurationSec: HELICOPTER_ARRIVAL_SEC,
    damageMultiplier: 0.65,
    staminaDrainMultiplier: 0.72,
    resourceScarcity: 1.0,
    compoundHazardEnabled: false,
  },
  easy: {
    id: 'easy',
    label: 'Easy',
    tagline: 'Steady conditions · helicopter stays 30s every 2 days',
    waveIntervalSec: 20,
    disasterDurationSec: HELICOPTER_ARRIVAL_SEC,
    damageMultiplier: 0.85,
    staminaDrainMultiplier: 0.86,
    resourceScarcity: 0.9,
    compoundHazardEnabled: false,
  },
  intermediate: {
    id: 'intermediate',
    label: 'Intermediate',
    tagline: 'Realistic exposure · helicopter stays 30s every 2 days',
    waveIntervalSec: 17,
    disasterDurationSec: HELICOPTER_ARRIVAL_SEC,
    damageMultiplier: 1.0,
    staminaDrainMultiplier: 1.0,
    resourceScarcity: 0.8,
    compoundHazardEnabled: false,
  },
  advanced: {
    id: 'advanced',
    label: 'Advanced',
    tagline: 'Compound secondary hazards · 30s helicopter every 2 days',
    waveIntervalSec: 14,
    disasterDurationSec: HELICOPTER_ARRIVAL_SEC,
    damageMultiplier: 1.22,
    staminaDrainMultiplier: 1.18,
    resourceScarcity: 0.72,
    compoundHazardEnabled: true,
  },
  expert: {
    id: 'expert',
    label: 'Expert',
    tagline: 'Multi-hazard crisis · 30s helicopter every 2 days',
    waveIntervalSec: 11,
    disasterDurationSec: HELICOPTER_ARRIVAL_SEC,
    damageMultiplier: 1.45,
    staminaDrainMultiplier: 1.35,
    resourceScarcity: 0.65,
    compoundHazardEnabled: true,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = [
  'beginner',
  'easy',
  'intermediate',
  'advanced',
  'expert',
];

export interface RegionDefinition {
  id: RegionId;
  name: string;
  biome: string;
  description: string;
  accentHex: string;
  mapX: number; // % on World Map SVG
  mapY: number;
  initiallyUnlocked: boolean;
  disasters: DisasterId[];
}

export const REGIONS: Record<RegionId, RegionDefinition> = {
  forest: {
    id: 'forest',
    name: 'Timberline Valley & Foothills',
    biome: 'Temperate Forest & Steep Slopes',
    description: 'Dense conifer ridges, mountain river basins, and monsoon foothills.',
    accentHex: '#F97316',
    mapX: 22,
    mapY: 36,
    initiallyUnlocked: true,
    disasters: ['wildfire', 'landslide', 'thunderstorm', 'windstorm'],
  },
  coastline: {
    id: 'coastline',
    name: 'Pacific Harbor & Barrier Islands',
    biome: 'Coastlines, Estuaries & Islands',
    description: 'Harbor seawalls, coastal causeways, and tidal delta settlements.',
    accentHex: '#06B6D4',
    mapX: 74,
    mapY: 54,
    initiallyUnlocked: true,
    disasters: ['flood', 'tsunami', 'cyclone', 'storm_surge', 'severe_fog'],
  },
  metro: {
    id: 'metro',
    name: 'Metro Faultline Basin',
    biome: 'Dense Cities & Karst Suburbs',
    description: 'High-density transit halls, bridges, and limestone urban blocks.',
    accentHex: '#F59E0B',
    mapX: 46,
    mapY: 44,
    initiallyUnlocked: true,
    disasters: ['earthquake', 'sinkhole', 'heatwave'],
  },
  alpine: {
    id: 'alpine',
    name: 'Summit Pass & Glacier Belt',
    biome: 'High Mountains & Polar Tundra',
    description: 'Snow-capped passes, glacial lakes, and sub-zero mountain villages.',
    accentHex: '#A5F3FC',
    mapX: 54,
    mapY: 20,
    initiallyUnlocked: false,
    disasters: ['blizzard', 'avalanche', 'glof', 'heavy_snowfall', 'coldwave'],
  },
  arid: {
    id: 'arid',
    name: 'Heartland Steppe & Red Canyons',
    biome: 'Open Plains & Arid Deserts',
    description: 'Supercell tornado corridors, parched farmland, and canyon dust basins.',
    accentHex: '#EAB308',
    mapX: 28,
    mapY: 64,
    initiallyUnlocked: false,
    disasters: ['tornado', 'drought', 'duststorm', 'hailstorm'],
  },
  volcanic: {
    id: 'volcanic',
    name: 'Obsidian Caldera Highlands',
    biome: 'Volcanic Arc & Crater Fields',
    description: 'Active stratovolcano slopes, basalt vaults, and fallout ridges.',
    accentHex: '#FB7185',
    mapX: 82,
    mapY: 28,
    initiallyUnlocked: false,
    disasters: ['volcano', 'asteroid'],
  },
};

export const REGION_ORDER: RegionId[] = [
  'forest',
  'coastline',
  'metro',
  'alpine',
  'arid',
  'volcanic',
];

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_all_clear',
    title: 'All-Clear Survivor',
    description: 'Wait for Official All-Clear and complete your first disaster simulation.',
    tier: 'bronze',
  },
  {
    id: 'shelter_discipline',
    title: 'Shelter Disciplined',
    description: 'Hold position inside safe shelter through Peak Danger without leaving early.',
    tier: 'silver',
  },
  {
    id: 'field_reader',
    title: 'Situation Reader',
    description: 'Inspect 3 roadside Warning Signs to gather official emergency context.',
    tier: 'bronze',
  },
  {
    id: 'safety_90',
    title: 'Emergency Commander',
    description: 'Achieve a Safety Performance Score of 90+ on any scenario.',
    tier: 'gold',
  },
  {
    id: 'guardian_angel',
    title: 'Community Guardian',
    description: 'Assist 5 or more stranded civilians across your survival career.',
    tier: 'silver',
  },
  {
    id: 'five_disasters',
    title: 'Multi-Hazard Specialist',
    description: 'Complete 5 different natural disaster scenarios.',
    tier: 'silver',
  },
  {
    id: 'ten_disasters',
    title: 'Global Responder',
    description: 'Complete 10 different natural disaster scenarios across multiple regions.',
    tier: 'gold',
  },
  {
    id: 'advanced_survivor',
    title: 'Compound Crisis Veteran',
    description: 'Survive an Advanced or Expert scenario with compound hazards.',
    tier: 'gold',
  },
  {
    id: 'world_unlocked',
    title: 'Borderless Explorer',
    description: 'Unlock all 6 geographical regions on the SafeQuest World Map.',
    tier: 'gold',
  },
  {
    id: 'high_scorer',
    title: 'Sector Legend',
    description: 'Accumulate 5,000 career points across survival deployments.',
    tier: 'silver',
  },
];

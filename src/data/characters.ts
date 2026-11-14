import { CharacterId } from '../types/game';

export type CharacterHatStyle = 'cap' | 'medic' | 'headband' | 'hardhat' | 'visor' | 'none';

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  callsign: string;
  role: string;
  tagline: string;
  perkLabel: string;
  bonusHealth: number;
  bonusStamina: number;
  speedMultiplier: number;
  damageMultiplier: number;
  bodyScale: number;
  eyeHeight: number;
  hatStyle: CharacterHatStyle;
  shirtHex: string;
  shirtColor: number;
  pantsHex: string;
  pantsColor: number;
  skinHex: string;
  skinColor: number;
  hairHex: string;
  hairColor: number;
  accentHex: string;
  accentColor: number;
}

export const CHARACTERS: Record<CharacterId, CharacterDefinition> = {
  adult: {
    id: 'adult',
    name: 'Adult',
    callsign: 'ADULT-01',
    role: 'Adult Survivor',
    tagline: 'Sturdy adult survivor built for endurance, protective gear, and carrying rescues.',
    perkLabel: '+20 Max Health · 10% Hazard Armor',
    bonusHealth: 20,
    bonusStamina: 0,
    speedMultiplier: 1.0,
    damageMultiplier: 0.9,
    bodyScale: 1.0,
    eyeHeight: 1.68,
    hatStyle: 'cap',
    shirtHex: '#0284c7',
    shirtColor: 0x0284c7,
    pantsHex: '#1e293b',
    pantsColor: 0x1e293b,
    skinHex: '#e0b090',
    skinColor: 0xe0b090,
    hairHex: '#3b2416',
    hairColor: 0x3b2416,
    accentHex: '#38bdf8',
    accentColor: 0x38bdf8,
  },
  child: {
    id: 'child',
    name: 'Child',
    callsign: 'CHILD-02',
    role: 'Child Survivor',
    tagline: 'Agile, fast-moving child survivor with extra stamina to dart between hospitals and supermarkets.',
    perkLabel: '+15% Move Speed · +25 Max Stamina',
    bonusHealth: 0,
    bonusStamina: 25,
    speedMultiplier: 1.15,
    damageMultiplier: 1.0,
    bodyScale: 0.72,
    eyeHeight: 1.24,
    hatStyle: 'headband',
    shirtHex: '#f59e0b',
    shirtColor: 0xf59e0b,
    pantsHex: '#334155',
    pantsColor: 0x334155,
    skinHex: '#e6bea0',
    skinColor: 0xe6bea0,
    hairHex: '#271a12',
    hairColor: 0x271a12,
    accentHex: '#fbbf24',
    accentColor: 0xfbbf24,
  },
};

export const CHARACTER_ORDER: CharacterId[] = ['adult', 'child'];

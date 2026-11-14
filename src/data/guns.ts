import { GunType } from '../types/game';

export interface GunDefinition {
  id: GunType;
  name: string;
  emoji: string;
  durationSec: number;
  cooldownSec: number;
  range: number;
  spreadRadius: number;
  colorHex: string;
  colorNum: number;
  description: string;
}

export const GUN_POOL: GunType[] = ['tactical_rifle', 'shotgun', 'plasma_carbine'];

export const GUNS: Record<GunType, GunDefinition> = {
  tactical_rifle: {
    id: 'tactical_rifle',
    name: 'Pulse Rifle',
    emoji: '🔫',
    durationSec: 30,
    cooldownSec: 0.18,
    range: 46,
    spreadRadius: 0.75,
    colorHex: '#f43f5e',
    colorNum: 0xf43f5e,
    description: 'Rapid-fire precision rifle · 1-shot kills predators for 30s',
  },
  shotgun: {
    id: 'shotgun',
    name: 'Riot Shotgun',
    emoji: '💥',
    durationSec: 30,
    cooldownSec: 0.36,
    range: 34,
    spreadRadius: 1.55,
    colorHex: '#fb923c',
    colorNum: 0xfb923c,
    description: 'Wide-blast scattergun · shreds chasing monsters for 30s',
  },
  plasma_carbine: {
    id: 'plasma_carbine',
    name: 'Arc Blaster',
    emoji: '⚡',
    durationSec: 30,
    cooldownSec: 0.22,
    range: 50,
    spreadRadius: 0.95,
    colorHex: '#22d3ee',
    colorNum: 0x22d3ee,
    description: 'High-energy carbine · long-range predator elimination for 30s',
  },
};

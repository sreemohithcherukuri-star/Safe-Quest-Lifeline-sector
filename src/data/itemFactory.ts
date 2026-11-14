import { InventoryItem, ItemType, ScenarioDefinition } from '../types/game';

export function createItem(type: ItemType, scenario: ScenarioDefinition, uid: string): InventoryItem {
  switch (type) {
    case 'medkit':
      return {
        id: uid,
        type,
        emoji: '🩹',
        name: 'Hospital Medkit',
        shortLabel: 'Medkit',
        description: 'Hospital trauma medkit with bandages, antiseptic, and gauze (+38% Health).',
        weight: 1,
      };
    case 'food':
      return {
        id: uid,
        type,
        emoji: '🍎',
        name: 'Supermarket Food',
        shortLabel: 'Food',
        description: 'Nutritious supermarket food pack & hydration (+40% Stamina & +12% Health).',
        weight: 1,
      };
    case 'tool':
      return {
        id: uid,
        type,
        emoji:
          scenario.id === 'wildfire'
            ? '🪓'
            : scenario.id === 'flood' || scenario.id === 'tsunami' || scenario.id === 'storm_surge'
            ? '🪢'
            : scenario.id === 'thunderstorm'
            ? '⚡'
            : '🛠️',
        name: scenario.toolName,
        shortLabel: scenario.toolName,
        description: 'Heavy-duty utility tool built for clearing blocked routes.',
        weight: 1,
      };
    case 'flare':
      return {
        id: uid,
        type,
        emoji: '🔦',
        name: 'Signal Flare',
        shortLabel: 'Flare',
        description: 'High-lumen emergency flare canister that clears dense fog for 18 seconds.',
        weight: 1,
      };
    case 'gear':
      return {
        id: uid,
        type,
        emoji:
          scenario.id === 'wildfire' || scenario.id === 'volcano' || scenario.id === 'duststorm'
            ? '😷'
            : scenario.id === 'flood' || scenario.id === 'tsunami' || scenario.id === 'storm_surge'
            ? '🦺'
            : '⛑️',
        name: scenario.gearName,
        shortLabel: scenario.gearName,
        description: 'Specialized personal protective equipment.',
        weight: 1,
      };
  }
}

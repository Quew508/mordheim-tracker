import type { EquipmentItem, CustomEquipmentItem } from './equipment';
import type { StatLine } from './reference';

export type ModelStatus = 'Active' | 'Dead' | 'Retired';

export interface TransactionEntry {
  id: string;
  description: string;
  amount: number;
}

export interface LootEntry {
  id: string;
  description: string;
  goldValue: number | null;
}

export interface IndividualModel {
  id: string;
  name: string;
  status: ModelStatus;
  statDeviations: StatLine;
  injuryLog: string[];
  ooa: number;
}

export interface Hero {
  id: string;
  name: string;
  role: string;
  status: ModelStatus;
  stats: StatLine;
  xp: number;
  xpLog: string[];
  skills: string[];
  injuryLog: string[];
  equipment: EquipmentItem[];
  ooa: number;
  recruitmentCost: number | null;
}

export interface HenchmanGroup {
  id: string;
  name: string;
  role: string;
  status: ModelStatus;
  stats: StatLine;
  xp: number;
  advancementNotes: string[];
  injuryLog: string[];
  equipment: EquipmentItem[];
  models: IndividualModel[];
  modelCountOverride: number | null;
  recruitmentCost: number | null;
}

export interface Warband {
  id: string;
  name: string;
  faction: string;
  notes: string;
  rating: number;
  heroes: Hero[];
  henchmanGroups: HenchmanGroup[];
  inventory: EquipmentItem[];
  customEquipmentLibrary: CustomEquipmentItem[];
  goldCrowns: number;
  wyrdstoneFragments: number;
  transactionLog: TransactionEntry[];
  achievements: string[];
  lootLog: LootEntry[];
}

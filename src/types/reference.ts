export interface StatLine {
  M: number;
  WS: number;
  BS: number;
  S: number;
  T: number;
  W: number;
  I: number;
  A: number;
  Ld: number;
}

export interface EquipmentCatalogueItem {
  id: string;
  name: string;
  cost: number | null;
  source: string;
}

export interface ModelTypeTemplate {
  id: string;
  name: string;
  role: 'hero' | 'henchman';
  recruitmentCost: number;
  maxCount: number | null;
  statLine: StatLine;
  equipment: string[];
  source: string;
}

export interface FactionTemplate {
  id: string;
  name: string;
  modelTypes: ModelTypeTemplate[];
}

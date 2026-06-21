export type EquipmentSource = 'bundled' | 'custom';

export interface EquipmentItem {
  id: string;
  name: string;
  cost: number | null;
  source: EquipmentSource;
  catalogueId?: string;
  notes?: string;
}

export interface CustomEquipmentItem {
  id: string;
  name: string;
  cost: number | null;
}

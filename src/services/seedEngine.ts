import type { ModelTypeTemplate } from '../types/reference';
import type { Hero, HenchmanGroup } from '../types/warband';

export function seedHeroFromTemplate(template: ModelTypeTemplate): Hero {
  return {
    id: crypto.randomUUID(),
    name: template.name,
    role: template.name,
    status: 'Active',
    stats: structuredClone(template.statLine),
    xp: 0,
    xpLog: [],
    skills: [],
    injuryLog: [],
    equipment: [],
    ooa: 0,
    recruitmentCost: template.recruitmentCost,
  };
}

export function seedHenchmanFromTemplate(template: ModelTypeTemplate): HenchmanGroup {
  return {
    id: crypto.randomUUID(),
    name: template.name,
    role: template.name,
    status: 'Active',
    stats: structuredClone(template.statLine),
    xp: 0,
    advancementNotes: [],
    injuryLog: [],
    equipment: [],
    models: [],
    modelCountOverride: null,
    recruitmentCost: template.recruitmentCost,
  };
}

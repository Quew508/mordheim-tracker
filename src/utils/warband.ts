import type { Warband } from '../types/warband';

/**
 * Computes the warband rating from current roster data.
 * Rating = (total active model count × 5) + total experience points.
 * Dead/Retired heroes and groups are excluded.
 * Heroes each contribute their individual XP.
 * Henchman groups contribute (model count × group XP) since all models
 * in a group share the same experience value.
 */
export function computeWarbandRating(warband: Warband): number {
  const activeHeroes = warband.heroes.filter((h) => h.status === 'Active');
  const heroCount = activeHeroes.length;
  const heroXp = activeHeroes.reduce((sum, h) => sum + (h.xp || 0), 0);

  let henchmanCount = 0;
  let henchmanXp = 0;
  for (const group of warband.henchmanGroups.filter((g) => g.status === 'Active')) {
    const modelCount = group.models.length;
    henchmanCount += modelCount;
    henchmanXp += modelCount * (group.xp || 0);
  }

  const totalModels = heroCount + henchmanCount;
  const totalXp = heroXp + henchmanXp;
  return totalModels * 5 + totalXp;
}

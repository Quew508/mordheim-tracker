import { describe, it, expect } from 'vitest';
import { seedHeroFromTemplate, seedHenchmanFromTemplate } from './seedEngine';
import type { ModelTypeTemplate } from '../types/reference';

const heroTemplate: ModelTypeTemplate = {
  id: 'witch-hunter-captain',
  name: 'Witch Hunter Captain',
  role: 'hero',
  recruitmentCost: 60,
  maxCount: 1,
  statLine: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
  equipment: [],
  source: 'Mordheim Core Rulebook',
};

const henchmanTemplate: ModelTypeTemplate = {
  id: 'wh-zealot',
  name: 'Zealot',
  role: 'henchman',
  recruitmentCost: 15,
  maxCount: null,
  statLine: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 },
  equipment: [],
  source: 'Mordheim Core Rulebook',
};

const noRecruitCostTemplate: ModelTypeTemplate = {
  ...heroTemplate,
  id: 'free-hero',
  recruitmentCost: 0,
};

describe('seedHeroFromTemplate', () => {
  it('sets name and role from template name', () => {
    const hero = seedHeroFromTemplate(heroTemplate);
    expect(hero.name).toBe('Witch Hunter Captain');
    expect(hero.role).toBe('Witch Hunter Captain');
  });

  it('copies stats from template statLine', () => {
    const hero = seedHeroFromTemplate(heroTemplate);
    expect(hero.stats).toEqual({ M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 });
  });

  it('deep copies statLine — mutating seeded stats does not affect template', () => {
    const hero = seedHeroFromTemplate(heroTemplate);
    hero.stats.WS = 99;
    expect(heroTemplate.statLine.WS).toBe(4);
  });

  it('sets recruitmentCost from template', () => {
    const hero = seedHeroFromTemplate(heroTemplate);
    expect(hero.recruitmentCost).toBe(60);
  });

  it('sets status to Active', () => {
    const hero = seedHeroFromTemplate(heroTemplate);
    expect(hero.status).toBe('Active');
  });

  it('sets xp to 0 and ooa to 0', () => {
    const hero = seedHeroFromTemplate(heroTemplate);
    expect(hero.xp).toBe(0);
    expect(hero.ooa).toBe(0);
  });

  it('initialises all array fields as empty', () => {
    const hero = seedHeroFromTemplate(heroTemplate);
    expect(hero.xpLog).toEqual([]);
    expect(hero.skills).toEqual([]);
    expect(hero.injuryLog).toEqual([]);
    expect(hero.equipment).toEqual([]);
  });

  it('generates a unique id each call', () => {
    const a = seedHeroFromTemplate(heroTemplate);
    const b = seedHeroFromTemplate(heroTemplate);
    expect(a.id).not.toBe(b.id);
  });
});

describe('seedHenchmanFromTemplate', () => {
  it('sets name and role from template name', () => {
    const group = seedHenchmanFromTemplate(henchmanTemplate);
    expect(group.name).toBe('Zealot');
    expect(group.role).toBe('Zealot');
  });

  it('copies stats from template statLine', () => {
    const group = seedHenchmanFromTemplate(henchmanTemplate);
    expect(group.stats).toEqual({ M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 6 });
  });

  it('deep copies statLine — mutating seeded stats does not affect template', () => {
    const group = seedHenchmanFromTemplate(henchmanTemplate);
    group.stats.M = 99;
    expect(henchmanTemplate.statLine.M).toBe(4);
  });

  it('sets recruitmentCost from template', () => {
    const group = seedHenchmanFromTemplate(henchmanTemplate);
    expect(group.recruitmentCost).toBe(15);
  });

  it('sets status to Active', () => {
    const group = seedHenchmanFromTemplate(henchmanTemplate);
    expect(group.status).toBe('Active');
  });

  it('initialises models, modelCountOverride, and array fields', () => {
    const group = seedHenchmanFromTemplate(henchmanTemplate);
    expect(group.models).toEqual([]);
    expect(group.modelCountOverride).toBeNull();
    expect(group.advancementNotes).toEqual([]);
    expect(group.injuryLog).toEqual([]);
    expect(group.equipment).toEqual([]);
  });

  it('generates a unique id each call', () => {
    const a = seedHenchmanFromTemplate(henchmanTemplate);
    const b = seedHenchmanFromTemplate(henchmanTemplate);
    expect(a.id).not.toBe(b.id);
  });

  it('handles zero recruitmentCost', () => {
    const group = seedHenchmanFromTemplate({ ...henchmanTemplate, recruitmentCost: 0 });
    expect(group.recruitmentCost).toBe(0);
  });

  it('noRecruitCostTemplate seeds with 0 recruitmentCost', () => {
    const hero = seedHeroFromTemplate(noRecruitCostTemplate);
    expect(hero.recruitmentCost).toBe(0);
  });
});

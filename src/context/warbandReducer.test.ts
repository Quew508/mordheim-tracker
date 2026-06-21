import { describe, it, expect } from 'vitest';
import { warbandReducer } from './warbandReducer';
import type { AppData } from '../types/storage';
import type { Warband, Hero, HenchmanGroup, IndividualModel } from '../types/warband';

function makeHero(overrides?: Partial<Hero>): Hero {
  return {
    id: 'h-1',
    name: 'Geralt',
    role: 'Captain',
    status: 'Active',
    stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
    xp: 0,
    xpLog: [],
    skills: [],
    injuryLog: [],
    equipment: [],
    ooa: 0,
    recruitmentCost: null,
    ...overrides,
  };
}

function makeModel(overrides?: Partial<IndividualModel>): IndividualModel {
  return {
    id: 'm-1',
    name: '',
    status: 'Active',
    statDeviations: { M: 0, WS: 0, BS: 0, S: 0, T: 0, W: 0, I: 0, A: 0, Ld: 0 },
    injuryLog: [],
    ooa: 0,
    ...overrides,
  };
}

function makeGroup(overrides?: Partial<HenchmanGroup>): HenchmanGroup {
  return {
    id: 'g-1',
    name: 'Swordsmen',
    role: 'Warriors',
    status: 'Active',
    stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
    xp: 0,
    advancementNotes: [],
    injuryLog: [],
    equipment: [],
    models: [makeModel()],
    modelCountOverride: null,
    recruitmentCost: null,
    ...overrides,
  };
}

function makeWarband(overrides?: Partial<Warband>): Warband {
  return {
    id: 'w-1',
    name: 'Test Warband',
    faction: 'Reiklanders',
    notes: '',
    rating: 0,
    heroes: [makeHero()],
    henchmanGroups: [makeGroup()],
    inventory: [],
    customEquipmentLibrary: [],
    goldCrowns: 100,
    wyrdstoneFragments: 0,
    transactionLog: [],
    achievements: [],
    lootLog: [],
    ...overrides,
  };
}

function makeState(warband: Warband): AppData {
  return { schemaVersion: 1, warbands: [warband] };
}

function getHero(state: AppData): Hero {
  return state.warbands[0].heroes[0];
}

function getModel(state: AppData): IndividualModel {
  return state.warbands[0].henchmanGroups[0].models[0];
}

describe('warbandReducer — INCREMENT_OOA', () => {
  it('increments hero ooa by 1', () => {
    const state = makeState(makeWarband({ heroes: [makeHero({ ooa: 2 })] }));
    const next = warbandReducer(state, {
      type: 'INCREMENT_OOA',
      payload: { warbandId: 'w-1', heroId: 'h-1', delta: 1 },
    });
    expect(getHero(next).ooa).toBe(3);
  });

  it('decrements hero ooa by 1', () => {
    const state = makeState(makeWarband({ heroes: [makeHero({ ooa: 3 })] }));
    const next = warbandReducer(state, {
      type: 'INCREMENT_OOA',
      payload: { warbandId: 'w-1', heroId: 'h-1', delta: -1 },
    });
    expect(getHero(next).ooa).toBe(2);
  });

  it('clamps hero ooa at 0 when decrementing from 0', () => {
    const state = makeState(makeWarband({ heroes: [makeHero({ ooa: 0 })] }));
    const next = warbandReducer(state, {
      type: 'INCREMENT_OOA',
      payload: { warbandId: 'w-1', heroId: 'h-1', delta: -1 },
    });
    expect(getHero(next).ooa).toBe(0);
  });

  it('increments individual model ooa by 1', () => {
    const state = makeState(makeWarband({ henchmanGroups: [makeGroup({ models: [makeModel({ ooa: 1 })] })] }));
    const next = warbandReducer(state, {
      type: 'INCREMENT_OOA',
      payload: { warbandId: 'w-1', groupId: 'g-1', modelId: 'm-1', delta: 1 },
    });
    expect(getModel(next).ooa).toBe(2);
  });

  it('clamps model ooa at 0 when decrementing from 0', () => {
    const state = makeState(makeWarband({ henchmanGroups: [makeGroup({ models: [makeModel({ ooa: 0 })] })] }));
    const next = warbandReducer(state, {
      type: 'INCREMENT_OOA',
      payload: { warbandId: 'w-1', groupId: 'g-1', modelId: 'm-1', delta: -1 },
    });
    expect(getModel(next).ooa).toBe(0);
  });
  it('handles undefined ooa on legacy hero (treats as 0)', () => {
    const heroWithoutOoa = { ...makeHero(), ooa: undefined as unknown as number };
    const state = makeState(makeWarband({ heroes: [heroWithoutOoa] }));
    const next = warbandReducer(state, {
      type: 'INCREMENT_OOA',
      payload: { warbandId: 'w-1', heroId: 'h-1', delta: 1 },
    });
    expect(getHero(next).ooa).toBe(1);
  });
});

describe('warbandReducer — CLEAR_OOA', () => {
  it('sets hero ooa to 0', () => {
    const state = makeState(makeWarband({ heroes: [makeHero({ ooa: 5 })] }));
    const next = warbandReducer(state, {
      type: 'CLEAR_OOA',
      payload: { warbandId: 'w-1', heroId: 'h-1' },
    });
    expect(getHero(next).ooa).toBe(0);
  });

  it('sets individual model ooa to 0', () => {
    const state = makeState(makeWarband({ henchmanGroups: [makeGroup({ models: [makeModel({ ooa: 4 })] })] }));
    const next = warbandReducer(state, {
      type: 'CLEAR_OOA',
      payload: { warbandId: 'w-1', groupId: 'g-1', modelId: 'm-1' },
    });
    expect(getModel(next).ooa).toBe(0);
  });

  it('does not affect other heroes in the same warband', () => {
    const hero2 = makeHero({ id: 'h-2', ooa: 3 });
    const state = makeState(makeWarband({ heroes: [makeHero({ ooa: 2 }), hero2] }));
    const next = warbandReducer(state, {
      type: 'CLEAR_OOA',
      payload: { warbandId: 'w-1', heroId: 'h-1' },
    });
    expect(next.warbands[0].heroes.find((h) => h.id === 'h-2')!.ooa).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// RECORD_POST_GAME
// ---------------------------------------------------------------------------
describe('warbandReducer — RECORD_POST_GAME', () => {
  function basePayload(overrides?: object) {
    return {
      warbandId: 'w-1',
      heroes: [],
      groups: [],
      goldDelta: 0,
      wyrdstoneDelta: 0,
      transactionDescription: '',
      ...overrides,
    };
  }

  it('applies XP delta to hero', () => {
    const state = makeState(makeWarband({ heroes: [makeHero({ xp: 5 })] }));
    const next = warbandReducer(state, {
      type: 'RECORD_POST_GAME',
      payload: basePayload({
        heroes: [{ heroId: 'h-1', xpDelta: 2, injuryEntry: null, skillEntry: null }],
      }),
    });
    expect(getHero(next).xp).toBe(7);
  });

  it('appends injury entry to hero when non-null', () => {
    const state = makeState(makeWarband({ heroes: [makeHero({ injuryLog: [] })] }));
    const next = warbandReducer(state, {
      type: 'RECORD_POST_GAME',
      payload: basePayload({
        heroes: [{ heroId: 'h-1', xpDelta: 0, injuryEntry: 'Old Battle Wound', skillEntry: null }],
      }),
    });
    expect(getHero(next).injuryLog).toEqual(['Old Battle Wound']);
  });

  it('appends skill entry to hero when non-null', () => {
    const state = makeState(makeWarband({ heroes: [makeHero({ skills: [] })] }));
    const next = warbandReducer(state, {
      type: 'RECORD_POST_GAME',
      payload: basePayload({
        heroes: [{ heroId: 'h-1', xpDelta: 0, injuryEntry: null, skillEntry: 'Sprint' }],
      }),
    });
    expect(getHero(next).skills).toEqual(['Sprint']);
  });

  it('resets ooa to 0 for targeted hero', () => {
    const state = makeState(makeWarband({ heroes: [makeHero({ ooa: 3 })] }));
    const next = warbandReducer(state, {
      type: 'RECORD_POST_GAME',
      payload: basePayload({
        heroes: [{ heroId: 'h-1', xpDelta: 0, injuryEntry: null, skillEntry: null }],
      }),
    });
    expect(getHero(next).ooa).toBe(0);
  });

  it('resets ooa to 0 for hero NOT in the heroes array', () => {
    const hero2 = makeHero({ id: 'h-2', ooa: 5 });
    const state = makeState(makeWarband({ heroes: [makeHero({ ooa: 3 }), hero2] }));
    const next = warbandReducer(state, {
      type: 'RECORD_POST_GAME',
      payload: basePayload({ heroes: [] }), // h-1 and h-2 not in array
    });
    expect(next.warbands[0].heroes.find((h) => h.id === 'h-2')!.ooa).toBe(0);
  });

  it('resets ooa to 0 for all individual models', () => {
    const state = makeState(
      makeWarband({ henchmanGroups: [makeGroup({ models: [makeModel({ ooa: 4 })] })] }),
    );
    const next = warbandReducer(state, {
      type: 'RECORD_POST_GAME',
      payload: basePayload(),
    });
    expect(getModel(next).ooa).toBe(0);
  });

  it('applies gold delta and clamps at 0', () => {
    const state = makeState(makeWarband({ goldCrowns: 3 }));
    const next = warbandReducer(state, {
      type: 'RECORD_POST_GAME',
      payload: basePayload({ goldDelta: -10 }),
    });
    expect(next.warbands[0].goldCrowns).toBe(0);
  });

  it('appends TransactionEntry when goldDelta non-zero and description non-empty', () => {
    const state = makeState(makeWarband({ goldCrowns: 100, transactionLog: [] }));
    const next = warbandReducer(state, {
      type: 'RECORD_POST_GAME',
      payload: basePayload({ goldDelta: 20, transactionDescription: 'Sold wyrdstone' }),
    });
    const log = next.warbands[0].transactionLog;
    expect(log).toHaveLength(1);
    expect(log[0].description).toBe('Sold wyrdstone');
    expect(log[0].amount).toBe(20);
  });

  it('does NOT append TransactionEntry when description is empty', () => {
    const state = makeState(makeWarband({ goldCrowns: 100, transactionLog: [] }));
    const next = warbandReducer(state, {
      type: 'RECORD_POST_GAME',
      payload: basePayload({ goldDelta: 20, transactionDescription: '' }),
    });
    expect(next.warbands[0].transactionLog).toHaveLength(0);
  });
});

describe('warbandReducer — DUPLICATE_HERO', () => {
  it('creates a new hero with the given newId', () => {
    const state = makeState(makeWarband());
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HERO',
      payload: { warbandId: 'w-1', heroId: 'h-1', newId: 'h-copy' },
    });
    expect(next.warbands[0].heroes).toHaveLength(2);
    expect(next.warbands[0].heroes[1].id).toBe('h-copy');
  });

  it('sets name to "{original} (copy)"', () => {
    const state = makeState(makeWarband({ heroes: [makeHero({ name: 'Geralt' })] }));
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HERO',
      payload: { warbandId: 'w-1', heroId: 'h-1', newId: 'h-copy' },
    });
    expect(next.warbands[0].heroes[1].name).toBe('Geralt (copy)');
  });

  it('resets ooa to 0 on the copy', () => {
    const state = makeState(makeWarband({ heroes: [makeHero({ ooa: 5 })] }));
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HERO',
      payload: { warbandId: 'w-1', heroId: 'h-1', newId: 'h-copy' },
    });
    expect(next.warbands[0].heroes[1].ooa).toBe(0);
  });

  it('leaves the original hero unchanged', () => {
    const original = makeHero({ name: 'Geralt', ooa: 3, xp: 12 });
    const state = makeState(makeWarband({ heroes: [original] }));
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HERO',
      payload: { warbandId: 'w-1', heroId: 'h-1', newId: 'h-copy' },
    });
    const orig = next.warbands[0].heroes[0];
    expect(orig.id).toBe('h-1');
    expect(orig.name).toBe('Geralt');
    expect(orig.ooa).toBe(3);
    expect(orig.xp).toBe(12);
  });

  it('deep-clones so editing the copy does not affect the original', () => {
    const state = makeState(makeWarband({ heroes: [makeHero({ skills: ['Sprint'] })] }));
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HERO',
      payload: { warbandId: 'w-1', heroId: 'h-1', newId: 'h-copy' },
    });
    next.warbands[0].heroes[1].skills.push('Dodge');
    expect(next.warbands[0].heroes[0].skills).toEqual(['Sprint']);
  });
});

describe('warbandReducer — DUPLICATE_HENCHMAN_GROUP', () => {
  it('creates a new group with the given newGroupId', () => {
    const state = makeState(makeWarband());
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HENCHMAN_GROUP',
      payload: { warbandId: 'w-1', groupId: 'g-1', newGroupId: 'g-copy' },
    });
    expect(next.warbands[0].henchmanGroups).toHaveLength(2);
    expect(next.warbands[0].henchmanGroups[1].id).toBe('g-copy');
  });

  it('sets name to "{original} (copy)"', () => {
    const state = makeState(makeWarband({ henchmanGroups: [makeGroup({ name: 'Swordsmen' })] }));
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HENCHMAN_GROUP',
      payload: { warbandId: 'w-1', groupId: 'g-1', newGroupId: 'g-copy' },
    });
    expect(next.warbands[0].henchmanGroups[1].name).toBe('Swordsmen (copy)');
  });

  it('gives each copied model a new id', () => {
    const model1 = makeModel({ id: 'm-1' });
    const model2 = makeModel({ id: 'm-2' });
    const state = makeState(makeWarband({ henchmanGroups: [makeGroup({ models: [model1, model2] })] }));
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HENCHMAN_GROUP',
      payload: { warbandId: 'w-1', groupId: 'g-1', newGroupId: 'g-copy' },
    });
    const copiedModels = next.warbands[0].henchmanGroups[1].models;
    expect(copiedModels[0].id).not.toBe('m-1');
    expect(copiedModels[1].id).not.toBe('m-2');
    expect(copiedModels[0].id).not.toBe(copiedModels[1].id);
  });

  it('resets ooa to 0 on all copied models', () => {
    const state = makeState(makeWarband({
      henchmanGroups: [makeGroup({ models: [makeModel({ ooa: 3 }), makeModel({ id: 'm-2', ooa: 7 })] })],
    }));
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HENCHMAN_GROUP',
      payload: { warbandId: 'w-1', groupId: 'g-1', newGroupId: 'g-copy' },
    });
    const copiedModels = next.warbands[0].henchmanGroups[1].models;
    expect(copiedModels[0].ooa).toBe(0);
    expect(copiedModels[1].ooa).toBe(0);
  });

  it('leaves the original group unchanged', () => {
    const state = makeState(makeWarband({
      henchmanGroups: [makeGroup({ name: 'Swordsmen', models: [makeModel({ ooa: 2 })] })],
    }));
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HENCHMAN_GROUP',
      payload: { warbandId: 'w-1', groupId: 'g-1', newGroupId: 'g-copy' },
    });
    const orig = next.warbands[0].henchmanGroups[0];
    expect(orig.id).toBe('g-1');
    expect(orig.name).toBe('Swordsmen');
    expect(orig.models[0].ooa).toBe(2);
  });
});

describe('warbandReducer — MERGE_WARBANDS', () => {
  it('appends non-colliding warbands to existing list', () => {
    const state = makeState(makeWarband({ id: 'w-1' }));
    const incoming = makeWarband({ id: 'w-new' });
    const next = warbandReducer(state, {
      type: 'MERGE_WARBANDS',
      payload: { warbands: [incoming] },
    });
    expect(next.warbands).toHaveLength(2);
    expect(next.warbands[1].id).toBe('w-new');
  });

  it('re-UUIDs an incoming warband whose id collides with an existing one', () => {
    const state = makeState(makeWarband({ id: 'w-1' }));
    const colliding = makeWarband({ id: 'w-1', name: 'Collider' });
    const next = warbandReducer(state, {
      type: 'MERGE_WARBANDS',
      payload: { warbands: [colliding] },
    });
    expect(next.warbands).toHaveLength(2);
    expect(next.warbands[1].id).not.toBe('w-1');
    expect(next.warbands[1].name).toBe('Collider');
  });

  it('preserves the existing warband unchanged on collision', () => {
    const existing = makeWarband({ id: 'w-1', name: 'Original' });
    const state = makeState(existing);
    const next = warbandReducer(state, {
      type: 'MERGE_WARBANDS',
      payload: { warbands: [makeWarband({ id: 'w-1', name: 'Collider' })] },
    });
    expect(next.warbands[0].id).toBe('w-1');
    expect(next.warbands[0].name).toBe('Original');
  });

  it('leaves state unchanged when payload warbands is empty', () => {
    const state = makeState(makeWarband());
    const next = warbandReducer(state, {
      type: 'MERGE_WARBANDS',
      payload: { warbands: [] },
    });
    expect(next.warbands).toHaveLength(1);
  });
});

// ── Treasury gold integrity ───────────────────────────────────────────────────

describe('warbandReducer — DELETE_HERO gold refund', () => {
  it('refunds recruitmentCost + equipment costs on delete', () => {
    const hero = makeHero({
      recruitmentCost: 15,
      equipment: [
        { id: 'e-1', name: 'Sword', cost: 10, source: 'custom' },
      ],
    });
    const state = makeState(makeWarband({ heroes: [hero], goldCrowns: 50 }));
    const next = warbandReducer(state, {
      type: 'DELETE_HERO',
      payload: { warbandId: 'w-1', heroId: 'h-1' },
    });
    expect(next.warbands[0].goldCrowns).toBe(75);
    expect(next.warbands[0].heroes).toHaveLength(0);
  });

  it('does not change gold when hero has null recruitmentCost and no equipment', () => {
    const state = makeState(makeWarband({ heroes: [makeHero()], goldCrowns: 50 }));
    const next = warbandReducer(state, {
      type: 'DELETE_HERO',
      payload: { warbandId: 'w-1', heroId: 'h-1' },
    });
    expect(next.warbands[0].goldCrowns).toBe(50);
  });

  it('treats null item costs as 0 when computing the refund', () => {
    const hero = makeHero({
      recruitmentCost: 10,
      equipment: [{ id: 'e-1', name: 'Token', cost: null, source: 'custom' }],
    });
    const state = makeState(makeWarband({ heroes: [hero], goldCrowns: 40 }));
    const next = warbandReducer(state, {
      type: 'DELETE_HERO',
      payload: { warbandId: 'w-1', heroId: 'h-1' },
    });
    expect(next.warbands[0].goldCrowns).toBe(50);
  });
});

describe('warbandReducer — DELETE_HENCHMAN_GROUP gold refund', () => {
  it('refunds recruitmentCost + equipment costs on delete', () => {
    const group = makeGroup({
      recruitmentCost: 25,
      equipment: [{ id: 'e-1', name: 'Spear', cost: 5, source: 'custom' }],
    });
    const state = makeState(makeWarband({ henchmanGroups: [group], goldCrowns: 30 }));
    const next = warbandReducer(state, {
      type: 'DELETE_HENCHMAN_GROUP',
      payload: { warbandId: 'w-1', groupId: 'g-1' },
    });
    expect(next.warbands[0].goldCrowns).toBe(60);
    expect(next.warbands[0].henchmanGroups).toHaveLength(0);
  });

  it('does not change gold when group has null recruitmentCost and no equipment', () => {
    const state = makeState(makeWarband({ henchmanGroups: [makeGroup()], goldCrowns: 80 }));
    const next = warbandReducer(state, {
      type: 'DELETE_HENCHMAN_GROUP',
      payload: { warbandId: 'w-1', groupId: 'g-1' },
    });
    expect(next.warbands[0].goldCrowns).toBe(80);
  });
});

describe('warbandReducer — DUPLICATE_HERO gold deduction', () => {
  it('deducts recruitmentCost + equipment costs on duplicate', () => {
    const hero = makeHero({
      recruitmentCost: 15,
      equipment: [{ id: 'e-1', name: 'Sword', cost: 10, source: 'custom' }],
    });
    const state = makeState(makeWarband({ heroes: [hero], goldCrowns: 100 }));
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HERO',
      payload: { warbandId: 'w-1', heroId: 'h-1', newId: 'h-copy' },
    });
    expect(next.warbands[0].goldCrowns).toBe(75);
  });

  it('does not change gold when hero has null recruitmentCost and no equipment', () => {
    const state = makeState(makeWarband({ heroes: [makeHero()], goldCrowns: 100 }));
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HERO',
      payload: { warbandId: 'w-1', heroId: 'h-1', newId: 'h-copy' },
    });
    expect(next.warbands[0].goldCrowns).toBe(100);
  });
});

describe('warbandReducer — DUPLICATE_HENCHMAN_GROUP gold deduction', () => {
  it('deducts recruitmentCost + equipment costs on duplicate', () => {
    const group = makeGroup({
      recruitmentCost: 20,
      equipment: [{ id: 'e-1', name: 'Shield', cost: 5, source: 'custom' }],
    });
    const state = makeState(makeWarband({ henchmanGroups: [group], goldCrowns: 80 }));
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HENCHMAN_GROUP',
      payload: { warbandId: 'w-1', groupId: 'g-1', newGroupId: 'g-copy' },
    });
    expect(next.warbands[0].goldCrowns).toBe(55);
  });

  it('does not change gold when group has null recruitmentCost and no equipment', () => {
    const state = makeState(makeWarband({ henchmanGroups: [makeGroup()], goldCrowns: 80 }));
    const next = warbandReducer(state, {
      type: 'DUPLICATE_HENCHMAN_GROUP',
      payload: { warbandId: 'w-1', groupId: 'g-1', newGroupId: 'g-copy' },
    });
    expect(next.warbands[0].goldCrowns).toBe(80);
  });
});

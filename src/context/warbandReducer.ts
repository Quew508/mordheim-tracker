import type { AppData } from '../types/storage';
import type { Warband, Hero, HenchmanGroup, IndividualModel } from '../types/warband';

// ---------------------------------------------------------------------------
// Action union type — extended in each Epic story as new actions are needed
// ---------------------------------------------------------------------------
export type WarbandAction =
  | { type: 'ADD_WARBAND'; payload: Warband }
  | { type: 'UPDATE_WARBAND'; payload: Warband }
  | { type: 'DELETE_WARBAND'; payload: { id: string } }
  | { type: 'ADD_HERO'; payload: { warbandId: string; hero: Hero } }
  | { type: 'UPDATE_HERO'; payload: { warbandId: string; hero: Hero } }
  | { type: 'DELETE_HERO'; payload: { warbandId: string; heroId: string } }
  | { type: 'ADD_HENCHMAN_GROUP'; payload: { warbandId: string; group: HenchmanGroup } }
  | { type: 'UPDATE_HENCHMAN_GROUP'; payload: { warbandId: string; group: HenchmanGroup } }
  | { type: 'DELETE_HENCHMAN_GROUP'; payload: { warbandId: string; groupId: string } }
  | { type: 'ADD_INDIVIDUAL_MODEL'; payload: { warbandId: string; groupId: string; model: IndividualModel } }
  | { type: 'UPDATE_INDIVIDUAL_MODEL'; payload: { warbandId: string; groupId: string; model: IndividualModel } }
  | { type: 'REMOVE_INDIVIDUAL_MODEL'; payload: { warbandId: string; groupId: string; modelId: string } }
  | { type: 'INCREMENT_OOA'; payload: { warbandId: string; delta: 1 | -1 } & ({ heroId: string } | { groupId: string; modelId: string }) }
  | { type: 'CLEAR_OOA'; payload: { warbandId: string } & ({ heroId: string } | { groupId: string; modelId: string }) }
  | { type: 'RECORD_POST_GAME'; payload: {
      warbandId: string;
      heroes: { heroId: string; xpDelta: number; injuryEntry: string | null; skillEntry: string | null }[];
      groups: { groupId: string; xpDelta: number; injuryEntry: string | null; advancementNote: string | null }[];
      goldDelta: number;
      wyrdstoneDelta: number;
      transactionDescription: string;
    }}
  | { type: 'DUPLICATE_HERO'; payload: { warbandId: string; heroId: string; newId: string } }
  | { type: 'DUPLICATE_HENCHMAN_GROUP'; payload: { warbandId: string; groupId: string; newGroupId: string } }
  | { type: 'MERGE_WARBANDS'; payload: { warbands: Warband[] } };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
export function warbandReducer(state: AppData, action: WarbandAction): AppData {
  switch (action.type) {
    case 'ADD_WARBAND':
      return { ...state, warbands: [...state.warbands, action.payload] };

    case 'UPDATE_WARBAND':
      return {
        ...state,
        warbands: state.warbands.map((w) =>
          w.id === action.payload.id ? action.payload : w
        ),
      };

    case 'DELETE_WARBAND':
      return {
        ...state,
        warbands: state.warbands.filter((w) => w.id !== action.payload.id),
      };

    case 'ADD_HERO':
      return {
        ...state,
        warbands: state.warbands.map((w) =>
          w.id === action.payload.warbandId
            ? { ...w, heroes: [...w.heroes, structuredClone(action.payload.hero)] }
            : w
        ),
      };

    case 'UPDATE_HERO':
      return {
        ...state,
        warbands: state.warbands.map((w) =>
          w.id === action.payload.warbandId
            ? {
                ...w,
                heroes: w.heroes.map((h) =>
                  h.id === action.payload.hero.id ? structuredClone(action.payload.hero) : h
                ),
              }
            : w
        ),
      };

    case 'DELETE_HERO': {
      const { warbandId: delHeroWarbandId, heroId: delHeroId } = action.payload;
      return {
        ...state,
        warbands: state.warbands.map((w) => {
          if (w.id !== delHeroWarbandId) return w;
          const hero = w.heroes.find((h) => h.id === delHeroId);
          const refund = hero
            ? (hero.recruitmentCost ?? 0) + hero.equipment.reduce((s, i) => s + (i.cost ?? 0), 0)
            : 0;
          return {
            ...w,
            heroes: w.heroes.filter((h) => h.id !== delHeroId),
            goldCrowns: w.goldCrowns + refund,
          };
        }),
      };
    }

    case 'ADD_HENCHMAN_GROUP':
      return {
        ...state,
        warbands: state.warbands.map((w) =>
          w.id === action.payload.warbandId
            ? { ...w, henchmanGroups: [...w.henchmanGroups, structuredClone(action.payload.group)] }
            : w
        ),
      };

    case 'UPDATE_HENCHMAN_GROUP':
      return {
        ...state,
        warbands: state.warbands.map((w) =>
          w.id === action.payload.warbandId
            ? {
                ...w,
                henchmanGroups: w.henchmanGroups.map((g) =>
                  g.id === action.payload.group.id ? structuredClone(action.payload.group) : g
                ),
              }
            : w
        ),
      };

    case 'DELETE_HENCHMAN_GROUP': {
      const { warbandId: delGroupWarbandId, groupId: delGroupId } = action.payload;
      return {
        ...state,
        warbands: state.warbands.map((w) => {
          if (w.id !== delGroupWarbandId) return w;
          const group = w.henchmanGroups.find((g) => g.id === delGroupId);
          const refund = group
            ? ((group.recruitmentCost ?? 0) + group.equipment.reduce((s, i) => s + (i.cost ?? 0), 0)) * group.models.length
            : 0;
          return {
            ...w,
            henchmanGroups: w.henchmanGroups.filter((g) => g.id !== delGroupId),
            goldCrowns: w.goldCrowns + refund,
          };
        }),
      };
    }

    case 'ADD_INDIVIDUAL_MODEL':
      return {
        ...state,
        warbands: state.warbands.map((w) =>
          w.id === action.payload.warbandId
            ? {
                ...w,
                henchmanGroups: w.henchmanGroups.map((g) =>
                  g.id === action.payload.groupId
                    ? { ...g, models: [...g.models, structuredClone(action.payload.model)] }
                    : g
                ),
              }
            : w
        ),
      };

    case 'UPDATE_INDIVIDUAL_MODEL':
      return {
        ...state,
        warbands: state.warbands.map((w) =>
          w.id === action.payload.warbandId
            ? {
                ...w,
                henchmanGroups: w.henchmanGroups.map((g) =>
                  g.id === action.payload.groupId
                    ? {
                        ...g,
                        models: g.models.map((m) =>
                          m.id === action.payload.model.id ? structuredClone(action.payload.model) : m
                        ),
                      }
                    : g
                ),
              }
            : w
        ),
      };

    case 'REMOVE_INDIVIDUAL_MODEL':
      return {
        ...state,
        warbands: state.warbands.map((w) =>
          w.id === action.payload.warbandId
            ? {
                ...w,
                henchmanGroups: w.henchmanGroups.map((g) =>
                  g.id === action.payload.groupId
                    ? { ...g, models: g.models.filter((m) => m.id !== action.payload.modelId) }
                    : g
                ),
              }
            : w
        ),
      };

    case 'INCREMENT_OOA': {
      const { warbandId, delta } = action.payload;
      if ('heroId' in action.payload) {
        const { heroId } = action.payload;
        return {
          ...state,
          warbands: state.warbands.map((w) =>
            w.id === warbandId
              ? { ...w, heroes: w.heroes.map((h) => h.id === heroId ? { ...h, ooa: Math.max(0, (h.ooa ?? 0) + delta) } : h) }
              : w
          ),
        };
      } else {
        const { groupId, modelId } = action.payload;
        return {
          ...state,
          warbands: state.warbands.map((w) =>
            w.id === warbandId
              ? {
                  ...w,
                  henchmanGroups: w.henchmanGroups.map((g) =>
                    g.id === groupId
                      ? { ...g, models: g.models.map((m) => m.id === modelId ? { ...m, ooa: Math.max(0, (m.ooa ?? 0) + delta) } : m) }
                      : g
                  ),
                }
              : w
          ),
        };
      }
    }

    case 'CLEAR_OOA': {
      const { warbandId } = action.payload;
      if ('heroId' in action.payload) {
        const { heroId } = action.payload;
        return {
          ...state,
          warbands: state.warbands.map((w) =>
            w.id === warbandId
              ? { ...w, heroes: w.heroes.map((h) => h.id === heroId ? { ...h, ooa: 0 } : h) }
              : w
          ),
        };
      } else {
        const { groupId, modelId } = action.payload;
        return {
          ...state,
          warbands: state.warbands.map((w) =>
            w.id === warbandId
              ? {
                  ...w,
                  henchmanGroups: w.henchmanGroups.map((g) =>
                    g.id === groupId
                      ? { ...g, models: g.models.map((m) => m.id === modelId ? { ...m, ooa: 0 } : m) }
                      : g
                  ),
                }
              : w
          ),
        };
      }
    }

    case 'RECORD_POST_GAME': {
      const {
        warbandId,
        heroes: heroEntries,
        groups: groupEntries,
        goldDelta,
        wyrdstoneDelta,
        transactionDescription,
      } = action.payload;

      return {
        ...state,
        warbands: state.warbands.map((w) => {
          if (w.id !== warbandId) return w;

          const heroMap = new Map(heroEntries.map((e) => [e.heroId, e]));
          const groupMap = new Map(groupEntries.map((e) => [e.groupId, e]));

          const newHeroes = w.heroes.map((h) => {
            const entry = heroMap.get(h.id);
            if (!entry) return { ...h, ooa: 0 };
            return {
              ...h,
              ooa: 0,
              xp: Math.max(0, h.xp + entry.xpDelta),
              injuryLog: entry.injuryEntry != null ? [...h.injuryLog, entry.injuryEntry] : h.injuryLog,
              skills: entry.skillEntry != null ? [...h.skills, entry.skillEntry] : h.skills,
            };
          });

          const newGroups = w.henchmanGroups.map((g) => {
            const entry = groupMap.get(g.id);
            const newModels = g.models.map((m) => ({ ...m, ooa: 0 }));
            if (!entry) return { ...g, models: newModels };
            return {
              ...g,
              xp: g.xp + entry.xpDelta,
              injuryLog: entry.injuryEntry != null ? [...g.injuryLog, entry.injuryEntry] : g.injuryLog,
              advancementNotes: entry.advancementNote != null ? [...g.advancementNotes, entry.advancementNote] : g.advancementNotes,
              models: newModels,
            };
          });

          const newGold = Math.max(0, w.goldCrowns + goldDelta);
          const newWyrdstone = Math.max(0, w.wyrdstoneFragments + wyrdstoneDelta);
          const appendTransaction =
            goldDelta !== 0 && transactionDescription.trim() !== '';
          const newTransactionLog = appendTransaction
            ? [
                ...(w.transactionLog ?? []),
                { id: crypto.randomUUID(), description: transactionDescription, amount: goldDelta },
              ]
            : (w.transactionLog ?? []);

          return {
            ...w,
            heroes: newHeroes,
            henchmanGroups: newGroups,
            goldCrowns: newGold,
            wyrdstoneFragments: newWyrdstone,
            transactionLog: newTransactionLog,
          };
        }),
      };
    }

    case 'DUPLICATE_HERO': {
      const { warbandId, heroId, newId } = action.payload;
      return {
        ...state,
        warbands: state.warbands.map((w) => {
          if (w.id !== warbandId) return w;
          const src = w.heroes.find((h) => h.id === heroId);
          if (!src) return w;
          const copy = structuredClone(src);
          copy.id = newId;
          copy.name = `${src.name} (copy)`;
          copy.ooa = 0;
          const cost = (src.recruitmentCost ?? 0) + src.equipment.reduce((s, i) => s + (i.cost ?? 0), 0);
          return { ...w, heroes: [...w.heroes, copy], goldCrowns: w.goldCrowns - cost };
        }),
      };
    }

    case 'DUPLICATE_HENCHMAN_GROUP': {
      const { warbandId, groupId, newGroupId } = action.payload;
      return {
        ...state,
        warbands: state.warbands.map((w) => {
          if (w.id !== warbandId) return w;
          const src = w.henchmanGroups.find((g) => g.id === groupId);
          if (!src) return w;
          const copy = structuredClone(src);
          copy.id = newGroupId;
          copy.name = `${src.name} (copy)`;
          copy.models = copy.models.map((m) => ({ ...m, id: crypto.randomUUID(), ooa: 0 }));
          const cost = ((src.recruitmentCost ?? 0) + src.equipment.reduce((s, i) => s + (i.cost ?? 0), 0)) * src.models.length;
          return { ...w, henchmanGroups: [...w.henchmanGroups, copy], goldCrowns: w.goldCrowns - cost };
        }),
      };
    }

    case 'MERGE_WARBANDS': {
      const existingIds = new Set(state.warbands.map((w) => w.id));
      const incoming = action.payload.warbands.map((w) =>
        existingIds.has(w.id) ? { ...w, id: crypto.randomUUID() } : w
      );
      return { ...state, warbands: [...state.warbands, ...incoming] };
    }

    default:
      return state;
  }
}

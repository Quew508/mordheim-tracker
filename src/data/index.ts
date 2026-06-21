import type { FactionTemplate, EquipmentCatalogueItem } from '../types/reference';

import witchHunters from './witch-hunters.json';
import sistersOfSigmar from './sisters-of-sigmar.json';
import undead from './undead.json';
import cultOfThePossessed from './cult-of-the-possessed.json';
import beastmenRaiders from './beastmen-raiders.json';
import kislevites from './kislevites.json';
import bretonnians from './bretonnians.json';
import carnivalOfChaos from './carnival-of-chaos.json';
import restlessDead from './restless-dead.json';
import darkElves from './dark-elves.json';
import skavenClanPestilence from './skaven-clan-pestilence.json';
import ogres from './ogres.json';
import tombKings from './tomb-guardians.json';
import nightGoblins from './night-goblins.json';
import blackOrcs from './black-orcs.json';
import gunnerySchoolOfNuln from './gunnery-school-of-nuln.json';
import lizardmen from './lizardmen.json';
import commonEquipmentData from './common-equipment.json';

export const factions: FactionTemplate[] = [
  witchHunters as FactionTemplate,
  sistersOfSigmar as FactionTemplate,
  undead as FactionTemplate,
  cultOfThePossessed as FactionTemplate,
  beastmenRaiders as FactionTemplate,
  kislevites as FactionTemplate,
  bretonnians as FactionTemplate,
  carnivalOfChaos as FactionTemplate,
  restlessDead as FactionTemplate,
  darkElves as FactionTemplate,
  skavenClanPestilence as FactionTemplate,
  ogres as FactionTemplate,
  tombKings as FactionTemplate,
  nightGoblins as FactionTemplate,
  blackOrcs as FactionTemplate,
  gunnerySchoolOfNuln as FactionTemplate,
  lizardmen as FactionTemplate,
];

export const commonEquipment: EquipmentCatalogueItem[] = commonEquipmentData as EquipmentCatalogueItem[];


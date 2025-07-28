export {
  createCharacter,
  createSoldier,
  updateCharacterHp,
  updateSoldierHp,
  isCharacterAlive,
  isSoldierAlive,
  healCharacter,
  healSoldier,
  isCharacterOrSoldiersAlive
} from './character';

export {
  canUseItem,
  useHealingPotion,
  initializePlayerItems
} from './items';

export {
  calculateDamage,
  applyDamage
} from './damageCalculation';

export {
  initializeBattle,
  startPreparationPhase,
  startBattlePhase,
  startResolutionPhase,
  nextRound,
  selectItem,
  executePendingItemUse,
  enterBattle,
  attack,
  processEnemyTurn,
  resetBattle,
  toggleFormation
} from './battleLogic';

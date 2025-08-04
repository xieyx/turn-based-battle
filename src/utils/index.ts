export {
  createCharacter,
  createSoldier,
  createDefaultBattleFormation,
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
  applyDamage,
  calculateBattleDamages
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
  resetBattle,
  updateBattleFormation,
  autoExecuteBattlePhase,
  autoProceedToNextRound
} from './battleLogic';

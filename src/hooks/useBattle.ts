import { useGame } from '../context/GameContext';
import type { BattleFormation } from '../types/character';

/**
 * 战斗相关的Hook
 * 提供战斗状态和操作方法
 */
export const useBattle = () => {
  const {
    state,
    startPreparationPhase,
    startBattlePhase,
    startResolutionPhase,
    nextRound,
    useItem: selectItem,
    enterBattle,
    attack,
    processEnemyTurn,
    resetBattle,
    decreasePreparationTimer,
    markPreparationActionTaken,
    autoExecuteBattlePhase,
    autoProceedToNextRound,
    updateBattleFormation
  } = useGame();

  return {
    // 战斗状态
    battleState: state,

    // 阶段控制方法
    startPreparationPhase,
    startBattlePhase,
    startResolutionPhase,
    nextRound,

    // 玩家行动方法
    selectItem,
    enterBattle,
    attack,

    // 敌人行动方法
    processEnemyTurn,

    // 重置战斗
    resetBattle,

    // 计时器相关方法
    decreasePreparationTimer,
    markPreparationActionTaken,

    // 自动执行方法
    autoExecuteBattlePhase,
    autoProceedToNextRound,

    // 作战梯队相关方法
    updateBattleFormation
  };
};

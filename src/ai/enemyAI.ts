import type { BattleState, BattleAction } from '../types/battle';
import { GameError, GameErrorType } from '../types/game';
import { isCharacterAlive, isSoldierAlive } from '../utils/character';

/**
 * 处理敌人回合
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function processEnemyTurn(state: BattleState): BattleState {
  if (state.currentPhase !== 'preparation' && state.currentPhase !== 'battle') {
    throw new GameError(
      GameErrorType.INVALID_PHASE,
      '敌人只能在准备阶段或战斗阶段行动'
    );
  }

  if (state.isGameOver) {
    throw new GameError(
      GameErrorType.BATTLE_ALREADY_ENDED,
      '战斗已经结束'
    );
  }

  if (!isCharacterAlive(state.enemy)) {
    throw new GameError(
      GameErrorType.CHARACTER_DEAD,
      '敌人已死亡'
    );
  }

  let newState = { ...state };
  let newLog = [...state.battleLog];

  // 敌人在准备阶段自动选择进入战斗
  if (state.currentPhase === 'preparation') {
    newLog = [
      ...newLog,
      {
        phase: 'preparation',
        message: '敌人选择进入战斗',
        round: state.currentRound
      }
    ];
  }

  return {
    ...newState,
    battleLog: newLog
  };
}

/**
 * 执行敌人自动攻击逻辑
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function executeEnemyAttack(state: BattleState): BattleState {
  let newState = { ...state };
  let newLog = [...state.battleLog];

  // 敌人自动攻击玩家
  const enemyPendingActions: BattleAction[] = [
    ...newState.pendingActions,
    {
      attackerId: state.enemy.id,
      targetId: state.player.id
    }
  ];

  newState.pendingActions = enemyPendingActions;
  newLog = [
    ...newLog,
    {
      phase: 'battle',
      message: `敌人自动攻击玩家`,
      round: state.currentRound
    }
  ];

  // 检查敌人是否有存活的士兵，如果有则士兵也攻击
  if (state.enemy.soldiers && state.enemy.soldiers.length > 0) {
    const aliveSoldiers = state.enemy.soldiers.filter(soldier => isSoldierAlive(soldier));
    if (aliveSoldiers.length > 0) {
      // 敌人士兵攻击
      const firstSoldier = aliveSoldiers[0];
      newLog = [
        ...newLog,
        {
          phase: 'battle',
          message: `敌人的 ${firstSoldier.name} 发动攻击`,
          round: state.currentRound
        }
      ];

      // 添加士兵攻击到待处理行动中
      const soldierPendingActions: BattleAction[] = [
        ...newState.pendingActions,
        {
          attackerId: firstSoldier.id,
          targetId: state.player.id
        }
      ];

      newState.pendingActions = soldierPendingActions;
    }
  }

  return {
    ...newState,
    battleLog: newLog
  };
}

import type { BattleState, BattlePhase, BattleAction } from '../types/battle';
import type { Character, Soldier } from '../types/character';
import type { Item } from '../types/item';
import { GameError, GameErrorType } from '../types/game';
import { calculateDamage, calculateSoldierDamage, applyDamage, applySoldierDamage } from './damageCalculation';
import { useHealingPotion, canUseItem } from './items';
import { isCharacterAlive, isSoldierAlive, updateCharacterHp, updateSoldierHp, isCharacterOrSoldiersAlive } from './character';

/**
 * 初始化战斗
 * @param player 玩家角色
 * @param enemy 敌人角色
 * @param playerItems 玩家道具
 * @returns 初始战斗状态
 */
export function initializeBattle(
  player: Character,
  enemy: Character,
  playerItems: Item[]
): BattleState {
  return {
    currentRound: 1,
    currentPhase: 'preparation',
    player,
    enemy,
    playerItems,
    battleLog: [],
    pendingActions: [],
    isGameOver: false,
    preparationTimer: 30, // 30秒倒计时
    preparationActionTaken: false
  };
}

/**
 * 开始准备阶段
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function startPreparationPhase(state: BattleState): BattleState {
  if (state.isGameOver) {
    throw new GameError(
      GameErrorType.BATTLE_ALREADY_ENDED,
      '战斗已经结束'
    );
  }

  return {
    ...state,
    currentPhase: 'preparation',
    preparationTimer: 30, // 重置计时器
    preparationActionTaken: false, // 重置行动标记
    battleLog: [
      ...state.battleLog,
      {
        phase: 'preparation',
        message: `第 ${state.currentRound} 回合 - 准备阶段`,
        round: state.currentRound
      }
    ]
  };
}

/**
 * 开始战斗阶段
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function startBattlePhase(state: BattleState): BattleState {
  if (state.currentPhase !== 'preparation') {
    throw new GameError(
      GameErrorType.INVALID_PHASE,
      '只能在准备阶段后进入战斗阶段'
    );
  }

  return {
    ...state,
    currentPhase: 'battle',
    battleLog: [
      ...state.battleLog,
      {
        phase: 'battle',
        message: `第 ${state.currentRound} 回合 - 战斗阶段`,
        round: state.currentRound
      }
    ]
  };
}

/**
 * 开始结算阶段
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function startResolutionPhase(state: BattleState): BattleState {
  if (state.currentPhase !== 'battle') {
    throw new GameError(
      GameErrorType.INVALID_PHASE,
      '只能在战斗阶段后进入结算阶段'
    );
  }

  // 应用所有待处理的行动
  let newState = { ...state };
  let newLog = [...state.battleLog];

  for (const action of state.pendingActions) {
    const attacker =
      action.attackerId === state.player.id ? state.player : state.enemy;
    const defender =
      action.targetId === state.player.id ? state.player : state.enemy;

    if (isCharacterAlive(attacker)) {
      // 检查防御者是否有士兵在前
      const defenderHasSoldiersFirst =
        (defender.id === state.player.id && defender.formation === 'soldiers-first' && defender.soldiers && defender.soldiers.length > 0) ||
        (defender.id === state.enemy.id && defender.formation === 'soldiers-first' && defender.soldiers && defender.soldiers.length > 0);

      // 检查是否还有存活的士兵
      let hasAliveSoldiers = false;
      if (defenderHasSoldiersFirst) {
        const defenderSoldiers = defender.id === state.player.id ? newState.player.soldiers : newState.enemy.soldiers;
        if (defenderSoldiers && defenderSoldiers.length > 0) {
          hasAliveSoldiers = defenderSoldiers.some(soldier => isSoldierAlive(soldier));
        }
      }

      if (defenderHasSoldiersFirst && hasAliveSoldiers) {
        // 如果防御者有士兵在前且还有存活的士兵，攻击士兵
        const defenderSoldiers = defender.id === state.player.id ? newState.player.soldiers : newState.enemy.soldiers;
        if (defenderSoldiers && defenderSoldiers.length > 0) {
          // 找到第一个存活的士兵
          const soldier = defenderSoldiers.find(s => isSoldierAlive(s));
          if (soldier) {
            const damage = calculateSoldierDamage(attacker, soldier);
            const updatedSoldier = applySoldierDamage(soldier, damage);

            // 计算实际减少的士兵数量
            const soldiersLost = soldier.quantity - updatedSoldier.quantity;

            // 更新士兵状态
            if (defender.id === newState.player.id) {
              if (newState.player.soldiers) {
                const soldierIndex = newState.player.soldiers.findIndex(s => s.id === soldier.id);
                if (soldierIndex !== -1) {
                  newState.player.soldiers[soldierIndex] = updatedSoldier;
                }
              }
            } else {
              if (newState.enemy.soldiers) {
                const soldierIndex = newState.enemy.soldiers.findIndex(s => s.id === soldier.id);
                if (soldierIndex !== -1) {
                  newState.enemy.soldiers[soldierIndex] = updatedSoldier;
                }
              }
            }

            // 记录士兵承受的伤害
            if (soldiersLost > 0) {
              newLog = [
                ...newLog,
                {
                  phase: 'resolution',
                  message: `${attacker.name} 对 ${defender.name} 的 ${soldier.name} 造成了 ${damage} 点伤害，损失了 ${soldiersLost} 名士兵`,
                  round: state.currentRound
                }
              ];
            } else {
              newLog = [
                ...newLog,
                {
                  phase: 'resolution',
                  message: `${attacker.name} 对 ${defender.name} 的 ${soldier.name} 造成了 ${damage} 点伤害`,
                  round: state.currentRound
                }
              ];
            }

            // 如果士兵死亡，穿透伤害到角色本身
            if (updatedSoldier.currentHp <= 0 && updatedSoldier.quantity <= 0) {
              // 计算穿透到角色的伤害
              // 穿透伤害 = 原始伤害 - 士兵当前生命值（这是士兵死亡前能吸收的伤害）
              const damageAbsorbedBySoldier = soldier.currentHp; // 士兵死亡前的生命值就是它能吸收的伤害
              const remainingDamage = damage - damageAbsorbedBySoldier;
              if (remainingDamage > 0 && isCharacterAlive(defender)) {
                const updatedDefender = applyDamage(defender, remainingDamage);

                // 更新角色状态
                if (updatedDefender.id === newState.player.id) {
                  newState.player = updatedDefender;
                } else {
                  newState.enemy = updatedDefender;
                }

                newLog = [
                  ...newLog,
                  {
                    phase: 'resolution',
                    message: `${attacker.name} 的攻击穿透了 ${soldier.name}，对 ${defender.name} 造成了 ${remainingDamage} 点伤害`,
                    round: state.currentRound
                  }
                ];
              }
            }
          }
        }
      } else if (isCharacterAlive(defender)) {
        // 如果没有士兵在前或者士兵都已死亡，攻击角色本身
        const damage = calculateDamage(attacker, defender);
        const updatedDefender = applyDamage(defender, damage);

        // 更新角色状态
        if (updatedDefender.id === newState.player.id) {
          newState.player = updatedDefender;
        } else {
          newState.enemy = updatedDefender;
        }

        newLog = [
          ...newLog,
          {
            phase: 'resolution',
            message: `${attacker.name} 对 ${defender.name} 造成了 ${damage} 点伤害`,
            round: state.currentRound
          }
        ];
      }
    }
  }

  // 检查战斗是否结束
  const isPlayerAlive = isCharacterOrSoldiersAlive(newState.player);
  const isEnemyAlive = isCharacterOrSoldiersAlive(newState.enemy);

  let isGameOver = false;
  let winner: 'player' | 'enemy' | undefined;

  if (!isPlayerAlive || !isEnemyAlive) {
    isGameOver = true;
    winner = isPlayerAlive ? 'player' : 'enemy';
    newLog = [
      ...newLog,
      {
        phase: 'resolution',
        message: `战斗结束！${winner === 'player' ? '玩家' : '敌人'} 获胜！`,
        round: state.currentRound
      }
    ];
  }

  return {
    ...newState,
    currentPhase: 'resolution',
    pendingActions: [],
    battleLog: newLog,
    isGameOver,
    winner
  };
}

/**
 * 进入下一回合
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function nextRound(state: BattleState): BattleState {
  if (state.currentPhase !== 'resolution') {
    throw new GameError(
      GameErrorType.INVALID_PHASE,
      '只能在结算阶段后进入下一回合'
    );
  }

  if (state.isGameOver) {
    throw new GameError(
      GameErrorType.BATTLE_ALREADY_ENDED,
      '战斗已经结束'
    );
  }

  return {
    ...state,
    currentRound: state.currentRound + 1,
    currentPhase: 'preparation',
    battleLog: [
      ...state.battleLog,
      {
        phase: 'resolution',
        message: `第 ${state.currentRound} 回合结束`,
        round: state.currentRound
      }
    ]
  };
}

/**
 * 玩家在准备阶段选择道具
 * @param state 战斗状态
 * @param itemId 道具ID
 * @returns 更新后的战斗状态
 */
export function selectItem(state: BattleState, itemId: string): BattleState {
  if (state.currentPhase !== 'preparation') {
    throw new GameError(
      GameErrorType.INVALID_PHASE,
      '只能在准备阶段选择道具'
    );
  }

  if (state.isGameOver) {
    throw new GameError(
      GameErrorType.BATTLE_ALREADY_ENDED,
      '战斗已经结束'
    );
  }

  // 检查是否已经选择了道具
  if (state.pendingItemUse) {
    throw new GameError(
      GameErrorType.INVALID_ACTION,
      '每回合只能选择一个道具'
    );
  }

  const itemIndex = state.playerItems.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    throw new GameError(
      GameErrorType.INVALID_ACTION,
      '未找到指定的道具'
    );
  }

  const item = state.playerItems[itemIndex];

  if (!canUseItem(item)) {
    throw new GameError(
      GameErrorType.INSUFFICIENT_ITEMS,
      '道具数量不足'
    );
  }

  return {
    ...state,
    pendingItemUse: {
      itemId: item.id,
      targetId: state.player.id // 默认对自己使用
    },
    battleLog: [
      ...state.battleLog,
      {
        phase: 'preparation',
        message: `玩家选择使用 ${item.name}`,
        round: state.currentRound
      }
    ]
  };
}

/**
 * 在战斗阶段执行道具使用
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function executePendingItemUse(state: BattleState): BattleState {
  if (state.currentPhase !== 'battle') {
    throw new GameError(
      GameErrorType.INVALID_PHASE,
      '只能在战斗阶段执行道具使用'
    );
  }

  if (state.isGameOver) {
    throw new GameError(
      GameErrorType.BATTLE_ALREADY_ENDED,
      '战斗已经结束'
    );
  }

  // 如果没有待处理的道具使用，直接返回原状态
  if (!state.pendingItemUse) {
    return state;
  }

  const itemId = state.pendingItemUse.itemId;
  let targetId = state.pendingItemUse.targetId;

  const itemIndex = state.playerItems.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    throw new GameError(
      GameErrorType.INVALID_ACTION,
      '未找到指定的道具'
    );
  }

  const item = state.playerItems[itemIndex];

  if (!canUseItem(item)) {
    throw new GameError(
      GameErrorType.INSUFFICIENT_ITEMS,
      '道具数量不足'
    );
  }

  // 根据作战梯队确定道具作用对象
  if (state.player.formation === 'soldiers-first' && state.player.soldiers && state.player.soldiers.length > 0) {
    // 如果玩家士兵在前，道具作用到士兵上
    // 简化处理：作用到第一个士兵
    const firstSoldier = state.player.soldiers[0];
    if (isSoldierAlive(firstSoldier)) {
      // 创建一个临时角色对象来使用道具
      const soldierAsCharacter: Character = {
        id: firstSoldier.id,
        name: firstSoldier.name,
        maxHp: firstSoldier.maxHp,
        currentHp: firstSoldier.currentHp,
        attack: firstSoldier.attack,
        defense: firstSoldier.defense,
        type: 'player'
      };

      const result = useHealingPotion(item, soldierAsCharacter);

      if (!result) {
        throw new GameError(
          GameErrorType.INVALID_ACTION,
          '无法使用该道具'
        );
      }

      const [updatedItem, updatedSoldierAsCharacter] = result;
      const updatedItems = [...state.playerItems];
      updatedItems[itemIndex] = updatedItem;

      // 更新士兵状态
      const updatedSoldier: Soldier = {
        ...firstSoldier,
        currentHp: updatedSoldierAsCharacter.currentHp
      };

      let newLog = [...state.battleLog];
      let updatedPlayer = { ...state.player };
      if (updatedPlayer.soldiers) {
        updatedPlayer.soldiers[0] = updatedSoldier;
      }

      newLog = [
        ...newLog,
        {
          phase: 'battle',
          message: `玩家使用了 ${item.name}，恢复了士兵 ${updatedSoldier.name} 的生命值`,
          round: state.currentRound
        }
      ];

      return {
        ...state,
        player: updatedPlayer,
        playerItems: updatedItems,
        pendingItemUse: undefined, // 清除待处理的道具使用
        battleLog: newLog
      };
    }
  }

  // 否则道具作用到玩家角色上
  const target =
    targetId === state.player.id ? state.player :
    targetId === state.enemy.id ? state.enemy :
    null;

  if (!target) {
    throw new GameError(
      GameErrorType.INVALID_ACTION,
      '无效的目标'
    );
  }

  const result = useHealingPotion(item, target);

  if (!result) {
    throw new GameError(
      GameErrorType.INVALID_ACTION,
      '无法使用该道具'
    );
  }

  const [updatedItem, updatedTarget] = result;
  const updatedItems = [...state.playerItems];
  updatedItems[itemIndex] = updatedItem;

  let newLog = [...state.battleLog];
  let updatedPlayer = state.player;
  let updatedEnemy = state.enemy;

  // 更新目标角色
  if (updatedTarget.id === state.player.id) {
    updatedPlayer = updatedTarget;
  } else {
    updatedEnemy = updatedTarget;
  }

  newLog = [
    ...newLog,
    {
      phase: 'battle',
      message: `玩家使用了 ${item.name}，恢复了生命值`,
      round: state.currentRound
    }
  ];

  return {
    ...state,
    player: updatedPlayer,
    enemy: updatedEnemy,
    playerItems: updatedItems,
    pendingItemUse: undefined, // 清除待处理的道具使用
    battleLog: newLog
  };
}

/**
 * 玩家进入战斗
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function enterBattle(state: BattleState): BattleState {
  if (state.currentPhase !== 'preparation') {
    throw new GameError(
      GameErrorType.INVALID_PHASE,
      '只能在准备阶段进入战斗'
    );
  }

  if (state.isGameOver) {
    throw new GameError(
      GameErrorType.BATTLE_ALREADY_ENDED,
      '战斗已经结束'
    );
  }

  if (!isCharacterAlive(state.player)) {
    throw new GameError(
      GameErrorType.CHARACTER_DEAD,
      '角色已死亡，无法进入战斗'
    );
  }

  return {
    ...state,
    battleLog: [
      ...state.battleLog,
      {
        phase: 'preparation',
        message: '玩家选择进入战斗',
        round: state.currentRound
      }
    ]
  };
}

/**
 * 玩家攻击
 * @param state 战斗状态
 * @param targetId 目标ID
 * @returns 更新后的战斗状态
 */
export function attack(state: BattleState, targetId: string): BattleState {
  if (state.currentPhase !== 'battle') {
    throw new GameError(
      GameErrorType.INVALID_PHASE,
      '只能在战斗阶段进行攻击'
    );
  }

  if (state.isGameOver) {
    throw new GameError(
      GameErrorType.BATTLE_ALREADY_ENDED,
      '战斗已经结束'
    );
  }

  if (!isCharacterAlive(state.player)) {
    throw new GameError(
      GameErrorType.CHARACTER_DEAD,
      '角色已死亡，无法进行攻击'
    );
  }

  // 检查目标是否存在且存活
  const target =
    targetId === state.player.id ? state.player :
    targetId === state.enemy.id ? state.enemy :
    null;

  if (!target || !isCharacterAlive(target)) {
    throw new GameError(
      GameErrorType.INVALID_ACTION,
      '无效的攻击目标'
    );
  }

  // 添加待处理的行动
  const newPendingActions: BattleAction[] = [
    ...state.pendingActions,
    {
      attackerId: state.player.id,
      targetId
    }
  ];

  return {
    ...state,
    pendingActions: newPendingActions,
    battleLog: [
      ...state.battleLog,
      {
        phase: 'battle',
        message: `玩家准备攻击 ${target.name}`,
        round: state.currentRound
      }
    ]
  };
}

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
  // 敌人在战斗阶段的行动已由 autoExecuteBattlePhase 处理，这里不再重复添加

  return {
    ...newState,
    battleLog: newLog
  };
}

/**
 * 减少准备阶段计时器
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function decreasePreparationTimer(state: BattleState): BattleState {
  if (state.currentPhase !== 'preparation') {
    throw new GameError(
      GameErrorType.INVALID_PHASE,
      '只能在准备阶段减少计时器'
    );
  }

  if (state.isGameOver) {
    throw new GameError(
      GameErrorType.BATTLE_ALREADY_ENDED,
      '战斗已经结束'
    );
  }

  const newTimer = (state.preparationTimer || 30) - 1;

  // 如果计时器归零且玩家未采取行动，则自动进入战斗阶段
  if (newTimer <= 0 && !state.preparationActionTaken) {
    return {
      ...state,
      preparationTimer: 0,
      battleLog: [
        ...state.battleLog,
        {
          phase: 'preparation',
          message: '准备阶段时间结束，自动进入战斗阶段',
          round: state.currentRound
        }
      ]
    };
  }

  return {
    ...state,
    preparationTimer: newTimer
  };
}

/**
 * 标记准备阶段已采取行动
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function markPreparationActionTaken(state: BattleState): BattleState {
  if (state.currentPhase !== 'preparation') {
    throw new GameError(
      GameErrorType.INVALID_PHASE,
      '只能在准备阶段标记行动'
    );
  }

  if (state.isGameOver) {
    throw new GameError(
      GameErrorType.BATTLE_ALREADY_ENDED,
      '战斗已经结束'
    );
  }

  return {
    ...state,
    preparationActionTaken: true
  };
}

/**
 * 自动执行战斗阶段
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function autoExecuteBattlePhase(state: BattleState): BattleState {
  if (state.currentPhase !== 'battle') {
    throw new GameError(
      GameErrorType.INVALID_PHASE,
      '只能在战斗阶段自动执行'
    );
  }

  if (state.isGameOver) {
    throw new GameError(
      GameErrorType.BATTLE_ALREADY_ENDED,
      '战斗已经结束'
    );
  }

  let newState = { ...state };
  let newLog = [...state.battleLog];

  // 如果玩家在准备阶段选择了道具，则在战斗阶段使用道具
  if (state.pendingItemUse) {
    // 执行道具使用
    newState = executePendingItemUse(newState);
    newLog = [...newState.battleLog];

    // 玩家使用道具后不进行攻击
    newLog = [
      ...newLog,
      {
        phase: 'battle',
        message: `玩家使用道具后不进行攻击`,
        round: state.currentRound
      }
    ];
  } else {
    // 玩家自动攻击（如果在准备阶段选择了战斗）
    // 在这个简化版本中，我们假设玩家总是攻击敌人
    const newPendingActions: BattleAction[] = [
      ...newState.pendingActions,
      {
        attackerId: state.player.id,
        targetId: state.enemy.id
      }
    ];

    newState.pendingActions = newPendingActions;
    newLog = [
      ...newLog,
      {
        phase: 'battle',
        message: `玩家自动攻击 ${state.enemy.name}`,
        round: state.currentRound
      }
    ];
  }

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

  return {
    ...newState,
    battleLog: newLog
  };
}

/**
 * 自动进入下一回合
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function autoProceedToNextRound(state: BattleState): BattleState {
  if (state.currentPhase !== 'resolution') {
    throw new GameError(
      GameErrorType.INVALID_PHASE,
      '只能在结算阶段后自动进入下一回合'
    );
  }

  if (state.isGameOver) {
    throw new GameError(
      GameErrorType.BATTLE_ALREADY_ENDED,
      '战斗已经结束'
    );
  }

  // 移除重复的日志记录，因为 startResolutionPhase 已经处理了结算日志
  return {
    ...state,
    currentRound: state.currentRound + 1,
    currentPhase: 'preparation',
    preparationTimer: 30, // 重置计时器
    preparationActionTaken: false // 重置行动标记
  };
}

/**
 * 切换作战梯队
 * @param state 战斗状态
 * @returns 更新后的战斗状态
 */
export function toggleFormation(state: BattleState): BattleState {
  if (state.isGameOver) {
    throw new GameError(
      GameErrorType.BATTLE_ALREADY_ENDED,
      '战斗已经结束'
    );
  }

  const updatedPlayer = { ...state.player };
  updatedPlayer.formation = updatedPlayer.formation === 'soldiers-first' ? 'player-first' : 'soldiers-first';

  return {
    ...state,
    player: updatedPlayer,
    battleLog: [
      ...state.battleLog,
      {
        phase: 'preparation',
        message: `切换作战梯队为: ${updatedPlayer.formation === 'soldiers-first' ? '士兵在前' : '玩家在前'}`,
        round: state.currentRound
      }
    ]
  };
}

/**
 * 重置战斗
 * @param initialState 初始战斗状态
 * @returns 重置后的战斗状态
 */
export function resetBattle(initialState: BattleState): BattleState {
  return {
    ...initialState,
    battleLog: [
      {
        phase: 'preparation',
        message: '战斗重新开始',
        round: 1
      }
    ]
  };
}

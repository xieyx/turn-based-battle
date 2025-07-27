import type { BattleState, BattlePhase, BattleAction } from '../types/battle';
import type { Character } from '../types/character';
import type { Item } from '../types/item';
import { GameError, GameErrorType } from '../types/game';
import { calculateDamage, applyDamage } from './damageCalculation';
import { useHealingPotion, canUseItem } from './items';
import { isCharacterAlive, updateCharacterHp } from './character';

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

    if (isCharacterAlive(attacker) && isCharacterAlive(defender)) {
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

  // 检查战斗是否结束
  const isPlayerAlive = isCharacterAlive(newState.player);
  const isEnemyAlive = isCharacterAlive(newState.enemy);

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
  const targetId = state.pendingItemUse.targetId;

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
      message: `玩家使用了 ${item.name}，恢复了 ${item.effect.heal} 点生命值`,
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

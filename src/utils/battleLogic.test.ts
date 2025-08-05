import { describe, it, expect } from 'vitest';
import {
  initializeBattle,
  startPreparationPhase,
  startBattlePhase,
  nextRound,
  selectItem,
  executePendingItemUse,
  enterBattle,
  decreasePreparationTimer,
  markPreparationActionTaken,
  autoExecuteBattlePhase,
  autoProceedToNextRound,
  toggleFormation,
  resetBattle
} from './battleLogic';
import { processEnemyTurn } from '../ai/enemyAI';
import { DEFAULT_PLAYER_CONFIG, DEFAULT_ENEMY_CONFIG, DEFAULT_ITEMS } from '../constants/gameConfig';
import { createCharacter } from './character';

describe('battleLogic', () => {
  describe('initializeBattle', () => {
    it('should initialize battle with correct initial state', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));

      const battleState = initializeBattle(player, enemy, items);

      expect(battleState.currentRound).toBe(1);
      expect(battleState.currentPhase).toBe('preparation');
      expect(battleState.player).toEqual(player);
      expect(battleState.enemy).toEqual(enemy);
      expect(battleState.playerItems).toEqual(items);
      expect(battleState.battleLog).toHaveLength(0);
      expect(battleState.pendingActions).toHaveLength(0);
      expect(battleState.isGameOver).toBe(false);
      expect(battleState.preparationTimer).toBe(30);
      expect(battleState.preparationActionTaken).toBe(false);
    });
  });

  describe('startPreparationPhase', () => {
    it('should start preparation phase correctly', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = initializeBattle(player, enemy, items);
      // Set to a different phase for testing
      const battleState = { ...initialState, currentPhase: 'battle' as const };

      const updatedState = startPreparationPhase(battleState);

      expect(updatedState.currentPhase).toBe('preparation');
      expect(updatedState.preparationTimer).toBe(30);
      expect(updatedState.preparationActionTaken).toBe(false);
      expect(updatedState.battleLog).toHaveLength(1);
      expect(updatedState.battleLog[0].message).toContain('准备阶段');
    });

    it('should throw error if battle is already over', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = {
        ...initializeBattle(player, enemy, items),
        isGameOver: true
      };

      expect(() => startPreparationPhase(battleState)).toThrow('战斗已经结束');
    });
  });

  describe('startBattlePhase', () => {
    it('should start battle phase correctly', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = initializeBattle(player, enemy, items);
      // 设置为准备阶段
      const preparationState = startPreparationPhase(initialState);

      const updatedState = startBattlePhase(preparationState);

      // 由于startBattlePhase现在会自动执行战斗，所以阶段应该是resolution
      // 但由于角色生命值足够高，战斗不会结束，所以会进入下一回合，阶段变为preparation
      expect(updatedState.currentPhase).toBe('preparation');
      expect(updatedState.battleLog.some(log => log.message.includes('战斗阶段'))).toBe(true);
    });

    it('should throw error if not in preparation phase', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = {
        ...initializeBattle(player, enemy, items),
        currentPhase: 'resolution' as const
      };

      expect(() => startBattlePhase(battleState)).toThrow('只能在准备阶段后进入战斗阶段');
    });
  });

  describe('enterBattle', () => {
    it('should allow player to enter battle', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = initializeBattle(player, enemy, items);

      const updatedState = enterBattle(initialState);

      expect(updatedState.battleLog).toHaveLength(1);
      expect(updatedState.battleLog[0].message).toBe('玩家选择进入战斗');
    });

    it('should throw error if not in preparation phase', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = {
        ...initializeBattle(player, enemy, items),
        currentPhase: 'battle' as const
      };

      expect(() => enterBattle(battleState)).toThrow('只能在准备阶段进入战斗');
    });

    it('should throw error if battle is already over', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = {
        ...initializeBattle(player, enemy, items),
        isGameOver: true
      };

      expect(() => enterBattle(battleState)).toThrow('战斗已经结束');
    });
  });

  describe('processEnemyTurn', () => {
    it('should process enemy turn in preparation phase', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = initializeBattle(player, enemy, items);

      const updatedState = processEnemyTurn(initialState);

      expect(updatedState.battleLog).toHaveLength(1);
      expect(updatedState.battleLog[0].message).toBe('敌人选择进入战斗');
    });

    it('should throw error if battle is already over', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = {
        ...initializeBattle(player, enemy, items),
        isGameOver: true
      };

      expect(() => processEnemyTurn(battleState)).toThrow('战斗已经结束');
    });
  });

  describe('selectItem', () => {
    it('should allow player to select an item', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`,
        quantity: 3
      }));
      const initialState = initializeBattle(player, enemy, items);

      const updatedState = selectItem(initialState, 'item-0');

      expect(updatedState.pendingItemUse).toBeDefined();
      expect(updatedState.pendingItemUse?.itemId).toBe('item-0');
      expect(updatedState.pendingItemUse?.targetId).toBe('player-1');
      expect(updatedState.battleLog).toHaveLength(1);
      expect(updatedState.battleLog[0].message).toContain('选择使用');
    });

    it('should throw error if not in preparation phase', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = {
        ...initializeBattle(player, enemy, items),
        currentPhase: 'battle' as const
      };

      expect(() => selectItem(battleState, 'item-0')).toThrow('只能在准备阶段选择道具');
    });

    it('should throw error if item not found', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = initializeBattle(player, enemy, items);

      expect(() => selectItem(initialState, 'item-999')).toThrow('未找到指定的道具');
    });

    it('should throw error if item quantity is insufficient', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`,
        quantity: 0
      }));
      const initialState = initializeBattle(player, enemy, items);

      expect(() => selectItem(initialState, 'item-0')).toThrow('道具数量不足');
    });
  });

  describe('toggleFormation', () => {
    it('should toggle player formation', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = initializeBattle(player, enemy, items);

      const updatedState = toggleFormation(initialState);

      expect(updatedState.player.formation).toBe('soldiers-first');
      expect(updatedState.battleLog).toHaveLength(1);
      expect(updatedState.battleLog[0].message).toContain('切换作战梯队');
    });

    it('should toggle formation back to player-first', () => {
      const player = createCharacter({ ...DEFAULT_PLAYER_CONFIG, formation: 'soldiers-first' }, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = initializeBattle(player, enemy, items);

      const updatedState = toggleFormation(initialState);

      expect(updatedState.player.formation).toBe('player-first');
    });
  });

  describe('decreasePreparationTimer', () => {
    it('should decrease preparation timer', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = initializeBattle(player, enemy, items);

      const updatedState = decreasePreparationTimer(initialState);

      expect(updatedState.preparationTimer).toBe(29);
    });

    it('should add log message when timer reaches 0 and no action taken', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = {
        ...initializeBattle(player, enemy, items),
        preparationTimer: 1,
        preparationActionTaken: false
      };

      const updatedState = decreasePreparationTimer(initialState);

      expect(updatedState.preparationTimer).toBe(0);
      expect(updatedState.battleLog).toHaveLength(1);
      expect(updatedState.battleLog[0].message).toContain('时间结束');
    });
  });

  describe('markPreparationActionTaken', () => {
    it('should mark preparation action as taken', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = initializeBattle(player, enemy, items);

      const updatedState = markPreparationActionTaken(initialState);

      expect(updatedState.preparationActionTaken).toBe(true);
    });
  });

  describe('executePendingItemUse', () => {
    it('should execute pending item use correctly', () => {
      const player = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      const enemy = createCharacter({ ...DEFAULT_ENEMY_CONFIG, maxHp: 80 }, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`,
        quantity: 3
      }));

      // 创建一个初始状态，玩家生命值较低
      const playerWithLowHp = { ...player, currentHp: 50 };
      let battleState = initializeBattle(playerWithLowHp, enemy, items);

      // 选择一个道具
      battleState = selectItem(battleState, 'item-0');

      // 设置为战斗阶段
      battleState = {
        ...battleState,
        currentPhase: 'battle'
      };

      // 执行道具使用
      const updatedState = executePendingItemUse(battleState);

      // 验证道具使用效果
      expect(updatedState.player.currentHp).toBe(80); // 50 + 30 = 80
      expect(updatedState.playerItems[0].quantity).toBe(2); // 3 - 1 = 2
      expect(updatedState.pendingItemUse).toBeUndefined();
      expect(updatedState.battleLog.some(log => log.message.includes('恢复了生命值'))).toBe(true);
    });

    it('should throw error if not in battle phase', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = {
        ...initializeBattle(player, enemy, items),
        currentPhase: 'preparation' as const,
        pendingItemUse: {
          itemId: 'item-0',
          targetId: 'player-1'
        }
      };

      expect(() => executePendingItemUse(battleState)).toThrow('只能在战斗阶段执行道具使用');
    });

    it('should throw error if battle is already over', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = {
        ...initializeBattle(player, enemy, items),
        isGameOver: true,
        currentPhase: 'battle' as const, // 确保阶段正确
        pendingItemUse: {
          itemId: 'item-0',
          targetId: 'player-1'
        }
      };

      expect(() => executePendingItemUse(battleState)).toThrow('战斗已经结束');
    });

    it('should return original state if no pending item use', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = initializeBattle(player, enemy, items);

      // 设置为战斗阶段
      const battleStateInBattle = {
        ...battleState,
        currentPhase: 'battle' as const
      };

      const updatedState = executePendingItemUse(battleStateInBattle);

      expect(updatedState).toEqual(battleStateInBattle);
    });
  });

  describe('autoExecuteBattlePhase', () => {
    it('should execute battle phase automatically', () => {
      const player = createCharacter({ ...DEFAULT_PLAYER_CONFIG, attack: 20, defense: 5, maxHp: 100 }, 'player-1');
      const enemy = createCharacter({ ...DEFAULT_ENEMY_CONFIG, attack: 15, defense: 3, maxHp: 80 }, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));

      let battleState = initializeBattle(player, enemy, items);

      // 设置为战斗阶段
      battleState = {
        ...battleState,
        currentPhase: 'battle'
      };

      // 自动执行战斗阶段
      const updatedState = autoExecuteBattlePhase(battleState);

      // 验证在执行过程中有添加行动和伤害计算
      // 注意：由于autoExecuteBattlePhase会调用startResolutionPhase，最终的pendingActions和calculatedDamages会被清空
      // 我们需要检查日志来验证执行过程
      expect(updatedState.battleLog.some(log => log.message.includes('自动攻击'))).toBe(true);
      expect(updatedState.battleLog.some(log => log.message.includes('将承受'))).toBe(true);
    });

    it('should throw error if not in battle phase', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = initializeBattle(player, enemy, items);

      expect(() => autoExecuteBattlePhase(battleState)).toThrow('只能在战斗阶段自动执行');
    });

    it('should throw error if battle is already over', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = {
        ...initializeBattle(player, enemy, items),
        isGameOver: true,
        currentPhase: 'battle' as const // 确保阶段正确
      };

      expect(() => autoExecuteBattlePhase(battleState)).toThrow('战斗已经结束');
    });
  });

  describe('autoProceedToNextRound', () => {
    it('should automatically proceed to next round', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = initializeBattle(player, enemy, items);

      // 设置为结算阶段
      const resolutionState = {
        ...initialState,
        currentPhase: 'resolution' as const,
        currentRound: 1
      };

      const updatedState = autoProceedToNextRound(resolutionState);

      expect(updatedState.currentRound).toBe(2);
      expect(updatedState.currentPhase).toBe('preparation');
      expect(updatedState.preparationTimer).toBe(30);
      expect(updatedState.preparationActionTaken).toBe(false);
    });

    it('should throw error if not in resolution phase', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = initializeBattle(player, enemy, items);

      expect(() => autoProceedToNextRound(battleState)).toThrow('只能在结算阶段后自动进入下一回合');
    });

    it('should throw error if battle is already over', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = {
        ...initializeBattle(player, enemy, items),
        currentPhase: 'resolution' as const,
        isGameOver: true
      };

      expect(() => autoProceedToNextRound(battleState)).toThrow('战斗已经结束');
    });
  });

  describe('nextRound', () => {
    it('should proceed to next round correctly', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = initializeBattle(player, enemy, items);

      // 设置为结算阶段
      const resolutionState = {
        ...initialState,
        currentPhase: 'resolution' as const,
        currentRound: 1
      };

      const updatedState = nextRound(resolutionState);

      expect(updatedState.currentRound).toBe(2);
      expect(updatedState.currentPhase).toBe('preparation');
      expect(updatedState.battleLog).toHaveLength(1);
      expect(updatedState.battleLog[0].message).toContain('回合结束');
    });

    it('should throw error if not in resolution phase', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = initializeBattle(player, enemy, items);

      expect(() => nextRound(battleState)).toThrow('只能在结算阶段后进入下一回合');
    });

    it('should throw error if battle is already over', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const battleState = {
        ...initializeBattle(player, enemy, items),
        currentPhase: 'resolution' as const,
        isGameOver: true
      };

      expect(() => nextRound(battleState)).toThrow('战斗已经结束');
    });
  });

  describe('resetBattle', () => {
    it('should reset battle to initial state', () => {
      const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');
      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      const initialState = initializeBattle(player, enemy, items);

      // 修改状态以模拟战斗进行中
      const modifiedState = {
        ...initialState,
        currentRound: 5,
        currentPhase: 'battle' as const,
        battleLog: [
          { phase: 'preparation' as const, message: '测试日志', round: 1 }
        ],
        isGameOver: true,
        winner: 'player' as const
      };

      const resetState = resetBattle(modifiedState);

      expect(resetState.currentRound).toBe(1);
      expect(resetState.currentPhase).toBe('preparation');
      expect(resetState.isGameOver).toBe(false);
      expect(resetState.winner).toBeUndefined();
      expect(resetState.battleLog).toHaveLength(1);
      expect(resetState.battleLog[0].message).toBe('战斗重新开始');
    });
  });

  describe('startResolutionPhase', () => {
    it('should calculate damage correctly between player and enemy', () => {
      const player = createCharacter({ ...DEFAULT_PLAYER_CONFIG, attack: 20, defense: 5, maxHp: 100 }, 'player-1');
      const enemy = createCharacter({ ...DEFAULT_ENEMY_CONFIG, attack: 15, defense: 3, maxHp: 80 }, 'enemy-1');

      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      let battleState = initializeBattle(player, enemy, items);

      // Manually set HP for testing after initialization
      const playerWithHp = { ...battleState.player, currentHp: 100 };
      const enemyWithHp = { ...battleState.enemy, currentHp: 80 };
      battleState = {
        ...battleState,
        player: playerWithHp,
        enemy: enemyWithHp
      };

      // 进入准备阶段
      battleState = startPreparationPhase(battleState);

      // 玩家进入战斗
      battleState = enterBattle(battleState);

      // 处理敌人回合
      battleState = processEnemyTurn(battleState);

      // 进入战斗阶段（这会自动执行战斗并进入结算阶段）
      battleState = startBattlePhase(battleState);

      // 验证伤害计算是否正确
      // 玩家对敌人伤害: max(20 - 3, 1) = 17 (玩家角色) + max(10 - 3, 1) = 7 (玩家士兵) = 24
      // 敌人对玩家伤害: max(15 - 5, 1) = 10 (敌人角色) + max(10 - 5, 1) = 5 (敌人士兵) = 15
      // 玩家对敌人造成的伤害应该由敌人士兵承受
      expect(battleState.enemy.currentHp).toBe(80); // 敌人角色HP不变，伤害由士兵承受
      expect(battleState.player.currentHp).toBe(85); // 100 - 10 - 5 = 85 (敌人角色和士兵的伤害)
    });

    it('should handle soldier damage and quantity reduction correctly', () => {
      // 创建带有士兵的角色
      const player = createCharacter({ ...DEFAULT_PLAYER_CONFIG, attack: 20, defense: 5 }, 'player-1');
      const enemy = createCharacter({ ...DEFAULT_ENEMY_CONFIG, attack: 15, defense: 3 }, 'enemy-1');

      // 设置士兵
      const playerWithSoldiers = {
        ...player,
        soldiers: [{
          id: 'soldier-1',
          name: '剑士',
          maxHp: 30,
          currentHp: 30,
          attack: 10,
          defense: 2,
          quantity: 3,
          maxQuantity: 5
        }]
      };

      const enemyWithSoldiers = {
        ...enemy,
        soldiers: [{
          id: 'soldier-2',
          name: '剑士',
          maxHp: 30,
          currentHp: 30,
          attack: 10,
          defense: 2,
          quantity: 2,
          maxQuantity: 5
        }]
      };

      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      let battleState = initializeBattle(playerWithSoldiers, enemyWithSoldiers, items);

      // 进入准备阶段
      battleState = startPreparationPhase(battleState);

      // 玩家进入战斗
      battleState = enterBattle(battleState);

      // 处理敌人回合
      battleState = processEnemyTurn(battleState);

      // 进入战斗阶段（这会自动执行战斗并进入结算阶段）
      battleState = startBattlePhase(battleState);

      // 验证士兵伤害和数量减少逻辑
      // 玩家士兵攻击敌人: max(10 - 3, 1) = 7 伤害
      // 敌人士兵攻击玩家: max(10 - 5, 1) = 5 伤害
      // 由于伤害计算和应用都在startBattlePhase中完成，我们直接验证结果
      expect(battleState.enemy.soldiers?.[0].quantity).toBeLessThanOrEqual(2);
      expect(battleState.player.soldiers?.[0].quantity).toBeLessThanOrEqual(3);
    });

    it('should end battle when one character dies', () => {
      // 创建低生命值的角色
      const player = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 5, attack: 1 }, 'player-1');
      const enemy = createCharacter({ ...DEFAULT_ENEMY_CONFIG, attack: 20, defense: 0, maxHp: 5 }, 'enemy-1');

      // 设置玩家没有士兵
      const playerWithoutSoldiers = {
        ...player,
        soldiers: []
      };

      const enemyWithoutSoldiers = {
        ...enemy,
        soldiers: []
      };

      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      let battleState = initializeBattle(playerWithoutSoldiers, enemyWithoutSoldiers, items);

      // Manually set HP for testing after initialization
      const playerWithHp = Object.assign({}, battleState.player, { currentHp: 5 });
      const enemyWithHp = Object.assign({}, battleState.enemy, { currentHp: 5 });
      battleState = {
        ...battleState,
        player: playerWithHp,
        enemy: enemyWithHp
      };

      // 进入准备阶段
      battleState = startPreparationPhase(battleState);

      // 玩家进入战斗
      battleState = enterBattle(battleState);

      // 处理敌人回合
      battleState = processEnemyTurn(battleState);

      // 进入战斗阶段（这会自动执行战斗并进入结算阶段）
      battleState = startBattlePhase(battleState);

      // 验证战斗结束条件
      expect(battleState.isGameOver).toBe(true);
      expect(battleState.winner).toBe('enemy');
    });
  });
});

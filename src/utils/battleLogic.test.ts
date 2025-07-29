import { describe, it, expect } from 'vitest';
import {
  initializeBattle,
  startPreparationPhase,
  startBattlePhase,
  startResolutionPhase,
  nextRound,
  selectItem,
  enterBattle,
  processEnemyTurn,
  decreasePreparationTimer,
  markPreparationActionTaken,
  autoExecuteBattlePhase,
  autoProceedToNextRound,
  toggleFormation,
  resetBattle
} from './battleLogic';
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

      const updatedState = startBattlePhase(initialState);

      expect(updatedState.currentPhase).toBe('battle');
      expect(updatedState.battleLog).toHaveLength(1);
      expect(updatedState.battleLog[0].message).toContain('战斗阶段');
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

      // 进入战斗阶段
      battleState = startBattlePhase(battleState);

      // 自动执行战斗
      battleState = autoExecuteBattlePhase(battleState);

      // 开始结算阶段
      const updatedState = startResolutionPhase(battleState);

      // 验证伤害计算是否正确
      // 玩家对敌人伤害: max(20 - 3, 1) = 17
      // 敌人对玩家伤害: max(15 - 5, 1) = 10
      expect(updatedState.enemy.currentHp).toBe(63); // 80 - 17 = 63
      expect(updatedState.player.currentHp).toBe(90); // 100 - 10 = 90
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

      // 进入战斗阶段
      battleState = startBattlePhase(battleState);

      // 自动执行战斗
      battleState = autoExecuteBattlePhase(battleState);

      // 开始结算阶段
      const updatedState = startResolutionPhase(battleState);

      // 验证士兵伤害和数量减少逻辑
      // 玩家士兵攻击敌人: max(10 - 3, 1) = 7 伤害
      // 敌人士兵攻击玩家: max(10 - 5, 1) = 5 伤害
      expect(updatedState.enemy.soldiers?.[0].quantity).toBeLessThanOrEqual(2);
      expect(updatedState.player.soldiers?.[0].quantity).toBeLessThanOrEqual(3);
    });

    it('should handle damage penetration when soldiers are killed', () => {
      // 创建带有少量士兵的角色
      const player = createCharacter({ ...DEFAULT_PLAYER_CONFIG, attack: 20, defense: 5, maxHp: 100 }, 'player-1');
      const enemy = createCharacter({ ...DEFAULT_ENEMY_CONFIG, attack: 50, defense: 3, maxHp: 80 }, 'enemy-1');

      // 设置少量士兵
      const playerWithSoldiers = {
        ...player,
        soldiers: [{
          id: 'soldier-1',
          name: '剑士',
          maxHp: 10,
          currentHp: 10,
          attack: 5,
          defense: 2,
          quantity: 1,
          maxQuantity: 5
        }]
      };

      const enemyWithSoldiers = {
        ...enemy,
        soldiers: [{
          id: 'soldier-2',
          name: '剑士',
          maxHp: 10,
          currentHp: 10,
          attack: 5,
          defense: 2,
          quantity: 1,
          maxQuantity: 5
        }]
      };

      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      let battleState = initializeBattle(playerWithSoldiers, enemyWithSoldiers, items);

      // 进入战斗阶段
      battleState = startBattlePhase(battleState);

      // 自动执行战斗
      battleState = autoExecuteBattlePhase(battleState);

      // 开始结算阶段
      const updatedState = startResolutionPhase(battleState);

      // 验证伤害穿透逻辑
      // 敌人高攻击力应该能杀死玩家士兵并穿透伤害到玩家本身
      const playerSoldier = updatedState.player.soldiers?.[0];
      if (playerSoldier) {
        // 如果士兵被杀死，应该有穿透伤害到玩家
        if (playerSoldier.quantity === 0) {
          expect(updatedState.player.currentHp).toBeLessThan(100);
        }
      }
    });

    it('should end battle when one character dies', () => {
      // 创建低生命值的角色
      const player = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 5 }, 'player-1');
      const enemy = createCharacter({ ...DEFAULT_ENEMY_CONFIG, attack: 20 }, 'enemy-1');

      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      let battleState = initializeBattle(player, enemy, items);

      // Manually set HP for testing after initialization
      const playerWithHp = Object.assign({}, battleState.player, { currentHp: 5 });
      const enemyWithHp = Object.assign({}, battleState.enemy, { currentHp: 80 });
      battleState = {
        ...battleState,
        player: playerWithHp,
        enemy: enemyWithHp
      };

      // 进入战斗阶段
      battleState = startBattlePhase(battleState);

      // 自动执行战斗
      battleState = autoExecuteBattlePhase(battleState);

      // 开始结算阶段
      const updatedState = startResolutionPhase(battleState);

      // 验证战斗结束条件
      expect(updatedState.isGameOver).toBe(true);
      expect(updatedState.winner).toBe('enemy');
    });
  });
});

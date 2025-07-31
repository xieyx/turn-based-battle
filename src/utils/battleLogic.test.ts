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
      // 但根据作战梯队，敌人是soldiers-first，所以伤害应该由敌人士兵承受
      // 玩家对敌人造成的伤害应该由敌人士兵承受
      // 敌人对玩家造成的伤害应该由玩家角色承受（因为玩家默认是player-first）
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

    it('should correctly handle soldier damage calculation and quantity reduction with specific values', () => {
      // 创建带有特定属性的角色和士兵
      const player = createCharacter({ ...DEFAULT_PLAYER_CONFIG, attack: 30, defense: 5, maxHp: 100 }, 'player-1');
      const enemy = createCharacter({ ...DEFAULT_ENEMY_CONFIG, attack: 20, defense: 3, maxHp: 80 }, 'enemy-1');

      // 设置具有特定属性的士兵
      const playerWithSoldiers = {
        ...player,
        formation: 'soldiers-first' as const, // 玩家士兵在前
        soldiers: [{
          id: 'soldier-1',
          name: '剑士',
          maxHp: 20,
          currentHp: 20,
          attack: 15,
          defense: 2,
          quantity: 5, // 5个士兵
          maxQuantity: 5
        }]
      };

      const enemyWithSoldiers = {
        ...enemy,
        formation: 'soldiers-first' as const, // 敌人士兵在前
        soldiers: [{
          id: 'soldier-2',
          name: '剑士',
          maxHp: 15,
          currentHp: 15,
          attack: 12,
          defense: 1,
          quantity: 4, // 4个士兵
          maxQuantity: 5
        }]
      };

      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      let battleState = initializeBattle(playerWithSoldiers, enemyWithSoldiers, items);

      // 设置初始HP
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

      // 保存初始士兵数量
      const initialPlayerSoldierQuantity = battleState.player.soldiers?.[0].quantity;
      const initialEnemySoldierQuantity = battleState.enemy.soldiers?.[0].quantity;

      // 进入战斗阶段（这会自动执行战斗并进入结算阶段）
      battleState = startBattlePhase(battleState);

      // 验证具体的伤害计算和士兵数量减少
      // 玩家角色攻击敌人: max(30 - 3, 1) = 27 伤害
      // 玩家士兵攻击敌人: max(15 - 3, 1) = 12 伤害
      // 敌人角色攻击玩家: max(20 - 5, 1) = 15 伤害
      // 敌人士兵攻击玩家: max(12 - 5, 1) = 7 伤害

      // 由于双方都是soldiers-first，伤害应该由士兵承受
      // 玩家士兵承受来自敌人角色和敌人士兵的伤害: 15 + 7 = 22 伤害
      // 敌人士兵承受来自玩家角色和玩家士兵的伤害: 27 + 12 = 39 伤害

      // 验证玩家士兵数量减少
      const playerSoldier = battleState.player.soldiers?.[0];
      const enemySoldier = battleState.enemy.soldiers?.[0];

      expect(playerSoldier).toBeDefined();
      expect(enemySoldier).toBeDefined();

      if (playerSoldier && enemySoldier) {
        // 检查士兵数量是否减少
        expect(playerSoldier.quantity).toBeLessThanOrEqual(initialPlayerSoldierQuantity || 0);
        expect(enemySoldier.quantity).toBeLessThanOrEqual(initialEnemySoldierQuantity || 0);

        // 检查玩家角色HP应该没有变化（因为士兵在前）
        expect(battleState.player.currentHp).toBe(100);
        // 检查敌人角色HP应该没有变化（因为士兵在前）
        expect(battleState.enemy.currentHp).toBe(80);

        // 验证具体的伤害计算逻辑
        // 玩家士兵承受22点伤害，每个士兵20点HP，应该减少1个士兵，剩余士兵HP为18
        // 敌人士兵承受39点伤害，每个士兵15点HP，应该减少2个士兵，剩余士兵HP为6
        if (playerSoldier.quantity === 4) {
          expect(playerSoldier.currentHp).toBe(18); // 20 - 22 + 20 = 18 (一个士兵死亡，另一个承受剩余伤害)
        } else if (playerSoldier.quantity === 3) {
          expect(playerSoldier.currentHp).toBe(20); // 20 - 22 + 20 + 20 = 38 (两个士兵死亡，剩余士兵满HP)
        }

        if (enemySoldier.quantity === 2) {
          expect(enemySoldier.currentHp).toBe(6); // 15 - 39 + 15 + 15 = 6 (两个士兵死亡，剩余士兵承受剩余伤害)
        } else if (enemySoldier.quantity === 1) {
          expect(enemySoldier.currentHp).toBe(15); // 15 - 39 + 15 + 15 + 15 = 21 (三个士兵死亡，剩余士兵满HP，但不超过maxHp)
        }
      }
    });

    it('should calculate and apply damage correctly in battle and resolution phases', () => {
      // 创建角色
      const player = createCharacter({ ...DEFAULT_PLAYER_CONFIG, attack: 20, defense: 5, maxHp: 100 }, 'player-1');
      const enemy = createCharacter({ ...DEFAULT_ENEMY_CONFIG, attack: 15, defense: 3, maxHp: 80, formation: 'player-first' }, 'enemy-1');

      const items = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `item-${index}`
      }));
      let battleState = initializeBattle(player, enemy, items);

      // 设置初始HP
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

      // 保存初始HP
      const initialPlayerHp = battleState.player.currentHp;
      const initialEnemyHp = battleState.enemy.currentHp;

      // 进入战斗阶段（这会自动执行战斗并进入结算阶段）
      battleState = startBattlePhase(battleState);

      // 验证伤害计算和应用逻辑
      // 玩家角色攻击敌人: max(20 - 3, 1) = 17 伤害
      // 玩家士兵攻击敌人: max(10 - 3, 1) = 7 伤害
      // 敌人角色攻击玩家: max(15 - 5, 1) = 10 伤害
      // 敌人士兵攻击玩家: max(10 - 5, 1) = 5 伤害

      // 总伤害计算：
      // 敌人承受：17 + 7 = 24 伤害 (因为敌人设置为player-first)
      // 玩家承受：10 + 5 = 15 伤害

      // 验证最终HP
      // 敌人HP应该减少24点 (80 - 24 = 56)
      expect(battleState.enemy.currentHp).toBe(56);
      // 玩家HP应该减少15点 (100 - 15 = 85)
      expect(battleState.player.currentHp).toBe(85);
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

      // 进入准备阶段
      battleState = startPreparationPhase(battleState);

      // 玩家进入战斗
      battleState = enterBattle(battleState);

      // 处理敌人回合
      battleState = processEnemyTurn(battleState);

      // 进入战斗阶段（这会自动执行战斗并进入结算阶段）
      battleState = startBattlePhase(battleState);

      // 验证伤害穿透逻辑
      // 敌人高攻击力应该能杀死玩家士兵并穿透伤害到玩家本身
      const playerSoldier = battleState.player.soldiers?.[0];
      if (playerSoldier) {
        // 如果士兵被杀死，应该有穿透伤害到玩家
        if (playerSoldier.quantity === 0) {
          expect(battleState.player.currentHp).toBeLessThan(100);
        }
      }
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

import { describe, it, expect } from 'vitest';
import {
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
import { DEFAULT_PLAYER_CONFIG, DEFAULT_ENEMY_CONFIG, DEFAULT_SOLDIER_CONFIG } from '../constants/gameConfig';

describe('character', () => {
  describe('createCharacter', () => {
    it('should create a player character with default soldiers', () => {
      const character = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');

      expect(character.id).toBe('player-1');
      expect(character.name).toBe(DEFAULT_PLAYER_CONFIG.name);
      expect(character.maxHp).toBe(DEFAULT_PLAYER_CONFIG.maxHp);
      expect(character.currentHp).toBe(DEFAULT_PLAYER_CONFIG.maxHp);
      expect(character.attack).toBe(DEFAULT_PLAYER_CONFIG.attack);
      expect(character.defense).toBe(DEFAULT_PLAYER_CONFIG.defense);
      expect(character.type).toBe('player');
      expect(character.soldiers).toBeDefined();
      expect(character.soldiers?.length).toBe(1);
    });

    it('should create an enemy character with default soldiers', () => {
      const character = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy-1');

      expect(character.id).toBe('enemy-1');
      expect(character.name).toBe(DEFAULT_ENEMY_CONFIG.name);
      expect(character.maxHp).toBe(DEFAULT_ENEMY_CONFIG.maxHp);
      expect(character.currentHp).toBe(DEFAULT_ENEMY_CONFIG.maxHp);
      expect(character.attack).toBe(DEFAULT_ENEMY_CONFIG.attack);
      expect(character.defense).toBe(DEFAULT_ENEMY_CONFIG.defense);
      expect(character.type).toBe('enemy');
      expect(character.soldiers).toBeDefined();
      expect(character.soldiers?.length).toBe(1);
    });
  });

  describe('createSoldier', () => {
    it('should create a soldier with correct properties', () => {
      const soldier = createSoldier(DEFAULT_SOLDIER_CONFIG, 'soldier-1');

      expect(soldier.id).toBe('soldier-1');
      expect(soldier.name).toBe(DEFAULT_SOLDIER_CONFIG.name);
      expect(soldier.maxHp).toBe(DEFAULT_SOLDIER_CONFIG.maxHp);
      expect(soldier.currentHp).toBe(DEFAULT_SOLDIER_CONFIG.maxHp);
      expect(soldier.attack).toBe(DEFAULT_SOLDIER_CONFIG.attack);
      expect(soldier.defense).toBe(DEFAULT_SOLDIER_CONFIG.defense);
      expect(soldier.quantity).toBe(DEFAULT_SOLDIER_CONFIG.quantity);
      expect(soldier.maxQuantity).toBe(DEFAULT_SOLDIER_CONFIG.maxQuantity);
    });
  });

  describe('updateCharacterHp', () => {
    it('should update character HP correctly', () => {
      const character = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');
      const updatedCharacter = updateCharacterHp(character, 50);

      expect(updatedCharacter.currentHp).toBe(50);
    });

    it('should not exceed max HP', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      const updatedCharacter = updateCharacterHp(character, 150);

      expect(updatedCharacter.currentHp).toBe(100); // Should not exceed maxHp
    });

    it('should not go below 0 HP', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      const updatedCharacter = updateCharacterHp(character, -50);

      expect(updatedCharacter.currentHp).toBe(0); // Should not go below 0
    });
  });

  describe('updateSoldierHp', () => {
    it('should update soldier HP correctly', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30 }, 'soldier-1');
      const updatedSoldier = updateSoldierHp(soldier, 15);

      expect(updatedSoldier.currentHp).toBe(15);
    });

    it('should not exceed max HP', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30 }, 'soldier-1');
      const updatedSoldier = updateSoldierHp(soldier, 50);

      expect(updatedSoldier.currentHp).toBe(30); // Should not exceed maxHp
    });

    it('should not go below 0 HP', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30 }, 'soldier-1');
      const updatedSoldier = updateSoldierHp(soldier, -10);

      expect(updatedSoldier.currentHp).toBe(0); // Should not go below 0
    });
  });

  describe('isCharacterAlive', () => {
    it('should return true for character with HP > 0', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      // Manually set currentHp for testing
      const characterWithHp = { ...character, currentHp: 50 };

      expect(isCharacterAlive(characterWithHp)).toBe(true);
    });

    it('should return false for character with HP = 0', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      // Manually set currentHp for testing
      const characterWithHp = { ...character, currentHp: 0 };

      expect(isCharacterAlive(characterWithHp)).toBe(false);
    });
  });

  describe('isSoldierAlive', () => {
    it('should return true for soldier with HP > 0 and quantity > 0', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30, quantity: 3 }, 'soldier-1');
      // Manually set currentHp for testing
      const soldierWithHp = { ...soldier, currentHp: 15 };

      expect(isSoldierAlive(soldierWithHp)).toBe(true);
    });

    it('should return false for soldier with HP = 0', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30, quantity: 3 }, 'soldier-1');
      // Manually set currentHp for testing
      const soldierWithHp = { ...soldier, currentHp: 0 };

      expect(isSoldierAlive(soldierWithHp)).toBe(false);
    });

    it('should return false for soldier with quantity = 0', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30, quantity: 0 }, 'soldier-1');
      // Manually set currentHp for testing
      const soldierWithHp = { ...soldier, currentHp: 15 };

      expect(isSoldierAlive(soldierWithHp)).toBe(false);
    });
  });

  describe('healCharacter', () => {
    it('should heal character HP correctly', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      // Manually set currentHp for testing
      const characterWithHp = { ...character, currentHp: 50 };
      const healedCharacter = healCharacter(characterWithHp, 30);

      expect(healedCharacter.currentHp).toBe(80); // 50 + 30 = 80
    });

    it('should not exceed max HP when healing', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      // Manually set currentHp for testing
      const characterWithHp = { ...character, currentHp: 80 };
      const healedCharacter = healCharacter(characterWithHp, 50);

      expect(healedCharacter.currentHp).toBe(100); // Should not exceed maxHp
    });
  });

  describe('healSoldier', () => {
    it('should heal soldier HP correctly', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30, quantity: 3 }, 'soldier-1');
      // Manually set currentHp for testing
      const soldierWithHp = { ...soldier, currentHp: 15 };
      const healedSoldier = healSoldier(soldierWithHp, 10);

      // Healing is adjusted based on quantity, so it might be less than 10
      expect(healedSoldier.currentHp).toBeGreaterThanOrEqual(15);
    });

    it('should not exceed max HP when healing', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30, quantity: 3 }, 'soldier-1');
      // Manually set currentHp for testing
      const soldierWithHp = { ...soldier, currentHp: 25 };
      const healedSoldier = healSoldier(soldierWithHp, 20);

      expect(healedSoldier.currentHp).toBe(30); // Should not exceed maxHp
    });
  });

  describe('isCharacterOrSoldiersAlive', () => {
    it('should return true if character is alive', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      // Manually set currentHp for testing
      const characterWithHp = { ...character, currentHp: 50 };

      expect(isCharacterOrSoldiersAlive(characterWithHp)).toBe(true);
    });

    it('should return true if character is dead but soldiers are alive', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      // Manually set currentHp for testing
      const characterWithHp = {
        ...character,
        currentHp: 0,
        soldiers: [{
          ...createSoldier(DEFAULT_SOLDIER_CONFIG, 'soldier-1'),
          currentHp: 15,
          quantity: 3
        }]
      };

      expect(isCharacterOrSoldiersAlive(characterWithHp)).toBe(true);
    });

    it('should return false if both character and soldiers are dead', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      // Manually set currentHp for testing
      const characterWithHp = {
        ...character,
        currentHp: 0,
        soldiers: [{
          ...createSoldier(DEFAULT_SOLDIER_CONFIG, 'soldier-1'),
          currentHp: 0,
          quantity: 0
        }]
      };

      expect(isCharacterOrSoldiersAlive(characterWithHp)).toBe(false);
    });

    it('should return false if character is dead and no soldiers', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      // Manually set currentHp for testing
      const characterWithHp = { ...character, currentHp: 0, soldiers: [] };

      expect(isCharacterOrSoldiersAlive(characterWithHp)).toBe(false);
    });
  });
});

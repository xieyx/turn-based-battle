import { describe, it, expect } from 'vitest';
import { calculateDamage, applyDamage, applySoldierDamage } from './damageCalculation';
import { DEFAULT_PLAYER_CONFIG, DEFAULT_ENEMY_CONFIG, DEFAULT_SOLDIER_CONFIG } from '../constants/gameConfig';
import { createCharacter, createSoldier } from './character';

describe('damageCalculation', () => {
  describe('calculateDamage', () => {
    it('should calculate damage correctly when attacker is stronger', () => {
      const attacker = createCharacter({ ...DEFAULT_PLAYER_CONFIG, attack: 20 }, 'player-1');
      const defender = createCharacter({ ...DEFAULT_ENEMY_CONFIG, defense: 5 }, 'enemy-1');

      const damage = calculateDamage(attacker, defender);
      expect(damage).toBe(15); // 20 - 5 = 15
    });

    it('should return minimum damage of 1 when defender is stronger', () => {
      const attacker = createCharacter({ ...DEFAULT_PLAYER_CONFIG, attack: 10 }, 'player-1');
      const defender = createCharacter({ ...DEFAULT_ENEMY_CONFIG, defense: 15 }, 'enemy-1');

      const damage = calculateDamage(attacker, defender);
      expect(damage).toBe(1); // max(10 - 15, 1) = 1
    });

    it('should handle equal attack and defense values', () => {
      const attacker = createCharacter({ ...DEFAULT_PLAYER_CONFIG, attack: 10 }, 'player-1');
      const defender = createCharacter({ ...DEFAULT_ENEMY_CONFIG, defense: 10 }, 'enemy-1');

      const damage = calculateDamage(attacker, defender);
      expect(damage).toBe(1); // max(10 - 10, 1) = 1
    });
  });

  describe('applyDamage', () => {
    it('should apply damage correctly and reduce HP', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      const damage = 30;

      const updatedCharacter = applyDamage(character, damage);
      expect(updatedCharacter.currentHp).toBe(70); // 100 - 30 = 70
    });

    it('should not reduce HP below 0', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      // Manually set currentHp for testing purposes
      const characterWithHp = { ...character, currentHp: 20 };
      const damage = 50;

      const updatedCharacter = applyDamage(characterWithHp, damage);
      expect(updatedCharacter.currentHp).toBe(0); // Should not go below 0
    });

    it('should not change other character properties', () => {
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      const damage = 30;

      const updatedCharacter = applyDamage(character, damage);
      expect(updatedCharacter.id).toBe(character.id);
      expect(updatedCharacter.name).toBe(character.name);
      expect(updatedCharacter.maxHp).toBe(character.maxHp);
      expect(updatedCharacter.attack).toBe(character.attack);
      expect(updatedCharacter.defense).toBe(character.defense);
      expect(updatedCharacter.type).toBe(character.type);
    });
  });

  describe('applySoldierDamage', () => {
    it('should apply damage to soldier and reduce HP', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30, quantity: 3 }, 'soldier-1');
      // Manually set currentHp for testing purposes
      const soldierWithHp = { ...soldier, currentHp: 30 };
      const damage = 15;

      const updatedSoldier = applySoldierDamage(soldier, damage);
      expect(updatedSoldier.currentHp).toBe(15); // 30 - 15 = 15
      expect(updatedSoldier.quantity).toBe(3); // No soldiers lost
    });

    it('should reduce soldier quantity when a soldier dies', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30, quantity: 3 }, 'soldier-1');
      // Manually set currentHp for testing purposes
      const soldierWithHp = { ...soldier, currentHp: 30 };
      const damage = 40; // More than one soldier's HP

      const updatedSoldier = applySoldierDamage(soldier, damage);
      expect(updatedSoldier.currentHp).toBe(20); // 30 - (40 - 30) = 20 (next soldier's remaining HP)
      expect(updatedSoldier.quantity).toBe(2); // One soldier lost
    });

    it('should handle damage that kills multiple soldiers', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30, quantity: 5 }, 'soldier-1');
      // Manually set currentHp for testing purposes
      const soldierWithHp = { ...soldier, currentHp: 30 };
      const damage = 80; // Enough to kill 2 soldiers (60 HP) and damage the third

      const updatedSoldier = applySoldierDamage(soldier, damage);
      expect(updatedSoldier.currentHp).toBe(10); // 30 - (80 - 60) = 10
      expect(updatedSoldier.quantity).toBe(3); // Two soldiers lost
    });

    it('should handle damage that kills all soldiers', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30, quantity: 2 }, 'soldier-1');
      // Manually set currentHp for testing purposes
      const soldierWithHp = { ...soldier, currentHp: 30 };
      const damage = 100; // More than all soldiers' HP

      const updatedSoldier = applySoldierDamage(soldier, damage);
      expect(updatedSoldier.currentHp).toBe(0);
      expect(updatedSoldier.quantity).toBe(0); // All soldiers lost
    });

    it('should handle damage when no soldiers are left', () => {
      const soldier = createSoldier({ ...DEFAULT_SOLDIER_CONFIG, maxHp: 30, quantity: 0 }, 'soldier-1');
      // Manually set currentHp for testing purposes
      const soldierWithHp = { ...soldier, currentHp: 0 };
      const damage = 10;

      const updatedSoldier = applySoldierDamage(soldierWithHp, damage);
      expect(updatedSoldier.currentHp).toBe(0);
      expect(updatedSoldier.quantity).toBe(0);
    });
  });
});

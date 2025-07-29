import { describe, it, expect } from 'vitest';
import { canUseItem, useHealingPotion, initializePlayerItems } from './items';
import { DEFAULT_ITEMS } from '../constants/gameConfig';
import { createCharacter } from './character';
import { DEFAULT_PLAYER_CONFIG } from '../constants/gameConfig';

describe('items', () => {
  describe('canUseItem', () => {
    it('should return true for item with quantity > 0', () => {
      const item = { ...DEFAULT_ITEMS[0], id: 'item-1', quantity: 3 };
      expect(canUseItem(item)).toBe(true);
    });

    it('should return false for item with quantity = 0', () => {
      const item = { ...DEFAULT_ITEMS[0], id: 'item-1', quantity: 0 };
      expect(canUseItem(item)).toBe(false);
    });

    it('should return false for item with quantity < 0', () => {
      const item = { ...DEFAULT_ITEMS[0], id: 'item-1', quantity: -1 };
      expect(canUseItem(item)).toBe(false);
    });
  });

  describe('useHealingPotion', () => {
    it('should use healing potion and return updated item and character', () => {
      const item = { ...DEFAULT_ITEMS[0], id: 'item-1', quantity: 3 };
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      // Manually set currentHp for testing
      const characterWithHp = { ...character, currentHp: 50 };

      const result = useHealingPotion(item, characterWithHp);

      expect(result).not.toBeNull();
      if (result) {
        const [updatedItem, updatedCharacter] = result;
        expect(updatedItem.quantity).toBe(2); // 3 - 1 = 2
        expect(updatedCharacter.currentHp).toBe(80); // 50 + 30 = 80
      }
    });

    it('should not exceed max HP when using healing potion', () => {
      const item = { ...DEFAULT_ITEMS[0], id: 'item-1', quantity: 3 };
      const character = createCharacter({ ...DEFAULT_PLAYER_CONFIG, maxHp: 100 }, 'player-1');
      // Manually set currentHp for testing
      const characterWithHp = { ...character, currentHp: 80 };

      const result = useHealingPotion(item, characterWithHp);

      expect(result).not.toBeNull();
      if (result) {
        const [updatedItem, updatedCharacter] = result;
        expect(updatedItem.quantity).toBe(2); // 3 - 1 = 2
        expect(updatedCharacter.currentHp).toBe(100); // Should not exceed maxHp
      }
    });

    it('should return null for item with quantity = 0', () => {
      const item = { ...DEFAULT_ITEMS[0], id: 'item-1', quantity: 0 };
      const character = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');

      const result = useHealingPotion(item, character);

      expect(result).toBeNull();
    });

    it('should return null for non-healing potion item', () => {
      const item = {
        id: 'item-1',
        name: 'Unknown Item',
        type: 'unknown' as any,
        effect: {},
        quantity: 3
      };
      const character = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');

      const result = useHealingPotion(item, character);

      expect(result).toBeNull();
    });

    it('should return null for item without heal effect', () => {
      const item = {
        id: 'item-1',
        name: 'Healing Potion',
        type: 'healing_potion' as const,
        effect: {},
        quantity: 3
      };
      const character = createCharacter(DEFAULT_PLAYER_CONFIG, 'player-1');

      const result = useHealingPotion(item, character);

      expect(result).toBeNull();
    });
  });

  describe('initializePlayerItems', () => {
    it('should initialize player items with correct IDs', () => {
      const items = initializePlayerItems(DEFAULT_ITEMS);

      expect(items.length).toBe(DEFAULT_ITEMS.length);
      items.forEach((item, index) => {
        expect(item.id).toBe(`item-${index}`);
        expect(item.name).toBe(DEFAULT_ITEMS[index].name);
        expect(item.type).toBe(DEFAULT_ITEMS[index].type);
        expect(item.effect).toEqual(DEFAULT_ITEMS[index].effect);
        expect(item.quantity).toBe(DEFAULT_ITEMS[index].quantity);
      });
    });

    it('should create items with correct properties', () => {
      const itemConfigs = [
        { ...DEFAULT_ITEMS[0], quantity: 5 }
      ];
      const items = initializePlayerItems(itemConfigs);

      expect(items.length).toBe(1);
      expect(items[0].id).toBe('item-0');
      expect(items[0].name).toBe('治疗药水');
      expect(items[0].type).toBe('healing_potion');
      expect(items[0].effect.heal).toBe(30);
      expect(items[0].quantity).toBe(5);
    });
  });
});

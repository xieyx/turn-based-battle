import type { Item } from '../types/item';
import type { Character } from '../types/character';
import { healCharacter } from './character';

/**
 * 检查道具是否可用
 * @param item 道具对象
 * @returns 道具是否可用
 */
export function canUseItem(item: Item): boolean {
  return item.quantity > 0;
}

/**
 * 使用治疗药水
 * @param item 道具对象
 * @param character 角色对象
 * @returns [更新后的道具, 更新后的角色] 或 null（如果无法使用）
 */
export function useHealingPotion(
  item: Item,
  character: Character
): [Item, Character] | null {
  if (!canUseItem(item) || item.type !== 'healing_potion' || !item.effect.heal) {
    return null;
  }

  const updatedItem: Item = {
    ...item,
    quantity: item.quantity - 1
  };

  const healedCharacter = healCharacter(character, item.effect.heal);

  return [updatedItem, healedCharacter];
}

/**
 * 初始化玩家道具库存
 * @param itemConfigs 道具配置数组
 * @returns 初始化的道具数组
 */
export function initializePlayerItems(
  itemConfigs: Omit<Item, 'id'>[]
): Item[] {
  return itemConfigs.map((config, index) => ({
    ...config,
    id: `item-${index}`
  }));
}

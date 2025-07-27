import { useGame } from '../context/GameContext';
import type { Item } from '../types/item';

/**
 * 道具相关的Hook
 * 提供道具状态和操作方法
 */
export const useItems = () => {
  const { state } = useGame();

  /**
   * 获取玩家道具列表
   * @returns 玩家道具数组
   */
  const getPlayerItems = (): Item[] => {
    return state.playerItems;
  };

  /**
   * 根据ID获取道具
   * @param id 道具ID
   * @returns 道具对象或undefined
   */
  const getItemById = (id: string): Item | undefined => {
    return state.playerItems.find(item => item.id === id);
  };

  /**
   * 检查道具是否可用
   * @param item 道具对象
   * @returns 道具是否可用
   */
  const canUseItem = (item: Item): boolean => {
    return item.quantity > 0;
  };

  /**
   * 获取治疗药水
   * @returns 治疗药水对象或undefined
   */
  const getHealingPotion = (): Item | undefined => {
    return state.playerItems.find(item => item.type === 'healing_potion');
  };

  return {
    getPlayerItems,
    getItemById,
    canUseItem,
    getHealingPotion
  };
};

import { useGame } from '../context/GameContext';
import type { Character } from '../types/character';

/**
 * 角色相关的Hook
 * 提供角色状态和操作方法
 */
export const useCharacter = () => {
  const { state } = useGame();

  /**
   * 获取玩家角色
   * @returns 玩家角色对象
   */
  const getPlayer = (): Character => {
    return state.player;
  };

  /**
   * 获取敌人角色
   * @returns 敌人角色对象
   */
  const getEnemy = (): Character => {
    return state.enemy;
  };

  /**
   * 检查角色是否存活
   * @param character 角色对象
   * @returns 角色是否存活
   */
  const isAlive = (character: Character): boolean => {
    return character.currentHp > 0;
  };

  /**
   * 获取角色的生命值百分比
   * @param character 角色对象
   * @returns 生命值百分比（0-100）
   */
  const getHpPercentage = (character: Character): number => {
    return (character.currentHp / character.maxHp) * 100;
  };

  return {
    getPlayer,
    getEnemy,
    isAlive,
    getHpPercentage
  };
};

import type { Character, Soldier } from '../types/character';
import { DEFAULT_SOLDIER_CONFIG } from '../constants/gameConfig';

/**
 * 创建角色
 * @param config 角色配置
 * @param id 角色ID
 * @returns 创建的角色对象
 */
export function createCharacter(
  config: Omit<Character, 'id' | 'currentHp'>,
  id: string
): Character {
  // 为角色添加默认士兵
  const characterWithSoldiers: Character = {
    ...config,
    id,
    currentHp: config.maxHp
  };

  // 如果是玩家或敌人，添加默认士兵
  if (config.type === 'player' || config.type === 'enemy') {
    characterWithSoldiers.soldiers = [createSoldier(DEFAULT_SOLDIER_CONFIG, `${id}-soldier-1`)];
  }

  return characterWithSoldiers;
}

/**
 * 创建士兵
 * @param config 士兵配置
 * @param id 士兵ID
 * @returns 创建的士兵对象
 */
export function createSoldier(
  config: Omit<Soldier, 'id' | 'currentHp'>,
  id: string
): Soldier {
  return {
    ...config,
    id,
    currentHp: config.maxHp
  };
}

/**
 * 更新角色生命值
 * @param character 角色对象
 * @param newHp 新的生命值
 * @returns 更新后的角色对象
 */
export function updateCharacterHp(
  character: Character,
  newHp: number
): Character {
  const updatedHp = Math.max(0, Math.min(newHp, character.maxHp));
  return {
    ...character,
    currentHp: updatedHp
  };
}

/**
 * 更新士兵生命值
 * @param soldier 士兵对象
 * @param newHp 新的生命值
 * @returns 更新后的士兵对象
 */
export function updateSoldierHp(
  soldier: Soldier,
  newHp: number
): Soldier {
  const updatedHp = Math.max(0, Math.min(newHp, soldier.maxHp));
  return {
    ...soldier,
    currentHp: updatedHp
  };
}

/**
 * 检查角色是否存活
 * @param character 角色对象
 * @returns 角色是否存活
 */
export function isCharacterAlive(character: Character): boolean {
  return character.currentHp > 0;
}

/**
 * 检查士兵是否存活
 * @param soldier 士兵对象
 * @returns 士兵是否存活
 */
export function isSoldierAlive(soldier: Soldier): boolean {
  return soldier.currentHp > 0 && soldier.quantity > 0;
}

/**
 * 治疗角色
 * @param character 角色对象
 * @param amount 治疗量
 * @returns 治疗后的角色对象
 */
export function healCharacter(
  character: Character,
  amount: number
): Character {
  const newHp = Math.min(character.maxHp, character.currentHp + amount);
  return updateCharacterHp(character, newHp);
}

/**
 * 治疗士兵
 * @param soldier 士兵对象
 * @param amount 治疗量
 * @returns 治疗后的士兵对象
 */
export function healSoldier(
  soldier: Soldier,
  amount: number
): Soldier {
  // 基于士兵数量的治疗逻辑
  // 士兵数量越多，每个士兵获得的治疗量越少
  const adjustedAmount = Math.max(1, Math.floor(amount / Math.sqrt(soldier.quantity)));
  const newHp = Math.min(soldier.maxHp, soldier.currentHp + adjustedAmount);
  return updateSoldierHp(soldier, newHp);
}

/**
 * 检查角色或其士兵是否存活
 * @param character 角色对象
 * @returns 角色或其士兵是否存活
 */
export function isCharacterOrSoldiersAlive(character: Character): boolean {
  // 检查角色本身是否存活
  if (isCharacterAlive(character)) {
    return true;
  }

  // 检查是否有存活的士兵
  if (character.soldiers && character.soldiers.length > 0) {
    return character.soldiers.some(soldier => isSoldierAlive(soldier));
  }

  return false;
}

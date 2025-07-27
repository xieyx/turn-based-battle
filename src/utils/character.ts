import type { Character } from '../types/character';

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
 * 检查角色是否存活
 * @param character 角色对象
 * @returns 角色是否存活
 */
export function isCharacterAlive(character: Character): boolean {
  return character.currentHp > 0;
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

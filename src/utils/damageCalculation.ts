import type { Character } from '../types/character';
import { DAMAGE_CALCULATION } from '../constants/gameConfig';

/**
 * 计算伤害
 * @param attacker 攻击者
 * @param defender 防御者
 * @returns 计算出的伤害值
 */
export function calculateDamage(
  attacker: Character,
  defender: Character
): number {
  const damage = attacker.attack - defender.defense;
  return Math.max(DAMAGE_CALCULATION.MIN_DAMAGE, damage);
}

/**
 * 应用伤害到目标角色
 * @param character 目标角色
 * @param damage 伤害值
 * @returns 应用伤害后的角色对象
 */
export function applyDamage(
  character: Character,
  damage: number
): Character {
  const newHp = Math.max(0, character.currentHp - damage);
  return {
    ...character,
    currentHp: newHp
  };
}

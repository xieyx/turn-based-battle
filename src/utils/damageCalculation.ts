import type { Character, Soldier } from '../types/character';
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
 * 计算对士兵的伤害（考虑士兵数量）
 * @param attacker 攻击者
 * @param defenderSoldier 防御者士兵
 * @returns 计算出的伤害值
 */
export function calculateSoldierDamage(
  attacker: Character,
  defenderSoldier: Soldier
): number {
  // 简化士兵伤害计算，直接使用基础伤害
  const baseDamage = attacker.attack - defenderSoldier.defense;
  return Math.max(DAMAGE_CALCULATION.MIN_DAMAGE, baseDamage);
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

/**
 * 应用伤害到目标士兵（扣除血量换算成相应士兵数量）
 * @param soldier 目标士兵
 * @param damage 伤害值
 * @returns 应用伤害后的士兵对象
 */
export function applySoldierDamage(
  soldier: Soldier,
  damage: number
): Soldier {
  // 创建士兵副本以避免直接修改原士兵对象
  let updatedSoldier = { ...soldier };
  let remainingDamage = damage;

  // 循环处理伤害，直到伤害处理完或士兵全部死亡
  while (remainingDamage > 0 && updatedSoldier.quantity > 0) {
    // 如果当前士兵血量足够承受伤害
    if (updatedSoldier.currentHp > remainingDamage) {
      updatedSoldier.currentHp -= remainingDamage;
      remainingDamage = 0;
    } else {
      // 当前士兵死亡，伤害继续传递
      remainingDamage -= updatedSoldier.currentHp;
      updatedSoldier.quantity -= 1;

      // 如果还有剩余士兵，重置下一个士兵的血量
      if (updatedSoldier.quantity > 0) {
        updatedSoldier.currentHp = updatedSoldier.maxHp;
      } else {
        // 所有士兵都死亡
        updatedSoldier.currentHp = 0;
      }
    }
  }

  return updatedSoldier;
}

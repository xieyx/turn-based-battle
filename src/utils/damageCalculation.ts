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
  let newHp = Math.max(0, soldier.currentHp - damage);
  let newQuantity = soldier.quantity;

  // 如果血量降到0或以下，减少士兵数量
  if (newHp <= 0) {
    // 计算需要减少的士兵数量
    const hpDeficit = damage - soldier.currentHp; // 超出当前士兵生命值的伤害
    const soldiersToRemove = Math.ceil(hpDeficit / soldier.maxHp) + 1; // 至少减少1个士兵
    newQuantity = Math.max(0, soldier.quantity - soldiersToRemove);
    // 重置剩余士兵的血量为满血
    if (newQuantity > 0) {
      newHp = soldier.maxHp;
    }
  }

  return {
    ...soldier,
    currentHp: newHp,
    quantity: newQuantity
  };
}

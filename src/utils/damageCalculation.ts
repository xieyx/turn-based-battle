import type { BattleState, DamageRecord } from '../types/battle';
import type { Character, Soldier } from '../types/character';
import { DAMAGE_CALCULATION } from '../constants/gameConfig';

/**
 * 计算伤害
 * @param attacker 攻击者
 * @param defender 防御者
 * @returns 计算出的伤害值
 */
export function calculateDamage(
  attacker: Character | Soldier,
  defender: Character | Soldier
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


/**
 * 计算战斗伤害
 * @param state 战斗状态
 * @returns 计算出的伤害记录数组
 */
export function calculateBattleDamages(state: BattleState): DamageRecord[] {
  const damageRecords: DamageRecord[] = [];

  // 创建临时的士兵状态来跟踪在战斗过程中士兵的死亡情况
  let tempPlayerSoldiers = state.player.soldiers ? [...state.player.soldiers] : [];
  let tempEnemySoldiers = state.enemy.soldiers ? [...state.enemy.soldiers] : [];

  // 玩家攻击敌人（玩家角色和玩家士兵都能攻击）
  if (isCharacterAlive(state.player)) {
    // 玩家角色攻击
    const playerDamage = calculateDamage(state.player, state.enemy);

    // 检查敌人的作战梯队来确定攻击目标
    if (state.enemy.formation === 'soldiers-first' && tempEnemySoldiers.length > 0) {
      // 寻找存活的敌人士兵
      let targetSoldier = tempEnemySoldiers[0];
      let soldierIndex = 0;
      while (soldierIndex < tempEnemySoldiers.length && !isSoldierAlive(targetSoldier)) {
        soldierIndex++;
        if (soldierIndex < tempEnemySoldiers.length) {
          targetSoldier = tempEnemySoldiers[soldierIndex];
        }
      }

      if (soldierIndex < tempEnemySoldiers.length && isSoldierAlive(targetSoldier)) {
        // 攻击敌人士兵
        damageRecords.push({
          attackerId: state.player.id,
          attackerName: state.player.name,
          targetId: state.enemy.id,
          targetName: state.enemy.name,
          damage: playerDamage,
          targetType: 'soldier',
          soldierId: targetSoldier.id,
          soldierName: targetSoldier.name
        });
      } else {
        // 没有存活的士兵，攻击敌人角色
        damageRecords.push({
          attackerId: state.player.id,
          attackerName: state.player.name,
          targetId: state.enemy.id,
          targetName: state.enemy.name,
          damage: playerDamage,
          targetType: 'character'
        });
      }
    } else {
      // 攻击敌人角色
      damageRecords.push({
        attackerId: state.player.id,
        attackerName: state.player.name,
        targetId: state.enemy.id,
        targetName: state.enemy.name,
        damage: playerDamage,
        targetType: 'character'
      });
    }

    // 玩家士兵攻击敌人
    if (state.player.soldiers && state.player.soldiers.length > 0) {
      const aliveSoldiers = state.player.soldiers.filter(soldier => isSoldierAlive(soldier));
      for (const soldier of aliveSoldiers) {
        const soldierDamage = calculateDamage(soldier, state.enemy);

        // 检查敌人的作战梯队来确定攻击目标
        if (state.enemy.formation === 'soldiers-first' && tempEnemySoldiers.length > 0) {
          // 寻找存活的敌人士兵
          let targetSoldier = tempEnemySoldiers[0];
          let soldierIndex = 0;
          while (soldierIndex < tempEnemySoldiers.length && !isSoldierAlive(targetSoldier)) {
            soldierIndex++;
            if (soldierIndex < tempEnemySoldiers.length) {
              targetSoldier = tempEnemySoldiers[soldierIndex];
            }
          }

          if (soldierIndex < tempEnemySoldiers.length && isSoldierAlive(targetSoldier)) {
            // 攻击敌人士兵
            damageRecords.push({
              attackerId: soldier.id,
              attackerName: `${state.player.name} 的 ${soldier.name}`,
              targetId: state.enemy.id,
              targetName: state.enemy.name,
              damage: soldierDamage,
              targetType: 'soldier',
              soldierId: targetSoldier.id,
              soldierName: targetSoldier.name
            });
          } else {
            // 没有存活的士兵，攻击敌人角色
            damageRecords.push({
              attackerId: soldier.id,
              attackerName: `${state.player.name} 的 ${soldier.name}`,
              targetId: state.enemy.id,
              targetName: state.enemy.name,
              damage: soldierDamage,
              targetType: 'character'
            });
          }
        } else {
          // 攻击敌人角色
          damageRecords.push({
            attackerId: soldier.id,
            attackerName: `${state.player.name} 的 ${soldier.name}`,
            targetId: state.enemy.id,
            targetName: state.enemy.name,
            damage: soldierDamage,
            targetType: 'character'
          });
        }
      }
    }
  }

  // 敌人攻击玩家（敌人角色和敌人士兵都能攻击）
  if (isCharacterAlive(state.enemy)) {
    // 敌人角色攻击
    const enemyDamage = calculateDamage(state.enemy, state.player);

    // 检查玩家的作战梯队来确定攻击目标
    if (state.player.formation === 'soldiers-first' && tempPlayerSoldiers.length > 0) {
      // 寻找存活的玩家士兵
      let targetSoldier = tempPlayerSoldiers[0];
      let soldierIndex = 0;
      while (soldierIndex < tempPlayerSoldiers.length && !isSoldierAlive(targetSoldier)) {
        soldierIndex++;
        if (soldierIndex < tempPlayerSoldiers.length) {
          targetSoldier = tempPlayerSoldiers[soldierIndex];
        }
      }

      if (soldierIndex < tempPlayerSoldiers.length && isSoldierAlive(targetSoldier)) {
        // 攻击玩家士兵
        damageRecords.push({
          attackerId: state.enemy.id,
          attackerName: state.enemy.name,
          targetId: state.player.id,
          targetName: state.player.name,
          damage: enemyDamage,
          targetType: 'soldier',
          soldierId: targetSoldier.id,
          soldierName: targetSoldier.name
        });
      } else {
        // 没有存活的士兵，攻击玩家角色
        damageRecords.push({
          attackerId: state.enemy.id,
          attackerName: state.enemy.name,
          targetId: state.player.id,
          targetName: state.player.name,
          damage: enemyDamage,
          targetType: 'character'
        });
      }
    } else {
      // 攻击玩家角色
      damageRecords.push({
        attackerId: state.enemy.id,
        attackerName: state.enemy.name,
        targetId: state.player.id,
        targetName: state.player.name,
        damage: enemyDamage,
        targetType: 'character'
      });
    }

    // 敌人士兵攻击玩家
    if (state.enemy.soldiers && state.enemy.soldiers.length > 0) {
      const aliveSoldiers = state.enemy.soldiers.filter(soldier => isSoldierAlive(soldier));
      for (const soldier of aliveSoldiers) {
        const soldierDamage = calculateDamage(soldier, state.player);

        // 检查玩家的作战梯队来确定攻击目标
        if (state.player.formation === 'soldiers-first' && tempPlayerSoldiers.length > 0) {
          // 寻找存活的玩家士兵
          let targetSoldier = tempPlayerSoldiers[0];
          let soldierIndex = 0;
          while (soldierIndex < tempPlayerSoldiers.length && !isSoldierAlive(targetSoldier)) {
            soldierIndex++;
            if (soldierIndex < tempPlayerSoldiers.length) {
              targetSoldier = tempPlayerSoldiers[soldierIndex];
            }
          }

          if (soldierIndex < tempPlayerSoldiers.length && isSoldierAlive(targetSoldier)) {
            // 攻击玩家士兵
            damageRecords.push({
              attackerId: soldier.id,
              attackerName: `${state.enemy.name} 的 ${soldier.name}`,
              targetId: state.player.id,
              targetName: state.player.name,
              damage: soldierDamage,
              targetType: 'soldier',
              soldierId: targetSoldier.id,
              soldierName: targetSoldier.name
            });
          } else {
            // 没有存活的士兵，攻击玩家角色
            damageRecords.push({
              attackerId: soldier.id,
              attackerName: `${state.enemy.name} 的 ${soldier.name}`,
              targetId: state.player.id,
              targetName: state.player.name,
              damage: soldierDamage,
              targetType: 'character'
            });
          }
        } else {
          // 攻击玩家角色
          damageRecords.push({
            attackerId: soldier.id,
            attackerName: `${state.enemy.name} 的 ${soldier.name}`,
            targetId: state.player.id,
            targetName: state.player.name,
            damage: soldierDamage,
            targetType: 'character'
          });
        }
      }
    }
  }

  return damageRecords;
}

/**
 * 检查角色是否存活
 * @param character 角色对象
 * @returns 角色是否存活
 */
function isCharacterAlive(character: Character): boolean {
  return character.currentHp > 0;
}

/**
 * 检查士兵是否存活
 * @param soldier 士兵对象
 * @returns 士兵是否存活
 */
function isSoldierAlive(soldier: Soldier): boolean {
  return soldier.currentHp > 0 && soldier.quantity > 0;
}

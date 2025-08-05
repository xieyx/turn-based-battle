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
 * 应用伤害到目标士兵（严格遵循单目标承伤机制）
 * @param soldier 目标士兵
 * @param damage 伤害值
 * @returns 应用伤害后的士兵对象
 */
export function applySoldierDamage(
  soldier: Soldier,
  damage: number
): Soldier {
  // 创建士兵副本以避免直接修改原士兵对象
  const updatedSoldier = { ...soldier };

  // 伤害未超出当前士兵血量
  if (damage < updatedSoldier.currentHp) {
    updatedSoldier.currentHp -= damage;
  }
  // 伤害超出当前士兵血量
  else {
    // 精确计算需要减少的士兵数量（根据设计文档公式）
    const excessDamage = damage - updatedSoldier.currentHp;
    const soldiersLost = Math.floor(excessDamage / updatedSoldier.maxHp) + 1;

    // 更新士兵数量
    updatedSoldier.quantity = Math.max(0, updatedSoldier.quantity - soldiersLost);

    // 计算新血量（如果还有士兵剩余）
    if (updatedSoldier.quantity > 0) {
      const remainingDamage = excessDamage % updatedSoldier.maxHp;
      updatedSoldier.currentHp = updatedSoldier.maxHp - remainingDamage;
    } else {
      // 当士兵全部阵亡时，确保数量为0且HP为0
      updatedSoldier.quantity = 0;
      updatedSoldier.currentHp = 0;
    }
  }

  return updatedSoldier;
}


/**
 * 处理单个攻击者的攻击逻辑
 * @param attacker 攻击者（角色）
 * @param attackerSoldiers 攻击方的士兵数组
 * @param defender 防御者（角色）
 * @param defenderSoldiers 防御方的士兵数组
 * @param damageRecords 伤害记录数组
 */
function processAttack(
  attacker: Character,
  attackerSoldiers: Soldier[],
  defender: Character,
  defenderSoldiers: Soldier[],
  damageRecords: DamageRecord[]
) {
  if (!isCharacterAlive(attacker)) return;

  // 处理士兵攻击（先找目标再计算伤害）
  const aliveSoldiers = attackerSoldiers.filter(soldier => isSoldierAlive(soldier));
  for (const soldier of aliveSoldiers) {
    const soldierTarget = findAttackTarget(defender, defenderSoldiers);
    const soldierDamage = calculateDamage(soldier, soldierTarget.targetType === 'soldier' && soldierTarget.soldier ? soldierTarget.soldier : defender);

    damageRecords.push(createDamageRecord(
      soldier,
      defender,
      soldierDamage,
      soldierTarget,
      attacker.name
    ));

    // 如果攻击目标是士兵，需要更新defenderSoldiers数组以反映士兵状态的变化
    if (soldierTarget.targetType === 'soldier' && soldierTarget.soldier) {
      const soldierIndex = defenderSoldiers.findIndex(s => s.id === soldierTarget.soldier!.id);
      if (soldierIndex !== -1) {
        // 应用伤害到目标士兵并更新数组
        const updatedSoldier = applySoldierDamage(soldierTarget.soldier!, soldierDamage);
        defenderSoldiers[soldierIndex] = updatedSoldier;

        // 如果士兵已经死亡，从数组中移除
        if (updatedSoldier.quantity <= 0) {
          defenderSoldiers.splice(soldierIndex, 1);
        }
      }
    }
  }

  // 处理角色攻击（先找目标再计算伤害）
  const target = findAttackTarget(defender, defenderSoldiers);
  const characterDamage = calculateDamage(attacker, target.targetType === 'soldier' && target.soldier ? target.soldier : defender);

  damageRecords.push(createDamageRecord(
    attacker,
    defender,
    characterDamage,
    target
  ));

  // 如果攻击目标是士兵，需要更新defenderSoldiers数组以反映士兵状态的变化
  if (target.targetType === 'soldier' && target.soldier) {
    const soldierIndex = defenderSoldiers.findIndex(s => s.id === target.soldier!.id);
    if (soldierIndex !== -1) {
      // 应用伤害到目标士兵并更新数组
      const updatedSoldier = applySoldierDamage(target.soldier!, characterDamage);
      defenderSoldiers[soldierIndex] = updatedSoldier;

      // 如果士兵已经死亡，从数组中移除
      if (updatedSoldier.quantity <= 0) {
        defenderSoldiers.splice(soldierIndex, 1);
      }
    }
  }
}

/**
 * 寻找攻击目标
 * @param defender 防御者角色
 * @param defenderSoldiers 防御方士兵数组
 * @returns 攻击目标信息
 */
function findAttackTarget(
  defender: Character,
  defenderSoldiers: Soldier[]
): { targetType: 'character' | 'soldier'; soldier?: Soldier } {
  if (defender.formation === 'soldiers-first' && defenderSoldiers.length > 0) {
    const aliveSoldier = defenderSoldiers.find(s => isSoldierAlive(s));
    if (aliveSoldier) {
      return { targetType: 'soldier', soldier: aliveSoldier };
    }
  }
  return { targetType: 'character' };
}

/**
 * 创建伤害记录
 * @param attacker 攻击者（角色或士兵）
 * @param defender 防御者角色
 * @param damage 伤害值
 * @param target 攻击目标信息
 * @param ownerName 士兵所属角色名（当攻击者是士兵时）
 * @returns 伤害记录对象
 */
function createDamageRecord(
  attacker: Character | Soldier,
  defender: Character,
  damage: number,
  target: { targetType: 'character' | 'soldier'; soldier?: Soldier },
  ownerName?: string
): DamageRecord {
  const isSoldier = 'quantity' in attacker;
  const attackerName = isSoldier
    ? `${ownerName} 的 ${attacker.name}`
    : attacker.name;

  const commonFields = {
    attackerId: attacker.id,
    attackerName,
    targetId: defender.id,
    targetName: defender.name,
    damage,
    targetType: target.targetType,
  };

  if (target.targetType === 'soldier' && target.soldier) {
    return {
      ...commonFields,
      soldierId: target.soldier.id,
      soldierName: target.soldier.name
    };
  }

  return commonFields;
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

  // 过滤掉已经阵亡的士兵（数量为0的）
  tempPlayerSoldiers = tempPlayerSoldiers.filter(s => s.quantity > 0);
  tempEnemySoldiers = tempEnemySoldiers.filter(s => s.quantity > 0);

  // 玩家攻击敌人
  processAttack(
    state.player,
    state.player.soldiers || [],
    state.enemy,
    tempEnemySoldiers,
    damageRecords
  );

  // 敌人攻击玩家
  processAttack(
    state.enemy,
    state.enemy.soldiers || [],
    state.player,
    tempPlayerSoldiers,
    damageRecords
  );

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

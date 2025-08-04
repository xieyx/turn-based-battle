import type { Character, Soldier, BattleFormation } from '../types/character';
import { DEFAULT_SOLDIER_CONFIG } from '../constants/gameConfig';

/**
 * 创建默认的战斗梯队
 * @returns 默认的战斗梯队配置
 */
export function createDefaultBattleFormation(): BattleFormation {
  return {
    frontline: [{ slot1: 'empty', slot2: 'empty', slot3: 'empty' }],
    backline1: [{ slot1: 'empty', slot2: 'empty', slot3: 'empty' }],
    backline2: [{ slot1: 'empty', slot2: 'empty', slot3: 'empty' }],
    backline3: [{ slot1: 'empty', slot2: 'empty', slot3: 'empty' }],
    reserve: []
  };
}

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

  // 如果没有设置战斗梯队，创建默认的战斗梯队
  if (!characterWithSoldiers.battleFormation) {
    characterWithSoldiers.battleFormation = createDefaultBattleFormation();
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

/**
 * 将单位添加到梯队中
 * @param character 角色对象
 * @param unitType 单位类型 ('player' | 'soldier')
 * @param tier 梯队索引 (0-3表示前4个梯队，4表示预备队)
 * @param position 梯队中的位置索引
 * @param slot 槽位索引 (0-2)
 * @returns 更新后的角色对象
 */
export function assignUnitToFormation(
  character: Character,
  unitType: 'player' | 'soldier',
  tier: number,
  position: number,
  slot: number
): Character {
  if (!character.battleFormation) {
    character.battleFormation = createDefaultBattleFormation();
  }

  const formation = { ...character.battleFormation };

  // 确保梯队数组足够长
  const ensureTierLength = (tierArray: any[], minLength: number) => {
    while (tierArray.length < minLength) {
      tierArray.push({ slot1: 'empty', slot2: 'empty', slot3: 'empty' });
    }
  };

  // 根据梯队索引确定要操作的梯队
  let targetTier: any[];
  switch (tier) {
    case 0: // 第一梯队
      ensureTierLength(formation.frontline, position + 1);
      targetTier = formation.frontline;
      break;
    case 1: // 第二梯队
      ensureTierLength(formation.backline1, position + 1);
      targetTier = formation.backline1;
      break;
    case 2: // 第三梯队
      ensureTierLength(formation.backline2, position + 1);
      targetTier = formation.backline2;
      break;
    case 3: // 第四梯队
      ensureTierLength(formation.backline3, position + 1);
      targetTier = formation.backline3;
      break;
    case 4: // 预备队
      // 预备队直接添加单位类型
      formation.reserve.push(unitType);
      return { ...character, battleFormation: formation };
    default:
      throw new Error('无效的梯队索引');
  }

  // 确保位置存在
  if (position >= targetTier.length) {
    ensureTierLength(targetTier, position + 1);
  }

  // 设置槽位
  const slotKey = `slot${slot + 1}` as 'slot1' | 'slot2' | 'slot3';
  targetTier[position][slotKey] = unitType;

  return { ...character, battleFormation: formation };
}

/**
 * 从梯队中移除单位
 * @param character 角色对象
 * @param tier 梯队索引 (0-3表示前4个梯队，4表示预备队)
 * @param position 梯队中的位置索引
 * @param slot 槽位索引 (0-2)
 * @returns 更新后的角色对象
 */
export function removeUnitFromFormation(
  character: Character,
  tier: number,
  position: number,
  slot: number
): Character {
  if (!character.battleFormation) {
    return character;
  }

  const formation = { ...character.battleFormation };

  // 根据梯队索引确定要操作的梯队
  let targetTier: any[];
  switch (tier) {
    case 0: // 第一梯队
      targetTier = formation.frontline;
      break;
    case 1: // 第二梯队
      targetTier = formation.backline1;
      break;
    case 2: // 第三梯队
      targetTier = formation.backline2;
      break;
    case 3: // 第四梯队
      targetTier = formation.backline3;
      break;
    case 4: // 预备队
      if (formation.reserve.length > 0) {
        formation.reserve.pop();
      }
      return { ...character, battleFormation: formation };
    default:
      return character;
  }

  // 检查位置和槽位是否存在
  if (position < targetTier.length) {
    const slotKey = `slot${slot + 1}` as 'slot1' | 'slot2' | 'slot3';
    targetTier[position][slotKey] = 'empty';
  }

  return { ...character, battleFormation: formation };
}

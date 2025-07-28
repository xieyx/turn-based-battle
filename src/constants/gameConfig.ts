import type { Character, Soldier } from '../types/character';
import type { Item } from '../types/item';

// 默认角色属性配置
export const DEFAULT_PLAYER_CONFIG: Omit<Character, 'id' | 'currentHp'> = {
  name: '勇士',
  maxHp: 100,
  attack: 20,
  defense: 5,
  type: 'player',
  formation: 'player-first' // 默认玩家在前
};

export const DEFAULT_ENEMY_CONFIG: Omit<Character, 'id' | 'currentHp'> = {
  name: '哥布林',
  maxHp: 80,
  attack: 15,
  defense: 3,
  type: 'enemy',
  formation: 'soldiers-first' // 默认士兵在前
};

// 默认士兵配置
export const DEFAULT_SOLDIER_CONFIG: Omit<Soldier, 'id' | 'currentHp'> = {
  name: '剑士',
  maxHp: 30,
  attack: 10,
  defense: 2,
  quantity: 3,
  maxQuantity: 5
};

// 默认道具配置
export const DEFAULT_ITEMS: Omit<Item, 'id'>[] = [
  {
    name: '治疗药水',
    type: 'healing_potion',
    effect: {
      heal: 30
    },
    quantity: 5
  }
];

// 伤害计算参数
export const DAMAGE_CALCULATION = {
  MIN_DAMAGE: 1
};

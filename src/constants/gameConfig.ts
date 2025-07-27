import type { Character } from '../types/character';
import type { Item } from '../types/item';

// 默认角色属性配置
export const DEFAULT_PLAYER_CONFIG: Omit<Character, 'id' | 'currentHp'> = {
  name: '勇士',
  maxHp: 100,
  attack: 20,
  defense: 5,
  type: 'player'
};

export const DEFAULT_ENEMY_CONFIG: Omit<Character, 'id' | 'currentHp'> = {
  name: '哥布林',
  maxHp: 80,
  attack: 15,
  defense: 3,
  type: 'enemy'
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

export interface Character {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  type: 'player' | 'enemy';
  soldiers?: Soldier[];
  formation?: 'soldiers-first' | 'player-first'; // 作战梯队
}

export interface Soldier {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  quantity: number; // 士兵数量
  maxQuantity: number; // 最大士兵数量
}

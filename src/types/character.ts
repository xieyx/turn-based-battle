export type FormationSlot = 'empty' | 'player' | 'soldier';

export interface FormationPosition {
  slot1: FormationSlot;
  slot2: FormationSlot;
  slot3: FormationSlot;
}

export interface BattleFormation {
  // 前4个梯队，每个梯队最多3个作战单位
  frontline: FormationPosition[]; // 第1梯队
  backline1: FormationPosition[]; // 第2梯队
  backline2: FormationPosition[]; // 第3梯队
  backline3: FormationPosition[]; // 第4梯队
  // 第5个梯队，不限制数量但不参与作战
  reserve: ('player' | 'soldier')[];
}

export interface Character {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  type: 'player' | 'enemy';
  soldiers?: Soldier[];
  battleFormation?: BattleFormation; // 战斗梯队系统
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

// 战斗梯队中的位置
export interface FormationPosition {
  slot1: 'empty' | 'player' | 'soldier';
  slot2: 'empty' | 'player' | 'soldier';
  slot3: 'empty' | 'player' | 'soldier';
}

// 战斗梯队系统
export interface BattleFormation {
  frontline: FormationPosition[];    // 第一梯队（前线）
  backline1: FormationPosition[];    // 第二梯队
  backline2: FormationPosition[];    // 第三梯队
  backline3: FormationPosition[];    // 第四梯队
  reserve: ('player' | 'soldier')[]; // 第五梯队（预备队，不参与战斗）
}

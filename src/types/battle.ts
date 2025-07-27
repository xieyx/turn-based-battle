import type { Character } from './character';
import type { Item } from './item';

export type BattlePhase = 'preparation' | 'battle' | 'resolution';

export interface BattleAction {
  attackerId: string;
  targetId: string;
}

export interface BattleLogEntry {
  phase: BattlePhase;
  message: string;
  round: number;
}

export interface BattleState {
  currentRound: number;
  currentPhase: BattlePhase;
  player: Character;
  enemy: Character;
  playerItems: Item[];
  battleLog: BattleLogEntry[];
  pendingActions: BattleAction[];
  isGameOver: boolean;
  winner?: 'player' | 'enemy';
  preparationTimer?: number; // 准备阶段倒计时（秒）
  preparationActionTaken?: boolean; // 准备阶段是否已采取行动
  pendingItemUse?: {
    itemId: string;
    targetId: string;
  }; // 准备阶段选择使用的道具
}

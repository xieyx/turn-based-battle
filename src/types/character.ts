export interface Character {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  type: 'player' | 'enemy';
}

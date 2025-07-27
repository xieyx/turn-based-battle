export type ItemType = 'healing_potion';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  effect: {
    heal?: number;
  };
  quantity: number;
}

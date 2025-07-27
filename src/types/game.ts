export enum GameErrorType {
  INVALID_ACTION = 'INVALID_ACTION',
  INSUFFICIENT_ITEMS = 'INSUFFICIENT_ITEMS',
  BATTLE_ALREADY_ENDED = 'BATTLE_ALREADY_ENDED',
  INVALID_PHASE = 'INVALID_PHASE',
  CHARACTER_DEAD = 'CHARACTER_DEAD'
}

export class GameError extends Error {
  constructor(
    public type: GameErrorType,
    message: string,
    public context?: any
  ) {
    super(message);
  }
}

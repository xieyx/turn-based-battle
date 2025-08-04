import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { BattleState } from '../types/battle';
import {
  initializeBattle,
  startPreparationPhase,
  startBattlePhase,
  startResolutionPhase,
  nextRound,
  selectItem,
  enterBattle,
  attack,
  resetBattle,
  decreasePreparationTimer,
  markPreparationActionTaken,
  autoExecuteBattlePhase,
  autoProceedToNextRound,
  toggleFormation
} from '../utils/battleLogic';
import { processEnemyTurn } from '../ai/enemyAI';
import {
  createCharacter
} from '../utils/character';
import { initializePlayerItems } from '../utils/items';
import {
  DEFAULT_PLAYER_CONFIG,
  DEFAULT_ENEMY_CONFIG,
  DEFAULT_ITEMS
} from '../constants/gameConfig';

// 初始化游戏状态
const createInitialGameState = (): BattleState => {
  const player = createCharacter(DEFAULT_PLAYER_CONFIG, 'player');
  const enemy = createCharacter(DEFAULT_ENEMY_CONFIG, 'enemy');
  const playerItems = initializePlayerItems(DEFAULT_ITEMS);

  return initializeBattle(player, enemy, playerItems);
};

// Action类型定义
type GameAction =
  | { type: 'START_PREPARATION_PHASE' }
  | { type: 'START_BATTLE_PHASE' }
  | { type: 'START_RESOLUTION_PHASE' }
  | { type: 'NEXT_ROUND' }
  | { type: 'USE_ITEM'; payload: string }
  | { type: 'ENTER_BATTLE' }
  | { type: 'ATTACK'; payload: string }
  | { type: 'PROCESS_ENEMY_TURN' }
  | { type: 'RESET_BATTLE' }
  | { type: 'DECREASE_PREPARATION_TIMER' }
  | { type: 'MARK_PREPARATION_ACTION_TAKEN' }
  | { type: 'AUTO_EXECUTE_BATTLE_PHASE' }
  | { type: 'AUTO_PROCEED_TO_NEXT_ROUND' }
  | { type: 'TOGGLE_FORMATION' };

// Reducer函数
const gameReducer = (state: BattleState, action: GameAction): BattleState => {
  switch (action.type) {
    case 'START_PREPARATION_PHASE':
      return startPreparationPhase(state);
    case 'START_BATTLE_PHASE':
      return startBattlePhase(state);
    case 'START_RESOLUTION_PHASE':
      return startResolutionPhase(state);
    case 'NEXT_ROUND':
      return nextRound(state);
    case 'USE_ITEM':
      return selectItem(state, action.payload);
    case 'ENTER_BATTLE':
      return enterBattle(state);
    case 'ATTACK':
      return attack(state, action.payload);
    case 'PROCESS_ENEMY_TURN':
      return processEnemyTurn(state);
    case 'RESET_BATTLE':
      const initialState = createInitialGameState();
      return resetBattle(initialState);
    case 'DECREASE_PREPARATION_TIMER':
      return decreasePreparationTimer(state);
    case 'MARK_PREPARATION_ACTION_TAKEN':
      return markPreparationActionTaken(state);
    case 'AUTO_EXECUTE_BATTLE_PHASE':
      return autoExecuteBattlePhase(state);
    case 'AUTO_PROCEED_TO_NEXT_ROUND':
      return autoProceedToNextRound(state);
    case 'TOGGLE_FORMATION':
      return toggleFormation(state);
    default:
      return state;
  }
};

// Context类型定义
interface GameContextType {
  state: BattleState;
  dispatch: React.Dispatch<GameAction>;
  startPreparationPhase: () => void;
  startBattlePhase: () => void;
  startResolutionPhase: () => void;
  nextRound: () => void;
  useItem: (itemId: string) => void;
  enterBattle: () => void;
  attack: (targetId: string) => void;
  processEnemyTurn: () => void;
  resetBattle: () => void;
  decreasePreparationTimer: () => void;
  markPreparationActionTaken: () => void;
  autoExecuteBattlePhase: () => void;
  autoProceedToNextRound: () => void;
  toggleFormation: () => void;
}

// 创建Context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider组件
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);

  // Action creators
  const startPreparationPhase = () => {
    dispatch({ type: 'START_PREPARATION_PHASE' });
  };

  const startBattlePhase = () => {
    dispatch({ type: 'START_BATTLE_PHASE' });
  };

  const startResolutionPhase = () => {
    dispatch({ type: 'START_RESOLUTION_PHASE' });
  };

  const nextRound = () => {
    dispatch({ type: 'NEXT_ROUND' });
  };

  const useItem = (itemId: string) => {
    dispatch({ type: 'USE_ITEM', payload: itemId });
  };

  const enterBattle = () => {
    dispatch({ type: 'ENTER_BATTLE' });
  };

  const attack = (targetId: string) => {
    dispatch({ type: 'ATTACK', payload: targetId });
  };

  const processEnemyTurn = () => {
    dispatch({ type: 'PROCESS_ENEMY_TURN' });
  };

  const resetBattle = () => {
    dispatch({ type: 'RESET_BATTLE' });
  };

  const decreasePreparationTimer = () => {
    dispatch({ type: 'DECREASE_PREPARATION_TIMER' });
  };

  const markPreparationActionTaken = () => {
    dispatch({ type: 'MARK_PREPARATION_ACTION_TAKEN' });
  };

  const autoExecuteBattlePhase = () => {
    dispatch({ type: 'AUTO_EXECUTE_BATTLE_PHASE' });
  };

  const autoProceedToNextRound = () => {
    dispatch({ type: 'AUTO_PROCEED_TO_NEXT_ROUND' });
  };

  const toggleFormation = () => {
    dispatch({ type: 'TOGGLE_FORMATION' });
  };

  const value = {
    state,
    dispatch,
    startPreparationPhase,
    startBattlePhase,
    startResolutionPhase,
    nextRound,
    useItem,
    enterBattle,
    attack,
    processEnemyTurn,
    resetBattle,
    decreasePreparationTimer,
    markPreparationActionTaken,
    autoExecuteBattlePhase,
    autoProceedToNextRound,
    toggleFormation
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

// 自定义Hook
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

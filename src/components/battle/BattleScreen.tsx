import React from 'react';
import { useBattle } from '../../hooks/useBattle';
import { useCharacter } from '../../hooks/useCharacter';
import { useItems } from '../../hooks/useItems';
import { CharacterPanel, BattlePhasePanel, ActionPanel, BattleLog } from './';

/**
 * 战斗主屏幕组件
 * 集成所有战斗相关的子组件
 */
export const BattleScreen: React.FC = () => {
  const { battleState, resetBattle } = useBattle();
  const { getPlayer, getEnemy } = useCharacter();
  const { getHealingPotion } = useItems();

  const player = getPlayer();
  const enemy = getEnemy();
  const healingPotion = getHealingPotion();

  // 检查战斗是否结束
  const isGameOver = battleState.isGameOver;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">回合制战斗</h1>

        {/* 战斗阶段指示器 */}
        <BattlePhasePanel
          currentRound={battleState.currentRound}
          currentPhase={battleState.currentPhase}
          preparationTimer={battleState.preparationTimer}
        />

        {/* 角色信息面板 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <CharacterPanel
            character={player}
            isPlayer={true}
          />
          <CharacterPanel
            character={enemy}
            isPlayer={false}
          />
        </div>

        {/* 道具信息 */}
        {healingPotion && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">道具</h2>
            <p>治疗药水: {healingPotion.quantity} 个</p>
          </div>
        )}

        {/* 玩家操作面板 */}
        <ActionPanel
          currentPhase={battleState.currentPhase}
          healingPotion={healingPotion}
          preparationTimer={battleState.preparationTimer}
        />

        {/* 战斗日志 */}
        <BattleLog
          logs={battleState.battleLog}
        />

        {/* 游戏结束提示 */}
        {isGameOver && (
          <div className="mt-6 p-4 bg-blue-900 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-2">
              {battleState.winner === 'player' ? '胜利!' : '失败!'}
            </h2>
            <p className="mb-4">
              {battleState.winner === 'player'
                ? '恭喜你赢得了战斗!'
                : '很遗憾，你被击败了。'}
            </p>
            <button
              onClick={resetBattle}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              重新开始
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

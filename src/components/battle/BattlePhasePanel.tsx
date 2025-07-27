import React from 'react';
import type { BattlePhase } from '../../types/battle';

interface BattlePhasePanelProps {
  currentRound: number;
  currentPhase: BattlePhase;
  preparationTimer?: number;
}

/**
 * 战斗阶段指示器组件
 * 显示当前回合数和阶段状态
 */
export const BattlePhasePanel: React.FC<BattlePhasePanelProps> = ({
  currentRound,
  currentPhase,
  preparationTimer
}) => {
  // 获取阶段名称
  const getPhaseName = (phase: BattlePhase): string => {
    switch (phase) {
      case 'preparation': return '准备阶段';
      case 'battle': return '战斗阶段';
      case 'resolution': return '结算阶段';
      default: return '未知阶段';
    }
  };

  // 获取阶段颜色
  const getPhaseColor = (phase: BattlePhase): string => {
    switch (phase) {
      case 'preparation': return 'bg-blue-500';
      case 'battle': return 'bg-red-500';
      case 'resolution': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">第 {currentRound} 回合</h2>
        </div>
        <div className="flex items-center space-x-4">
          <span className="mr-2">当前阶段:</span>
          <span className={`px-3 py-1 rounded-full ${getPhaseColor(currentPhase)} text-white`}>
            {getPhaseName(currentPhase)}
          </span>
          {currentPhase === 'preparation' && preparationTimer !== undefined && (
            <span className="px-3 py-1 bg-gray-700 rounded-full">
              倒计时: {preparationTimer}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

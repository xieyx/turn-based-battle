import React from 'react';
import type { BattleLogEntry } from '../../types/battle';

interface BattleLogProps {
  logs: BattleLogEntry[];
}

/**
 * 战斗日志组件
 * 显示战斗过程中的关键信息
 */
export const BattleLog: React.FC<BattleLogProps> = ({ logs }) => {
  // 获取阶段颜色
  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case 'preparation': return 'text-blue-400';
      case 'battle': return 'text-red-400';
      case 'resolution': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  // 获取阶段名称
  const getPhaseName = (phase: string): string => {
    switch (phase) {
      case 'preparation': return '准备';
      case 'battle': return '战斗';
      case 'resolution': return '结算';
      default: return '未知';
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">战斗日志</h2>
      <div className="h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-400">暂无战斗日志</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log, index) => (
              <li
                key={index}
                className="p-2 bg-gray-700 rounded flex justify-between items-center"
              >
                <span className={getPhaseColor(log.phase)}>
                  [{getPhaseName(log.phase)}]
                </span>
                <span className="flex-1 mx-2">{log.message}</span>
                <span className="text-gray-400 text-sm">
                  回合 {log.round}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

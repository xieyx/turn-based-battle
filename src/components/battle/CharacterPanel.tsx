import React from 'react';
import type { Character, Soldier } from '../../types/character';
import { useCharacter } from '../../hooks/useCharacter';

interface CharacterPanelProps {
  character: Character;
  isPlayer: boolean;
}

/**
 * 角色信息面板组件
 * 显示角色的属性和生命值状态
 */
export const CharacterPanel: React.FC<CharacterPanelProps> = ({
  character,
  isPlayer
}) => {
  const { getHpPercentage } = useCharacter();

  const hpPercentage = getHpPercentage(character);
  const isAlive = character.currentHp > 0;

  // 生命值条颜色根据百分比变化
  const getHpBarColor = () => {
    if (hpPercentage > 60) return 'bg-green-500';
    if (hpPercentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // 获取士兵生命值百分比
  const getSoldierHpPercentage = (soldier: Soldier) => {
    return (soldier.currentHp / soldier.maxHp) * 100;
  };

  // 士兵生命值条颜色根据百分比变化
  const getSoldierHpBarColor = (soldier: Soldier) => {
    const percentage = getSoldierHpPercentage(soldier);
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`p-4 rounded-lg ${isPlayer ? 'bg-blue-900' : 'bg-red-900'}`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">{character.name}</h2>
        <span className={`px-2 py-1 rounded ${isAlive ? 'bg-green-500' : 'bg-red-500'}`}>
          {isAlive ? '存活' : '死亡'}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between mb-1">
            <span>生命值</span>
            <span>{character.currentHp} / {character.maxHp}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full ${getHpBarColor()}`}
              style={{ width: `${hpPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-sm text-gray-400">攻击力</div>
            <div className="text-lg font-bold">{character.attack}</div>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <div className="text-sm text-gray-400">防御力</div>
            <div className="text-lg font-bold">{character.defense}</div>
          </div>
        </div>

        {/* 显示士兵信息 */}
        {character.soldiers && character.soldiers.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">士兵</h3>
            <div className="space-y-2">
              {character.soldiers.map((soldier) => (
                <div key={soldier.id} className="bg-gray-800 p-2 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{soldier.name}</span>
                    <span className="text-sm">
                      {soldier.quantity} 个 (HP: {soldier.currentHp}/{soldier.maxHp})
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getSoldierHpBarColor(soldier)}`}
                      style={{ width: `${getSoldierHpPercentage(soldier)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

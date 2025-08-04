import React, { useEffect, useRef } from 'react';
import type { BattlePhase } from '../../types/battle';
import type { Item } from '../../types/item';
import type { BattleFormation, FormationPosition } from '../../types/character';
import { useBattle } from '../../hooks/useBattle';
import { useItems } from '../../hooks/useItems';
import { useCharacter } from '../../hooks/useCharacter';

interface ActionPanelProps {
  currentPhase: BattlePhase;
  healingPotion: Item | undefined;
  preparationTimer?: number;
}

/**
 * 玩家操作面板组件
 * 根据当前阶段显示相应的操作按钮
 */
export const ActionPanel: React.FC<ActionPanelProps> = ({
  currentPhase,
  healingPotion,
  preparationTimer
}) => {
  const {
    battleState,
    selectItem,
    enterBattle,
    startBattlePhase,
    decreasePreparationTimer,
    markPreparationActionTaken,
    autoProceedToNextRound,
    updateBattleFormation
  } = useBattle();

  const { canUseItem } = useItems();
  const { getPlayer } = useCharacter();
  const player = getPlayer();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 处理准备阶段计时器
  useEffect(() => {
    // 如果战斗已经结束，清除计时器并返回
    if (battleState.isGameOver) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (currentPhase === 'preparation' && preparationTimer !== undefined && preparationTimer > 0) {
      timerRef.current = setTimeout(() => {
        decreasePreparationTimer();
      }, 1000);
    } else if (currentPhase === 'preparation' && preparationTimer === 0) {
      // 计时器结束，自动进入战斗阶段
      handleAutoEnterBattle();
    } else if (currentPhase === 'resolution' && !battleState.isGameOver) {
      // 结算阶段结束后自动进入下一回合，但仅当战斗未结束时
      timerRef.current = setTimeout(() => {
        autoProceedToNextRound();
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentPhase, preparationTimer, battleState.isGameOver]);

  // 处理使用道具
  const handleUseItem = () => {
    if (healingPotion && canUseItem(healingPotion)) {
      selectItem(healingPotion.id);
      markPreparationActionTaken();
    }
  };

  // 处理进入战斗
  const handleEnterBattle = () => {
    enterBattle();
    markPreparationActionTaken();
    startBattlePhase();
  };

  // 自动进入战斗
  const handleAutoEnterBattle = () => {
    startBattlePhase();
  };

  // 处理更新战斗梯队
  const handleUpdateBattleFormation = (newFormation: BattleFormation) => {
    updateBattleFormation(newFormation);
    markPreparationActionTaken();
  };

  // 渲染梯队配置UI
  const renderFormationUI = () => {
    if (!player.battleFormation) return null;

    const formation = player.battleFormation;

    // 更新梯队配置的辅助函数
    const updateFormationPosition = (
      tier: keyof BattleFormation,
      positionIndex: number,
      slot: 'slot1' | 'slot2' | 'slot3',
      value: 'empty' | 'player' | 'soldier'
    ) => {
      const newFormation = { ...formation };

      if (tier !== 'reserve') {
        const tierArray = [...newFormation[tier]];
        const position = { ...tierArray[positionIndex] };
        position[slot] = value;
        tierArray[positionIndex] = position;
        newFormation[tier] = tierArray;
      }

      handleUpdateBattleFormation(newFormation);
    };

    // 渲染单个梯队
    const renderTier = (
      tier: keyof BattleFormation,
      tierName: string,
      positions: FormationPosition[]
    ) => (
      <div key={tier} className="mb-4">
        <h3 className="text-lg font-semibold mb-2">{tierName}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {positions.map((position, positionIndex) => (
            <div key={positionIndex} className="bg-gray-700 p-2 rounded">
              <div className="flex justify-between items-center mb-1">
                <span>位置 {positionIndex + 1}</span>
              </div>
              <div className="flex gap-1">
                {(['slot1', 'slot2', 'slot3'] as const).map((slot) => (
                  <select
                    key={slot}
                    value={position[slot]}
                    onChange={(e) => updateFormationPosition(
                      tier,
                      positionIndex,
                      slot,
                      e.target.value as 'empty' | 'player' | 'soldier'
                    )}
                    className="flex-1 p-1 bg-gray-600 rounded text-sm"
                  >
                    <option value="empty">空</option>
                    <option value="player">玩家</option>
                    <option value="soldier">士兵</option>
                  </select>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="mt-4 p-4 bg-gray-700 rounded-lg">
        <h2 className="text-xl font-bold mb-4">战斗梯队配置</h2>

        {renderTier('frontline', '第一梯队', formation.frontline)}
        {renderTier('backline1', '第二梯队', formation.backline1)}
        {renderTier('backline2', '第三梯队', formation.backline2)}
        {renderTier('backline3', '第四梯队', formation.backline3)}

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">第五梯队（预备队）</h3>
          <div className="text-sm text-gray-300">
            不参与战斗，不限制数量
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">操作面板</h2>

      {currentPhase === 'preparation' && (
        <div className="space-y-4">
          {preparationTimer !== undefined && (
            <div className="text-center text-lg font-semibold">
              倒计时: {preparationTimer} 秒
            </div>
          )}


          <div className="flex flex-wrap gap-4">
            {healingPotion && canUseItem(healingPotion) ? (
              <button
                onClick={handleUseItem}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                使用治疗药水
              </button>
            ) : (
              <button
                disabled
                className="px-4 py-2 bg-gray-600 rounded-lg cursor-not-allowed"
              >
                使用治疗药水
              </button>
            )}

          <button
            onClick={handleEnterBattle}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            进入战斗
          </button>
          </div>

          {renderFormationUI()}
        </div>
      )}

      {currentPhase === 'battle' && (
        <div className="space-y-4">
          <div className="text-center text-lg font-semibold">
            战斗进行中...
          </div>
        </div>
      )}

      {currentPhase === 'resolution' && (
        <div className="space-y-4">
          <div className="text-center text-lg font-semibold">
            回合结算中...
          </div>
        </div>
      )}
    </div>
  );
};

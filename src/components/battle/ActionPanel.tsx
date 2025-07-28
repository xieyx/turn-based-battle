import React, { useEffect, useRef } from 'react';
import type { BattlePhase } from '../../types/battle';
import type { Item } from '../../types/item';
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
    attack,
    startBattlePhase,
    startResolutionPhase,
    nextRound,
    processEnemyTurn,
    decreasePreparationTimer,
    markPreparationActionTaken,
    autoExecuteBattlePhase,
    autoProceedToNextRound,
    toggleFormation: toggleFormationAction
  } = useBattle();

  const { canUseItem } = useItems();
  const { getPlayer } = useCharacter();
  const player = getPlayer();

  const timerRef = useRef<number | null>(null);

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
    // 在真实游戏中，这里可能需要一些延迟或动画
    // 但为了简化，我们直接进入战斗阶段
    setTimeout(() => {
      startBattlePhase();
      // 自动执行战斗阶段
      setTimeout(() => {
        autoExecuteBattlePhase();
        // 处理敌人回合
        setTimeout(() => {
          processEnemyTurn();
          // 进入结算阶段
          setTimeout(() => {
            startResolutionPhase();
          }, 500);
        }, 500);
      }, 500);
    }, 500);
  };

  // 自动进入战斗
  const handleAutoEnterBattle = () => {
    // 自动进入战斗阶段
    setTimeout(() => {
      startBattlePhase();
      // 自动执行战斗阶段
      setTimeout(() => {
        autoExecuteBattlePhase();
        // 处理敌人回合
        setTimeout(() => {
          processEnemyTurn();
          // 进入结算阶段
          setTimeout(() => {
            startResolutionPhase();
          }, 500);
        }, 500);
      }, 500);
    }, 500);
  };

  // 处理攻击
  const handleAttack = () => {
    // 在这个简单的实现中，我们假设只有一个敌人
    attack('enemy');
  };

  // 处理下一阶段
  const handleNextPhase = () => {
    if (currentPhase === 'resolution') {
      nextRound();
    }
  };

  // 切换作战梯队
  const toggleFormation = () => {
    // 这里应该发送一个动作到游戏状态来切换作战梯队
    // 为了简化，我们只显示当前的作战梯队
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

          {/* 显示当前作战梯队 */}
          <div className="text-center text-lg font-semibold">
            作战梯队: {player.formation === 'soldiers-first' ? '士兵在前' : '玩家在前'}
          </div>

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

            <button
              onClick={toggleFormationAction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              切换作战梯队
            </button>
          </div>
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

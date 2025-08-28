/**
 * 游戏主面板组件
 * 负责渲染整个游戏网格、处理卡片点击事件、管理游戏流程
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { GameCard } from '../GameCard';
import { ConnectionLine } from '../ConnectionLine';
import { GameGenerator } from '../../utils/gameGenerator';
import { PathFinder } from '../../utils/gameLogic';
import { Card, Position } from '../../types/game';
import {
  gameGridAtom,
  selectedCardsAtom,
  matchedPairsAtom,
  isGameCompletedAtom,
  scoreAtom,
  connectionPathAtom,
  TOTAL_PAIRS
} from '../../store/gameAtoms';

export const GameBoard: React.FC = () => {
  const [grid, setGrid] = useAtom(gameGridAtom);
  const [selectedCards, setSelectedCards] = useAtom(selectedCardsAtom);
  const [matchedPairs, setMatchedPairs] = useAtom(matchedPairsAtom);
  const [isCompleted, setIsCompleted] = useAtom(isGameCompletedAtom);
  const [score, setScore] = useAtom(scoreAtom);
  const [connectionPath, setConnectionPath] = useAtom(connectionPathAtom);
  
  const [cellSize, setCellSize] = useState(20);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  // 初始化游戏
  useEffect(() => {
    const newGrid = GameGenerator.initializeGame();
    setGrid(newGrid);
    setMatchedPairs(0);
    setIsCompleted(false);
    setScore(0);
    setSelectedCards([]);
    setConnectionPath(null);
  }, []);

  // 计算网格尺寸
  useEffect(() => {
    const updateSize = () => {
      const containerPadding = 40;
      const availableWidth = window.innerWidth - containerPadding;
      const availableHeight = window.innerHeight - 200; // 留给头部和底部
      
      const maxCellSize = Math.min(
        Math.floor(availableWidth / 20),
        Math.floor(availableHeight / 20)
      );
      
      const finalCellSize = Math.max(15, Math.min(30, maxCellSize));
      setCellSize(finalCellSize);
      
      const gridWidth = 20 * finalCellSize;
      const gridHeight = 20 * finalCellSize;
      setGridOffset({
        x: (availableWidth - gridWidth) / 2,
        y: 20
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 处理卡片点击
  const handleCardClick = useCallback((clickedCard: Card) => {
    if (clickedCard.isMatched) return;
    
    setConnectionPath(null);

    if (selectedCards.length === 0) {
      // 第一次选择
      setSelectedCards([clickedCard]);
      setGrid(prev => {
        const newGrid = prev.map(row => row.map(cell => {
          if (cell && cell.id === clickedCard.id) {
            return { ...cell, isSelected: true };
          }
          return cell ? { ...cell, isSelected: false } : null;
        }));
        return newGrid;
      });
    } else if (selectedCards.length === 1) {
      const firstCard = selectedCards[0];
      
      if (firstCard.id === clickedCard.id) {
        // 取消选择
        setSelectedCards([]);
        setGrid(prev => {
          const newGrid = prev.map(row => row.map(cell => 
            cell ? { ...cell, isSelected: false } : null
          ));
          return newGrid;
        });
        return;
      }

      // 检查是否为相同图案
      if (firstCard.pattern === clickedCard.pattern) {
        // 检查连线路径
        const pathFinder = new PathFinder(grid);
        const path = pathFinder.findPath(firstCard.position, clickedCard.position);
        
        if (path) {
          // 可以连接
          setConnectionPath(path);
          
          // 延迟执行消除动画
          setTimeout(() => {
            setGrid(prev => {
              const newGrid = prev.map(row => row.map(cell => {
                if (cell && (cell.id === firstCard.id || cell.id === clickedCard.id)) {
                  return { ...cell, isSelected: false, isMatched: true };
                }
                return cell ? { ...cell, isSelected: false } : null;
              }));
              return newGrid;
            });

            setMatchedPairs(prev => prev + 1);
            setScore(prev => prev + 100);
            setSelectedCards([]);
            
            // 清除连线
            setTimeout(() => setConnectionPath(null), 500);
          }, 800);
        } else {
          // 无法连接，重新选择
          setSelectedCards([clickedCard]);
          setGrid(prev => {
            const newGrid = prev.map(row => row.map(cell => {
              if (cell && cell.id === clickedCard.id) {
                return { ...cell, isSelected: true };
              }
              return cell ? { ...cell, isSelected: false } : null;
            }));
            return newGrid;
          });
        }
      } else {
        // 图案不同，重新选择
        setSelectedCards([clickedCard]);
        setGrid(prev => {
          const newGrid = prev.map(row => row.map(cell => {
            if (cell && cell.id === clickedCard.id) {
              return { ...cell, isSelected: true };
            }
            return cell ? { ...cell, isSelected: false } : null;
          }));
          return newGrid;
        });
      }
    }
  }, [selectedCards, grid, setGrid, setSelectedCards, setMatchedPairs, setScore, setConnectionPath]);

  // 检查游戏完成
  useEffect(() => {
    if (matchedPairs === TOTAL_PAIRS) {
      setIsCompleted(true);
    }
  }, [matchedPairs, setIsCompleted]);

  return (
    <div className="relative flex flex-col items-center w-full h-full overflow-hidden">
      {/* 游戏网格 */}
      <div className="relative">
        <div 
          className="grid gap-1 p-2 bg-gray-50 rounded-lg shadow-lg"
          style={{
            gridTemplateColumns: `repeat(20, ${cellSize}px)`,
            gridTemplateRows: `repeat(20, ${cellSize}px)`,
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((card, colIndex) => (
              <div key={`${rowIndex}-${colIndex}`} className="relative">
                {card ? (
                  <GameCard
                    card={card}
                    onClick={handleCardClick}
                    size={cellSize}
                  />
                ) : (
                  <div 
                    className="bg-gray-200 rounded border"
                    style={{ width: cellSize, height: cellSize }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* 连线动画 */}
        <AnimatePresence>
          {connectionPath && (
            <ConnectionLine
              path={connectionPath}
              cellSize={cellSize}
              gridOffset={{ x: 8, y: 8 }} // 考虑padding
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * 游戏头部信息组件
 * 使用原生图标替代lucide-react
 */
import React from 'react';
import { useAtom } from 'jotai';
import { 
  scoreAtom, 
  matchedPairsAtom, 
  gameGridAtom,
  selectedCardsAtom,
  isGameCompletedAtom,
  connectionPathAtom,
  TOTAL_PAIRS 
} from '../../store/gameAtoms';
import { GameGenerator } from '../../utils/gameGenerator';

// 原生重新开始图标
const RestartIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M1 4V10H7" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const GameHeader: React.FC = () => {
  const [score] = useAtom(scoreAtom);
  const [matchedPairs] = useAtom(matchedPairsAtom);
  const [, setGrid] = useAtom(gameGridAtom);
  const [, setSelectedCards] = useAtom(selectedCardsAtom);
  const [, setIsCompleted] = useAtom(isGameCompletedAtom);
  const [, setConnectionPath] = useAtom(connectionPathAtom);

  const handleRestart = () => {
    const newGrid = GameGenerator.initializeGame();
    setGrid(newGrid);
    setSelectedCards([]);
    setIsCompleted(false);
    setConnectionPath(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white shadow-md rounded-lg mb-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-6">
          <div className="text-center">
            <div className="text-sm text-gray-600">分数</div>
            <div className="text-xl font-bold text-blue-600">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">进度</div>
            <div className="text-xl font-bold text-green-600">
              {matchedPairs}/{TOTAL_PAIRS}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleRestart}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RestartIcon />
          <span>重新开始</span>
        </button>
      </div>
    </div>
  );
};
/**
 * 简化版游戏面板
 * 先实现基础渲染，确保组件能正常工作
 */
import React, { useState } from 'react';

const PATTERNS = ['🎯', '🎮', '🎲', '🎪', '🎨'];

export const SimpleGameBoard: React.FC = () => {
  const [score, setScore] = useState(0);
  const [matched, setMatched] = useState(0);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 简化版头部 */}
      <div className="p-4 bg-white shadow-md rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-6">
            <div className="text-center">
              <div className="text-sm text-gray-600">分数</div>
              <div className="text-xl font-bold text-blue-600">{score}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">已匹配</div>
              <div className="text-xl font-bold text-green-600">{matched}/5</div>
            </div>
          </div>
          
          <button
            onClick={() => {
              setScore(0);
              setMatched(0);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重新开始
          </button>
        </div>
      </div>

      {/* 简化版游戏区域 */}
      <div className="p-4 bg-gray-50 rounded-lg shadow-lg">
        <div className="grid grid-cols-10 gap-2 max-w-md mx-auto">
          {PATTERNS.map((pattern, index) => (
            <React.Fragment key={pattern}>
              <button
                className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg 
                         hover:border-blue-500 transition-colors text-lg
                         flex items-center justify-center"
                onClick={() => setScore(prev => prev + 10)}
              >
                {pattern}
              </button>
              <button
                className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg 
                         hover:border-blue-500 transition-colors text-lg
                         flex items-center justify-center"
                onClick={() => setScore(prev => prev + 10)}
              >
                {pattern}
              </button>
            </React.Fragment>
          ))}
        </div>
        
        <div className="text-center mt-4 text-sm text-gray-600">
          点击相同图案进行匹配
        </div>
      </div>
    </div>
  );
};

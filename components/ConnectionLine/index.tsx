/**
 * 连线路径组件
 * 负责绘制两个卡片之间的连接路径动画
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Position } from '../../types/game';

interface ConnectionLineProps {
  path: Position[];
  cellSize: number;
  gridOffset: { x: number; y: number };
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ 
  path, 
  cellSize, 
  gridOffset 
}) => {
  if (!path || path.length < 2) return null;

  // 生成SVG路径
  const generateSVGPath = () => {
    const points = path.map(pos => ({
      x: gridOffset.x + pos.col * cellSize + cellSize / 2,
      y: gridOffset.y + pos.row * cellSize + cellSize / 2
    }));

    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i].x} ${points[i].y}`;
    }

    return pathData;
  };

  return (
    <motion.svg
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: '100%', height: '100%' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.path
        d={generateSVGPath()}
        stroke="#ff6b6b"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      
      {/* 连线端点 */}
      {path.map((pos, index) => {
        const isEndpoint = index === 0 || index === path.length - 1;
        if (!isEndpoint) return null;
        
        return (
          <motion.circle
            key={`${pos.row}-${pos.col}`}
            cx={gridOffset.x + pos.col * cellSize + cellSize / 2}
            cy={gridOffset.y + pos.row * cellSize + cellSize / 2}
            r="6"
            fill="#ff6b6b"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
          />
        );
      })}
    </motion.svg>
  );
};

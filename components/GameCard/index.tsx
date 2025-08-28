/**
 * 游戏卡片组件
 * 负责单个卡片的渲染，包含选中状态、匹配状态的视觉效果
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../types/game';

interface GameCardProps {
  card: Card;
  onClick: (card: Card) => void;
  size: number;
}

export const GameCard: React.FC<GameCardProps> = ({ card, onClick, size }) => {
  return (
    <motion.div
      className={`
        flex items-center justify-center
        border-2 rounded-lg cursor-pointer
        text-lg font-bold select-none
        transition-all duration-200
        ${card.isSelected 
          ? 'border-blue-500 bg-blue-100 scale-110 z-10' 
          : card.isMatched 
          ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed'
          : 'border-gray-400 bg-white hover:border-gray-600 hover:shadow-md'
        }
      `}
      style={{ 
        width: size, 
        height: size,
        fontSize: Math.max(12, size * 0.4)
      }}
      onClick={() => !card.isMatched && onClick(card)}
      whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
      whileTap={{ scale: card.isMatched ? 1 : 0.95 }}
      animate={{
        scale: card.isSelected ? 1.1 : 1,
        rotateY: card.isMatched ? 180 : 0
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
    >
      {card.pattern}
    </motion.div>
  );
};

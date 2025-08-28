/**
 * 游戏完成庆祝效果组件
 * 使用原生CSS动画替代react-confetti，减少依赖
 */
import React from 'react';
import { useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { isGameCompletedAtom, scoreAtom } from '../../store/gameAtoms';

export const CompletionEffect: React.FC = () => {
  const [isCompleted] = useAtom(isGameCompletedAtom);
  const [score] = useAtom(scoreAtom);

  return (
    <AnimatePresence>
      {isCompleted && (
        <>
          {/* 原生CSS彩带动画 */}
          <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-8 rounded"
                style={{
                  background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                  left: `${Math.random() * 100}%`,
                  top: -20
                }}
                animate={{
                  y: window.innerHeight + 100,
                  rotate: Math.random() * 360,
                  x: [-50, 50, -30, 30, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: 0,
                  ease: "linear"
                }}
              />
            ))}
          </div>
          
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md mx-4"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                🎉
              </motion.div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                恭喜完成！
              </h2>
              
              <p className="text-gray-600 mb-4">
                你成功完成了连连看游戏
              </p>
              
              <div className="bg-yellow-100 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600">最终分数</div>
                <div className="text-2xl font-bold text-yellow-600">{score}</div>
              </div>
              
              <motion.button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
              >
                再玩一次
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
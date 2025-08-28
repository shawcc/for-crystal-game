import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// 游戏配置 - 改为6行6列（36张卡片）
const GRID_SIZE_ROWS = 6; // 6行（高度）
const GRID_SIZE_COLS = 6; // 6列（宽度）
const CHINESE_CHARACTERS = ['星', '河', '流', '转', '依', '如', '初', '见']; // 星河流转依如初见

// 字符出现次数配置：调整为36张卡片，增加配对数量
const CHARACTER_COUNTS = {
  '星': 5, // 5张
  '河': 5, // 5张
  '流': 4, // 4张
  '转': 4, // 4张
  '依': 5, // 5张
  '如': 5, // 5张
  '初': 4, // 4张
  '见': 4  // 4张
}; // 总计36张卡片

interface Card {
  id: string;
  pattern: string;
  row: number;
  col: number;
  isMatched: boolean;
  isFlipped: boolean;
}

interface Position {
  row: number;
  col: number;
}

const App: React.FC = () => {
  const [grid, setGrid] = useState<Card[][]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [connectionPath, setConnectionPath] = useState<Position[] | null>(null);
  const [isGameCompleted, setIsGameCompleted] = useState(false);
  const [animationState, setAnimationState] = useState<'none' | 'success' | 'failed'>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 解锁字符状态
  const [unlockedCharacters, setUnlockedCharacters] = useState<string[]>([]);
  const [isCharacterUnlocking, setIsCharacterUnlocking] = useState(false);
  const [justUnlockedChar, setJustUnlockedChar] = useState<string | null>(null);

  // 计算已配对字符对数
  const getMatchedPairs = () => {
    const characterCounts: Record<string, number> = {};
    grid.flat().forEach(card => {
      if (card.isMatched) {
        characterCounts[card.pattern] = (characterCounts[card.pattern] || 0) + 1;
      }
    });
    
    let pairs = 0;
    Object.entries(characterCounts).forEach(([char, count]) => {
      pairs += Math.floor(count / 2);
    });
    return pairs;
  };

  // 卡片尺寸计算 - 针对6×6网格优化
  const getCardSize = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const isMobile = screenWidth <= 768;
    
    if (isMobile) {
      const outerPadding = 10 * 2;
      const outerMargin = 8 * 2;
      const innerPadding = 16 * 2;
      const gridInnerPadding = 8 * 2;
      const gaps = (GRID_SIZE_COLS - 1) * 6;
      
      const totalHorizontalReserved = outerPadding + outerMargin + innerPadding + gridInnerPadding + gaps;
      const availableForCards = screenWidth - totalHorizontalReserved;
      const maxCardWidth = Math.floor(availableForCards / GRID_SIZE_COLS);
      
      const verticalReserved = 320;
      const availableHeight = screenHeight - verticalReserved;
      const verticalGaps = (GRID_SIZE_ROWS - 1) * 6;
      const availableForCardsHeight = availableHeight - innerPadding - gridInnerPadding - verticalGaps;
      const maxCardHeight = Math.floor(availableForCardsHeight / GRID_SIZE_ROWS);
      
      const calculatedSize = Math.min(maxCardWidth, maxCardHeight);
      const minSize = 35; // 6×6网格需要更小的卡片
      const maxSize = 65;
      
      return Math.max(minSize, Math.min(calculatedSize, maxSize));
    } else {
      const horizontalPadding = 40;
      const verticalReserved = 400;
      
      const availableWidth = screenWidth - horizontalPadding;
      const availableHeight = screenHeight - verticalReserved;
      
      const horizontalGap = (GRID_SIZE_COLS - 1) * 6;
      const verticalGap = (GRID_SIZE_ROWS - 1) * 6;
      
      const cardWidth = Math.floor((availableWidth - horizontalGap) / GRID_SIZE_COLS);
      const cardHeight = Math.floor((availableHeight - verticalGap) / GRID_SIZE_ROWS);
      
      const calculatedSize = Math.min(cardWidth, cardHeight);
      return Math.max(50, Math.min(calculatedSize, 85)); // 6×6网格桌面端也要小一些
    }
  };

  const [cardSize, setCardSize] = useState(getCardSize());

  useEffect(() => {
    const handleResize = () => {
      setCardSize(getCardSize());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const cards: Card[] = [];
    
    // 根据配置生成卡片 - 使用中文字符
    Object.entries(CHARACTER_COUNTS).forEach(([character, count]) => {
      for (let i = 0; i < count; i++) {
        cards.push({
          id: `${character}-${i}`,
          pattern: character, // 这里是中文字符
          row: 0,
          col: 0,
          isMatched: false,
          isFlipped: false
        });
      }
    });

    // 随机打乱
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    // 创建6行6列网格，36个位置全部填满
    const newGrid: Card[][] = Array(GRID_SIZE_ROWS).fill(null)
      .map(() => Array(GRID_SIZE_COLS).fill(null));

    // 按顺序填充网格
    let cardIndex = 0;
    for (let row = 0; row < GRID_SIZE_ROWS; row++) {
      for (let col = 0; col < GRID_SIZE_COLS; col++) {
        const card = cards[cardIndex];
        card.row = row;
        card.col = col;
        newGrid[row][col] = card;
        cardIndex++;
      }
    }

    setGrid(newGrid);
    setSelectedCards([]);
    setClickCount(0);
    setConnectionPath(null);
    setIsGameCompleted(false);
    setAnimationState('none');
    setIsProcessing(false);
    setUnlockedCharacters([]);
    setIsCharacterUnlocking(false);
    setJustUnlockedChar(null);
  };

  // 重新实现连连看路径查找算法 - 修复逻辑问题
  const isOutOfBounds = (row: number, col: number): boolean => {
    return row < 0 || row >= GRID_SIZE_ROWS || col < 0 || col >= GRID_SIZE_COLS;
  };

  const isEmpty = (row: number, col: number): boolean => {
    if (isOutOfBounds(row, col)) return true; // 边界外认为是空的
    return grid[row][col]?.isMatched === true;
  };

  // 检查水平路径是否畅通 - 修复逻辑，更严格地检查障碍物
  const isHorizontalClear = (row: number, col1: number, col2: number, excludePositions: Position[] = []): boolean => {
    const startCol = Math.min(col1, col2);
    const endCol = Math.max(col1, col2);
    
    // 检查中间的每一个格子（不包括起点和终点）
    for (let col = startCol + 1; col < endCol; col++) {
      const isExcluded = excludePositions.some(pos => pos.row === row && pos.col === col);
      // 如果不在排除列表中，并且该位置有未匹配的卡片，则认为有障碍
      if (!isExcluded && !isEmpty(row, col)) {
        return false;
      }
    }
    return true;
  };

  // 检查垂直路径是否畅通 - 修复逻辑，更严格地检查障碍物
  const isVerticalClear = (col: number, row1: number, row2: number, excludePositions: Position[] = []): boolean => {
    const startRow = Math.min(row1, row2);
    const endRow = Math.max(row1, row2);
    
    // 检查中间的每一个格子（不包括起点和终点）
    for (let row = startRow + 1; row < endRow; row++) {
      const isExcluded = excludePositions.some(pos => pos.row === row && pos.col === col);
      // 如果不在排除列表中，并且该位置有未匹配的卡片，则认为有障碍
      if (!isExcluded && !isEmpty(row, col)) {
        return false;
      }
    }
    return true;
  };

  // 1. 直线连接检查 - 水平或垂直直线
  const checkDirectPath = (pos1: Position, pos2: Position): Position[] | null => {
    const excludePositions = [pos1, pos2];
    
    // 同一行的水平直线
    if (pos1.row === pos2.row) {
      if (isHorizontalClear(pos1.row, pos1.col, pos2.col, excludePositions)) {
        return [pos1, pos2];
      }
    }
    
    // 同一列的垂直直线
    if (pos1.col === pos2.col) {
      if (isVerticalClear(pos1.col, pos1.row, pos2.row, excludePositions)) {
        return [pos1, pos2];
      }
    }
    
    return null;
  };

  // 2. 一次拐弯连接检查 - L型路径
  const checkOneCornerPath = (pos1: Position, pos2: Position): Position[] | null => {
    const excludePositions = [pos1, pos2];
    
    // 拐点1: (pos1.row, pos2.col) - 先水平后垂直
    const corner1 = { row: pos1.row, col: pos2.col };
    // 拐点必须是空的（除非它就是起点或终点）
    if (isEmpty(corner1.row, corner1.col) || 
        (corner1.row === pos1.row && corner1.col === pos1.col) ||
        (corner1.row === pos2.row && corner1.col === pos2.col)) {
      
      // 检查 pos1 到 corner1 的水平路径
      if (isHorizontalClear(pos1.row, pos1.col, corner1.col, excludePositions) &&
          isVerticalClear(corner1.col, corner1.row, pos2.row, excludePositions)) {
        return [pos1, corner1, pos2];
      }
    }

    // 拐点2: (pos2.row, pos1.col) - 先垂直后水平
    const corner2 = { row: pos2.row, col: pos1.col };
    // 拐点必须是空的（除非它就是起点或终点）
    if (isEmpty(corner2.row, corner2.col) ||
        (corner2.row === pos1.row && corner2.col === pos1.col) ||
        (corner2.row === pos2.row && corner2.col === pos2.col)) {
      
      // 检查 pos1 到 corner2 的垂直路径，corner2 到 pos2 的水平路径
      if (isVerticalClear(pos1.col, pos1.row, corner2.row, excludePositions) &&
          isHorizontalClear(corner2.row, corner2.col, pos2.col, excludePositions)) {
        return [pos1, corner2, pos2];
      }
    }

    return null;
  };

  // 3. 两次拐弯连接检查 - 通过边界的U型路径
  const checkTwoCornerPath = (pos1: Position, pos2: Position): Position[] | null => {
    const excludePositions = [pos1, pos2];
    
    // 尝试通过四个边界方向进行连接
    const directions = [
      { name: 'top', checkRow: -1 },      // 通过上边界
      { name: 'bottom', checkRow: GRID_SIZE_ROWS }, // 通过下边界
      { name: 'left', checkCol: -1 },     // 通过左边界
      { name: 'right', checkCol: GRID_SIZE_COLS }   // 通过右边界
    ];

    for (const dir of directions) {
      if ('checkRow' in dir) {
        // 水平边界（上边界或下边界）
        const borderRow = dir.checkRow;
        
        // 检查从pos1垂直到边界是否畅通
        const canReachBorder1 = borderRow < 0 
          ? isVerticalClear(pos1.col, borderRow, pos1.row, excludePositions)
          : isVerticalClear(pos1.col, pos1.row, borderRow, excludePositions);
        
        // 检查从pos2垂直到边界是否畅通  
        const canReachBorder2 = borderRow < 0
          ? isVerticalClear(pos2.col, borderRow, pos2.row, excludePositions)
          : isVerticalClear(pos2.col, pos2.row, borderRow, excludePositions);
          
        // 检查边界上两点间的水平路径是否畅通
        const borderClear = isHorizontalClear(borderRow, pos1.col, pos2.col, []);
        
        if (canReachBorder1 && canReachBorder2 && borderClear) {
          return [
            pos1,
            { row: borderRow, col: pos1.col },
            { row: borderRow, col: pos2.col },
            pos2
          ];
        }
      } else {
        // 垂直边界（左边界或右边界）
        const borderCol = dir.checkCol;
        
        // 检查从pos1水平到边界是否畅通
        const canReachBorder1 = borderCol < 0
          ? isHorizontalClear(pos1.row, borderCol, pos1.col, excludePositions)
          : isHorizontalClear(pos1.row, pos1.col, borderCol, excludePositions);
        
        // 检查从pos2水平到边界是否畅通
        const canReachBorder2 = borderCol < 0
          ? isHorizontalClear(pos2.row, borderCol, pos2.col, excludePositions)
          : isHorizontalClear(pos2.row, pos2.col, borderCol, excludePositions);
          
        // 检查边界上两点间的垂直路径是否畅通
        const borderClear = isVerticalClear(borderCol, pos1.row, pos2.row, []);
        
        if (canReachBorder1 && canReachBorder2 && borderClear) {
          return [
            pos1,
            { row: pos1.row, col: borderCol },
            { row: pos2.row, col: borderCol },
            pos2
          ];
        }
      }
    }
    
    return null;
  };

  // 主路径查找函数 - 按照连连看标准规则
  const findPath = (pos1: Position, pos2: Position): Position[] | null => {
    // 1. 直线连接（0次拐弯）
    let path = checkDirectPath(pos1, pos2);
    if (path) return path;

    // 2. 一次拐弯连接
    path = checkOneCornerPath(pos1, pos2);
    if (path) return path;

    // 3. 两次拐弯连接（通过边界）
    path = checkTwoCornerPath(pos1, pos2);
    if (path) return path;

    return null; // 无法连接
  };

  const triggerSuccessAnimation = () => {
    setAnimationState('success');
    setTimeout(() => setAnimationState('none'), 400);
  };

  // 处理字符解锁
  const unlockCharacter = (character: string) => {
    if (!unlockedCharacters.includes(character)) {
      setJustUnlockedChar(character);
      setIsCharacterUnlocking(true);
      
      setTimeout(() => {
        setUnlockedCharacters(prev => [...prev, character]);
        setTimeout(() => {
          setIsCharacterUnlocking(false);
          setJustUnlockedChar(null);
        }, 1000);
      }, 500);
    }
  };

  // 处理卡片点击
  const handleCardClick = (card: Card) => {
    if (card.isMatched || isProcessing || selectedCards.length >= 2) return;

    setClickCount(prev => prev + 1);

    if (!card.isFlipped) {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
        newGrid[card.row][card.col].isFlipped = true;
        return newGrid;
      });
      
      setSelectedCards(prev => {
        const newSelected = [...prev, card];
        
        if (newSelected.length === 2) {
          setIsProcessing(true);
          
          const [firstCard, secondCard] = newSelected;
          
          setTimeout(() => {
            if (firstCard.pattern === secondCard.pattern) {
              const path = findPath(
                { row: firstCard.row, col: firstCard.col },
                { row: secondCard.row, col: secondCard.col }
              );

              if (path) {
                setConnectionPath(path);
                triggerSuccessAnimation();
                
                setTimeout(() => {
                  setGrid(prevGrid => {
                    const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
                    newGrid[firstCard.row][firstCard.col].isMatched = true;
                    newGrid[secondCard.row][secondCard.col].isMatched = true;
                    return newGrid;
                  });
                  
                  // 解锁字符
                  unlockCharacter(firstCard.pattern);
                  
                  setConnectionPath(null);
                  setSelectedCards([]);
                  setIsProcessing(false);
                }, 250);
              } else {
                setTimeout(() => {
                  setGrid(prevGrid => {
                    const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
                    newGrid[firstCard.row][firstCard.col].isFlipped = false;
                    newGrid[secondCard.row][secondCard.col].isFlipped = false;
                    return newGrid;
                  });
                  setSelectedCards([]);
                  setIsProcessing(false);
                }, 300);
              }
            } else {
              setTimeout(() => {
                setGrid(prevGrid => {
                  const newGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
                  newGrid[firstCard.row][firstCard.col].isFlipped = false;
                  newGrid[secondCard.row][secondCard.col].isFlipped = false;
                  return newGrid;
                });
                setSelectedCards([]);
                setIsProcessing(false);
              }, 300);
            }
          }, 100);
        }
        
        return newSelected;
      });
    }
  };

  // 卡片样式 - 针对6×6调整
  const getCardStyle = (card: Card) => {
    const isSelected = selectedCards.some(c => c.id === card.id);
    const isMatched = card.isMatched;
    const isDisabled = isProcessing && !isSelected;
    const isMobile = window.innerWidth <= 768;
    
    return {
      width: `${cardSize}px`,
      height: `${cardSize}px`,
      border: isSelected ? '3px solid #06b6d4' : '2px solid #e2e8f0',
      borderRadius: isMobile ? '6px' : '8px',
      backgroundColor: isMatched 
        ? 'transparent' 
        : card.isFlipped 
          ? 'rgba(255, 255, 255, 0.95)' // 翻开时半透明白色
          : 'transparent', // 背面透明，显示水晶背景
      background: isMatched 
        ? 'transparent' 
        : card.isFlipped 
          ? 'rgba(255, 255, 255, 0.95)'
          : 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', // 水晶蓝色背面
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${Math.max(isMobile ? 14 : 18, cardSize * 0.35)}px`,
      cursor: isMatched || isDisabled ? 'default' : 'pointer',
      transition: 'all 0.6s ease',
      transform: `${isSelected ? 'scale(1.05)' : 'scale(1)'} rotateY(${card.isFlipped ? '0deg' : '180deg'})`,
      transformStyle: 'preserve-3d',
      boxShadow: isSelected 
        ? '0 0 20px rgba(6, 182, 212, 0.6)' 
        : isMatched ? 'none' : isMobile ? '0 2px 6px rgba(0, 0, 0, 0.15)' : '0 3px 8px rgba(0, 0, 0, 0.15)',
      fontWeight: 'bold',
      opacity: isMatched ? 0 : isDisabled ? 0.6 : 1,
      zIndex: isSelected ? 10 : 1,
      position: 'relative',
      color: card.isFlipped ? '#1f2937' : '#ffffff',
      fontFamily: "'Noto Serif SC', serif" // 中文字体
    } as React.CSSProperties;
  };

  // 修复连线样式 - 重新计算坐标，考虑游戏容器的padding
  const getConnectionLineStyle = () => {
    if (!connectionPath || connectionPath.length < 2) return null;

    const gap = 6;
    const lines = [];
    
    // 获取游戏容器的padding值
    const containerPadding = window.innerWidth <= 768 ? 8 : 12;
    
    for (let i = 0; i < connectionPath.length - 1; i++) {
      const start = connectionPath[i];
      const end = connectionPath[i + 1];
      
      // 重新计算卡片中心点坐标 - 考虑容器padding
      const getX = (pos: Position) => {
        if (pos.col < 0) return containerPadding; // 左边界外
        if (pos.col >= GRID_SIZE_COLS) return GRID_SIZE_COLS * cardSize + (GRID_SIZE_COLS - 1) * gap + containerPadding + 20; // 右边界外
        return pos.col * (cardSize + gap) + cardSize / 2 + containerPadding; // 加上容器padding
      };

      const getY = (pos: Position) => {
        if (pos.row < 0) return containerPadding; // 上边界外
        if (pos.row >= GRID_SIZE_ROWS) return GRID_SIZE_ROWS * cardSize + (GRID_SIZE_ROWS - 1) * gap + containerPadding + 20; // 下边界外
        return pos.row * (cardSize + gap) + cardSize / 2 + containerPadding; // 加上容器padding
      };

      const x1 = getX(start);
      const y1 = getY(start);
      const x2 = getX(end);
      const y2 = getY(end);

      // 确保只绘制水平或垂直线段
      if (x1 === x2 || y1 === y2) {
        lines.push(
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#06b6d4"
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      }
    }

    // 端点标记 - 同样考虑容器padding
    const actualEndpoints = connectionPath.filter(pos => 
      pos.row >= 0 && pos.row < GRID_SIZE_ROWS && pos.col >= 0 && pos.col < GRID_SIZE_COLS
    );
    
    const endpointMarkers = [actualEndpoints[0], actualEndpoints[actualEndpoints.length - 1]]
      .filter(pos => pos)
      .map((pos, index) => (
        <circle
          key={`endpoint-${index}`}
          cx={pos.col * (cardSize + gap) + cardSize / 2 + containerPadding}
          cy={pos.row * (cardSize + gap) + cardSize / 2 + containerPadding}
          r="4"
          fill="#06b6d4"
          stroke="#ffffff"
          strokeWidth="2"
        />
      ));

    const svgWidth = GRID_SIZE_COLS * cardSize + (GRID_SIZE_COLS - 1) * gap + containerPadding * 2 + 20;
    const svgHeight = GRID_SIZE_ROWS * cardSize + (GRID_SIZE_ROWS - 1) * gap + containerPadding * 2 + 20;

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0, // 不再需要负偏移
          left: 0, // 不再需要负偏移
          width: svgWidth,
          height: svgHeight,
          pointerEvents: 'none',
          zIndex: 20
        }}
      >
        {lines}
        {endpointMarkers}
      </svg>
    );
  };

  // 成功动画效果 - 改为星星
  const getAnimationEffect = () => {
    if (animationState === 'none') return null;

    if (animationState === 'success') {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 30
        }}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${15 + i * 12}%`,
                left: `${8 + i * 12}%`,
                fontSize: '32px',
                animation: `sparkle 0.8s ease-out ${i * 0.1}s`,
                opacity: 0
              }}
            >
              ⭐
            </div>
          ))}
          <style>{`
            @keyframes sparkle {
              0% { opacity: 0; transform: scale(0.5) rotate(0deg); }
              50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
              100% { opacity: 0; transform: scale(0.8) rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

    return null;
  };

  // 字符解锁动画
  const getCharacterUnlockAnimation = () => {
    if (!isCharacterUnlocking || !justUnlockedChar) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        animation: 'fadeInOut 2s ease-in-out'
      }}>
        <div style={{
          textAlign: 'center',
          transform: 'scale(0.9)',
          animation: 'unlockPulse 1s ease-out'
        }}>
          <div style={{ 
            fontSize: '120px', 
            marginBottom: '20px',
            animation: 'characterFloat 1s ease-in-out infinite',
            fontFamily: "'Noto Serif SC', serif",
            color: '#06b6d4',
            textShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
          }}>
            {justUnlockedChar}
          </div>
          <h2 style={{ 
            fontSize: '28px', 
            color: '#1f2937',
            marginBottom: '12px',
            fontFamily: "'Noto Serif SC', serif"
          }}>
            字符解锁！
          </h2>
        </div>
        
        <style>{`
          @keyframes fadeInOut {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
          }
          
          @keyframes unlockPulse {
            0% { transform: scale(0.5); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          @keyframes characterFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    );
  };

  // 检查是否组成正确的诗句
  const checkCorrectOrder = () => {
    const correctOrder = ['星', '河', '流', '转', '依', '如', '初', '见'];
    return unlockedCharacters.length === 8 && 
           unlockedCharacters.every((char, index) => char === correctOrder[index]);
  };

  // 使用react-beautiful-dnd重构拖拽功能
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // 如果没有有效的目标位置，则不执行任何操作
    if (!destination) {
      return;
    }

    // 如果位置没有改变，则不执行任何操作
    if (destination.index === source.index) {
      return;
    }

    // 重新排列字符
    const newCharacters = Array.from(unlockedCharacters);
    const [removed] = newCharacters.splice(source.index, 1);
    newCharacters.splice(destination.index, 0, removed);

    setUnlockedCharacters(newCharacters);

    // 检查新的排列是否正确
    const correctOrder = ['星', '河', '流', '转', '依', '如', '初', '见'];
    const isCorrect = newCharacters.length === 8 && 
                     newCharacters.every((char, index) => char === correctOrder[index]);
    
    if (isCorrect) {
      setIsGameCompleted(true);
    }
  };

  // 成功展示组件 - 修改按钮文字
  const getSuccessDisplay = () => {
    if (!checkCorrectOrder()) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'fadeIn 0.5s ease-in-out'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '90%',
          maxHeight: '90%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          animation: 'scaleIn 0.5s ease-out'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#0891b2',
            fontFamily: "'Noto Serif SC', serif",
            letterSpacing: '2px',
            marginBottom: '20px'
          }}>
            星河流转依如初见
          </div>
          
          <img 
            src="https://cdn-tos-cn.bytedance.net/obj/aipa-tos/1b27a4d5-103b-4ea6-8ec6-25f43c4f84b0/003fe76fff22ba2c0ec0aa2774f45bde.png"
            alt="成功图片"
            style={{
              maxWidth: '100%',
              maxHeight: '400px',
              borderRadius: '8px',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
              marginBottom: '16px'
            }}
          />
          
          <button
            onClick={() => {
              // 重新开始游戏
              initializeGame();
            }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: "'Noto Serif SC', serif",
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(236, 72, 153, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.3)';
            }}
          >
            💕 爱你 💕
          </button>
        </div>
        
        <style>{`
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          
          @keyframes scaleIn {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)', // 水晶蓝色渐变
      padding: window.innerWidth <= 768 ? '8px' : '16px',
      position: 'relative'
    }}>
      <div style={{ 
        maxWidth: '700px', // 适应6×6网格，稍微增大容器
        margin: '0 auto',
        width: '100%' 
      }}>
        {/* 标题区域 - 钻石改星星 */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: window.innerWidth <= 768 ? '16px' : '24px',
          position: 'relative'
        }}>
          <h1 style={{ 
            fontSize: window.innerWidth <= 768 ? '22px' : '32px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            marginBottom: window.innerWidth <= 768 ? '6px' : '10px',
            lineHeight: '1.2',
            fontFamily: "'Noto Serif SC', serif",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            ⭐ For Crystal ⭐
            <button
              onClick={initializeGame}
              style={{
                padding: '8px',
                background: '#06b6d4',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                fontWeight: '600',
                width: window.innerWidth <= 768 ? '32px' : '36px',
                height: window.innerWidth <= 768 ? '32px' : '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(6, 182, 212, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = '#0891b2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#06b6d4';
              }}
            >
              🔄
            </button>
          </h1>
          {window.innerWidth > 768 && (
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              fontFamily: "'Noto Serif SC', serif"
            }}>
              配对相同字符，解锁诗句中的每一个字 (6×6网格)
            </p>
          )}
        </div>

        {/* 游戏区域 - 水晶背景 */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', // 水晶背景
          padding: window.innerWidth <= 768 ? '8px' : '12px',
          borderRadius: '12px',
          boxShadow: '0 6px 12px rgba(6, 182, 212, 0.2)',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          overflow: 'hidden',
          margin: window.innerWidth <= 768 ? '0 2px' : '0 8px',
          border: '2px solid rgba(6, 182, 212, 0.3)',
          transition: 'all 0.6s ease'
        }}>
          {/* 水晶纹理背景 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 25% 25%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(14, 165, 233, 0.1) 0%, transparent 50%)',
            zIndex: 1
          }} />
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE_COLS}, ${cardSize}px)`,
            gap: '6px',
            position: 'relative',
            maxWidth: '100%',
            padding: window.innerWidth <= 768 ? '2px' : '4px',
            zIndex: 2
          }}>
            {grid.map((row, rowIndex) =>
              row.map((card, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    width: `${cardSize}px`,
                    height: `${cardSize}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={getCardStyle(card)}
                    onClick={() => handleCardClick(card)}
                  >
                    {!card.isMatched && (card.isFlipped ? card.pattern : '⭐')}
                  </div>
                </div>
              ))
            )}
            {getConnectionLineStyle()}
          </div>
        </div>

        {/* 解锁字符显示区域 - 使用react-beautiful-dnd重构 */}
        <div style={{
          marginTop: window.innerWidth <= 768 ? '16px' : '20px',
          background: '#ffffff',
          padding: window.innerWidth <= 768 ? '12px' : '16px',
          borderRadius: '10px',
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
          margin: window.innerWidth <= 768 ? '16px 2px 0' : '20px 8px 0'
        }}>
          <div style={{
            minHeight: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unlockedCharacters.length === 0 ? (
              <div style={{
                color: '#9ca3af',
                fontSize: '12px',
                fontStyle: 'italic',
                fontFamily: "'Noto Serif SC', serif"
              }}>
                收集字符解锁诗句...
              </div>
            ) : unlockedCharacters.length < 8 ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '6px',
                alignItems: 'center'
              }}>
                {unlockedCharacters.map((character, index) => (
                  <div
                    key={`${character}-${index}`}
                    style={{
                      width: '32px',
                      height: '32px',
                      background: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)',
                      color: '#ffffff',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      fontFamily: "'Noto Serif SC', serif",
                      boxShadow: '0 2px 4px rgba(6, 182, 212, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {character}
                  </div>
                ))}
              </div>
            ) : (
              // 使用react-beautiful-dnd的拖拽区域
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="characters" direction="horizontal">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        padding: '8px',
                        borderRadius: '8px',
                        background: snapshot.isDraggingOver 
                          ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%)'
                          : 'transparent',
                        transition: 'background 0.2s ease',
                        minHeight: '48px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: snapshot.isDraggingOver 
                          ? '2px dashed rgba(6, 182, 212, 0.3)'
                          : '2px dashed transparent',
                        flexWrap: 'wrap'
                      }}
                    >
                      {unlockedCharacters.map((character, index) => (
                        <Draggable 
                          key={`character-${character}-${index}`} 
                          draggableId={`character-${character}-${index}`} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                width: '36px',
                                height: '36px',
                                background: checkCorrectOrder() 
                                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                                  : snapshot.isDragging
                                    ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
                                    : 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)',
                                color: '#ffffff',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                fontFamily: "'Noto Serif SC', serif",
                                cursor: 'grab',
                                boxShadow: snapshot.isDragging
                                  ? '0 8px 16px rgba(6, 182, 212, 0.4)'
                                  : checkCorrectOrder()
                                    ? '0 2px 4px rgba(16, 185, 129, 0.3)'
                                    : '0 2px 4px rgba(6, 182, 212, 0.3)',
                                transition: snapshot.isDragging ? 'none' : 'all 0.3s ease',
                                transform: snapshot.isDragging 
                                  ? `${provided.draggableProps.style?.transform} scale(1.05)` 
                                  : provided.draggableProps.style?.transform,
                                border: snapshot.isDragging 
                                  ? '2px solid rgba(255, 255, 255, 0.8)'
                                  : '2px solid transparent',
                                zIndex: snapshot.isDragging ? 1000 : 'auto'
                              }}
                            >
                              {character}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
          
          {/* 显示提示信息 */}
          {unlockedCharacters.length === 8 && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: checkCorrectOrder() 
                ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)' 
                : 'linear-gradient(135deg, #ecfeff 0%, #f0f9ff 100%)',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                fontFamily: "'Noto Serif SC', serif"
              }}>
                {checkCorrectOrder() 
                  ? '🎉 正确！游戏成功！' 
                  : '🎯 拖动字卡组成正确句子解锁惊喜'}
              </div>
              {!checkCorrectOrder() && (
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginTop: '4px',
                  fontFamily: "'Noto Serif SC', serif"
                }}>
                  提示：星河流转依如初见
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {getAnimationEffect()}
      {getCharacterUnlockAnimation()}
      {getSuccessDisplay()}
      
      {/* 添加中文字体 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap');
      `}</style>
    </div>
  );
};

export default App;
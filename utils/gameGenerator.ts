/**
 * 游戏数据生成器
 * 负责生成游戏图案、随机分布卡片到网格中
 */
import { Card, Position } from '../types/game';

// 默认图案集合（用户可以后续替换）
export const DEFAULT_PATTERNS = [
  '🎯', '🎮', '🎲', '🎪', '🎨',
  '🎸', '🎺', '🎻', '🎹', '🎤'
];

export class GameGenerator {
  static generateCards(patterns: string[] = DEFAULT_PATTERNS): Card[] {
    const cards: Card[] = [];
    
    patterns.forEach((pattern, index) => {
      // 每个图案生成两张卡片
      for (let i = 0; i < 2; i++) {
        cards.push({
          id: `${pattern}-${i}`,
          pattern,
          position: { row: 0, col: 0 }, // 临时位置
          isSelected: false,
          isMatched: false
        });
      }
    });

    return cards;
  }

  static distributeCardsToGrid(cards: Card[], gridSize: number = 20): (Card | null)[][] {
    const grid: (Card | null)[][] = Array(gridSize).fill(null)
      .map(() => Array(gridSize).fill(null));
    
    // 生成所有可用位置
    const availablePositions: Position[] = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        availablePositions.push({ row, col });
      }
    }

    // 随机打乱位置
    for (let i = availablePositions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePositions[i], availablePositions[j]] = [availablePositions[j], availablePositions[i]];
    }

    // 将卡片分配到随机位置
    cards.forEach((card, index) => {
      const position = availablePositions[index];
      card.position = position;
      grid[position.row][position.col] = card;
    });

    return grid;
  }

  static initializeGame(patterns?: string[]): (Card | null)[][] {
    const cards = this.generateCards(patterns);
    return this.distributeCardsToGrid(cards);
  }
}

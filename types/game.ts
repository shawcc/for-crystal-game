/**
 * 连连看游戏相关的类型定义
 * 包含卡片、位置、路径等核心数据结构
 */
export interface Position {
  row: number;
  col: number;
}

export interface Card {
  id: string;
  pattern: string;
  position: Position;
  isSelected: boolean;
  isMatched: boolean;
}

export interface PathPoint {
  row: number;
  col: number;
}

export interface GameState {
  cards: Card[];
  selectedCards: Card[];
  matchedPairs: number;
  totalPairs: number;
  isCompleted: boolean;
  score: number;
  timeElapsed: number;
}

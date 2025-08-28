/**
 * 游戏状态管理
 * 使用 jotai 管理全局游戏状态，包括网格、选中状态、完成状态等
 */
import { atom } from 'jotai';
import { Card, GameState, Position } from '../types/game';

// 网格大小常量
export const GRID_SIZE = 20;
export const TOTAL_PAIRS = 10;

// 游戏网格状态 - 二维数组，null表示空格子
export const gameGridAtom = atom<(Card | null)[][]>(() => {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
});

// 当前选中的卡片
export const selectedCardsAtom = atom<Card[]>([]);

// 已匹配的卡片对数
export const matchedPairsAtom = atom<number>(0);

// 游戏是否完成
export const isGameCompletedAtom = atom<boolean>(false);

// 分数
export const scoreAtom = atom<number>(0);

// 游戏时间
export const gameTimeAtom = atom<number>(0);

// 连线路径
export const connectionPathAtom = atom<Position[] | null>(null);

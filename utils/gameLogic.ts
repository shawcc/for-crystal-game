/**
 * 连线路径算法实现
 * 包含直线连接、一次拐弯、二次拐弯的路径检测算法
 */
import { Position, Card } from '../types/game';

export class PathFinder {
  private grid: (Card | null)[][];
  private rows: number;
  private cols: number;

  constructor(grid: (Card | null)[][]) {
    this.grid = grid;
    this.rows = grid.length;
    this.cols = grid[0].length;
  }

  // 检查位置是否为空（或者是目标位置）
  private isEmpty(row: number, col: number, target1: Position, target2: Position): boolean {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return false;
    }
    
    // 目标位置总是可以通过
    if ((row === target1.row && col === target1.col) || 
        (row === target2.row && col === target2.col)) {
      return true;
    }
    
    return this.grid[row][col] === null;
  }

  // 检查水平路径是否畅通
  private isHorizontalPathClear(row: number, col1: number, col2: number, target1: Position, target2: Position): boolean {
    const startCol = Math.min(col1, col2);
    const endCol = Math.max(col1, col2);
    
    for (let col = startCol; col <= endCol; col++) {
      if (!this.isEmpty(row, col, target1, target2)) {
        return false;
      }
    }
    return true;
  }

  // 检查垂直路径是否畅通
  private isVerticalPathClear(col: number, row1: number, row2: number, target1: Position, target2: Position): boolean {
    const startRow = Math.min(row1, row2);
    const endRow = Math.max(row1, row2);
    
    for (let row = startRow; row <= endRow; row++) {
      if (!this.isEmpty(row, col, target1, target2)) {
        return false;
      }
    }
    return true;
  }

  // 直线连接检测
  private findDirectPath(pos1: Position, pos2: Position): Position[] | null {
    // 水平直线
    if (pos1.row === pos2.row) {
      if (this.isHorizontalPathClear(pos1.row, pos1.col, pos2.col, pos1, pos2)) {
        return [pos1, pos2];
      }
    }
    
    // 垂直直线
    if (pos1.col === pos2.col) {
      if (this.isVerticalPathClear(pos1.col, pos1.row, pos2.row, pos1, pos2)) {
        return [pos1, pos2];
      }
    }
    
    return null;
  }

  // 一次拐弯连接检测
  private findOneCornerPath(pos1: Position, pos2: Position): Position[] | null {
    // 尝试路径1: pos1 -> (pos1.row, pos2.col) -> pos2
    const corner1 = { row: pos1.row, col: pos2.col };
    if (this.isEmpty(corner1.row, corner1.col, pos1, pos2)) {
      if (this.isHorizontalPathClear(pos1.row, pos1.col, corner1.col, pos1, pos2) &&
          this.isVerticalPathClear(corner1.col, corner1.row, pos2.row, pos1, pos2)) {
        return [pos1, corner1, pos2];
      }
    }

    // 尝试路径2: pos1 -> (pos2.row, pos1.col) -> pos2
    const corner2 = { row: pos2.row, col: pos1.col };
    if (this.isEmpty(corner2.row, corner2.col, pos1, pos2)) {
      if (this.isVerticalPathClear(pos1.col, pos1.row, corner2.row, pos1, pos2) &&
          this.isHorizontalPathClear(corner2.row, corner2.col, pos2.col, pos1, pos2)) {
        return [pos1, corner2, pos2];
      }
    }

    return null;
  }

  // 两次拐弯连接检测
  private findTwoCornerPath(pos1: Position, pos2: Position): Position[] | null {
    // 水平扩展检测
    for (let col = 0; col < this.cols; col++) {
      if (col === pos1.col && col === pos2.col) continue;
      
      const corner1 = { row: pos1.row, col };
      const corner2 = { row: pos2.row, col };
      
      if (this.isEmpty(corner1.row, corner1.col, pos1, pos2) &&
          this.isEmpty(corner2.row, corner2.col, pos1, pos2)) {
        
        if (this.isHorizontalPathClear(pos1.row, pos1.col, corner1.col, pos1, pos2) &&
            this.isVerticalPathClear(corner1.col, corner1.row, corner2.row, pos1, pos2) &&
            this.isHorizontalPathClear(corner2.row, corner2.col, pos2.col, pos1, pos2)) {
          return [pos1, corner1, corner2, pos2];
        }
      }
    }

    // 垂直扩展检测
    for (let row = 0; row < this.rows; row++) {
      if (row === pos1.row && row === pos2.row) continue;
      
      const corner1 = { row, col: pos1.col };
      const corner2 = { row, col: pos2.col };
      
      if (this.isEmpty(corner1.row, corner1.col, pos1, pos2) &&
          this.isEmpty(corner2.row, corner2.col, pos1, pos2)) {
        
        if (this.isVerticalPathClear(pos1.col, pos1.row, corner1.row, pos1, pos2) &&
            this.isHorizontalPathClear(corner1.row, corner1.col, corner2.col, pos1, pos2) &&
            this.isVerticalPathClear(corner2.col, corner2.row, pos2.row, pos1, pos2)) {
          return [pos1, corner1, corner2, pos2];
        }
      }
    }

    return null;
  }

  // 寻找连接路径
  public findPath(pos1: Position, pos2: Position): Position[] | null {
    // 尝试直线连接
    let path = this.findDirectPath(pos1, pos2);
    if (path) return path;

    // 尝试一次拐弯
    path = this.findOneCornerPath(pos1, pos2);
    if (path) return path;

    // 尝试两次拐弯
    path = this.findTwoCornerPath(pos1, pos2);
    if (path) return path;

    return null;
  }
}

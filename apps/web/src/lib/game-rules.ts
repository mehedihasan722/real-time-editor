export function lineWinner(board: number[], columns: number, rows: number, length: number): number {
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    const value = board[y * columns + x];
    if (!value) continue;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const endX = x + dx * (length - 1), endY = y + dy * (length - 1);
      if (endX < 0 || endX >= columns || endY < 0 || endY >= rows) continue;
      if (Array.from({ length }, (_, i) => board[(y + dy * i) * columns + x + dx * i]).every(cell => cell === value)) return value;
    }
  }
  return 0;
}
export function mergeTiles(board: number[], direction: number): { board: number[]; score: number; changed: boolean } {
  const result = [...board]; let score = 0;
  for (let line = 0; line < 4; line++) {
    const indices = Array.from({ length: 4 }, (_, i) => direction === 0 ? line * 4 + i : direction === 1 ? line * 4 + 3 - i : direction === 2 ? i * 4 + line : (3 - i) * 4 + line);
    const values = indices.map(i => board[i]).filter(Boolean), merged: number[] = [];
    for (let i = 0; i < values.length; i++) {
      if (values[i] === values[i + 1]) { merged.push(values[i] * 2); score += values[i] * 2; i++; }
      else merged.push(values[i]);
    }
    indices.forEach((index, i) => { result[index] = merged[i] ?? 0; });
  }
  return { board: result, score, changed: result.some((value, i) => value !== board[i]) };
}
export function mineNeighbors(index: number, columns = 8, rows = 8): number[] {
  const x = index % columns, y = Math.floor(index / columns), result: number[] = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && x + dx >= 0 && x + dx < columns && y + dy >= 0 && y + dy < rows) result.push((y + dy) * columns + x + dx);
  return result;
}
export function eggCluster(board: number[], index: number, columns = 10): number[] {
  const color = board[index]; if (color < 0) return [];
  const found = new Set<number>([index]), queue = [index];
  while (queue.length) {
    const at = queue.pop()!;
    for (const next of [at - columns, at + columns, ...(at % columns ? [at - 1] : []), ...(at % columns < columns - 1 ? [at + 1] : [])]) {
      if (next >= 0 && next < board.length && !found.has(next) && board[next] === color) { found.add(next); queue.push(next); }
    }
  }
  return [...found];
}

// backend/game.js - pure functional logic for 2048 (ESM version)

// 🧩 Initialize a new board of given size and add two random tiles
export const initializeBoard = (size = 4) => {
  const board = Array.from({ length: size }, () => Array(size).fill(0));
  const withOne = addRandomTile(board);
  const withTwo = addRandomTile(withOne);
  return withTwo;
};

// 🧠 Return a deep-copied board
export const cloneBoard = (board) => board.map((row) => [...row]);

// 🎲 Add a random tile (2 or 4) to an empty position; returns a new board
export const addRandomTile = (board) => {
  const size = board.length;
  const empty = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === 0) empty.push([i, j]);
    }
  }
  if (empty.length === 0) return cloneBoard(board);
  const [x, y] = empty[Math.floor(Math.random() * empty.length)];
  const next = cloneBoard(board);
  next[x][y] = Math.random() < 0.9 ? 2 : 4;
  return next;
};

// 🔍 Check if there are possible moves on the board
export const hasPossibleMoves = (board) => {
  const size = board.length;
  // Any empty cell
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === 0) return true;
    }
  }
  // Any mergeable neighbors
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (j + 1 < size && board[i][j] === board[i][j + 1]) return true;
      if (i + 1 < size && board[i][j] === board[i + 1][j]) return true;
    }
  }
  return false;
};

// ↔️ Slide a single row left, merging equal neighbors once
export const slideLeft = (row) => {
  const filtered = row.filter((v) => v !== 0);
  const merged = [];
  let scoreDelta = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      merged.push(val);
      scoreDelta += val;
      i++; // skip the next one
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < row.length) merged.push(0);
  return [merged, scoreDelta];
};

// 🔄 Rotate board 90° clockwise `times` times
export const rotateBoard = (board, times) => {
  let rotated = cloneBoard(board);
  for (let t = 0; t < (times % 4 + 4) % 4; t++) {
    const size = rotated.length;
    const next = Array.from({ length: size }, () => Array(size).fill(0));
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        next[j][size - 1 - i] = rotated[i][j];
      }
    }
    rotated = next;
  }
  return rotated;
};

// 🎮 Perform a move in one of: 'left' | 'right' | 'up' | 'down'
export const move = (board, direction) => {
  const size = board.length;
  let rotations = 0;
  if (direction === 'up') rotations = 1;
  else if (direction === 'right') rotations = 2;
  else if (direction === 'down') rotations = 3;
  else rotations = 0; // left

  let working = rotateBoard(board, rotations);
  let totalDelta = 0;
  const after = working.map((row) => {
    const [slid, delta] = slideLeft(row);
    totalDelta += delta;
    return slid;
  });

  const unrotated = rotateBoard(after, (4 - rotations) % 4);

  const moved = JSON.stringify(board) !== JSON.stringify(unrotated);
  const withRandom = moved ? addRandomTile(unrotated) : unrotated;
  const won = withRandom.flat().includes(2048);
  const gameOver = !won && !hasPossibleMoves(withRandom);

  return {
    board: withRandom,
    scoreDelta: totalDelta,
    moved,
    won,
    gameOver,
  };
};

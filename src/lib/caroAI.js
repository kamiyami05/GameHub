export const CARO_SIZE = 20;
export const EMPTY = 0;
export const PLAYER = 1;
export const AI = 2;

const SCORES = {
  FIVE: 100000000,
  OPEN_FOUR: 10000000,
  BLOCKED_FOUR: 1000000,
  OPEN_THREE: 150000,
  BLOCKED_THREE: 4000,
  OPEN_TWO: 400,
  BLOCKED_TWO: 20,
  DOUBLE_THREE: 1200000,
  FOUR_THREE: 3000000
};

const DIRECTIONS = [
  [[0, 1], [0, -1]],   // Ngang
  [[1, 0], [-1, 0]],   // Dọc
  [[1, 1], [-1, -1]],  // Chéo chính
  [[1, -1], [-1, 1]]   // Chéo phụ
];

export function inBounds(r, c) {
  return r >= 0 && r < CARO_SIZE && c >= 0 && c < CARO_SIZE;
}

export function checkCaroWinner(board) {
  for (let r = 0; r < CARO_SIZE; r++) {
    for (let c = 0; c < CARO_SIZE; c++) {
      const val = board[r][c];
      if (val === EMPTY) continue;

      for (const dir of DIRECTIONS) {
        let count = 1;
        const cells = [{ r, c }];

        for (const [dr, dc] of dir) {
          let nr = r + dr, nc = c + dc;
          while (inBounds(nr, nc) && board[nr][nc] === val) {
            cells.push({ r: nr, c: nc });
            count++;
            nr += dr;
            nc += dc;
          }
        }

        if (count >= 5) {
          return { winner: val, cells };
        }
      }
    }
  }

  let isFull = true;
  for (let r = 0; r < CARO_SIZE; r++) {
    for (let c = 0; c < CARO_SIZE; c++) {
      if (board[r][c] === EMPTY) {
        isFull = false;
        break;
      }
    }
    if (!isFull) break;
  }

  if (isFull) return { winner: 'tie', cells: [] };
  return null;
}

export function getCandidateMoves(board, radius = 2) {
  const candidates = [];
  const visited = Array.from({ length: CARO_SIZE }, () => Array(CARO_SIZE).fill(false));
  let hasPiece = false;

  for (let r = 0; r < CARO_SIZE; r++) {
    for (let c = 0; c < CARO_SIZE; c++) {
      if (board[r][c] !== EMPTY) {
        hasPiece = true;
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const nr = r + dr, nc = c + dc;
            if (inBounds(nr, nc) && board[nr][nc] === EMPTY && !visited[nr][nc]) {
              visited[nr][nc] = true;
              candidates.push({ r: nr, c: nc });
            }
          }
        }
      }
    }
  }

  if (!hasPiece) {
    return [{ r: Math.floor(CARO_SIZE / 2), c: Math.floor(CARO_SIZE / 2) }];
  }
  return candidates;
}

function evaluateLine(count, openEnds) {
  if (count >= 5) return SCORES.FIVE;
  if (count === 4) return openEnds === 2 ? SCORES.OPEN_FOUR : (openEnds === 1 ? SCORES.BLOCKED_FOUR : 0);
  if (count === 3) return openEnds === 2 ? SCORES.OPEN_THREE : (openEnds === 1 ? SCORES.BLOCKED_THREE : 0);
  if (count === 2) return openEnds === 2 ? SCORES.OPEN_TWO : (openEnds === 1 ? SCORES.BLOCKED_TWO : 0);
  return 0;
}

function evaluatePointForPlayer(board, r, c, player) {
  let total = 0, openThreeCount = 0, fourCount = 0;
  for (const dir of DIRECTIONS) {
    let count = 1, openEnds = 0;
    let [dr1, dc1] = dir[0], nr = r + dr1, nc = c + dc1;
    while (inBounds(nr, nc) && board[nr][nc] === player) { count++; nr += dr1; nc += dc1; }
    if (inBounds(nr, nc) && board[nr][nc] === EMPTY) openEnds++;

    let [dr2, dc2] = dir[1]; nr = r + dr2; nc = c + dc2;
    while (inBounds(nr, nc) && board[nr][nc] === player) { count++; nr += dr2; nc += dc2; }
    if (inBounds(nr, nc) && board[nr][nc] === EMPTY) openEnds++;

    const score = evaluateLine(count, openEnds);
    if (score === SCORES.OPEN_THREE) openThreeCount++;
    if (score === SCORES.OPEN_FOUR || score === SCORES.BLOCKED_FOUR) fourCount++;
    total += score;
  }
  if (openThreeCount >= 2) total += SCORES.DOUBLE_THREE;
  if (openThreeCount >= 1 && fourCount >= 1) total += SCORES.FOUR_THREE;
  return total;
}

function evaluatePosition(board, r, c, defenseMultiplier = 1.3) {
  return evaluatePointForPlayer(board, r, c, AI) + evaluatePointForPlayer(board, r, c, PLAYER) * defenseMultiplier;
}

export function getCaroBestMove(board, difficulty = 'hard') {
  const candidates = getCandidateMoves(board, 2);
  if (candidates.length === 0) return { r: Math.floor(CARO_SIZE / 2), c: Math.floor(CARO_SIZE / 2) };

  // 1. Phản xạ thắng tức thì
  for (const m of candidates) {
    board[m.r][m.c] = AI;
    const w = checkCaroWinner(board);
    board[m.r][m.c] = EMPTY;
    if (w && w.winner === AI) return m;
  }

  // 2. Phản xạ chặn thua tức thì
  for (const m of candidates) {
    board[m.r][m.c] = PLAYER;
    const w = checkCaroWinner(board);
    board[m.r][m.c] = EMPTY;
    if (w && w.winner === PLAYER) return m;
  }

  // 3. Phân chia theo cấp độ
  if (difficulty === 'easy') {
    candidates.forEach(m => { m.score = evaluatePosition(board, m.r, m.c, 1.0); });
    candidates.sort((a, b) => b.score - a.score);
    if (Math.random() < 0.35 && candidates.length > 2) {
      return candidates[Math.floor(Math.random() * Math.min(3, candidates.length))];
    }
    return candidates[0];
  }

  const depth = difficulty === 'impossible' ? 4 : 3;
  const defMult = difficulty === 'impossible' ? 1.35 : 1.25;
  const candidateCount = difficulty === 'impossible' ? 14 : 10;

  candidates.forEach(m => { m.score = evaluatePosition(board, m.r, m.c, defMult); });
  candidates.sort((a, b) => b.score - a.score);

  if (candidates[0] && candidates[0].score >= SCORES.OPEN_FOUR) {
    return candidates[0];
  }

  const topCandidates = candidates.slice(0, candidateCount);
  let bestScore = -Infinity;
  let bestMove = topCandidates[0];

  for (const move of topCandidates) {
    board[move.r][move.c] = AI;
    const score = minimax(board, depth - 1, false, -Infinity, Infinity, defMult);
    board[move.r][move.c] = EMPTY;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

function minimax(board, depth, isMaximizing, alpha, beta, defMult) {
  if (depth === 0) {
    let evalSum = 0;
    for (let r = 0; r < CARO_SIZE; r++) {
      for (let c = 0; c < CARO_SIZE; c++) {
        if (board[r][c] === AI) evalSum += evaluatePointForPlayer(board, r, c, AI);
        else if (board[r][c] === PLAYER) evalSum -= evaluatePointForPlayer(board, r, c, PLAYER) * defMult;
      }
    }
    return evalSum;
  }

  const candidates = getCandidateMoves(board, 1).slice(0, 8);
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const m of candidates) {
      board[m.r][m.c] = AI;
      const ev = minimax(board, depth - 1, false, alpha, beta, defMult);
      board[m.r][m.c] = EMPTY;
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of candidates) {
      board[m.r][m.c] = PLAYER;
      const ev = minimax(board, depth - 1, true, alpha, beta, defMult);
      board[m.r][m.c] = EMPTY;
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

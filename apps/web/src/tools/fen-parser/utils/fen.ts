/**
 * 国际象棋 FEN（Forsyth–Edwards Notation）解析 / 校验 / 序列化（零依赖纯函数）
 *
 * 结构错误（阻断渲染）与合法性警告（不阻断渲染）分离；本模块不推断走子合法性
 * （将军、易位通路是否被阻挡等不在范围内）。
 */

export type Color = 'w' | 'b';

/** 棋盘格：null 表示空格，否则为 FEN 棋子字符（PNBRQK 白 / pnbrqk 黑） */
export type Cell = string | null;
export type Board = Cell[][]; // board[rankIndex 0=第8横线 .. 7=第1横线][fileIndex 0=a .. 7=h]

export interface FenWarning {
  code: string;
  message: string;
}

export interface ParsedFen {
  board: Board;
  sideToMove: Color;
  castling: string; // 规范化后的易位字段（KQkq 排序或 '-'）
  enPassant: string; // '-' 或目标格（如 e3）
  halfmove: number;
  fullmove: number;
  /** 输入是否只提供了 4 个字段（计数被补全） */
  countsDefaulted: boolean;
  /** 规范化 FEN（易位按 KQkq 排序、计数补全、空格归一） */
  normalizedFen: string;
  pieceCount: number;
  warnings: FenWarning[];
}

const RANK_COUNT = 8;
const FILE_COUNT = 8;
const VALID_PIECES = new Set(['P', 'N', 'B', 'R', 'Q', 'K', 'p', 'n', 'b', 'r', 'q', 'k']);
const CASTLE_ORDER = ['K', 'Q', 'k', 'q'];
const UNICODE_PIECES: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};
const MAX_COUNTER = 100000;

function fail(message: string): never {
  throw new Error(message);
}

/** 将单条横线（如 rnbqkbnr / 4k3）展开为 8 个格子 */
function expandRank(rank: string, rankNo: number): Cell[] {
  const cells: Cell[] = [];
  let pendingDigit = false;
  for (let i = 0; i < rank.length; i += 1) {
    const ch = rank[i] as string;
    if (ch >= '1' && ch <= '8') {
      if (pendingDigit) {
        fail(`第 ${rankNo} 横线含连续数字（空格数必须写成单个数字 1–8），位置 ${i + 1}`);
      }
      const spaces = Number(ch);
      for (let s = 0; s < spaces; s += 1) cells.push(null);
      pendingDigit = true;
    } else {
      if (!VALID_PIECES.has(ch)) {
        fail(`第 ${rankNo} 横线含非法棋子字符「${ch}」，位置 ${i + 1}`);
      }
      cells.push(ch);
      pendingDigit = false;
    }
  }
  if (cells.length !== FILE_COUNT) {
    fail(`第 ${rankNo} 横线合计 ${cells.length} 格，应为 8 格`);
  }
  return cells;
}

function parseCounter(raw: string, name: string): number {
  if (!/^\d+$/.test(raw)) {
    fail(`${name}必须是非负整数，收到「${raw}」`);
  }
  const value = Number(raw);
  if (value > MAX_COUNTER) {
    fail(`${name}不得超过 ${MAX_COUNTER}`);
  }
  return value;
}

function normalizeCastling(raw: string): string {
  if (raw === '-') return '-';
  const seen = new Set<string>();
  for (const ch of raw) {
    if (!CASTLE_ORDER.includes(ch)) {
      fail(`易位权利含非法字符「${ch}」，只允许 K / Q / k / q 或 -`);
    }
    if (seen.has(ch)) {
      fail(`易位权利「${raw}」存在重复字符「${ch}」`);
    }
    seen.add(ch);
  }
  return CASTLE_ORDER.filter((ch) => seen.has(ch)).join('');
}

function validateEnPassant(raw: string): string {
  if (raw === '-') return '-';
  if (!/^[a-h][36]$/.test(raw)) {
    fail(`吃过路兵目标格「${raw}」非法，应为 - 或 a–h 文件加第 3 / 6 横线（如 e3、d6）`);
  }
  return raw;
}

export function parseFen(input: string): ParsedFen {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  if (trimmed === '') fail('FEN 输入为空');
  const fields = trimmed.split(' ');
  if (fields.length < 4 || fields.length > 6) {
    fail(`FEN 字段数为 ${fields.length}，应为 4–6 个（布局 / 走子方 / 易位 / 过路兵 [/ 半回合 / 回合数]）`);
  }

  const [placement, sideRaw, castlingRaw, epRaw, halfRaw, fullRaw] = fields;
  const ranks = (placement as string).split('/');
  if (ranks.length !== RANK_COUNT) {
    fail(`布局字段含 ${ranks.length} 条横线，应为 8 条（以 / 分隔）`);
  }
  // 输入从第 8 横线写到第 1 横线
  const board: Board = ranks.map((rank, index) => expandRank(rank, RANK_COUNT - index));

  if (sideRaw !== 'w' && sideRaw !== 'b') {
    fail(`走子方「${sideRaw}」非法，只允许 w 或 b`);
  }
  const sideToMove: Color = sideRaw;
  const castling = normalizeCastling(castlingRaw as string);
  const enPassant = validateEnPassant(epRaw as string);

  const countsDefaulted = fields.length === 4;
  const halfmove = halfRaw === undefined ? 0 : parseCounter(halfRaw, '半回合计数');
  const fullmove = fullRaw === undefined ? 1 : parseCounter(fullRaw as string, '回合数');
  if (fields.length === 5) {
    fail('只提供了 5 个字段：半回合计数与回合数必须同时给出，或同时省略（省略时补 0 与 1）');
  }
  if (!countsDefaulted && fullmove === 0) {
    fail('回合数（fullmove）必须从 1 开始，不能为 0');
  }

  const warnings = collectWarnings(board, castling, enPassant, sideToMove);
  let pieceCount = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell !== null) pieceCount += 1;
    }
  }

  const normalizedFen = [
    serializePlacement(board),
    sideToMove,
    castling,
    enPassant,
    String(halfmove),
    String(fullmove),
  ].join(' ');

  return {
    board,
    sideToMove,
    castling,
    enPassant,
    halfmove,
    fullmove,
    countsDefaulted,
    normalizedFen,
    pieceCount,
    warnings,
  };
}

function countPiece(board: Board, piece: string): number {
  let n = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === piece) n += 1;
    }
  }
  return n;
}

function collectWarnings(board: Board, castling: string, enPassant: string, side: Color): FenWarning[] {
  const warnings: FenWarning[] = [];

  // 王数量
  const whiteKings = countPiece(board, 'K');
  const blackKings = countPiece(board, 'k');
  if (whiteKings === 0) warnings.push({ code: 'NO_WHITE_KING', message: '缺少白王（K）：合法局面应有且仅有一个白王' });
  if (whiteKings > 1) warnings.push({ code: 'MULTI_WHITE_KING', message: `白王数量为 ${whiteKings}，合法局面只能有一个` });
  if (blackKings === 0) warnings.push({ code: 'NO_BLACK_KING', message: '缺少黑王（k）：合法局面应有且仅有一个黑王' });
  if (blackKings > 1) warnings.push({ code: 'MULTI_BLACK_KING', message: `黑王数量为 ${blackKings}，合法局面只能有一个` });

  // 兵不得在首末横线：board[0] = 第 8 横线，board[7] = 第 1 横线
  for (const cell of board[0] ?? []) {
    if (cell === 'P' || cell === 'p') {
      warnings.push({ code: 'PAWN_ON_RANK_8', message: '第 8 横线出现兵：兵到达末横线时必须升变，不能以兵形态停留' });
      break;
    }
  }
  for (const cell of board[7] ?? []) {
    if (cell === 'P' || cell === 'p') {
      warnings.push({ code: 'PAWN_ON_RANK_1', message: '第 1 横线出现兵：兵的初始位置不在首横线，该局面不合法' });
      break;
    }
  }

  // 易位权利与王 / 车位置一致性
  const pieceAt = (file: number, rankFromBottom: number): Cell =>
    board[RANK_COUNT - rankFromBottom]?.[file] ?? null;
  const whiteKingOk = pieceAt(4, 1) === 'K'; // e1
  const blackKingOk = pieceAt(4, 8) === 'k'; // e8
  if (castling.includes('K') && !(whiteKingOk && pieceAt(7, 1) === 'R')) {
    warnings.push({ code: 'CASTLING_K_NO_PIECES', message: '易位权利 K 要求白王在 e1 且 h1 有白车，当前位置不满足' });
  }
  if (castling.includes('Q') && !(whiteKingOk && pieceAt(0, 1) === 'R')) {
    warnings.push({ code: 'CASTLING_Q_NO_PIECES', message: '易位权利 Q 要求白王在 e1 且 a1 有白车，当前位置不满足' });
  }
  if (castling.includes('k') && !(blackKingOk && pieceAt(7, 8) === 'r')) {
    warnings.push({ code: 'CASTLING_k_NO_PIECES', message: '易位权利 k 要求黑王在 e8 且 h8 有黑车，当前位置不满足' });
  }
  if (castling.includes('q') && !(blackKingOk && pieceAt(0, 8) === 'r')) {
    warnings.push({ code: 'CASTLING_q_NO_PIECES', message: '易位权利 q 要求黑王在 e8 且 a8 有黑车，当前位置不满足' });
  }

  // 吃过路兵目标格校验
  if (enPassant !== '-') {
    const file = enPassant[0] as string;
    const rank = Number(enPassant[1]);
    const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);
    if ((side === 'w' && rank !== 6) || (side === 'b' && rank !== 3)) {
      warnings.push({
        code: 'EP_SIDE_MISMATCH',
        message: `吃过路兵目标格 ${enPassant} 与走子方 ${side === 'w' ? '白（w）' : '黑（b）'} 不匹配：白方走子应在第 6 横线，黑方应在第 3 横线`,
      });
    }
    const targetRow = RANK_COUNT - rank;
    if (board[targetRow]?.[fileIndex] !== null) {
      warnings.push({ code: 'EP_SQUARE_OCCUPIED', message: `吃过路兵目标格 ${enPassant} 非空，该格应为空格` });
    }
    // 对应兵应在目标格的上 / 下一横线：白方走子 → 黑兵在第 5 横线；黑方走子 → 白兵在第 4 横线
    const pawnRank = side === 'w' ? 5 : 4;
    const expectedPawn = side === 'w' ? 'p' : 'P';
    if (board[RANK_COUNT - pawnRank]?.[fileIndex] !== expectedPawn) {
      warnings.push({
        code: 'EP_NO_PAWN',
        message: `吃过路兵目标格 ${enPassant} 缺少对应${side === 'w' ? '黑' : '白'}兵（${file}${pawnRank} 应为 ${expectedPawn}）`,
      });
    }
  }

  return warnings;
}

/** 将棋盘矩阵序列化为 FEN 布局字段（连续空格压缩为数字） */
export function serializePlacement(board: Board): string {
  return board
    .map((row) => {
      let out = '';
      let empty = 0;
      for (const cell of row) {
        if (cell === null) {
          empty += 1;
        } else {
          if (empty > 0) {
            out += String(empty);
            empty = 0;
          }
          out += cell;
        }
      }
      if (empty > 0) out += String(empty);
      return out;
    })
    .join('/');
}

/** 渲染 Unicode 棋盘行（含坐标），view='w' 白方视角（8 横线在上），'b' 黑方视角 */
export function renderUnicodeBoard(board: Board, view: Color = 'w'): string[] {
  const lines: string[] = [];
  const rowOrder = view === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const colOrder = view === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  for (const rowIndex of rowOrder) {
    const rankNo = RANK_COUNT - rowIndex;
    const cells = colOrder.map((colIndex) => {
      const cell = board[rowIndex]?.[colIndex] ?? null;
      return cell === null ? '·' : UNICODE_PIECES[cell] ?? cell;
    });
    lines.push(`${rankNo} ${cells.join(' ')}`);
  }
  const files = colOrder.map((colIndex) => 'abcdefgh'[colIndex]).join(' ');
  lines.push(`  ${files}`);
  return lines;
}

/** 渲染 ASCII 棋盘（PNBRQK / pnbrqk / 点号空格） */
export function renderAsciiBoard(board: Board, view: Color = 'w'): string[] {
  const lines: string[] = [];
  const rowOrder = view === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const colOrder = view === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  for (const rowIndex of rowOrder) {
    const rankNo = RANK_COUNT - rowIndex;
    const cells = colOrder.map((colIndex) => board[rowIndex]?.[colIndex] ?? '.');
    lines.push(`${rankNo} ${cells.join(' ')}`);
  }
  const files = colOrder.map((colIndex) => 'abcdefgh'[colIndex]).join(' ');
  lines.push(`  ${files}`);
  return lines;
}

export const SAMPLE_INITIAL_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export const SAMPLE_EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';

import { SAMPLE_INITIAL_FEN, SAMPLE_EMPTY_FEN } from './utils/fen';

export type ViewPerspective = 'w' | 'b';
export type BoardRenderMode = 'unicode' | 'ascii';

export const VIEW_OPTIONS: { value: ViewPerspective; label: string }[] = [
  { value: 'w', label: '白方视角（第 8 横线在上，a→h）' },
  { value: 'b', label: '黑方视角（第 1 横线在上，h→a）' },
];

export const RENDER_OPTIONS: { value: BoardRenderMode; label: string }[] = [
  { value: 'unicode', label: 'Unicode 棋子棋盘' },
  { value: 'ascii', label: 'ASCII 棋盘（等宽稳定）' },
];

export const SAMPLE_FENS: { label: string; fen: string }[] = [
  { label: '初始局面', fen: SAMPLE_INITIAL_FEN },
  { label: '全空棋盘（触发缺王警告）', fen: SAMPLE_EMPTY_FEN },
  { label: '易位权利乱序（qkQK → KQkq）', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w qkQK - 0 1' },
  { label: '4 字段省略计数', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -' },
];

export const DEFAULT_FEN = SAMPLE_INITIAL_FEN;

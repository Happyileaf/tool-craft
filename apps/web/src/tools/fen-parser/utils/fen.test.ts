import { describe, it, expect } from 'vitest';
import {
  parseFen,
  serializePlacement,
  renderUnicodeBoard,
  renderAsciiBoard,
  SAMPLE_INITIAL_FEN,
  SAMPLE_EMPTY_FEN,
} from './fen';

const INITIAL = SAMPLE_INITIAL_FEN;

describe('parseFen 结构解析', () => {
  it('acceptance: 初始局面解析成功，32 棋子、无错误无警告、规范化 FEN 与输入一致', () => {
    const parsed = parseFen(INITIAL);
    expect(parsed.pieceCount).toBe(32);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.sideToMove).toBe('w');
    expect(parsed.castling).toBe('KQkq');
    expect(parsed.enPassant).toBe('-');
    expect(parsed.halfmove).toBe(0);
    expect(parsed.fullmove).toBe(1);
    expect(parsed.normalizedFen).toBe(INITIAL);
    expect(parsed.countsDefaulted).toBe(false);
  });

  it('acceptance: 末横线少一格 → 结构错误并指明第 1 横线（输入末条）合计 7 格', () => {
    const bad = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN w KQkq - 0 1';
    expect(() => parseFen(bad)).toThrow(/第 1 横线合计 7 格/);
  });

  it('acceptance: 非法棋子字符 X → 结构错误并指明字符与位置', () => {
    const bad = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNX w KQkq - 0 1';
    expect(() => parseFen(bad)).toThrow(/非法棋子字符「X」/);
  });

  it('acceptance: 全空棋盘可渲染，并给出缺少白王 / 黑王两条警告', () => {
    const parsed = parseFen(SAMPLE_EMPTY_FEN);
    expect(parsed.pieceCount).toBe(0);
    const codes = parsed.warnings.map((w) => w.code);
    expect(codes).toContain('NO_WHITE_KING');
    expect(codes).toContain('NO_BLACK_KING');
  });

  it('acceptance: 兵位于第 8 横线 → PAWN_ON_RANK_8 警告（同时允许缺王警告）', () => {
    const parsed = parseFen('P7/8/8/8/8/8/8/8 w - - 0 1');
    const codes = parsed.warnings.map((w) => w.code);
    expect(codes).toContain('PAWN_ON_RANK_8');
    expect(codes).toContain('NO_WHITE_KING');
    expect(codes).toContain('NO_BLACK_KING');
  });

  it('acceptance: 易位权利乱序 qkQK → 规范化为 KQkq；重复 KK → 结构错误', () => {
    const parsed = parseFen(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w qkQK - 0 1',
    );
    expect(parsed.castling).toBe('KQkq');
    expect(parsed.normalizedFen).toContain(' w KQkq ');

    expect(() =>
      parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KK - 0 1'),
    ).toThrow(/重复字符「K」/);
  });

  it('acceptance: KQ 易位但缺少对应车 → 警告；e6 过路兵无对应兵 → EP_NO_PAWN 警告', () => {
    const castlingWarn = parseFen('4k3/8/8/8/8/8/8/4K3 w KQ - 0 1');
    const castlingCodes = castlingWarn.warnings.map((w) => w.code);
    expect(castlingCodes).toContain('CASTLING_K_NO_PIECES');
    expect(castlingCodes).toContain('CASTLING_Q_NO_PIECES');

    const epWarn = parseFen('4k3/8/8/8/8/8/8/4K3 w - e6 0 1');
    const epCodes = epWarn.warnings.map((w) => w.code);
    expect(epCodes).toContain('EP_NO_PAWN');
  });

  it('acceptance: 4 字段 FEN 补全 0 1 并标记 countsDefaulted；黑方视角首行第 1 横线且文件 h→a', () => {
    const parsed = parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -');
    expect(parsed.countsDefaulted).toBe(true);
    expect(parsed.halfmove).toBe(0);
    expect(parsed.fullmove).toBe(1);
    expect(parsed.normalizedFen).toBe(INITIAL);

    const blackView = renderUnicodeBoard(parsed.board, 'b');
    expect(blackView[0]?.startsWith('1 ')).toBe(true);
    expect(blackView[blackView.length - 1]).toContain('h g f e d c b a');
  });
});

describe('parseFen 其余结构校验', () => {
  it('字段数 3 或 7 → 报错', () => {
    expect(() => parseFen('8/8/8/8/8/8/8/8 w')).toThrow(/字段数/);
    expect(() => parseFen('8/8/8/8/8/8/8/8 w - - 0 1 extra')).toThrow(/字段数/);
  });

  it('横线数不为 8 → 报错', () => {
    expect(() => parseFen('8/8/8/8/8/8/8 w - - 0 1')).toThrow(/横线/);
  });

  it('数字 0 / 9 与连续数字 → 报错', () => {
    expect(() => parseFen('0/8/8/8/8/8/8/8 w - - 0 1')).toThrow(/非法棋子字符「0」/);
    expect(() => parseFen('44/8/8/8/8/8/8/8 w - - 0 1')).toThrow(/连续数字/);
  });

  it('走子方非法、易位非法字符、过路兵格非法 → 报错', () => {
    expect(() => parseFen(`${SAMPLE_EMPTY_FEN.replace(' w ', ' x ')}`)).toThrow(/走子方/);
    expect(() => parseFen('8/8/8/8/8/8/8/8 w X - 0 1')).toThrow(/易位权利含非法字符/);
    expect(() => parseFen('8/8/8/8/8/8/8/8 w - e4 0 1')).toThrow(/吃过路兵目标格/);
  });

  it('计数非整数 / 负数 / 超上限 / 回合数 0 → 报错', () => {
    expect(() => parseFen('8/8/8/8/8/8/8/8 w - - x 1')).toThrow(/半回合计数/);
    expect(() => parseFen('8/8/8/8/8/8/8/8 w - - -1 1')).toThrow(/半回合计数/);
    expect(() => parseFen('8/8/8/8/8/8/8/8 w - - 0 0')).toThrow(/回合数.*不能为 0/);
    expect(() => parseFen('8/8/8/8/8/8/8/8 w - - 100001 1')).toThrow(/半回合计数不得超过/);
  });

  it('只给 5 个字段 → 明确报错提示两个计数须同时给出', () => {
    expect(() => parseFen('8/8/8/8/8/8/8/8 w - - 0')).toThrow(/5 个字段/);
  });

  it('首尾与字段间多余空格自动裁剪归一', () => {
    const parsed = parseFen(`  ${INITIAL}  `);
    expect(parsed.normalizedFen).toBe(INITIAL);
    const parsed2 = parseFen(INITIAL.replace(/ /g, '   '));
    expect(parsed2.normalizedFen).toBe(INITIAL);
  });
});

describe('过路兵深度校验', () => {
  it('白方走子配 e3（第 3 横线）→ 走子方不匹配警告；目标格被占 → EP_SQUARE_OCCUPIED', () => {
    // e3 目标格放一个白兵使其非空，且黑兵不在 e5
    // e3（第 3 横线）放白兵使其非空；同时走子方为白却配第 3 横线目标格
    const mismatch = parseFen('4k3/8/8/8/8/4P3/8/4K3 w - e3 0 1');
    const codes = mismatch.warnings.map((w) => w.code);
    expect(codes).toContain('EP_SIDE_MISMATCH');
    expect(codes).toContain('EP_SQUARE_OCCUPIED');
    expect(codes).toContain('EP_NO_PAWN');
  });

  it('合法过路兵局面：黑兵刚走到 d5，白方走子，目标 d6，无 EP 警告', () => {
    // 黑兵 d5：第 5 横线；目标 d6 为空；白王 e1 黑王 e8
    const parsed = parseFen('4k3/8/8/3p4/8/8/8/4K3 w - d6 0 1');
    const epCodes = parsed.warnings.filter((w) => w.code.startsWith('EP_')).map((w) => w.code);
    expect(epCodes).toEqual([]);
  });
});

describe('序列化与渲染', () => {
  it('serializePlacement 与输入布局字段闭环一致', () => {
    const parsed = parseFen(INITIAL);
    expect(serializePlacement(parsed.board)).toBe(INITIAL.split(' ')[0]);
  });

  it('ASCII 棋盘使用 PNBRQK / 点号，白方视角首行为第 8 横线', () => {
    const parsed = parseFen(INITIAL);
    const ascii = renderAsciiBoard(parsed.board, 'w');
    expect(ascii[0]).toBe('8 r n b q k b n r');
    expect(ascii[7]).toBe('1 R N B Q K B N R');
    expect(ascii[8]).toContain('a b c d e f g h');
  });

  it('Unicode 棋盘白方视角首行含黑王 Unicode 字符 ♚', () => {
    const parsed = parseFen(INITIAL);
    const unicode = renderUnicodeBoard(parsed.board, 'w');
    expect(unicode[0]).toContain('♚');
    expect(unicode[7]).toContain('♔');
  });

  it('空棋盘渲染 8 行点号（Unicode 用 ·）', () => {
    const parsed = parseFen(SAMPLE_EMPTY_FEN);
    const unicode = renderUnicodeBoard(parsed.board);
    expect(unicode[0]).toBe('8 · · · · · · · ·');
  });
});

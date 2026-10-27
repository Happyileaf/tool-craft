import { describe, it, expect } from 'vitest';
import {
  ASCII_TABLE,
  lookupByCode,
  lookupByChar,
  lookupAscii,
  filterAscii,
  getCtrlCombos,
  getCommonKeys,
  formatEntryForCopy,
} from './ascii';

describe('ASCII 码表数据完整性', () => {
  it('应恰好包含 0–127 共 128 行且码位连续不重复', () => {
    expect(ASCII_TABLE).toHaveLength(128);
    ASCII_TABLE.forEach((entry, index) => {
      expect(entry.dec).toBe(index);
    });
    expect(new Set(ASCII_TABLE.map((entry) => entry.dec)).size).toBe(128);
  });

  it('抽样固定向量：A=65=0x41、0=48、a=97、LF=10、DEL=127', () => {
    expect(lookupByChar('A')?.dec).toBe(65);
    expect(lookupByChar('A')?.hex).toBe('41');
    expect(lookupByChar('0')?.dec).toBe(48);
    expect(lookupByChar('a')?.dec).toBe(97);
    expect(lookupByCode(10)?.abbr).toBe('LF');
    expect(lookupByCode(127)?.abbr).toBe('DEL');
    expect(lookupByCode(127)?.category).toBe('delete');
  });

  it('进制转换正确：65 的八进制为 101、二进制为 1000001', () => {
    const entry = lookupByCode(65);
    expect(entry?.oct).toBe('101');
    expect(entry?.bin).toBe('1000001');
    expect(entry?.hex).toBe('41');
  });

  it('码位 0 的十六进制 / 八进制 / 二进制均正确补零', () => {
    const nul = lookupByCode(0);
    expect(nul?.hex).toBe('00');
    expect(nul?.oct).toBe('000');
    expect(nul?.bin).toBe('0000000');
    expect(nul?.abbr).toBe('NUL');
  });

  it('分类边界正确：0–31 控制字符、32–126 可打印、127 DEL', () => {
    expect(lookupByCode(31)?.category).toBe('control');
    expect(lookupByCode(32)?.category).toBe('printable');
    expect(lookupByCode(126)?.category).toBe('printable');
    expect(lookupByCode(127)?.category).toBe('delete');
  });

  it('空格（0x20）以 ␠ 展示且缩写为 SP', () => {
    const space = lookupByCode(32);
    expect(space?.char).toBe(' ');
    expect(space?.display).toBe('␠');
    expect(space?.abbr).toBe('SP');
  });

  it('控制字符与 DEL 没有可打印字符本体但有缩写', () => {
    for (const code of [0, 9, 13, 27, 127]) {
      const entry = lookupByCode(code);
      expect(entry?.char).toBe('');
      expect(entry?.abbr.length).toBeGreaterThan(0);
    }
  });

  it('越界码位返回 undefined', () => {
    expect(lookupByCode(-1)).toBeUndefined();
    expect(lookupByCode(128)).toBeUndefined();
    expect(lookupByCode(256)).toBeUndefined();
    expect(lookupByCode(1.5)).toBeUndefined();
  });

  it('每行都有非空中文说明', () => {
    for (const entry of ASCII_TABLE) {
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });
});

describe('lookupByChar 按字符查表', () => {
  it('单个可打印字符命中', () => {
    expect(lookupByChar('Z')?.dec).toBe(90);
    expect(lookupByChar('~')?.dec).toBe(126);
  });

  it('空串或多字符返回 undefined', () => {
    expect(lookupByChar('')).toBeUndefined();
    expect(lookupByChar('AB')).toBeUndefined();
  });
});

describe('lookupAscii 双向检索', () => {
  it('十进制 65 反查 A', () => {
    const result = lookupAscii('65');
    expect(result.kind).toBe('dec');
    expect(result.entry?.char).toBe('A');
  });

  it('0x41 十六进制反查 A', () => {
    const result = lookupAscii('0x41');
    expect(result.kind).toBe('hex');
    expect(result.entry?.dec).toBe(65);
  });

  it('41h 十六进制后缀写法反查 A', () => {
    const result = lookupAscii('41h');
    expect(result.kind).toBe('hex');
    expect(result.entry?.char).toBe('A');
  });

  it('字符 A 正向查码位', () => {
    const result = lookupAscii('A');
    expect(result.kind).toBe('char');
    expect(result.entry?.dec).toBe(65);
  });

  it('十进制 13 反查回车 CR', () => {
    expect(lookupAscii('13').entry?.abbr).toBe('CR');
  });

  it('十进制越界给出错误且无结果', () => {
    const result = lookupAscii('200');
    expect(result.entry).toBeUndefined();
    expect(result.error).toContain('127');
  });

  it('十六进制越界给出错误', () => {
    const result = lookupAscii('0xFF');
    expect(result.entry).toBeUndefined();
    expect(result.error).toContain('US-ASCII');
  });

  it('非 ASCII 字符（中文）给出越界提示', () => {
    const result = lookupAscii('中');
    expect(result.entry).toBeUndefined();
    expect(result.error).toContain('超出');
  });

  it('空输入与无法识别的多字符串给出错误', () => {
    expect(lookupAscii('   ').error).toBeTruthy();
    expect(lookupAscii('abc').error).toBeTruthy();
  });
});

describe('Ctrl 组合键速查', () => {
  it('Ctrl+A…Ctrl+Z 对应码位 1–26', () => {
    const combos = getCtrlCombos();
    expect(combos).toHaveLength(26);
    expect(combos[0]).toEqual({ combo: 'Ctrl+A', code: 1 });
    expect(combos[25]).toEqual({ combo: 'Ctrl+Z', code: 26 });
  });

  it('Ctrl+M 等价于 CR（码位 13）', () => {
    const combo = getCtrlCombos().find((item) => item.combo === 'Ctrl+M');
    expect(combo?.code).toBe(13);
    expect(lookupByCode(combo?.code ?? -1)?.abbr).toBe('CR');
  });

  it('Ctrl+[ 虽不在 A–Z 列表，但码位 27 为 ESC', () => {
    expect(lookupByCode(27)?.abbr).toBe('ESC');
  });

  it('常用键列表含 ESC / Tab / LF / CR / 空格 / DEL', () => {
    const codes = getCommonKeys().map((entry) => entry.abbr);
    expect(codes).toEqual(['ESC', 'HT', 'LF', 'CR', 'SP', 'DEL']);
  });
});

describe('filterAscii 筛选与搜索', () => {
  it('全部分类 + 空关键字返回 128 行', () => {
    expect(filterAscii('all', '')).toHaveLength(128);
  });

  it('按分类筛选：控制字符 32 行（0–31）、可打印 95 行、DEL 1 行', () => {
    expect(filterAscii('control', '')).toHaveLength(32);
    expect(filterAscii('printable', '')).toHaveLength(95);
    expect(filterAscii('delete', '')).toHaveLength(1);
  });

  it('关键字搜索缩写 LF 命中换行', () => {
    const rows = filterAscii('all', 'LF');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.dec).toBe(10);
  });

  it('关键字搜索「换行」命中 LF', () => {
    const rows = filterAscii('all', '换行');
    expect(rows.some((entry) => entry.dec === 10)).toBe(true);
  });

  it('关键字按十进制码位命中', () => {
    const rows = filterAscii('all', '65');
    expect(rows.some((entry) => entry.dec === 65)).toBe(true);
  });

  it('关键字按 0x 十六进制命中且大小写不敏感', () => {
    expect(filterAscii('all', '0x41')[0]?.char).toBe('A');
    expect(filterAscii('all', '0x41')[0]?.char).toBe('A');
  });

  it('关键字「大写字母」命中 A–Z 共 26 行', () => {
    const rows = filterAscii('all', '大写字母');
    expect(rows).toHaveLength(26);
  });

  it('分类与关键字可叠加', () => {
    const rows = filterAscii('control', 'CR');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.dec).toBe(13);
  });
});

describe('formatEntryForCopy 复制文本', () => {
  it('可打印字符包含字符与各进制码位', () => {
    const text = formatEntryForCopy(lookupByCode(65)!);
    expect(text).toBe('A | Dec 65 | Hex 0x41 | Oct 101 | Bin 1000001');
  });

  it('控制字符使用缩写呈现', () => {
    const text = formatEntryForCopy(lookupByCode(10)!);
    expect(text.startsWith('LF |')).toBe(true);
    expect(text).toContain('Dec 10');
  });
});

import { describe, expect, it } from 'vitest';
import {
  codePointToUtf16,
  codePointToUtf8,
  formatCodePoint,
  getCategory,
  getCharacterName,
  getFlag,
  inspectText,
  iterateCodePoints,
  normalizeCompare,
  summarizeEncoding,
} from './unicode-inspect';

describe('iterateCodePoints', () => {
  it('ASCII 逐码点拆分', () => {
    expect(iterateCodePoints('abc')).toEqual([0x61, 0x62, 0x63]);
  });

  it('emoji 代理对按一个码点处理', () => {
    expect(iterateCodePoints('😀a')).toEqual([0x1f600, 0x61]);
  });

  it('空字符串返回空数组', () => {
    expect(iterateCodePoints('')).toEqual([]);
  });
});

describe('codePointToUtf8 手写 UTF-8 编码', () => {
  it('1 字节 ASCII', () => {
    expect(codePointToUtf8(0x41)).toEqual([0x41]);
  });

  it('2 字节拉丁扩展 é', () => {
    expect(codePointToUtf8(0x00e9)).toEqual([0xc3, 0xa9]);
  });

  it('3 字节汉字 中', () => {
    expect(codePointToUtf8(0x4e2d)).toEqual([0xe4, 0xb8, 0xad]);
  });

  it('4 字节增补平面 😀', () => {
    expect(codePointToUtf8(0x1f600)).toEqual([0xf0, 0x9f, 0x98, 0x80]);
  });
});

describe('codePointToUtf16', () => {
  it('BMP 码点为单个码元', () => {
    expect(codePointToUtf16(0x41)).toEqual([0x0041]);
  });

  it('增补平面码点为高代理 + 低代理', () => {
    expect(codePointToUtf16(0x1f600)).toEqual([0xd83d, 0xde00]);
  });
});

describe('getCategory', () => {
  it('大类推断 L/N/P/S/Z', () => {
    expect(getCategory('A'.codePointAt(0)!)).toBe('L');
    expect(getCategory('1'.codePointAt(0)!)).toBe('N');
    expect(getCategory('.'.codePointAt(0)!)).toBe('P');
    expect(getCategory('$'.codePointAt(0)!)).toBe('S');
    expect(getCategory(' '.codePointAt(0)!)).toBe('Z');
  });

  it('控制符与格式符细分为 Cc / Cf', () => {
    expect(getCategory(0x09)).toBe('Cc');
    expect(getCategory(0x7f)).toBe('Cc');
    expect(getCategory(0x9f)).toBe('Cc');
    expect(getCategory(0x200b)).toBe('Cf');
  });

  it('代理码点判定为 Cs', () => {
    expect(getCategory(0xd800)).toBe('Cs');
  });

  it('私用区判定为 Co', () => {
    expect(getCategory(0xe000)).toBe('Co');
  });
});

describe('getFlag 不可见 / 特殊字符检测', () => {
  it.each([0x200b, 0x202e, 0xfeff, 0x00a0, 0x0000])('%X 被标记且带原因', (cp) => {
    const result = getFlag(cp);
    expect(result.flagged).toBe(true);
    expect(typeof result.reason).toBe('string');
    expect(result.reason!.length).toBeGreaterThan(0);
  });

  it('普通字母不标记', () => {
    expect(getFlag('a'.codePointAt(0)!)).toEqual({ flagged: false });
  });

  it('Cc / Cf 即使不在内置表中也默认标记', () => {
    // U+0006 ACK 与 U+2070 上标数字（非隐形）不测试，这里取未入表的 C0 控制符
    expect(getFlag(0x06).flagged).toBe(true);
    // U+206F 未列入内置码点表，但属于 Cf
    expect(getFlag(0x206f).flagged).toBe(true);
  });

  it('全角空格 U+3000 作为非 ASCII 空白提示', () => {
    const result = getFlag(0x3000);
    expect(result.flagged).toBe(true);
    expect(result.reason).toContain('非 ASCII 空格');
  });
});

describe('inspectText 逐字符检视', () => {
  it('零宽空格行被标记且码点为 U+200B', () => {
    const records = inspectText('a\u200bb');
    expect(records).toHaveLength(3);
    expect(records[1]!.flagged).toBe(true);
    expect(records[1]!.hex).toBe('U+200B');
    expect(records[1]!.category).toBe('Cf');
    expect(records[1]!.utf8).toEqual([0xe2, 0x80, 0x8b]);
  });

  it('emoji 的 UTF-8 / UTF-16 编码正确', () => {
    const record = inspectText('😀')[0]!;
    expect(record.hex).toBe('U+1F600');
    expect(record.utf8Hex).toBe('F0 9F 98 80');
    expect(record.utf16Hex).toBe('D83D DE00');
    expect(record.flagged).toBe(false);
  });

  it('所有十六进制均为大写、码点以 U+ 开头', () => {
    for (const record of inspectText('a中😀 ')) {
      expect(record.hex).toMatch(/^U\+[0-9A-F]{4,6}$/);
      expect(record.utf8Hex).toMatch(/^[0-9A-F ]+$/);
      expect(record.utf16Hex).toMatch(/^[0-9A-F ]+$/);
    }
  });

  it('字符名获取不抛错且为字符串或降级类别描述', () => {
    const records = inspectText('A\u200b');
    for (const record of records) {
      expect(typeof record.name).toBe('string');
      expect(record.name.length).toBeGreaterThan(0);
    }
  });
});

describe('getCharacterName 环境兼容', () => {
  it('不抛错，返回字符串或 undefined', () => {
    expect(() => {
      [0x41, 0x200b, 0x1f600].forEach((cp) => getCharacterName(cp));
    }).not.toThrow();
    const name = getCharacterName(0x41);
    expect(name === undefined || typeof name === 'string').toBe(true);
  });
});

describe('normalizeCompare 归一化对比', () => {
  it('NFD 形式的 é 经 NFC 后只有 1 个码点，differs 含 NFC', () => {
    const result = normalizeCompare('e\u0301');
    expect(iterateCodePoints(result.nfc)).toHaveLength(1);
    expect(result.nfc).toBe('é');
    expect(result.differs).toContain('NFC');
  });

  it('NFKC 把全角 Ａ 折叠为 A', () => {
    const result = normalizeCompare('Ａ');
    expect(result.nfkc).toBe('A');
    expect(result.differs).toContain('NFKC');
  });

  it('纯 ASCII 文本与四种归一化完全一致', () => {
    const result = normalizeCompare('hello');
    expect(result.differs).toEqual([]);
  });
});

describe('formatCodePoint', () => {
  it('补零至 4 位且大写', () => {
    expect(formatCodePoint(0x41)).toBe('U+0041');
    expect(formatCodePoint(0x1f600)).toBe('U+1F600');
  });
});

describe('summarizeEncoding', () => {
  it('手写 UTF-8 字节累加与码点数', () => {
    expect(summarizeEncoding('😀a')).toEqual({ codePointCount: 2, utf8Bytes: 5 });
  });
});

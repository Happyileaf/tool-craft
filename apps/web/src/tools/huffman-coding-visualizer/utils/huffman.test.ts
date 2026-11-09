import { describe, it, expect } from 'vitest';
import {
  analyzeTable,
  analyzeText,
  bitsToHex,
  buildHuffman,
  countFrequencies,
  decodeBits,
  displaySymbol,
  encodeText,
  parseFrequencyTable,
} from './huffman';

describe('countFrequencies', () => {
  it('按首次出现顺序统计字符频次并正确切分代理对', () => {
    const entries = countFrequencies('AABAC');
    expect(entries).toEqual([
      { symbol: 'A', weight: 3 },
      { symbol: 'B', weight: 1 },
      { symbol: 'C', weight: 1 },
    ]);
    const emoji = countFrequencies('😀😀a');
    expect(emoji).toEqual([
      { symbol: '😀', weight: 2 },
      { symbol: 'a', weight: 1 },
    ]);
  });

  it('空文本返回空频次表', () => {
    expect(countFrequencies('')).toEqual([]);
  });
});

describe('analyzeText 经典向量 AAAAABBBCCD', () => {
  const result = analyzeText('AAAAABBBCCD');

  it('频次统计正确（A=5 B=3 C=2 D=1）', () => {
    expect(result.error).toBeNull();
    expect(result.frequencies).toEqual([
      { symbol: 'A', weight: 5 },
      { symbol: 'B', weight: 3 },
      { symbol: 'C', weight: 2 },
      { symbol: 'D', weight: 1 },
    ]);
  });

  it('共 3 轮合并且步骤描述可读', () => {
    expect(result.steps).toHaveLength(3);
    expect(result.steps[0]?.description).toMatch(/第1轮：合并 D\(1\) 与 C\(2\) → N1\(3\)/);
    expect(result.steps[2]?.resultWeight).toBe(11);
  });

  it('码长分布为 1/2/3/3 且 WPL=20', () => {
    const bySymbol = new Map(result.codes.map((entry) => [entry.symbol, entry]));
    expect(bySymbol.get('A')?.codeLength).toBe(1);
    expect(bySymbol.get('B')?.codeLength).toBe(2);
    expect(bySymbol.get('C')?.codeLength).toBe(3);
    expect(bySymbol.get('D')?.codeLength).toBe(3);
    expect(result.wpl).toBe(20);
    expect(result.averageCodeLength).toBeCloseTo(20 / 11, 10);
  });

  it('码字满足前缀码性质（互不互为前缀）', () => {
    const codes = result.codes.map((entry) => entry.code).sort();
    for (let i = 0; i < codes.length; i += 1) {
      for (let j = i + 1; j < codes.length; j += 1) {
        expect(codes[j]?.startsWith(codes[i] ?? '')).toBe(false);
      }
    }
  });

  it('仅由 0/1 构成且总比特数等于 WPL', () => {
    expect(result.encodedBits).toMatch(/^[01]+$/);
    expect(result.totalBits).toBe(result.wpl);
    expect(result.encodedBits).toHaveLength(20);
  });

  it('字节对齐十六进制与填充位数正确', () => {
    expect(result.hex?.paddingBits).toBe(4);
    expect(result.hex?.paddedBits).toHaveLength(24);
    expect(result.hex?.hex).toBe(
      result.hex?.paddedBits
        .match(/.{8}/g)
        ?.map((byte) => Number.parseInt(byte, 2).toString(16).padStart(2, '0').toUpperCase())
        .join(' '),
    );
  });

  it('等长编码对比：⌈log2(4)⌉=2 位，节省比例为 (22-20)/22', () => {
    expect(result.fixedCodeLength).toBe(2);
    expect(result.fixedTotalBits).toBe(22);
    expect(result.savingRatio).toBeCloseTo(2 / 22, 10);
  });

  it('编码后按树解码可完整还原原文', () => {
    const decoded = decodeBits(result.encodedBits, result.root);
    expect(decoded.error).toBeNull();
    expect(decoded.text).toBe('AAAAABBBCCD');
  });

  it('树形文本包含全部叶子与根权重', () => {
    expect(result.treeText).toContain('N3(11)');
    expect(result.treeLines.filter((line) => line.leaf)).toHaveLength(4);
    expect(result.treeText).toMatch(/[├└]─[01]/);
  });
});

describe('边界情况', () => {
  it('单字符输入：码字约定为 "0"，WPL 等于文本长度', () => {
    const result = analyzeText('AAAAA');
    expect(result.error).toBeNull();
    expect(result.codes).toHaveLength(1);
    expect(result.codes[0]?.code).toBe('0');
    expect(result.codes[0]?.codeLength).toBe(1);
    expect(result.encodedBits).toBe('00000');
    expect(result.wpl).toBe(5);
    expect(result.fixedCodeLength).toBe(1);
    expect(result.savingRatio).toBe(0);
    const decoded = decodeBits(result.encodedBits, result.root);
    expect(decoded.text).toBe('AAAAA');
  });

  it('单字符单频次：无需合并，步骤为空树只有一个叶子', () => {
    const result = buildHuffman([{ symbol: 'X', weight: 7 }]);
    expect(result.steps).toEqual([]);
    expect(result.root?.symbol).toBe('X');
    expect(result.codes[0]?.code).toBe('0');
  });

  it('空文本返回中文错误且不抛异常', () => {
    const result = analyzeText('');
    expect(result.error).toMatch(/输入文本为空/);
    expect(result.root).toBeNull();
    expect(result.codes).toEqual([]);
  });

  it('空白字符有可读标签', () => {
    expect(displaySymbol(' ')).toBe('空格');
    expect(displaySymbol('\n')).toBe('换行');
    expect(displaySymbol('A')).toBe('A');
  });
});

describe('parseFrequencyTable', () => {
  it('合法频次表按行解析并保留插入顺序', () => {
    const parsed = parseFrequencyTable('A,5\nB, 3 \n\nC,2');
    expect(parsed.error).toBeNull();
    expect(parsed.entries).toEqual([
      { symbol: 'A', weight: 5 },
      { symbol: 'B', weight: 3 },
      { symbol: 'C', weight: 2 },
    ]);
  });

  it('缺少逗号给出带行号的中文错误', () => {
    const parsed = parseFrequencyTable('A,1\nBADLINE');
    expect(parsed.errorLine).toBe(2);
    expect(parsed.error).toMatch(/第 2 行：缺少逗号/);
  });

  it('负频次、非数字、零频次、空符号均被拦截', () => {
    expect(parseFrequencyTable('A,-3').error).toMatch(/不能为负数/);
    expect(parseFrequencyTable('A,1.5').error).toMatch(/不是合法正整数/);
    expect(parseFrequencyTable('A,abc').error).toMatch(/不是合法正整数/);
    expect(parseFrequencyTable('A,0').error).toMatch(/频次必须大于 0/);
    expect(parseFrequencyTable(' ,3').error).toMatch(/符号不能为空/);
  });

  it('重复符号报错且定位到后出现的行', () => {
    const parsed = parseFrequencyTable('A,1\nB,2\nA,3');
    expect(parsed.errorLine).toBe(3);
    expect(parsed.error).toMatch(/符号「A」重复定义/);
  });

  it('整表为空（仅空白行）报错', () => {
    expect(parseFrequencyTable('\n  \n').error).toMatch(/频次表为空/);
  });
});

describe('analyzeTable 与编解码', () => {
  it('手动频次表建树结果与等价文本一致', () => {
    const tableResult = analyzeTable('A,5\nB,3\nC,2\nD,1');
    const textResult = analyzeText('AAAAABBBCCD');
    expect(tableResult.error).toBeNull();
    expect(tableResult.wpl).toBe(textResult.wpl);
    expect(tableResult.totalBits).toBe(textResult.totalBits);
    expect(tableResult.steps.map((step) => step.description)).toEqual(
      textResult.steps.map((step) => step.description),
    );
    // 频次表模式按频次展开的比特串与文本编码一致
    expect(tableResult.encodedBits).toBe(textResult.encodedBits);
  });

  it('解析失败时返回错误对象而非抛出', () => {
    const result = analyzeTable('A,-1');
    expect(result.error).toMatch(/不能为负数/);
    expect(result.codes).toEqual([]);
  });

  it('encodeText 对码表外字符返回中文错误', () => {
    const result = buildHuffman([
      { symbol: 'A', weight: 2 },
      { symbol: 'B', weight: 1 },
    ]);
    const ok = encodeText('ABA', result.codeMap);
    expect(ok.error).toBeNull();
    expect(ok.bits).toMatch(/^[01]+$/);
    const bad = encodeText('AX', result.codeMap);
    expect(bad.error).toMatch(/不在码表中/);
  });

  it('末尾残留无法构成完整码字时给出说明并返回已解码部分', () => {
    const result = analyzeText('AAAAABBBCCD');
    // 实际码表 A=0 B=10 C=111 D=110；追加 '11' 停在内部节点（任一码字的前缀），构成残尾
    const decoded = decodeBits(`${result.encodedBits}11`, result.root);
    expect(decoded.text).toBe('AAAAABBBCCD');
    expect(decoded.error).toMatch(/多余比特/);
  });

  it('字节对齐填充解码不抛错，原文部分完整还原', () => {
    const result = analyzeText('AAAAABBBCCD');
    const decoded = decodeBits(result.hex?.paddedBits ?? '', result.root);
    expect(decoded.text.startsWith('AAAAABBBCCD')).toBe(true);
  });
});

describe('bitsToHex', () => {
  it('8 位整倍数无填充，输出大写两位十六进制', () => {
    const hex = bitsToHex('0100000110111010');
    expect(hex.paddingBits).toBe(0);
    expect(hex.hex).toBe('41 BA');
    expect(hex.paddedBits).toBe('0100000110111010');
  });

  it('不足 8 位时末尾补 0 并注明填充位数', () => {
    const hex = bitsToHex('111');
    expect(hex.paddingBits).toBe(5);
    expect(hex.paddedBits).toBe('11100000');
    expect(hex.hex).toBe('E0');
  });

  it('空比特串返回空十六进制与零填充', () => {
    const hex = bitsToHex('');
    expect(hex.hex).toBe('');
    expect(hex.paddingBits).toBe(0);
  });
});

describe('tie-break 确定性', () => {
  it('等权节点按插入序稳定合并，重复构建结果一致', () => {
    const entries = [
      { symbol: 'C', weight: 1 },
      { symbol: 'D', weight: 1 },
      { symbol: 'B', weight: 1 },
      { symbol: 'A', weight: 1 },
    ];
    const first = buildHuffman(entries);
    const second = buildHuffman(entries);
    expect(first.steps.map((step) => step.description)).toEqual(second.steps.map((step) => step.description));
    // 第一轮取插入序最小的两个：C 与 D
    expect(first.steps[0]?.leftLabel).toBe('C');
    expect(first.steps[0]?.rightLabel).toBe('D');
    // 四等权时所有码长均为 2，WPL = 4 × 2 = 8
    expect(first.wpl).toBe(8);
  });
});

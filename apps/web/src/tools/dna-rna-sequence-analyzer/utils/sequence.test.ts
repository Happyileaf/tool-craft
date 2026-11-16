import { describe, it, expect } from 'vitest';
import {
  analyzeSequence,
  cleanSequence,
  complementSequence,
  computeStats,
  reverseComplementSequence,
  transcribe,
  translateSixFrames,
} from './sequence';

describe('验收向量：ATGCGTACGTAG 基础分析', () => {
  const result = analyzeSequence('ATGCGTACGTAG');

  it('识别为 DNA，长度 12，碱基计数正确', () => {
    expect(result.error).toBeNull();
    expect(result.type).toBe('DNA');
    expect(result.stats.length).toBe(12);
    expect(result.stats.counts.A).toBe(3);
    expect(result.stats.counts.C).toBe(2);
    expect(result.stats.counts.G).toBe(4);
    expect(result.stats.counts.T).toBe(3);
  });

  it('GC 含量 50.00%', () => {
    expect(result.stats.gcContent).toBeCloseTo(0.5, 10);
  });

  it('反向互补链为 CTACGTACGCAT，mRNA 为 AUGCGUACGUAG', () => {
    expect(result.reverseComplement).toBe('CTACGTACGCAT');
    expect(result.mrna).toBe('AUGCGUACGUAG');
  });

  it('六框翻译：+1=MRT*、+2=CVR、+3=AYV、-1=LRTH', () => {
    const byFrame = Object.fromEntries(result.frames.map((f) => [f.frame, f]));
    expect(byFrame['+1']!.peptides).toBe('MRT*');
    expect(byFrame['+2']!.peptides).toBe('CVR');
    expect(byFrame['+3']!.peptides).toBe('AYV');
    expect(byFrame['-1']!.peptides).toBe('LRTH');
  });

  it('+1 读框终止密码子位置被记录', () => {
    const plusOne = result.frames.find((f) => f.frame === '+1');
    expect(plusOne?.stopPositions).toEqual([3]);
  });
});

describe('验收向量：RNA AUGGCU', () => {
  const result = analyzeSequence('AUGGCU');

  it('识别为 RNA，反向互补为 AGCCAU，+1 读框为 MA', () => {
    expect(result.type).toBe('RNA');
    expect(result.reverseComplement).toBe('AGCCAU');
    expect(result.frames.find((f) => f.frame === '+1')?.peptides).toBe('MA');
  });

  it('RNA 的反向互补不产生 T', () => {
    expect(result.reverseComplement).not.toContain('T');
  });
});

describe('验收向量：FASTA 头与空白清洗', () => {
  const raw = '>seq1\nATG CGT\nACG TAG';
  const result = analyzeSequence(raw);

  it('清洗后长度 12 且结果与连续序列一致', () => {
    expect(result.clean.sequence).toBe('ATGCGTACGTAG');
    expect(result.clean.fastaHeaders).toBe(1);
    expect(result.stats.length).toBe(12);
    expect(result.frames.find((f) => f.frame === '+1')?.peptides).toBe('MRT*');
  });

  it('数字行号被移除', () => {
    const clean = cleanSequence('1 ATG\n2 CGT');
    expect(clean.sequence).toBe('ATGCGT');
  });

  it('比对空位 - 被移除并计数', () => {
    const clean = cleanSequence('AT-G--CGT');
    expect(clean.sequence).toBe('ATGCGT');
    expect(clean.removedGaps).toBe(3);
  });
});

describe('验收向量：边界序列', () => {
  it('GGG：GC 含量 100%，+1 读框为 G', () => {
    const result = analyzeSequence('GGG');
    expect(result.stats.gcContent).toBeCloseTo(1, 10);
    expect(result.frames.find((f) => f.frame === '+1')?.peptides).toBe('G');
  });

  it('TAA：+1 读框为 *（终止密码子）', () => {
    const result = analyzeSequence('TAA');
    expect(result.frames.find((f) => f.frame === '+1')?.peptides).toBe('*');
  });

  it('ATN：+1 读框为 X（含模糊碱基）', () => {
    const result = analyzeSequence('ATN');
    expect(result.frames.find((f) => f.frame === '+1')?.peptides).toBe('X');
  });

  it('末尾不足 3 个碱基不翻译并提示剩余长度', () => {
    const result = analyzeSequence('GGGG');
    const plusOne = result.frames.find((f) => f.frame === '+1');
    expect(plusOne?.peptides).toBe('G');
    expect(plusOne?.trailingBases).toBe(1);
  });
});

describe('验收向量：非法输入', () => {
  it('空序列报错', () => {
    expect(analyzeSequence('').error).toMatch(/为空/);
    expect(analyzeSequence('>header only\n  \n').error).toMatch(/为空/);
  });

  it('非法字符 X 报错并给出 1-based 位置', () => {
    const result = analyzeSequence('ATGX');
    expect(result.error).toMatch(/第 4 位/);
    expect(result.errorPosition).toBe(4);
  });

  it('同时含 T 与 U 报错', () => {
    expect(analyzeSequence('ATUG').error).toMatch(/T 与 U/);
  });

  it('超过 100000 nt 被拒绝', () => {
    const longSequence = 'A'.repeat(100_001);
    expect(analyzeSequence(longSequence).error).toMatch(/上限/);
  });
});

describe('工具函数与 IUPAC', () => {
  it('互补与反向互补（DNA）', () => {
    expect(complementSequence('ATCG', 'DNA')).toBe('TAGC');
    expect(reverseComplementSequence('ATCG', 'RNA')).toBe('CGAU');
  });

  it('IUPAC 模糊碱基互补：R↔Y、N↔N、S↔S', () => {
    expect(complementSequence('RYNS', 'DNA')).toBe('YRNS');
  });

  it('转录：DNA 的 T→U，RNA 原样', () => {
    expect(transcribe('ATGC', 'DNA')).toBe('AUGC');
    expect(transcribe('AUGC', 'RNA')).toBe('AUGC');
  });

  it('纯模糊碱基 NNN 按 DNA 处理且 GC 为 0、类型为推断', () => {
    const result = analyzeSequence('NNN');
    expect(result.type).toBe('DNA');
    expect(result.typeInferred).toBe(true);
    expect(result.stats.gcContent).toBe(0);
    expect(result.stats.ambiguousCount).toBe(3);
  });

  it('小写输入等同大写', () => {
    const result = analyzeSequence('atgc');
    expect(result.clean.sequence).toBe('ATGC');
  });

  it('computeStats 统计模糊碱基数量', () => {
    const stats = computeStats('ACGTNRYSW');
    expect(stats.ambiguousCount).toBe(5);
    expect(stats.length).toBe(9);
  });

  it('六框输出始终为 6 个读框', () => {
    expect(translateSixFrames('ATGCGTACGTAG', 'DNA')).toHaveLength(6);
  });
});

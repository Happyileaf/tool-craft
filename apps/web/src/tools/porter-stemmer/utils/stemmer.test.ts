import { describe, expect, it } from 'vitest';
import {
  groupsToCsv,
  stemText,
  stemWord,
  tokenizeEnglish,
} from './stemmer';

/**
 * 标准向量按 Porter (1980) 论文规则逐步推导，
 * 覆盖 1a/1b/1c、步骤 2/3/4 与步骤 5a/5b 的全部关键分支。
 */
const PORTER_VECTORS: ReadonlyArray<readonly [string, string]> = [
  // 步骤 1a
  ['caresses', 'caress'],
  ['ponies', 'poni'],
  ['ties', 'ti'],
  ['caress', 'caress'],
  ['cats', 'cat'],
  // 步骤 1b
  ['feed', 'feed'],
  ['agreed', 'agre'],
  ['plastered', 'plaster'],
  ['motoring', 'motor'],
  ['sing', 'sing'],
  ['conflated', 'conflat'],
  ['troubled', 'troubl'],
  ['sized', 'size'],
  ['hopping', 'hop'],
  ['tanned', 'tan'],
  ['falling', 'fall'],
  ['hissing', 'hiss'],
  ['fizzed', 'fizz'],
  ['fizzing', 'fizz'],
  // 步骤 1c
  ['happy', 'happi'],
  // 步骤 2
  ['relational', 'relat'],
  ['conditional', 'condit'],
  ['rational', 'ration'],
  ['valenci', 'valenc'],
  ['hesitanci', 'hesit'],
  ['digitizer', 'digit'],
  ['radicalli', 'radic'],
  ['differentli', 'differ'],
  ['vileli', 'vile'],
  ['analogousli', 'analog'],
  ['vietnamization', 'vietnam'],
  ['predication', 'predic'],
  ['operator', 'oper'],
  ['feudalism', 'feudal'],
  ['decisiveness', 'decis'],
  ['hopefulness', 'hope'],
  ['callousness', 'callous'],
  ['formaliti', 'formal'],
  // 步骤 3
  ['triplicate', 'triplic'],
  ['formative', 'form'],
  ['formalize', 'formal'],
  ['hopeful', 'hope'],
  ['goodness', 'good'],
  // 步骤 4
  ['revival', 'reviv'],
  ['allowance', 'allow'],
  ['inference', 'infer'],
  ['airliner', 'airlin'],
  ['gyroscopic', 'gyroscop'],
  ['adjustable', 'adjust'],
  ['defensible', 'defens'],
  ['irritant', 'irrit'],
  ['replacement', 'replac'],
  ['adjustment', 'adjust'],
  ['dependent', 'depend'],
  ['adoption', 'adopt'],
  ['homologou', 'homolog'],
  ['communism', 'commun'],
  ['activate', 'activ'],
  ['angulariti', 'angular'],
  ['homologous', 'homolog'],
  ['effective', 'effect'],
  ['bowdlerize', 'bowdler'],
  // 步骤 5a / 5b
  ['probate', 'probat'],
  ['rate', 'rate'],
  ['cease', 'ceas'],
  ['controll', 'control'],
  ['roll', 'roll'],
];

describe('stemWord - Porter 1980 标准向量', () => {
  for (const [input, expected] of PORTER_VECTORS) {
    it(`将 "${input}" 提取为 "${expected}"`, () => {
      expect(stemWord(input)).toBe(expected);
    });
  }

  it('大写输入与小写输入结果一致', () => {
    expect(stemWord('HAPPY')).toBe('happi');
    expect(stemWord('Relational')).toBe(stemWord('relational'));
  });

  it('长度不超过 2 的词直接返回小写形式', () => {
    expect(stemWord('a')).toBe('a');
    expect(stemWord('I')).toBe('i');
    expect(stemWord('AM')).toBe('am');
  });

  it('y 仅在词干含元音时才转 i：cry 保持不变、enjoy 转 enjoi', () => {
    expect(stemWord('cry')).toBe('cry');
    expect(stemWord('enjoy')).toBe('enjoi');
  });

  it('同一词族的屈折形式归并到相同词干', () => {
    const family = ['run', 'runs', 'running', 'ran'];
    const stems = new Set(family.map((word) => stemWord(word)));
    expect(stems.has('run')).toBe(true);
    // run/runs/running 必须归并为同一词干
    expect(stemWord('runs')).toBe(stemWord('running'));
  });
});

describe('tokenizeEnglish', () => {
  it('按字母与撇号切词，忽略数字、标点与空白', () => {
    expect(tokenizeEnglish("Don't worry, be happy!")).toEqual([
      "Don't",
      'worry',
      'be',
      'happy',
    ]);
  });

  it('数字作为分隔符拆分两侧字母序列', () => {
    expect(tokenizeEnglish('abc123def')).toEqual(['abc', 'def']);
  });

  it('空文本返回空数组', () => {
    expect(tokenizeEnglish('123 456 !!!')).toEqual([]);
  });
});

describe('stemText', () => {
  it('按词干归并词形并统计出现次数', () => {
    const result = stemText('The running runner runs quickly. Running fast!');
    const runGroup = result.groups.find((group) => group.stem === 'run');
    expect(runGroup).toBeDefined();
    expect(runGroup?.count).toBe(3);
    expect(runGroup?.forms).toContain('running');
    expect(runGroup?.forms).toContain('runs');
  });

  it('返回总词次与不同词干数', () => {
    const result = stemText('cats dogs cat dog');
    expect(result.totalTokens).toBe(4);
    expect(result.uniqueStems).toBe(2);
  });

  it('分组按次数降序、同次按词干字母序排列', () => {
    const result = stemText('aaa aaa bbb');
    expect(result.groups[0]?.count).toBe(2);
    const sorted = stemText('bbb aaa ccc');
    const stems = sorted.groups.map((group) => group.stem);
    expect(stems).toEqual([...stems].sort((a, b) => a.localeCompare(b)));
  });

  it('同一原始词形只记录一次', () => {
    const result = stemText('test test test');
    const group = result.groups[0];
    expect(group?.forms).toEqual(['test']);
    expect(group?.count).toBe(3);
  });

  it('空文本输出空分组与零统计', () => {
    const result = stemText('');
    expect(result.totalTokens).toBe(0);
    expect(result.uniqueStems).toBe(0);
    expect(result.groups).toEqual([]);
  });
});

describe('groupsToCsv', () => {
  it('输出带表头的 CSV，词形以分号连接并转义双引号', () => {
    const result = stemText('runs running');
    const csv = groupsToCsv(result.groups);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('stem,count,forms');
    const runLine = lines.find((line) => line.startsWith('run,'));
    expect(runLine).toBeDefined();
    // 词形按首次出现顺序记录：runs 先于 running
    expect(runLine).toContain('"runs;running"');
  });

  it('空分组仅输出表头', () => {
    expect(groupsToCsv([])).toBe('stem,count,forms');
  });
});

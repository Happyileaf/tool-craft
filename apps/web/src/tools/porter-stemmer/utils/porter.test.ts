import { describe, expect, it } from 'vitest';
import { groupByStem, stemText, stemWord, tokenize } from './porter';

/** Porter 官方经典测试向量（Porter, 1980 附录词汇表） */
const STEM_VECTORS: Array<[string, string]> = [
  // Step 1a
  ['caresses', 'caress'],
  ['ponies', 'poni'],
  ['ties', 'ti'],
  ['caress', 'caress'],
  ['cats', 'cat'],
  // Step 1b
  ['feed', 'feed'],
  // 官方输出为 agre（Step 5a 删除末尾 E），不是真实单词 agree
  ['agreed', 'agre'],
  ['plastered', 'plaster'],
  ['bled', 'bled'],
  ['motoring', 'motor'],
  ['sing', 'sing'],
  ['conflated', 'conflat'],
  ['troubled', 'troubl'],
  ['sized', 'size'],
  ['hopping', 'hop'],
  ['tanned', 'tan'],
  ['falling', 'fall'],
  ['hissing', 'hiss'],
  // Step 1c / Step 2
  ['relational', 'relat'],
  ['conditional', 'condit'],
  ['rational', 'ration'],
  ['valenci', 'valenc'],
  ['hesitanci', 'hesit'],
  ['digitizer', 'digit'],
  ['conformabli', 'conform'],
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
  ['sensitiviti', 'sensit'],
  ['sensibiliti', 'sensibl'],
  // biliti 不命中任何 Step 2 规则（biliti 规则要求 m>0 且词干为 bi，m=0），原样保留
  ['biliti', 'biliti'],
  // Step 3
  ['triplicate', 'triplic'],
  ['formative', 'form'],
  // 官方输出统一为 electr（iciti/ical → ic，Step 4 再删 ic）
  ['electriciti', 'electr'],
  ['electrical', 'electr'],
  ['hopeful', 'hope'],
  ['goodness', 'good'],
  // Step 4
  ['revival', 'reviv'],
  ['allowance', 'allow'],
  ['inference', 'infer'],
  ['airliner', 'airlin'],
  ['gyroscope', 'gyroscop'],
  ['adjustable', 'adjust'],
  ['defensible', 'defens'],
  ['irritant', 'irrit'],
  ['replacement', 'replac'],
  ['adjustment', 'adjust'],
  ['dependent', 'depend'],
  ['adoption', 'adopt'],
  ['communism', 'commun'],
  ['activate', 'activ'],
  ['angulariti', 'angular'],
  ['homologous', 'homolog'],
  ['effective', 'effect'],
  ['bowdlerize', 'bowdler'],
  // Step 5a / 5b
  ['probate', 'probat'],
  ['rate', 'rate'],
  ['cease', 'ceas'],
  ['controll', 'control'],
  ['roll', 'roll'],
];

describe('stemWord - Porter 官方经典向量', () => {
  it.each(STEM_VECTORS)('stemWord(%s) -> %s', (input, expected) => {
    expect(stemWord(input)).toBe(expected);
  });

  it('内部完成小写归一与非字母剥离', () => {
    expect(stemWord('CARESSES')).toBe('caress');
    expect(stemWord('Run!')).toBe('run');
    expect(stemWord('  ')).toBe('');
    expect(stemWord('123')).toBe('');
    expect(stemWord('')).toBe('');
  });

  it('长度不超过 2 的词原样返回', () => {
    expect(stemWord('ed')).toBe('ed');
    expect(stemWord('I')).toBe('i');
  });
});

describe('tokenize', () => {
  it('按非字母边界切词并保留大小写原貌', () => {
    expect(tokenize('The dogs are running.')).toEqual(['The', 'dogs', 'are', 'running']);
    expect(tokenize('123 !!!')).toEqual([]);
    expect(tokenize('')).toEqual([]);
  });
});

describe('stemText', () => {
  it('对整段文本逐词提取并给出序号', () => {
    const entries = stemText('The dogs are running and jumping while the dog runs.');
    expect(entries).toHaveLength(10);
    expect(entries[0]).toEqual({ original: 'The', stem: 'the', index: 0 });
    const dogStems = entries.filter((entry) => entry.stem === 'dog');
    expect(dogStems).toHaveLength(2);
    const theStems = entries.filter((entry) => entry.stem === 'the');
    expect(theStems).toHaveLength(2);
  });

  it('空文本与纯数字标点文本返回空数组且不抛错', () => {
    expect(stemText('')).toEqual([]);
    expect(stemText('123 456 ... !!!')).toEqual([]);
  });
});

describe('groupByStem', () => {
  it('按词干归并 running / runs 并正确计数', () => {
    const entries = stemText('The dogs are running and jumping while the dog runs.');
    const groups = groupByStem(entries);

    const runGroup = groups.find((group) => group.stem === 'run');
    expect(runGroup).toBeDefined();
    expect(runGroup?.forms).toEqual(['running', 'runs']);
    expect(runGroup?.count).toBe(2);

    const theGroup = groups.find((group) => group.stem === 'the');
    expect(theGroup?.count).toBe(2);
    const dogGroup = groups.find((group) => group.stem === 'dog');
    expect(dogGroup?.count).toBe(2);
  });

  it('按 count 降序、同数按首次出现顺序排列', () => {
    const entries = stemText('a b b c c a a');
    const groups = groupByStem(entries);
    expect(groups[0]?.stem).toBe('a');
    expect(groups[0]?.count).toBe(3);
    const tied = groups.filter((group) => group.count === 2).map((group) => group.stem);
    expect(tied).toEqual(['b', 'c']);
  });

  it('forms 去重但保留首次出现顺序，count 包含重复 token', () => {
    const entries = stemText('Running running runs RUNNING');
    const groups = groupByStem(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.forms).toEqual(['Running', 'runs']);
    expect(groups[0]?.count).toBe(4);
  });

  it('caseSensitive=false 时 Dog 与 dog 同组，true 时不同组', () => {
    const entries = stemText('Dog dog dogs');

    const insensitive = groupByStem(entries, { caseSensitive: false });
    expect(insensitive).toHaveLength(1);
    expect(insensitive[0]?.stem).toBe('dog');
    expect(insensitive[0]?.forms).toEqual(['Dog', 'dogs']);

    const sensitive = groupByStem(entries, { caseSensitive: true });
    const keys = sensitive.map((group) => group.forms.join(''));
    expect(keys).toContain('Dog');
    expect(keys).toContain('dog');
    expect(sensitive.length).toBeGreaterThan(1);
  });

  it('空输入返回空数组', () => {
    expect(groupByStem([])).toEqual([]);
  });
});

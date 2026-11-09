import { describe, it, expect } from 'vitest';
import { stemWord, stemText, tokenize } from './porter';

describe('stemWord Porter 1980 fixed vectors', () => {
  const vectors: Array<[string, string]> = [
    ['caresses', 'caress'],
    ['ponies', 'poni'],
    ['ties', 'ti'],
    ['caress', 'caress'],
    ['cats', 'cat'],
    ['relational', 'relat'],
    ['conditional', 'condit'],
    ['rational', 'ration'],
    ['valenci', 'valenc'],
    ['hesitancy', 'hesit'],
    ['duplicator', 'duplic'],
    ['adjustable', 'adjust'],
    ['defensible', 'defens'],
    ['deterministically', 'determinist'],
    ['agreement', 'agreement'],
    ['replacement', 'replac'],
    ['rolling', 'roll'],
    ['milled', 'mill'],
    ['singing', 'sing'],
  ];

  it.each(vectors)('stems %s -> %s', (input, expected) => {
    expect(stemWord(input)).toBe(expected);
  });

  it('is case-insensitive and leaves short words untouched', () => {
    expect(stemWord('CARESSES')).toBe('caress');
    expect(stemWord('Relational')).toBe('relat');
    expect(stemWord('go')).toBe('go');
    expect(stemWord('a')).toBe('a');
  });
});

describe('tokenize', () => {
  it('splits on non-letter characters and keeps order', () => {
    expect(tokenize('Run, runs! Running...\nran')).toEqual(['Run', 'runs', 'Running', 'ran']);
  });

  it('returns empty array for empty or punctuation-only input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('123 !!! ---')).toEqual([]);
  });
});

describe('stemText merge statistics', () => {
  it('merges inflected forms under one stem with summed counts', () => {
    const result = stemText('run runs running');
    expect(result.totalTokens).toBe(3);
    expect(result.uniqueStems).toBe(1);
    expect(result.groups[0]?.stem).toBe('run');
    expect(result.groups[0]?.count).toBe(3);
    expect(result.groups[0]?.variants).toEqual(['run', 'running', 'runs']);
    expect(result.mergeRatio).toBeCloseTo(2 / 3, 6);
  });

  it('handles empty input without throwing', () => {
    const result = stemText('');
    expect(result.tokens).toEqual([]);
    expect(result.groups).toEqual([]);
    expect(result.totalTokens).toBe(0);
    expect(result.uniqueStems).toBe(0);
    expect(result.mergeRatio).toBe(0);
  });

  it('ignores punctuation and digits while counting tokens', () => {
    const result = stemText('Cats, cats & 2 dogs!');
    expect(result.totalTokens).toBe(3);
    expect(result.groups.find((g) => g.stem === 'cat')?.count).toBe(2);
    expect(result.groups.find((g) => g.stem === 'dog')?.count).toBe(1);
  });
});

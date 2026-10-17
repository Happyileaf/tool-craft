import { describe, it, expect } from 'vitest';
import { generateLorem, LOREM_MAX_COUNT } from './lorem';

describe('generateLorem', () => {
  it('数量为 0 或负数时返回空串', () => {
    expect(generateLorem({ unit: 'paragraph', count: 0 })).toBe('');
    expect(generateLorem({ unit: 'word', count: -5 })).toBe('');
    expect(generateLorem({ unit: 'sentence', count: 0 })).toBe('');
  });

  it('按单词数量生成，首词大写', () => {
    const text = generateLorem({ unit: 'word', count: 8 });
    const words = text.split(' ');
    expect(words).toHaveLength(8);
    expect(words[0]?.[0]).toBe(words[0]?.[0]?.toUpperCase());
    expect(text).not.toContain('.');
  });

  it('指定经典开头时单词模式以经典词序列起始', () => {
    expect(generateLorem({ unit: 'word', count: 3, startWithClassic: true })).toBe(
      'Lorem ipsum dolor',
    );
  });

  it('按句子数量生成，每句句末带句号且句首大写', () => {
    const text = generateLorem({ unit: 'sentence', count: 3 });
    const sentences = text.split('.').filter((item) => item.trim() !== '');
    expect(sentences).toHaveLength(3);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      expect(trimmed.charAt(0)).toBe(trimmed.charAt(0).toUpperCase());
    }
  });

  it('指定经典开头时句子模式以经典句起始', () => {
    const text = generateLorem({ unit: 'sentence', count: 2, startWithClassic: true });
    expect(text.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')).toBe(
      true,
    );
  });

  it('按段落数量生成，以空行分隔且首段以经典句起始', () => {
    const text = generateLorem({ unit: 'paragraph', count: 2, startWithClassic: true });
    const paragraphs = text.split('\n\n');
    expect(paragraphs).toHaveLength(2);
    expect(
      paragraphs[0]?.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit.'),
    ).toBe(true);
  });

  it('多次生成结果随机变化', () => {
    const first = generateLorem({ unit: 'word', count: 12 });
    const second = generateLorem({ unit: 'word', count: 12 });
    expect(first).not.toBe(second);
  });

  it('极大数量被限制在上限内而不崩溃', () => {
    const text = generateLorem({ unit: 'word', count: 999999 });
    expect(text.split(' ')).toHaveLength(LOREM_MAX_COUNT.word);
  });
});

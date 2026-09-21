import { describe, expect, it } from 'vitest';
import { computeLineDiff } from './diff';

describe('computeLineDiff', () => {
  it('完全相同的文本相似度为 100 且没有增删行', () => {
    const text = ['第一行', '第二行', '第三行'].join('\n');
    const result = computeLineDiff(text, text, false);

    expect(result.similarity).toBe(100);
    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(0);
    expect(result.lines.every((line) => line.type === 'equal')).toBe(true);
  });

  it('纯新增内容只统计新增行，相似度与公共行数一致', () => {
    const oldText = ['第一行', '第二行'].join('\n');
    const newText = ['第一行', '第二行', '新增的第三行'].join('\n');
    const result = computeLineDiff(oldText, newText, false);

    expect(result.addedCount).toBe(1);
    expect(result.removedCount).toBe(0);
    expect(result.similarity).toBe(67);
    expect(result.lines.some((line) => line.type === 'added')).toBe(true);
  });

  it('纯删除内容只统计删除行', () => {
    const oldText = ['第一行', '第二行', '第三行'].join('\n');
    const newText = ['第一行'].join('\n');
    const result = computeLineDiff(oldText, newText, false);

    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(2);
    expect(result.similarity).toBe(33);
    expect(
      result.lines.filter((line) => line.type === 'removed').map((line) => line.text),
    ).toEqual(['第二行', '第三行']);
  });

  it('简单替换场景的新增与删除计数都正确', () => {
    const oldText = ['一', '二', '三'].join('\n');
    const newText = ['一', '贰', '三'].join('\n');
    const result = computeLineDiff(oldText, newText, false);

    expect(result.addedCount).toBe(1);
    expect(result.removedCount).toBe(1);
    expect(result.similarity).toBe(67);
    expect(
      result.lines.find((line) => line.type === 'removed')?.text,
    ).toBe('二');
    expect(
      result.lines.find((line) => line.type === 'added')?.text,
    ).toBe('贰');
  });

  it('开启忽略首尾空白后缩进差异不视为增删，关闭时则正常统计', () => {
    const oldText = ['function main() {', '  return 1;', '}'].join('\n');
    const newText = ['function main() {', '    return 1;', '}'].join('\n');

    const strictResult = computeLineDiff(oldText, newText, false);
    expect(strictResult.addedCount).toBe(1);
    expect(strictResult.removedCount).toBe(1);

    const ignoredResult = computeLineDiff(oldText, newText, true);
    expect(ignoredResult.addedCount).toBe(0);
    expect(ignoredResult.removedCount).toBe(0);
    expect(ignoredResult.similarity).toBe(100);
    expect(
      ignoredResult.lines.find((line) => line.text === '    return 1;')?.type,
    ).toBe('equal');
  });

  it('两段文本均为空时不抛错且相似度为 100', () => {
    const result = computeLineDiff('', '', false);

    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(0);
    expect(result.similarity).toBe(100);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toMatchObject({
      type: 'equal',
      oldLineNumber: 1,
      newLineNumber: 1,
      text: '',
    });
  });

  it('仅一侧为空字符串时不抛错并保持相似度为 0', () => {
    expect(() => computeLineDiff('', '只有新内容', false)).not.toThrow();
    expect(computeLineDiff('', '只有新内容', false).similarity).toBe(0);
    expect(() => computeLineDiff('只有旧内容', '', false)).not.toThrow();
  });
});

import { describe, it, expect } from 'vitest';
import { convertWidth, toFullwidth, toHalfwidth } from './widthConverter';

describe('toHalfwidth', () => {
  it('转换全角字母数字', () => {
    const result = toHalfwidth('ＡＢＣ１２３');
    expect(result.output).toBe('ABC123');
    expect(result.changedCount).toBe(6);
    expect(result.alnumChanged).toBe(6);
    expect(result.punctuationChanged).toBe(0);
  });

  it('转换全角标点', () => {
    const result = toHalfwidth('Ｈｅｌｌｏ，Ｗｏｒｌｄ！');
    expect(result.output).toBe('Hello,World!');
    expect(result.punctuationChanged).toBe(2);
    expect(result.alnumChanged).toBe(10);
  });

  it('转换全角空格 U+3000', () => {
    const result = toHalfwidth('a\u3000b');
    expect(result.output).toBe('a b');
    expect(result.spaceChanged).toBe(1);
  });

  it('保留中文汉字与中文引号等非全角 ASCII 区字符', () => {
    const text = '你好世界 “引号”';
    const result = toHalfwidth(text);
    expect(result.output).toBe(text);
    expect(result.changedCount).toBe(0);
  });

  it('仅转换标点（含空格），保留全角字母数字', () => {
    const result = toHalfwidth('ＡＢ，１２\u3000！', 'punctuation');
    expect(result.output).toBe('ＡＢ,１２ !');
    expect(result.punctuationChanged).toBe(2);
    expect(result.spaceChanged).toBe(1);
    expect(result.alnumChanged).toBe(0);
  });

  it('仅转换字母数字，保留全角标点与空格', () => {
    const result = toHalfwidth('ＡＢ，１２\u3000！', 'alnum');
    expect(result.output).toBe('AB，12\u3000！');
    expect(result.alnumChanged).toBe(4);
    expect(result.punctuationChanged).toBe(0);
    expect(result.spaceChanged).toBe(0);
  });

  it('已是半角的字符不变', () => {
    const result = toHalfwidth('ABC123, world!');
    expect(result.output).toBe('ABC123, world!');
    expect(result.changedCount).toBe(0);
  });
});

describe('toFullwidth', () => {
  it('转换半角字母数字与标点', () => {
    const result = toFullwidth('ABC123,!');
    expect(result.output).toBe('ＡＢＣ１２３，！');
    expect(result.alnumChanged).toBe(6);
    expect(result.punctuationChanged).toBe(2);
  });

  it('转换半角空格为 U+3000', () => {
    const result = toFullwidth('a b');
    expect(result.output).toBe('ａ\u3000ｂ');
    expect(result.spaceChanged).toBe(1);
  });

  it('仅转换标点与空格', () => {
    const result = toFullwidth('AB, 1!', 'punctuation');
    expect(result.output).toBe('AB，　1！');
    expect(result.punctuationChanged).toBe(2);
    expect(result.spaceChanged).toBe(1);
    expect(result.alnumChanged).toBe(0);
  });

  it('仅转换字母数字', () => {
    const result = toFullwidth('AB, 12', 'alnum');
    expect(result.output).toBe('ＡＢ, １２');
    expect(result.alnumChanged).toBe(4);
    expect(result.punctuationChanged).toBe(0);
  });

  it('保留非 ASCII 字符（中文、emoji）', () => {
    const text = '你好世界 😀';
    const result = toFullwidth(text);
    expect(result.output).toBe('你好世界\u3000😀');
    expect(result.changedCount).toBe(1);
  });
});

describe('convertWidth', () => {
  it('按方向分派', () => {
    expect(convertWidth('１２３', 'toHalfwidth').output).toBe('123');
    expect(convertWidth('123', 'toFullwidth').output).toBe('１２３');
  });

  it('往返转换保持一致', () => {
    const original = 'ＡＢＣ，１２３！';
    const half = convertWidth(original, 'toHalfwidth');
    const roundTrip = convertWidth(half.output, 'toFullwidth');
    expect(roundTrip.output).toBe(original);
  });

  it('空文本安全返回', () => {
    const result = convertWidth('', 'toHalfwidth');
    expect(result.output).toBe('');
    expect(result.changedCount).toBe(0);
  });

  it('统计 ASCII 可打印区边界 0x21 与 0x7E', () => {
    const result = toFullwidth('!~');
    expect(result.output).toBe('！～');
    expect(result.punctuationChanged).toBe(2);
    expect(toHalfwidth('！～').output).toBe('!~');
  });
});

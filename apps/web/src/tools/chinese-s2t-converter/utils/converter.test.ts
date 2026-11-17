import { describe, expect, it } from 'vitest';
import {
  convertChinese,
  simplifyToTraditional,
  traditionalToSimplify,
} from './converter';

describe('simplifyToTraditional 单字转换', () => {
  it('把高频简体单字转为对应繁体', () => {
    const result = simplifyToTraditional('国家图书馆');
    expect(result.text).toBe('國家圖書館');
    expect(result.stat.replacements).toBeGreaterThan(0);
    expect(result.stat.inputLength).toBe(5);
  });

  it('未命中的字符（英文、数字、标点）原样保留', () => {
    const result = simplifyToTraditional('Hello 2026! 简体');
    expect(result.text).toBe('Hello 2026! 簡體');
  });

  it('空字符串返回空结果且零替换', () => {
    const result = simplifyToTraditional('');
    expect(result.text).toBe('');
    expect(result.stat.replacements).toBe(0);
  });
});

describe('simplifyToTraditional 词组级歧义消解', () => {
  it('「发」在理发语境转髮而非發', () => {
    expect(simplifyToTraditional('理发店').text).toBe('理髮店');
    expect(simplifyToTraditional('头发').text).toBe('頭髮');
    expect(simplifyToTraditional('发型').text).toBe('髮型');
  });

  it('「发」在发展语境转發', () => {
    expect(simplifyToTraditional('发展经济').text).toBe('發展經濟');
    expect(simplifyToTraditional('发现问题').text).toBe('發現問題');
  });

  it('「面」在食物语境转麵，在方位语境保留面', () => {
    expect(simplifyToTraditional('牛肉面').text).toBe('牛肉麵');
    expect(simplifyToTraditional('面包').text).toBe('麵包');
    expect(simplifyToTraditional('当面说清楚').text).toBe('當面說清楚');
  });

  it('「松」在松紧语境转鬆，树木语境保留松', () => {
    expect(simplifyToTraditional('放松心情').text).toBe('放鬆心情');
    expect(simplifyToTraditional('轻松').text).toBe('輕鬆');
    expect(simplifyToTraditional('松树').text).toBe('松樹');
  });

  it('「干」在干活语境转幹，干杯语境转乾', () => {
    expect(simplifyToTraditional('干活').text).toBe('幹活');
    expect(simplifyToTraditional('干净').text).toBe('乾淨');
    expect(simplifyToTraditional('干杯').text).toBe('乾杯');
  });

  it('长词组优先于短词组匹配', () => {
    // 「方便面」整体映射为泡麵，不应被拆成 方便+麵
    expect(simplifyToTraditional('方便面').text).toBe('泡麵');
  });
});

describe('地区用词变体', () => {
  it('台湾变体把软件转为軟體、服务器转为伺服器', () => {
    const result = simplifyToTraditional('软件服务器', 'taiwan');
    expect(result.text).toBe('軟體伺服器');
  });

  it('台湾变体把视频转为影片、鼠标转为滑鼠', () => {
    const result = simplifyToTraditional('视频鼠标', 'taiwan');
    expect(result.text).toBe('影片滑鼠');
  });

  it('香港变体公交车转为巴士、出租车转为的士', () => {
    const result = simplifyToTraditional('公交车出租车', 'hongkong');
    expect(result.text).toBe('巴士的士');
  });

  it('标准变体不应用地区替换', () => {
    const result = simplifyToTraditional('软件', 'standard');
    expect(result.text).toBe('軟件');
  });
});

describe('traditionalToSimplify 反向转换', () => {
  it('繁体单字转回简体', () => {
    const result = traditionalToSimplify('國家圖書館');
    expect(result.text).toBe('国家图书馆');
  });

  it('發 與 髮 反向合并为同一个发', () => {
    expect(traditionalToSimplify('頭髮').text).toBe('头发');
    expect(traditionalToSimplify('發展').text).toBe('发展');
  });

  it('麵 反向合并为面', () => {
    expect(traditionalToSimplify('牛肉麵').text).toBe('牛肉面');
  });

  it('台湾用词先归一再转简体', () => {
    const result = traditionalToSimplify('軟體伺服器', 'taiwan');
    expect(result.text).toBe('软件服务器');
  });
});

describe('convertChinese 统一入口', () => {
  it('按方向 s2t 转换', () => {
    const result = convertChinese('简体中文', 's2t');
    expect(result.text).toBe('簡體中文');
  });

  it('按方向 t2s 转换', () => {
    const result = convertChinese('簡體中文', 't2s');
    expect(result.text).toBe('简体中文');
  });

  it('双向往返在无歧义文本上还原原文', () => {
    const original = '国家图书馆里有很多古书';
    const roundTrip = traditionalToSimplify(simplifyToTraditional(original).text).text;
    expect(roundTrip).toBe(original);
  });

  it('统计字段按码点计数并统计替换事件', () => {
    const result = simplifyToTraditional('软体');
    expect(result.stat.inputLength).toBe(2);
    expect(result.stat.outputLength).toBe(2);
    expect(result.stat.replacements).toBeGreaterThan(0);
  });
});

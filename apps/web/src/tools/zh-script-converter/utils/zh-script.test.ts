import { describe, expect, it } from 'vitest';

import { ZhDirectionEnum } from '../constants';
import { S2T_CHARS } from '../data';
import { convert } from './zh-script';

describe('convert', () => {
  it('简体 → 繁体（通用）按词组消歧', () => {
    expect(convert('发展软件，头发和后台。', ZhDirectionEnum.S2T).text).toBe(
      '發展軟件，頭髮和後台。',
    );
  });

  it('简体 → 繁体（台湾）转换地区用词', () => {
    expect(convert('软件和鼠标，这里的信息。', ZhDirectionEnum.S2TW).text).toBe(
      '軟體和滑鼠，這裡的資訊。',
    );
  });

  it('简体 → 繁体（香港）转换地区用词', () => {
    expect(convert('软件、鼠标和公交车。', ZhDirectionEnum.S2HK).text).toBe(
      '軟件、滑鼠和巴士。',
    );
  });

  it('繁体 → 简体还原常用词组', () => {
    expect(convert('鬱鬱蔥蔥的森林，後來的事情。', ZhDirectionEnum.T2S).text).toBe(
      '郁郁葱葱的森林，后来的事情。',
    );
  });

  it('台湾繁体 → 简体还原地区用词', () => {
    expect(convert('軟體與滑鼠，這裡的資訊。', ZhDirectionEnum.TW2S).text).toBe(
      '软件与鼠标，这里的信息。',
    );
  });

  it('香港繁体 → 简体还原地区用词', () => {
    expect(convert('呢個軟件同滑鼠，這裡的資訊。', ZhDirectionEnum.HK2S).text).toBe(
      '呢个软件同鼠标，这里的信息。',
    );
  });

  it('不做逐字替换，而是最长匹配', () => {
    const result = convert('头发', ZhDirectionEnum.S2T);
    expect(result.text).toBe('頭髮');
    expect(result.hits).toEqual([{ from: '头发', to: '頭髮', index: 0 }]);
    expect(result.changedChars).toBe(2);
  });

  it('同一文本往返后可回到原文', () => {
    const source = '发展软件，整理头发，后台和这里。';
    const traditional = convert(source, ZhDirectionEnum.S2T).text;
    expect(convert(traditional, ZhDirectionEnum.T2S).text).toBe(source);
  });

  it('混合文本保留英文与数字', () => {
    expect(convert('Hello 世界 2026，使用 OpenCC 风格词库。', ZhDirectionEnum.S2T).text).toBe(
      'Hello 世界 2026，使用 OpenCC 風格詞庫。',
    );
  });

  it('纯英文、空文本不做改动', () => {
    expect(convert('abc 123 !', ZhDirectionEnum.S2T).text).toBe('abc 123 !');
    expect(convert('', ZhDirectionEnum.T2S)).toEqual({
      text: '',
      hits: [],
      changedChars: 0,
    });
  });

  it('关闭地区用词时回退到通用繁体', () => {
    expect(
      convert('软件', ZhDirectionEnum.S2TW, { regionWords: false }).text,
    ).toBe('軟件');
  });

  it('长文本分块时不会切断跨块词条', () => {
    const source = `${'x'.repeat(49_999)}头发`;
    const result = convert(source, ZhDirectionEnum.S2T);
    expect(result.text.slice(-2)).toBe('頭髮');
    expect(result.text.length).toBe(50_001);
    expect(result.changedChars).toBe(2);
  });

  it('内置字表规模足够覆盖常用汉字', () => {
    expect(Object.keys(S2T_CHARS).length).toBeGreaterThan(300);
    expect(Object.values(S2T_CHARS).every((value) => Array.from(value).length === 1)).toBe(
      true,
    );
  });
});

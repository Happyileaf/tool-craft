import { describe, it, expect } from 'vitest';
import {
  buildMorseTiming,
  decodeMorse,
  DEFAULT_CHAR_GAP_UNITS,
  DEFAULT_WORD_GAP_UNITS,
  encodeMorse,
} from './morse';

describe('摩尔斯编码', () => {
  it('基础字母与数字（标准字符间隔 3、单词间隔 7）', () => {
    expect(encodeMorse('SOS').output).toBe('... --- ...'.replace(/ /g, '   '));
    expect(encodeMorse('A').output).toBe('.-');
    expect(encodeMorse('ET').output).toBe('.   -');
    expect(encodeMorse('123').output).toBe('.----   ..---   ...--');
  });

  it('大小写不敏感', () => {
    expect(encodeMorse('sos').output).toBe(encodeMorse('SOS').output);
    expect(encodeMorse('AbC').output).toBe(encodeMorse('aBc').output);
  });

  it('单词之间使用 7 个空格', () => {
    const result = encodeMorse('HI THERE');
    expect(result.output).toBe(
      '....   ..       -   ....   .   .-.   .',
    );
  });

  it('常用标点', () => {
    expect(encodeMorse('.').output).toBe('.-.-.-');
    expect(encodeMorse(',').output).toBe('--..--');
    expect(encodeMorse('?').output).toBe('..--..');
    expect(encodeMorse('@').output).toBe('.--.-.');
  });

  it('字符间隔与单词间隔可调', () => {
    expect(encodeMorse('ET', { charGapUnits: 1 }).output).toBe('. -');
    expect(encodeMorse('HI HE', { charGapUnits: 2, wordGapUnits: 5 }).output).toBe(
      '....  ..     ....  .',
    );
  });

  it('间隔越界时归一化到允许范围', () => {
    expect(encodeMorse('ET', { charGapUnits: 0 }).output).toBe(
      encodeMorse('ET', { charGapUnits: 1 }).output,
    );
    expect(encodeMorse('ET', { charGapUnits: 999 }).output).toBe(
      encodeMorse('ET', { charGapUnits: 20 }).output,
    );
  });

  it('单词间隔必须大于字符间隔', () => {
    const result = encodeMorse('A B', { charGapUnits: 5, wordGapUnits: 3 });
    expect(result.output).toBeNull();
    expect(result.error).toContain('必须大于字符间隔');
  });

  it('不支持的字符报错', () => {
    const result = encodeMorse('A#B');
    expect(result.output).toBeNull();
    expect(result.error).toContain('#');
  });

  it('空串与纯空白返回空输出', () => {
    expect(encodeMorse('').output).toBe('');
    expect(encodeMorse('   ').output).toBe('');
  });

  it('折叠输入中的多余空白', () => {
    expect(encodeMorse('  A   B  ').output).toBe(encodeMorse('A B').output);
  });
});

describe('摩尔斯解码', () => {
  it('标准解码', () => {
    expect(decodeMorse('...   ---   ...').output).toBe('SOS');
    expect(decodeMorse('.-').output).toBe('A');
  });

  it('单词分隔：7 空格、斜杠均可', () => {
    expect(decodeMorse('....   ..       -   ....   .   .-.   .').output).toBe(
      'HI THERE',
    );
    expect(decodeMorse('.... .. / - .... . .-. .').output).toBe('HI THERE');
    expect(decodeMorse('.... ../- .... . .-. .').output).toBe('HI THERE');
  });

  it('容错：字符间多个空格', () => {
    expect(decodeMorse('.    -').output).toBe('ET');
  });

  it('非法字符报错', () => {
    expect(decodeMorse('.x').error).toContain('只能包含');
    expect(decodeMorse('.......').error).toContain('无法识别');
  });

  it('空串返回空输出', () => {
    expect(decodeMorse('   ').output).toBe('');
  });

  it('标准向量往返一致', () => {
    const text = 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG 0123456789';
    const encoded = encodeMorse(text);
    expect(encoded.error).toBeNull();
    expect(decodeMorse(encoded.output ?? '').output).toBe(text);
  });
});

describe('播放时序', () => {
  it('单点：1 单位发声', () => {
    expect(buildMorseTiming('.')).toEqual([{ units: 1, on: true }]);
  });

  it('单划：3 单位发声', () => {
    expect(buildMorseTiming('-')).toEqual([{ units: 3, on: true }]);
  });

  it('同一字符码元间隔 1 单位', () => {
    expect(buildMorseTiming('.-')).toEqual([
      { units: 1, on: true },
      { units: 1, on: false },
      { units: 3, on: true },
    ]);
  });

  it('字符间隔 3 单位静默', () => {
    expect(buildMorseTiming('.   .')).toEqual([
      { units: 1, on: true },
      { units: DEFAULT_CHAR_GAP_UNITS, on: false },
      { units: 1, on: true },
    ]);
  });

  it('单词间隔 7 单位静默，斜杠等价', () => {
    const fromSpaces = buildMorseTiming('.       .');
    const fromSlash = buildMorseTiming('. / .');
    const expected = [
      { units: 1, on: true },
      { units: DEFAULT_WORD_GAP_UNITS, on: false },
      { units: 1, on: true },
    ];
    expect(fromSpaces).toEqual(expected);
    expect(fromSlash).toEqual(expected);
  });

  it('SOS 完整时序点划与间隔正确', () => {
    const encoded = encodeMorse('SOS').output ?? '';
    const timing = buildMorseTiming(encoded);
    const onSegments = timing.filter((segment) => segment.on);
    expect(onSegments.map((segment) => segment.units)).toEqual([
      1, 1, 1, 3, 3, 3, 1, 1, 1,
    ]);
    expect(timing[0]).toEqual({ units: 1, on: true });
  });

  it('自定义间隔参数下按参数解析', () => {
    const timing = buildMorseTiming('. .   .', 1, 3);
    expect(timing).toEqual([
      { units: 1, on: true },
      { units: 1, on: false },
      { units: 1, on: true },
      { units: 3, on: false },
      { units: 1, on: true },
    ]);
  });
});

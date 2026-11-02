import { describe, it, expect } from 'vitest';
import {
  analyzeSms,
  countGsmSeptets,
  findNonGsmChars,
  getCapacityBounds,
} from './sms';
import {
  GSM_BASE_CHARS,
  GSM_EXTENSION_CHARS,
  GSM_CONCAT_SEGMENT_MAX,
  GSM_SINGLE_MAX,
  UCS2_CONCAT_SEGMENT_MAX,
  UCS2_SINGLE_MAX,
} from '../constants';

describe('GSM 7-bit 判定与计数', () => {
  it('纯 GSM 文本使用 7-bit，单字符 1 septet', () => {
    const result = analyzeSms('Hello, World! 0123');
    expect(result.encoding).toBe('gsm7');
    expect(result.segments).toBe(1);
    expect(result.perSegmentMax).toBe(GSM_SINGLE_MAX);
    expect(result.totalUnits).toBe(18);
  });

  it('GSM 扩展字符（如 €、^）每个占 2 septet', () => {
    expect(countGsmSeptets('€')).toBe(2);
    expect(countGsmSeptets('a^b')).toBe(4);
    const result = analyzeSms('Price: €10');
    expect(result.encoding).toBe('gsm7');
    expect(result.totalUnits).toBe(11);
  });

  it('恰好 160 septet 为单条，161 起为拼接且每条 153', () => {
    const exact = analyzeSms('a'.repeat(160));
    expect(exact.segments).toBe(1);
    expect(exact.isConcatenated).toBe(false);

    const overflow = analyzeSms('a'.repeat(161));
    expect(overflow.segments).toBe(2);
    expect(overflow.perSegmentMax).toBe(GSM_CONCAT_SEGMENT_MAX);
    expect(overflow.isConcatenated).toBe(true);

    // 159 个 a + 1 个扩展字符（2 septet）= 161 > 160，需要 2 条
    const extensionOverflow = analyzeSms('a'.repeat(159) + '€');
    expect(extensionOverflow.segments).toBe(2);
    expect(extensionOverflow.totalUnits).toBe(161);
  });

  it('长 GSM 短信分条数向上取整', () => {
    // 306 septet = 2 条恰好放满；307 需要第 3 条
    expect(analyzeSms('a'.repeat(306)).segments).toBe(2);
    expect(analyzeSms('a'.repeat(307)).segments).toBe(3);
  });

  it('空字符串返回空分析', () => {
    const result = analyzeSms('');
    expect(result.encoding).toBeNull();
    expect(result.segments).toBe(0);
  });

  it('GSM 基本表覆盖常见标点（§、¥、Ø、换行回车）', () => {
    const text = '@£$¥\nØø\rÅå§¿¡ÑÜ';
    const result = analyzeSms(text);
    expect(result.encoding).toBe('gsm7');
    expect(result.nonGsmChars).toHaveLength(0);
  });
});

describe('UCS-2 判定与计数', () => {
  it('含中文字符时整信切换为 UCS-2，70 字内单条', () => {
    const result = analyzeSms('您有一条验证码：123456');
    expect(result.encoding).toBe('ucs2');
    expect(result.segments).toBe(1);
    expect(result.perSegmentMax).toBe(UCS2_SINGLE_MAX);
    expect(result.charCount).toBe(14);
  });

  it('恰好 70 码元单条，71 起拼接每条 67', () => {
    const text = '中'.repeat(70);
    expect(analyzeSms(text).segments).toBe(1);
    const overflow = '中'.repeat(71);
    const result = analyzeSms(overflow);
    expect(result.segments).toBe(2);
    expect(result.perSegmentMax).toBe(UCS2_CONCAT_SEGMENT_MAX);
  });

  it('BMP 外 emoji 按 2 个 UTF-16 码元计数', () => {
    // 😀 是代理对，String.length === 2
    expect('😀'.length).toBe(2);
    const result = analyzeSms('😀');
    expect(result.encoding).toBe('ucs2');
    expect(result.totalUnits).toBe(2);
    expect(result.segments).toBe(1);
  });

  it('长 UCS-2 分条：67 × 2 = 134 码元 2 条，135 码元 3 条', () => {
    expect(analyzeSms('中'.repeat(134)).segments).toBe(2);
    expect(analyzeSms('中'.repeat(135)).segments).toBe(3);
  });

  it('非 GSM 字符定位（含位置与字符）', () => {
    const found = findNonGsmChars('a中b文');
    expect(found).toEqual([
      { char: '中', index: 1 },
      { char: '文', index: 3 },
    ]);
  });
});

describe('容量边界表', () => {
  it('返回两种编码的单条 / 拼接容量', () => {
    expect(getCapacityBounds('gsm7')).toEqual({ single: 160, concat: 153 });
    expect(getCapacityBounds('ucs2')).toEqual({ single: 70, concat: 67 });
  });
});

describe('GSM 字符表常量完整性', () => {
  it('基本表与扩展表无重复字符', () => {
    expect(new Set(GSM_BASE_CHARS).size).toBe(GSM_BASE_CHARS.length);
    expect(new Set(GSM_EXTENSION_CHARS).size).toBe(GSM_EXTENSION_CHARS.length);
  });

  it('扩展表字符均不属于基本表（二者交集为空）', () => {
    for (const char of GSM_EXTENSION_CHARS) {
      expect(GSM_BASE_CHARS.includes(char)).toBe(false);
    }
  });
});

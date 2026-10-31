import { describe, it, expect } from 'vitest';
import {
  computeChecksum,
  dmToDecimal,
  parseSentence,
  parseLines,
  typeLabel,
} from './nmea';

describe('computeChecksum', () => {
  it('matches known XOR values', () => {
    expect(
      computeChecksum('GPGGA,092750.000,5321.6802,N,00630.3372,W,1,8,1.03,61.7,M,55.2,M,,'),
    ).toBe('76');
    expect(
      computeChecksum('GPRMC,092750.000,A,5321.6802,N,00630.3372,W,0.02,31.66,280511,,,A'),
    ).toBe('43');
    expect(computeChecksum('GPGSA,A,3,04,05,,09,12,,,24,,,,,2.5,1.3,2.1')).toBe('39');
    expect(computeChecksum('GNGLL,4916.45,N,12311.12,W,225444,A,A')).toBe('42');
  });
});

describe('dmToDecimal', () => {
  it('converts ddmm.mmmm with hemisphere', () => {
    expect(dmToDecimal('5321.6802', 'N')).toBeCloseTo(53.3613367, 6);
    expect(dmToDecimal('00630.3372', 'W')).toBeCloseTo(-6.50562, 6);
    expect(dmToDecimal('4916.45', 'N')).toBeCloseTo(49.2741667, 6);
  });

  it('returns null for empty input', () => {
    expect(dmToDecimal('', 'N')).toBeNull();
  });
});

describe('parseSentence GGA', () => {
  const line =
    '$GPGGA,092750.000,5321.6802,N,00630.3372,W,1,8,1.03,61.7,M,55.2,M,,*76';

  it('parses a valid GGA sentence', () => {
    const r = parseSentence(line);
    expect(r.valid).toBe(true);
    expect(r.talker).toBe('GP');
    expect(r.type).toBe('GGA');
    expect(r.checksumGiven).toBe('76');
    expect(r.checksumCalculated).toBe('76');
    expect(r.error).toBeNull();
  });

  it('decodes time, coordinates and fix quality', () => {
    const r = parseSentence(line);
    const map = Object.fromEntries(r.decoded.map((d) => [d.label, d.value]));
    expect(map['UTC 时间']).toBe('09:27:50.000 UTC');
    expect(map['纬度（十进制）']).toBe('53.3613367');
    expect(map['经度（十进制）']).toBe('-6.5056200');
    expect(map['定位质量']).toBe('GPS 定位（SPS）');
    expect(map['参与定位卫星数']).toBe('8');
    expect(map['海拔高程']).toContain('61.700');
  });

  it('rejects wrong checksum', () => {
    const r = parseSentence(line.replace('*76', '*00'));
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/校验和不匹配/);
  });
});

describe('parseSentence RMC', () => {
  const line =
    '$GPRMC,092750.000,A,5321.6802,N,00630.3372,W,0.02,31.66,280511,,,A*43';

  it('decodes date, speed conversion and course', () => {
    const r = parseSentence(line);
    expect(r.valid).toBe(true);
    expect(r.type).toBe('RMC');
    const map = Object.fromEntries(r.decoded.map((d) => [d.label, d.value]));
    expect(map['UTC 日期']).toBe('2011-05-28 UTC');
    expect(map['定位状态']).toBe('有效（Active）');
    expect(map['对地航速']).toBe('0.02 kn');
    expect(map['对地航速（km/h）']).toBe('0.04 km/h');
    expect(map['对地航向（真北）']).toBe('31.66°');
  });
});

describe('parseSentence GLL / VTG / GSA / GSV', () => {
  it('parses GLL', () => {
    const r = parseSentence('$GNGLL,4916.45,N,12311.12,W,225444,A,A*42');
    expect(r.valid).toBe(true);
    expect(r.talker).toBe('GN');
    const map = Object.fromEntries(r.decoded.map((d) => [d.label, d.value]));
    expect(map['纬度（十进制）']).toBe('49.2741667');
    expect(map['定位状态']).toBe('有效（Active）');
  });

  it('parses VTG with knot and km/h speed', () => {
    const r = parseSentence('$GNVTG,054.7,T,055.2,M,0.1,N,0.2,K,A*3A');
    expect(r.valid).toBe(true);
    const map = Object.fromEntries(r.decoded.map((d) => [d.label, d.value]));
    expect(map['对地航向（真北）']).toBe('54.70° T');
    expect(map['对地航速（km/h）']).toBe('0.20 km/h');
  });

  it('parses GSA satellites and DOP', () => {
    const r = parseSentence('$GPGSA,A,3,04,05,,09,12,,,24,,,,,2.5,1.3,2.1*39');
    expect(r.valid).toBe(true);
    const map = Object.fromEntries(r.decoded.map((d) => [d.label, d.value]));
    expect(map['模式选择']).toBe('自动（2D/3D 自动切换）');
    expect(map['定位类型']).toBe('3D 定位');
    expect(map['使用的卫星 PRN']).toBe('04, 05, 09, 12, 24');
    expect(map['PDOP 位置精度因子']).toBe('2.50');
  });

  it('parses GSV satellite groups', () => {
    const r = parseSentence(
      '$GPGSV,2,1,08,01,40,083,41,02,17,308,42,03,39,243,43,04,25,164,42*7D',
    );
    expect(r.valid).toBe(true);
    const map = Object.fromEntries(r.decoded.map((d) => [d.label, d.value]));
    expect(map['可见卫星数']).toBe('08');
    expect(map['卫星列表']).toContain('PRN 01');
    expect(map['卫星列表']).toContain('PRN 04');
  });
});

describe('parseSentence error cases', () => {
  it('rejects empty line', () => {
    expect(parseSentence('').error).toBe('空行');
  });

  it('rejects line without $', () => {
    expect(parseSentence('GPGGA,x').error).toMatch(/\$/);
  });

  it('rejects line without checksum segment', () => {
    expect(parseSentence('$GPGGA,1,2').error).toMatch(/校验和段/);
  });

  it('rejects malformed checksum', () => {
    expect(parseSentence('$GPGGA*7').error).toMatch(/结构不符合/);
  });

  it('marks valid-checksum but unsupported type', () => {
    const r = parseSentence('$GPXXX,1,2*4C');
    expect(r.valid).toBe(false);
    expect(r.unsupported).toBe(true);
    expect(r.checksumCalculated).toBe('4C');
  });
});

describe('parseLines', () => {
  it('aggregates counts and ignores blank lines', () => {
    const text = [
      '$GPGGA,092750.000,5321.6802,N,00630.3372,W,1,8,1.03,61.7,M,55.2,M,,*76',
      '',
      '$GPRMC,092750.000,A,5321.6802,N,00630.3372,W,0.02,31.66,280511,,,A*00',
    ].join('\n');
    const batch = parseLines(text);
    expect(batch.total).toBe(2);
    expect(batch.validCount).toBe(1);
    expect(batch.invalidCount).toBe(1);
  });
});

describe('typeLabel', () => {
  it('returns Chinese label for known types', () => {
    expect(typeLabel('GGA')).toMatch(/定位/);
    expect(typeLabel('RMC')).toMatch(/推荐/);
  });
});

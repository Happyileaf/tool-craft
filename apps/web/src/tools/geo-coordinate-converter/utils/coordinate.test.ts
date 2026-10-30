import { describe, expect, it } from 'vitest';
import {
  convertCoordinate,
  formatDd,
  formatDdm,
  formatDms,
  parseBatchLines,
  parseCoordinate,
} from './coordinate';

const ok = (input: string, axis: 'lat' | 'lon' = 'lat') => {
  const result = parseCoordinate(input, axis);
  if ('error' in result) {
    throw new Error(`expected ok but got error: ${result.error}`);
  }
  return result.value;
};

const err = (input: string, axis: 'lat' | 'lon' = 'lat') => {
  const result = parseCoordinate(input, axis);
  if (!('error' in result)) {
    throw new Error(`expected error but got value: ${result.value}`);
  }
  return result.error;
};

describe('DD → DMS / DDM', () => {
  it('converts 31.2304 to 31°13′49.440″N', () => {
    expect(formatDms(31.2304, 'lat')).toBe('31°13′49.440″N');
  });

  it('round-trips 121°28′2.4″E back to ~121.467333', () => {
    const value = ok('121°28′2.4″E', 'lon');
    expect(value).toBeCloseTo(121.467333, 6);
  });

  it('converts DD to DDM with 4 decimal minutes', () => {
    expect(formatDdm(31.2304, 'lat')).toBe('31°13.8240′N');
    expect(formatDdm(-121.4737, 'lon')).toBe('121°28.4220′W');
  });

  it('round-trips DD → DMS → DD within 0.001 arc-second precision', () => {
    for (const value of [0, 31.2304, -45.5, 89.999999, 121.4737, -179.123]) {
      const text = formatDms(value, value <= 90 && value >= -90 ? 'lat' : 'lon');
      const back = ok(text, value <= 90 && value >= -90 ? 'lat' : 'lon');
      expect(Math.abs(back - value)).toBeLessThan(0.000001);
    }
  });

  it('round-trips DD → DDM → DD', () => {
    const back = ok(formatDdm(31.2304, 'lat'), 'lat');
    expect(back).toBeCloseTo(31.2304, 4);
  });
});

describe('hemisphere and sign equivalence', () => {
  it('treats S31°14′ and -31°14′ as the same negative value', () => {
    const a = ok('S31°14′');
    const b = ok('-31°14′');
    expect(a).toBeCloseTo(-31 - 14 / 60, 8);
    expect(a).toBe(b);
  });

  it('accepts plain ASCII quotes and space-separated tokens', () => {
    expect(ok("31 14' N")).toBeCloseTo(31 + 14 / 60, 8);
    expect(ok('31 13 49.44 N')).toBeCloseTo(31.2304, 5);
    expect(ok('121 28 2.4 E', 'lon')).toBeCloseTo(121.467333, 5);
  });

  it('suffix E/W works for longitude', () => {
    expect(ok('121.4737 E', 'lon')).toBeCloseTo(121.4737, 6);
    expect(ok('121.4737 W', 'lon')).toBeCloseTo(-121.4737, 6);
  });

  it('formats negative coordinates with S/W hemisphere letters', () => {
    expect(formatDms(-31.2304, 'lat')).toBe('31°13′49.440″S');
    expect(formatDms(121.4737, 'lon')).toMatch(/E$/);
  });
});

describe('validation', () => {
  it('rejects latitude > 90 and longitude < -180', () => {
    expect(err('91')).toContain('超出范围');
    expect(err('-181', 'lon')).toContain('超出范围');
    expect(ok('90')).toBe(90);
    expect(ok('-180', 'lon')).toBe(-180);
  });

  it('rejects mismatched hemisphere letters', () => {
    expect(err('E31', 'lat')).toContain('半球字母');
    expect(err('S121', 'lon')).toContain('半球字母');
  });

  it('rejects minutes/seconds >= 60', () => {
    expect(err('31°60′')).toContain('小于 60');
    expect(err('31°10′61″')).toContain('小于 60');
  });

  it('rejects empty and non-numeric input', () => {
    expect(err('   ')).toContain('为空');
    expect(err('abc')).toContain('非数字');
  });
});

describe('convertCoordinate', () => {
  it('converts DMS text directly to DD', () => {
    const result = convertCoordinate('121°28′2.4″E', 'lon', 'dd');
    expect(result).toEqual({ text: expect.any(String) });
    if ('text' in result) {
      expect(Number(result.text)).toBeCloseTo(121.467333, 6);
    }
  });

  it('converts signed DD to DMS', () => {
    expect(convertCoordinate('-31.2304', 'lat', 'dms')).toEqual({
      text: '31°13′49.440″S',
    });
  });

  it('propagates parse errors', () => {
    expect(convertCoordinate('91', 'lat', 'dms')).toHaveProperty('error');
  });

  it('formats DD without trailing zeros', () => {
    expect(formatDd(121.4673333333)).toBe('121.467333');
    expect(formatDd(31)).toBe('31');
  });
});

describe('parseBatchLines', () => {
  it('parses lat,lon rows and preserves empty rows', () => {
    const lines = parseBatchLines('31.2304, 121.4737\n\nN39°54′, 116°24′E\n91, 10');
    expect(lines).toHaveLength(4);
    expect(lines[0]).toMatchObject({ lineNo: 1, empty: false, lat: '31.2304', lon: '121.4737' });
    expect(lines[1]).toMatchObject({ lineNo: 2, empty: true, error: '空行' });
    expect(lines[2]!.error).toBeNull();
    expect(Number(lines[2]!.lat)).toBeCloseTo(39.9, 4);
    expect(lines[3]!.error).toContain('纬度');
  });

  it('accepts Chinese comma and semicolon separators', () => {
    const [first, second] = parseBatchLines('31.2，121.4\n31.2；121.4');
    expect(first!.error).toBeNull();
    expect(second!.error).toBeNull();
  });

  it('flags rows that are not exactly two fields', () => {
    const line = parseBatchLines('31.2')[0]!;
    expect(line.error).toContain('逗号');
  });
});

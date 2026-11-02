import { describe, it, expect } from 'vitest';
import { buildWifiPayload, escapeWifiField, parseWifiPayload } from './wifi';

describe('escapeWifiField', () => {
  it('escapes all five reserved characters', () => {
    expect(escapeWifiField('a\\b;c,d"e:f')).toBe('a\\\\b\\;c\\,d\\"e\\:f');
  });

  it('leaves normal text unchanged', () => {
    expect(escapeWifiField('My Home WiFi 5G')).toBe('My Home WiFi 5G');
  });
});

describe('buildWifiPayload', () => {
  it('builds a standard WPA payload', () => {
    expect(
      buildWifiPayload({ encryption: 'WPA', ssid: 'MyNet', password: 's3cret', hidden: false }),
    ).toBe('WIFI:T:WPA;S:MyNet;P:s3cret;;');
  });

  it('builds a nopass payload without P field', () => {
    expect(
      buildWifiPayload({ encryption: 'nopass', ssid: 'OpenNet', password: '', hidden: false }),
    ).toBe('WIFI:T:nopass;S:OpenNet;;');
  });

  it('emits H:true only for hidden networks', () => {
    expect(
      buildWifiPayload({ encryption: 'WPA', ssid: 'N', password: 'p', hidden: true }),
    ).toBe('WIFI:T:WPA;S:N;P:p;H:true;;');
  });

  it('escapes special characters in SSID and password', () => {
    expect(
      buildWifiPayload({
        encryption: 'WPA',
        ssid: 'guest;office"5G',
        password: 'p:w\\ord',
        hidden: false,
      }),
    ).toBe('WIFI:T:WPA;S:guest\\;office\\"5G;P:p\\:w\\\\ord;;');
  });

  it('trims surrounding whitespace from SSID', () => {
    expect(
      buildWifiPayload({ encryption: 'nopass', ssid: '  Net  ', password: '', hidden: false }),
    ).toBe('WIFI:T:nopass;S:Net;;');
  });

  it('rejects empty SSID and missing password', () => {
    expect(() =>
      buildWifiPayload({ encryption: 'WPA', ssid: '   ', password: 'p', hidden: false }),
    ).toThrow('SSID');
    expect(() =>
      buildWifiPayload({ encryption: 'WEP', ssid: 'N', password: '', hidden: false }),
    ).toThrow('密码');
  });
});

describe('parseWifiPayload', () => {
  it('parses a standard WPA payload round-trip', () => {
    const config = { encryption: 'WPA' as const, ssid: 'MyNet', password: 's3cret', hidden: false };
    expect(parseWifiPayload(buildWifiPayload(config))).toEqual(config);
  });

  it('parses hidden and nopass variants', () => {
    expect(
      parseWifiPayload('WIFI:T:WPA;S:Secret;P:p;H:true;;'),
    ).toEqual({ encryption: 'WPA', ssid: 'Secret', password: 'p', hidden: true });
    expect(parseWifiPayload('WIFI:T:nopass;S:Open;;')).toEqual({
      encryption: 'nopass',
      ssid: 'Open',
      password: '',
      hidden: false,
    });
  });

  it('unescapes reserved characters', () => {
    expect(parseWifiPayload('WIFI:T:WPA;S:a\\;b\\:c;P:p\\,q\\"r\\\\s;;')).toEqual({
      encryption: 'WPA',
      ssid: 'a;b:c',
      password: 'p,q"r\\s',
      hidden: false,
    });
  });

  it('defaults missing T to WPA (zxing behavior)', () => {
    expect(parseWifiPayload('WIFI:S:N;P:p;;')).toEqual({
      encryption: 'WPA',
      ssid: 'N',
      password: 'p',
      hidden: false,
    });
  });

  it('rejects malformed payloads', () => {
    expect(() => parseWifiPayload('T:WPA;S:N;;')).toThrow('WIFI:');
    expect(() => parseWifiPayload('WIFI:T:WPA;S:N;P:p')).toThrow(';;');
    expect(() => parseWifiPayload('WIFI:T:WPA;P:p;;')).toThrow('S 字段');
    expect(() => parseWifiPayload('WIFI:T:EAP;S:N;;')).toThrow('加密类型');
    expect(() => parseWifiPayload('WIFI:T:WPA;X:1;;')).toThrow('未知字段');
    expect(() => parseWifiPayload('WIFI:T:nopass;S:a\\')).toThrow();
  });
});

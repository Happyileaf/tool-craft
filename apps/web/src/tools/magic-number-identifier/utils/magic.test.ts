import { describe, expect, it } from 'vitest';
import { MAGIC_SIGNATURES } from '../constants';
import {
  bytesToHex,
  hexToBytes,
  identifyFile,
  identifyHexDump,
  normalizeHexDump,
} from './magic';

describe('normalizeHexDump', () => {
  it('剥离空格、冒号、换行与 xxd 偏移前缀', () => {
    const dump = `00000000: 8950 4e47 0d0a 1a0a  .PNG....
00000008: 0000 000d              ....`;
    expect(normalizeHexDump(dump)).toBe('89504e470d0a1a0a0000000d');
  });

  it('容忍 0x 前缀与大小写混用', () => {
    expect(normalizeHexDump('0x7F 0x45 0x4C 0x46')).toBe('7f454c46'.toLowerCase());
  });

  it('空输入返回空字符串', () => {
    expect(normalizeHexDump('   \n  ')).toBe('');
  });

  it('非十六进制字符抛错', () => {
    expect(() => normalizeHexDump('89GG')).toThrow('十六进制字符');
  });

  it('奇数长度抛错', () => {
    expect(() => normalizeHexDump('895')).toThrow('奇数');
  });
});

describe('hexToBytes / bytesToHex 往返', () => {
  it('互相转换保持一致', () => {
    const hex = '00ff10cafe';
    expect(bytesToHex(hexToBytes(hex))).toBe(hex);
  });
});

describe('identifyFile', () => {
  it('识别 PNG 完整 8 字节签名', () => {
    const result = identifyFile(hexToBytes('89504e470d0a1a0a0000'), MAGIC_SIGNATURES);
    expect(result.matches[0]?.name).toContain('PNG');
    expect(result.matches[0]?.mimeType).toBe('image/png');
  });

  it('区分 GIF87a 与 GIF89a', () => {
    const gif89a = identifyFile(hexToBytes('4749463839613900'), MAGIC_SIGNATURES);
    expect(gif89a.matches[0]?.name).toContain('GIF89a');
    const gif87a = identifyFile(hexToBytes('4749463837613900'), MAGIC_SIGNATURES);
    expect(gif87a.matches[0]?.name).toContain('GIF87a');
  });

  it('识别 JPEG / PDF / ELF / class / FLAC / OGG', () => {
    const cases: Array<[string, string]> = [
      ['ffd8ffe00010', 'JPEG'],
      ['255044462d312e37', 'PDF'],
      ['7f454c4602010100', 'ELF'],
      ['cafebabe00000034', 'Java 类'],
      ['664c614300000022', 'FLAC'],
      ['4f67675300020000', 'Ogg'],
    ];
    cases.forEach(([hex, expected]) => {
      const result = identifyFile(hexToBytes(hex), MAGIC_SIGNATURES);
      expect(result.matches[0]?.name).toContain(expected);
    });
  });

  it('RIFF + 偏移 8 的 WAVE 联合命中', () => {
    // RIFF....WAVE....
    const wav = '524946462400000057415645666d7420';
    const result = identifyFile(hexToBytes(wav), MAGIC_SIGNATURES);
    const names = result.matches.map((match) => match.name).join('|');
    expect(names).toContain('RIFF');
    expect(names).toContain('WAVE');
    // 更长的偏移签名排序在前
    expect(result.matches[0]?.offset).toBe(8);
  });

  it('OLE 复合文档返回共享签名候选', () => {
    const result = identifyFile(hexToBytes('d0cf11e0a1b11ae100000000'), MAGIC_SIGNATURES);
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]?.extensions).toEqual(['doc', 'xls', 'ppt', 'msi']);
  });

  it('未命中给出未知格式提示', () => {
    const result = identifyFile(hexToBytes('00112233445566778899'), MAGIC_SIGNATURES);
    expect(result.matches).toHaveLength(0);
    expect(result.reason).toContain('未命中');
  });

  it('数据过短给出长度提示', () => {
    const result = identifyFile(hexToBytes('89'), MAGIC_SIGNATURES);
    expect(result.matches).toHaveLength(0);
    expect(result.reason).toContain('数据过短');
  });

  it('空字节数组返回空输入提示', () => {
    const result = identifyFile(new Uint8Array(0), MAGIC_SIGNATURES);
    expect(result.reason).toContain('为空');
  });

  it('previewHex 最多回显前 16 字节', () => {
    const longHex = '89504e470d0a1a0a' + '00'.repeat(20);
    const result = identifyFile(hexToBytes(longHex), MAGIC_SIGNATURES);
    expect(result.previewHex).toHaveLength(32);
  });
});

describe('identifyHexDump', () => {
  it('从带偏移的 dump 文本识别 ZIP（PK 头）', () => {
    const result = identifyHexDump('00000000: 504b 0304 1400 0600', MAGIC_SIGNATURES);
    expect(result.matches[0]?.name).toContain('ZIP');
  });

  it('空文本返回空输入结果而非抛错', () => {
    const result = identifyHexDump('', MAGIC_SIGNATURES);
    expect(result.matches).toHaveLength(0);
    expect(result.reason).toContain('为空');
  });
});

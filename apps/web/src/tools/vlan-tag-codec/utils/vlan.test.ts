import { describe, expect, it } from 'vitest';
import {
  TPID_CTAG,
  TPID_STAG,
  VlanError,
  buildQinQ,
  buildTag,
  buildTci,
  bytesToHex,
  hexToBytes,
  locateTagInFrame,
  normalizeHex,
  parseQinQBytes,
  parseTagBytes,
  parseTci,
  qinQToBytes,
  tagToBytes,
  uint16ToHex,
  vidWarning,
} from './vlan';

describe('buildTci / parseTci 位域拼装与拆位', () => {
  it('PCP=5、DEI=1、VID=100 手算为 0xB064（5<<13=0xA000，1<<12=0x1000，+100=0x64）', () => {
    const tci = buildTci({ pcp: 5, dei: 1, vid: 100 });
    expect(tci).toBe(0xb064);
    expect(uint16ToHex(tci)).toBe('B064');
    expect(parseTci(tci)).toEqual({ pcp: 5, dei: 1, vid: 100 });
  });

  it('验收向量 PCP=5、DEI=0、VID=100 为 0xA064 且往返一致', () => {
    const tci = buildTci({ pcp: 5, dei: 0, vid: 100 });
    expect(tci).toBe(0xa064);
    expect(parseTci(tci)).toEqual({ pcp: 5, dei: 0, vid: 100 });
  });

  it('全 0 与全 1 边界往返', () => {
    expect(parseTci(buildTci({ pcp: 0, dei: 0, vid: 0 }))).toEqual({ pcp: 0, dei: 0, vid: 0 });
    expect(parseTci(buildTci({ pcp: 7, dei: 1, vid: 4095 }))).toEqual({
      pcp: 7,
      dei: 1,
      vid: 4095,
    });
    expect(buildTci({ pcp: 7, dei: 1, vid: 4095 })).toBe(0xffff);
  });
});

describe('字段校验', () => {
  it('PCP 越界、DEI 非法、VID 越界分别抛中文异常', () => {
    expect(() => buildTci({ pcp: 8, dei: 0, vid: 1 })).toThrow(/PCP/);
    expect(() => buildTci({ pcp: 0, dei: 2, vid: 1 })).toThrow(/DEI/);
    expect(() => buildTci({ pcp: 0, dei: 0, vid: 4096 })).toThrow(/VID/);
    expect(() => buildTci({ pcp: 0, dei: 0, vid: -1 })).toThrow(/VID/);
  });

  it('VID 0 与 4095 允许计算但产生保留告警', () => {
    expect(() => buildTci({ pcp: 0, dei: 0, vid: 0 })).not.toThrow();
    expect(() => buildTci({ pcp: 0, dei: 0, vid: 4095 })).not.toThrow();
    expect(vidWarning(0)).toContain('保留');
    expect(vidWarning(4095)).toContain('保留');
    expect(vidWarning(100)).toBeNull();
  });
});

describe('buildTag / parseTagBytes 单层 4 字节往返', () => {
  it('构造 81 00 B0 64 并解析回各字段', () => {
    const tag = buildTag({ pcp: 5, dei: 1, vid: 100 }, TPID_CTAG);
    expect(tag.tpidHex).toBe('8100');
    expect(tag.tciHex).toBe('B064');
    const bytes = tagToBytes(tag);
    expect(bytesToHex(bytes, true)).toBe('81 00 B0 64');
    const parsed = parseTagBytes(bytes);
    expect(parsed.tpid).toBe(TPID_CTAG);
    expect(parsed.pcp).toBe(5);
    expect(parsed.dei).toBe(1);
    expect(parsed.vid).toBe(100);
  });

  it('宽松解析带 0x 前缀与空格的 hex 输入', () => {
    const parsed = parseTagBytes(hexToBytes('0x8100b064'));
    expect(parsed.tpid).toBe(TPID_CTAG);
    expect(parsed.vid).toBe(100);
    expect(parsed.dei).toBe(1);
    expect(normalizeHex(' 81:00,b0-64\n')).toBe('8100b064');
  });

  it('解析任务给定字面向量 8100A864（实际位域 PCP=5、DEI=0、VID=2148）', () => {
    const parsed = parseTagBytes(hexToBytes('8100A864'));
    expect(parsed.tpidHex).toBe('8100');
    expect(parsed.tciHex).toBe('A864');
    expect(parsed.pcp).toBe(5);
    expect(parsed.dei).toBe(0);
    expect(parsed.vid).toBe(0x864);
    expect(parseTci(0xa864)).toEqual({ pcp: 5, dei: 0, vid: 2148 });
  });

  it('TPID 错误、字节不足分别抛带偏移的异常', () => {
    expect(() => parseTagBytes(hexToBytes('1234A864'))).toThrow(/偏移 0/);
    expect(() => parseTagBytes(hexToBytes('8100A8'))).toThrow(/4 字节/);
  });

  it('hex 输入奇数位与非 hex 字符报错', () => {
    expect(() => hexToBytes('810')).toThrow(/奇数/);
    expect(() => hexToBytes('8100ZZ64')).toThrow(/非十六进制/);
    expect(() => hexToBytes('   ')).toThrow(/为空/);
  });
});

describe('QinQ 双层 8 字节', () => {
  it('外层 0x88A8/VID20、内层 0x8100/PCP3/DEI1/VID300 往返一致', () => {
    const pair = buildQinQ(
      { pcp: 0, dei: 0, vid: 20 },
      { pcp: 3, dei: 1, vid: 300 },
    );
    expect(pair.outer.tpid).toBe(TPID_STAG);
    expect(pair.outer.tpidHex).toBe('88A8');
    expect(pair.outer.tciHex).toBe('0014');
    expect(pair.inner.tpidHex).toBe('8100');
    expect(pair.inner.tciHex).toBe('712C');
    const bytes = qinQToBytes(pair);
    expect(bytes).toHaveLength(8);
    expect(bytesToHex(bytes, true)).toBe('88 A8 00 14 81 00 71 2C');

    const parsed = parseQinQBytes(bytes);
    expect(parsed.outer).toMatchObject({ pcp: 0, dei: 0, vid: 20, tpid: TPID_STAG });
    expect(parsed.inner).toMatchObject({ pcp: 3, dei: 1, vid: 300, tpid: TPID_CTAG });
  });

  it('外层或内层 TPID 错误时抛带偏移异常', () => {
    expect(() => parseQinQBytes(hexToBytes('8100001488A8712C'))).toThrow(/偏移 0/);
    expect(() => parseQinQBytes(hexToBytes('88A8001488A8712C'))).toThrow(/偏移 4/);
    expect(() => parseQinQBytes(hexToBytes('88A80014810071'))).toThrow(/8 字节/);
  });

  it('旧版 0x9100 外层 TPID 同样可解析', () => {
    const parsed = parseQinQBytes(hexToBytes('910000148100712C'));
    expect(parsed.outer.tpid).toBe(0x9100);
    expect(parsed.inner.vid).toBe(300);
  });
});

describe('locateTagInFrame 帧内定位', () => {
  const frame =
    '02 00 00 00 00 01 02 00 00 00 00 02 81 00 B0 64 08 00 45 00 00 1E 00 00 00 00 40 06 00 00 C0 A8 01 0A C0 A8 01 01';

  it('在偏移 12 定位单标签并读出标签后 EtherType', () => {
    const located = locateTagInFrame(hexToBytes(frame));
    expect(located.tagOffset).toBe(12);
    expect(located.layers).toBe(1);
    expect(located.tags).toHaveLength(1);
    expect(located.tags[0]?.tpid).toBe(TPID_CTAG);
    expect(located.tags[0]?.vid).toBe(100);
    expect(located.followingEtherTypeHex).toBe('0800');
  });

  it('QinQ 帧识别为两层且顺序外→内', () => {
    const qinqFrame =
      '02 00 00 00 00 01 02 00 00 00 00 02 88 A8 00 14 81 00 71 2C 08 00 AA BB';
    const located = locateTagInFrame(hexToBytes(qinqFrame));
    expect(located.layers).toBe(2);
    expect(located.tagOffset).toBe(12);
    expect(located.tags[0]?.tpid).toBe(TPID_STAG);
    expect(located.tags[1]?.vid).toBe(300);
    expect(located.followingEtherTypeHex).toBe('0800');
  });

  it('无标签帧返回未检测到 VLAN 标签错误', () => {
    const plain =
      '02 00 00 00 00 01 02 00 00 00 00 02 08 00 45 00 00 1E 00 00';
    expect(() => locateTagInFrame(hexToBytes(plain))).toThrow(/未检测到 VLAN 标签/);
  });

  it('截断帧给出长度错误', () => {
    expect(() => locateTagInFrame(hexToBytes('0200000000010200000000'))).toThrow(/14 字节/);
  });
});

describe('VlanError 类型', () => {
  it('所有领域错误均为 VlanError 实例', () => {
    try {
      buildTci({ pcp: 9, dei: 0, vid: 1 });
      throw new Error('应当抛错');
    } catch (error) {
      expect(error).toBeInstanceOf(VlanError);
    }
  });
});

import { describe, expect, it } from 'vitest';
import {
  decodeDifferentialManchester,
  decodeManchester,
  encodeDifferentialManchester,
  encodeManchester,
  normalizeBits,
  normalizeLevels,
  timingParams,
} from './manchester';

/** 可复现的 32 位线性同余伪随机生成器（glibc 参数，取最高位作为随机比特） */
function lcgBits(seed: number, length: number): string {
  let state = seed >>> 0;
  let output = '';
  for (let i = 0; i < length; i += 1) {
    state = (Math.imul(1103515245, state) + 12345) >>> 0;
    state %= 2147483648;
    output += (state >>> 30) & 1 ? '1' : '0';
  }
  return output;
}

describe('normalizeBits', () => {
  it('去除空白与 0b 前缀并校验字符合法性', () => {
    expect(normalizeBits('0b10 11')).toBe('1011');
    expect(normalizeBits('1011')).toBe('1011');
    expect(normalizeBits(' 1 0 1 1 ')).toBe('1011');
    expect(normalizeBits('0B1011')).toBe('1011');
  });

  it('拒绝空串与非法字符并给出 1-based 定位', () => {
    expect(() => normalizeBits('   ')).toThrow('不能为空');
    expect(() => normalizeBits('1021')).toThrow('第 3 位');
    expect(() => normalizeBits('10X1')).toThrow('第 3 位');
  });
});

describe('normalizeLevels', () => {
  it('接受 H/L 与全 0/1 双相采样', () => {
    expect(normalizeLevels('LH HL')).toEqual(['L', 'H', 'H', 'L']);
    expect(normalizeLevels('0110')).toEqual(['L', 'H', 'H', 'L']);
  });

  it('拒绝非法符号并定位', () => {
    expect(() => normalizeLevels('LHXH')).toThrow('第 3 个电平');
    expect(() => normalizeLevels('')).toThrow('不能为空');
  });
});

describe('encodeManchester', () => {
  it('IEEE 802.3 编码 1011 的验收向量', () => {
    const result = encodeManchester('1011', 'ieee');
    expect(result.levels).toBe('LH HL LH LH');
    expect(result.pairs).toEqual(['LH', 'HL', 'LH', 'LH']);
    // 每位中间恰有一次跳变
    result.perBit.forEach((entry) => {
      expect(entry.pair[0]).not.toBe(entry.pair[1]);
    });
    expect(result.perBit.map((entry) => entry.bit)).toEqual(['1', '0', '1', '1']);
  });

  it('Thomas 约定与 IEEE 极性完全相反', () => {
    const thomas = encodeManchester('1011', 'thomas');
    expect(thomas.levels).toBe('HL LH HL HL');
    const ieee = encodeManchester('1011', 'ieee');
    thomas.pairs.forEach((pair, index) => {
      const inverted = pair
        .split('')
        .map((level) => (level === 'H' ? 'L' : 'H'))
        .join('');
      expect(inverted).toBe(ieee.pairs[index]);
    });
  });
});

describe('encodeDifferentialManchester', () => {
  it('initialLevel=L 编码 1011：位 1 起始无跳变、位 0 起始有跳变、中间均有跳变', () => {
    const result = encodeDifferentialManchester('1011', 'L');
    expect(result.perBit.map((entry) => entry.startTransition)).toEqual([
      false,
      true,
      false,
      false,
    ]);
    // 每一位中间都有跳变
    result.perBit.forEach((entry) => {
      expect(entry.pair[0]).not.toBe(entry.pair[1]);
    });
    // 手工推导：起始 L；1 不跳变→LH（结束 H）；0 起始跳变→起始 L→LH；1 不跳变→HL；1 不跳变→LH
    expect(result.levels).toBe('LH LH HL LH');
  });

  it('同 initialLevel 下差分解码可还原原始比特', () => {
    const encoded = encodeDifferentialManchester('1011', 'L');
    const decoded = decodeDifferentialManchester(encoded.levels, 'L');
    expect(decoded.bits).toBe('1011');
  });
});

describe('decodeManchester', () => {
  it('两种约定闭环并与编码互逆', () => {
    expect(decodeManchester('LH HL LH LH', 'ieee').bits).toBe('1011');
    expect(decodeManchester('HL LH HL HL', 'thomas').bits).toBe('1011');
    // 0/1 双相采样同样可解码（0→L、1→H，01 10 01 01 即 LH HL LH LH → 1011）
    expect(decodeManchester('01 10 01 01', 'ieee').bits).toBe('1011');
  });

  it('奇数长度、非法符号与无跳变码元均抛出带位序号的错误', () => {
    expect(() => decodeManchester('LHL', 'ieee')).toThrow('奇数');
    expect(() => decodeManchester('LH XH', 'ieee')).toThrow('第 3 个电平');
    expect(() => decodeManchester('LH HH LH LH', 'ieee')).toThrow('第 2 位');
    expect(() => decodeManchester('LL HL', 'ieee')).toThrow('第 1 位');
  });
});

describe('decodeDifferentialManchester', () => {
  it('畸形码元与奇数长度抛出带位序号的错误', () => {
    expect(() => decodeDifferentialManchester('LHL', 'L')).toThrow('奇数');
    expect(() => decodeDifferentialManchester('LH LL', 'L')).toThrow('第 2 位');
    expect(() => decodeDifferentialManchester('HH LH', 'L')).toThrow('第 1 位');
  });
});

describe('随机 64 位闭环', () => {
  const vector = lcgBits(20261116, 64);

  it('IEEE 曼彻斯特编码后解码完全还原', () => {
    const encoded = encodeManchester(vector, 'ieee');
    expect(decodeManchester(encoded.levels, 'ieee').bits).toBe(vector);
  });

  it('Thomas 曼彻斯特编码后解码完全还原', () => {
    const encoded = encodeManchester(vector, 'thomas');
    expect(decodeManchester(encoded.levels, 'thomas').bits).toBe(vector);
  });

  it('差分曼彻斯特在两种初始电平下编码后解码完全还原', () => {
    (['L', 'H'] as const).forEach((initialLevel) => {
      const encoded = encodeDifferentialManchester(vector, initialLevel);
      const decoded = decodeDifferentialManchester(encoded.levels, initialLevel);
      expect(decoded.bits).toBe(vector);
      // 差分编码记录的起始跳变标记与比特一致：0→跳变，1→不跳变
      encoded.perBit.forEach((entry, index) => {
        expect(entry.startTransition).toBe(vector[index] === '0');
      });
    });
  });
});

describe('timingParams', () => {
  it('10 Mbps 下码元宽度 100ns、主瓣带宽提示等于比特率', () => {
    const params = timingParams(10_000_000);
    expect(params.symbolWidthSeconds).toBe(1e-7);
    expect(params.symbolWidthUs).toBeCloseTo(0.1, 12);
    expect(params.minBandwidthHz).toBe(1e7);
  });

  it('拒绝非正比特率', () => {
    expect(() => timingParams(0)).toThrow('正数');
    expect(() => timingParams(-1)).toThrow('正数');
  });
});

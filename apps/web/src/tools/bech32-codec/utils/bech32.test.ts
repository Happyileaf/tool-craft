import { describe, it, expect } from 'vitest';
import {
  BECH32_CHARSET,
  convertBits,
  decodeBech32,
  encodeBech32,
  hexToBytes,
  bytesToHex,
  interpretSegwit,
} from './bech32';

// BIP-173 官方 VALID 向量（含 witness v0、非 witness 数据）
const BIP173_VALID = [
  'BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4',
  'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
  'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7k7grplx',
  'BC1SW50QA3JX3S',
  'bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj',
  'tb1qqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesrxh6hy',
];

// BIP-350 官方 Bech32m VALID 通用向量
const BIP350_VALID = [
  'A1LQFN3A',
  'a1lqfn3a',
  'an83characterlonghumanreadablepartthatcontainsthetheexcludedcharactersbioandnumber11sg7hg6',
  'abcdef1l7aum6echk45nj3s0wdvt2fg8x9yrzpqzd3ryx',
  '11llllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllludsr8',
  'split1checkupstagehandshakeupstreamerranterredcaperredlc445v',
  '?1v759aa',
];

// BIP-350 官方 SegWit VALID 地址 → scriptPubKey（去掉首字节版本与长度字节后即 program）
const SEGWIT_VALID: Array<[string, string]> = [
  ['BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4', '0014751e76e8199196d454941c45d1b3a323f1433bd6'],
  [
    'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
    '00201863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262',
  ],
  [
    'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7kt5nd6y',
    '5128751e76e8199196d454941c45d1b3a323f1433bd6751e76e8199196d454941c45d1b3a323f1433bd6',
  ],
  ['BC1SW50QGDZ25J', '6002751e'],
  ['bc1zw508d6qejxtdg4y5r3zarvaryvaxxpcs', '5210751e76e8199196d454941c45d1b3a323'],
  [
    'tb1qqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesrxh6hy',
    '0020000000c4a5cad46221b2a187905e5266362b99d5e91c6ce24d165dab93e86433',
  ],
  [
    'tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c',
    '5120000000c4a5cad46221b2a187905e5266362b99d5e91c6ce24d165dab93e86433',
  ],
  [
    'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0',
    '512079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
  ],
];

// BIP-350 官方 INVALID SegWit 地址
const SEGWIT_INVALID = [
  // HRP 非法（decode 阶段即失败）
  'tc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vq5zuyut',
  // 校验和类型错误（Bech32 而非 Bech32m）
  'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqh2y7hd',
  // 校验和类型错误（Bech32m 而非 Bech32）
  'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kemeawh',
  // 校验和非法字符
  'bc1p38j9r5y49hruaue7wxjce0updqjuyyx0kh56v8s25huc6995vvpql3jow4',
  // program 长度 1 字节
  'bc1pw5dgrnzv',
  // program 长度 41 字节
  'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7v8n0nx0muaewav253zgeav',
  // v0 program 长度非法
  'BC1QR508D6QEJXTDG4Y5R3ZARVARYV98GJ9P',
  // 混用大小写
  'tb1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vq47Zagq',
  // 8->5 转换 padding 非零
  'tb1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vpggkg4j',
];

describe('decodeBech32 官方向量', () => {
  it('BIP-173 VALID 向量全部解码成功', () => {
    for (const address of BIP173_VALID) {
      const decoded = decodeBech32(address);
      expect(decoded.hrp.length).toBeGreaterThan(0);
      expect(decoded.data.length).toBeGreaterThan(0);
    }
  });

  it('BIP-350 Bech32m 通用 VALID 向量全部解码为 bech32m', () => {
    for (const address of BIP350_VALID) {
      const decoded = decodeBech32(address);
      expect(decoded.checksumType).toBe('bech32m');
    }
  });

  it('BIP-350 SegWit VALID 地址全部解码成功', () => {
    for (const [address] of SEGWIT_VALID) {
      const decoded = decodeBech32(address);
      expect(decoded.hrp.length).toBeGreaterThan(0);
    }
  });

  it('Taproot v1 地址识别为 bech32m', () => {
    const decoded = decodeBech32(
      'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0',
    );
    expect(decoded.checksumType).toBe('bech32m');
  });

  it('v0 原生隔离见证地址识别为 bech32', () => {
    const decoded = decodeBech32(
      'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    );
    expect(decoded.checksumType).toBe('bech32');
  });
});

describe('decodeBech32 错误定位', () => {
  it('混用大小写报错', () => {
    expect(() =>
      decodeBech32('tb1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vq47Zagq'),
    ).toThrow(/大小写/);
  });

  it('篡改字符后两种常量均不匹配', () => {
    expect(() =>
      decodeBech32('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5'),
    ).toThrow(/校验和/);
  });

  it('长度超过 90 报错', () => {
    expect(() => decodeBech32(`bc1${'q'.repeat(88)}`)).toThrow(/90/);
  });

  it('缺少分隔符 1 报错', () => {
    expect(() => decodeBech32('qyrz8wqd2c9m')).toThrow(/分隔符|HRP/);
  });

  it('数据部分不足 6 位报错', () => {
    expect(() => decodeBech32('in1muywd')).toThrow();
  });

  it('非 ASCII 字符报错', () => {
    expect(() => decodeBech32('é1lqfn3a')).toThrow();
  });
});

describe('encodeBech32', () => {
  it('编码 P2WPKH witness program 与 BIP-173 向量一致', () => {
    const bytes = hexToBytes('751e76e8199196d454941c45d1b3a323f1433bd6');
    const fiveBit = [0].concat(convertBits(bytes, 8, 5, true));
    expect(encodeBech32('bc', fiveBit, 'bech32')).toBe(
      'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    );
  });

  it('编码 Taproot witness program 与 BIP-350 向量一致', () => {
    const bytes = hexToBytes(
      '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    );
    const fiveBit = [1].concat(convertBits(bytes, 8, 5, true));
    expect(encodeBech32('bc', fiveBit, 'bech32m')).toBe(
      'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0',
    );
  });

  it('auto 模式：v0 用 bech32、v1 用 bech32m', () => {
    const v0Program = hexToBytes('751e76e8199196d454941c45d1b3a323f1433bd6');
    const v0 = [0].concat(convertBits(v0Program, 8, 5, true));
    expect(encodeBech32('bc', v0, 'auto')).toBe(
      'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    );
    const v1Program = hexToBytes(
      '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    );
    const v1 = [1].concat(convertBits(v1Program, 8, 5, true));
    expect(encodeBech32('bc', v1, 'auto')).toBe(
      'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0',
    );
  });

  it('HRP 自动转小写', () => {
    const bytes = hexToBytes('00');
    const fiveBit = convertBits(bytes, 8, 5, true);
    expect(encodeBech32('TB', fiveBit, 'bech32').startsWith('tb1')).toBe(true);
  });

  it('5-bit 数据越界抛错', () => {
    expect(() => encodeBech32('bc', [32], 'bech32')).toThrow();
  });

  it('编解码往返一致', () => {
    const bytes = hexToBytes('aabbccddeeff00112233');
    const fiveBit = [0].concat(convertBits(bytes, 8, 5, true));
    const encoded = encodeBech32('bcrt', fiveBit, 'bech32');
    const decoded = decodeBech32(encoded);
    expect(decoded.hrp).toBe('bcrt');
    expect(decoded.data).toEqual(fiveBit);
  });

  it('全部 BIP-350 SegWit 有效地址可由对应 program 重新编码', () => {
    for (const [address, scriptPubKey] of SEGWIT_VALID) {
      const version = scriptPubKey.slice(0, 2) === '00' ? 0 : parseInt(scriptPubKey.slice(0, 2), 16) - 0x50;
      const programLen = parseInt(scriptPubKey.slice(2, 4), 16);
      const programHex = scriptPubKey.slice(4, 4 + programLen * 2);
      const fiveBit = [version].concat(convertBits(hexToBytes(programHex), 8, 5, true));
      const hrp = address.toLowerCase().slice(0, address.indexOf('1'));
      const kind = version === 0 ? 'bech32' : 'bech32m';
      expect(encodeBech32(hrp, fiveBit, kind)).toBe(address.toLowerCase());
    }
  });
});

describe('convertBits', () => {
  it('8->5->8 往返无损失', () => {
    const bytes = Array.from({ length: 32 }, (_, i) => (i * 7 + 1) % 256);
    const fiveBit = convertBits(bytes, 8, 5, true);
    expect(fiveBit.every((v) => v >= 0 && v <= 31)).toBe(true);
    const back = convertBits(fiveBit, 5, 8, false);
    expect(back).toEqual(bytes);
  });

  it('严格模式下非法 padding 抛错', () => {
    // 单个 0xff：5bit 分组后剩余位非零
    expect(() => convertBits([0xff], 8, 5, false)).toThrow(/padding/);
  });

  it('输入值超位宽抛错', () => {
    expect(() => convertBits([256], 8, 5, true)).toThrow();
  });
});

describe('hexToBytes / bytesToHex', () => {
  it('容忍 0x 前缀、空格与大小写', () => {
    expect(hexToBytes('0xAB cd')).toEqual([0xab, 0xcd]);
  });

  it('奇数长度与非法字符抛错', () => {
    expect(() => hexToBytes('abc')).toThrow();
    expect(() => hexToBytes('zz')).toThrow();
  });

  it('互逆', () => {
    const bytes = [0, 1, 9, 15, 16, 255];
    expect(hexToBytes(bytesToHex(bytes))).toEqual(bytes);
  });
});

describe('interpretSegwit', () => {
  it('识别主网 P2WPKH', () => {
    const info = interpretSegwit(
      decodeBech32('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'),
    );
    expect(info?.scriptType).toBe('P2WPKH');
    expect(info?.witnessVersion).toBe(0);
    expect(info?.network).toContain('主网');
    expect(info?.programHex).toBe('751e76e8199196d454941c45d1b3a323f1433bd6');
  });

  it('识别主网 P2WSH', () => {
    const info = interpretSegwit(
      decodeBech32(
        'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
      ),
    );
    expect(info?.scriptType).toBe('P2WSH');
    expect(info?.network).toContain('testnet');
  });

  it('识别主网 P2TR（Taproot）', () => {
    const info = interpretSegwit(
      decodeBech32('bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0'),
    );
    expect(info?.scriptType).toBe('P2TR');
    expect(info?.witnessVersion).toBe(1);
    expect(info?.programHex).toBe(
      '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    );
  });

  it('识别测试网 P2TR', () => {
    const info = interpretSegwit(
      decodeBech32('tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c'),
    );
    expect(info?.scriptType).toBe('P2TR');
  });

  it('未来版本（v2/v16）可解读但不强行命名', () => {
    // BC1SW50QGDZ25J 是 v16、2 字节 program
    const info = interpretSegwit(decodeBech32('BC1SW50QGDZ25J'));
    expect(info?.witnessVersion).toBe(16);
    expect(info?.scriptType).toBeNull();
    expect(info?.programHex).toBe('751e');
  });

  it('非已知网络返回 null', () => {
    const fiveBit = [0].concat(
      convertBits(hexToBytes('0011223344556677889900112233445566778899'), 8, 5, true),
    );
    const info = interpretSegwit({ hrp: 'xyz', data: fiveBit, checksumType: 'bech32' });
    expect(info).toBeNull();
  });

  it('v0 使用 bech32m 常量时报错', () => {
    const fiveBit = [0].concat(
      convertBits(hexToBytes('0011223344556677889900112233445566778899'), 8, 5, true),
    );
    expect(() =>
      interpretSegwit({ hrp: 'bc', data: fiveBit, checksumType: 'bech32m' }),
    ).toThrow(/Bech32/);
  });

  it('官方 INVALID SegWit 地址全部在解读阶段被拒绝（抛错或非 SegWit 网络）', () => {
    for (const address of SEGWIT_INVALID) {
      let rejected = false;
      try {
        // 非已知 HRP 时 interpretSegwit 返回 null，同样视为拒绝
        if (interpretSegwit(decodeBech32(address)) === null) {
          rejected = true;
        }
      } catch {
        rejected = true;
      }
      expect(rejected, `应当判定为非法：${address}`).toBe(true);
    }
  });
});

describe('字符集常量', () => {
  it('恰好 32 个唯一字符', () => {
    expect(new Set(BECH32_CHARSET.split('')).size).toBe(32);
  });
});

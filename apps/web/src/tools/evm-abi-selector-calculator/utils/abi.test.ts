import { describe, expect, it } from 'vitest';
import {
  abiInputToTypeText,
  canonicalizeSignature,
  computeSignature,
  matchSelector,
  normalizeSelectorInput,
  normalizeType,
  parseAbiJson,
} from './abi';
import { keccak256Hex } from './keccak256';
import { DEFAULT_ABI_JSON } from '../constants';

describe('keccak-256 固定向量', () => {
  it('空输入摘要为 c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470', () => {
    expect(keccak256Hex('')).toBe(
      'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
    );
  });

  it('abc 摘要为 4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45', () => {
    expect(keccak256Hex('abc')).toBe(
      '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
    );
  });
});

describe('canonicalizeSignature 规范化规则', () => {
  it('带参数名与空格的签名规范化为无空格 canonical 形式', () => {
    expect(canonicalizeSignature('transfer(address from, uint256 amount)')).toBe(
      'transfer(address,uint256)',
    );
  });

  it('已是规范形式幂等', () => {
    expect(canonicalizeSignature('transfer(address,uint256)')).toBe(
      'transfer(address,uint256)',
    );
  });

  it('剔除 memory / calldata / storage 位置关键字', () => {
    expect(canonicalizeSignature('f(uint256[] memory, bytes calldata, string storage)')).toBe(
      'f(uint256[],bytes,string)',
    );
  });

  it('tuple 递归展开并保留数组后缀', () => {
    expect(
      canonicalizeSignature('f((uint256 a, address b) pair, bytes data)'),
    ).toBe('f((uint256,address),bytes)');
    expect(canonicalizeSignature('f((uint256,address)[], uint256[3])')).toBe(
      'f((uint256,address)[],uint256[3])',
    );
  });

  it('struct 关键字形式展开为 tuple', () => {
    expect(
      canonicalizeSignature('f(struct Point(uint256 x, uint256 y)[] memory points)'),
    ).toBe('f((uint256,uint256)[])');
  });

  it('无参数函数', () => {
    expect(canonicalizeSignature('totalSupply()')).toBe('totalSupply()');
  });

  it('错误分支：空签名 / 无括号 / 名称非法', () => {
    expect(() => canonicalizeSignature('')).toThrow();
    expect(() => canonicalizeSignature('transfer')).toThrow();
    expect(() => canonicalizeSignature('123abc()')).toThrow();
    expect(() => canonicalizeSignature('f(uint256 a')).toThrow();
  });
});

describe('normalizeType 单元规则', () => {
  it('基础类型去参数名', () => {
    expect(normalizeType('uint256 amount')).toBe('uint256');
  });

  it('多维数组后缀保留', () => {
    expect(normalizeType('bytes32[]  merkleProof')).toBe('bytes32[]');
    expect(normalizeType('uint256[3][5] grid')).toBe('uint256[3][5]');
  });

  it('括号不匹配报错', () => {
    expect(() => normalizeType('(uint256, address')).toThrow();
  });
});

describe('computeSignature 选择器与 Topic0 固定向量', () => {
  it('transfer(address,uint256) selector = 0xa9059cbb，全摘要同前缀', () => {
    const result = computeSignature('transfer(address,uint256)', 'function');
    expect(result.selector).toBe('0xa9059cbb');
    expect(result.hash32.startsWith('0xa9059cbb')).toBe(true);
    expect(result.topic0).toBeNull();
  });

  it('带参数名版本与规范版本 selector 完全一致', () => {
    const a = computeSignature('transfer(address,uint256)', 'function');
    const b = computeSignature('transfer(address from, uint256 amount)', 'function');
    expect(b.selector).toBe(a.selector);
    expect(b.canonicalSignature).toBe('transfer(address,uint256)');
  });

  it('Transfer 事件 Topic0 为完整 32 字节权威向量', () => {
    const result = computeSignature('Transfer(address,address,uint256)', 'event');
    expect(result.topic0).toBe(
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    );
    expect(result.selector).toBeNull();
  });

  it('自定义 error 同函数规则取前 4 字节', () => {
    const result = computeSignature('InsufficientBalance(uint256,uint256)', 'error');
    expect(result.selector).toMatch(/^0x[0-9a-f]{8}$/);
    expect(result.kind).toBe('error');
    // error selector 与同签名 function 计算结果一致
    const asFunction = computeSignature('InsufficientBalance(uint256,uint256)', 'function');
    expect(result.selector).toBe(asFunction.selector);
  });

  it('tuple 签名结果稳定（重复计算一致）', () => {
    const first = computeSignature('f((uint256,address),bytes)', 'function');
    const second = computeSignature('f( (uint256 ,address ) , bytes )', 'function');
    expect(first.selector).toBe(second.selector);
    expect(first.canonicalSignature).toBe('f((uint256,address),bytes)');
  });
});

describe('parseAbiJson 批量模式', () => {
  it('样例 ABI：1 event + 2 function 共 3 行，constructor 被排除', () => {
    const rows = parseAbiJson(DEFAULT_ABI_JSON);
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.abiType)).toEqual(['event', 'function', 'function']);
  });

  it('Transfer 行的 Topic0 与 transfer 行的 selector 为权威向量', () => {
    const rows = parseAbiJson(DEFAULT_ABI_JSON);
    expect(rows[0]!.topic0).toBe(
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    );
    expect(rows[1]!.selector).toBe('0xa9059cbb');
    expect(rows[1]!.canonicalSignature).toBe('transfer(address,uint256)');
    expect(rows[2]!.canonicalSignature).toBe('balanceOf(address)');
  });

  it('tuple components 被正确展开', () => {
    const abi = JSON.stringify([
      {
        type: 'function',
        name: 'swap',
        inputs: [
          {
            name: 'order',
            type: 'tuple',
            components: [
              { name: 'maker', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
          { name: 'data', type: 'bytes' },
        ],
      },
    ]);
    const rows = parseAbiJson(abi);
    expect(rows[0]!.canonicalSignature).toBe('swap((address,uint256),bytes)');
  });

  it('tuple[] 组件保留数组后缀', () => {
    const abi = JSON.stringify([
      {
        type: 'function',
        name: 'batch',
        inputs: [
          {
            name: 'orders',
            type: 'tuple[]',
            components: [
              { name: 'maker', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
        ],
      },
    ]);
    const rows = parseAbiJson(abi);
    expect(rows[0]!.canonicalSignature).toBe('batch((address,uint256)[])');
  });

  it('receive / fallback 给出说明行且无 selector', () => {
    const abi = JSON.stringify([
      { type: 'receive', stateMutability: 'payable' },
      { type: 'fallback', stateMutability: 'payable' },
    ]);
    const rows = parseAbiJson(abi);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.selector).toBeNull();
    expect(rows[0]!.note).toContain('receive');
    expect(rows[1]!.note).toContain('fallback');
  });

  it('非法 JSON 与非数组输入抛错', () => {
    expect(() => parseAbiJson('{not json')).toThrow();
    expect(() => parseAbiJson('{"type":"function"}')).toThrow();
  });
});

describe('selector 反向匹配', () => {
  it('0xa9059cbb 匹配回 transfer(address,uint256)', () => {
    const rows = parseAbiJson(DEFAULT_ABI_JSON);
    const hit = matchSelector(rows, '0xa9059cbb');
    expect(hit?.canonicalSignature).toBe('transfer(address,uint256)');
  });

  it('无 0x 前缀与大写输入也可规范化匹配', () => {
    const rows = parseAbiJson(DEFAULT_ABI_JSON);
    expect(matchSelector(rows, 'A9059CBB')?.canonicalSignature).toBe(
      'transfer(address,uint256)',
    );
  });

  it('非法长度返回 null，未命中返回 null', () => {
    const rows = parseAbiJson(DEFAULT_ABI_JSON);
    expect(normalizeSelectorInput('0x123')).toBeNull();
    expect(normalizeSelectorInput('0xzzzzzzzz')).toBeNull();
    expect(matchSelector(rows, '0xdeadbeef')).toBeNull();
  });
});

describe('abiInputToTypeText 内部转换', () => {
  it('普通类型直通', () => {
    expect(abiInputToTypeText({ type: 'address' })).toBe('address');
  });

  it('缺 type 字段抛错', () => {
    expect(() => abiInputToTypeText({})).toThrow();
  });
});

import { describe, expect, it } from 'vitest';
import {
  STORAGE_BITS,
  buildLayouts,
  packValues,
  parseFieldDefinitions,
  toBinary,
  toHex,
  unpackValue,
  type BitField,
  type FieldLayout,
} from './bitfield';

/** 经典字段集：flag:1 / mode:3 / addr:12，共 16 位 */
const CLASSIC_FIELDS: BitField[] = [
  { name: 'flag', width: 1 },
  { name: 'mode', width: 3 },
  { name: 'addr', width: 12 },
];

/** 经典字段定义文本（含注释、空行与 lsb-first 指令） */
const CLASSIC_DEFINITION = [
  '# @order lsb-first',
  '# 控制标志',
  '',
  'flag:1',
  'mode:3',
  'addr:12',
].join('\n');

describe('parseFieldDefinitions - 正常解析', () => {
  it('解析经典定义：注释与空行被忽略、order 指令识别为 lsb-first、三个字段顺序与位宽正确', () => {
    const parsed = parseFieldDefinitions(CLASSIC_DEFINITION);
    expect(parsed.errors).toEqual([]);
    expect(parsed.order).toBe('lsb-first');
    expect(parsed.fields).toEqual(CLASSIC_FIELDS);
  });

  it('无 order 指令时 order 为 null，普通 # 注释不影响解析', () => {
    const parsed = parseFieldDefinitions('# 仅注释\nflag:1\n# 另一条注释');
    expect(parsed.errors).toEqual([]);
    expect(parsed.order).toBeNull();
    expect(parsed.fields).toEqual([{ name: 'flag', width: 1 }]);
  });

  it('识别 # @order msb-first 指令（指令两侧多余空白容忍）', () => {
    const parsed = parseFieldDefinitions('#   @order   msb-first  \na:4\nb:4');
    expect(parsed.errors).toEqual([]);
    expect(parsed.order).toBe('msb-first');
    expect(parsed.fields).toHaveLength(2);
  });

  it('允许下划线开头的合法字段名，位宽 64 为合法上限', () => {
    const parsed = parseFieldDefinitions('_a:1\nb2:64');
    expect(parsed.errors).toEqual([]);
    expect(parsed.fields[0]?.name).toBe('_a');
    expect(parsed.fields[1]?.width).toBe(64);
  });

  it('字段行冒号两侧空白被裁剪', () => {
    const parsed = parseFieldDefinitions('  flag :  1  ');
    expect(parsed.errors).toEqual([]);
    expect(parsed.fields).toEqual([{ name: 'flag', width: 1 }]);
  });
});

describe('parseFieldDefinitions - 错误场景', () => {
  it('非法字段名（数字开头）报错', () => {
    const parsed = parseFieldDefinitions('1flag:1');
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.fields).toEqual([]);
  });

  it('位宽为 0 报错', () => {
    const parsed = parseFieldDefinitions('flag:0');
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0]).toContain('1-64');
  });

  it('位宽 65 超出上限报错', () => {
    const parsed = parseFieldDefinitions('flag:65');
    expect(parsed.errors).toHaveLength(1);
  });

  it('位宽非正整数（负数/小数/字母）报错', () => {
    expect(parseFieldDefinitions('flag:-1').errors).toHaveLength(1);
    expect(parseFieldDefinitions('flag:1.5').errors).toHaveLength(1);
    expect(parseFieldDefinitions('flag:abc').errors).toHaveLength(1);
  });

  it('重名字段报错且第二个字段不进入列表', () => {
    const parsed = parseFieldDefinitions('flag:1\nflag:2');
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.fields).toEqual([{ name: 'flag', width: 1 }]);
  });

  it('缺少冒号的畸形行报错', () => {
    const parsed = parseFieldDefinitions('flag-1');
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0]).toContain('格式非法');
  });

  it('字段数超过 64 个上限报错', () => {
    const text = Array.from({ length: 65 }, (_, index) => `f${index}:1`).join('\n');
    const parsed = parseFieldDefinitions(text);
    expect(parsed.fields).toHaveLength(65);
    expect(parsed.errors.some((error) => error.includes('字段数量'))).toBe(true);
  });
});

describe('buildLayouts - lsb-first 经典向量', () => {
  it('flag offset0 mask0x1、mode offset1 mask0xE、addr offset4 mask0xFFF0', () => {
    const { layouts, errors } = buildLayouts(CLASSIC_FIELDS, 'lsb-first', 'uint16');
    expect(errors).toEqual([]);
    expect(layouts).toEqual<FieldLayout[]>([
      { name: 'flag', width: 1, offset: 0, mask: '0x1' },
      { name: 'mode', width: 3, offset: 1, mask: '0xE' },
      { name: 'addr', width: 12, offset: 4, mask: '0xFFF0' },
    ]);
  });

  it('未占满存储单元时高位保留：8 位字段放入 uint16 不报错', () => {
    const { layouts, errors } = buildLayouts(
      [{ name: 'lo', width: 8 }],
      'lsb-first',
      'uint16',
    );
    expect(errors).toEqual([]);
    expect(layouts[0]?.offset).toBe(0);
    expect(layouts[0]?.mask).toBe('0xFF');
  });
});

describe('buildLayouts - msb-first', () => {
  it('同字段集 msb-first：flag 在 offset15、mode offset12、addr offset0', () => {
    const { layouts, errors } = buildLayouts(CLASSIC_FIELDS, 'msb-first', 'uint16');
    expect(errors).toEqual([]);
    expect(layouts.map((item) => item.offset)).toEqual([15, 12, 0]);
    expect(layouts[0]?.mask).toBe('0x8000');
    expect(layouts[1]?.mask).toBe('0x7000');
    expect(layouts[2]?.mask).toBe('0xFFF');
  });

  it('uint8 塞入总宽 9 位报布局溢出，超宽字段不进入布局表', () => {
    const { layouts, errors } = buildLayouts(
      [
        { name: 'a', width: 4 },
        { name: 'b', width: 5 },
      ],
      'lsb-first',
      'uint8',
    );
    expect(layouts).toHaveLength(1);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.includes('布局溢出'))).toBe(true);
  });

  it('msb-first 下字段宽于剩余高位时报错且保留已布局字段', () => {
    const { layouts, errors } = buildLayouts(
      [
        { name: 'a', width: 6 },
        { name: 'b', width: 3 },
      ],
      'msb-first',
      'uint8',
    );
    expect(layouts).toEqual([
      { name: 'a', width: 6, offset: 2, mask: '0xFC' },
    ]);
    expect(errors.some((error) => error.includes('无法放入'))).toBe(true);
  });

  it('width=64 单字段掩码为 2^64-1（BigInt 安全）', () => {
    const { layouts, errors } = buildLayouts(
      [{ name: 'all', width: 64 }],
      'lsb-first',
      'uint64',
    );
    expect(errors).toEqual([]);
    expect(layouts[0]?.offset).toBe(0);
    expect(layouts[0]?.mask).toBe(
      `0x${(BigInt(2) ** BigInt(64) - BigInt(1)).toString(16).toUpperCase()}`,
    );
  });
});

describe('packValues - 经典 lsb-first 向量', () => {
  const { layouts } = buildLayouts(CLASSIC_FIELDS, 'lsb-first', 'uint16');

  it('flag=1、mode=5、addr=0x123 打包为 0x123B，binary 补零 16 位，decimal=4667', () => {
    const { result, errors } = packValues(
      CLASSIC_FIELDS,
      layouts,
      ['flag=1', 'mode=5', 'addr=0x123'].join('\n'),
      'lsb-first',
      'uint16',
    );
    expect(errors).toEqual([]);
    expect(result?.hex).toBe('0x123B');
    expect(result?.binary).toBe('0001001000111011');
    expect(result?.decimal).toBe('4667');
    expect(result?.layouts).toHaveLength(3);
  });

  it('支持 0X 大写前缀与十进制等值输入', () => {
    const { result, errors } = packValues(
      CLASSIC_FIELDS,
      layouts,
      ['flag=1', 'mode=0X5', 'addr=291'].join('\n'),
      'lsb-first',
      'uint16',
    );
    expect(errors).toEqual([]);
    expect(result?.hex).toBe('0x123B');
  });

  it('1 位字段赋值 2 报溢出错误，错误含字段名、实际值与允许范围', () => {
    const { result, errors } = packValues(
      CLASSIC_FIELDS,
      layouts,
      ['flag=2', 'mode=5', 'addr=0x123'].join('\n'),
      'lsb-first',
      'uint16',
    );
    expect(result).toBeUndefined();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('flag');
    expect(errors[0]).toContain('2');
    expect(errors[0]).toContain('0 ~ 1');
  });

  it('addr 赋 0x1000（超出 12 位）报溢出，允许范围 0 ~ 4095', () => {
    const { result, errors } = packValues(
      CLASSIC_FIELDS,
      layouts,
      ['flag=0', 'mode=0', 'addr=0x1000'].join('\n'),
      'lsb-first',
      'uint16',
    );
    expect(result).toBeUndefined();
    expect(errors[0]).toContain('addr');
    expect(errors[0]).toContain('0 ~ 4095');
  });

  it('缺少字段赋值报错', () => {
    const { result, errors } = packValues(
      CLASSIC_FIELDS,
      layouts,
      'flag=1\nmode=5',
      'lsb-first',
      'uint16',
    );
    expect(result).toBeUndefined();
    expect(errors.some((error) => error.includes('addr') && error.includes('缺少赋值'))).toBe(true);
  });

  it('未知字段赋值报错', () => {
    const { result, errors } = packValues(
      CLASSIC_FIELDS,
      layouts,
      'flag=1\nmode=5\naddr=0\nother=9',
      'lsb-first',
      'uint16',
    );
    expect(result).toBeUndefined();
    expect(errors.some((error) => error.includes('未知字段') && error.includes('other'))).toBe(true);
  });

  it('重复赋值与畸形行、非法数字分别报错', () => {
    expect(
      packValues(CLASSIC_FIELDS, layouts, 'flag=1\nflag=0\nmode=0\naddr=0', 'lsb-first', 'uint16')
        .errors.some((error) => error.includes('重复赋值')),
    ).toBe(true);
    expect(
      packValues(CLASSIC_FIELDS, layouts, 'flag-1\nmode=0\naddr=0', 'lsb-first', 'uint16')
        .errors.some((error) => error.includes('格式非法')),
    ).toBe(true);
    expect(
      packValues(CLASSIC_FIELDS, layouts, 'flag=1\nmode=x\naddr=0', 'lsb-first', 'uint16')
        .errors.some((error) => error.includes('不是合法')),
    ).toBe(true);
  });

  it('布局超宽时 pack 直接失败且不返回结果', () => {
    const wideFields: BitField[] = [
      { name: 'a', width: 4 },
      { name: 'b', width: 5 },
    ];
    const { layouts: wideLayouts } = buildLayouts(wideFields, 'lsb-first', 'uint8');
    const { result, errors } = packValues(
      wideFields,
      wideLayouts,
      'a=1\nb=1',
      'lsb-first',
      'uint8',
    );
    expect(result).toBeUndefined();
    expect(errors.some((error) => error.includes('布局溢出'))).toBe(true);
  });
});

describe('packValues - 多存储宽度与 msb-first', () => {
  it('uint32 全宽单字段 width=32：0xDEADBEEF 打包为补零 8 位 hex 与 32 位 binary', () => {
    const { layouts } = buildLayouts([{ name: 'word', width: 32 }], 'lsb-first', 'uint32');
    const { result, errors } = packValues(
      [{ name: 'word', width: 32 }],
      layouts,
      'word=0xDEADBEEF',
      'lsb-first',
      'uint32',
    );
    expect(errors).toEqual([]);
    expect(result?.hex).toBe('0xDEADBEEF');
    expect(result?.binary).toHaveLength(32);
    expect(result?.decimal).toBe('3735928559');
  });

  it('uint8 单字段值 10 打包为补零两位 0x0A', () => {
    const { layouts } = buildLayouts([{ name: 'byte', width: 8 }], 'lsb-first', 'uint8');
    const { result, errors } = packValues(
      [{ name: 'byte', width: 8 }],
      layouts,
      'byte=10',
      'lsb-first',
      'uint8',
    );
    expect(errors).toEqual([]);
    expect(result?.hex).toBe('0x0A');
    expect(result?.binary).toBe('00001010');
  });

  it('msb-first 经典字段：flag=1、mode=5、addr=0x123 打包为 0xD123', () => {
    const { layouts, errors: layoutErrors } = buildLayouts(
      CLASSIC_FIELDS,
      'msb-first',
      'uint16',
    );
    expect(layoutErrors).toEqual([]);
    const { result, errors } = packValues(
      CLASSIC_FIELDS,
      layouts,
      ['flag=1', 'mode=5', 'addr=0x123'].join('\n'),
      'msb-first',
      'uint16',
    );
    // flag(1)<<15 | mode(5)<<12 | addr(0x123)<<0 = 0x8000 | 0x5000 | 0x0123
    expect(errors).toEqual([]);
    expect(result?.hex).toBe('0xD123');
    expect(result?.binary).toBe('1101000100100011');
  });
});

describe('unpackValue - 双向一致性', () => {
  it('lsb-first 解包 0x123B 还原 flag=1、mode=5、addr=291（hex 0x123）', () => {
    const { layouts } = buildLayouts(CLASSIC_FIELDS, 'lsb-first', 'uint16');
    const { result, errors } = unpackValue(CLASSIC_FIELDS, layouts, '0x123B', 'uint16');
    expect(errors).toEqual([]);
    expect(result?.map((item) => [item.name, item.value, item.hex])).toEqual([
      ['flag', '1', '0x1'],
      ['mode', '5', '0x5'],
      ['addr', '291', '0x123'],
    ]);
  });

  it('lsb-first pack → unpack 往返还原全部原始赋值', () => {
    const { layouts } = buildLayouts(CLASSIC_FIELDS, 'lsb-first', 'uint16');
    const values = ['flag=1', 'mode=5', 'addr=0x123'].join('\n');
    const packed = packValues(CLASSIC_FIELDS, layouts, values, 'lsb-first', 'uint16');
    const unpacked = unpackValue(
      CLASSIC_FIELDS,
      layouts,
      packed.result?.hex ?? '',
      'uint16',
    );
    expect(unpacked.errors).toEqual([]);
    expect(unpacked.result?.map((item) => `${item.name}=${item.value}`)).toEqual([
      'flag=1',
      'mode=5',
      'addr=291',
    ]);
  });

  it('msb-first 解包 0xD123 还原 flag=1、mode=5、addr=291', () => {
    const { layouts } = buildLayouts(CLASSIC_FIELDS, 'msb-first', 'uint16');
    const { result, errors } = unpackValue(CLASSIC_FIELDS, layouts, '0xD123', 'uint16');
    expect(errors).toEqual([]);
    expect(result?.[0]).toMatchObject({ name: 'flag', offset: 15, value: '1' });
    expect(result?.[1]).toMatchObject({ name: 'mode', offset: 12, value: '5' });
    expect(result?.[2]).toMatchObject({ name: 'addr', offset: 0, value: '291' });
  });

  it('msb-first pack → unpack 往返还原', () => {
    const { layouts } = buildLayouts(CLASSIC_FIELDS, 'msb-first', 'uint16');
    const packed = packValues(
      CLASSIC_FIELDS,
      layouts,
      'flag=1\nmode=5\naddr=0x123',
      'msb-first',
      'uint16',
    );
    const unpacked = unpackValue(CLASSIC_FIELDS, layouts, packed.result?.hex ?? '', 'uint16');
    expect(unpacked.result?.map((item) => item.value)).toEqual(['1', '5', '291']);
  });

  it('uint64 两个 32 位字段：高值 0x123456789ABCDEF0 打包/解包验证 64 位安全', () => {
    const fields64: BitField[] = [
      { name: 'low', width: 32 },
      { name: 'high', width: 32 },
    ];
    const { layouts, errors: layoutErrors } = buildLayouts(fields64, 'lsb-first', 'uint64');
    expect(layoutErrors).toEqual([]);
    const expected = BigInt('0x123456789ABCDEF0');
    const packed = packValues(
      fields64,
      layouts,
      ['low=0x9ABCDEF0', 'high=0x12345678'].join('\n'),
      'lsb-first',
      'uint64',
    );
    expect(packed.errors).toEqual([]);
    expect(packed.result?.hex).toBe('0x123456789ABCDEF0');
    expect(packed.result?.decimal).toBe(expected.toString(10));
    expect(packed.result?.binary).toHaveLength(64);

    const unpacked = unpackValue(fields64, layouts, packed.result?.hex ?? '', 'uint64');
    expect(unpacked.errors).toEqual([]);
    expect(unpacked.result?.[0]).toMatchObject({
      name: 'low',
      value: BigInt('0x9ABCDEF0').toString(10),
      hex: '0x9ABCDEF0',
    });
    expect(unpacked.result?.[1]).toMatchObject({
      name: 'high',
      value: BigInt('0x12345678').toString(10),
      hex: '0x12345678',
    });
  });

  it('uint64 十进制输入与 hex 输入等价（超 Number 安全整数仍精确）', () => {
    const { layouts } = buildLayouts([{ name: 'all', width: 64 }], 'lsb-first', 'uint64');
    const huge = BigInt('0xFFFFFFFFFFFFFFFF');
    const fromDecimal = unpackValue(
      [{ name: 'all', width: 64 }],
      layouts,
      huge.toString(10),
      'uint64',
    );
    const fromHex = unpackValue(
      [{ name: 'all', width: 64 }],
      layouts,
      '0xFFFFFFFFFFFFFFFF',
      'uint64',
    );
    expect(fromDecimal.result?.[0]?.value).toBe(huge.toString(10));
    expect(fromHex.result?.[0]?.value).toBe(huge.toString(10));
  });

  it('解包输入超过存储宽度报错', () => {
    const { layouts } = buildLayouts([{ name: 'byte', width: 8 }], 'lsb-first', 'uint8');
    const { result, errors } = unpackValue(
      [{ name: 'byte', width: 8 }],
      layouts,
      '0x100',
      'uint8',
    );
    expect(result).toBeUndefined();
    expect(errors.some((error) => error.includes('超过存储类型'))).toBe(true);
  });

  it('解包非法数字与空输入分别报错', () => {
    const { layouts } = buildLayouts([{ name: 'byte', width: 8 }], 'lsb-first', 'uint8');
    expect(
      unpackValue([{ name: 'byte', width: 8 }], layouts, '0xZZ', 'uint8').errors,
    ).toHaveLength(1);
    expect(
      unpackValue([{ name: 'byte', width: 8 }], layouts, '   ', 'uint8').errors[0],
    ).toContain('不能为空');
  });
});

describe('toHex / toBinary / STORAGE_BITS', () => {
  it('toHex 按字节宽度补零且大写', () => {
    expect(toHex(BigInt(10), 1)).toBe('0x0A');
    expect(toHex(BigInt(10), 2)).toBe('0x000A');
    expect(toHex(BigInt(0), 8)).toBe('0x0000000000000000');
  });

  it('toBinary 按位宽补零', () => {
    expect(toBinary(BigInt(1), 4)).toBe('0001');
    expect(toBinary(BigInt(0), 8)).toBe('00000000');
  });

  it('STORAGE_BITS 常量映射正确', () => {
    expect(STORAGE_BITS).toEqual({
      uint8: 8,
      uint16: 16,
      uint32: 32,
      uint64: 64,
    });
  });
});

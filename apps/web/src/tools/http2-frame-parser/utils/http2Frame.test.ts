import { describe, it, expect } from 'vitest';
import { parseHexInput, parseFrames, bytesToHex, SAMPLE_HEX, FRAME_TYPES } from './http2Frame';

/** 组装一帧：length/type/flags/streamId + payload */
function buildFrame(type: number, flags: number, streamId: number, payload: number[]): number[] {
  const length = payload.length;
  return [
    (length >> 16) & 0xff,
    (length >> 8) & 0xff,
    length & 0xff,
    type,
    flags,
    (streamId >> 24) & 0xff,
    (streamId >> 16) & 0xff,
    (streamId >> 8) & 0xff,
    streamId & 0xff,
    ...payload,
  ];
}

describe('parseHexInput 输入处理', () => {
  it('解析带空格与 0x 前缀的十六进制', () => {
    const { bytes, errors } = parseHexInput('0x00 0c 04\n00');
    expect(errors).toEqual([]);
    expect(bytes).toEqual([0x00, 0x0c, 0x04, 0x00]);
  });

  it('空输入报错', () => {
    expect(parseHexInput('   ').errors.length).toBeGreaterThan(0);
  });

  it('非法字符与奇数 nibble 报错', () => {
    expect(parseHexInput('0g').errors.length).toBeGreaterThan(0);
    expect(parseHexInput('abc').errors.length).toBeGreaterThan(0);
  });
});

describe('parseFrames 帧头解析', () => {
  it('解析 SETTINGS 帧的长度、类型、标志与流标识', () => {
    const settingsPayload = [0x00, 0x03, 0x00, 0x00, 0x00, 0x64]; // MAX_CONCURRENT_STREAMS=100
    const bytes = buildFrame(0x4, 0x0, 0x0, settingsPayload);
    const result = parseFrames(bytes);
    expect(result.errors).toEqual([]);
    expect(result.frames).toHaveLength(1);
    const frame = result.frames[0]!;
    expect(frame.length).toBe(6);
    expect(frame.typeName).toBe('SETTINGS');
    expect(frame.streamId).toBe(0);
    expect(frame.totalBytes).toBe(15);
    expect(frame.payloadSummary).toContain('MAX_CONCURRENT_STREAMS=100');
  });

  it('解析 WINDOW_UPDATE 增量并要求流标识 0 规则不触发误报', () => {
    const bytes = buildFrame(0x8, 0x0, 0x0, [0x00, 0x00, 0x10, 0x00]);
    const result = parseFrames(bytes);
    const frame = result.frames[0]!;
    expect(frame.typeName).toBe('WINDOW_UPDATE');
    expect(frame.payloadSummary).toBe('Window Size Increment=4096');
    expect(frame.warnings).toEqual([]);
  });

  it('PING ACK 标志识别', () => {
    const opaque = [1, 2, 3, 4, 5, 6, 7, 8];
    const bytes = buildFrame(0x6, 0x1, 0x0, opaque);
    const frame = parseFrames(bytes).frames[0]!;
    expect(frame.flagNames).toEqual(['ACK']);
    expect(frame.payloadSummary).toContain('01 02 03 04');
  });

  it('GOAWAY 解析最后流标识与错误码', () => {
    const payload = [0x00, 0x00, 0x00, 0x05, 0x00, 0x00, 0x00, 0x01]; // last=5, PROTOCOL_ERROR
    const bytes = buildFrame(0x7, 0x0, 0x0, payload);
    const frame = parseFrames(bytes).frames[0]!;
    expect(frame.payloadSummary).toContain('Last-Stream-ID=5');
    expect(frame.payloadSummary).toContain('PROTOCOL_ERROR');
  });

  it('RST_STREAM 解析错误码', () => {
    const bytes = buildFrame(0x3, 0x0, 0x9, [0x00, 0x00, 0x00, 0x8]); // CANCEL on stream 9
    const frame = parseFrames(bytes).frames[0]!;
    expect(frame.streamId).toBe(9);
    expect(frame.payloadSummary).toContain('CANCEL');
  });

  it('HEADERS 帧不做 HPACK 解压并展示 END_HEADERS 标志', () => {
    const hpack = [0x82, 0x86, 0x84];
    const bytes = buildFrame(0x1, 0x4, 0x1, hpack);
    const frame = parseFrames(bytes).frames[0]!;
    expect(frame.typeName).toBe('HEADERS');
    expect(frame.flagNames).toEqual(['END_HEADERS']);
    expect(frame.payloadSummary).toContain('HPACK');
  });
});

describe('parseFrames 规则校验与异常', () => {
  it('连接级帧携带非零流标识时告警', () => {
    const bytes = buildFrame(0x6, 0x1, 0x3, [0, 0, 0, 0, 0, 0, 0, 0]);
    const frame = parseFrames(bytes).frames[0]!;
    expect(frame.warnings.some((w) => w.includes('连接级帧'))).toBe(true);
  });

  it('SETTINGS 载荷非 6 字节倍数告警', () => {
    const bytes = buildFrame(0x4, 0x0, 0x0, [0x00, 0x01, 0x00]);
    const frame = parseFrames(bytes).frames[0]!;
    expect(frame.warnings.some((w) => w.includes('6 字节倍数'))).toBe(true);
  });

  it('SETTINGS ACK 带载荷告警', () => {
    const bytes = buildFrame(0x4, 0x1, 0x0, [0x00, 0x01, 0x00, 0x00, 0x00, 0x00]);
    const frame = parseFrames(bytes).frames[0]!;
    expect(frame.warnings.some((w) => w.includes('ACK'))).toBe(true);
  });

  it('WINDOW_UPDATE 长度不为 4 告警', () => {
    const bytes = buildFrame(0x8, 0x0, 0x0, [0x00, 0x01]);
    const frame = parseFrames(bytes).frames[0]!;
    expect(frame.warnings.some((w) => w.includes('4 字节'))).toBe(true);
  });

  it('保留位 R 非 0 告警', () => {
    const header = [0x00, 0x00, 0x00, 0x0, 0x0, 0x80, 0x00, 0x00, 0x01]; // R=1, stream=1
    const frame = parseFrames(header).frames[0]!;
    expect(frame.reservedBit).toBe(1);
    expect(frame.warnings.some((w) => w.includes('保留位'))).toBe(true);
  });

  it('截断帧报告错误且不产生半截帧', () => {
    const good = buildFrame(0x6, 0x0, 0x0, [1, 2, 3, 4, 5, 6, 7, 8]);
    const truncatedHeader = [0x00, 0x10, 0x00, 0x0, 0x0, 0x00, 0x00, 0x00, 0x00, 0xaa];
    const result = parseFrames([...good, ...truncatedHeader]);
    expect(result.frames).toHaveLength(1);
    expect(result.errors.some((e) => e.includes('截断'))).toBe(true);
    expect(result.trailingBytes).toBeGreaterThan(0);
  });

  it('不足 9 字节的残余数据报错', () => {
    const result = parseFrames([0x00, 0x00, 0x01]);
    expect(result.frames).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('超过默认 MAX_FRAME_SIZE 告警', () => {
    const payload = new Array(16385).fill(0);
    const bytes = buildFrame(0x0, 0x0, 0x1, payload);
    const frame = parseFrames(bytes).frames[0]!;
    expect(frame.warnings.some((w) => w.includes('MAX_FRAME_SIZE'))).toBe(true);
  });

  it('未知帧类型保留为 UNKNOWN 且不中断序列', () => {
    const bytes = buildFrame(0xff, 0x0, 0x0, [0xaa]);
    const frame = parseFrames(bytes).frames[0]!;
    expect(frame.typeName).toContain('UNKNOWN');
    expect(FRAME_TYPES[0xff]).toBeUndefined();
  });

  it('连续多帧序号与偏移正确', () => {
    const a = buildFrame(0x8, 0x0, 0x0, [0x00, 0x00, 0x00, 0x10]);
    const b = buildFrame(0x6, 0x1, 0x0, [0, 0, 0, 0, 0, 0, 0, 0]);
    const result = parseFrames([...a, ...b]);
    expect(result.frames).toHaveLength(2);
    expect(result.frames[0]!.index).toBe(0);
    expect(result.frames[0]!.offset).toBe(0);
    expect(result.frames[1]!.index).toBe(1);
    expect(result.frames[1]!.offset).toBe(13);
    expect(result.consumedBytes).toBe(13 + 17);
  });
});

describe('内置样例与工具函数', () => {
  it('SAMPLE_HEX 解析出 SETTINGS / WINDOW_UPDATE / PING 三帧', () => {
    const { bytes, errors } = parseHexInput(SAMPLE_HEX);
    expect(errors).toEqual([]);
    const result = parseFrames(bytes);
    expect(result.errors).toEqual([]);
    expect(result.frames.map((f) => f.typeName)).toEqual(['SETTINGS', 'WINDOW_UPDATE', 'PING']);
  });

  it('bytesToHex 两位补零', () => {
    expect(bytesToHex([0x0, 0xff, 0xa])).toBe('00 ff 0a');
  });
});

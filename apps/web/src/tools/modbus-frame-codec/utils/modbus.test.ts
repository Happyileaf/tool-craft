import { describe, expect, it } from 'vitest';
import { buildModbusFrame, bytesToHex, crc16Modbus, hexToBytes, parseModbusFrame } from './modbus';
import { DEFAULT_RTU_HEX, DEFAULT_TCP_HEX } from '../constants';

describe('crc16Modbus', () => {
  it('matches the well-known 01 03 00 00 00 0A vector', () => {
    expect(crc16Modbus([0x01, 0x03, 0x00, 0x00, 0x00, 0x0a])).toBe(0xcdc5);
  });

  it('returns 0xFFFF for empty input', () => {
    expect(crc16Modbus([])).toBe(0xffff);
  });
});

describe('hexToBytes / bytesToHex', () => {
  it('parses spaced hex and rejects invalid text', () => {
    expect(hexToBytes('01 03:00-00,00 0A')).toEqual([1, 3, 0, 0, 0, 0x0a]);
    expect(() => hexToBytes('')).toThrow('请输入十六进制报文数据');
    expect(() => hexToBytes('zz')).toThrow('非法');
    expect(() => hexToBytes('abc')).toThrow('偶数');
  });

  it('formats bytes as uppercase spaced hex', () => {
    expect(bytesToHex([0x01, 0xab])).toBe('01 AB');
  });
});

describe('parseModbusFrame RTU', () => {
  it('parses the default RTU read-holding-registers request', () => {
    const frame = parseModbusFrame(DEFAULT_RTU_HEX);
    expect(frame.mode).toBe('rtu');
    expect(frame.unitId).toBe(1);
    expect(frame.functionCode).toBe(0x03);
    expect(frame.functionName).toContain('读保持寄存器');
    expect(frame.isException).toBe(false);
    expect(frame.crc).toBe(0xcdc5);
    expect(frame.crcReceived).toBe(0xcdc5);
    expect(frame.crcValid).toBe(true);
    expect(frame.transactionId).toBeNull();
    expect(frame.byteLength).toBe(8);
    expect(frame.dataHex).toBe('00 00 00 0A');
    expect(frame.fields).toEqual([
      { label: '起始地址', value: '0（0x0000）' },
      { label: '数量', value: '10' },
    ]);
  });

  it('flags a corrupted CRC', () => {
    const frame = parseModbusFrame('01 03 00 00 00 0A C6 CD');
    expect(frame.crcValid).toBe(false);
    expect(frame.crc).toBe(0xcdc5);
    expect(frame.crcReceived).toBe(0xcdc6);
  });

  it('decodes a write-single-coil request', () => {
    const payload = [0x01, 0x05, 0x00, 0x10, 0xff, 0x00];
    const crc = crc16Modbus(payload);
    const frame = parseModbusFrame(bytesToHex([...payload, crc & 0xff, crc >> 8]));
    expect(frame.functionName).toContain('写单个线圈');
    expect(frame.fields).toEqual([
      { label: '寄存器地址', value: '16（0x0010）' },
      { label: '线圈状态', value: '0xFF00（ON）' },
    ]);
  });

  it('decodes an exception response', () => {
    const payload = [0x01, 0x83, 0x02];
    const crc = crc16Modbus(payload);
    const frame = parseModbusFrame(bytesToHex([...payload, crc & 0xff, crc >> 8]));
    expect(frame.isException).toBe(true);
    expect(frame.functionCode).toBe(0x83);
    expect(frame.functionName).toContain('读保持寄存器');
    expect(frame.exceptionCode).toBe(2);
    expect(frame.exceptionName).toBe('Illegal Data Address / 非法数据地址');
    expect(frame.crcValid).toBe(true);
    expect(frame.fields[0]).toEqual({
      label: '异常码',
      value: '2（Illegal Data Address / 非法数据地址）',
    });
  });

  it('rejects frames shorter than four bytes', () => {
    expect(() => parseModbusFrame('01 03 C5')).toThrow('至少需要 4 字节');
  });
});

describe('parseModbusFrame TCP', () => {
  it('auto-detects and parses the default TCP request', () => {
    const frame = parseModbusFrame(DEFAULT_TCP_HEX);
    expect(frame.mode).toBe('tcp');
    expect(frame.transactionId).toBe(1);
    expect(frame.protocolId).toBe(0);
    expect(frame.mbapLength).toBe(6);
    expect(frame.unitId).toBe(1);
    expect(frame.functionCode).toBe(0x03);
    expect(frame.crc).toBeNull();
    expect(frame.crcValid).toBeNull();
    expect(frame.byteLength).toBe(12);
    expect(frame.fields).toEqual([
      { label: '起始地址', value: '0（0x0000）' },
      { label: '数量', value: '10' },
    ]);
  });

  it('does not mistake an RTU frame for TCP', () => {
    expect(parseModbusFrame(DEFAULT_RTU_HEX).mode).toBe('rtu');
  });
});

describe('buildModbusFrame', () => {
  it('appends the CRC low byte first for RTU', () => {
    const output = buildModbusFrame({
      mode: 'rtu',
      unitId: 1,
      functionCode: 0x03,
      dataHex: '00 00 00 0A',
      transactionId: 1,
    });
    expect(output.hex).toBe('01 03 00 00 00 0A C5 CD');
    expect(output.crc).toBe(0xcdc5);
    expect(output.mbapLength).toBeNull();
    expect(parseModbusFrame(output.hex).crcValid).toBe(true);
  });

  it('writes the MBAP header for TCP', () => {
    const output = buildModbusFrame({
      mode: 'tcp',
      unitId: 1,
      functionCode: 0x03,
      dataHex: '00 00 00 0A',
      transactionId: 1,
    });
    expect(output.hex).toBe('00 01 00 00 00 06 01 03 00 00 00 0A');
    expect(output.crc).toBeNull();
    expect(output.mbapLength).toBe(6);
  });

  it('validates unit id, function code and payload size', () => {
    expect(() =>
      buildModbusFrame({ mode: 'rtu', unitId: 256, functionCode: 3, dataHex: '00', transactionId: 0 }),
    ).toThrow('0–255');
    expect(() =>
      buildModbusFrame({ mode: 'rtu', unitId: 1, functionCode: 0, dataHex: '00', transactionId: 0 }),
    ).toThrow('1–127');
    expect(() =>
      buildModbusFrame({
        mode: 'tcp',
        unitId: 1,
        functionCode: 3,
        dataHex: '00'.repeat(254),
        transactionId: 0,
      }),
    ).toThrow('253');
  });
});

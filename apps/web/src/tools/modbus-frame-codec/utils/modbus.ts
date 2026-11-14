/**
 * Modbus RTU / TCP 报文解析与构造纯函数。
 *
 * RTU: 从站地址(1) + 功能码(1) + 数据(N) + CRC16(2，线上低字节在前)
 * TCP: MBAP(7) = 事务ID(2) + 协议ID(2，固定 0) + 长度(2) + 单元ID(1)，随后是 PDU
 */

export type ModbusMode = 'rtu' | 'tcp';

export interface ModbusField {
  label: string;
  value: string;
}

export interface ModbusFrame {
  mode: ModbusMode;
  /** RTU 为从站地址，TCP 为单元 ID */
  unitId: number;
  functionCode: number;
  /** 功能码对应的英文名称 */
  functionName: string;
  /** 是否为异常响应（功能码最高位被置 1） */
  isException: boolean;
  exceptionCode: number | null;
  exceptionName: string | null;
  /** 去除地址与 CRC 后的 PDU 数据字节 */
  data: number[];
  dataHex: string;
  /** RTU 校验和；TCP 为 null */
  crc: number | null;
  /** RTU CRC 是否校验通过；TCP 为 null */
  crcValid: boolean | null;
  crcReceived: number | null;
  /** TCP MBAP 字段；RTU 为 null */
  transactionId: number | null;
  protocolId: number | null;
  mbapLength: number | null;
  /** 原始报文字节 */
  bytes: number[];
  byteLength: number;
  fields: ModbusField[];
}

export interface ModbusBuildConfig {
  mode: ModbusMode;
  unitId: number;
  functionCode: number;
  dataHex: string;
  transactionId: number;
}

const FUNCTION_NAMES: Record<number, string> = {
  0x01: 'Read Coils / 读线圈',
  0x02: 'Read Discrete Inputs / 读离散输入',
  0x03: 'Read Holding Registers / 读保持寄存器',
  0x04: 'Read Input Registers / 读输入寄存器',
  0x05: 'Write Single Coil / 写单个线圈',
  0x06: 'Write Single Register / 写单个寄存器',
  0x0f: 'Write Multiple Coils / 写多个线圈',
  0x10: 'Write Multiple Registers / 写多个寄存器',
};

const EXCEPTION_NAMES: Record<number, string> = {
  0x01: 'Illegal Function / 非法功能',
  0x02: 'Illegal Data Address / 非法数据地址',
  0x03: 'Illegal Data Value / 非法数据值',
  0x04: 'Server Device Failure / 从站设备故障',
  0x05: 'Acknowledge / 确认',
  0x06: 'Server Device Busy / 从站设备忙',
  0x08: 'Memory Parity Error / 存储奇偶校验错误',
  0x0a: 'Gateway Path Unavailable / 网关路径不可用',
  0x0b: 'Gateway Target Device Failed to Respond / 网关目标设备无响应',
};

/** 解析十六进制字符串为字节数组，容忍空格、逗号与 0x 前缀 */
export function hexToBytes(input: string): number[] {
  const cleaned = input.replace(/0x/gi, '').replace(/[\s,:-]/g, '');
  if (!cleaned) {
    throw new Error('请输入十六进制报文数据');
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    throw new Error('包含非法十六进制字符');
  }
  if (cleaned.length % 2 !== 0) {
    throw new Error('十六进制字符数必须为偶数（每个字节两位）');
  }
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return bytes;
}

/** 字节数组转大写十六进制，默认按空格分隔 */
export function bytesToHex(bytes: ArrayLike<number>): string {
  const hexes: string[] = [];
  for (let i = 0; i < bytes.length; i += 1) {
    hexes.push(bytes[i]!.toString(16).padStart(2, '0').toUpperCase());
  }
  return hexes.join(' ');
}

/** 计算 Modbus CRC-16（反射多项式 0xA001，初值 0xFFFF，不做最终异或） */
export function crc16Modbus(bytes: ArrayLike<number>): number {
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i]!;
    for (let bit = 0; bit < 8; bit += 1) {
      if ((crc & 0x0001) !== 0) {
        crc = (crc >> 1) ^ 0xa001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc & 0xffff;
}

const readU16 = (bytes: ArrayLike<number>, offset: number): number =>
  (bytes[offset]! << 8) + bytes[offset + 1]!;

const writeU16 = (value: number): number[] => [(value >> 8) & 0xff, value & 0xff];

const hex16 = (value: number): string => `0x${value.toString(16).padStart(4, '0').toUpperCase()}`;

const describePdu = (functionCode: number, data: number[]): ModbusField[] => {
  const fields: ModbusField[] = [];
  const baseFunction = functionCode & 0x7f;

  if ((functionCode & 0x80) !== 0) {
    if (data.length >= 1) {
      fields.push({ label: '异常码', value: `${data[0]!}（${EXCEPTION_NAMES[data[0]!] ?? '未知异常'}）` });
    }
    return fields;
  }

  if (baseFunction >= 0x01 && baseFunction <= 0x04) {
    if (data.length === 4) {
      fields.push({ label: '起始地址', value: `${readU16(data, 0)}（${hex16(readU16(data, 0))}）` });
      fields.push({ label: '数量', value: `${readU16(data, 2)}` });
      return fields;
    }
    if (data.length > 4) {
      const byteCount = data[0]!;
      fields.push({ label: '字节数', value: `${byteCount}` });
      if (baseFunction === 0x01 || baseFunction === 0x02) {
        fields.push({ label: '线圈状态', value: bytesToHex(data.slice(1)) });
      } else {
        const values: string[] = [];
        for (let i = 1; i + 1 < data.length; i += 2) {
          values.push(`${readU16(data, i)}（${hex16(readU16(data, i))}）`);
        }
        fields.push({ label: '寄存器值', value: values.join('、') || '—' });
      }
    }
    return fields;
  }

  if (baseFunction === 0x05 || baseFunction === 0x06) {
    if (data.length >= 4) {
      fields.push({ label: '寄存器地址', value: `${readU16(data, 0)}（${hex16(readU16(data, 0))}）` });
      const value = readU16(data, 2);
      if (baseFunction === 0x05) {
        const state = value === 0xff00 ? 'ON' : value === 0x0000 ? 'OFF' : '非法值';
        fields.push({ label: '线圈状态', value: `${hex16(value)}（${state}）` });
      } else {
        fields.push({ label: '写入值', value: `${value}（${hex16(value)}）` });
      }
    }
    return fields;
  }

  if (baseFunction === 0x0f || baseFunction === 0x10) {
    if (data.length >= 4) {
      fields.push({ label: '起始地址', value: `${readU16(data, 0)}（${hex16(readU16(data, 0))}）` });
      fields.push({ label: '数量', value: `${readU16(data, 2)}` });
    }
    if (data.length > 4) {
      const byteCount = data[3]!;
      fields.push({ label: '字节数', value: `${byteCount}` });
      if (baseFunction === 0x10) {
        const values: string[] = [];
        for (let i = 4; i + 1 < data.length; i += 2) {
          values.push(`${readU16(data, i)}`);
        }
        fields.push({ label: '寄存器值', value: values.join('、') || '—' });
      } else {
        fields.push({ label: '线圈状态', value: bytesToHex(data.slice(4)) });
      }
    }
    return fields;
  }

  if (data.length > 0) {
    fields.push({ label: '数据', value: bytesToHex(data) });
  }
  return fields;
};

/** 判断字节序列是否为 Modbus TCP（MBAP 头协议 ID 为 0 且长度字段与报文总长一致） */
const looksLikeTcp = (bytes: number[]): boolean => {
  if (bytes.length < 8) {
    return false;
  }
  if (bytes[2] !== 0 || bytes[3] !== 0) {
    return false;
  }
  const declaredLength = readU16(bytes, 4);
  return declaredLength + 6 === bytes.length;
};

/** 解析 Modbus RTU 或 TCP 报文，自动识别模式 */
export function parseModbusFrame(input: string): ModbusFrame {
  const bytes = hexToBytes(input);
  const isTcp = looksLikeTcp(bytes);

  let unitId: number;
  let functionCode: number;
  let data: number[];
  let transactionId: number | null = null;
  let protocolId: number | null = null;
  let mbapLength: number | null = null;
  let crc: number | null = null;
  let crcReceived: number | null = null;
  let crcValid: boolean | null = null;

  if (isTcp) {
    if (bytes.length < 8) {
      throw new Error('Modbus TCP 报文至少需要 MBAP 头 7 字节 + 功能码 1 字节');
    }
    transactionId = readU16(bytes, 0);
    protocolId = readU16(bytes, 2);
    mbapLength = readU16(bytes, 4);
    unitId = bytes[6]!;
    functionCode = bytes[7]!;
    data = bytes.slice(8);
    if (mbapLength < 2) {
      throw new Error(`MBAP 长度字段应至少为 2（单元 ID + 功能码），当前 ${mbapLength}`);
    }
  } else {
    if (bytes.length < 4) {
      throw new Error(`Modbus RTU 报文至少需要 4 字节（地址 + 功能码 + 2 字节 CRC），当前 ${bytes.length} 字节`);
    }
    unitId = bytes[0]!;
    functionCode = bytes[1]!;
    data = bytes.slice(2, bytes.length - 2);
    crcReceived = (bytes[bytes.length - 1]! << 8) + bytes[bytes.length - 2]!;
    crc = crc16Modbus(bytes.slice(0, bytes.length - 2));
    crcValid = crc === crcReceived;
  }

  const isException = (functionCode & 0x80) !== 0;
  const baseFunction = functionCode & 0x7f;
  const exceptionCode = isException && data.length >= 1 ? data[0]! : null;
  const fields = describePdu(functionCode, data);

  return {
    mode: isTcp ? 'tcp' : 'rtu',
    unitId,
    functionCode,
    functionName:
      FUNCTION_NAMES[baseFunction] ?? `未知功能码 0x${baseFunction.toString(16).padStart(2, '0').toUpperCase()}`,
    isException,
    exceptionCode,
    exceptionName: exceptionCode === null ? null : EXCEPTION_NAMES[exceptionCode] ?? '未知异常码',
    data,
    dataHex: bytesToHex(data),
    crc,
    crcValid,
    crcReceived,
    transactionId,
    protocolId,
    mbapLength,
    bytes,
    byteLength: bytes.length,
    fields,
  };
}

/** 构造 Modbus 报文，RTU 自动追加 CRC，TCP 自动写入 MBAP 长度 */
export function buildModbusFrame(config: ModbusBuildConfig): {
  bytes: number[];
  hex: string;
  crc: number | null;
  mbapLength: number | null;
} {
  const { mode, unitId, functionCode, dataHex, transactionId } = config;
  if (unitId < 0 || unitId > 255) {
    throw new Error('从站地址 / 单元 ID 必须在 0–255 之间');
  }
  if (functionCode < 1 || functionCode > 127) {
    throw new Error('功能码必须在 1–127 之间（128 及以上为异常响应保留）');
  }
  const data = hexToBytes(dataHex);
  if (data.length > 253) {
    throw new Error('PDU 数据不能超过 253 字节');
  }

  if (mode === 'tcp') {
    if (transactionId < 0 || transactionId > 65535) {
      throw new Error('事务 ID 必须在 0–65535 之间');
    }
    const mbapLength = data.length + 2;
    const bytes = [
      ...writeU16(transactionId),
      0x00,
      0x00,
      ...writeU16(mbapLength),
      unitId,
      functionCode,
      ...data,
    ];
    return { bytes, hex: bytesToHex(bytes), crc: null, mbapLength };
  }

  const withoutCrc = [unitId, functionCode, ...data];
  const crc = crc16Modbus(withoutCrc);
  const bytes = [...withoutCrc, crc & 0xff, (crc >> 8) & 0xff];
  return { bytes, hex: bytesToHex(bytes), crc, mbapLength: null };
}

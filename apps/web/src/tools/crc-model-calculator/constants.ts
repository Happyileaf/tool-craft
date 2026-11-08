import type { CrcModel } from './utils/crc';

/**
 * 标准 CRC 预设模型库
 *
 * 参数命名与 check 常量对齐 catalogue/crc.com 的 Rocksoft™ 模型，
 * check 均为 ASCII "123456789" 的 CRC 结果，可在工具内一键自检。
 */
export const CRC_PRESETS: ReadonlyArray<CrcModel> = [
  {
    name: 'CRC-8/MAXIM (Dallas 1-Wire)',
    width: 8,
    poly: BigInt('0x31'),
    init: BigInt('0x00'),
    refIn: true,
    refOut: true,
    xorOut: BigInt('0x00'),
    check: BigInt('0xA1'),
  },
  {
    name: 'CRC-8/CCITT',
    width: 8,
    poly: BigInt('0x07'),
    init: BigInt('0x00'),
    refIn: false,
    refOut: false,
    xorOut: BigInt('0x00'),
    check: BigInt('0xF4'),
  },
  {
    name: 'CRC-8/DARC',
    width: 8,
    poly: BigInt('0x39'),
    init: BigInt('0x00'),
    refIn: true,
    refOut: true,
    xorOut: BigInt('0x00'),
    check: BigInt('0x15'),
  },
  {
    name: 'CRC-16/ARC (IBM)',
    width: 16,
    poly: BigInt('0x8005'),
    init: BigInt('0x0000'),
    refIn: true,
    refOut: true,
    xorOut: BigInt('0x0000'),
    check: BigInt('0xBB3D'),
  },
  {
    name: 'CRC-16/MODBUS',
    width: 16,
    poly: BigInt('0x8005'),
    init: BigInt('0xFFFF'),
    refIn: true,
    refOut: true,
    xorOut: BigInt('0x0000'),
    check: BigInt('0x4B37'),
  },
  {
    name: 'CRC-16/CCITT-FALSE',
    width: 16,
    poly: BigInt('0x1021'),
    init: BigInt('0xFFFF'),
    refIn: false,
    refOut: false,
    xorOut: BigInt('0x0000'),
    check: BigInt('0x29B1'),
  },
  {
    name: 'CRC-16/XMODEM',
    width: 16,
    poly: BigInt('0x1021'),
    init: BigInt('0x0000'),
    refIn: false,
    refOut: false,
    xorOut: BigInt('0x0000'),
    check: BigInt('0x31C3'),
  },
  {
    name: 'CRC-16/GENIBUS (EPC)',
    width: 16,
    poly: BigInt('0x1021'),
    init: BigInt('0xFFFF'),
    refIn: false,
    refOut: false,
    xorOut: BigInt('0xFFFF'),
    check: BigInt('0xD64E'),
  },
  {
    name: 'CRC-32/ISO-HDLC (zlib/PNG)',
    width: 32,
    poly: BigInt('0x04C11DB7'),
    init: BigInt('0xFFFFFFFF'),
    refIn: true,
    refOut: true,
    xorOut: BigInt('0xFFFFFFFF'),
    check: BigInt('0xCBF43926'),
  },
  {
    name: 'CRC-32/BZIP2',
    width: 32,
    poly: BigInt('0x04C11DB7'),
    init: BigInt('0xFFFFFFFF'),
    refIn: false,
    refOut: false,
    xorOut: BigInt('0xFFFFFFFF'),
    check: BigInt('0xFC891918'),
  },
  {
    name: 'CRC-32C (Castagnoli, iSCSI/SSE4.2)',
    width: 32,
    poly: BigInt('0x1EDC6F41'),
    init: BigInt('0xFFFFFFFF'),
    refIn: true,
    refOut: true,
    xorOut: BigInt('0xFFFFFFFF'),
    check: BigInt('0xE3069283'),
  },
  {
    name: 'CRC-64/XZ (Go ECMA)',
    width: 64,
    poly: BigInt('0x42F0E1EBA9EA3693'),
    init: BigInt('0xFFFFFFFFFFFFFFFF'),
    refIn: true,
    refOut: true,
    xorOut: BigInt('0xFFFFFFFFFFFFFFFF'),
    check: BigInt('0x995DC9BBDF1939FA'),
  },
];

/** 输入模式 */
export const INPUT_MODE = Object.freeze({
  TEXT: 'text',
  HEX: 'hex',
} as const);

export type InputMode = (typeof INPUT_MODE)[keyof typeof INPUT_MODE];

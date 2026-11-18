/** I2C 地址换算器的固定展示文案与默认输入 */

export const DEFAULT_INPUT = '0x50';

export const INPUT_HINT =
  '支持 0x 前缀十六进制（0x50）、纯十进制（80）、0b 前缀二进制（0b1010000）与八进制（0o120）；可输入 7-bit 地址或 8-bit 读写地址';

/** UM10204 §3.1.10 保留的 16 个 7-bit 地址区间端点（含端点） */
export const RESERVED_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x00, 0x07],
  [0x78, 0x7f],
];

export const RESERVED_HINT =
  '依据 NXP UM10204 §3.1.10，0x00–0x07（通用调用与 CBUS 等）与 0x78–0x7F（10-bit 寻址等）为保留地址，不能分配给普通从设备';

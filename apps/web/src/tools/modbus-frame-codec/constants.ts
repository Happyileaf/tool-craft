/** Modbus 报文编解码工具的常量与示例 */

/** RTU 示例：从站 1，功能码 03，起始地址 0，读取 10 个保持寄存器，CRC = 0xCDC5 */
export const DEFAULT_RTU_HEX = '01 03 00 00 00 0A C5 CD';

/** TCP 示例：事务 ID 1，单元 1，功能码 03，起始地址 0，读取 10 个保持寄存器 */
export const DEFAULT_TCP_HEX = '00 01 00 00 00 06 01 03 00 00 00 0A';

export const MODBUS_PLACEHOLDER =
  '粘贴 Modbus RTU 或 TCP 报文十六进制，工具会根据 MBAP 头自动识别模式';

export const DEFAULT_BUILD_DATA = '00 00 00 0A';

/** 常用功能码预设，供构造器下拉选择 */
export const FUNCTION_PRESETS = [
  { value: 0x01, label: '01 读线圈（Read Coils）' },
  { value: 0x02, label: '02 读离散输入（Read Discrete Inputs）' },
  { value: 0x03, label: '03 读保持寄存器（Read Holding Registers）' },
  { value: 0x04, label: '04 读输入寄存器（Read Input Registers）' },
  { value: 0x05, label: '05 写单个线圈（Write Single Coil）' },
  { value: 0x06, label: '06 写单个寄存器（Write Single Register）' },
  { value: 0x0f, label: '0F 写多个线圈（Write Multiple Coils）' },
  { value: 0x10, label: '10 写多个寄存器（Write Multiple Registers）' },
];

export enum PixelFormatEnum {
  RGB565 = 'rgb565',
  RGB555 = 'rgb555',
}

export enum EndianEnum {
  BIG = 'big',
  LITTLE = 'little',
}

export enum ConvertModeEnum {
  ENCODE = 'encode',
  DECODE = 'decode',
}

export const FORMAT_OPTIONS = [
  { label: 'RGB565（5/6/5 位，TFT 常用）', value: PixelFormatEnum.RGB565 },
  { label: 'RGB555（各 5 位）', value: PixelFormatEnum.RGB555 },
];

export const ENDIAN_OPTIONS = [
  { label: '大端（高位在前）', value: EndianEnum.BIG },
  { label: '小端（低位在前）', value: EndianEnum.LITTLE },
];

export const MODE_OPTIONS = [
  { label: '正向：#RRGGBB → 16 位', value: ConvertModeEnum.ENCODE },
  { label: '反向：16 位 → #RRGGBB', value: ConvertModeEnum.DECODE },
];

export const DEFAULT_ENCODE_INPUT = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF'].join(
  '\n',
);

export const DEFAULT_DECODE_INPUT = ['0xFFFF', '0x0000', '0xF800', '0x07E0', '0x001F'].join('\n');

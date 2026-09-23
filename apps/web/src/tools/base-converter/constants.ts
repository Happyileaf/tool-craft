export enum Base {
  BINARY = 2,
  OCTAL = 8,
  DECIMAL = 10,
  HEXADECIMAL = 16,
}

export const baseLabels: Record<Base, string> = {
  [Base.BINARY]: '二进制 (2)',
  [Base.OCTAL]: '八进制 (8)',
  [Base.DECIMAL]: '十进制 (10)',
  [Base.HEXADECIMAL]: '十六进制 (16)',
};

export const baseLabelsEn: Record<Base, string> = {
  [Base.BINARY]: 'Binary (2)',
  [Base.OCTAL]: 'Octal (8)',
  [Base.DECIMAL]: 'Decimal (10)',
  [Base.HEXADECIMAL]: 'Hexadecimal (16)',
};

export const defaultSampleInput = '42';

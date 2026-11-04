/** 计算模式标识 */
export const MODULAR_MODES = [
  { value: 'inverse', labelZh: '模逆元 a⁻¹ mod m', labelEn: 'Modular inverse' },
  { value: 'pow', labelZh: '模幂 a^e mod m', labelEn: 'Modular exponentiation' },
  { value: 'linear', labelZh: '同余方程 ax≡b (mod m)', labelEn: 'Linear congruence' },
  { value: 'crt', labelZh: '中国剩余定理 CRT', labelEn: 'Chinese remainder' },
] as const;

export type ModularMode = (typeof MODULAR_MODES)[number]['value'];

/** CRT 编辑器初始行 */
export const CRT_INITIAL_ROWS = [
  { remainder: '2', modulus: '3' },
  { remainder: '3', modulus: '5' },
  { remainder: '2', modulus: '7' },
];

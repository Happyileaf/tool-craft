/** 古典密码合集的静态常量与默认样例 */

export type CipherId = 'bacon' | 'railfence' | 'playfair' | 'atbash';

export const CIPHER_OPTIONS: Array<{ id: CipherId; name: string; nameEn: string }> = [
  { id: 'bacon', name: '培根密码', nameEn: "Bacon's Cipher" },
  { id: 'railfence', name: '栅栏密码', nameEn: 'Rail Fence Cipher' },
  { id: 'playfair', name: 'Playfair 密码', nameEn: 'Playfair Cipher' },
  { id: 'atbash', name: 'Atbash 密码', nameEn: 'Atbash Cipher' },
];

/** 26 个大写字母（Atbash / 培根字母表） */
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * 培根密码字母 → 5 位 AB 编码（原始 24 字母版，I/J 与 U/V 共用编码）
 *
 * 现代使用时按合并规则映射：J→I 的编码、V→U 的编码
 */
export const BACON_TABLE: Record<string, string> = {
  A: 'AAAAA',
  B: 'AAAAB',
  C: 'AAABA',
  D: 'AAABB',
  E: 'AABAA',
  F: 'AABAB',
  G: 'AABBA',
  H: 'AABBB',
  I: 'ABAAA',
  J: 'ABAAA',
  K: 'ABAAB',
  L: 'ABABA',
  M: 'ABABB',
  N: 'ABBAA',
  O: 'ABBAB',
  P: 'ABBBA',
  Q: 'ABBBB',
  R: 'BAAAA',
  S: 'BAAAB',
  T: 'BAABA',
  U: 'BAABB',
  V: 'BAABB',
  W: 'BABAA',
  X: 'BABAB',
  Y: 'BABBA',
  Z: 'BABBB',
};

export const DEFAULT_TEXT = 'HELLO WORLD';
export const DEFAULT_RAILS = 3;
export const DEFAULT_PLAYFAIR_KEY = 'MONARCHY';

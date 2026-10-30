export const DEFAULT_INPUT = 'Robert\nRupert\nAshcraft\nTymczak\nHoneyman';

/** Soundex 读音码分组（用于页脚规则速查） */
export const CODE_GROUPS: Array<{ digit: string; letters: string }> = [
  { digit: '1', letters: 'B, F, P, V' },
  { digit: '2', letters: 'C, G, J, K, Q, S, X, Z' },
  { digit: '3', letters: 'D, T' },
  { digit: '4', letters: 'L' },
  { digit: '5', letters: 'M, N' },
  { digit: '6', letters: 'R' },
];

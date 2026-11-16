/** 核酸类型 */
export type NucleicAcidType = 'DNA' | 'RNA';

/** 序列长度上限（nt） */
export const MAX_SEQUENCE_LENGTH = 100_000;

/** 标准 DNA 碱基 */
export const DNA_BASES = ['A', 'C', 'G', 'T'] as const;
/** 标准 RNA 碱基 */
export const RNA_BASES = ['A', 'C', 'G', 'U'] as const;

/**
 * IUPAC 互补碱基映射（DNA）
 * 标准碱基 A↔T、C↔G；模糊碱基 R↔Y、S↔S、W↔W、K↔M、B↔V、D↔H、N↔N
 */
export const IUPAC_COMPLEMENT_DNA: Record<string, string> = {
  A: 'T',
  T: 'A',
  C: 'G',
  G: 'C',
  R: 'Y',
  Y: 'R',
  S: 'S',
  W: 'W',
  K: 'M',
  M: 'K',
  B: 'V',
  V: 'B',
  D: 'H',
  H: 'D',
  N: 'N',
};

/** IUPAC 模糊碱基集合（非 ACGT/U） */
export const IUPAC_AMBIGUOUS = new Set(['R', 'Y', 'S', 'W', 'K', 'M', 'B', 'V', 'D', 'H', 'N']);

/** 全部合法 IUPAC 字符（DNA/RNA 共用，T/U 视类型而定） */
export const IUPAC_ALL = new Set([
  'A', 'C', 'G', 'T', 'U',
  'R', 'Y', 'S', 'W', 'K', 'M', 'B', 'V', 'D', 'H', 'N',
]);

/**
 * 标准遗传密码表（以 RNA 密码子为键，U 形式），值为单字母氨基酸，`*` 为终止密码子。
 * 共 64 个密码子。
 */
export const GENETIC_CODE: Record<string, string> = {
  UUU: 'F', CUU: 'L', AUU: 'I', GUU: 'V',
  UUC: 'F', CUC: 'L', AUC: 'I', GUC: 'V',
  UUA: 'L', CUA: 'L', AUA: 'I', GUA: 'V',
  UUG: 'L', CUG: 'L', AUG: 'M', GUG: 'V',
  UCU: 'S', CCU: 'P', ACU: 'T', GCU: 'A',
  UCC: 'S', CCC: 'P', ACC: 'T', GCC: 'A',
  UCA: 'S', CCA: 'P', ACA: 'T', GCA: 'A',
  UCG: 'S', CCG: 'P', ACG: 'T', GCG: 'A',
  UAU: 'Y', CAU: 'H', AAU: 'N', GAU: 'D',
  UAC: 'Y', CAC: 'H', AAC: 'N', GAC: 'D',
  UAA: '*', CAA: 'Q', AAA: 'K', GAA: 'E',
  UAG: '*', CAG: 'Q', AAG: 'K', GAG: 'E',
  UGU: 'C', CGU: 'R', AGU: 'S', GGU: 'G',
  UGC: 'C', CGC: 'R', AGC: 'S', GGC: 'G',
  UGA: '*', CGA: 'R', AGA: 'R', GGA: 'G',
  UGG: 'W', CGG: 'R', AGG: 'R', GGG: 'G',
};

/** 氨基酸三字母 → 单字母之外的全称（展示用） */
export const AMINO_ACID_NAMES: Record<string, string> = {
  A: '丙氨酸 Ala',
  C: '半胱氨酸 Cys',
  D: '天冬氨酸 Asp',
  E: '谷氨酸 Glu',
  F: '苯丙氨酸 Phe',
  G: '甘氨酸 Gly',
  H: '组氨酸 His',
  I: '异亮氨酸 Ile',
  K: '赖氨酸 Lys',
  L: '亮氨酸 Leu',
  M: '甲硫氨酸 Met',
  N: '天冬酰胺 Asn',
  P: '脯氨酸 Pro',
  Q: '谷氨酰胺 Gln',
  R: '精氨酸 Arg',
  S: '丝氨酸 Ser',
  T: '苏氨酸 Thr',
  V: '缬氨酸 Val',
  W: '色氨酸 Trp',
  Y: '酪氨酸 Tyr',
  '*': '终止密码子 Stop',
  X: '含模糊碱基，无法确定',
};

export const DEFAULT_SAMPLE = `>sample DNA
ATGCGTACGTAG`;

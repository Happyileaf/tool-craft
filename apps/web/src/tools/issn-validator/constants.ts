export const DEFAULT_SINGLE = '0378-5955';

export const DEFAULT_BATCH = `0378-5955
1000-002X
03785950
1234-567
bad-issn
1000007`;

export const HINT =
  '按 ISO 3297 规则对 8 位 ISSN 做 mod-11 校验位验证、7 位前缀自动补全与批量校验，自动剥离空格/连字符并输出标准格式 NNNN-NNNC（校验位 10 记为 X）。全部计算在浏览器本地完成。';

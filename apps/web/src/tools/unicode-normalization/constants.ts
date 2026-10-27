export enum NormalizationFormEnum {
  NFC = 'NFC',
  NFD = 'NFD',
  NFKC = 'NFKC',
  NFKD = 'NFKD',
}

export const DEFAULT_FORM = NormalizationFormEnum.NFC;

export const FORM_OPTIONS = [
  { label: 'NFC（规范合成）', value: NormalizationFormEnum.NFC },
  { label: 'NFD（规范分解）', value: NormalizationFormEnum.NFD },
  { label: 'NFKC（兼容合成）', value: NormalizationFormEnum.NFKC },
  { label: 'NFKD（兼容分解）', value: NormalizationFormEnum.NFKD },
];

export const DEFAULT_SAMPLE = [
  'Café é',
  '①②③ ＡＢＣ',
  'ｶﾀｶﾅ ﬁ 𝓗𝓮𝓵𝓵𝓸 👨‍👩‍👧',
].join('\n');

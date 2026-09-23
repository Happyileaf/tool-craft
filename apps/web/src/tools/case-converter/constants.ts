export enum CaseConversionMode {
  LOWERCASE = 'lowercase',
  UPPERCASE = 'uppercase',
  CAPITALIZE_FIRST = 'capitalize-first',
  SENTENCE = 'sentence',
}

export const conversionModeLabels: Record<CaseConversionMode, string> = {
  [CaseConversionMode.LOWERCASE]: '全小写',
  [CaseConversionMode.UPPERCASE]: '全大写',
  [CaseConversionMode.CAPITALIZE_FIRST]: '首字母大写',
  [CaseConversionMode.SENTENCE]: '句首大写',
};

export const conversionModeLabelsEn: Record<CaseConversionMode, string> = {
  [CaseConversionMode.LOWERCASE]: 'Lowercase',
  [CaseConversionMode.UPPERCASE]: 'Uppercase',
  [CaseConversionMode.CAPITALIZE_FIRST]: 'Capitalize First',
  [CaseConversionMode.SENTENCE]: 'Sentence Case',
};

export const defaultSampleInput = 'hello world. this is a test sentence.\nsecond line here.';

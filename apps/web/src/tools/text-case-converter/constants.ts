/**
 * Text case converter 工具内常量
 */

/**
 * 支持的命名风格枚举，值同时作为 Select 的取值与转换函数的风格键
 */
export enum CaseStyleEnum {
  /** camelCase */
  CAMEL = 'camel',
  /** PascalCase */
  PASCAL = 'pascal',
  /** snake_case */
  SNAKE = 'snake',
  /** SCREAMING_SNAKE_CASE */
  SCREAMING_SNAKE = 'screaming-snake',
  /** kebab-case */
  KEBAB = 'kebab',
  /** dot.case */
  DOT = 'dot',
  /** Title Case */
  TITLE = 'title',
  /** Sentence case */
  SENTENCE = 'sentence',
  /** lower case */
  LOWER = 'lower',
  /** UPPER CASE */
  UPPER = 'upper',
}

/**
 * 各命名风格的中文展示名，供目标风格选择与对照列表渲染
 */
export const CASE_STYLE_LABELS: Record<CaseStyleEnum, string> = {
  [CaseStyleEnum.CAMEL]: 'camelCase',
  [CaseStyleEnum.PASCAL]: 'PascalCase',
  [CaseStyleEnum.SNAKE]: 'snake_case',
  [CaseStyleEnum.SCREAMING_SNAKE]: 'SCREAMING_SNAKE_CASE',
  [CaseStyleEnum.KEBAB]: 'kebab-case',
  [CaseStyleEnum.DOT]: 'dot.case',
  [CaseStyleEnum.TITLE]: 'Title Case',
  [CaseStyleEnum.SENTENCE]: 'Sentence case',
  [CaseStyleEnum.LOWER]: 'lower case',
  [CaseStyleEnum.UPPER]: 'UPPER CASE',
};

/**
 * 风格的展示顺序，决定目标风格下拉与对照列表的排列
 */
export const CASE_STYLE_ORDER: CaseStyleEnum[] = [
  CaseStyleEnum.CAMEL,
  CaseStyleEnum.PASCAL,
  CaseStyleEnum.SNAKE,
  CaseStyleEnum.SCREAMING_SNAKE,
  CaseStyleEnum.KEBAB,
  CaseStyleEnum.DOT,
  CaseStyleEnum.TITLE,
  CaseStyleEnum.SENTENCE,
  CaseStyleEnum.LOWER,
  CaseStyleEnum.UPPER,
];

/**
 * 目标风格选择的默认值
 */
export const DEFAULT_CASE_STYLE: CaseStyleEnum = CaseStyleEnum.CAMEL;

/**
 * 工具首次载入或「载入示例」时填入的示例文本
 */
export const DEFAULT_TEXT = 'get user profile';

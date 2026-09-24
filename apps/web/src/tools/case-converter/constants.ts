/**
 * 支持的格式类型
 */
export enum CaseType {
  CAMEL = 'camel', // camelCase
  PASCAL = 'pascal', // PascalCase
  SNAKE = 'snake', // snake_case
  KEBAB = 'kebab', // kebab-case
  CONSTANT = 'constant', // CONSTANT_CASE
  SENTENCE = 'sentence', // Sentence case
  TITLE = 'title', // Title Case
}

export const DEFAULT_INPUT = `hello world\nthisIsATest\nthis_is_a_test\nthis-is-a-test\nTHIS_IS_A_TEST\nThis Is A Test\nThis Is A Title`;

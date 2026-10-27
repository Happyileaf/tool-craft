/**
 * JSON Merge Patch 工具的运行模式
 */
export enum ModeEnum {
  APPLY = 'apply',
  GENERATE = 'generate',
}

/**
 * 模式选项
 */
export const MODE_OPTIONS = [
  { label: '应用补丁 Apply', value: ModeEnum.APPLY },
  { label: '生成补丁 Generate', value: ModeEnum.GENERATE },
];

/**
 * RFC 7386 示例原文档
 */
export const DEFAULT_ORIGINAL = `{
  "title": "Goodbye!",
  "author": {
    "givenName": "John",
    "familyName": "Doe"
  },
  "tags": [
    "example",
    "sample"
  ],
  "content": "This will be unchanged"
}`;

/**
 * RFC 7386 官方示例补丁
 */
export const DEFAULT_PATCH = `{
  "title": "Hello!",
  "phoneNumber": "+01-123-456-7890",
  "author": {
    "familyName": null
  },
  "tags": [
    "example"
  ]
}`;

/**
 * 生成补丁模式下的目标文档
 */
export const DEFAULT_TARGET = `{
  "title": "Hello!",
  "author": {
    "givenName": "John"
  },
  "tags": [
    "example"
  ],
  "content": "This will be unchanged",
  "phoneNumber": "+01-123-456-7890"
}`;

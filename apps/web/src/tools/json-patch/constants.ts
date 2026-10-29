/**
 * JSON Patch 工具默认示例（覆盖 add / test / replace / remove / copy / move 六操作）
 */
export const DEFAULT_DOCUMENT = `{
  "title": "Goodbye!",
  "author": {
    "givenName": "John",
    "familyName": "Doe"
  },
  "tags": ["example", "sample"],
  "content": "This will be unchanged",
  "phoneNumber": "+01-123-456-7890"
}`;

export const DEFAULT_PATCH = `[
  { "op": "replace", "path": "/title", "value": "Hello!" },
  { "op": "add", "path": "/author/fullName", "value": "John Doe" },
  { "op": "test", "path": "/tags/0", "value": "example" },
  { "op": "copy", "from": "/author/givenName", "path": "/author/alias" },
  { "op": "move", "from": "/phoneNumber", "path": "/contact/phone" },
  { "op": "remove", "path": "/content" }
]`;

/** 用于演示精确操作级错误的补丁：第 2 个操作数组下标越界 */
export const ERROR_PATCH = `[
  { "op": "add", "path": "/tags/-", "value": "draft" },
  { "op": "remove", "path": "/tags/9" }
]`;

/**
 * PHP serialize ↔ JSON 转换器常量与默认示例
 */

/** 转换方向 */
export enum PhpModeEnum {
  /** PHP serialize 文本 → JSON */
  DESERIALIZE = 'deserialize',
  /** JSON → PHP serialize 文本 */
  SERIALIZE = 'serialize',
}

/** 默认 PHP serialize 输入示例（长度按 UTF-16 码元声明） */
export const DEFAULT_PHP = `a:4:{s:4:"name";s:5:"Alice";s:3:"age";i:18;s:5:"tags";a:2:{i:0;s:2:"go";i:1;s:4:"rust";}s:6:"active";b:1;}`;

/** 默认 JSON 输入示例 */
export const DEFAULT_JSON = `{
  "name": "小明",
  "age": 18,
  "tags": ["go", "rust"],
  "active": true,
  "score": 99.5
}`;

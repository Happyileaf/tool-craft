/**
 * Java .properties ↔ JSON 双向转换工具内常量
 */

/** 转换方向 */
export enum PropertiesModeEnum {
  /** properties 文本解析为 JSON */
  TO_JSON = 'to-json',
  /** JSON 序列化为 properties 文本 */
  TO_PROPERTIES = 'to-properties',
}

/** 方向选择项数据源 */
export const MODE_OPTIONS: { label: string; value: PropertiesModeEnum }[] = [
  { label: '.properties → JSON（解析）', value: PropertiesModeEnum.TO_JSON },
  { label: 'JSON → .properties（序列化）', value: PropertiesModeEnum.TO_PROPERTIES },
];

/** 顶部提示文案 */
export const HINT =
  'Java .properties 与扁平 JSON 双向转换：支持 = / : / 空白分隔符、行尾反斜杠续行、\\n \\t \\\\ \\uXXXX 转义、# / ! 注释与重复键覆盖；键保持扁平不臆造嵌套。全部在浏览器本地完成。';

/** properties → JSON 方向的默认示例 */
export const DEFAULT_PROPERTIES = `# 应用配置
app.name = Demo 应用
app.host: localhost
port 8080
greeting=hello\\nworld
title=\\u4f60\\u597d
long.line=abc\\\\
   def
path=C:\\\\Users\\\\test`;

/** JSON → properties 方向的默认示例 */
export const DEFAULT_JSON = `{
  "app.name": "Demo 应用",
  "host": "localhost",
  "port": "8080",
  "greeting": "hello\\nworld",
  "empty": null
}`;

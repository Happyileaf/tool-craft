/**
 * JSON 缩进方式枚举
 * 枚举值与 data.json-format 能力 params.indent 的取值对齐，可直接作为参数传递
 */
enum JsonIndentEnum {
  /** 使用 2 个空格缩进 */
  Two = '2',
  /** 使用 4 个空格缩进 */
  Four = '4',
  /** 使用制表符缩进 */
  Tab = 'tab',
}

/**
 * JSON 缩进方式名称Map
 */
const JsonIndentLabelMap = {
  /** 2 个空格缩进的展示文案 */
  [JsonIndentEnum.Two]: '2 空格',
  /** 4 个空格缩进的展示文案 */
  [JsonIndentEnum.Four]: '4 空格',
  /** 制表符缩进的展示文案 */
  [JsonIndentEnum.Tab]: '制表符（Tab）',
};

/**
 * JSON 缩进方式选项数据源
 */
const JsonIndentOptions = [
  {
    label: JsonIndentLabelMap[JsonIndentEnum.Two],
    value: JsonIndentEnum.Two,
  },
  {
    label: JsonIndentLabelMap[JsonIndentEnum.Four],
    value: JsonIndentEnum.Four,
  },
  {
    label: JsonIndentLabelMap[JsonIndentEnum.Tab],
    value: JsonIndentEnum.Tab,
  },
];

export { JsonIndentEnum, JsonIndentLabelMap, JsonIndentOptions };

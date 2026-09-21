/**
 * URL 编码范围枚举
 * 枚举值与 text.url-encode 能力 params.scope 的取值对齐，可直接作为参数传递
 */
enum UrlEncodeScopeEnum {
  /** 组件级：对应 encodeURIComponent，编码全部保留字符，适合编码查询参数值 */
  Component = 'component',
  /** URI 级：对应 encodeURI，保留 URL 结构字符，适合编码完整地址 */
  Uri = 'uri',
}

/**
 * URL 编码范围名称Map
 */
const UrlEncodeScopeLabelMap = {
  /** 组件级编码的展示文案 */
  [UrlEncodeScopeEnum.Component]: '组件级（encodeURIComponent）',
  /** URI 级编码的展示文案 */
  [UrlEncodeScopeEnum.Uri]: 'URI 级（encodeURI）',
};

/**
 * URL 编码范围选项数据源
 */
const UrlEncodeScopeOptions = [
  {
    label: UrlEncodeScopeLabelMap[UrlEncodeScopeEnum.Component],
    value: UrlEncodeScopeEnum.Component,
  },
  {
    label: UrlEncodeScopeLabelMap[UrlEncodeScopeEnum.Uri],
    value: UrlEncodeScopeEnum.Uri,
  },
];

export { UrlEncodeScopeEnum, UrlEncodeScopeLabelMap, UrlEncodeScopeOptions };

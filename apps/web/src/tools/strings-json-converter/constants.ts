/** 默认 .strings 示例输入 */
export const DEFAULT_STRINGS_SAMPLE = `/* 登录页文案 */
"login.title" = "登录";
"login.button" = "登 录";  // 按钮
"greeting" = "你好，\\U4e16\\U754c";
"emoji" = "开心\\U0001F600";`;

/** 默认 JSON 示例输入 */
export const DEFAULT_JSON_SAMPLE = `{
  "login.title": "登录",
  "greeting": "你好，世界",
  "multiline": "第一行\\n第二行"
}`;

/** 重复键处理选项 */
export const DUPLICATE_OPTIONS: { label: string; value: 'error' | 'last' | 'first' }[] = [
  { label: '报错提示', value: 'error' },
  { label: '保留最后一个', value: 'last' },
  { label: '保留第一个', value: 'first' },
];

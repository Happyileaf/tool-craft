/**
 * JSON flatten / unflatten 工具内常量
 */

/** 转换方向：flatten 嵌套 → 扁平；unflatten 扁平 → 嵌套 */
export type ConvertMode = 'flatten' | 'unflatten';

/** 扁平化 */
export const MODE_FLATTEN: ConvertMode = 'flatten';

/** 反向还原 */
export const MODE_UNFLATTEN: ConvertMode = 'unflatten';

/** 分隔符可选项 */
export interface SeparatorOption {
  /** 控件展示标签 */
  label: string;
  /** 实际分隔符 */
  value: string;
}

/** 分隔符候选列表 */
export const SEPARATOR_OPTIONS: SeparatorOption[] = [
  { label: '点号 .', value: '.' },
  { label: '下划线 _', value: '_' },
  { label: '斜杠 /', value: '/' },
  { label: '连字符 -', value: '-' },
];

/** 默认分隔符 */
export const DEFAULT_SEPARATOR = '.';

/** 工具首次载入时填入的嵌套 JSON 示例 */
export const DEFAULT_NESTED_SAMPLE = `{
  "id": 42,
  "name": "ToolCraft",
  "tags": ["json", "offline"],
  "owner": {
    "team": "platform",
    "settings": {
      "theme": "auto",
      "retries": 3
    }
  },
  "active": true
}`;

/** 工具首次载入时填入的扁平 JSON 示例 */
export const DEFAULT_FLAT_SAMPLE = `{
  "id": 42,
  "name": "ToolCraft",
  "tags[0]": "json",
  "tags[1]": "offline",
  "owner.team": "platform",
  "owner.settings.theme": "auto",
  "owner.settings.retries": 3,
  "active": true
}`;

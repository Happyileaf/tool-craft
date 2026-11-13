/**
 * Porter 词干提取器的静态配置与默认输入
 */

/** 工具顶部提示文案 */
export const HINT = 'Porter 1980 后缀剥离算法，全部运算在浏览器本地完成，文本不会上传。';

/** 页面加载时的示例英文文本 */
export const SAMPLE_TEXT = `The runners were running quickly across the park.
They had run together every morning and enjoyed the quiet trails.
Happiness and hopefulness filled the relational discussions.`;

/** 示例按钮文案 */
export const SAMPLE_BUTTON_TEXT = '载入示例';

/** 清空按钮文案 */
export const CLEAR_BUTTON_TEXT = '清空';

/** 复制 CSV 按钮文案 */
export const COPY_CSV_BUTTON_TEXT = '复制 CSV';

/** 下载 CSV 按钮文案 */
export const DOWNLOAD_CSV_BUTTON_TEXT = '下载 CSV';

/** 复制成功提示 */
export const COPY_SUCCESS_MESSAGE = 'CSV 已复制到剪贴板';

/** CSV 下载文件名 */
export const CSV_FILE_NAME = 'porter-stems.csv';

/** 文本域占位提示 */
export const TEXTAREA_PLACEHOLDER = '在此粘贴英文文本，支持任意标点、数字与换行……';

/** 结果表格列标题 */
export const COLUMN_TITLES = {
  STEM: '词干 (Stem)',
  COUNT: '出现次数',
  FORMS: '归并词形 (Forms)',
} as const;

/** 统计卡片标题 */
export const STAT_TITLES = {
  TOTAL_TOKENS: '总词次 (Tokens)',
  UNIQUE_STEMS: '不同词干数',
} as const;

/** 表格分页大小 */
export const PAGE_SIZE = 10;

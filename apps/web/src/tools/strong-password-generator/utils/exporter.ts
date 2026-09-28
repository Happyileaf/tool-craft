/**
 * 触发浏览器下载指定文本内容
 *
 * @param content - 文件文本内容
 * @param fileName - 下载文件名（含扩展名）
 * @param mimeType - 文件 MIME 类型
 */
export function downloadTextFile(
  content: string,
  fileName: string,
  mimeType: string,
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * 转义单个 CSV 单元格，包含逗号、引号或换行时用双引号包裹并将内部引号翻倍
 *
 * @param value - 原始单元格文本
 * @returns 转义后的单元格文本
 */
export function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 将密码列表序列化为带序号表头的 CSV 文本
 *
 * @param passwords - 密码列表
 * @returns CSV 文本
 */
export function buildCsv(passwords: string[]) {
  const rows = passwords.map(
    (item, index) => `${index + 1},${escapeCsvCell(item)}`,
  );
  return ['index,password', ...rows].join('\r\n');
}

/**
 * 将密码列表序列化为每行一条的纯文本
 *
 * @param passwords - 密码列表
 * @returns TXT 文本
 */
export function buildTxt(passwords: string[]) {
  return passwords.join('\n');
}

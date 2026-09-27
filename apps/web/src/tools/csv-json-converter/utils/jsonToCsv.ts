/**
 * 将 JSON 数组转换为 CSV 字符串
 * @param json JSON 数组
 * @param delimiter 分隔符
 * @returns 转换后的 CSV 字符串
 */
export function jsonToCsv(json: any[], delimiter: string = ','): string {
  if (!Array.isArray(json) || json.length === 0) return '';

  const headers = Object.keys(json[0]);
  const lines = [headers.map(header => escapeField(header, delimiter)).join(delimiter)];

  for (const row of json) {
    const values = headers.map(header => {
      const value = row[header] ?? '';
      return escapeField(String(value), delimiter);
    });
    lines.push(values.join(delimiter));
  }

  return lines.join('\n');
}

function escapeField(field: string, delimiter: string): string {
  if (field.includes(delimiter) || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

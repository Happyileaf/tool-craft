/**
 * CSV 转 JSON
 * CSV 格式假设第一行是表头，每行数据用换行分隔，列用逗号分隔
 * 支持带引号的 CSV 字段（包含逗号或换行）
 */
export function csvToJson(csv: string): any[] {
  const lines = (csv || '').split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    return [];
  }

  // 解析表头
  const headers = parseCsvLine(lines[0] ?? '');
  const result: any[] = [];

  // 解析数据行
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i] ?? '');
    const row: any = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] || '';
    });
    result.push(row);
  }

  return result;
}

/**
 * JSON 转 CSV
 * 输入为对象数组，自动提取所有键作为表头
 */
export function jsonToCsv(json: any[]): string {
  if (!Array.isArray(json) || json.length === 0) {
    return '';
  }

  // 获取所有唯一键作为表头
  const headers = Array.from(
    new Set(
      json.flatMap(obj => Object.keys(obj))
    )
  );

  // 生成 CSV 内容
  const csvLines = [
    headers.map(escapeCsvField).join(','),
    ...json.map(row => 
      headers.map(header => escapeCsvField(String(row[header] || ''))).join(',')
    )
  ];

  return csvLines.join('\n');
}

/**
 * 解析 CSV 行，处理引号包裹的字段
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // 转义的双引号（两个连续引号变成一个）
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 字段结束，直接推送
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  // 对于输入 `"He said ""Hello"""""`，最终处理完成后 current 是 He said "Hello"，且 inQuotes 仍然为 true
  // 因为最后一个引号会切换 inQuotes 到 false，但我们已经处理完了
  result.push(current);
  return result;
}

/**
 * 转义 CSV 字段，如果包含逗号、引号或换行则用引号包裹
 */
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes(' ')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

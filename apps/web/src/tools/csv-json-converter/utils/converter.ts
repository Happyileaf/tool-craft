/**
 * 将 CSV 字符串转换为 JSON 数组
 */
export function csvToJson(csv: string): any[] {
  if (!csv.trim()) {
    return [];
  }

  const lines = csv.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    return [];
  }

  const headers = parseCSVLine(lines[0]);
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const data = parseCSVLine(lines[i]);
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = j < data.length ? data[j] : '';
    }
    result.push(obj);
  }

  return result;
}

/**
 * 将 JSON 数组转换为 CSV 字符串
 */
export function jsonToCsv(json: any[]): string {
  if (!Array.isArray(json) || json.length === 0) {
    return '';
  }

  const headers = Object.keys(json[0]);
  const lines = [headers.join(',')];

  for (const row of json) {
    const values = headers.map(header => {
      const val = row[header] ?? '';
      return escapeCsvValue(String(val));
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * 解析一行 CSV，处理引号包裹的逗号
 */
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * 转义 CSV 值，处理包含逗号或引号的值
 */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

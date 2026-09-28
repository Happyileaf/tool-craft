/**
 * CSV 转 JSON
 * @param csv CSV 文本内容
 * @param headerFirst 是否第一行为表头
 * @returns 转换后的 JSON 对象数组
 */
export function csvToJson(csv: string, headerFirst: boolean = true): any[] {
  const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const result: any[] = [];
  
  if (headerFirst) {
    const headers = parseLine(lines[0]);
    for (let i = 1; i < lines.length; i++) {
      const obj: any = {};
      const currentLine = parseLine(lines[i]);
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentLine[j] || '';
      }
      result.push(obj);
    }
  } else {
    for (let i = 0; i < lines.length; i++) {
      result.push(parseLine(lines[i]));
    }
  }

  return result;
}

/**
 * JSON 转 CSV
 * @param json JSON 对象数组（或单个对象）
 * @returns 转换后的 CSV 文本
 */
export function jsonToCsv(json: string): string {
  try {
    let data = JSON.parse(json);
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    if (data.length === 0) return '';

    // 获取所有表头
    const headers = Object.keys(data[0]);
    const lines: string[] = [formatLine(headers)];

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        return val === null || val === undefined ? '' : String(val);
      });
      lines.push(formatLine(values));
    }

    return lines.join('\n');
  } catch (e) {
    throw new Error('JSON 格式错误：' + (e as Error).message);
  }
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
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

function formatLine(fields: string[]): string {
  return fields.map(field => {
    if (field.includes('"') || field.includes(',') || field.includes('\n') || field.includes('\r')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }).join(',');
}
